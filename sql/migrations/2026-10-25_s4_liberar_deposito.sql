USE [RentaCarDB];
GO
SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE [dbo].[u_sp_CancelarReserva]
    @ID_reserva         INT,
    @ID_usuario         INT,
    @motivo             NVARCHAR(500) = N'Cancelación por el cliente',
    @monto_reembolso    DECIMAL(14,2) = NULL,
    @motivo_reembolso   NVARCHAR(500) = NULL,
    @idempotency_key    VARCHAR(100) = NULL,
    @referencia_externa VARCHAR(150) = NULL,
    @fue_idempotente    BIT = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @fue_idempotente = 0;

    DECLARE @ID_reembolso BIGINT = NULL;
    DECLARE @transaccion_abierta BIT = 0;
    DECLARE @owner INT;
    DECLARE @nombre_estado_actual VARCHAR(50);

    EXEC sys.sp_set_session_context @key=N'usuario_id', @value=NULL, @read_only=0;
    EXEC sys.sp_set_session_context @key=N'correlation_id', @value=NULL, @read_only=0;
    EXEC sys.sp_set_session_context @key=N'motivo', @value=NULL, @read_only=0;
    EXEC sys.sp_set_session_context @key=N'usuario_id', @value=@ID_usuario, @read_only=0;

    BEGIN TRY
        BEGIN TRANSACTION;
        SET @transaccion_abierta = 1;

        /* Bloqueo inicial: toda la operación de cancelación se serializa por reserva. */
        SELECT
            @owner = r.ID_usuario_cliente_reserva,
            @nombre_estado_actual = er.nombre_estado_reserva
        FROM dbo.Reserva r WITH (UPDLOCK,HOLDLOCK)
        INNER JOIN dbo.EstadoReserva er
            ON er.ID_estado_reserva = r.ID_estado_reserva_reserva
        WHERE r.ID_reserva = @ID_reserva;

        IF @owner IS NULL
            THROW 70601, 'La reserva no existe.', 1;

        IF @ID_usuario IS NULL
            THROW 70604, 'Se requiere ID_usuario para cancelar la reserva.', 1;

        IF @owner <> @ID_usuario
            THROW 70305, 'El usuario no es propietario de la reserva.', 1;

        /* Un monto informado debe ser estrictamente positivo. */
        IF @monto_reembolso IS NOT NULL AND @monto_reembolso <= 0
            THROW 70602, 'El monto del reembolso debe ser mayor que cero.', 1;

        /*
           Idempotencia de la operación completa:
             - Si ya está CANCELADA y no se solicita reembolso, el retry es seguro.
             - Si ya está CANCELADA con reembolso solicitado, solo aceptamos retry si
               la misma idempotency_key identifica el reembolso de esta reserva.
        */
        IF @nombre_estado_actual = 'CANCELADA'
        BEGIN
            IF @monto_reembolso IS NULL
            BEGIN
                SET @fue_idempotente = 1;
                COMMIT TRANSACTION;
                SET @transaccion_abierta = 0;
                SELECT * FROM vw_ReservasDetalle WHERE ID_reserva = @ID_reserva;
                RETURN;
            END;

            IF @idempotency_key IS NULL OR LEN(LTRIM(RTRIM(@idempotency_key))) = 0
                THROW 70600, 'Se requiere idempotency_key cuando hay reembolso.', 1;

            DECLARE @monto_reembolso_existente DECIMAL(14,2);

            SELECT
                @ID_reembolso = ID_reembolso,
                @monto_reembolso_existente = monto_reembolso
            FROM dbo.Reembolso WITH (UPDLOCK,HOLDLOCK)
            WHERE ID_reserva_reembolso = @ID_reserva
              AND idempotency_key_reembolso = @idempotency_key;

            IF @ID_reembolso IS NULL
                THROW 70603, 'La reserva ya está cancelada; la solicitud de reembolso no coincide con una operación previa.', 1;

            IF @monto_reembolso_existente <> @monto_reembolso
                THROW 70308, 'La idempotency_key ya fue utilizada con un monto diferente.', 1;

            DECLARE @estado_reembolso_retry VARCHAR(30);
            SELECT @estado_reembolso_retry = estado_reembolso
            FROM dbo.Reembolso WITH (UPDLOCK,HOLDLOCK)
            WHERE ID_reembolso = @ID_reembolso;

            /* Si el retry encuentra un reembolso pendiente/procesando, debe completar
               la operación financiera antes de declarar el retry como exitoso.
               El SP interno conserva el orden Reserva -> Reembolso. */
            IF @estado_reembolso_retry IN ('PENDIENTE','PROCESANDO')
            BEGIN
                EXEC dbo.u_sp_MarcarReembolsoCompletado
                    @ID_reembolso          = @ID_reembolso,
                    @referencia_externa    = @referencia_externa,
                    @ID_usuario            = @ID_usuario,
                    @gestionar_transaccion = 0;
            END
            ELSE IF @estado_reembolso_retry NOT IN ('COMPLETADO')
                THROW 70304, 'El reembolso asociado al retry no puede completarse desde su estado actual.', 1;

            SET @fue_idempotente = 1;
            COMMIT TRANSACTION;
            SET @transaccion_abierta = 0;
            SELECT * FROM vw_ReservasDetalle WHERE ID_reserva = @ID_reserva;
            RETURN;
        END;

        /* Validaciones de entrada para reembolso */
        IF @monto_reembolso IS NOT NULL
        BEGIN
            IF @idempotency_key IS NULL OR LEN(LTRIM(RTRIM(@idempotency_key))) = 0
                THROW 70600, 'Se requiere idempotency_key cuando hay reembolso.', 1;

            IF @motivo_reembolso IS NULL
                SET @motivo_reembolso = @motivo;

            EXEC dbo.u_sp_CrearReembolso
                @ID_reserva            = @ID_reserva,
                @monto                 = @monto_reembolso,
                @motivo                = @motivo_reembolso,
                @idempotency_key       = @idempotency_key,
                @ID_usuario            = @ID_usuario,
                @gestionar_transaccion = 0,
                @ID_reembolso_creado   = @ID_reembolso OUTPUT;

            IF @ID_reembolso IS NOT NULL
            BEGIN
                EXEC dbo.u_sp_MarcarReembolsoCompletado
                    @ID_reembolso          = @ID_reembolso,
                    @referencia_externa    = @referencia_externa,
                    @ID_usuario            = @ID_usuario,
                    @gestionar_transaccion = 0;
            END;
        END;

        /* Cambiar estado_outbox_evento de la reserva a CANCELADA */
        EXEC dbo.u_sp_CambiarEstadoReserva
            @ID_reserva            = @ID_reserva,
            @nuevo_estado          = 'CANCELADA',
            @evento                = 'CANCELAR',
            @ID_usuario            = @ID_usuario,
            @motivo                = @motivo,
            @gestionar_transaccion = 0;

        IF EXISTS (
            SELECT 1
            FROM (
                SELECT SUM(CASE
                    WHEN mf.tipo_movimiento = 'DEPOSITO' THEN mf.monto_movimiento
                    WHEN mf.tipo_movimiento = 'LIBERACION_DEPOSITO' THEN mf.monto_movimiento
                    ELSE 0
                END) AS saldo
                FROM dbo.MovimientoFinanciero mf
                WHERE mf.ID_reserva_movimiento = @ID_reserva
                  AND mf.tipo_movimiento IN ('DEPOSITO','LIBERACION_DEPOSITO')
            ) deposito
            WHERE deposito.saldo > 0
        )
        BEGIN
            EXEC dbo.u_sp_LiberarDeposito
                @ID_reserva = @ID_reserva,
                @ID_usuario = @ID_usuario,
                @motivo = N'Liberacion de deposito por cancelacion de reserva';
        END;

        COMMIT TRANSACTION;
        SET @transaccion_abierta = 0;

        SELECT * FROM vw_ReservasDetalle WHERE ID_reserva = @ID_reserva;
    END TRY
    BEGIN CATCH
        IF @transaccion_abierta = 1 AND XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        DECLARE @log_err_num INT = ERROR_NUMBER();
        DECLARE @log_err_sev INT = ERROR_SEVERITY();
        DECLARE @log_err_state INT = ERROR_STATE();
        DECLARE @log_err_proc NVARCHAR(128) = ERROR_PROCEDURE();
        DECLARE @log_err_line INT = ERROR_LINE();
        DECLARE @log_err_msg NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @log_params NVARCHAR(MAX) = (SELECT @ID_reserva AS ID_reserva, @ID_usuario AS ID_usuario, @motivo AS motivo, @monto_reembolso AS monto_reembolso, @motivo_reembolso AS motivo_reembolso, @idempotency_key AS idempotency_key, @referencia_externa AS referencia_externa, @fue_idempotente AS fue_idempotente FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
        EXEC dbo.u_sp_RegistrarError
            @numero_error = @log_err_num, @severidad_error = @log_err_sev, @estado_error = @log_err_state,
            @procedimiento_error = @log_err_proc, @linea_error = @log_err_line, @mensaje_error = @log_err_msg,
            @nombre_sp_origen = 'u_sp_CancelarReserva',
            @parametros_json = @log_params,
            @contexto_json = NULL,
            @origen = 'SP';
        THROW;
    END CATCH;
END;

GO
