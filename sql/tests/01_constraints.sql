USE [RentaCarDB];
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;

IF OBJECT_ID('tempdb..#R') IS NOT NULL DROP TABLE #R;
CREATE TABLE #R (id INT IDENTITY, test NVARCHAR(200), esperado NVARCHAR(100), resultado NVARCHAR(10), detalle NVARCHAR(500));

-- 1) ConfiguracionGlobal singleton
BEGIN TRY
    BEGIN TRAN;
    UPDATE dbo.ConfiguracionGlobal SET ID_configuracion = 2;
    ROLLBACK;
    INSERT #R VALUES ('ConfiguracionGlobal singleton (ID=2)', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK;
    INSERT #R VALUES ('ConfiguracionGlobal singleton (ID=2)', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

-- 2) IVA fuera de rango
BEGIN TRY
    BEGIN TRAN;
    UPDATE dbo.ConfiguracionGlobal SET iva_porcentaje_configuracion_global = 101;
    ROLLBACK;
    INSERT #R VALUES ('IVA 101%', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK;
    INSERT #R VALUES ('IVA 101%', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

-- 3) Comision negativa
BEGIN TRY
    BEGIN TRAN;
    UPDATE dbo.ConfiguracionGlobal SET comision_porcentaje_configuracion_global = -1;
    ROLLBACK;
    INSERT #R VALUES ('Comision -1%', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK;
    INSERT #R VALUES ('Comision -1%', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

-- 4) Comuna duplicada en la misma provincia (UNIQUE)
BEGIN TRY
    BEGIN TRAN;
    INSERT INTO dbo.Comuna (nombre_comuna, activo_comuna, ID_provincia_comuna)
    SELECT nombre_comuna, 1, ID_provincia_comuna FROM dbo.Comuna WHERE ID_comuna = 1;
    ROLLBACK;
    INSERT #R VALUES ('Comuna duplicada (misma provincia)', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK;
    INSERT #R VALUES ('Comuna duplicada (misma provincia)', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

-- 5) Comuna con nombre vacio (CHECK)
BEGIN TRY
    BEGIN TRAN;
    INSERT INTO dbo.Comuna (nombre_comuna, activo_comuna, ID_provincia_comuna)
    VALUES ('   ', 1, 1);
    ROLLBACK;
    INSERT #R VALUES ('Comuna nombre vacio', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK;
    INSERT #R VALUES ('Comuna nombre vacio', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

-- 6) Outbox JSON invalido (CHECK ISJSON)
BEGIN TRY
    BEGIN TRAN;
    INSERT INTO dbo.OutboxEvento (tipo_evento, agregado_tipo_outbox_evento, agregado_id_outbox_evento, payload_outbox_evento)
    VALUES ('TEST', 'TEST', 1, 'no-es-json');
    ROLLBACK;
    INSERT #R VALUES ('Outbox payload no JSON', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK;
    INSERT #R VALUES ('Outbox payload no JSON', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

-- 7) Outbox estado invalido (CHECK)
BEGIN TRY
    BEGIN TRAN;
    INSERT INTO dbo.OutboxEvento (tipo_evento, agregado_tipo_outbox_evento, agregado_id_outbox_evento, payload_outbox_evento, estado_outbox_evento)
    VALUES ('TEST', 'TEST', 1, '{"a":1}', 'NO_VALIDO');
    ROLLBACK;
    INSERT #R VALUES ('Outbox estado invalido', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK;
    INSERT #R VALUES ('Outbox estado invalido', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

-- 8) ErrorLog origen invalido (CHECK)
BEGIN TRY
    BEGIN TRAN;
    INSERT INTO dbo.ErrorLog (numero_error_log, severidad_error_log, estado_error_log, mensaje_error_log, nombre_sp_origen_log, origen_error_log)
    VALUES (1, 16, 1, 'test', 'test', 'OTRO');
    ROLLBACK;
    INSERT #R VALUES ('ErrorLog origen invalido', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK;
    INSERT #R VALUES ('ErrorLog origen invalido', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

-- 9) ErrorLog defaults (revisado=0)
BEGIN TRY
    BEGIN TRAN;
    INSERT INTO dbo.ErrorLog (numero_error_log, severidad_error_log, estado_error_log, mensaje_error_log, nombre_sp_origen_log, origen_error_log)
    VALUES (1, 16, 1, 'test', 'test', 'SP');
    DECLARE @rev BIT = (SELECT TOP 1 revisado_error_log FROM dbo.ErrorLog ORDER BY ID_error_log DESC);
    ROLLBACK;
    INSERT #R VALUES ('ErrorLog revisado default = 0', '0', CASE WHEN @rev = 0 THEN 'PASS' ELSE 'FAIL' END, CONCAT('revisado=', @rev));
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK;
    INSERT #R VALUES ('ErrorLog revisado default = 0', '0', 'FAIL', ERROR_MESSAGE());
END CATCH;

-- 10) FK invalida: Pago con reserva inexistente
BEGIN TRY
    BEGIN TRAN;
    INSERT INTO dbo.Pago (ID_reserva_pago, ID_tipo_operacion_pago_pago, ID_metodo_pago_pago, ID_estado_pago_pago, monto_pago, moneda_pago, proveedor_pago)
    VALUES (999999999, 1, 1, 1, 1000, 'CLP', 'TEST');
    ROLLBACK;
    INSERT #R VALUES ('Pago con reserva inexistente (FK)', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK;
    INSERT #R VALUES ('Pago con reserva inexistente (FK)', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

SELECT * FROM #R ORDER BY id;
SELECT resultado, COUNT(*) AS total FROM #R GROUP BY resultado;
