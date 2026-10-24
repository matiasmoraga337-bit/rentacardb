USE [RentaCarDB];
GO
SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE [dbo].[u_sp_PublicarEvento]
    @tipo_evento VARCHAR(100),
    @agregado_tipo VARCHAR(50),
    @agregado_id BIGINT,
    @payload NVARCHAR(MAX),
    @devolver_evento BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    IF ISJSON(@payload) <> 1
        THROW 70110, 'El payload del evento debe ser JSON válido.', 1;
    INSERT INTO OutboxEvento (tipo_evento, agregado_tipo_outbox_evento, agregado_id_outbox_evento, payload_outbox_evento)
    VALUES (@tipo_evento, @agregado_tipo, @agregado_id, @payload);
    IF @devolver_evento = 1
        SELECT * FROM OutboxEvento WHERE ID_evento = SCOPE_IDENTITY();
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[u_sp_CrearReserva]
    @ID_usuario_cliente INT,
    @ID_vehiculo INT,
    @ID_sede_retiro INT,
    @ID_sede_devolucion INT,
    @fecha_inicio DATE,
    @fecha_fin DATE,
    @porcentaje_impuesto DECIMAL(5,2) = NULL,
    @observaciones NVARCHAR(500) = NULL,
    @ID_politica_cancelacion INT = NULL,
    @politica_combustible VARCHAR(30) = 'MISMO_NIVEL',
    @km_incluidos_dia INT = NULL,
    @cargo_km_excedido DECIMAL(12,2) = NULL,
    @idempotency_key VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;

    DECLARE @ID_proveedor INT, @precio DECIMAL(14,2), @estado_reserva INT,
            @ID_reserva INT, @estado_publicacion VARCHAR(50), @estado_proveedor VARCHAR(50),
            @dias INT, @subtotal DECIMAL(14,2), @impuesto DECIMAL(14,2), @total DECIMAL(14,2),
            @minutos_exp INT = NULL, @correlation_id UNIQUEIDENTIFIER = NEWID(),
            @moneda CHAR(3) = 'CLP', @edad_minima INT = NULL,
            @requiere_deposito BIT = 0, @monto_deposito DECIMAL(14,2) = 0,
            @monto_deposito_aplicado DECIMAL(14,2) = 0;

    /* IVA por defecto desde ConfiguracionGlobal (fallback 19.00) */
    IF @porcentaje_impuesto IS NULL
        SELECT @porcentaje_impuesto = ISNULL(iva_porcentaje_configuracion_global, 19.00)
        FROM dbo.ConfiguracionGlobal WHERE ID_configuracion = 1;
    IF @porcentaje_impuesto IS NULL SET @porcentaje_impuesto = 19.00;

    EXEC sys.sp_set_session_context @key=N'usuario_id', @value=NULL, @read_only=0;
    EXEC sys.sp_set_session_context @key=N'usuario_id', @value=@ID_usuario_cliente, @read_only=0;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @idempotency_key IS NOT NULL
        BEGIN
            SELECT @ID_reserva = ID_reserva FROM Reserva WITH (UPDLOCK, HOLDLOCK)
            WHERE idempotency_key_reserva = @idempotency_key;

            IF @ID_reserva IS NOT NULL
            BEGIN
                IF EXISTS (SELECT 1 FROM Reserva WHERE ID_reserva = @ID_reserva
                           AND ID_usuario_cliente_reserva <> @ID_usuario_cliente)
                    THROW 70226, 'La idempotency_key pertenece a otro cliente.', 1;

                COMMIT TRANSACTION;
                SELECT * FROM vw_ReservasDetalle WHERE ID_reserva = @ID_reserva;
                RETURN;
            END;
        END;

        IF @fecha_fin <= @fecha_inicio THROW 70200, 'La fecha de devolucion debe ser posterior al retiro.', 1;
        IF @fecha_inicio < CAST(GETDATE() AS DATE) THROW 70201, 'Fecha inicio no puede ser anterior a hoy.', 1;
        IF @porcentaje_impuesto NOT BETWEEN 0 AND 100 THROW 70202, 'Porcentaje de impuesto invalido.', 1;
        IF @politica_combustible NOT IN ('LLENO_LLENO','MISMO_NIVEL','LIBRE')
            THROW 70203, 'Politica de combustible invalida.', 1;

        IF NOT EXISTS (SELECT 1 FROM Cliente WHERE ID_usuario_cliente = @ID_usuario_cliente AND activo_cliente = 1)
            THROW 70204, 'El cliente no existe o esta inactivo.', 1;

        SELECT @ID_proveedor = v.ID_proveedor_vehiculo,
               @estado_publicacion = ep.nombre_estado_publicacion_vehiculo,
               @estado_proveedor = es.nombre_estado_proveedor
        FROM Vehiculo v WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN EstadoPublicacionVehiculo ep ON ep.ID_estado_publicacion_vehiculo = v.ID_estado_publicacion_vehiculo_vehiculo
        INNER JOIN Proveedor p ON p.ID_proveedor = v.ID_proveedor_vehiculo
        INNER JOIN EstadoProveedor es ON es.ID_estado_proveedor = p.ID_estado_proveedor_proveedor
        WHERE v.ID_vehiculo = @ID_vehiculo
          AND v.fecha_baja_vehiculo IS NULL AND p.fecha_baja_proveedor IS NULL;

        IF @ID_proveedor IS NULL THROW 70205, 'Vehiculo o proveedor dado de baja.', 1;
        IF @estado_publicacion <> 'PUBLICADO' THROW 70206, 'El vehiculo no esta publicado.', 1;
        IF @estado_proveedor <> 'APROBADO' THROW 70207, 'El proveedor no esta aprobado.', 1;

        IF NOT EXISTS (SELECT 1 FROM SedeProveedor WHERE ID_sede_proveedor = @ID_sede_retiro)
           OR NOT EXISTS (SELECT 1 FROM SedeProveedor WHERE ID_sede_proveedor = @ID_sede_devolucion)
            THROW 70224, 'Una o ambas sedes no existen.', 1;

        IF EXISTS (SELECT 1 FROM SedeProveedor
                   WHERE ID_sede_proveedor IN (@ID_sede_retiro, @ID_sede_devolucion)
                     AND ID_proveedor_sede_proveedor <> @ID_proveedor)
            THROW 70222, 'Las sedes no pertenecen al proveedor.', 1;

        IF NOT EXISTS (
            SELECT 1 FROM VehiculoSede vs
            WHERE vs.ID_vehiculo_vehiculo_sede = @ID_vehiculo
              AND vs.ID_sede_proveedor_vehiculo_sede = @ID_sede_retiro
              AND vs.disponible_para_entrega_vehiculo_sede = 1)
            THROW 70217, 'La sede de retiro no esta habilitada.', 1;

        IF NOT EXISTS (
            SELECT 1 FROM VehiculoSede vs
            WHERE vs.ID_vehiculo_vehiculo_sede = @ID_vehiculo
              AND vs.ID_sede_proveedor_vehiculo_sede = @ID_sede_devolucion
              AND vs.disponible_para_devolucion_vehiculo_sede = 1)
            THROW 70218, 'La sede de devolucion no esta habilitada.', 1;

        IF @ID_sede_retiro <> @ID_sede_devolucion
           AND NOT EXISTS (SELECT 1 FROM ConfiguracionProveedor
                           WHERE ID_proveedor_configuracion_proveedor = @ID_proveedor
                             AND permite_devolucion_otra_sede_configuracion_proveedor = 1)
            THROW 70219, 'El proveedor no permite devolucion en otra sede.', 1;

        IF EXISTS (SELECT 1 FROM Vehiculo v
                   INNER JOIN EstadoVehiculo ev ON ev.ID_estado_vehiculo = v.ID_estado_vehiculo_vehiculo
                   WHERE v.ID_vehiculo = @ID_vehiculo AND ev.nombre_estado_vehiculo = 'FUERA_DE_SERVICIO')
            THROW 70208, 'El vehiculo esta fuera de servicio.', 1;

        IF EXISTS (SELECT 1 FROM Reserva r WITH (UPDLOCK, HOLDLOCK)
                   INNER JOIN EstadoReserva er ON er.ID_estado_reserva = r.ID_estado_reserva_reserva
                   WHERE r.ID_vehiculo_reserva = @ID_vehiculo
                     AND er.nombre_estado_reserva IN ('PENDIENTE','CONFIRMADA','EN_CURSO')
                     AND @fecha_inicio < r.fecha_fin_reserva
                     AND @fecha_fin > r.fecha_inicio_reserva)
            THROW 70209, 'El vehiculo ya esta reservado en esas fechas.', 1;

        IF EXISTS (SELECT 1 FROM BloqueoVehiculo b WITH (UPDLOCK, HOLDLOCK)
                   WHERE b.ID_vehiculo_bloqueo = @ID_vehiculo AND b.activo_bloqueo = 1
                     AND CAST(@fecha_inicio AS DATETIME2) < b.fecha_fin_bloqueo
                     AND CAST(@fecha_fin AS DATETIME2) > b.fecha_inicio_bloqueo)
            THROW 70210, 'El vehiculo posee un bloqueo para esas fechas.', 1;

        IF EXISTS (SELECT 1 FROM Mantenimiento m WITH (UPDLOCK, HOLDLOCK)
                   WHERE m.ID_vehiculo_mantenimiento = @ID_vehiculo AND m.activo_mantenimiento = 1
                     AND (m.fecha_fin_mantenimiento IS NULL OR m.fecha_fin_mantenimiento > CAST(@fecha_inicio AS DATETIME2))
                     AND m.fecha_inicio_mantenimiento < CAST(@fecha_fin AS DATETIME2))
            THROW 70211, 'El vehiculo tiene mantenimiento en esas fechas.', 1;

        IF EXISTS (SELECT 1 FROM TipoDocumentoVehiculo td
                   WHERE td.obligatorio_tipo_documento = 1 AND td.activo_tipo_documento = 1
                     AND NOT EXISTS (SELECT 1 FROM DocumentoVehiculo dv
                                     WHERE dv.ID_vehiculo_documento_vehiculo = @ID_vehiculo
                                       AND dv.ID_tipo_documento_vehiculo_documento_vehiculo = td.ID_tipo_documento_vehiculo
                                       AND dv.activo_documento = 1 AND dv.verificado_documento = 1
                                       AND dv.fecha_vencimiento_documento >= @fecha_fin))
            THROW 70212, 'El vehiculo no tiene documentos legales vigentes.', 1;

        IF @ID_politica_cancelacion IS NULL
            SELECT TOP 1 @ID_politica_cancelacion = ID_politica_cancelacion
            FROM PoliticaCancelacion
            WHERE nombre_politica_cancelacion = 'FLEXIBLE' AND activa_politica_cancelacion = 1;

        IF @ID_politica_cancelacion IS NULL
            THROW 70213, 'No existe politica de cancelacion activa.', 1;

        IF NOT EXISTS (SELECT 1 FROM PoliticaCancelacion
                       WHERE ID_politica_cancelacion = @ID_politica_cancelacion
                         AND activa_politica_cancelacion = 1)
            THROW 70214, 'Politica de cancelacion invalida.', 1;

        SET @dias = DATEDIFF(DAY, @fecha_inicio, @fecha_fin);

        IF EXISTS (SELECT 1 FROM ConfiguracionProveedor
                   WHERE ID_proveedor_configuracion_proveedor = @ID_proveedor
                     AND dias_minimos_arriendo_configuracion_proveedor IS NOT NULL AND @dias < dias_minimos_arriendo_configuracion_proveedor)
            THROW 70220, 'Duracion menor al minimo del proveedor.', 1;

        IF EXISTS (SELECT 1 FROM ConfiguracionProveedor
                   WHERE ID_proveedor_configuracion_proveedor = @ID_proveedor
                     AND dias_maximos_arriendo_configuracion_proveedor IS NOT NULL AND @dias > dias_maximos_arriendo_configuracion_proveedor)
            THROW 70221, 'Duracion mayor al maximo del proveedor.', 1;

        SELECT @minutos_exp = minutos_expiracion_reserva_configuracion_proveedor,
               @moneda = ISNULL(moneda_operacion_configuracion_proveedor,'CLP'),
               @edad_minima = edad_minima_arriendo_configuracion_proveedor,
               @requiere_deposito = ISNULL(requiere_deposito_configuracion_proveedor,0),
               @monto_deposito = ISNULL(monto_deposito_configuracion_proveedor,0)
        FROM ConfiguracionProveedor
        WHERE ID_proveedor_configuracion_proveedor = @ID_proveedor;

        IF @minutos_exp IS NULL
            SELECT @minutos_exp = minutos_expiracion_reserva_configuracion_global
            FROM dbo.ConfiguracionGlobal WHERE ID_configuracion = 1;
        IF @minutos_exp IS NULL SET @minutos_exp = 30;

        IF @edad_minima IS NOT NULL AND EXISTS (
            SELECT 1 FROM Cliente cl
            INNER JOIN Usuario u ON u.ID_usuario = cl.ID_usuario_cliente
            INNER JOIN Persona p ON p.ID_persona = u.ID_persona_usuario
            WHERE cl.ID_usuario_cliente = @ID_usuario_cliente
              AND p.fecha_nacimiento_persona IS NOT NULL
              AND DATEADD(YEAR, @edad_minima, p.fecha_nacimiento_persona) > CAST(GETDATE() AS DATE))
            THROW 70223, 'El cliente no cumple la edad minima.', 1;

        IF @requiere_deposito = 1 AND @monto_deposito <= 0
            THROW 70225, 'La configuracion del deposito no es valida.', 1;

        IF @requiere_deposito = 1 SET @monto_deposito_aplicado = @monto_deposito;

        SET @precio = dbo.fn_PrecioAplicable(@ID_vehiculo, @fecha_inicio, @fecha_fin);
        IF @precio IS NULL OR @precio <= 0
            THROW 70215, 'No existe un precio valido para el vehiculo.', 1;

        SET @subtotal = CONVERT(DECIMAL(14,2), ROUND(@dias * @precio, 2));
        SET @impuesto = CONVERT(DECIMAL(14,2), ROUND((@dias * @precio) * @porcentaje_impuesto / 100.0, 2));
        SET @total = @subtotal + @impuesto + @monto_deposito_aplicado;

        SELECT @estado_reserva = ID_estado_reserva FROM EstadoReserva WHERE nombre_estado_reserva = 'PENDIENTE';
        IF @estado_reserva IS NULL THROW 70216, 'No existe el estado PENDIENTE.', 1;

        INSERT INTO Reserva
            (ID_usuario_cliente_reserva, ID_vehiculo_reserva,
             ID_sede_retiro_reserva, ID_sede_devolucion_reserva,
             ID_estado_reserva_reserva, fecha_inicio_reserva, fecha_fin_reserva,
             precio_diario_aplicado_reserva, porcentaje_impuesto_aplicado_reserva,
             monto_subtotal_reserva, monto_impuesto_reserva, monto_total_reserva,
             monto_deposito_reserva, fecha_expiracion_reserva,
             ID_politica_cancelacion_reserva, politica_combustible_reserva,
             km_incluidos_dia_reserva, cargo_km_excedido_reserva,
             observaciones_reserva, correlation_id_reserva,
             idempotency_key_reserva, moneda_reserva)
        VALUES
            (@ID_usuario_cliente, @ID_vehiculo,
             @ID_sede_retiro, @ID_sede_devolucion,
             @estado_reserva, @fecha_inicio, @fecha_fin,
             @precio, @porcentaje_impuesto,
             @subtotal, @impuesto, @total,
             @monto_deposito_aplicado, DATEADD(MINUTE, @minutos_exp, SYSDATETIME()),
             @ID_politica_cancelacion, @politica_combustible,
             @km_incluidos_dia, @cargo_km_excedido,
             @observaciones, @correlation_id,
             @idempotency_key, @moneda);

        SET @ID_reserva = CONVERT(INT, SCOPE_IDENTITY());

        INSERT INTO HistorialEstadoReserva
            (ID_reserva_historial, ID_estado_anterior_historial_estado_reserva, ID_estado_nuevo_historial_estado_reserva,
             evento_historial_estado_reserva, motivo_historial_estado_reserva, ID_usuario_historial)
        VALUES (@ID_reserva, NULL, @estado_reserva, 'CREAR', NULL, @ID_usuario_cliente);

        INSERT INTO BloqueoVehiculo
            (ID_vehiculo_bloqueo, tipo_bloqueo, fecha_inicio_bloqueo,
             fecha_fin_bloqueo, ID_reserva_bloqueo, ID_usuario_creacion_bloqueo_vehiculo)
        VALUES (@ID_vehiculo, 'RESERVA',
                CAST(@fecha_inicio AS DATETIME2), CAST(@fecha_fin AS DATETIME2),
                @ID_reserva, @ID_usuario_cliente);

        EXEC dbo.u_sp_CrearSnapshotReserva @ID_reserva, @ID_usuario_cliente;

        INSERT INTO MovimientoFinanciero
            (ID_reserva_movimiento, tipo_movimiento, monto_movimiento,
             moneda_movimiento, descripcion_movimiento_financiero, ID_usuario_movimiento)
        VALUES (@ID_reserva, 'CARGO_RESERVA', @subtotal + @impuesto,
                @moneda, N'Cargo comercial inicial.', @ID_usuario_cliente);

        IF @monto_deposito_aplicado > 0
            INSERT INTO MovimientoFinanciero
                (ID_reserva_movimiento, tipo_movimiento, monto_movimiento,
                 moneda_movimiento, descripcion_movimiento_financiero, ID_usuario_movimiento)
            VALUES (@ID_reserva, 'DEPOSITO', @monto_deposito_aplicado,
                    @moneda, N'Deposito de garantia.', @ID_usuario_cliente);

        DECLARE @payload_reserva_creada NVARCHAR(MAX) =
            (SELECT @ID_reserva AS id_reserva, @ID_vehiculo AS id_vehiculo,
                    @ID_usuario_cliente AS id_usuario, @total AS total,
                    @correlation_id AS correlation_id
             FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
        EXEC dbo.u_sp_PublicarEvento
            @tipo_evento = 'ReservaCreada',
            @agregado_tipo = 'Reserva',
            @agregado_id = @ID_reserva,
            @payload = @payload_reserva_creada,
            @devolver_evento = 0;

        COMMIT TRANSACTION;
        SELECT * FROM vw_ReservasDetalle WHERE ID_reserva = @ID_reserva;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        DECLARE @log_err_num INT = ERROR_NUMBER();
        DECLARE @log_err_sev INT = ERROR_SEVERITY();
        DECLARE @log_err_state INT = ERROR_STATE();
        DECLARE @log_err_proc NVARCHAR(128) = ERROR_PROCEDURE();
        DECLARE @log_err_line INT = ERROR_LINE();
        DECLARE @log_err_msg NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @log_params NVARCHAR(MAX) = (SELECT @ID_usuario_cliente AS ID_usuario_cliente, @ID_vehiculo AS ID_vehiculo, @ID_sede_retiro AS ID_sede_retiro, @ID_sede_devolucion AS ID_sede_devolucion, @fecha_inicio AS fecha_inicio, @fecha_fin AS fecha_fin, @porcentaje_impuesto AS porcentaje_impuesto, @observaciones AS observaciones, @ID_politica_cancelacion AS ID_politica_cancelacion, @politica_combustible AS politica_combustible, @km_incluidos_dia AS km_incluidos_dia, @cargo_km_excedido AS cargo_km_excedido, @idempotency_key AS idempotency_key FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
        EXEC dbo.u_sp_RegistrarError
            @numero_error = @log_err_num, @severidad_error = @log_err_sev, @estado_error = @log_err_state,
            @procedimiento_error = @log_err_proc, @linea_error = @log_err_line, @mensaje_error = @log_err_msg,
            @nombre_sp_origen = 'u_sp_CrearReserva',
            @parametros_json = @log_params,
            @contexto_json = NULL,
            @origen = 'SP';
        THROW;
    END CATCH;
END;
GO
