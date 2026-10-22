USE [RentaCarDB];
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;

IF OBJECT_ID('tempdb..#R') IS NOT NULL DROP TABLE #R;
CREATE TABLE #R (id INT IDENTITY, test NVARCHAR(200), esperado NVARCHAR(100), resultado NVARCHAR(10), detalle NVARCHAR(500));

DECLARE @idProv INT = (SELECT ID_proveedor FROM Proveedor WHERE nombre_comercial_proveedor='QA Provider');
DECLARE @idAdmin INT = (SELECT ID_usuario FROM Usuario WHERE email_usuario='qa.admin@rentacar.cl');
DECLARE @idLiq BIGINT;

BEGIN TRY
    EXEC dbo.u_sp_GenerarLiquidacion @ID_proveedor=@idProv,
        @periodo_inicio='2020-01-01', @periodo_fin='2030-12-31', @ID_usuario=@idAdmin;
    SET @idLiq = (SELECT TOP 1 ID_liquidacion FROM LiquidacionProveedor
                  WHERE ID_proveedor_liquidacion=@idProv ORDER BY ID_liquidacion DESC);
    IF EXISTS (
        SELECT 1 FROM LiquidacionProveedor
        WHERE ID_liquidacion=@idLiq AND estado_liquidacion='CALCULADA'
    )
        INSERT #R VALUES ('Generar liquidacion', 'CALCULADA', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Generar liquidacion', 'CALCULADA', 'FAIL', 'no quedo calculada');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Generar liquidacion', 'CALCULADA', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    DECLARE @cantidad INT;
    EXEC dbo.u_sp_GenerarLiquidacion @ID_proveedor=@idProv,
        @periodo_inicio='2020-01-01', @periodo_fin='2030-12-31', @ID_usuario=@idAdmin;
    SELECT @cantidad = COUNT(*) FROM LiquidacionProveedor
    WHERE ID_proveedor_liquidacion=@idProv
      AND periodo_inicio_liquidacion_proveedor='2020-01-01'
      AND periodo_fin_liquidacion_proveedor='2030-12-31';
    INSERT #R VALUES ('Liquidacion idempotente', '1', CASE WHEN @cantidad=1 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT('filas=', @cantidad));
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Liquidacion idempotente', '1', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_GenerarLiquidacion @ID_proveedor=@idProv,
        @periodo_inicio='2021-01-01', @periodo_fin='2021-12-31', @ID_usuario=@idAdmin;
    INSERT #R VALUES ('Liquidacion solapada', 'ERROR 70504', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Liquidacion solapada', 'ERROR 70504',
        CASE WHEN ERROR_NUMBER()=70504 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_AprobarLiquidacion @ID_liquidacion=@idLiq, @ID_usuario=@idAdmin;
    IF EXISTS (SELECT 1 FROM LiquidacionProveedor WHERE ID_liquidacion=@idLiq AND estado_liquidacion='APROBADA')
        INSERT #R VALUES ('Aprobar liquidacion', 'APROBADA', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Aprobar liquidacion', 'APROBADA', 'FAIL', 'no cambio');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Aprobar liquidacion', 'APROBADA', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_AprobarLiquidacion @ID_liquidacion=@idLiq, @ID_usuario=@idAdmin;
    INSERT #R VALUES ('Aprobar dos veces', 'ERROR 70502', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Aprobar dos veces', 'ERROR 70502',
        CASE WHEN ERROR_NUMBER()=70502 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_MarcarLiquidacionPagada @ID_liquidacion=@idLiq, @ID_usuario=@idAdmin;
    IF EXISTS (SELECT 1 FROM LiquidacionProveedor WHERE ID_liquidacion=@idLiq AND estado_liquidacion='PAGADA' AND fecha_pago_liquidacion_proveedor IS NOT NULL)
        INSERT #R VALUES ('Pagar liquidacion', 'PAGADA', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Pagar liquidacion', 'PAGADA', 'FAIL', 'no cambio o sin fecha');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Pagar liquidacion', 'PAGADA', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_MarcarLiquidacionPagada @ID_liquidacion=@idLiq, @ID_usuario=@idAdmin;
    INSERT #R VALUES ('Pagar dos veces', 'ERROR 70503', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Pagar dos veces', 'ERROR 70503',
        CASE WHEN ERROR_NUMBER()=70503 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

SELECT * FROM #R ORDER BY id;
SELECT resultado, COUNT(*) AS total FROM #R GROUP BY resultado;
