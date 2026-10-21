/* -----------------------------------------------------------------------------
   04_sp_crud_s1.sql

   Stored procedures de escritura que faltaban para el Sprint S1.
   Permiten que la API mantenga el modelo de seguridad (api_user solo
   EXECUTE/SELECT) sin escribir tablas directamente.

   Idempotente: usa CREATE OR ALTER (SQL Server 2016 SP1+).
   Aplicar sobre la base RentaCarDB.
   ----------------------------------------------------------------------------- */
USE [RentaCarDB];
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

/* ============================ Perfil de usuario ============================ */
CREATE OR ALTER PROCEDURE [dbo].[sp_ActualizarPerfilUsuario]
    @ID_usuario       INT,
    @nombres          NVARCHAR(80) = NULL,
    @apellido_paterno NVARCHAR(50) = NULL,
    @apellido_materno NVARCHAR(50) = NULL,
    @telefono         VARCHAR(20)  = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ID_persona INT;

    SELECT @ID_persona = ID_persona_usuario FROM Usuario WHERE ID_usuario = @ID_usuario;
    IF @ID_persona IS NULL THROW 54001, 'Usuario no existe.', 1;

    UPDATE Persona
    SET nombres_persona           = COALESCE(@nombres, nombres_persona),
        apellido_paterno_persona  = COALESCE(@apellido_paterno, apellido_paterno_persona),
        apellido_materno_persona  = COALESCE(@apellido_materno, apellido_materno_persona),
        telefono_persona          = COALESCE(@telefono, telefono_persona)
    WHERE ID_persona = @ID_persona;

    SELECT u.ID_usuario, p.rut_persona, p.nombres_persona, p.apellido_paterno_persona,
           p.apellido_materno_persona, p.telefono_persona,
           u.email_usuario, u.email_confirmado_usuario
    FROM Usuario u
    INNER JOIN Persona p ON p.ID_persona = u.ID_persona_usuario
    WHERE u.ID_usuario = @ID_usuario;
END
GO

/* ============================== Roles / vinculo ============================= */
CREATE OR ALTER PROCEDURE [dbo].[sp_AsignarRolUsuario]
    @ID_usuario          INT,
    @rol                 VARCHAR(50),
    @ID_usuario_ejecutor INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ID_rol INT, @es_admin BIT = 0;

    IF NOT EXISTS (SELECT 1 FROM Usuario WHERE ID_usuario = @ID_usuario)
        THROW 54002, 'Usuario no existe.', 1;
    IF NOT EXISTS (SELECT 1 FROM Usuario WHERE ID_usuario = @ID_usuario_ejecutor)
        THROW 54004, 'Usuario ejecutor no existe.', 1;

    SELECT @ID_rol = ID_rol FROM Rol WHERE nombre_rol = @rol;
    IF @ID_rol IS NULL THROW 54003, 'Rol invalido.', 1;

    IF EXISTS (
        SELECT 1 FROM UsuarioRol ur
        INNER JOIN Rol r ON r.ID_rol = ur.ID_rol_usuario_rol
        WHERE ur.ID_usuario_usuario_rol = @ID_usuario_ejecutor AND r.nombre_rol = 'ADMIN')
        SET @es_admin = 1;

    IF @rol = 'ADMIN' AND @es_admin = 0
        THROW 54005, 'Solo un ADMIN puede asignar el rol ADMIN.', 1;
    IF @es_admin = 0 AND @ID_usuario_ejecutor <> @ID_usuario
        THROW 54006, 'No puede asignar roles a otros usuarios.', 1;

    IF NOT EXISTS (
        SELECT 1 FROM UsuarioRol
        WHERE ID_usuario_usuario_rol = @ID_usuario AND ID_rol_usuario_rol = @ID_rol)
        INSERT INTO UsuarioRol (ID_usuario_usuario_rol, ID_rol_usuario_rol, fecha_asignacion_usuario_rol)
        VALUES (@ID_usuario, @ID_rol, SYSDATETIME());

    SELECT @ID_usuario AS ID_usuario, @rol AS rol;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_VincularUsuarioProveedor]
    @ID_proveedor     INT,
    @ID_usuario       INT,
    @es_administrador BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM Proveedor WHERE ID_proveedor = @ID_proveedor)
        THROW 54007, 'Proveedor no existe.', 1;
    IF NOT EXISTS (SELECT 1 FROM Usuario WHERE ID_usuario = @ID_usuario)
        THROW 54008, 'Usuario no existe.', 1;

    IF EXISTS (
        SELECT 1 FROM ProveedorUsuario
        WHERE ID_proveedor_proveedor_usuario = @ID_proveedor AND ID_usuario_proveedor_usuario = @ID_usuario)
        UPDATE ProveedorUsuario
        SET es_administrador_proveedor_usuario = @es_administrador
        WHERE ID_proveedor_proveedor_usuario = @ID_proveedor AND ID_usuario_proveedor_usuario = @ID_usuario;
    ELSE
        INSERT INTO ProveedorUsuario
            (ID_proveedor_proveedor_usuario, ID_usuario_proveedor_usuario, fecha_vinculacion_proveedor_usuario, es_administrador_proveedor_usuario)
        VALUES (@ID_proveedor, @ID_usuario, SYSDATETIME(), @es_administrador);

    SELECT @ID_proveedor AS ID_proveedor, @ID_usuario AS ID_usuario;
END
GO

/* ================================== Sedes =================================== */
CREATE OR ALTER PROCEDURE [dbo].[sp_RegistrarSedeProveedor]
    @ID_proveedor INT,
    @ID_comuna    INT,
    @nombre       NVARCHAR(100),
    @direccion    NVARCHAR(200),
    @telefono     VARCHAR(20)  = NULL,
    @email        VARCHAR(150) = NULL,
    @activo       BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM Proveedor WHERE ID_proveedor = @ID_proveedor)
        THROW 54010, 'Proveedor no existe.', 1;
    IF NOT EXISTS (SELECT 1 FROM Comuna WHERE ID_comuna = @ID_comuna)
        THROW 54011, 'Comuna no existe.', 1;
    IF EXISTS (
        SELECT 1 FROM SedeProveedor
        WHERE ID_proveedor_sede_proveedor = @ID_proveedor AND nombre_sede_proveedor = @nombre)
        THROW 54012, 'Ya existe una sede con ese nombre para el proveedor.', 1;

    INSERT INTO SedeProveedor
        (ID_proveedor_sede_proveedor, ID_comuna_sede_proveedor, nombre_sede_proveedor,
         direccion_sede_proveedor, telefono_sede_proveedor, email_sede_proveedor, activo_sede_proveedor)
    VALUES (@ID_proveedor, @ID_comuna, @nombre, @direccion, @telefono, @email, @activo);

    SELECT * FROM SedeProveedor WHERE ID_sede_proveedor = SCOPE_IDENTITY();
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_ActualizarSedeProveedor]
    @ID_sede      INT,
    @ID_proveedor INT,
    @ID_comuna    INT = NULL,
    @nombre       NVARCHAR(100) = NULL,
    @direccion    NVARCHAR(200) = NULL,
    @telefono     VARCHAR(20)  = NULL,
    @email        VARCHAR(150) = NULL,
    @activo       BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1 FROM SedeProveedor
        WHERE ID_sede_proveedor = @ID_sede AND ID_proveedor_sede_proveedor = @ID_proveedor)
        THROW 54013, 'Sede no encontrada o no pertenece al proveedor.', 1;
    IF @ID_comuna IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Comuna WHERE ID_comuna = @ID_comuna)
        THROW 54011, 'Comuna no existe.', 1;

    UPDATE SedeProveedor
    SET ID_comuna_sede_proveedor = COALESCE(@ID_comuna, ID_comuna_sede_proveedor),
        nombre_sede_proveedor    = COALESCE(@nombre, nombre_sede_proveedor),
        direccion_sede_proveedor = COALESCE(@direccion, direccion_sede_proveedor),
        telefono_sede_proveedor  = COALESCE(@telefono, telefono_sede_proveedor),
        email_sede_proveedor     = COALESCE(@email, email_sede_proveedor),
        activo_sede_proveedor    = COALESCE(@activo, activo_sede_proveedor)
    WHERE ID_sede_proveedor = @ID_sede;

    SELECT * FROM SedeProveedor WHERE ID_sede_proveedor = @ID_sede;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_EliminarSedeProveedor]
    @ID_sede      INT,
    @ID_proveedor INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1 FROM SedeProveedor
        WHERE ID_sede_proveedor = @ID_sede AND ID_proveedor_sede_proveedor = @ID_proveedor)
        THROW 54013, 'Sede no encontrada o no pertenece al proveedor.', 1;

    UPDATE SedeProveedor SET activo_sede_proveedor = 0 WHERE ID_sede_proveedor = @ID_sede;

    SELECT @ID_sede AS ID_sede_proveedor, CAST(0 AS BIT) AS activo_sede_proveedor;
END
GO

/* ========================= Configuracion de proveedor ======================= */
CREATE OR ALTER PROCEDURE [dbo].[sp_ActualizarConfiguracionProveedor]
    @ID_proveedor                 INT,
    @permite_devolucion_otra_sede BIT = NULL,
    @permite_entrega_domicilio    BIT = NULL,
    @permite_retiro_domicilio     BIT = NULL,
    @radio_maximo_km              DECIMAL(8,2) = NULL,
    @minutos_expiracion_reserva   INT = NULL,
    @edad_minima_arriendo         INT = NULL,
    @requiere_deposito            BIT = NULL,
    @monto_deposito               DECIMAL(14,2) = NULL,
    @dias_minimos_arriendo        INT = NULL,
    @dias_maximos_arriendo        INT = NULL,
    @moneda_operacion             CHAR(3) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1 FROM ConfiguracionProveedor
        WHERE ID_proveedor_configuracion_proveedor = @ID_proveedor)
        THROW 54014, 'Configuracion del proveedor no existe.', 1;
    IF @dias_minimos_arriendo IS NOT NULL AND @dias_maximos_arriendo IS NOT NULL
       AND @dias_maximos_arriendo < @dias_minimos_arriendo
        THROW 54015, 'Los dias maximos no pueden ser menores que los minimos.', 1;

    UPDATE ConfiguracionProveedor
    SET permite_devolucion_otra_sede = COALESCE(@permite_devolucion_otra_sede, permite_devolucion_otra_sede),
        permite_entrega_domicilio    = COALESCE(@permite_entrega_domicilio, permite_entrega_domicilio),
        permite_retiro_domicilio     = COALESCE(@permite_retiro_domicilio, permite_retiro_domicilio),
        radio_maximo_km              = COALESCE(@radio_maximo_km, radio_maximo_km),
        minutos_expiracion_reserva   = COALESCE(@minutos_expiracion_reserva, minutos_expiracion_reserva),
        edad_minima_arriendo         = COALESCE(@edad_minima_arriendo, edad_minima_arriendo),
        requiere_deposito            = COALESCE(@requiere_deposito, requiere_deposito),
        monto_deposito               = COALESCE(@monto_deposito, monto_deposito),
        dias_minimos_arriendo        = COALESCE(@dias_minimos_arriendo, dias_minimos_arriendo),
        dias_maximos_arriendo        = COALESCE(@dias_maximos_arriendo, dias_maximos_arriendo),
        moneda_operacion             = COALESCE(@moneda_operacion, moneda_operacion)
    WHERE ID_proveedor_configuracion_proveedor = @ID_proveedor;

    SELECT * FROM ConfiguracionProveedor WHERE ID_proveedor_configuracion_proveedor = @ID_proveedor;
END
GO

/* ================================ Vehiculos ================================= */
CREATE OR ALTER PROCEDURE [dbo].[sp_RegistrarVehiculo]
    @ID_proveedor          INT,
    @ID_modelo             INT,
    @ID_tipo_vehiculo      INT,
    @ID_tipo_combustible   INT,
    @ID_tipo_transmision   INT,
    @patente               VARCHAR(10),
    @vin                   VARCHAR(17),
    @anio                  SMALLINT,
    @kilometraje           INT,
    @precio_diario_base    DECIMAL(12,2),
    @ID_sede_actual        INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM Proveedor WHERE ID_proveedor = @ID_proveedor)
        THROW 54020, 'Proveedor no existe.', 1;
    IF EXISTS (SELECT 1 FROM Vehiculo WHERE patente_vehiculo = @patente)
        THROW 54021, 'Ya existe un vehiculo con esa patente.', 1;
    IF EXISTS (SELECT 1 FROM Vehiculo WHERE vin_vehiculo = @vin)
        THROW 54022, 'Ya existe un vehiculo con ese VIN.', 1;
    IF @precio_diario_base <= 0
        THROW 54023, 'El precio diario debe ser mayor que cero.', 1;
    IF @anio < 1950 OR @anio > YEAR(GETDATE()) + 1
        THROW 54024, 'Anio de vehiculo invalido.', 1;
    IF @kilometraje < 0
        THROW 54025, 'Kilometraje invalido.', 1;
    IF @ID_sede_actual IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM SedeProveedor
        WHERE ID_sede_proveedor = @ID_sede_actual AND ID_proveedor_sede_proveedor = @ID_proveedor)
        THROW 54026, 'La sede no pertenece al proveedor.', 1;

    DECLARE @ID_estado_disponible INT =
        (SELECT ID_estado_vehiculo FROM EstadoVehiculo WHERE nombre_estado_vehiculo = 'DISPONIBLE');
    DECLARE @ID_publicacion_pendiente INT =
        (SELECT ID_estado_publicacion_vehiculo FROM EstadoPublicacionVehiculo WHERE nombre_estado_publicacion_vehiculo = 'PENDIENTE');

    INSERT INTO Vehiculo
        (ID_proveedor_vehiculo, ID_sede_actual_vehiculo, ID_modelo_vehiculo,
         ID_tipo_vehiculo_vehiculo, ID_tipo_combustible_vehiculo, ID_tipo_transmision_vehiculo,
         ID_estado_vehiculo_vehiculo, ID_estado_publicacion_vehiculo_vehiculo,
         patente_vehiculo, vin_vehiculo, anio_vehiculo, kilometraje_vehiculo,
         precio_diario_base_vehiculo, fecha_registro_vehiculo)
    VALUES
        (@ID_proveedor, @ID_sede_actual, @ID_modelo,
         @ID_tipo_vehiculo, @ID_tipo_combustible, @ID_tipo_transmision,
         @ID_estado_disponible, @ID_publicacion_pendiente,
         @patente, @vin, @anio, @kilometraje,
         @precio_diario_base, SYSDATETIME());

    SELECT * FROM Vehiculo WHERE ID_vehiculo = SCOPE_IDENTITY();
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_ActualizarVehiculo]
    @ID_vehiculo          INT,
    @ID_proveedor         INT,
    @ID_modelo            INT = NULL,
    @ID_tipo_vehiculo     INT = NULL,
    @ID_tipo_combustible  INT = NULL,
    @ID_tipo_transmision  INT = NULL,
    @ID_estado_vehiculo   INT = NULL,
    @ID_sede_actual       INT = NULL,
    @anio                 SMALLINT = NULL,
    @kilometraje          INT = NULL,
    @precio_diario_base   DECIMAL(12,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1 FROM Vehiculo
        WHERE ID_vehiculo = @ID_vehiculo AND ID_proveedor_vehiculo = @ID_proveedor)
        THROW 54027, 'Vehiculo no encontrado o no pertenece al proveedor.', 1;
    IF @precio_diario_base IS NOT NULL AND @precio_diario_base <= 0
        THROW 54023, 'El precio diario debe ser mayor que cero.', 1;
    IF @kilometraje IS NOT NULL AND @kilometraje < 0
        THROW 54025, 'Kilometraje invalido.', 1;
    IF @ID_sede_actual IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM SedeProveedor
        WHERE ID_sede_proveedor = @ID_sede_actual AND ID_proveedor_sede_proveedor = @ID_proveedor)
        THROW 54026, 'La sede no pertenece al proveedor.', 1;

    UPDATE Vehiculo
    SET ID_modelo_vehiculo            = COALESCE(@ID_modelo, ID_modelo_vehiculo),
        ID_tipo_vehiculo_vehiculo     = COALESCE(@ID_tipo_vehiculo, ID_tipo_vehiculo_vehiculo),
        ID_tipo_combustible_vehiculo  = COALESCE(@ID_tipo_combustible, ID_tipo_combustible_vehiculo),
        ID_tipo_transmision_vehiculo  = COALESCE(@ID_tipo_transmision, ID_tipo_transmision_vehiculo),
        ID_estado_vehiculo_vehiculo   = COALESCE(@ID_estado_vehiculo, ID_estado_vehiculo_vehiculo),
        ID_sede_actual_vehiculo       = COALESCE(@ID_sede_actual, ID_sede_actual_vehiculo),
        anio_vehiculo                 = COALESCE(@anio, anio_vehiculo),
        kilometraje_vehiculo          = COALESCE(@kilometraje, kilometraje_vehiculo),
        precio_diario_base_vehiculo   = COALESCE(@precio_diario_base, precio_diario_base_vehiculo)
    WHERE ID_vehiculo = @ID_vehiculo;

    SELECT * FROM Vehiculo WHERE ID_vehiculo = @ID_vehiculo;
END
GO

/* ============================== Fotos vehiculo ============================== */
CREATE OR ALTER PROCEDURE [dbo].[sp_RegistrarVehiculoFoto]
    @ID_vehiculo  INT,
    @ID_proveedor INT,
    @url_foto     VARCHAR(500),
    @es_principal BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1 FROM Vehiculo
        WHERE ID_vehiculo = @ID_vehiculo AND ID_proveedor_vehiculo = @ID_proveedor)
        THROW 54027, 'Vehiculo no encontrado o no pertenece al proveedor.', 1;

    IF @es_principal = 1
        UPDATE VehiculoFoto SET es_principal_foto = 0
        WHERE ID_vehiculo_vehiculo_foto = @ID_vehiculo;

    INSERT INTO VehiculoFoto
        (ID_vehiculo_vehiculo_foto, url_foto_vehiculo, es_principal_foto, activo_foto_vehiculo, fecha_subida_foto)
    VALUES (@ID_vehiculo, @url_foto, @es_principal, 1, SYSDATETIME());

    SELECT * FROM VehiculoFoto WHERE ID_foto_vehiculo = SCOPE_IDENTITY();
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_EliminarVehiculoFoto]
    @ID_foto      INT,
    @ID_proveedor INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1 FROM VehiculoFoto vf
        INNER JOIN Vehiculo v ON v.ID_vehiculo = vf.ID_vehiculo_vehiculo_foto
        WHERE vf.ID_foto_vehiculo = @ID_foto AND v.ID_proveedor_vehiculo = @ID_proveedor)
        THROW 54028, 'Foto no encontrada o no pertenece al proveedor.', 1;

    UPDATE VehiculoFoto SET activo_foto_vehiculo = 0 WHERE ID_foto_vehiculo = @ID_foto;

    SELECT @ID_foto AS ID_foto_vehiculo;
END
GO

/* ========================== Caracteristicas vehiculo ======================== */
CREATE OR ALTER PROCEDURE [dbo].[sp_AgregarCaracteristicaVehiculo]
    @ID_vehiculo       INT,
    @ID_proveedor      INT,
    @ID_caracteristica INT,
    @disponible        BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1 FROM Vehiculo
        WHERE ID_vehiculo = @ID_vehiculo AND ID_proveedor_vehiculo = @ID_proveedor)
        THROW 54027, 'Vehiculo no encontrado o no pertenece al proveedor.', 1;
    IF NOT EXISTS (SELECT 1 FROM CaracteristicaVehiculo WHERE ID_caracteristica_vehiculo = @ID_caracteristica)
        THROW 54029, 'Caracteristica no existe.', 1;

    IF EXISTS (
        SELECT 1 FROM VehiculoCaracteristica
        WHERE ID_vehiculo_vehiculo_caracteristica = @ID_vehiculo
          AND ID_caracteristica_vehiculo_caracteristica = @ID_caracteristica)
        UPDATE VehiculoCaracteristica
        SET disponible_vehiculo_caracteristica = @disponible
        WHERE ID_vehiculo_vehiculo_caracteristica = @ID_vehiculo
          AND ID_caracteristica_vehiculo_caracteristica = @ID_caracteristica;
    ELSE
        INSERT INTO VehiculoCaracteristica
            (ID_vehiculo_vehiculo_caracteristica, ID_caracteristica_vehiculo_caracteristica,
             disponible_vehiculo_caracteristica, fecha_registro_vehiculo_caracteristica)
        VALUES (@ID_vehiculo, @ID_caracteristica, @disponible, SYSDATETIME());

    SELECT @ID_vehiculo AS ID_vehiculo, @ID_caracteristica AS ID_caracteristica, @disponible AS disponible;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_QuitarCaracteristicaVehiculo]
    @ID_vehiculo       INT,
    @ID_proveedor      INT,
    @ID_caracteristica INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1 FROM Vehiculo
        WHERE ID_vehiculo = @ID_vehiculo AND ID_proveedor_vehiculo = @ID_proveedor)
        THROW 54027, 'Vehiculo no encontrado o no pertenece al proveedor.', 1;

    DELETE FROM VehiculoCaracteristica
    WHERE ID_vehiculo_vehiculo_caracteristica = @ID_vehiculo
      AND ID_caracteristica_vehiculo_caracteristica = @ID_caracteristica;

    SELECT @ID_vehiculo AS ID_vehiculo, @ID_caracteristica AS ID_caracteristica;
END
GO

/* ============================== Tarifas vehiculo ============================ */
CREATE OR ALTER PROCEDURE [dbo].[sp_RegistrarTarifaVehiculo]
    @ID_vehiculo         INT,
    @ID_proveedor        INT,
    @nombre              VARCHAR(80),
    @fecha_inicio        DATE,
    @fecha_fin           DATE,
    @precio_dia          DECIMAL(14,2),
    @prioridad           INT = 1,
    @dia_semana          TINYINT = NULL,
    @anticipacion_min    INT = NULL,
    @anticipacion_max    INT = NULL,
    @dias_minimos        INT = NULL,
    @dias_maximos        INT = NULL,
    @activa              BIT = 1,
    @ID_usuario_creacion INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1 FROM Vehiculo
        WHERE ID_vehiculo = @ID_vehiculo AND ID_proveedor_vehiculo = @ID_proveedor)
        THROW 54027, 'Vehiculo no encontrado o no pertenece al proveedor.', 1;
    IF @fecha_fin < @fecha_inicio
        THROW 54030, 'La fecha fin debe ser mayor o igual a la fecha inicio.', 1;
    IF @precio_dia <= 0
        THROW 54023, 'El precio diario debe ser mayor que cero.', 1;
    IF @dia_semana IS NOT NULL AND (@dia_semana < 1 OR @dia_semana > 7)
        THROW 54031, 'Dia de semana invalido (1-7).', 1;

    INSERT INTO TarifaVehiculo
        (ID_vehiculo_tarifa, ID_proveedor_tarifa, nombre_tarifa, fecha_inicio_tarifa, fecha_fin_tarifa,
         dia_semana_aplica, anticipacion_min_dias, anticipacion_max_dias, dias_minimos, dias_maximos,
         precio_dia_tarifa, prioridad_tarifa, activa_tarifa, fecha_creacion_tarifa, ID_usuario_creacion)
    VALUES
        (@ID_vehiculo, @ID_proveedor, @nombre, @fecha_inicio, @fecha_fin,
         @dia_semana, @anticipacion_min, @anticipacion_max, @dias_minimos, @dias_maximos,
         @precio_dia, @prioridad, @activa, SYSDATETIME(), @ID_usuario_creacion);

    SELECT * FROM TarifaVehiculo WHERE ID_tarifa = SCOPE_IDENTITY();
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_ActualizarTarifaVehiculo]
    @ID_tarifa          BIGINT,
    @ID_proveedor       INT,
    @nombre             VARCHAR(80) = NULL,
    @fecha_inicio       DATE = NULL,
    @fecha_fin          DATE = NULL,
    @precio_dia         DECIMAL(14,2) = NULL,
    @prioridad          INT = NULL,
    @dia_semana         TINYINT = NULL,
    @anticipacion_min   INT = NULL,
    @anticipacion_max   INT = NULL,
    @dias_minimos       INT = NULL,
    @dias_maximos       INT = NULL,
    @activa             BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1 FROM TarifaVehiculo t
        INNER JOIN Vehiculo v ON v.ID_vehiculo = t.ID_vehiculo_tarifa
        WHERE t.ID_tarifa = @ID_tarifa AND v.ID_proveedor_vehiculo = @ID_proveedor)
        THROW 54032, 'Tarifa no encontrada o no pertenece al proveedor.', 1;
    IF @precio_dia IS NOT NULL AND @precio_dia <= 0
        THROW 54023, 'El precio diario debe ser mayor que cero.', 1;
    IF @dia_semana IS NOT NULL AND (@dia_semana < 1 OR @dia_semana > 7)
        THROW 54031, 'Dia de semana invalido (1-7).', 1;

    UPDATE TarifaVehiculo
    SET nombre_tarifa        = COALESCE(@nombre, nombre_tarifa),
        fecha_inicio_tarifa  = COALESCE(@fecha_inicio, fecha_inicio_tarifa),
        fecha_fin_tarifa     = COALESCE(@fecha_fin, fecha_fin_tarifa),
        precio_dia_tarifa    = COALESCE(@precio_dia, precio_dia_tarifa),
        prioridad_tarifa     = COALESCE(@prioridad, prioridad_tarifa),
        dia_semana_aplica    = COALESCE(@dia_semana, dia_semana_aplica),
        anticipacion_min_dias = COALESCE(@anticipacion_min, anticipacion_min_dias),
        anticipacion_max_dias = COALESCE(@anticipacion_max, anticipacion_max_dias),
        dias_minimos         = COALESCE(@dias_minimos, dias_minimos),
        dias_maximos         = COALESCE(@dias_maximos, dias_maximos),
        activa_tarifa        = COALESCE(@activa, activa_tarifa)
    WHERE ID_tarifa = @ID_tarifa;

    IF EXISTS (SELECT 1 FROM TarifaVehiculo WHERE ID_tarifa = @ID_tarifa AND fecha_fin_tarifa < fecha_inicio_tarifa)
        THROW 54030, 'La fecha fin debe ser mayor o igual a la fecha inicio.', 1;

    SELECT * FROM TarifaVehiculo WHERE ID_tarifa = @ID_tarifa;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_EliminarTarifaVehiculo]
    @ID_tarifa    BIGINT,
    @ID_proveedor INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1 FROM TarifaVehiculo t
        INNER JOIN Vehiculo v ON v.ID_vehiculo = t.ID_vehiculo_tarifa
        WHERE t.ID_tarifa = @ID_tarifa AND v.ID_proveedor_vehiculo = @ID_proveedor)
        THROW 54032, 'Tarifa no encontrada o no pertenece al proveedor.', 1;

    UPDATE TarifaVehiculo SET activa_tarifa = 0 WHERE ID_tarifa = @ID_tarifa;

    SELECT @ID_tarifa AS ID_tarifa, CAST(0 AS BIT) AS activa_tarifa;
END
GO
