USE [RentaCarDB];
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;

IF OBJECT_ID('tempdb..#R') IS NOT NULL DROP TABLE #R;
CREATE TABLE #R (id INT IDENTITY, test NVARCHAR(200), esperado NVARCHAR(100), resultado NVARCHAR(10), detalle NVARCHAR(500));

DECLARE @idMarca INT, @idModelo INT, @idCaract INT;

BEGIN TRY
    EXEC dbo.u_sp_AdminCatalogoSimple @tipo='marcas', @accion='CREAR', @nombre=N'QA Marca S4', @activo=1;
    SET @idMarca = (SELECT ID_marca FROM Marca WHERE nombre_marca=N'QA Marca S4');
    IF @idMarca IS NOT NULL
        INSERT #R VALUES ('Crear marca', 'OK', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Crear marca', 'OK', 'FAIL', 'no se creo');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Crear marca', 'OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_AdminCatalogoSimple @tipo='marcas', @accion='CREAR', @nombre=N'QA Marca S4', @activo=1;
    INSERT #R VALUES ('Marca duplicada', 'ERROR 60403', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Marca duplicada', 'ERROR 60403',
        CASE WHEN ERROR_NUMBER()=60403 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_AdminCatalogoSimple @tipo='marcas', @accion='ACTUALIZAR', @id=@idMarca, @nombre=N'QA Marca S4 Editada', @activo=1;
    IF EXISTS (SELECT 1 FROM Marca WHERE ID_marca=@idMarca AND nombre_marca=N'QA Marca S4 Editada')
        INSERT #R VALUES ('Editar marca', 'OK', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Editar marca', 'OK', 'FAIL', 'no cambio');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Editar marca', 'OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_AdminModelo @accion='CREAR', @ID_marca=@idMarca, @nombre=N'QA Modelo S4', @activo=1;
    SET @idModelo = (SELECT ID_modelo FROM Modelo WHERE nombre_modelo=N'QA Modelo S4' AND ID_marca_modelo=@idMarca);
    IF @idModelo IS NOT NULL
        INSERT #R VALUES ('Crear modelo', 'OK', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Crear modelo', 'OK', 'FAIL', 'no se creo');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Crear modelo', 'OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_AdminModelo @accion='DESACTIVAR', @id=@idModelo, @nombre='';
    IF EXISTS (SELECT 1 FROM Modelo WHERE ID_modelo=@idModelo AND activo_modelo=0)
        INSERT #R VALUES ('Desactivar modelo', 'OK', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Desactivar modelo', 'OK', 'FAIL', 'sigue activo');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Desactivar modelo', 'OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_AdminCaracteristica @accion='CREAR', @nombre=N'QA Caracteristica S4',
        @categoria='SEGURIDAD', @descripcion=N'Caracteristica QA', @activo=1;
    SET @idCaract = (SELECT ID_caracteristica_vehiculo FROM CaracteristicaVehiculo WHERE nombre_caracteristica=N'QA Caracteristica S4');
    IF @idCaract IS NOT NULL
        INSERT #R VALUES ('Crear caracteristica', 'OK', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Crear caracteristica', 'OK', 'FAIL', 'no se creo');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Crear caracteristica', 'OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_AdminPoliticaCancelacion @accion='CREAR', @nombre=N'QA Politica S4',
        @dias_anticipacion=2, @porcentaje_reembolso=150, @activo=1;
    INSERT #R VALUES ('Politica porcentaje invalido', 'ERROR 60406', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Politica porcentaje invalido', 'ERROR 60406',
        CASE WHEN ERROR_NUMBER()=60406 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_AdminModelo @accion='DESACTIVAR', @id=999999, @nombre='';
    INSERT #R VALUES ('Desactivar modelo inexistente', 'ERROR 60402', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Desactivar modelo inexistente', 'ERROR 60402',
        CASE WHEN ERROR_NUMBER()=60402 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

SELECT * FROM #R ORDER BY id;
SELECT resultado, COUNT(*) AS total FROM #R GROUP BY resultado;
