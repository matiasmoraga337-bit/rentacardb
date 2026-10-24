USE [RentaCarDB];
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;

IF OBJECT_ID('tempdb..#R') IS NOT NULL DROP TABLE #R;
CREATE TABLE #R (id INT IDENTITY, test NVARCHAR(200), esperado NVARCHAR(100), resultado NVARCHAR(10), detalle NVARCHAR(500));

DECLARE @idCliente INT = (SELECT ID_usuario FROM Usuario WHERE email_usuario='qa.cliente@rentacar.cl');
DECLARE @idAdmin INT = (SELECT ID_usuario FROM Usuario WHERE email_usuario='qa.admin@rentacar.cl');
DECLARE @idVeh INT = (SELECT ID_vehiculo FROM Vehiculo WHERE patente_vehiculo='QAAB12');
DECLARE @idBusqueda INT;
DECLARE @idBusquedaRegion INT;

BEGIN TRY
    EXEC dbo.u_sp_AgregarFavorito @ID_usuario=@idCliente, @ID_vehiculo=@idVeh;
    IF EXISTS (SELECT 1 FROM FavoritoVehiculo WHERE ID_usuario_favorito=@idCliente AND ID_vehiculo_favorito=@idVeh)
        INSERT #R VALUES ('Agregar favorito', 'OK', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Agregar favorito', 'OK', 'FAIL', 'no existe');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Agregar favorito', 'OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_AgregarFavorito @ID_usuario=@idCliente, @ID_vehiculo=@idVeh;
    IF (SELECT COUNT(*) FROM FavoritoVehiculo WHERE ID_usuario_favorito=@idCliente AND ID_vehiculo_favorito=@idVeh) = 1
        INSERT #R VALUES ('Favorito idempotente', '1', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Favorito idempotente', '1', 'FAIL', 'duplicado');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Favorito idempotente', '1', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_QuitarFavorito @ID_usuario=@idCliente, @ID_vehiculo=@idVeh;
    IF NOT EXISTS (SELECT 1 FROM FavoritoVehiculo WHERE ID_usuario_favorito=@idCliente AND ID_vehiculo_favorito=@idVeh)
        INSERT #R VALUES ('Quitar favorito', 'OK', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Quitar favorito', 'OK', 'FAIL', 'sigue');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Quitar favorito', 'OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_AgregarFavorito @ID_usuario=@idCliente, @ID_vehiculo=999999;
    INSERT #R VALUES ('Favorito vehiculo inexistente', 'ERROR 60501', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Favorito vehiculo inexistente', 'ERROR 60501',
        CASE WHEN ERROR_NUMBER()=60501 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_GuardarBusqueda @ID_usuario=@idCliente, @nombre=N'QA Busqueda S4',
        @ID_comuna=NULL, @ID_tipo_vehiculo=NULL, @precio_maximo=50000,
        @fecha_desde='2026-11-01', @fecha_hasta='2026-11-05';
    SET @idBusqueda = (SELECT TOP 1 ID_busqueda FROM BusquedaGuardada WHERE ID_usuario_busqueda=@idCliente ORDER BY ID_busqueda DESC);
    IF @idBusqueda IS NOT NULL
        INSERT #R VALUES ('Guardar busqueda', 'OK', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Guardar busqueda', 'OK', 'FAIL', 'no existe');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Guardar busqueda', 'OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_GuardarBusqueda @ID_usuario=@idCliente, @nombre=N'QA Region S4',
        @ID_region=16, @ID_tipo_vehiculo=NULL, @precio_maximo=50000;
    SET @idBusquedaRegion = (SELECT TOP 1 ID_busqueda FROM BusquedaGuardada WHERE ID_usuario_busqueda=@idCliente ORDER BY ID_busqueda DESC);
    IF EXISTS (SELECT 1 FROM BusquedaGuardada WHERE ID_busqueda=@idBusquedaRegion AND ID_region_busqueda=16)
        INSERT #R VALUES ('Guardar busqueda con region', 'OK', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Guardar busqueda con region', 'OK', 'FAIL', 'no guardo region');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Guardar busqueda con region', 'OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_GuardarBusqueda @ID_usuario=@idCliente, @nombre=N'Fechas invertidas',
        @fecha_desde='2026-11-10', @fecha_hasta='2026-11-01';
    INSERT #R VALUES ('Busqueda fechas invertidas', 'ERROR 60502', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Busqueda fechas invertidas', 'ERROR 60502',
        CASE WHEN ERROR_NUMBER()=60502 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_EliminarBusqueda @ID_busqueda=@idBusqueda, @ID_usuario=@idAdmin;
    INSERT #R VALUES ('Eliminar busqueda ajena', 'ERROR 60503', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Eliminar busqueda ajena', 'ERROR 60503',
        CASE WHEN ERROR_NUMBER()=60503 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_EliminarBusqueda @ID_busqueda=@idBusqueda, @ID_usuario=@idCliente;
    IF EXISTS (SELECT 1 FROM BusquedaGuardada WHERE ID_busqueda=@idBusqueda AND activa_busqueda=0)
        INSERT #R VALUES ('Eliminar busqueda', 'OK', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Eliminar busqueda', 'OK', 'FAIL', 'sigue activa');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Eliminar busqueda', 'OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

SELECT * FROM #R ORDER BY id;
SELECT resultado, COUNT(*) AS total FROM #R GROUP BY resultado;
