/* ============================================================================
   RENTACARDB - COMPLEMENTO DEL EXPORT  (sql/01_completar_export.sql)
   ----------------------------------------------------------------------------
   Ejecutar sobre la base RentaCarDB DESPUES de crearla con el script exportado
   (100script.sql / RentacarCompleto.sql). Agrega lo que el export de SSMS NO
   incluye por defecto:

     1) TRIGGERS: auditoria de estado de Reserva + guard de no-solapamiento
        (doble reserva) a nivel de motor.
     2) SEGURIDAD: roles, usuarios y permisos (GRANT/DENY) de minimo privilegio.
     3) SANEAMIENTO: opciones de base de datos recomendadas.

   Es IDEMPOTENTE: se puede ejecutar varias veces sin error.
   ============================================================================ */

USE [RentaCarDB];
GO
SET NOCOUNT ON;
GO

/* ============================================================================
   1) TRIGGERS
   ============================================================================ */

/* 1.1 Auditoria de cambios de estado de Reserva (STATE_CHANGE).
   La tabla Auditoria y los SP asumen que este trigger existe. */
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

/* 1.2 Guard de no-solapamiento de reservas activas del mismo vehiculo.
   Complementa (a nivel motor) la validacion de sp_V5_CrearReserva. */
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
        ROLLBACK TRANSACTION;
        THROW 70900, 'Solapamiento: el vehiculo ya tiene una reserva activa en ese rango de fechas.', 1;
    END
END
GO

/* 1.3 Guard de no-solapamiento de bloqueos de vehiculo. */
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
        ROLLBACK TRANSACTION;
        THROW 70901, 'Solapamiento: el vehiculo ya tiene un bloqueo activo en ese rango de fechas.', 1;
    END
END
GO

/* ============================================================================
   2) SEGURIDAD: roles, usuarios y permisos (minimo privilegio)
   ============================================================================ */
IF DATABASE_PRINCIPAL_ID('db_rentacar_rw') IS NULL CREATE ROLE db_rentacar_rw;
IF DATABASE_PRINCIPAL_ID('db_rentacar_ro') IS NULL CREATE ROLE db_rentacar_ro;
IF DATABASE_PRINCIPAL_ID('api_user')       IS NULL CREATE USER api_user    WITHOUT LOGIN WITH DEFAULT_SCHEMA = dbo;
IF DATABASE_PRINCIPAL_ID('report_user')    IS NULL CREATE USER report_user WITHOUT LOGIN WITH DEFAULT_SCHEMA = dbo;
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_role_members rm
               INNER JOIN sys.database_principals r ON r.principal_id = rm.role_principal_id
               INNER JOIN sys.database_principals m ON m.principal_id = rm.member_principal_id
               WHERE r.name = 'db_rentacar_rw' AND m.name = 'api_user')
    ALTER ROLE db_rentacar_rw ADD MEMBER api_user;
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_role_members rm
               INNER JOIN sys.database_principals r ON r.principal_id = rm.role_principal_id
               INNER JOIN sys.database_principals m ON m.principal_id = rm.member_principal_id
               WHERE r.name = 'db_rentacar_ro' AND m.name = 'report_user')
    ALTER ROLE db_rentacar_ro ADD MEMBER report_user;
GO
/* La app ejecuta SPs y lee catalogos/vistas; no escribe tablas directamente. */
GRANT EXECUTE ON SCHEMA::dbo TO db_rentacar_rw;
GRANT SELECT  ON SCHEMA::dbo TO db_rentacar_rw;
DENY INSERT, UPDATE, DELETE ON dbo.Reserva   TO db_rentacar_rw;
DENY INSERT, UPDATE, DELETE ON dbo.Pago      TO db_rentacar_rw;
DENY INSERT, UPDATE, DELETE ON dbo.Arriendo  TO db_rentacar_rw;
DENY INSERT, UPDATE, DELETE ON dbo.Vehiculo  TO db_rentacar_rw;
GRANT SELECT ON SCHEMA::dbo TO db_rentacar_ro;
GO

/* ============================================================================
   3) SANEAMIENTO DE OPCIONES DE BASE DE DATOS
   ============================================================================ */
ALTER DATABASE [RentaCarDB] SET ANSI_NULLS ON;
ALTER DATABASE [RentaCarDB] SET QUOTED_IDENTIFIER ON;
ALTER DATABASE [RentaCarDB] SET ANSI_WARNINGS ON;
ALTER DATABASE [RentaCarDB] SET ARITHABORT ON;
ALTER DATABASE [RentaCarDB] SET CONCAT_NULL_YIELDS_NULL ON;
ALTER DATABASE [RentaCarDB] SET AUTO_CLOSE OFF;
ALTER DATABASE [RentaCarDB] SET AUTO_SHRINK OFF;
ALTER DATABASE [RentaCarDB] SET RECOVERY SIMPLE;
ALTER DATABASE [RentaCarDB] SET PAGE_VERIFY CHECKSUM;
GO
/* READ_COMMITTED_SNAPSHOT requiere acceso exclusivo (sin otras conexiones).
   Descomentar y ejecutar aparte si se desea habilitar concurrencia por version. */
-- ALTER DATABASE [RentaCarDB] SET READ_COMMITTED_SNAPSHOT ON WITH ROLLBACK IMMEDIATE;
GO

/* ============================================================================
   4) VERIFICACION
   ============================================================================ */
SELECT 'Triggers trg_%'            AS objeto, COUNT(*) AS total FROM sys.triggers WHERE name LIKE 'trg[_]%'
UNION ALL
SELECT 'Roles db_rentacar'         , COUNT(*) FROM sys.database_principals WHERE name IN ('db_rentacar_rw','db_rentacar_ro')
UNION ALL
SELECT 'Usuarios api/report'       , COUNT(*) FROM sys.database_principals WHERE name IN ('api_user','report_user')
UNION ALL
SELECT 'Permisos GRANT/DENY'       , COUNT(*) FROM sys.database_permissions WHERE grantee_principal_id IN
        (DATABASE_PRINCIPAL_ID('db_rentacar_rw'), DATABASE_PRINCIPAL_ID('db_rentacar_ro'))
UNION ALL
SELECT 'Opcion ANSI_WARNINGS ON'   , COUNT(*) FROM sys.databases WHERE name = 'RentaCarDB' AND is_ansi_warnings_on = 1
UNION ALL
SELECT 'Opcion ARITHABORT ON'      , COUNT(*) FROM sys.databases WHERE name = 'RentaCarDB' AND is_arithabort_on = 1;
GO

/* ============================================================================
   FIN DEL COMPLEMENTO
   ============================================================================ */
