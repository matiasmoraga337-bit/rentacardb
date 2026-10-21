/* ============================================================================
   RENTACARDB - RECONCILIACION DE TRIGGERS Y PERMISOS
   (sql/02_reconciliar_triggers_permisos.sql)
   ----------------------------------------------------------------------------
   Ejecutar sobre RentaCarDB. Deja UN solo juego de triggers (elimina los
   duplicados que quedaron de dos fuentes) y agrega los GRANT que faltaban.

   Triggers que SE CONSERVAN:
     - trg_Reserva_AfterUpdate_Auditoria  (auditoria de estado de Reserva)
     - trg_Reserva_SinSolape              (no-solapamiento de reservas)
     - trg_BloqueoVehiculo_SinSolape      (no-solapamiento de bloqueos)
     - trg_Pago_AfterInsert_Auditoria     (auditoria financiera de Pago)

   Triggers que SE ELIMINAN (duplicados):
     - trg_Reserva_Auditoria              (auditoria Reserva duplicada)
     - trg_Auditoria_Reserva_Estado       (auditoria Reserva duplicada)
     - trg_Reserva_NoSolapamiento         (no-solape Reserva duplicado)

   Es IDEMPOTENTE.
   ============================================================================ */

USE [RentaCarDB];
GO
SET NOCOUNT ON;
GO

/* ----------------------------------------------------------------------------
   1) Eliminar TODOS los triggers de reserva/pago/bloqueo (juego completo),
      para luego recrear solo los 4 definitivos.
   ---------------------------------------------------------------------------- */
DROP TRIGGER IF EXISTS dbo.trg_Reserva_Auditoria;
DROP TRIGGER IF EXISTS dbo.trg_Auditoria_Reserva_Estado;
DROP TRIGGER IF EXISTS dbo.trg_Reserva_AfterUpdate_Auditoria;
DROP TRIGGER IF EXISTS dbo.trg_Reserva_SinSolape;
DROP TRIGGER IF EXISTS dbo.trg_Reserva_NoSolapamiento;
DROP TRIGGER IF EXISTS dbo.trg_BloqueoVehiculo_SinSolape;
DROP TRIGGER IF EXISTS dbo.trg_Pago_AfterInsert_Auditoria;
GO

/* ----------------------------------------------------------------------------
   2) Auditoria de cambio de estado de Reserva (guarda nombres de estado)
   ---------------------------------------------------------------------------- */
CREATE TRIGGER dbo.trg_Reserva_AfterUpdate_Auditoria
ON dbo.Reserva
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT UPDATE(ID_estado_reserva_reserva) RETURN;

    DECLARE @usuario_id  INT              = CONVERT(INT,              SESSION_CONTEXT(N'usuario_id'));
    DECLARE @correlation UNIQUEIDENTIFIER = CONVERT(UNIQUEIDENTIFIER, SESSION_CONTEXT(N'correlation_id'));
    DECLARE @motivo      NVARCHAR(500)    = CONVERT(NVARCHAR(500),    SESSION_CONTEXT(N'motivo'));

    INSERT INTO dbo.Auditoria
        (entidad, ID_registro, accion, ID_usuario, valor_anterior, valor_nuevo, correlation_id, origen, motivo)
    SELECT
        'Reserva',
        i.ID_reserva,
        'STATE_CHANGE',
        @usuario_id,
        CONCAT('estado=', ISNULL(er_o.nombre_estado_reserva, CONVERT(VARCHAR(50), d.ID_estado_reserva_reserva))),
        CONCAT('estado=', ISNULL(er_n.nombre_estado_reserva, CONVERT(VARCHAR(50), i.ID_estado_reserva_reserva))),
        COALESCE(i.correlation_id_reserva, @correlation),
        'TRIGGER',
        @motivo
    FROM inserted i
    INNER JOIN deleted d ON d.ID_reserva = i.ID_reserva
    LEFT JOIN dbo.EstadoReserva er_o ON er_o.ID_estado_reserva = d.ID_estado_reserva_reserva
    LEFT JOIN dbo.EstadoReserva er_n ON er_n.ID_estado_reserva = i.ID_estado_reserva_reserva
    WHERE i.ID_estado_reserva_reserva <> d.ID_estado_reserva_reserva;
END
GO

/* ----------------------------------------------------------------------------
   3) No-solapamiento de reservas activas del mismo vehiculo
   ---------------------------------------------------------------------------- */
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

/* ----------------------------------------------------------------------------
   4) No-solapamiento de bloqueos de vehiculo
   ---------------------------------------------------------------------------- */
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

/* ----------------------------------------------------------------------------
   5) Auditoria financiera de Pago
   ---------------------------------------------------------------------------- */
CREATE TRIGGER dbo.trg_Pago_AfterInsert_Auditoria
ON dbo.Pago
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @usuario_id INT = CONVERT(INT, SESSION_CONTEXT(N'usuario_id'));

    INSERT INTO dbo.Auditoria (entidad, ID_registro, accion, ID_usuario, valor_nuevo, origen)
    SELECT 'Pago', i.ID_pago, 'FINANCIAL', @usuario_id,
           (SELECT i.ID_reserva_pago AS id_reserva,
                   i.monto_pago       AS monto,
                   i.moneda_pago      AS moneda,
                   i.proveedor_pago   AS proveedor
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
           'TRIGGER'
    FROM inserted i;
END
GO

/* ----------------------------------------------------------------------------
   6) Permisos de rol que faltaban (minimo privilegio)
   ---------------------------------------------------------------------------- */
GRANT EXECUTE ON SCHEMA::dbo TO db_rentacar_rw;
GRANT SELECT  ON SCHEMA::dbo TO db_rentacar_rw;
GRANT SELECT  ON SCHEMA::dbo TO db_rentacar_ro;
GO

/* ----------------------------------------------------------------------------
   7) Verificacion
   ---------------------------------------------------------------------------- */
SELECT 'Triggers activos' AS objeto, COUNT(*) AS total
FROM sys.triggers
WHERE name IN ('trg_Reserva_AfterUpdate_Auditoria','trg_Reserva_SinSolape',
               'trg_BloqueoVehiculo_SinSolape','trg_Pago_AfterInsert_Auditoria')
UNION ALL
SELECT 'Triggers duplicados (debe ser 0)', COUNT(*)
FROM sys.triggers
WHERE name IN ('trg_Reserva_Auditoria','trg_Auditoria_Reserva_Estado','trg_Reserva_NoSolapamiento')
UNION ALL
SELECT 'GRANT EXECUTE/SELECT db_rentacar', COUNT(*)
FROM sys.database_permissions
WHERE permission_name IN ('EXECUTE','SELECT')
  AND grantee_principal_id IN (DATABASE_PRINCIPAL_ID('db_rentacar_rw'), DATABASE_PRINCIPAL_ID('db_rentacar_ro'));
GO

/* ============================================================================
   FIN
   ============================================================================ */
