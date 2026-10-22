USE [RentaCarDB];
SET NOCOUNT ON;

IF OBJECT_ID('tempdb..#R') IS NOT NULL DROP TABLE #R;
CREATE TABLE #R (id INT IDENTITY, test NVARCHAR(200), esperado NVARCHAR(100), resultado NVARCHAR(10), detalle NVARCHAR(500));

DECLARE @n INT, @ret INT;

SELECT @n = COUNT(*) FROM sys.tables;
INSERT #R VALUES ('Tablas = 83', '83', CASE WHEN @n = 83 THEN 'PASS' ELSE 'FAIL' END, CONCAT('tablas=', @n));

SELECT @n = COUNT(*) FROM sys.procedures WHERE is_ms_shipped = 0;
INSERT #R VALUES ('Procedimientos = 79', '79', CASE WHEN @n = 79 THEN 'PASS' ELSE 'FAIL' END, CONCAT('sps=', @n));

SELECT @n = COUNT(*) FROM sys.views WHERE is_ms_shipped = 0;
INSERT #R VALUES ('Vistas = 6', '6', CASE WHEN @n = 6 THEN 'PASS' ELSE 'FAIL' END, CONCAT('vistas=', @n));

SELECT @n = COUNT(*) FROM sys.objects WHERE type IN ('FN','IF','TF');
INSERT #R VALUES ('Funciones = 3', '3', CASE WHEN @n = 3 THEN 'PASS' ELSE 'FAIL' END, CONCAT('funciones=', @n));

SELECT @n = COUNT(*) FROM sys.triggers;
INSERT #R VALUES ('Triggers = 4', '4', CASE WHEN @n = 4 THEN 'PASS' ELSE 'FAIL' END, CONCAT('triggers=', @n));

SELECT @n = COUNT(*) FROM sys.procedures WHERE is_ms_shipped = 0 AND name LIKE 'sp[_]%';
INSERT #R VALUES ('Sin procedimientos sp_ de usuario', '0', CASE WHEN @n = 0 THEN 'PASS' ELSE 'FAIL' END, CONCAT('sp_=', @n));

SELECT @n = COUNT(*) FROM sys.procedures WHERE is_ms_shipped = 0 AND name LIKE 'u[_]u[_]%';
INSERT #R VALUES ('Sin nombres con doble prefijo u_u_', '0', CASE WHEN @n = 0 THEN 'PASS' ELSE 'FAIL' END, CONCAT('u_u_=', @n));

SELECT @n = COUNT(*) FROM sys.triggers WHERE is_disabled = 1;
INSERT #R VALUES ('Triggers habilitados', '0', CASE WHEN @n = 0 THEN 'PASS' ELSE 'FAIL' END, CONCAT('deshabilitados=', @n));

SELECT @n = COUNT(*) FROM sys.check_constraints WHERE is_disabled = 1;
INSERT #R VALUES ('CHECK constraints habilitados', '0', CASE WHEN @n = 0 THEN 'PASS' ELSE 'FAIL' END, CONCAT('deshabilitados=', @n));

SELECT @n = COUNT(*) FROM sys.foreign_keys WHERE is_disabled = 1;
INSERT #R VALUES ('FK habilitadas', '0', CASE WHEN @n = 0 THEN 'PASS' ELSE 'FAIL' END, CONCAT('deshabilitadas=', @n));

SELECT @n = compatibility_level FROM sys.databases WHERE name = 'RentaCarDB';
INSERT #R VALUES ('Compatibility level = 160 (SQL 2022)', '160', CASE WHEN @n = 160 THEN 'PASS' ELSE 'FAIL' END, CONCAT('level=', @n));

EXEC @ret = dbo.u_sp_ValidarIntegridad;
INSERT #R VALUES ('Integridad de datos (u_sp_ValidarIntegridad)', '0 errores', CASE WHEN @ret = 0 THEN 'PASS' ELSE 'FAIL' END, CONCAT('ret=', @ret));

SELECT * FROM #R ORDER BY id;
SELECT resultado, COUNT(*) AS total FROM #R GROUP BY resultado;
