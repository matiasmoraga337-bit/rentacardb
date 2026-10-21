USE [RentaCarDB];
GO
SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE [dbo].[u_sp_WebPay_ConfirmarTransaccion]
    @token_ws CHAR(64),
    @aprobada BIT = 1
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;

    DECLARE @ID_transaccion BIGINT, @ID_pago INT, @ID_reserva INT,
            @monto DECIMAL(14,2), @estado VARCHAR(20), @estado_pago VARCHAR(50),
            @estado_reserva VARCHAR(50), @expirada BIT = 0,
            @ID_usuario_cliente INT, @ID_proveedor INT,
            @moneda CHAR(3) = 'CLP', @pct DECIMAL(5,2), @comision DECIMAL(14,2);

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT @ID_transaccion = ID_transaccion_simulada,
               @ID_pago       = ID_pago_transaccion_simulada,
               @monto         = monto_transaccion_simulada,
               @estado        = estado_transaccion_simulada
        FROM PagoTransaccionSimulada WITH (UPDLOCK, HOLDLOCK)
        WHERE token_ws_transaccion_simulada = @token_ws;

        IF @ID_transaccion IS NULL THROW 52033, 'Transaccion no encontrada.', 1;
        IF @estado <> 'CREADA'     THROW 52034, 'La transaccion ya fue resuelta.', 1;

        SELECT @ID_reserva           = r.ID_reserva,
               @ID_usuario_cliente   = r.ID_usuario_cliente_reserva,
               @ID_proveedor         = v.ID_proveedor_vehiculo,
               @moneda               = ISNULL(r.moneda_reserva,'CLP'),
               @estado_reserva       = er.nombre_estado_reserva,
               @estado_pago          = ep.nombre_estado_pago,
               @expirada             = CASE WHEN r.fecha_expiracion_reserva IS NOT NULL
                                                  AND r.fecha_expiracion_reserva <= SYSDATETIME()
                                             THEN 1 ELSE 0 END
        FROM Pago p
        INNER JOIN Reserva  r WITH (UPDLOCK, HOLDLOCK) ON r.ID_reserva = p.ID_reserva_pago
        INNER JOIN Vehiculo v ON v.ID_vehiculo = r.ID_vehiculo_reserva
        INNER JOIN EstadoReserva er ON er.ID_estado_reserva = r.ID_estado_reserva_reserva
        INNER JOIN EstadoPago ep ON ep.ID_estado_pago = p.ID_estado_pago_pago
        WHERE p.ID_pago = @ID_pago;

        IF @ID_reserva IS NULL THROW 52033, 'Transaccion no encontrada.', 1;
        IF @estado_pago <> 'PENDIENTE' THROW 52036, 'El pago no esta PENDIENTE.', 1;
        IF @estado_reserva <> 'PENDIENTE' THROW 52035, 'La reserva no esta PENDIENTE.', 1;
        IF @expirada = 1 THROW 52037, 'La reserva esta expirada.', 1;

        IF EXISTS (
            SELECT 1
            FROM Pago p2
            INNER JOIN EstadoPago ep2 ON ep2.ID_estado_pago = p2.ID_estado_pago_pago
            WHERE p2.ID_reserva_pago = @ID_reserva
              AND ep2.nombre_estado_pago = 'APROBADO'
        )
            THROW 52008, 'Ya existe un pago aprobado para la reserva.', 1;

        UPDATE PagoTransaccionSimulada
        SET estado_transaccion_simulada =
                CASE WHEN @aprobada = 1 THEN 'APROBADA' ELSE 'RECHAZADA' END,
            fecha_respuesta_transaccion_simulada = SYSDATETIME()
        WHERE ID_transaccion_simulada = @ID_transaccion
          AND estado_transaccion_simulada = 'CREADA';

        IF @@ROWCOUNT = 0 THROW 52034, 'La transaccion ya fue resuelta.', 1;

        IF @aprobada = 1
        BEGIN
            UPDATE Pago
            SET ID_estado_pago_pago =
                    (SELECT ID_estado_pago FROM EstadoPago WHERE nombre_estado_pago='APROBADO'),
                fecha_confirmacion_pago = SYSDATETIME()
            WHERE ID_pago = @ID_pago
              AND ID_estado_pago_pago =
                    (SELECT ID_estado_pago FROM EstadoPago WHERE nombre_estado_pago='PENDIENTE');

            IF @@ROWCOUNT = 0 THROW 52036, 'El pago no esta PENDIENTE.', 1;

            INSERT INTO MovimientoFinanciero
                (ID_reserva_movimiento, ID_pago_movimiento, tipo_movimiento,
                 monto_movimiento, moneda_movimiento, descripcion_movimiento_financiero, ID_usuario_movimiento)
            VALUES
                (@ID_reserva, @ID_pago, 'PAGO', @monto, @moneda,
                 'Pago Webpay Simulado aprobado', @ID_usuario_cliente);

            SET @pct = dbo.fn_ComisionAplicable(@ID_proveedor, CAST(SYSDATETIME() AS DATE));
            SET @comision = CONVERT(DECIMAL(14,2), ROUND(@monto * @pct / 100.0, 2));
            IF @comision > 0
                INSERT INTO MovimientoFinanciero
                    (ID_reserva_movimiento, ID_pago_movimiento, tipo_movimiento,
                     monto_movimiento, moneda_movimiento, descripcion_movimiento_financiero, ID_usuario_movimiento)
                VALUES
                    (@ID_reserva, @ID_pago, 'COMISION_PLATAFORMA', -@comision, @moneda,
                     CONCAT('Comision plataforma ', @pct, '%'), @ID_usuario_cliente);

            UPDATE Reserva
            SET ID_estado_reserva_reserva =
                    (SELECT ID_estado_reserva FROM EstadoReserva WHERE nombre_estado_reserva='CONFIRMADA'),
                fecha_confirmacion_reserva = ISNULL(fecha_confirmacion_reserva, SYSDATETIME())
            WHERE ID_reserva = @ID_reserva
              AND ID_estado_reserva_reserva =
                    (SELECT ID_estado_reserva FROM EstadoReserva WHERE nombre_estado_reserva='PENDIENTE');

            IF @@ROWCOUNT = 0 THROW 52035, 'La reserva no esta PENDIENTE.', 1;

            INSERT INTO HistorialEstadoReserva
                (ID_reserva_historial, ID_estado_anterior_historial_estado_reserva,
                 ID_estado_nuevo_historial_estado_reserva, evento_historial_estado_reserva,
                 motivo_historial_estado_reserva, ID_usuario_historial)
            VALUES
                (@ID_reserva,
                 (SELECT ID_estado_reserva FROM EstadoReserva WHERE nombre_estado_reserva='PENDIENTE'),
                 (SELECT ID_estado_reserva FROM EstadoReserva WHERE nombre_estado_reserva='CONFIRMADA'),
                 'CONFIRMAR', N'Pago WebPay aprobado', @ID_usuario_cliente);

            INSERT INTO OutboxEvento (tipo_evento, agregado_tipo_outbox_evento, agregado_id_outbox_evento, payload_outbox_evento, estado_outbox_evento, intentos_outbox_evento)
            VALUES ('ReservaConfirmada', 'Reserva', @ID_reserva,
                    (SELECT @ID_reserva AS id_reserva, @ID_pago AS id_pago, @monto AS monto
                     FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
                    'PENDIENTE', 0);
        END
        ELSE
        BEGIN
            UPDATE Pago
            SET ID_estado_pago_pago =
                    (SELECT ID_estado_pago FROM EstadoPago WHERE nombre_estado_pago='RECHAZADO')
            WHERE ID_pago = @ID_pago
              AND ID_estado_pago_pago =
                    (SELECT ID_estado_pago FROM EstadoPago WHERE nombre_estado_pago='PENDIENTE');

            IF @@ROWCOUNT = 0 THROW 52036, 'El pago no esta PENDIENTE.', 1;
        END

        COMMIT TRANSACTION;

        SELECT @ID_transaccion AS ID_transaccion_simulada, @ID_pago AS ID_pago,
               @ID_reserva AS ID_reserva, @aprobada AS aprobada;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        DECLARE @log_err_num INT = ERROR_NUMBER();
        DECLARE @log_err_sev INT = ERROR_SEVERITY();
        DECLARE @log_err_state INT = ERROR_STATE();
        DECLARE @log_err_proc NVARCHAR(128) = ERROR_PROCEDURE();
        DECLARE @log_err_line INT = ERROR_LINE();
        DECLARE @log_err_msg NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @log_params NVARCHAR(MAX) = (SELECT @aprobada AS aprobada FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
        EXEC dbo.u_sp_RegistrarError
            @numero_error = @log_err_num, @severidad_error = @log_err_sev, @estado_error = @log_err_state,
            @procedimiento_error = @log_err_proc, @linea_error = @log_err_line, @mensaje_error = @log_err_msg,
            @nombre_sp_origen = 'u_sp_WebPay_ConfirmarTransaccion',
            @parametros_json = @log_params,
            @contexto_json = NULL,
            @origen = 'SP';
        THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[u_sp_WebPay_IniciarTransaccion]
    @ID_reserva INT,
    @monto DECIMAL(12,2),
    @buy_order VARCHAR(100) = NULL,
    @session_id VARCHAR(100) = NULL,
    @token_ws CHAR(64) OUTPUT,
    @url_redireccion VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    DECLARE @ID_pago INT, @ID_pago_existente INT, @ID_estado_pago INT,
            @estado_reserva VARCHAR(50), @token_existente CHAR(64),
            @monto_esperado DECIMAL(14,2), @monto_existente DECIMAL(14,2);

    IF @monto IS NULL OR @monto <= 0 THROW 52030, 'Monto invalido.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT @estado_reserva = er.nombre_estado_reserva,
               @monto_esperado = r.monto_total_reserva
        FROM Reserva r WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN EstadoReserva er ON er.ID_estado_reserva = r.ID_estado_reserva_reserva
        WHERE r.ID_reserva = @ID_reserva;

        IF @estado_reserva IS NULL THROW 52031, 'Reserva no existe.', 1;
        IF @estado_reserva <> 'PENDIENTE' THROW 52032, 'La reserva no esta PENDIENTE.', 1;
        IF @monto <> @monto_esperado THROW 52007, 'Monto no coincide con total reserva.', 1;

        IF EXISTS (
            SELECT 1
            FROM Pago p
            INNER JOIN EstadoPago ep ON ep.ID_estado_pago = p.ID_estado_pago_pago
            WHERE p.ID_reserva_pago = @ID_reserva
              AND ep.nombre_estado_pago = 'APROBADO'
        )
            THROW 52008, 'Ya existe un pago aprobado para la reserva.', 1;

        SELECT TOP 1 @ID_pago_existente = p.ID_pago,
                     @token_existente = t.token_ws_transaccion_simulada,
                     @monto_existente = p.monto_pago
        FROM PagoTransaccionSimulada t
        INNER JOIN Pago p ON p.ID_pago = t.ID_pago_transaccion_simulada
        INNER JOIN EstadoPago ep ON ep.ID_estado_pago = p.ID_estado_pago_pago
        WHERE p.ID_reserva_pago = @ID_reserva
          AND t.estado_transaccion_simulada = 'CREADA'
          AND ep.nombre_estado_pago = 'PENDIENTE'
        ORDER BY t.ID_transaccion_simulada DESC;

        IF @ID_pago_existente IS NOT NULL
        BEGIN
            IF @monto_existente <> @monto
                THROW 52038, 'Existe una transaccion pendiente con otro monto.', 1;

            SET @token_ws = @token_existente;
            SET @url_redireccion = CONCAT('/webpay/confirmar?token_ws=', @token_ws);
            COMMIT TRANSACTION;
            SELECT @ID_pago_existente AS ID_pago, @token_ws AS token_ws,
                   @url_redireccion AS url_redireccion;
            RETURN;
        END;

        SELECT @ID_estado_pago = ID_estado_pago FROM EstadoPago WHERE nombre_estado_pago = 'PENDIENTE';

        SET @buy_order  = ISNULL(@buy_order, CONCAT('BO-', @ID_reserva, '-', FORMAT(SYSDATETIME(),'yyyyMMddHHmmss')));
        SET @session_id = ISNULL(@session_id, CONCAT('S-', @ID_reserva, '-', NEWID()));
        SET @token_ws   = CONVERT(CHAR(64), CONVERT(VARBINARY(32), HASHBYTES('SHA2_256',
                           CONCAT(@buy_order, @session_id, SYSDATETIME()))), 2);

        INSERT INTO Pago
            (ID_reserva_pago, ID_tipo_operacion_pago_pago, ID_metodo_pago_pago,
             ID_estado_pago_pago, monto_pago, moneda_pago, proveedor_pago, referencia_externa_pago)
        VALUES (@ID_reserva,
                (SELECT ID_tipo_operacion_pago FROM TipoOperacionPago WHERE nombre_tipo_operacion_pago='RESERVA'),
                (SELECT ID_metodo_pago FROM MetodoPago WHERE nombre_metodo_pago='WEBPAY_SIMULADO'),
                @ID_estado_pago, @monto, 'CLP', 'WEBPAY_SIMULADO', @buy_order);
        SET @ID_pago = CONVERT(INT, SCOPE_IDENTITY());

        INSERT INTO PagoTransaccionSimulada
            (ID_pago_transaccion_simulada, buy_order_transaccion_simulada,
             session_id_transaccion_simulada, token_ws_transaccion_simulada,
             monto_transaccion_simulada, estado_transaccion_simulada)
        VALUES (@ID_pago, @buy_order, @session_id, @token_ws, @monto, 'CREADA');

        COMMIT TRANSACTION;
        SET @url_redireccion = CONCAT('/webpay/confirmar?token_ws=', @token_ws);
        SELECT @ID_pago AS ID_pago, @token_ws AS token_ws, @url_redireccion AS url_redireccion;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        DECLARE @log_err_num INT = ERROR_NUMBER();
        DECLARE @log_err_sev INT = ERROR_SEVERITY();
        DECLARE @log_err_state INT = ERROR_STATE();
        DECLARE @log_err_proc NVARCHAR(128) = ERROR_PROCEDURE();
        DECLARE @log_err_line INT = ERROR_LINE();
        DECLARE @log_err_msg NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @log_params NVARCHAR(MAX) = (SELECT @ID_reserva AS ID_reserva, @monto AS monto, @buy_order AS buy_order, @session_id AS session_id, @url_redireccion AS url_redireccion FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
        EXEC dbo.u_sp_RegistrarError
            @numero_error = @log_err_num, @severidad_error = @log_err_sev, @estado_error = @log_err_state,
            @procedimiento_error = @log_err_proc, @linea_error = @log_err_line, @mensaje_error = @log_err_msg,
            @nombre_sp_origen = 'u_sp_WebPay_IniciarTransaccion',
            @parametros_json = @log_params,
            @contexto_json = NULL,
            @origen = 'SP';
        THROW;
    END CATCH;
END;
GO
