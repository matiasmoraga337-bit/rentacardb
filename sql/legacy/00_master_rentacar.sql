/* ============================================================================
   RENTACARDB - SCRIPT MAESTRO UNICO E IDEMPOTENTE
   ----------------------------------------------------------------------------
   Proyecto universitario de Base de Datos - SQL Server 2025 (compat 170)
   Ejecutar COMPLETO sobre la base RentaCarDB ya creada por Rentascript.sql.

   QUE HACE (fases):
     F1  Quita cupones (tablas Cupon/UsoCupon y sp_CanjearCupon).
     F2  Nuevos catalogos: Provincia, ConfiguracionGlobal, CaracteristicaVehiculo,
         TipoCargoExtra (+ N:M VehiculoCaracteristica).
     F3  Esquema: Reserva.moneda_reserva NOT NULL DEFAULT 'CLP', CHECK patente/RUT,
         rowversion, funciones fn_ComisionAplicable / fn_ValidarRut.
     F4  Triggers de auditoria y de no-solapamiento (doble reserva).
     F5  Correccion de SP: movimientos PAGO/CARGO_KM/MULTA/COMISION_PLATAFORMA,
         IVA y expiracion desde ConfiguracionGlobal, notificaciones.
     F6  Mensajeria/chat: listar conversaciones y mensajes, notificar al receptor.
     F5b Pasarela de pago simulada tipo Webpay (PagoTransaccionSimulada).
     F7  Indices de FK, seguridad (roles/GRANT), saneamiento de config de BD,
         seeds (Chile regiones/provincias/comunas + catalogos nuevos).
     F8  Validacion de integridad.

   REQUISITOS / NOTAS:
     - Ejecutar con un login con permisos de ALTER en la base.
     - Es re-ejecutable: usa guardas IF EXISTS / IF NOT EXISTS.
     - Compatibilidad: SQL Server 2025. En SQL Express no hay SQL Agent.
     - ANTES de ejecutar en un entorno con datos: respaldar.
   ============================================================================ */

USE [RentaCarDB];
GO
SET NOCOUNT ON;
GO

/* ============================================================================
   FASE 1 - QUITAR CUPONES
   ============================================================================ */
IF OBJECT_ID('dbo.sp_CanjearCupon','P') IS NOT NULL
    DROP PROCEDURE dbo.sp_CanjearCupon;
GO
-- UsoCupon depende de Cupon y Reserva: se elimina primero.
IF OBJECT_ID('dbo.UsoCupon','U') IS NOT NULL
    DROP TABLE dbo.UsoCupon;
GO
IF OBJECT_ID('dbo.Cupon','U') IS NOT NULL
    DROP TABLE dbo.Cupon;
GO

/* ============================================================================
   FASE 2 - NUEVOS CATALOGOS Y TABLAS
   ============================================================================ */

/* 2.1 Provincia (Region -> Provincia -> Comuna) */
IF OBJECT_ID('dbo.Provincia','U') IS NULL
BEGIN
    CREATE TABLE dbo.Provincia(
        ID_provincia         INT IDENTITY(1,1) NOT NULL,
        ID_region_provincia  INT NOT NULL,
        nombre_provincia     NVARCHAR(100) NOT NULL,
        activo_provincia     BIT NOT NULL
            CONSTRAINT DF_provincia_activo DEFAULT (1),
        CONSTRAINT PK_provincia PRIMARY KEY CLUSTERED (ID_provincia),
        CONSTRAINT FK_provincia_region FOREIGN KEY (ID_region_provincia)
            REFERENCES dbo.Region(ID_region),
        CONSTRAINT UQ_provincia_region_nombre UNIQUE (ID_region_provincia, nombre_provincia),
        CONSTRAINT CK_provincia_nombre CHECK (LEN(LTRIM(RTRIM(nombre_provincia))) > 0)
    );
END
GO

/* 2.2 Comuna: agregar codigo oficial (CUT) y FK a Provincia.
   La normalizacion 3FN deja a Comuna dependiendo solo de Provincia
   (la Region se obtiene via Provincia, no se duplica). */
IF COL_LENGTH('dbo.Comuna','codigo_comuna') IS NULL
    ALTER TABLE dbo.Comuna ADD codigo_comuna VARCHAR(5) NULL;
GO
IF COL_LENGTH('dbo.Comuna','ID_provincia_comuna') IS NULL
    ALTER TABLE dbo.Comuna ADD ID_provincia_comuna INT NULL;
GO
/* La dependencia directa de Region se reemplaza por Provincia (3FN). Se quitan
   las restricciones sobre ID_region_comuna, se permite NULL durante la migracion
   y la columna se elimina al final de la Fase 7. */
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_comuna_region')
    ALTER TABLE dbo.Comuna DROP CONSTRAINT FK_comuna_region;
GO
IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = 'UQ_comuna_region_nombre')
    ALTER TABLE dbo.Comuna DROP CONSTRAINT UQ_comuna_region_nombre;
GO
IF EXISTS (SELECT 1 FROM sys.columns
           WHERE object_id = OBJECT_ID('dbo.Comuna') AND name = 'ID_region_comuna' AND is_nullable = 0)
    ALTER TABLE dbo.Comuna ALTER COLUMN ID_region_comuna INT NULL;
GO

/* 2.3 ConfiguracionGlobal: parametros de plataforma (antes hardcodeados en SP) */
IF OBJECT_ID('dbo.ConfiguracionGlobal','U') IS NULL
BEGIN
    CREATE TABLE dbo.ConfiguracionGlobal(
        ID_configuracion            TINYINT NOT NULL,
        iva_porcentaje              DECIMAL(5,2) NOT NULL,
        comision_porcentaje         DECIMAL(5,2) NOT NULL,
        minutos_expiracion_reserva  INT NOT NULL,
        moneda                      CHAR(3) NOT NULL,
        dias_minimos_publicacion    INT NULL,
        fecha_actualizacion         DATETIME2(0) NOT NULL
            CONSTRAINT DF_config_global_fecha DEFAULT (SYSDATETIME()),
        CONSTRAINT PK_configuracion_global PRIMARY KEY CLUSTERED (ID_configuracion),
        CONSTRAINT CK_config_global_unica    CHECK (ID_configuracion = 1),
        CONSTRAINT CK_config_global_iva      CHECK (iva_porcentaje BETWEEN 0 AND 100),
        CONSTRAINT CK_config_global_comision CHECK (comision_porcentaje BETWEEN 0 AND 100),
        CONSTRAINT CK_config_global_minutos  CHECK (minutos_expiracion_reserva BETWEEN 1 AND 1440),
        CONSTRAINT CK_config_global_moneda   CHECK (LEN(moneda) = 3)
    );
END
GO
IF NOT EXISTS (SELECT 1 FROM dbo.ConfiguracionGlobal WHERE ID_configuracion = 1)
    INSERT dbo.ConfiguracionGlobal
        (ID_configuracion, iva_porcentaje, comision_porcentaje,
         minutos_expiracion_reserva, moneda, dias_minimos_publicacion, fecha_actualizacion)
    VALUES (1, 19.00, 15.00, 30, 'CLP', NULL, SYSDATETIME());
GO

/* 2.4 CaracteristicaVehiculo (catalogo) + VehiculoCaracteristica (N:M) */
IF OBJECT_ID('dbo.CaracteristicaVehiculo','U') IS NULL
BEGIN
    CREATE TABLE dbo.CaracteristicaVehiculo(
        ID_caracteristica_vehiculo   INT IDENTITY(1,1) NOT NULL,
        nombre_caracteristica        NVARCHAR(80) NOT NULL,
        categoria_caracteristica     VARCHAR(30) NOT NULL,
        descripcion_caracteristica   NVARCHAR(200) NULL,
        activo_caracteristica        BIT NOT NULL
            CONSTRAINT DF_caracteristica_activo DEFAULT (1),
        CONSTRAINT PK_caracteristica_vehiculo PRIMARY KEY CLUSTERED (ID_caracteristica_vehiculo),
        CONSTRAINT UQ_caracteristica_nombre UNIQUE (nombre_caracteristica),
        CONSTRAINT CK_caracteristica_categoria CHECK
            (categoria_caracteristica IN ('EQUIPAMIENTO','SEGURIDAD','CONFORT','CONECTIVIDAD')),
        CONSTRAINT CK_caracteristica_nombre CHECK
            (LEN(LTRIM(RTRIM(nombre_caracteristica))) > 0)
    );
END
GO
IF OBJECT_ID('dbo.VehiculoCaracteristica','U') IS NULL
BEGIN
    CREATE TABLE dbo.VehiculoCaracteristica(
        ID_vehiculo_vehiculo_caracteristica   INT NOT NULL,
        ID_caracteristica_vehiculo_caracteristica INT NOT NULL,
        disponible_vehiculo_caracteristica    BIT NOT NULL
            CONSTRAINT DF_vehiculo_caracteristica_disp DEFAULT (1),
        fecha_registro_vehiculo_caracteristica DATETIME2(0) NOT NULL
            CONSTRAINT DF_vehiculo_caracteristica_fecha DEFAULT (SYSDATETIME()),
        CONSTRAINT PK_vehiculo_caracteristica PRIMARY KEY CLUSTERED
            (ID_vehiculo_vehiculo_caracteristica, ID_caracteristica_vehiculo_caracteristica),
        CONSTRAINT FK_vehiculo_caracteristica_vehiculo FOREIGN KEY (ID_vehiculo_vehiculo_caracteristica)
            REFERENCES dbo.Vehiculo(ID_vehiculo),
        CONSTRAINT FK_vehiculo_caracteristica_caracteristica FOREIGN KEY (ID_caracteristica_vehiculo_caracteristica)
            REFERENCES dbo.CaracteristicaVehiculo(ID_caracteristica_vehiculo)
    );
END
GO

/* 2.5 TipoCargoExtra (catalogo) + FK en CargoExtra */
IF OBJECT_ID('dbo.TipoCargoExtra','U') IS NULL
BEGIN
    CREATE TABLE dbo.TipoCargoExtra(
        ID_tipo_cargo_extra       INT IDENTITY(1,1) NOT NULL,
        nombre_tipo_cargo_extra   VARCHAR(30) NOT NULL,
        descripcion_tipo_cargo_extra NVARCHAR(200) NULL,
        activo_tipo_cargo_extra   BIT NOT NULL
            CONSTRAINT DF_tipo_cargo_extra_activo DEFAULT (1),
        CONSTRAINT PK_tipo_cargo_extra PRIMARY KEY CLUSTERED (ID_tipo_cargo_extra),
        CONSTRAINT UQ_tipo_cargo_extra_nombre UNIQUE (nombre_tipo_cargo_extra),
        CONSTRAINT CK_tipo_cargo_extra_nombre CHECK
            (nombre_tipo_cargo_extra IN ('COMBUSTIBLE','KM_EXCEDIDO','DANO','LIMPIEZA','MULTA_TRANSITO','OTRO'))
    );
END
GO
IF COL_LENGTH('dbo.CargoExtra','ID_tipo_cargo_extra_cargo_extra') IS NULL
    ALTER TABLE dbo.CargoExtra ADD ID_tipo_cargo_extra_cargo_extra INT NULL;
GO

/* ============================================================================
   FASE 3 - CAMBIOS DE ESQUEMA
   ============================================================================ */

/* 3.1 Reserva.moneda_reserva NOT NULL DEFAULT 'CLP' (consistente con Pago y Liquidacion) */
UPDATE dbo.Reserva SET moneda_reserva = 'CLP' WHERE moneda_reserva IS NULL;
GO
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Reserva')
           AND name = 'moneda_reserva' AND is_nullable = 1)
    ALTER TABLE dbo.Reserva ALTER COLUMN moneda_reserva CHAR(3) NOT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.default_constraints
               WHERE parent_object_id = OBJECT_ID('dbo.Reserva') AND name = 'DF_reserva_moneda')
    ALTER TABLE dbo.Reserva ADD CONSTRAINT DF_reserva_moneda DEFAULT ('CLP') FOR moneda_reserva;
GO

/* 3.2 Validaciones de formato (WITH NOCHECK: no valida filas existentes, si las nuevas) */
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_vehiculo_patente_formato')
    ALTER TABLE dbo.Vehiculo WITH NOCHECK ADD CONSTRAINT CK_vehiculo_patente_formato CHECK
        (patente_vehiculo LIKE '[A-Z][A-Z][A-Z][A-Z][0-9][0-9]'
         OR patente_vehiculo LIKE '[A-Z][A-Z][A-Z][0-9][0-9]');
GO

/* 3.2b Funcion de validacion de RUT chileno (modulo 11).
   La CHECK CK_persona_rut_valido depende de la funcion: hay que soltarla antes
   de redefinir la funcion y volver a crearla despues. */
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_persona_rut_valido')
    ALTER TABLE dbo.Persona DROP CONSTRAINT CK_persona_rut_valido;
GO
IF OBJECT_ID('dbo.fn_ValidarRut','FN') IS NOT NULL
    DROP FUNCTION dbo.fn_ValidarRut;
GO
CREATE FUNCTION dbo.fn_ValidarRut(@rut VARCHAR(12))
RETURNS BIT
AS
BEGIN
    DECLARE @cuerpo VARCHAR(10), @dv CHAR(1);
    SET @rut = UPPER(LTRIM(RTRIM(ISNULL(@rut,''))));
    SET @rut = REPLACE(REPLACE(@rut,'.',''),' ','');
    IF @rut = '' RETURN 0;
    IF CHARINDEX('-', @rut) > 0
    BEGIN
        SET @cuerpo = LEFT(@rut, CHARINDEX('-', @rut) - 1);
        SET @dv = RIGHT(@rut, 1);
    END
    ELSE
    BEGIN
        SET @cuerpo = LEFT(@rut, LEN(@rut) - 1);
        SET @dv = RIGHT(@rut, 1);
    END
    IF @cuerpo = '' OR @cuerpo LIKE '%[^0-9]%' RETURN 0;
    DECLARE @suma INT = 0, @mult INT = 2, @i INT = LEN(@cuerpo), @d INT;
    WHILE @i >= 1
    BEGIN
        SET @d = CONVERT(INT, SUBSTRING(@cuerpo, @i, 1));
        SET @suma = @suma + @d * @mult;
        SET @mult = CASE WHEN @mult = 7 THEN 2 ELSE @mult + 1 END;
        SET @i = @i - 1;
    END
    DECLARE @res INT = 11 - (@suma % 11);
    DECLARE @dvcalc CHAR(1) = CASE WHEN @res = 11 THEN '0'
                                   WHEN @res = 10 THEN 'K'
                                   ELSE CAST(@res AS CHAR(1)) END;
    RETURN CASE WHEN @dv = @dvcalc THEN 1 ELSE 0 END;
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_persona_rut_valido')
    ALTER TABLE dbo.Persona WITH NOCHECK ADD CONSTRAINT CK_persona_rut_valido CHECK
        (dbo.fn_ValidarRut(rut_persona) = 1);
GO

/* 3.3 Columna rowversion para control de concurrencia optimista */
IF COL_LENGTH('dbo.Reserva','rv_reserva') IS NULL ALTER TABLE dbo.Reserva ADD rv_reserva ROWVERSION;
GO
IF COL_LENGTH('dbo.Arriendo','rv_arriendo') IS NULL ALTER TABLE dbo.Arriendo ADD rv_arriendo ROWVERSION;
GO
IF COL_LENGTH('dbo.Pago','rv_pago') IS NULL ALTER TABLE dbo.Pago ADD rv_pago ROWVERSION;
GO
IF COL_LENGTH('dbo.Vehiculo','rv_vehiculo') IS NULL ALTER TABLE dbo.Vehiculo ADD rv_vehiculo ROWVERSION;
GO
IF COL_LENGTH('dbo.CargoExtra','rv_cargo_extra') IS NULL ALTER TABLE dbo.CargoExtra ADD rv_cargo_extra ROWVERSION;
GO
IF COL_LENGTH('dbo.Multa','rv_multa') IS NULL ALTER TABLE dbo.Multa ADD rv_multa ROWVERSION;
GO
IF COL_LENGTH('dbo.LiquidacionProveedor','rv_liquidacion') IS NULL ALTER TABLE dbo.LiquidacionProveedor ADD rv_liquidacion ROWVERSION;
GO

/* 3.4 fn_ComisionAplicable: porcentaje de comision vigente por proveedor o global */
IF OBJECT_ID('dbo.fn_ComisionAplicable','FN') IS NOT NULL
    DROP FUNCTION dbo.fn_ComisionAplicable;
GO
CREATE FUNCTION dbo.fn_ComisionAplicable(@ID_proveedor INT, @fecha DATE)
RETURNS DECIMAL(5,2)
AS
BEGIN
    DECLARE @pct DECIMAL(5,2);
    SELECT TOP 1 @pct = porcentaje_comision
    FROM dbo.Comision
    WHERE activo_comision = 1
      AND fecha_inicio_comision <= @fecha
      AND (fecha_fin_comision IS NULL OR fecha_fin_comision >= @fecha)
      AND (ID_proveedor_comision = @ID_proveedor OR ID_proveedor_comision IS NULL)
    ORDER BY CASE WHEN ID_proveedor_comision = @ID_proveedor THEN 0 ELSE 1 END,
             fecha_inicio_comision DESC;
    IF @pct IS NULL
        SELECT @pct = comision_porcentaje FROM dbo.ConfiguracionGlobal WHERE ID_configuracion = 1;
    RETURN ISNULL(@pct, 0);
END
GO

/* ============================================================================
   FASE 4 - TRIGGERS (auditoria + no-solapamiento)
   ============================================================================ */

/* 4.1 Auditoria de cambios de estado de Reserva (STATE_CHANGE) */
DROP TRIGGER IF EXISTS dbo.trg_Reserva_Auditoria;
GO
CREATE TRIGGER dbo.trg_Reserva_Auditoria
ON dbo.Reserva
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT UPDATE(ID_estado_reserva_reserva) RETURN;

    DECLARE @usuario INT = TRY_CONVERT(INT, SESSION_CONTEXT(N'usuario_id'));
    DECLARE @corr UNIQUEIDENTIFIER = TRY_CONVERT(UNIQUEIDENTIFIER, SESSION_CONTEXT(N'correlation_id'));
    DECLARE @motivo NVARCHAR(500) = TRY_CONVERT(NVARCHAR(500), SESSION_CONTEXT(N'motivo'));

    INSERT INTO dbo.Auditoria
        (entidad, ID_registro, accion, ID_usuario, fecha,
         valor_anterior, valor_nuevo, descripcion, correlation_id, origen, motivo)
    SELECT 'Reserva', i.ID_reserva, 'STATE_CHANGE', @usuario, SYSDATETIME(),
           CONCAT('estado=', d.ID_estado_reserva_reserva),
           CONCAT('estado=', i.ID_estado_reserva_reserva),
           N'Cambio de estado de reserva', ISNULL(@corr, i.correlation_id_reserva),
           'TRIGGER', @motivo
    FROM inserted i
    INNER JOIN deleted d ON d.ID_reserva = i.ID_reserva
    WHERE i.ID_estado_reserva_reserva <> d.ID_estado_reserva_reserva;
END
GO

/* 4.2 No-solapamiento de reservas activas del mismo vehiculo (barrera a nivel motor).
   Complementa la validacion de sp_V5_CrearReserva. */
DROP TRIGGER IF EXISTS dbo.trg_Reserva_SinSolape;
GO
CREATE TRIGGER dbo.trg_Reserva_SinSolape
ON dbo.Reserva
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN dbo.EstadoReserva eri ON eri.ID_estado_reserva = i.ID_estado_reserva_reserva
        INNER JOIN dbo.Reserva r
            ON r.ID_vehiculo_reserva = i.ID_vehiculo_reserva
           AND r.ID_reserva <> i.ID_reserva
           AND i.fecha_inicio_reserva < r.fecha_fin_reserva
           AND i.fecha_fin_reserva > r.fecha_inicio_reserva
        INNER JOIN dbo.EstadoReserva er ON er.ID_estado_reserva = r.ID_estado_reserva_reserva
        WHERE eri.nombre_estado_reserva IN ('PENDIENTE','CONFIRMADA','EN_CURSO')
          AND er.nombre_estado_reserva  IN ('PENDIENTE','CONFIRMADA','EN_CURSO')
    )
    BEGIN
        THROW 70900, 'Solapamiento: el vehiculo ya tiene una reserva activa en ese rango de fechas.', 1;
    END
END
GO

/* 4.3 No-solapamiento de bloqueos de vehiculo (excluye el bloqueo de la propia reserva) */
DROP TRIGGER IF EXISTS dbo.trg_BloqueoVehiculo_SinSolape;
GO
CREATE TRIGGER dbo.trg_BloqueoVehiculo_SinSolape
ON dbo.BloqueoVehiculo
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN dbo.BloqueoVehiculo b
            ON b.ID_vehiculo_bloqueo = i.ID_vehiculo_bloqueo
           AND b.ID_bloqueo <> i.ID_bloqueo
           AND b.activo_bloqueo = 1
           AND i.fecha_inicio_bloqueo < b.fecha_fin_bloqueo
           AND i.fecha_fin_bloqueo > b.fecha_inicio_bloqueo
        WHERE i.activo_bloqueo = 1
    )
    BEGIN
        THROW 70901, 'Solapamiento: el vehiculo ya tiene un bloqueo activo en ese rango de fechas.', 1;
    END
END
GO

/* ============================================================================
   FASE 5 - CORRECCION DE PROCEDIMIENTOS ALMACENADOS
   ============================================================================ */

/* 5.1 sp_RegistrarPago: registra MovimientoFinanciero 'PAGO' y notifica confirmacion */
IF OBJECT_ID('dbo.sp_RegistrarPago','P') IS NOT NULL
    DROP PROCEDURE dbo.sp_RegistrarPago;
GO
CREATE PROCEDURE dbo.sp_RegistrarPago
    @ID_reserva INT,
    @ID_tipo_operacion_pago INT,
    @ID_metodo_pago INT,
    @monto_pago DECIMAL(14,2),
    @aprobado BIT,
    @referencia VARCHAR(100) = NULL,
    @ID_arriendo INT = NULL,
    @ID_cargo_extra INT = NULL
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;

    DECLARE @estado_pago INT, @nombre_tipo_operacion VARCHAR(50),
            @nombre_estado_reserva VARCHAR(50), @ID_pago INT,
            @monto_esperado DECIMAL(14,2), @ID_usuario_cliente INT,
            @moneda CHAR(3) = 'CLP', @email_cliente VARCHAR(150);

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @monto_pago <= 0 THROW 52001, 'El monto debe ser mayor que cero.', 1;

        SELECT @nombre_tipo_operacion = nombre_tipo_operacion_pago
        FROM TipoOperacionPago
        WHERE ID_tipo_operacion_pago = @ID_tipo_operacion_pago
          AND activo_tipo_operacion_pago = 1;
        IF @nombre_tipo_operacion IS NULL THROW 52002, 'Tipo de operacion invalido.', 1;

        IF NOT EXISTS (SELECT 1 FROM MetodoPago WHERE ID_metodo_pago = @ID_metodo_pago AND activo_metodo_pago = 1)
            THROW 52003, 'Metodo de pago invalido.', 1;

        SELECT @nombre_estado_reserva = er.nombre_estado_reserva,
               @ID_usuario_cliente = r.ID_usuario_cliente_reserva,
               @monto_esperado = r.monto_total_reserva,
               @moneda = ISNULL(r.moneda_reserva, 'CLP')
        FROM Reserva r WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN EstadoReserva er ON er.ID_estado_reserva = r.ID_estado_reserva_reserva
        WHERE r.ID_reserva = @ID_reserva;

        IF @ID_usuario_cliente IS NULL THROW 52004, 'La reserva no existe.', 1;

        EXEC sys.sp_set_session_context @key=N'usuario_id', @value=NULL, @read_only=0;
        EXEC sys.sp_set_session_context @key=N'usuario_id', @value=@ID_usuario_cliente, @read_only=0;

        IF @nombre_tipo_operacion = 'RESERVA'
        BEGIN
            IF @nombre_estado_reserva <> 'PENDIENTE' THROW 52005, 'Reserva no esta PENDIENTE.', 1;
            IF @ID_arriendo IS NOT NULL OR @ID_cargo_extra IS NOT NULL THROW 52006, 'Pago RESERVA no acepta arriendo/extra.', 1;
            IF @monto_pago <> @monto_esperado THROW 52007, 'Monto no coincide con total reserva.', 1;
            IF EXISTS (SELECT 1 FROM Pago p
                       INNER JOIN EstadoPago ep ON ep.ID_estado_pago = p.ID_estado_pago_pago
                       INNER JOIN TipoOperacionPago topg ON topg.ID_tipo_operacion_pago = p.ID_tipo_operacion_pago_pago
                       WHERE p.ID_reserva_pago = @ID_reserva
                         AND topg.nombre_tipo_operacion_pago = 'RESERVA'
                         AND ep.nombre_estado_pago = 'APROBADO')
                THROW 52008, 'Ya existe pago RESERVA aprobado.', 1;
        END;

        IF @nombre_tipo_operacion = 'ARRIENDO'
        BEGIN
            IF @ID_arriendo IS NULL THROW 52009, 'Pago ARRIENDO requiere arriendo.', 1;
            IF @ID_cargo_extra IS NOT NULL THROW 52010, 'Pago ARRIENDO no acepta cargo extra.', 1;
            IF NOT EXISTS (SELECT 1 FROM Arriendo WHERE ID_arriendo = @ID_arriendo AND ID_reserva_arriendo = @ID_reserva)
                THROW 52011, 'El arriendo no corresponde a la reserva.', 1;
            IF @monto_pago <> @monto_esperado THROW 52016, 'Monto no coincide con total contratado.', 1;
        END;

        IF @nombre_tipo_operacion = 'EXTRA'
        BEGIN
            IF @ID_arriendo IS NULL OR @ID_cargo_extra IS NULL THROW 52012, 'Pago EXTRA requiere arriendo y cargo extra.', 1;
            IF NOT EXISTS (SELECT 1 FROM Arriendo WHERE ID_arriendo = @ID_arriendo AND ID_reserva_arriendo = @ID_reserva)
                THROW 52013, 'Arriendo no corresponde.', 1;

            SELECT @monto_esperado = ce.monto_cargo_extra
            FROM CargoExtra ce WHERE ce.ID_cargo_extra = @ID_cargo_extra
              AND ce.ID_arriendo_cargo_extra = @ID_arriendo;

            IF @monto_esperado IS NULL THROW 52014, 'Cargo extra invalido.', 1;
            IF @monto_pago <> @monto_esperado THROW 52015, 'Monto no coincide con cargo extra.', 1;
        END;

        SELECT @estado_pago = ID_estado_pago FROM EstadoPago
        WHERE nombre_estado_pago = CASE WHEN @aprobado = 1 THEN 'APROBADO' ELSE 'RECHAZADO' END;

        INSERT INTO Pago
            (ID_reserva_pago, ID_arriendo_pago, ID_cargo_extra_pago,
             ID_tipo_operacion_pago_pago, ID_metodo_pago_pago, ID_estado_pago_pago,
             monto_pago, moneda_pago, referencia_proveedor_pago, fecha_pago)
        VALUES (@ID_reserva, @ID_arriendo, @ID_cargo_extra,
                @ID_tipo_operacion_pago, @ID_metodo_pago, @estado_pago,
                @monto_pago, @moneda, @referencia,
                CASE WHEN @aprobado = 1 THEN SYSDATETIME() ELSE NULL END);

        SET @ID_pago = CONVERT(INT, SCOPE_IDENTITY());

        /* FIX: registrar el movimiento financiero del pago (antes ausente). */
        IF @aprobado = 1
            INSERT INTO MovimientoFinanciero
                (ID_reserva_movimiento, ID_pago_movimiento, tipo_movimiento,
                 monto_movimiento, moneda_movimiento, descripcion, ID_usuario_movimiento)
            VALUES (@ID_reserva, @ID_pago, 'PAGO', @monto_pago, @moneda,
                    CONCAT(N'Pago aprobado ', @nombre_tipo_operacion), @ID_usuario_cliente);

        IF @nombre_tipo_operacion = 'RESERVA' AND @aprobado = 1
        BEGIN
            UPDATE Reserva
            SET ID_estado_reserva_reserva =
                (SELECT ID_estado_reserva FROM EstadoReserva WHERE nombre_estado_reserva = 'CONFIRMADA')
            WHERE ID_reserva = @ID_reserva;

            /* Notificacion al cliente: reserva confirmada */
            SELECT @email_cliente = u.email_usuario
            FROM Reserva r
            INNER JOIN Usuario u ON u.ID_usuario = r.ID_usuario_cliente_reserva
            WHERE r.ID_reserva = @ID_reserva;

            INSERT INTO Notificacion
                (ID_usuario_notificacion, tipo_notificacion, canal_notificacion,
                 destinatario_notificacion, asunto_notificacion, cuerpo_notificacion,
                 estado_notificacion)
            VALUES (@ID_usuario_cliente, 'RESERVA_CONFIRMADA', 'EMAIL',
                    ISNULL(@email_cliente, ''), N'Reserva confirmada',
                    CONCAT(N'Tu reserva #', @ID_reserva, N' ha sido confirmada.'),
                    'PENDIENTE');

            INSERT INTO OutboxEvento (tipo_evento, agregado_tipo, agregado_id, payload, estado, intentos)
            VALUES ('ReservaConfirmada', 'Reserva', @ID_reserva,
                    (SELECT @ID_reserva AS id_reserva, @ID_pago AS id_pago,
                            @monto_pago AS monto FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
                    'PENDIENTE', 0);
        END;

        IF @nombre_tipo_operacion = 'EXTRA' AND @aprobado = 1
            UPDATE CargoExtra
            SET ID_estado_cargo_extra_cargo_extra =
                (SELECT ID_estado_cargo_extra FROM EstadoCargoExtra WHERE nombre_estado_cargo_extra = 'PAGADO')
            WHERE ID_cargo_extra = @ID_cargo_extra;

        COMMIT TRANSACTION;
        SELECT * FROM Pago WHERE ID_pago = @ID_pago;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

/* 5.2 sp_RegistrarDevolucion: registra CARGO_KM y COMISION_PLATAFORMA, notifica */
IF OBJECT_ID('dbo.sp_RegistrarDevolucion','P') IS NOT NULL
    DROP PROCEDURE dbo.sp_RegistrarDevolucion;
GO
CREATE PROCEDURE dbo.sp_RegistrarDevolucion
    @ID_arriendo INT,
    @ID_sede_devolucion_real INT,
    @kilometraje_final INT,
    @combustible_final DECIMAL(5,2),
    @limpieza VARCHAR(20) = NULL,
    @observaciones NVARCHAR(1000) = NULL,
    @ID_usuario_operador INT = NULL
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;

    DECLARE @ID_reserva INT, @ID_vehiculo INT, @ID_proveedor INT, @ID_cargo_km INT,
            @estado_arriendo VARCHAR(50), @km_inicial INT, @km_incluidos_dia INT,
            @cargo_km_exc DECIMAL(12,2), @dias INT, @km_recorridos INT,
            @km_excedidos INT, @cargo_total DECIMAL(12,2) = 0,
            @moneda CHAR(3) = 'CLP', @subtotal DECIMAL(14,2), @pct_comision DECIMAL(5,2),
            @monto_comision DECIMAL(14,2), @ID_usuario_cliente INT;

    IF @kilometraje_final < 0 OR @combustible_final NOT BETWEEN 0 AND 100
        THROW 53007, 'Datos finales invalidos.', 1;

    EXEC sys.sp_set_session_context @key=N'usuario_id', @value=NULL, @read_only=0;
    IF @ID_usuario_operador IS NOT NULL
        EXEC sys.sp_set_session_context @key=N'usuario_id', @value=@ID_usuario_operador, @read_only=0;

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT @ID_reserva = a.ID_reserva_arriendo, @ID_vehiculo = r.ID_vehiculo_reserva,
               @ID_proveedor = v.ID_proveedor_vehiculo, @estado_arriendo = ea.nombre_estado_arriendo,
               @km_inicial = a.kilometraje_inicial_arriendo, @km_incluidos_dia = r.km_incluidos_dia_reserva,
               @cargo_km_exc = r.cargo_km_excedido_reserva, @subtotal = r.monto_subtotal_reserva,
               @moneda = ISNULL(r.moneda_reserva,'CLP'), @ID_usuario_cliente = r.ID_usuario_cliente_reserva,
               @dias = DATEDIFF(DAY, r.fecha_inicio_reserva, r.fecha_fin_reserva)
        FROM Arriendo a WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN Reserva r ON r.ID_reserva = a.ID_reserva_arriendo
        INNER JOIN Vehiculo v ON v.ID_vehiculo = r.ID_vehiculo_reserva
        INNER JOIN EstadoArriendo ea ON ea.ID_estado_arriendo = a.ID_estado_arriendo_arriendo
        WHERE a.ID_arriendo = @ID_arriendo;

        IF @ID_reserva IS NULL THROW 53008, 'El arriendo no existe.', 1;
        IF @estado_arriendo <> 'ACTIVO' THROW 53009, 'El arriendo no esta ACTIVO.', 1;
        IF @kilometraje_final < @km_inicial THROW 53010, 'Km final < inicial.', 1;

        IF NOT EXISTS (SELECT 1 FROM SedeProveedor
                       WHERE ID_sede_proveedor = @ID_sede_devolucion_real
                         AND ID_proveedor_sede_proveedor = @ID_proveedor
                         AND activo_sede_proveedor = 1)
            THROW 53011, 'La sede de devolucion no pertenece al proveedor.', 1;

        IF NOT EXISTS (SELECT 1 FROM SedeProveedor s
                       INNER JOIN VehiculoSede vs ON vs.ID_sede_proveedor_vehiculo_sede = s.ID_sede_proveedor
                       WHERE s.ID_sede_proveedor = @ID_sede_devolucion_real
                         AND s.ID_proveedor_sede_proveedor = @ID_proveedor
                         AND vs.ID_vehiculo_vehiculo_sede = @ID_vehiculo
                         AND vs.disponible_para_devolucion = 1)
            THROW 53012, 'La sede no esta habilitada para devolucion.', 1;

        IF @ID_sede_devolucion_real <>
           (SELECT ID_sede_retiro_real_arriendo FROM Arriendo WHERE ID_arriendo = @ID_arriendo)
           AND NOT EXISTS (SELECT 1 FROM ConfiguracionProveedor
                           WHERE ID_proveedor_configuracion_proveedor = @ID_proveedor
                             AND permite_devolucion_otra_sede = 1)
            THROW 53013, 'El proveedor no permite devolucion en otra sede.', 1;

        SET @km_recorridos = @kilometraje_final - @km_inicial;

        IF @km_incluidos_dia IS NOT NULL AND @cargo_km_exc IS NOT NULL
           AND @km_recorridos > (@km_incluidos_dia * @dias)
        BEGIN
            SET @km_excedidos = @km_recorridos - (@km_incluidos_dia * @dias);
            SET @cargo_total = CONVERT(DECIMAL(12,2), @km_excedidos * @cargo_km_exc);
        END;

        INSERT INTO InspeccionArriendo
            (ID_arriendo_inspeccion_arriendo, tipo_inspeccion,
             nivel_combustible_inspeccion, kilometraje_inspeccion,
             limpieza_inspeccion, observaciones_inspeccion,
             ID_usuario_operador_inspeccion)
        VALUES (@ID_arriendo, 'DEVOLUCION', @combustible_final,
                @kilometraje_final, @limpieza, @observaciones, @ID_usuario_operador);

        UPDATE Arriendo
        SET ID_sede_devolucion_real_arriendo = @ID_sede_devolucion_real,
            ID_estado_arriendo_arriendo =
                (SELECT ID_estado_arriendo FROM EstadoArriendo WHERE nombre_estado_arriendo = 'FINALIZADO'),
            fecha_hora_devolucion_real_arriendo = SYSDATETIME(),
            kilometraje_final_arriendo = @kilometraje_final,
            combustible_final_arriendo = @combustible_final
        WHERE ID_arriendo = @ID_arriendo;

        UPDATE Vehiculo
        SET ID_estado_vehiculo_vehiculo =
                (SELECT ID_estado_vehiculo FROM EstadoVehiculo WHERE nombre_estado_vehiculo = 'DISPONIBLE'),
            ID_sede_actual_vehiculo = @ID_sede_devolucion_real,
            kilometraje_vehiculo = @kilometraje_final
        WHERE ID_vehiculo = @ID_vehiculo;

        UPDATE Reserva
        SET ID_estado_reserva_reserva =
                (SELECT ID_estado_reserva FROM EstadoReserva WHERE nombre_estado_reserva = 'COMPLETADA'),
            km_recorridos_reserva = @km_recorridos,
            cargo_km_total_reserva = @cargo_total
        WHERE ID_reserva = @ID_reserva;

        IF @cargo_total > 0
        BEGIN
            INSERT INTO CargoExtra
                (ID_arriendo_cargo_extra, ID_estado_cargo_extra_cargo_extra,
                 ID_tipo_cargo_extra_cargo_extra, concepto_cargo_extra, monto_cargo_extra,
                 observaciones_cargo_extra)
            VALUES (@ID_arriendo,
                    (SELECT ID_estado_cargo_extra FROM EstadoCargoExtra WHERE nombre_estado_cargo_extra = 'PENDIENTE'),
                    (SELECT ID_tipo_cargo_extra FROM TipoCargoExtra WHERE nombre_tipo_cargo_extra = 'KM_EXCEDIDO'),
                    N'Cargo por km excedido', @cargo_total,
                    CONCAT('Km recorridos: ', @km_recorridos, '. Excedidos: ', @km_excedidos));
            SET @ID_cargo_km = CONVERT(INT, SCOPE_IDENTITY());

            /* FIX: movimiento CARGO_KM (antes ausente) */
            INSERT INTO MovimientoFinanciero
                (ID_reserva_movimiento, tipo_movimiento, monto_movimiento,
                 moneda_movimiento, descripcion, ID_usuario_movimiento)
            VALUES (@ID_reserva, 'CARGO_KM', @cargo_total, @moneda,
                    N'Cargo por kilometraje excedido', @ID_usuario_operador);
        END;

        /* FIX: comision real de plataforma (antes nadie la insertaba -> liquidacion 0) */
        SET @pct_comision = dbo.fn_ComisionAplicable(@ID_proveedor, CAST(SYSDATETIME() AS DATE));
        SET @monto_comision = CONVERT(DECIMAL(14,2), ROUND(ISNULL(@subtotal,0) * @pct_comision / 100.0, 2));
        IF @monto_comision > 0
            INSERT INTO MovimientoFinanciero
                (ID_reserva_movimiento, tipo_movimiento, monto_movimiento,
                 moneda_movimiento, descripcion, ID_usuario_movimiento)
            VALUES (@ID_reserva, 'COMISION_PLATAFORMA', -@monto_comision, @moneda,
                    CONCAT(N'Comision plataforma ', @pct_comision, N'%'), @ID_usuario_operador);

        /* Notificacion al cliente: arriendo finalizado */
        INSERT INTO Notificacion
            (ID_usuario_notificacion, tipo_notificacion, canal_notificacion,
             destinatario_notificacion, asunto_notificacion, cuerpo_notificacion,
             estado_notificacion)
        VALUES (@ID_usuario_cliente, 'ARRIENDO_FINALIZADO', 'EMAIL', '',
                N'Arriendo finalizado',
                CONCAT(N'El arriendo #', @ID_arriendo, N' ha finalizado. Km recorridos: ', @km_recorridos),
                'PENDIENTE');

        COMMIT TRANSACTION;
        SELECT * FROM Arriendo WHERE ID_arriendo = @ID_arriendo;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

/* 5.3 sp_RegistrarMulta: registra MovimientoFinanciero 'MULTA' (antes ausente) */
IF OBJECT_ID('dbo.sp_RegistrarMulta','P') IS NOT NULL
    DROP PROCEDURE dbo.sp_RegistrarMulta;
GO
CREATE PROCEDURE dbo.sp_RegistrarMulta
    @ID_arriendo INT, @fecha_multa DATE, @descripcion NVARCHAR(500), @monto DECIMAL(12,2),
    @organismo NVARCHAR(150) = NULL, @numero_parte VARCHAR(50) = NULL,
    @ID_usuario_registro INT = NULL
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    DECLARE @ID_reserva INT, @moneda CHAR(3) = 'CLP', @ID_multa INT;

    IF @monto <= 0 THROW 60040, 'Monto debe ser > 0.', 1;
    IF NOT EXISTS (SELECT 1 FROM Arriendo WHERE ID_arriendo = @ID_arriendo) THROW 60041, 'Arriendo no existe.', 1;
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
             organismo_multa, numero_parte, monto_multa, ID_usuario_registro_multa)
        VALUES (@ID_arriendo,
                (SELECT ID_estado_multa FROM EstadoMulta WHERE nombre_estado_multa = 'PENDIENTE'),
                @fecha_multa, @descripcion, @organismo, @numero_parte, @monto, @ID_usuario_registro);
        SET @ID_multa = CONVERT(INT, SCOPE_IDENTITY());

        /* FIX: movimiento MULTA (antes ausente) */
        INSERT INTO MovimientoFinanciero
            (ID_reserva_movimiento, tipo_movimiento, monto_movimiento,
             moneda_movimiento, descripcion, ID_usuario_movimiento)
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

/* 5.4 sp_CrearCargoExtra: permite indicar el tipo de cargo (catalogo) */
IF OBJECT_ID('dbo.sp_CrearCargoExtra','P') IS NOT NULL
    DROP PROCEDURE dbo.sp_CrearCargoExtra;
GO
CREATE PROCEDURE dbo.sp_CrearCargoExtra
    @ID_arriendo INT, @concepto NVARCHAR(200), @monto DECIMAL(12,2),
    @observaciones NVARCHAR(500) = NULL, @ID_usuario_operador INT = NULL,
    @nombre_tipo_cargo VARCHAR(30) = 'OTRO'
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ID_tipo_cargo_extra INT;

    IF @monto <= 0 THROW 53020, 'Monto > 0.', 1;
    IF @ID_usuario_operador IS NOT NULL
        EXEC sys.sp_set_session_context @key=N'usuario_id', @value=@ID_usuario_operador, @read_only=0;

    IF NOT EXISTS (SELECT 1 FROM Arriendo WHERE ID_arriendo = @ID_arriendo)
        THROW 53021, 'Arriendo no existe.', 1;

    SELECT @ID_tipo_cargo_extra = ID_tipo_cargo_extra FROM TipoCargoExtra
    WHERE nombre_tipo_cargo_extra = @nombre_tipo_cargo AND activo_tipo_cargo_extra = 1;
    IF @ID_tipo_cargo_extra IS NULL
        SELECT @ID_tipo_cargo_extra = ID_tipo_cargo_extra FROM TipoCargoExtra
        WHERE nombre_tipo_cargo_extra = 'OTRO';

    INSERT INTO CargoExtra
        (ID_arriendo_cargo_extra, ID_estado_cargo_extra_cargo_extra,
         ID_tipo_cargo_extra_cargo_extra, concepto_cargo_extra, monto_cargo_extra, observaciones_cargo_extra)
    VALUES (@ID_arriendo,
            (SELECT ID_estado_cargo_extra FROM EstadoCargoExtra WHERE nombre_estado_cargo_extra = 'PENDIENTE'),
            @ID_tipo_cargo_extra, @concepto, @monto, @observaciones);
    SELECT * FROM CargoExtra WHERE ID_cargo_extra = SCOPE_IDENTITY();
END;
GO

/* 5.5 sp_V5_CrearReserva: IVA y minuto de expiracion desde ConfiguracionGlobal */
IF OBJECT_ID('dbo.sp_V5_CrearReserva','P') IS NOT NULL
    DROP PROCEDURE dbo.sp_V5_CrearReserva;
GO
CREATE PROCEDURE dbo.sp_V5_CrearReserva
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
        SELECT @porcentaje_impuesto = ISNULL(iva_porcentaje, 19.00)
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
              AND vs.disponible_para_entrega = 1)
            THROW 70217, 'La sede de retiro no esta habilitada.', 1;

        IF NOT EXISTS (
            SELECT 1 FROM VehiculoSede vs
            WHERE vs.ID_vehiculo_vehiculo_sede = @ID_vehiculo
              AND vs.ID_sede_proveedor_vehiculo_sede = @ID_sede_devolucion
              AND vs.disponible_para_devolucion = 1)
            THROW 70218, 'La sede de devolucion no esta habilitada.', 1;

        IF @ID_sede_retiro <> @ID_sede_devolucion
           AND NOT EXISTS (SELECT 1 FROM ConfiguracionProveedor
                           WHERE ID_proveedor_configuracion_proveedor = @ID_proveedor
                             AND permite_devolucion_otra_sede = 1)
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
                     AND dias_minimos_arriendo IS NOT NULL AND @dias < dias_minimos_arriendo)
            THROW 70220, 'Duracion menor al minimo del proveedor.', 1;

        IF EXISTS (SELECT 1 FROM ConfiguracionProveedor
                   WHERE ID_proveedor_configuracion_proveedor = @ID_proveedor
                     AND dias_maximos_arriendo IS NOT NULL AND @dias > dias_maximos_arriendo)
            THROW 70221, 'Duracion mayor al maximo del proveedor.', 1;

        SELECT @minutos_exp = minutos_expiracion_reserva,
               @moneda = ISNULL(moneda_operacion,'CLP'),
               @edad_minima = edad_minima_arriendo,
               @requiere_deposito = ISNULL(requiere_deposito,0),
               @monto_deposito = ISNULL(monto_deposito,0)
        FROM ConfiguracionProveedor
        WHERE ID_proveedor_configuracion_proveedor = @ID_proveedor;

        IF @minutos_exp IS NULL
            SELECT @minutos_exp = minutos_expiracion_reserva
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

        SET @precio = dbo.fn_V5_PrecioAplicable(@ID_vehiculo, @fecha_inicio, @fecha_fin);
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
            (ID_reserva_historial, ID_estado_anterior, ID_estado_nuevo,
             evento, motivo, ID_usuario_historial)
        VALUES (@ID_reserva, NULL, @estado_reserva, 'CREAR', NULL, @ID_usuario_cliente);

        INSERT INTO BloqueoVehiculo
            (ID_vehiculo_bloqueo, tipo_bloqueo, fecha_inicio_bloqueo,
             fecha_fin_bloqueo, ID_reserva_bloqueo, ID_usuario_creacion)
        VALUES (@ID_vehiculo, 'RESERVA',
                CAST(@fecha_inicio AS DATETIME2), CAST(@fecha_fin AS DATETIME2),
                @ID_reserva, @ID_usuario_cliente);

        EXEC dbo.sp_V5_CrearSnapshotReserva @ID_reserva, @ID_usuario_cliente;

        INSERT INTO MovimientoFinanciero
            (ID_reserva_movimiento, tipo_movimiento, monto_movimiento,
             moneda_movimiento, descripcion, ID_usuario_movimiento)
        VALUES (@ID_reserva, 'CARGO_RESERVA', @subtotal + @impuesto,
                @moneda, N'Cargo comercial inicial.', @ID_usuario_cliente);

        IF @monto_deposito_aplicado > 0
            INSERT INTO MovimientoFinanciero
                (ID_reserva_movimiento, tipo_movimiento, monto_movimiento,
                 moneda_movimiento, descripcion, ID_usuario_movimiento)
            VALUES (@ID_reserva, 'DEPOSITO', @monto_deposito_aplicado,
                    @moneda, N'Deposito de garantia.', @ID_usuario_cliente);

        INSERT INTO OutboxEvento (tipo_evento, agregado_tipo, agregado_id, payload, estado, intentos)
        VALUES ('ReservaCreada', 'Reserva', @ID_reserva,
                (SELECT @ID_reserva AS id_reserva, @ID_vehiculo AS id_vehiculo,
                        @ID_usuario_cliente AS id_usuario, @total AS total,
                        @correlation_id AS correlation_id
                 FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
                'PENDIENTE', 0);

        COMMIT TRANSACTION;
        SELECT * FROM vw_ReservasDetalle WHERE ID_reserva = @ID_reserva;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

/* 5.6 sp_CrearReserva (alias de compatibilidad sobre sp_V5_CrearReserva).
   Se mantiene como capa publica; el IVA por defecto lo resuelve el SP interno. */
IF OBJECT_ID('dbo.sp_CrearReserva','P') IS NOT NULL
    DROP PROCEDURE dbo.sp_CrearReserva;
GO
CREATE PROCEDURE dbo.sp_CrearReserva
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
    SET NOCOUNT ON;
    EXEC dbo.sp_V5_CrearReserva
        @ID_usuario_cliente, @ID_vehiculo, @ID_sede_retiro, @ID_sede_devolucion,
        @fecha_inicio, @fecha_fin, @porcentaje_impuesto, @observaciones,
        @ID_politica_cancelacion, @politica_combustible, @km_incluidos_dia,
        @cargo_km_excedido, @idempotency_key;
END;
GO

/* ============================================================================
   FASE 6 - MENSAJERIA / CHAT (proveedor <-> cliente)
   ============================================================================ */

/* 6.1 sp_EnviarMensaje: ademas notifica al receptor */
IF OBJECT_ID('dbo.sp_EnviarMensaje','P') IS NOT NULL
    DROP PROCEDURE dbo.sp_EnviarMensaje;
GO
CREATE PROCEDURE dbo.sp_EnviarMensaje
    @ID_conversacion INT, @ID_usuario_emisor INT, @contenido NVARCHAR(2000)
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    DECLARE @ID_mensaje BIGINT, @ID_cliente INT, @ID_proveedor INT, @email_destino VARCHAR(150);

    IF LEN(LTRIM(RTRIM(ISNULL(@contenido, N'')))) = 0 THROW 60090, 'Mensaje vacio.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (SELECT 1 FROM Conversacion WITH (UPDLOCK, HOLDLOCK)
                       WHERE ID_conversacion = @ID_conversacion AND activa_conversacion = 1)
            THROW 60091, 'Conversacion no existe o inactiva.', 1;

        IF NOT EXISTS (SELECT 1 FROM Conversacion c WHERE c.ID_conversacion = @ID_conversacion
                       AND c.ID_usuario_conversacion = @ID_usuario_emisor)
        AND NOT EXISTS (SELECT 1 FROM Conversacion c
                        INNER JOIN ProveedorUsuario pu
                            ON pu.ID_proveedor_proveedor_usuario = c.ID_proveedor_conversacion
                           AND pu.ID_usuario_proveedor_usuario = @ID_usuario_emisor
                        WHERE c.ID_conversacion = @ID_conversacion)
            THROW 60092, 'Usuario no participa.', 1;

        INSERT INTO Mensaje (ID_conversacion_mensaje, ID_usuario_emisor_mensaje, contenido_mensaje)
        VALUES (@ID_conversacion, @ID_usuario_emisor, @contenido);
        SET @ID_mensaje = SCOPE_IDENTITY();

        UPDATE Conversacion SET fecha_ultimo_mensaje = SYSDATETIME()
        WHERE ID_conversacion = @ID_conversacion;

        SELECT @ID_cliente = ID_usuario_conversacion, @ID_proveedor = ID_proveedor_conversacion
        FROM Conversacion WHERE ID_conversacion = @ID_conversacion;

        /* Notificar al receptor: si el emisor es el cliente, se notifica al proveedor y viceversa.
           La notificacion se dirige al cliente (dueno de la conversacion) si no fue el emisor. */
        IF @ID_usuario_emisor <> @ID_cliente
            INSERT INTO Notificacion
                (ID_usuario_notificacion, tipo_notificacion, canal_notificacion,
                 destinatario_notificacion, asunto_notificacion, cuerpo_notificacion, estado_notificacion)
            SELECT @ID_cliente, 'MENSAJE_NUEVO', 'PUSH', ISNULL(u.email_usuario,''),
                   N'Nuevo mensaje', LEFT(@contenido, 200), 'PENDIENTE'
            FROM Usuario u WHERE u.ID_usuario = @ID_cliente;

        INSERT INTO OutboxEvento (tipo_evento, agregado_tipo, agregado_id, payload, estado, intentos)
        VALUES ('MensajeEnviado', 'Conversacion', @ID_conversacion,
                (SELECT @ID_conversacion AS id_conversacion, @ID_mensaje AS id_mensaje,
                        @ID_usuario_emisor AS emisor FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
                'PENDIENTE', 0);

        COMMIT TRANSACTION;
        SELECT * FROM Mensaje WHERE ID_mensaje = @ID_mensaje;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

/* 6.2 sp_ListarConversaciones: por usuario (cliente o miembro de proveedor) */
IF OBJECT_ID('dbo.sp_ListarConversaciones','P') IS NOT NULL
    DROP PROCEDURE dbo.sp_ListarConversaciones;
GO
CREATE PROCEDURE dbo.sp_ListarConversaciones
    @ID_usuario INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT c.ID_conversacion,
           c.ID_usuario_conversacion,
           c.ID_proveedor_conversacion,
           p.nombre_comercial_proveedor,
           c.ID_vehiculo_conversacion,
           c.activa_conversacion,
           c.fecha_inicio_conversacion,
           c.fecha_ultimo_mensaje,
           (SELECT COUNT(*) FROM Mensaje m
            WHERE m.ID_conversacion_mensaje = c.ID_conversacion
              AND m.leido_mensaje = 0
              AND m.ID_usuario_emisor_mensaje <> @ID_usuario) AS mensajes_no_leidos,
           (SELECT TOP 1 m.contenido_mensaje FROM Mensaje m
            WHERE m.ID_conversacion_mensaje = c.ID_conversacion
            ORDER BY m.fecha_mensaje DESC, m.ID_mensaje DESC) AS ultimo_mensaje
    FROM Conversacion c
    INNER JOIN Proveedor p ON p.ID_proveedor = c.ID_proveedor_conversacion
    WHERE c.ID_usuario_conversacion = @ID_usuario
       OR EXISTS (SELECT 1 FROM ProveedorUsuario pu
                  WHERE pu.ID_proveedor_proveedor_usuario = c.ID_proveedor_conversacion
                    AND pu.ID_usuario_proveedor_usuario = @ID_usuario)
    ORDER BY c.fecha_ultimo_mensaje DESC, c.fecha_inicio_conversacion DESC;
END;
GO

/* 6.3 sp_ListarMensajes: mensajes de una conversacion con validacion de participacion */
IF OBJECT_ID('dbo.sp_ListarMensajes','P') IS NOT NULL
    DROP PROCEDURE dbo.sp_ListarMensajes;
GO
CREATE PROCEDURE dbo.sp_ListarMensajes
    @ID_conversacion INT,
    @ID_usuario INT
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM Conversacion c
                   WHERE c.ID_conversacion = @ID_conversacion
                     AND (c.ID_usuario_conversacion = @ID_usuario
                          OR EXISTS (SELECT 1 FROM ProveedorUsuario pu
                                     WHERE pu.ID_proveedor_proveedor_usuario = c.ID_proveedor_conversacion
                                       AND pu.ID_usuario_proveedor_usuario = @ID_usuario)))
        THROW 60100, 'Conversacion no existe o sin permisos.', 1;

    SELECT m.ID_mensaje, m.ID_conversacion_mensaje, m.ID_usuario_emisor_mensaje,
           m.contenido_mensaje, m.leido_mensaje, m.fecha_mensaje
    FROM Mensaje m
    WHERE m.ID_conversacion_mensaje = @ID_conversacion
    ORDER BY m.fecha_mensaje ASC, m.ID_mensaje ASC;
END;
GO

/* ============================================================================
   FASE 5b - PASARELA DE PAGO SIMULADA (tipo Webpay / Transbank)
   Flujo: iniciar (crea Pago PENDIENTE + transaccion CREADA) -> redireccion
          con token_ws -> confirmar (APROBADA + confirma reserva via sp_RegistrarPago).
   ============================================================================ */
IF OBJECT_ID('dbo.sp_WP_IniciarTransaccion','P') IS NOT NULL
    DROP PROCEDURE dbo.sp_WP_IniciarTransaccion;
GO
CREATE PROCEDURE dbo.sp_WP_IniciarTransaccion
    @ID_reserva INT,
    @monto DECIMAL(12,2),
    @buy_order VARCHAR(100) = NULL,
    @session_id VARCHAR(100) = NULL,
    @token_ws CHAR(64) OUTPUT,
    @url_redireccion VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    DECLARE @ID_pago INT, @ID_estado_pago INT, @estado_reserva VARCHAR(50);

    IF @monto <= 0 THROW 52030, 'Monto invalido.', 1;

    SELECT @estado_reserva = er.nombre_estado_reserva
    FROM Reserva r
    INNER JOIN EstadoReserva er ON er.ID_estado_reserva = r.ID_estado_reserva_reserva
    WHERE r.ID_reserva = @ID_reserva;
    IF @estado_reserva IS NULL THROW 52031, 'Reserva no existe.', 1;
    IF @estado_reserva <> 'PENDIENTE' THROW 52032, 'La reserva no esta PENDIENTE.', 1;

    SELECT @ID_estado_pago = ID_estado_pago FROM EstadoPago WHERE nombre_estado_pago = 'PENDIENTE';

    SET @buy_order  = ISNULL(@buy_order, CONCAT('BO-', @ID_reserva, '-', FORMAT(SYSDATETIME(),'yyyyMMddHHmmss')));
    SET @session_id = ISNULL(@session_id, CONCAT('S-', @ID_reserva, '-', NEWID()));
    SET @token_ws   = CONVERT(CHAR(64), CONVERT(VARBINARY(32), HASHBYTES('SHA2_256',
                       CONCAT(@buy_order, @session_id, SYSDATETIME()))), 2);

    BEGIN TRY
        BEGIN TRANSACTION;

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
        THROW;
    END CATCH;
END;
GO

IF OBJECT_ID('dbo.sp_WP_ConfirmarTransaccion','P') IS NOT NULL
    DROP PROCEDURE dbo.sp_WP_ConfirmarTransaccion;
GO
CREATE PROCEDURE dbo.sp_WP_ConfirmarTransaccion
    @token_ws CHAR(64),
    @aprobada BIT = 1
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    DECLARE @ID_transaccion BIGINT, @ID_pago INT, @ID_reserva INT,
            @monto DECIMAL(12,2), @estado VARCHAR(20);

    SELECT @ID_transaccion = ID_transaccion_simulada, @ID_pago = ID_pago_transaccion_simulada,
           @monto = monto_transaccion_simulada, @estado = estado_transaccion_simulada
    FROM PagoTransaccionSimulada WHERE token_ws_transaccion_simulada = @token_ws;

    IF @ID_transaccion IS NULL THROW 52033, 'Transaccion no encontrada.', 1;
    IF @estado <> 'CREADA' THROW 52034, 'La transaccion ya fue resuelta.', 1;

    SELECT @ID_reserva = ID_reserva_pago FROM Pago WHERE ID_pago = @ID_pago;

    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE PagoTransaccionSimulada
        SET estado_transaccion_simulada = CASE WHEN @aprobada = 1 THEN 'APROBADA' ELSE 'RECHAZADA' END,
            fecha_respuesta_transaccion_simulada = SYSDATETIME()
        WHERE ID_transaccion_simulada = @ID_transaccion;

        IF @aprobada = 1
        BEGIN
            UPDATE Pago
            SET ID_estado_pago_pago = (SELECT ID_estado_pago FROM EstadoPago WHERE nombre_estado_pago='APROBADO'),
                fecha_confirmacion_pago = SYSDATETIME()
            WHERE ID_pago = @ID_pago;

            UPDATE Reserva
            SET ID_estado_reserva_reserva =
                (SELECT ID_estado_reserva FROM EstadoReserva WHERE nombre_estado_reserva='CONFIRMADA'),
                fecha_confirmacion_reserva = ISNULL(fecha_confirmacion_reserva, SYSDATETIME())
            WHERE ID_reserva = @ID_reserva;
        END
        ELSE
            UPDATE Pago
            SET ID_estado_pago_pago = (SELECT ID_estado_pago FROM EstadoPago WHERE nombre_estado_pago='RECHAZADO')
            WHERE ID_pago = @ID_pago;

        COMMIT TRANSACTION;
        SELECT @ID_transaccion AS ID_transaccion_simulada, @ID_pago AS ID_pago,
               @ID_reserva AS ID_reserva, @aprobada AS aprobada;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

/* ============================================================================
   FASE 7 - INDICES / SEGURIDAD / CONFIG / SEEDS
   ============================================================================ */

/* 7.1 Indices sobre columnas FK que no tienen indice de soporte */
DECLARE @tbl SYSNAME, @col SYSNAME, @sql NVARCHAR(400), @ix SYSNAME;
DECLARE fk_cur CURSOR LOCAL FAST_FORWARD FOR
    SELECT OBJECT_NAME(fkc.parent_object_id), c.name
    FROM sys.foreign_key_columns fkc
    INNER JOIN sys.foreign_keys fk ON fk.object_id = fkc.constraint_object_id
    INNER JOIN sys.columns c
        ON c.object_id = fkc.parent_object_id AND c.column_id = fkc.parent_column_id
    WHERE NOT EXISTS (
        SELECT 1 FROM sys.index_columns ic
        INNER JOIN sys.indexes i ON i.object_id = ic.object_id AND i.index_id = ic.index_id
        WHERE ic.object_id = fkc.parent_object_id
          AND ic.column_id = fkc.parent_column_id
          AND ic.key_ordinal = 1);
OPEN fk_cur;
FETCH NEXT FROM fk_cur INTO @tbl, @col;
WHILE @@FETCH_STATUS = 0
BEGIN
    SET @ix = LEFT(CONCAT('IX_', @tbl, '_', @col), 128);
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = @ix AND object_id = OBJECT_ID('dbo.' + @tbl))
    BEGIN
        SET @sql = CONCAT('CREATE NONCLUSTERED INDEX ', QUOTENAME(@ix),
                          ' ON dbo.', QUOTENAME(@tbl), ' (', QUOTENAME(@col), ');');
        EXEC sys.sp_executesql @sql;
    END
    FETCH NEXT FROM fk_cur INTO @tbl, @col;
END
CLOSE fk_cur; DEALLOCATE fk_cur;
GO

/* 7.2 Indice de apoyo para chat */
DROP INDEX IF EXISTS IX_mensaje_conversacion_fecha ON dbo.Mensaje;
GO
CREATE NONCLUSTERED INDEX IX_mensaje_conversacion_fecha
    ON dbo.Mensaje (ID_conversacion_mensaje, fecha_mensaje);
GO

/* 7.3 Seed de catalogos nuevos */
IF NOT EXISTS (SELECT 1 FROM dbo.CaracteristicaVehiculo WHERE nombre_caracteristica = 'GPS')
    INSERT dbo.CaracteristicaVehiculo (nombre_caracteristica, categoria_caracteristica, activo_caracteristica) VALUES
        (N'GPS',                 'EQUIPAMIENTO', 1),
        (N'Aire acondicionado',  'CONFORT',      1),
        (N'Silla de bebe',       'SEGURIDAD',    1),
        (N'Bluetooth',           'CONECTIVIDAD', 1),
        (N'Camara de retroceso', 'SEGURIDAD',    1),
        (N'Control crucero',     'CONFORT',      1),
        (N'Conexion USB',        'CONECTIVIDAD', 1),
        (N'Airbags',             'SEGURIDAD',    1),
        (N'Frenos ABS',          'SEGURIDAD',    1),
        (N'Portaequipaje',       'EQUIPAMIENTO', 1),
        (N'Sensor de estacionamiento', 'SEGURIDAD', 1),
        (N'Asientos de cuero',   'CONFORT',      1);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.TipoCargoExtra WHERE nombre_tipo_cargo_extra = 'KM_EXCEDIDO')
    INSERT dbo.TipoCargoExtra (nombre_tipo_cargo_extra, descripcion_tipo_cargo_extra, activo_tipo_cargo_extra) VALUES
        ('COMBUSTIBLE',    N'Cargo por diferencia de combustible', 1),
        ('KM_EXCEDIDO',    N'Cargo por kilometraje excedido',      1),
        ('DANO',           N'Cargo por danos al vehiculo',         1),
        ('LIMPIEZA',       N'Cargo por limpieza especial',         1),
        ('MULTA_TRANSITO', N'Traspaso de multas de transito',      1),
        ('OTRO',           N'Otros cargos',                        1);
GO

/* Metodo de pago para la pasarela simulada (Webpay) */
IF NOT EXISTS (SELECT 1 FROM dbo.MetodoPago WHERE nombre_metodo_pago = 'WEBPAY_SIMULADO')
    INSERT dbo.MetodoPago (nombre_metodo_pago, activo_metodo_pago) VALUES ('WEBPAY_SIMULADO', 1);
GO

/* Comision real por defecto (15%) si la tabla Comision sigue en 0% */
UPDATE dbo.Comision SET porcentaje_comision = 15.00
WHERE ID_proveedor_comision IS NULL AND porcentaje_comision = 0.00 AND activo_comision = 1;
GO

/* 7.4 Seed Chile: 16 regiones, 56 provincias, 346 comunas.
   Reemplaza los placeholders (1 region / 1 comuna sin dependencias).
   SQL dinamico: el lote solo se compila si la columna ID_region_comuna aun existe. */
IF COL_LENGTH('dbo.Comuna','ID_region_comuna') IS NOT NULL
BEGIN
    EXEC(N'
        DELETE FROM dbo.Comuna
        WHERE ID_comuna IN (
            SELECT c.ID_comuna FROM dbo.Comuna c
            INNER JOIN dbo.Region r ON r.ID_region = c.ID_region_comuna
            WHERE r.nombre_region = ''Region Metropolitana''
              AND NOT EXISTS (SELECT 1 FROM dbo.SedeProveedor s WHERE s.ID_comuna_sede_proveedor = c.ID_comuna)
              AND NOT EXISTS (SELECT 1 FROM dbo.VehiculoComuna vc WHERE vc.ID_comuna_vehiculo_comuna = c.ID_comuna)
              AND NOT EXISTS (SELECT 1 FROM dbo.BusquedaGuardada b WHERE b.ID_comuna_busqueda = c.ID_comuna));');
    EXEC(N'
        DELETE FROM dbo.Region WHERE nombre_region = ''Region Metropolitana''
          AND NOT EXISTS (SELECT 1 FROM dbo.Comuna c WHERE c.ID_region_comuna = dbo.Region.ID_region);');
END
GO
IF NOT EXISTS (SELECT 1 FROM dbo.Region WHERE nombre_region = 'Arica y Parinacota')
BEGIN
SET IDENTITY_INSERT dbo.Region ON;
INSERT dbo.Region (ID_region, nombre_region, activo_region) VALUES (1, N'Arica y Parinacota', 1);
INSERT dbo.Region (ID_region, nombre_region, activo_region) VALUES (2, N'Tarapacá', 1);
INSERT dbo.Region (ID_region, nombre_region, activo_region) VALUES (3, N'Antofagasta', 1);
INSERT dbo.Region (ID_region, nombre_region, activo_region) VALUES (4, N'Atacama', 1);
INSERT dbo.Region (ID_region, nombre_region, activo_region) VALUES (5, N'Coquimbo', 1);
INSERT dbo.Region (ID_region, nombre_region, activo_region) VALUES (6, N'Valparaíso', 1);
INSERT dbo.Region (ID_region, nombre_region, activo_region) VALUES (7, N'Región del Libertador Gral. Bernardo O''Higgins', 1);
INSERT dbo.Region (ID_region, nombre_region, activo_region) VALUES (8, N'Región del Maule', 1);
INSERT dbo.Region (ID_region, nombre_region, activo_region) VALUES (9, N'Región de Ñuble', 1);
INSERT dbo.Region (ID_region, nombre_region, activo_region) VALUES (10, N'Región del Biobío', 1);
INSERT dbo.Region (ID_region, nombre_region, activo_region) VALUES (11, N'Región de la Araucanía', 1);
INSERT dbo.Region (ID_region, nombre_region, activo_region) VALUES (12, N'Región de los Ríos', 1);
INSERT dbo.Region (ID_region, nombre_region, activo_region) VALUES (13, N'Región de los Lagos', 1);
INSERT dbo.Region (ID_region, nombre_region, activo_region) VALUES (14, N'Región Aisén del Gral. Carlos Ibañez del Campo', 1);
INSERT dbo.Region (ID_region, nombre_region, activo_region) VALUES (15, N'Región de Magallanes y de la Antártica Chilena', 1);
INSERT dbo.Region (ID_region, nombre_region, activo_region) VALUES (16, N'Región Metropolitana de Santiago', 1);
SET IDENTITY_INSERT dbo.Region OFF;

SET IDENTITY_INSERT dbo.Provincia ON;
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (1, 1, N'Arica', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (2, 1, N'Parinacota', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (3, 2, N'Iquique', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (4, 2, N'Tamarugal', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (5, 3, N'Antofagasta', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (6, 3, N'El Loa', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (7, 3, N'Tocopilla', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (8, 4, N'Copiapó', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (9, 4, N'Chañaral', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (10, 4, N'Huasco', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (11, 5, N'Elqui', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (12, 5, N'Choapa', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (13, 5, N'Limarí', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (14, 6, N'Valparaíso', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (15, 6, N'Isla de Pascua', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (16, 6, N'Los Andes', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (17, 6, N'Petorca', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (18, 6, N'Quillota', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (19, 6, N'San Antonio', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (20, 6, N'San Felipe de Aconcagua', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (21, 6, N'Marga Marga', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (22, 7, N'Cachapoal', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (23, 7, N'Cardenal Caro', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (24, 7, N'Colchagua', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (25, 8, N'Talca', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (26, 8, N'Cauquenes', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (27, 8, N'Curicó', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (28, 8, N'Linares', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (29, 9, N'Diguillín', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (30, 9, N'Itata', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (31, 9, N'Punilla', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (32, 10, N'Concepción', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (33, 10, N'Arauco', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (34, 10, N'Biobío', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (35, 11, N'Cautín', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (36, 11, N'Malleco', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (37, 12, N'Valdivia', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (38, 12, N'Ranco', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (39, 13, N'Llanquihue', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (40, 13, N'Chiloé', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (41, 13, N'Osorno', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (42, 13, N'Palena', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (43, 14, N'Coyhaique', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (44, 14, N'Aisén', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (45, 14, N'Capitán Pratt', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (46, 14, N'General Carrera', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (47, 15, N'Magallanes', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (48, 15, N'Antártica Chilena', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (49, 15, N'Tierra del Fuego', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (50, 15, N'Última Esperanza', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (51, 16, N'Santiago', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (52, 16, N'Cordillera', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (53, 16, N'Chacabuco', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (54, 16, N'Maipo', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (55, 16, N'Mellipilla', 1);
INSERT dbo.Provincia (ID_provincia, ID_region_provincia, nombre_provincia, activo_provincia) VALUES (56, 16, N'Talagante', 1);
SET IDENTITY_INSERT dbo.Provincia OFF;
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Comuna WHERE codigo_comuna IS NOT NULL)
BEGIN
SET IDENTITY_INSERT dbo.Comuna ON;
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (1, 1, N'Arica', '15101', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (2, 1, N'Camarones', '15102', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (3, 2, N'Putre', '15201', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (4, 2, N'General Lagos', '15202', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (5, 3, N'Iquique', '01101', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (6, 3, N'Alto Hospicio', '01107', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (7, 4, N'Pozo Almonte', '01401', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (8, 4, N'Camiña', '01402', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (9, 4, N'Colchane', '01403', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (10, 4, N'Huara', '01404', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (11, 4, N'Pica', '01405', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (12, 5, N'Antofagasta', '02101', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (13, 5, N'Mejillones', '02102', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (14, 5, N'Sierra Gorda', '02103', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (15, 5, N'Taltal', '02104', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (16, 6, N'Calama', '02201', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (17, 6, N'Ollagüe', '02202', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (18, 6, N'San Pedro de Atacama', '02203', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (19, 7, N'Tocopilla', '02301', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (20, 7, N'María Elena', '02302', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (21, 8, N'Copiapó', '03101', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (22, 8, N'Caldera', '03102', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (23, 8, N'Tierra Amarilla', '03103', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (24, 9, N'Chañaral', '03201', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (25, 9, N'Diego de Almagro', '03202', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (26, 10, N'Vallenar', '03301', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (27, 10, N'Alto del Carmen', '03302', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (28, 10, N'Freirina', '03303', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (29, 10, N'Huasco', '03304', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (30, 11, N'La Serena', '04101', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (31, 11, N'Coquimbo', '04102', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (32, 11, N'Andacollo', '04103', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (33, 11, N'La Higuera', '04104', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (34, 11, N'Paiguano', '04105', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (35, 11, N'Vicuña', '04106', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (36, 12, N'Illapel', '04201', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (37, 12, N'Canela', '04202', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (38, 12, N'Los Vilos', '04203', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (39, 12, N'Salamanca', '04204', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (40, 13, N'Ovalle', '04301', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (41, 13, N'Combarbalá', '04302', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (42, 13, N'Monte Patria', '04303', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (43, 13, N'Punitaqui', '04304', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (44, 13, N'Río Hurtado', '04305', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (45, 14, N'Valparaíso', '05101', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (46, 14, N'Casablanca', '05102', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (47, 14, N'Concón', '05103', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (48, 14, N'Juan Fernández', '05104', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (49, 14, N'Puchuncaví', '05105', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (50, 14, N'Quintero', '05107', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (51, 14, N'Viña del Mar', '05109', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (52, 15, N'Isla de Pascua', '05201', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (53, 16, N'Los Andes', '05301', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (54, 16, N'Calle Larga', '05302', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (55, 16, N'Riconada', '05303', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (56, 16, N'San Esteban', '05304', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (57, 17, N'La Ligua', '05401', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (58, 17, N'Cabildo', '05402', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (59, 17, N'Papudo', '05403', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (60, 17, N'Petorca', '05404', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (61, 17, N'Zapallar', '05405', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (62, 18, N'Quillota', '05501', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (63, 18, N'La Calera', '05502', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (64, 18, N'Hijuelas', '05503', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (65, 18, N'La Cruz', '05504', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (66, 18, N'Nogales', '05506', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (67, 19, N'San Antonio', '05601', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (68, 19, N'Algarrobo', '05602', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (69, 19, N'Cartagena', '05603', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (70, 19, N'El Quisco', '05604', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (71, 19, N'El Tabo', '05605', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (72, 19, N'Santo Domingo', '05606', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (73, 20, N'San Felipe', '05701', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (74, 20, N'Catemu', '05702', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (75, 20, N'Llaillay', '05703', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (76, 20, N'Panquehue', '05704', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (77, 20, N'Putaendo', '05705', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (78, 20, N'Santa María', '05706', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (79, 21, N'Quilpué', '05801', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (80, 21, N'Limache', '05802', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (81, 21, N'Olmué', '05803', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (82, 21, N'Villa Alemana', '05804', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (83, 22, N'Rancagua', '06101', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (84, 22, N'Codegua', '06102', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (85, 22, N'Coinco', '06103', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (86, 22, N'Coltauco', '06104', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (87, 22, N'Doñihue', '06105', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (88, 22, N'Graneros', '06106', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (89, 22, N'Las Cabras', '06107', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (90, 22, N'Machalí', '06108', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (91, 22, N'Malloa', '06109', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (92, 22, N'Mostazal', '06110', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (93, 22, N'Olivar', '06111', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (94, 22, N'Peumo', '06112', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (95, 22, N'Pichidegua', '06113', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (96, 22, N'Quinta de Tilcoco', '06114', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (97, 22, N'Rengo', '06115', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (98, 22, N'Requínoa', '06116', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (99, 22, N'San Vicente', '06117', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (100, 23, N'Pichilemu', '06201', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (101, 23, N'La Estrella', '06202', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (102, 23, N'Litueche', '06203', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (103, 23, N'Marichihue', '06204', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (104, 23, N'Navidad', '06205', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (105, 23, N'Paredones', '06206', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (106, 24, N'San Fernando', '06301', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (107, 24, N'Chépica', '06302', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (108, 24, N'Chimbarongo', '06303', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (109, 24, N'Lolol', '06304', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (110, 24, N'Nancagua', '06305', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (111, 24, N'Palmilla', '06306', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (112, 24, N'Peralillo', '06307', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (113, 24, N'Placilla', '06308', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (114, 24, N'Pumanque', '06309', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (115, 24, N'Santa Cruz', '06310', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (116, 25, N'Talca', '07101', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (117, 25, N'Constitución', '07102', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (118, 25, N'Curepto', '07103', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (119, 25, N'Empedrado', '07104', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (120, 25, N'Maule', '07105', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (121, 25, N'Pelarco', '07106', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (122, 25, N'Pencahue', '07107', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (123, 25, N'Río Claro', '07108', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (124, 25, N'San Clemente', '07109', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (125, 25, N'San Rafael', '07110', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (126, 26, N'Cauquenes', '07201', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (127, 26, N'Chanco', '07202', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (128, 26, N'Pelluhue', '07203', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (129, 27, N'Curicó', '07301', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (130, 27, N'Hualañé', '07302', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (131, 27, N'Licantén', '07303', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (132, 27, N'Molina', '07304', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (133, 27, N'Rauco', '07305', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (134, 27, N'Romeral', '07306', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (135, 27, N'Sagrada Familia', '07307', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (136, 27, N'Teno', '07308', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (137, 27, N'Vichuquén', '07309', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (138, 28, N'Linares', '07401', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (139, 28, N'Colbún', '07402', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (140, 28, N'Longaví', '07403', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (141, 28, N'Parral', '07404', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (142, 28, N'Retiro', '07405', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (143, 28, N'San Javier', '07406', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (144, 28, N'Villa Alegre', '07407', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (145, 28, N'Yerbas Buenas', '07408', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (146, 29, N'Chillán', '16101', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (147, 29, N'Chillán Viejo', '16102', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (148, 29, N'Quillón', '16103', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (149, 29, N'Bulnes', '16104', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (150, 29, N'San Ignacio', '16105', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (151, 29, N'El Carmen', '16106', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (152, 29, N'Pinto', '16107', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (153, 29, N'Pemuco', '16108', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (154, 29, N'Yungay', '16109', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (155, 30, N'Quirihue', '16201', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (156, 30, N'Cobquecura', '16202', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (157, 30, N'Ninhue', '16203', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (158, 30, N'Treguaco', '16204', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (159, 30, N'Coelemu', '16205', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (160, 30, N'Portezuelo', '16206', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (161, 30, N'Ránqui', '16207', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (162, 31, N'San Carlos', '16301', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (163, 31, N'Ñiquén', '16302', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (164, 31, N'Coihueco', '16303', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (165, 31, N'San Fabián', '16304', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (166, 31, N'San Nico', '16305', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (167, 32, N'Concepción', '08101', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (168, 32, N'Coronel', '08102', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (169, 32, N'Chiguayante', '08103', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (170, 32, N'Florida', '08104', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (171, 32, N'Hualqui', '08105', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (172, 32, N'Lota', '08106', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (173, 32, N'Penco', '08107', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (174, 32, N'San Pedro de la Paz', '08108', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (175, 32, N'Santa Juana', '08109', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (176, 32, N'Talcahuano', '08110', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (177, 32, N'Tomé', '08111', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (178, 32, N'Hualpén', '08112', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (179, 33, N'Lebu', '08201', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (180, 33, N'Arauco', '08202', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (181, 33, N'Cañete', '08203', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (182, 33, N'Contulmo', '08204', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (183, 33, N'Curanilahue', '08205', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (184, 33, N'Los Álamos', '08206', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (185, 33, N'Tirúa', '08207', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (186, 34, N'Los Ángeles', '08301', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (187, 34, N'Antuco', '08302', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (188, 34, N'Cabrero', '08303', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (189, 34, N'Laja', '08304', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (190, 34, N'Mulchén', '08305', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (191, 34, N'Nacimiento', '08306', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (192, 34, N'Negrete', '08307', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (193, 34, N'Quilaco', '08308', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (194, 34, N'Quilleco', '08309', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (195, 34, N'San Rosendo', '08310', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (196, 34, N'Santa Bárbara', '08311', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (197, 34, N'Tucapel', '08312', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (198, 34, N'Yumbel', '08313', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (199, 34, N'Alto Biobío', '08314', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (200, 35, N'Temuco', '09101', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (201, 35, N'Carahue', '09102', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (202, 35, N'Cunco', '09103', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (203, 35, N'Curarrehue', '09104', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (204, 35, N'Freire', '09105', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (205, 35, N'Galvarino', '09106', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (206, 35, N'Gorbea', '09107', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (207, 35, N'Lautaro', '09108', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (208, 35, N'Loncoche', '09109', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (209, 35, N'Melipeuco', '09110', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (210, 35, N'Nueva Imperial', '09111', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (211, 35, N'Padre Las Casas', '09112', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (212, 35, N'Perquenco', '09113', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (213, 35, N'Pitrufquén', '09114', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (214, 35, N'Pucón', '09115', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (215, 35, N'Saavedra', '09116', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (216, 35, N'Teodoro Schmidt', '09117', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (217, 35, N'Toltén', '09118', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (218, 35, N'Vilcún', '09119', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (219, 35, N'Villarrica', '09120', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (220, 35, N'Cholchol', '09121', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (221, 36, N'Angol', '09201', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (222, 36, N'Collipulli', '09202', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (223, 36, N'Curacautín', '09203', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (224, 36, N'Ercilla', '09204', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (225, 36, N'Lonquimay', '09205', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (226, 36, N'Los Sauces', '09206', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (227, 36, N'Lumaco', '09207', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (228, 36, N'Purén', '09208', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (229, 36, N'Renaico', '09209', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (230, 36, N'Traiguén', '09210', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (231, 36, N'Victoria', '09211', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (232, 37, N'Valdivia', '14101', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (233, 37, N'Corral', '14102', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (234, 37, N'Lanco', '14103', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (235, 37, N'Los Lagos', '14104', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (236, 37, N'Máfil', '14105', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (237, 37, N'Mariquina', '14106', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (238, 37, N'Paillaco', '14107', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (239, 37, N'Panguipulli', '14108', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (240, 38, N'La Unión', '14201', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (241, 38, N'Futrono', '14202', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (242, 38, N'Lago Ranco', '14203', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (243, 38, N'Río Bueno', '14204', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (244, 39, N'Puerto Montt', '10101', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (245, 39, N'Calbuco', '10102', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (246, 39, N'Cochamó', '10103', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (247, 39, N'Fresia', '10104', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (248, 39, N'Frutillar', '10105', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (249, 39, N'Los Muermos', '10106', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (250, 39, N'Llanquihue', '10107', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (251, 39, N'Maullín', '10108', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (252, 39, N'Puerto Varas', '10109', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (253, 40, N'Castro', '10201', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (254, 40, N'Ancud', '10202', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (255, 40, N'Chonchi', '10203', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (256, 40, N'Curaco de Vélez', '10204', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (257, 40, N'Dalcahue', '10205', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (258, 40, N'Puqueldón', '10206', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (259, 40, N'Queilén', '10207', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (260, 40, N'Quellón', '10208', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (261, 40, N'Quemchi', '10209', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (262, 40, N'Quinchao', '10210', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (263, 41, N'Osorno', '10301', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (264, 41, N'Puerto Octay', '10302', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (265, 41, N'Purranque', '10303', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (266, 41, N'Puyehue', '10304', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (267, 41, N'Río Negro', '10305', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (268, 41, N'San Juan de la Costa', '10306', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (269, 41, N'San Pablo', '10307', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (270, 42, N'Chaitén', '10401', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (271, 42, N'Futaleufú', '10402', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (272, 42, N'Hualaihué', '10403', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (273, 42, N'Palena', '10404', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (274, 43, N'Coihaique', '11101', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (275, 43, N'Lago Verde', '11102', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (276, 44, N'Aisén', '11201', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (277, 44, N'Cisnes', '11202', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (278, 44, N'Guaitecas', '11203', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (279, 45, N'Cochrane', '11301', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (280, 45, N'O''Higgins', '11302', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (281, 45, N'Tortel', '11303', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (282, 46, N'Chile Chico', '11401', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (283, 46, N'Río Ibáñez', '11402', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (284, 47, N'Punta Arenas', '12101', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (285, 47, N'Laguna Blanca', '12102', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (286, 47, N'Río Verde', '12103', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (287, 47, N'San Gregorio', '12104', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (288, 48, N'Cabo de Hornos', '12201', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (289, 48, N'Antártica', '12202', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (290, 49, N'Porvenir', '12301', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (291, 49, N'Primavera', '12302', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (292, 49, N'Timaukel', '12303', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (293, 50, N'Natales', '12401', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (294, 50, N'Torres del Paine', '12402', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (295, 51, N'Santiago', '13101', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (296, 51, N'Cerrillos', '13102', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (297, 51, N'Cerro Navia', '13103', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (298, 51, N'Conchalí', '13104', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (299, 51, N'El Bosque', '13105', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (300, 51, N'Estación Central', '13106', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (301, 51, N'Huechuraba', '13107', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (302, 51, N'Independencia', '13108', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (303, 51, N'La Cisterna', '13109', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (304, 51, N'La Florida', '13110', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (305, 51, N'La Granja', '13111', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (306, 51, N'La Pintana', '13112', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (307, 51, N'La Reina', '13113', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (308, 51, N'Las Condes', '13114', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (309, 51, N'Lo Barnechea', '13115', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (310, 51, N'Lo Espejo', '13116', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (311, 51, N'Lo Prado', '13117', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (312, 51, N'Macul', '13118', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (313, 51, N'Maipú', '13119', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (314, 51, N'Ñuñoa', '13120', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (315, 51, N'Pedro Aguirre Cerda', '13121', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (316, 51, N'Peñalolén', '13122', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (317, 51, N'Providencia', '13123', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (318, 51, N'Pudahuel', '13124', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (319, 51, N'Quilicura', '13125', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (320, 51, N'Quinta Normal', '13126', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (321, 51, N'Recoleta', '13127', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (322, 51, N'Renca', '13128', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (323, 51, N'San Joaquín', '13129', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (324, 51, N'San Miguel', '13130', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (325, 51, N'San Ramón', '13131', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (326, 51, N'Vitacura', '13132', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (327, 52, N'Puente Alto', '13201', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (328, 52, N'Pirque', '13202', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (329, 52, N'San José de Maipo', '13203', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (330, 53, N'Colina', '13301', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (331, 53, N'Lampa', '13302', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (332, 53, N'Tiltil', '13303', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (333, 54, N'San Bernardo', '13401', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (334, 54, N'Buin', '13402', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (335, 54, N'Calera de Tango', '13403', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (336, 54, N'Paine', '13404', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (337, 55, N'Melipilla', '13501', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (338, 55, N'Alhué', '13502', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (339, 55, N'Curacaví', '13503', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (340, 55, N'María Pinto', '13504', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (341, 55, N'San Pedro', '13505', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (342, 56, N'Talagante', '13601', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (343, 56, N'El Monte', '13602', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (344, 56, N'Isla de Maipo', '13603', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (345, 56, N'Padre Hurtado', '13604', 1);
INSERT dbo.Comuna (ID_comuna, ID_provincia_comuna, nombre_comuna, codigo_comuna, activo_comuna) VALUES (346, 56, N'Peñaflor', '13605', 1);
SET IDENTITY_INSERT dbo.Comuna OFF;
END
GO

/* La vista depende de ID_region_comuna: se elimina antes de migrar la estructura. */
IF OBJECT_ID('dbo.vw_VehiculosPublicados','V') IS NOT NULL
    DROP VIEW dbo.vw_VehiculosPublicados;
GO

/* Migrar Comuna a dependencia de Provincia (3FN) y quitar la Region directa */
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_comuna_provincia')
BEGIN
    UPDATE c SET c.ID_provincia_comuna = p.ID_provincia
    FROM dbo.Comuna c
    INNER JOIN dbo.Provincia p ON p.ID_provincia = c.ID_provincia_comuna
    WHERE c.ID_provincia_comuna IS NOT NULL;

    ALTER TABLE dbo.Comuna ALTER COLUMN ID_provincia_comuna INT NOT NULL;
    ALTER TABLE dbo.Comuna ADD CONSTRAINT FK_comuna_provincia
        FOREIGN KEY (ID_provincia_comuna) REFERENCES dbo.Provincia(ID_provincia);
END
GO
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_comuna_region')
    ALTER TABLE dbo.Comuna DROP CONSTRAINT FK_comuna_region;
GO
IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = 'UQ_comuna_region_nombre')
    ALTER TABLE dbo.Comuna DROP CONSTRAINT UQ_comuna_region_nombre;
GO
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Comuna') AND name = 'ID_region_comuna')
    ALTER TABLE dbo.Comuna DROP COLUMN ID_region_comuna;
GO
IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = 'UQ_comuna_provincia_nombre')
    ALTER TABLE dbo.Comuna ADD CONSTRAINT UQ_comuna_provincia_nombre UNIQUE (ID_provincia_comuna, nombre_comuna);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_comuna_codigo' AND object_id = OBJECT_ID('dbo.Comuna'))
    ALTER TABLE dbo.Comuna ADD CONSTRAINT UQ_comuna_codigo UNIQUE (codigo_comuna);
GO

/* FK de TipoCargoExtra en CargoExtra */
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_cargo_extra_tipo')
    ALTER TABLE dbo.CargoExtra ADD CONSTRAINT FK_cargo_extra_tipo
        FOREIGN KEY (ID_tipo_cargo_extra_cargo_extra) REFERENCES dbo.TipoCargoExtra(ID_tipo_cargo_extra);
GO

/* Actualizar la vista de vehiculos publicados a la nueva jerarquia */
IF OBJECT_ID('dbo.vw_VehiculosPublicados','V') IS NOT NULL
    DROP VIEW dbo.vw_VehiculosPublicados;
GO
CREATE VIEW dbo.vw_VehiculosPublicados
AS
SELECT
    v.ID_vehiculo,
    v.patente_vehiculo,
    v.anio_vehiculo,
    v.kilometraje_vehiculo,
    v.precio_diario_base_vehiculo,
    p.ID_proveedor,
    p.nombre_comercial_proveedor,
    tp.nombre_tipo_proveedor,
    m.nombre_marca,
    mo.nombre_modelo,
    tv.nombre_tipo_vehiculo,
    ev.nombre_estado_vehiculo,
    ep.nombre_estado_publicacion_vehiculo,
    s.ID_sede_proveedor,
    s.nombre_sede_proveedor,
    c.nombre_comuna,
    pr.nombre_provincia,
    r.nombre_region,
    (SELECT TOP 1 f.url_foto_vehiculo
     FROM VehiculoFoto f
     WHERE f.ID_vehiculo_vehiculo_foto = v.ID_vehiculo
       AND f.es_principal_foto = 1
       AND f.activo_foto_vehiculo = 1
     ORDER BY f.fecha_subida_foto DESC, f.ID_foto_vehiculo DESC) AS url_foto_principal
FROM Vehiculo v
INNER JOIN Proveedor p ON p.ID_proveedor = v.ID_proveedor_vehiculo
INNER JOIN TipoProveedor tp ON tp.ID_tipo_proveedor = p.ID_tipo_proveedor_proveedor
INNER JOIN Modelo mo ON mo.ID_modelo = v.ID_modelo_vehiculo
INNER JOIN Marca m ON m.ID_marca = mo.ID_marca_modelo
INNER JOIN TipoVehiculo tv ON tv.ID_tipo_vehiculo = v.ID_tipo_vehiculo_vehiculo
INNER JOIN EstadoVehiculo ev ON ev.ID_estado_vehiculo = v.ID_estado_vehiculo_vehiculo
INNER JOIN EstadoPublicacionVehiculo ep ON ep.ID_estado_publicacion_vehiculo = v.ID_estado_publicacion_vehiculo_vehiculo
LEFT JOIN SedeProveedor s ON s.ID_sede_proveedor = v.ID_sede_actual_vehiculo
LEFT JOIN Comuna c ON c.ID_comuna = s.ID_comuna_sede_proveedor
LEFT JOIN Provincia pr ON pr.ID_provincia = c.ID_provincia_comuna
LEFT JOIN Region r ON r.ID_region = pr.ID_region_provincia
WHERE p.ID_estado_proveedor_proveedor =
      (SELECT ID_estado_proveedor FROM EstadoProveedor WHERE nombre_estado_proveedor = 'APROBADO')
  AND ep.nombre_estado_publicacion_vehiculo = 'PUBLICADO'
  AND ev.nombre_estado_vehiculo <> 'FUERA_DE_SERVICIO'
  AND v.fecha_baja_vehiculo IS NULL
  AND p.fecha_baja_proveedor IS NULL;
GO

/* 7.5 Seguridad: roles de minimo privilegio */
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'db_rentacar_rw')
    CREATE ROLE db_rentacar_rw;
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'db_rentacar_ro')
    CREATE ROLE db_rentacar_ro;
GO
-- La app ejecuta SPs y lee catalogos/vistas; no escribe tablas directamente.
GRANT EXECUTE ON SCHEMA::dbo TO db_rentacar_rw;
GRANT SELECT  ON SCHEMA::dbo TO db_rentacar_rw;
DENY INSERT, UPDATE, DELETE ON dbo.Reserva TO db_rentacar_rw;
DENY INSERT, UPDATE, DELETE ON dbo.Pago TO db_rentacar_rw;
DENY INSERT, UPDATE, DELETE ON dbo.Arriendo TO db_rentacar_rw;
DENY INSERT, UPDATE, DELETE ON dbo.Vehiculo TO db_rentacar_rw;
GRANT SELECT ON SCHEMA::dbo TO db_rentacar_ro;
GO

/* 7.6 Saneamiento de configuracion de la base (desarrollo) */
ALTER DATABASE [RentaCarDB] SET ANSI_NULLS ON;
ALTER DATABASE [RentaCarDB] SET QUOTED_IDENTIFIER ON;
ALTER DATABASE [RentaCarDB] SET AUTO_CLOSE OFF;
ALTER DATABASE [RentaCarDB] SET AUTO_SHRINK OFF;
ALTER DATABASE [RentaCarDB] SET RECOVERY SIMPLE;
ALTER DATABASE [RentaCarDB] SET PAGE_VERIFY CHECKSUM;
GO
/* RCSI requiere acceso exclusivo; descomentar si no hay sesiones activas. */
-- ALTER DATABASE [RentaCarDB] SET READ_COMMITTED_SNAPSHOT ON WITH ROLLBACK IMMEDIATE;
GO

/* ============================================================================
   FASE 8 - VALIDACION
   ============================================================================ */
SELECT 'Comunas' AS entidad, COUNT(*) AS total FROM dbo.Comuna
UNION ALL SELECT 'Provincias', COUNT(*) FROM dbo.Provincia
UNION ALL SELECT 'Regiones', COUNT(*) FROM dbo.Region
UNION ALL SELECT 'CaracteristicasVehiculo', COUNT(*) FROM dbo.CaracteristicaVehiculo
UNION ALL SELECT 'TiposCargoExtra', COUNT(*) FROM dbo.TipoCargoExtra
UNION ALL SELECT 'ConfiguracionGlobal', COUNT(*) FROM dbo.ConfiguracionGlobal
UNION ALL SELECT 'Reservas con moneda NULL', COUNT(*) FROM dbo.Reserva WHERE moneda_reserva IS NULL;
GO
EXEC dbo.sp_V5_ValidarIntegridad;
GO

/* ============================================================================
   FIN DEL SCRIPT MAESTRO
   ============================================================================ */
