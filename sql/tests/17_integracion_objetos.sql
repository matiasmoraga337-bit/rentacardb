USE [RentaCarDB];
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;

IF OBJECT_ID('tempdb..#R') IS NOT NULL DROP TABLE #R;
CREATE TABLE #R (id INT IDENTITY, test NVARCHAR(200), esperado NVARCHAR(100), resultado NVARCHAR(10), detalle NVARCHAR(500));

DECLARE @n INT, @ret INT;

BEGIN TRY
    SELECT @n = COUNT(*) FROM dbo.vw_VehiculosPublicados;
    INSERT #R VALUES ('Vista vw_VehiculosPublicados', 'consulta OK', 'PASS', CONCAT('filas=', @n));
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Vista vw_VehiculosPublicados', 'consulta OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    SELECT @n = COUNT(*) FROM dbo.vw_PagosPendientes;
    INSERT #R VALUES ('Vista vw_PagosPendientes', 'consulta OK', 'PASS', CONCAT('filas=', @n));
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Vista vw_PagosPendientes', 'consulta OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    SELECT @n = COUNT(*) FROM dbo.vw_DocumentosVencidos;
    INSERT #R VALUES ('Vista vw_DocumentosVencidos', 'consulta OK', 'PASS', CONCAT('filas=', @n));
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Vista vw_DocumentosVencidos', 'consulta OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_ReporteLiquidaciones;
    INSERT #R VALUES ('SP u_sp_ReporteLiquidaciones', 'ejecuta OK', 'PASS', '');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('SP u_sp_ReporteLiquidaciones', 'ejecuta OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_ReporteProveedores;
    INSERT #R VALUES ('SP u_sp_ReporteProveedores', 'ejecuta OK', 'PASS', '');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('SP u_sp_ReporteProveedores', 'ejecuta OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_ReporteTiposProveedor;
    INSERT #R VALUES ('SP u_sp_ReporteTiposProveedor', 'ejecuta OK', 'PASS', '');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('SP u_sp_ReporteTiposProveedor', 'ejecuta OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC @ret = dbo.u_sp_ValidarIntegridad;
    INSERT #R VALUES ('SP u_sp_ValidarIntegridad', 'ret=0', CASE WHEN @ret = 0 THEN 'PASS' ELSE 'FAIL' END, CONCAT('ret=', @ret));
END TRY
BEGIN CATCH
    INSERT #R VALUES ('SP u_sp_ValidarIntegridad', 'ret=0', 'FAIL', ERROR_MESSAGE());
END CATCH;

SELECT * FROM #R ORDER BY id;
SELECT resultado, COUNT(*) AS total FROM #R GROUP BY resultado;
