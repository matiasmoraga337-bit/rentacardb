USE [RentaCarDB];
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;

IF OBJECT_ID('tempdb..#R') IS NOT NULL DROP TABLE #R;
CREATE TABLE #R (id INT IDENTITY, test NVARCHAR(200), esperado NVARCHAR(100), resultado NVARCHAR(10), detalle NVARCHAR(500));

DECLARE @idVehiculo INT, @idTipo INT, @idUsuario INT, @idMantenimiento INT;

SELECT TOP 1 @idVehiculo = v.ID_vehiculo
FROM Vehiculo v
INNER JOIN EstadoVehiculo ev ON ev.ID_estado_vehiculo = v.ID_estado_vehiculo_vehiculo
WHERE ev.nombre_estado_vehiculo = 'DISPONIBLE'
  AND NOT EXISTS (
    SELECT 1 FROM Mantenimiento m
    WHERE m.ID_vehiculo_mantenimiento = v.ID_vehiculo
      AND m.activo_mantenimiento = 1
  )
ORDER BY v.ID_vehiculo;

SELECT TOP 1 @idTipo = ID_tipo_mantenimiento
FROM TipoMantenimiento
WHERE activo_tipo_mantenimiento = 1
ORDER BY ID_tipo_mantenimiento;

SELECT TOP 1 @idUsuario = ID_usuario
FROM Usuario
ORDER BY ID_usuario;

BEGIN TRY
    EXEC dbo.u_sp_RegistrarMantenimiento
        @ID_vehiculo = @idVehiculo,
        @ID_tipo_mantenimiento = @idTipo,
        @kilometraje = 10000,
        @descripcion = N'Mantenimiento QA',
        @taller = N'Taller QA',
        @costo = 50000,
        @ID_usuario_operador = @idUsuario;
    SET @idMantenimiento = (
        SELECT TOP 1 ID_mantenimiento FROM Mantenimiento
        WHERE ID_vehiculo_mantenimiento = @idVehiculo AND activo_mantenimiento = 1
        ORDER BY ID_mantenimiento DESC
    );
    IF @idMantenimiento IS NOT NULL
        INSERT #R VALUES ('Registrar mantenimiento', 'activo', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Registrar mantenimiento', 'activo', 'FAIL', 'no se creo');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Registrar mantenimiento', 'activo', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    IF EXISTS (SELECT 1 FROM dbo.vw_MantenimientosActivos WHERE ID_mantenimiento = @idMantenimiento)
        INSERT #R VALUES ('Vista vw_MantenimientosActivos', 'incluye activo', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Vista vw_MantenimientosActivos', 'incluye activo', 'FAIL', 'no aparece');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Vista vw_MantenimientosActivos', 'incluye activo', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_RegistrarMantenimiento
        @ID_vehiculo = @idVehiculo,
        @ID_tipo_mantenimiento = @idTipo,
        @kilometraje = 10000,
        @ID_usuario_operador = @idUsuario;
    INSERT #R VALUES ('Mantenimiento duplicado', 'ERROR 60024', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Mantenimiento duplicado', 'ERROR 60024',
        CASE WHEN ERROR_NUMBER() = 60024 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_FinalizarMantenimiento
        @ID_mantenimiento = @idMantenimiento,
        @costo_final = 55000,
        @ID_usuario_operador = @idUsuario;
    IF NOT EXISTS (SELECT 1 FROM Mantenimiento WHERE ID_mantenimiento = @idMantenimiento AND activo_mantenimiento = 1)
        INSERT #R VALUES ('Finalizar mantenimiento', 'inactivo', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Finalizar mantenimiento', 'inactivo', 'FAIL', 'sigue activo');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Finalizar mantenimiento', 'inactivo', 'FAIL', ERROR_MESSAGE());
END CATCH;

SELECT * FROM #R ORDER BY id;
SELECT resultado, COUNT(*) AS total FROM #R GROUP BY resultado;
