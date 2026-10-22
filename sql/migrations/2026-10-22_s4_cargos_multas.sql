USE [RentaCarDB];
GO
SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

/* S4: cargos extra y multas sobre arriendos FINALIZADOS.
   Idempotente: recrea el CHECK y los SPs afectados. */

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_movimiento_tipo')
    ALTER TABLE dbo.MovimientoFinanciero DROP CONSTRAINT CK_movimiento_tipo;
GO
ALTER TABLE dbo.MovimientoFinanciero WITH CHECK ADD CONSTRAINT CK_movimiento_tipo
    CHECK (tipo_movimiento IN ('CARGO_RESERVA','PAGO','REEMBOLSO','COMISION_PLATAFORMA','CARGO_KM','CARGO_DANO','CARGO_EXTRA','MULTA','DEPOSITO','LIBERACION_DEPOSITO','AJUSTE','DESCUENTO'));
GO
ALTER TABLE dbo.MovimientoFinanciero CHECK CONSTRAINT CK_movimiento_tipo;
GO
CREATE OR ALTER PROCEDURE [dbo].[u_sp_CrearCargoExtra]
    @ID_arriendo INT, @concepto NVARCHAR(200), @monto DECIMAL(12,2),
    @observaciones NVARCHAR(500) = NULL, @ID_usuario_operador INT = NULL,
    @nombre_tipo_cargo VARCHAR(30) = 'OTRO'
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    DECLARE @ID_tipo_cargo_extra INT, @nombre_estado_arriendo VARCHAR(50),
            @ID_reserva INT, @moneda CHAR(3) = 'CLP', @ID_cargo_extra INT;

    IF @monto <= 0 THROW 53020, 'Monto > 0.', 1;

    SELECT @ID_reserva = a.ID_reserva_arriendo,
           @nombre_estado_arriendo = ea.nombre_estado_arriendo,
           @moneda = ISNULL(r.moneda_reserva, 'CLP')
    FROM Arriendo a
    INNER JOIN Reserva r ON r.ID_reserva = a.ID_reserva_arriendo
    INNER JOIN EstadoArriendo ea ON ea.ID_estado_arriendo = a.ID_estado_arriendo_arriendo
    WHERE a.ID_arriendo = @ID_arriendo;

    IF @ID_reserva IS NULL THROW 53021, 'Arriendo no existe.', 1;
    IF @nombre_estado_arriendo <> 'FINALIZADO'
        THROW 53022, 'Solo se registran cargos en un arriendo FINALIZADO.', 1;

    IF @ID_usuario_operador IS NOT NULL
        EXEC sys.sp_set_session_context @key=N'usuario_id', @value=@ID_usuario_operador, @read_only=0;

    SELECT @ID_tipo_cargo_extra = ID_tipo_cargo_extra FROM TipoCargoExtra
    WHERE nombre_tipo_cargo_extra = @nombre_tipo_cargo AND activo_tipo_cargo_extra = 1;
    IF @ID_tipo_cargo_extra IS NULL
        SELECT @ID_tipo_cargo_extra = ID_tipo_cargo_extra FROM TipoCargoExtra
        WHERE nombre_tipo_cargo_extra = 'OTRO';

    BEGIN TRY
        BEGIN TRANSACTION;

        INSERT INTO CargoExtra
            (ID_arriendo_cargo_extra, ID_estado_cargo_extra_cargo_extra,
             ID_tipo_cargo_extra_cargo_extra, concepto_cargo_extra, monto_cargo_extra, observaciones_cargo_extra)
        VALUES (@ID_arriendo,
                (SELECT ID_estado_cargo_extra FROM EstadoCargoExtra WHERE nombre_estado_cargo_extra = 'PENDIENTE'),
                @ID_tipo_cargo_extra, @concepto, @monto, @observaciones);
        SET @ID_cargo_extra = CONVERT(INT, SCOPE_IDENTITY());

        INSERT INTO MovimientoFinanciero
            (ID_reserva_movimiento, tipo_movimiento, monto_movimiento,
             moneda_movimiento, descripcion_movimiento_financiero, ID_usuario_movimiento)
        VALUES (@ID_reserva, 'CARGO_EXTRA', @monto, @moneda, @concepto, @ID_usuario_operador);

        COMMIT TRANSACTION;
        SELECT * FROM CargoExtra WHERE ID_cargo_extra = @ID_cargo_extra;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO
CREATE OR ALTER PROCEDURE [dbo].[u_sp_RegistrarMulta]
    @ID_arriendo INT, @fecha_multa DATE, @descripcion NVARCHAR(500), @monto DECIMAL(12,2),
    @organismo NVARCHAR(150) = NULL, @numero_parte VARCHAR(50) = NULL,
    @ID_usuario_registro INT = NULL
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    DECLARE @ID_reserva INT, @moneda CHAR(3) = 'CLP', @ID_multa INT;

    IF @monto <= 0 THROW 60040, 'Monto debe ser > 0.', 1;
    IF NOT EXISTS (
        SELECT 1
        FROM Arriendo a
        INNER JOIN EstadoArriendo ea ON ea.ID_estado_arriendo = a.ID_estado_arriendo_arriendo
        WHERE a.ID_arriendo = @ID_arriendo AND ea.nombre_estado_arriendo = 'FINALIZADO'
    ) THROW 60041, 'Arriendo no existe o no finalizado.', 1;
    IF @ID_usuario_registro IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM Usuario WHERE ID_usuario = @ID_usuario_registro)
        THROW 60042, 'Usuario no existe.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT @ID_reserva = a.ID_reserva_arriendo, @moneda = ISNULL(r.moneda_reserva,'CLP')
        FROM Arriendo a
        INNER JOIN Reserva r ON r.ID_reserva = a.ID_reserva_arriendo
        WHERE a.ID_arriendo = @ID_arriendo;

        INSERT INTO Multa
            (ID_arriendo_multa, ID_estado_multa_multa, fecha_multa, descripcion_multa,
             organismo_multa, numero_parte_multa, monto_multa, ID_usuario_registro_multa)
        VALUES (@ID_arriendo,
                (SELECT ID_estado_multa FROM EstadoMulta WHERE nombre_estado_multa = 'PENDIENTE'),
                @fecha_multa, @descripcion, @organismo, @numero_parte, @monto, @ID_usuario_registro);
        SET @ID_multa = CONVERT(INT, SCOPE_IDENTITY());

        /* FIX: movimiento MULTA (antes ausente) */
        INSERT INTO MovimientoFinanciero
            (ID_reserva_movimiento, tipo_movimiento, monto_movimiento,
             moneda_movimiento, descripcion_movimiento_financiero, ID_usuario_movimiento)
        VALUES (@ID_reserva, 'MULTA', @monto, @moneda,
                CONCAT(N'Multa ', ISNULL(@numero_parte,'')), @ID_usuario_registro);

        COMMIT TRANSACTION;
        SELECT * FROM Multa WHERE ID_multa = @ID_multa;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO
CREATE OR ALTER PROCEDURE [dbo].[u_sp_GenerarLiquidacion]
    @ID_proveedor INT, @periodo_inicio DATE, @periodo_fin DATE, @ID_usuario INT = NULL
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    IF @periodo_fin < @periodo_inicio THROW 70500, 'Periodo inválido.', 1;

    DECLARE @key VARCHAR(100) = CONCAT('LIQ-', @ID_proveedor, '-',
        CONVERT(char(10),@periodo_inicio,23), '-', CONVERT(char(10),@periodo_fin,23));

    BEGIN TRY
        BEGIN TRANSACTION;

        IF EXISTS (SELECT 1 FROM LiquidacionProveedor WITH (UPDLOCK,HOLDLOCK)
                   WHERE idempotency_key_liquidacion = @key)
        BEGIN
            COMMIT TRANSACTION;
            SELECT * FROM LiquidacionProveedor WHERE idempotency_key_liquidacion = @key;
            RETURN;
        END;

        IF EXISTS (SELECT 1 FROM LiquidacionProveedor WITH (UPDLOCK,HOLDLOCK)
                   WHERE ID_proveedor_liquidacion = @ID_proveedor
                     AND estado_liquidacion <> 'ANULADA'
                     AND @periodo_inicio <= periodo_fin_liquidacion_proveedor AND @periodo_fin >= periodo_inicio_liquidacion_proveedor
                     AND idempotency_key_liquidacion <> @key)
            THROW 70504, 'Ya existe liquidación para periodo solapado.', 1;

        IF NOT EXISTS (SELECT 1 FROM Proveedor WHERE ID_proveedor = @ID_proveedor)
            THROW 70501, 'Proveedor no existe.', 1;

        DECLARE @moneda CHAR(3) = ISNULL((SELECT moneda_operacion_configuracion_proveedor FROM ConfiguracionProveedor
                                          WHERE ID_proveedor_configuracion_proveedor = @ID_proveedor),'CLP');
        DECLARE @bruto DECIMAL(14,2)=0, @comision DECIMAL(14,2)=0,
                @reembolsos DECIMAL(14,2)=0, @ajustes DECIMAL(14,2)=0, @neto DECIMAL(14,2)=0;

        SELECT @bruto = ISNULL(SUM(CASE WHEN m.tipo_movimiento IN ('CARGO_RESERVA','CARGO_KM','CARGO_DANO','CARGO_EXTRA','MULTA')
                                        THEN m.monto_movimiento ELSE 0 END),0),
               @comision = ISNULL(SUM(CASE WHEN m.tipo_movimiento='COMISION_PLATAFORMA'
                                           THEN ABS(m.monto_movimiento) ELSE 0 END),0),
               @reembolsos = ISNULL(SUM(CASE WHEN m.tipo_movimiento='REEMBOLSO'
                                             THEN ABS(m.monto_movimiento) ELSE 0 END),0),
               @ajustes = ISNULL(SUM(CASE WHEN m.tipo_movimiento='AJUSTE'
                                          THEN m.monto_movimiento ELSE 0 END),0)
        FROM MovimientoFinanciero m
        INNER JOIN Reserva r ON r.ID_reserva = m.ID_reserva_movimiento
        INNER JOIN Vehiculo v ON v.ID_vehiculo = r.ID_vehiculo_reserva
        WHERE v.ID_proveedor_vehiculo = @ID_proveedor
          AND m.moneda_movimiento = @moneda
          AND CAST(m.fecha_movimiento AS DATE) BETWEEN @periodo_inicio AND @periodo_fin;

        SET @neto = @bruto - @comision - @reembolsos + @ajustes;

        INSERT INTO LiquidacionProveedor
            (ID_proveedor_liquidacion, periodo_inicio_liquidacion_proveedor, periodo_fin_liquidacion_proveedor, moneda_liquidacion,
             total_bruto_liquidacion_proveedor, total_comision_liquidacion_proveedor, total_reembolsos_liquidacion_proveedor, total_ajustes_liquidacion_proveedor, total_neto_liquidacion_proveedor,
             estado_liquidacion, idempotency_key_liquidacion, ID_usuario_liquidacion)
        VALUES (@ID_proveedor, @periodo_inicio, @periodo_fin, @moneda,
                @bruto, @comision, @reembolsos, @ajustes, @neto,
                'CALCULADA', @key, @ID_usuario);

        COMMIT TRANSACTION;
        SELECT * FROM LiquidacionProveedor WHERE idempotency_key_liquidacion = @key;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        DECLARE @log_err_num INT = ERROR_NUMBER();
        DECLARE @log_err_sev INT = ERROR_SEVERITY();
        DECLARE @log_err_state INT = ERROR_STATE();
        DECLARE @log_err_proc NVARCHAR(128) = ERROR_PROCEDURE();
        DECLARE @log_err_line INT = ERROR_LINE();
        DECLARE @log_err_msg NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @log_params NVARCHAR(MAX) = (SELECT @ID_proveedor AS ID_proveedor FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
        EXEC dbo.u_sp_RegistrarError
            @numero_error = @log_err_num, @severidad_error = @log_err_sev, @estado_error = @log_err_state,
            @procedimiento_error = @log_err_proc, @linea_error = @log_err_line, @mensaje_error = @log_err_msg,
            @nombre_sp_origen = 'u_sp_GenerarLiquidacion',
            @parametros_json = @log_params,
            @contexto_json = NULL,
            @origen = 'SP';
        THROW;
    END CATCH;
END;
GO