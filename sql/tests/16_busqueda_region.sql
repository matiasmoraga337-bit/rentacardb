USE [RentaCarDB];
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;

IF OBJECT_ID('tempdb..#R') IS NOT NULL DROP TABLE #R;
CREATE TABLE #R (id INT IDENTITY, test NVARCHAR(200), esperado NVARCHAR(100), resultado NVARCHAR(10), detalle NVARCHAR(500));

DECLARE @regionQA INT = (
    SELECT TOP 1 r.ID_region
    FROM Comuna c
    INNER JOIN Provincia p ON p.ID_provincia = c.ID_provincia_comuna
    INNER JOIN Region r ON r.ID_region = p.ID_region_provincia
    WHERE c.ID_comuna = 1
);

IF OBJECT_ID('tempdb..#Busqueda') IS NOT NULL DROP TABLE #Busqueda;
CREATE TABLE #Busqueda (
    ID_vehiculo INT,
    patente_vehiculo VARCHAR(10),
    precio_diario_base_vehiculo DECIMAL(14,2),
    calificacion_promedio_vehiculo DECIMAL(3,2),
    anio_vehiculo INT,
    nombre_marca NVARCHAR(100),
    nombre_modelo NVARCHAR(100),
    nombre_tipo_vehiculo NVARCHAR(100),
    nombre_sede_proveedor NVARCHAR(150),
    nombre_comuna NVARCHAR(100),
    nombre_region NVARCHAR(100),
    nombre_comercial_proveedor NVARCHAR(150),
    url_foto_principal VARCHAR(500),
    url_foto_principal_thumb VARCHAR(500),
    total_registros INT
);

BEGIN TRY
    INSERT #Busqueda
    EXEC dbo.u_sp_BuscarVehiculos @ID_region = @regionQA;

    IF EXISTS (SELECT 1 FROM #Busqueda WHERE patente_vehiculo = 'QAAB12')
        INSERT #R VALUES ('Busqueda filtrada por region', 'OK', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Busqueda filtrada por region', 'OK', 'FAIL', 'no encontro QAAB12');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Busqueda filtrada por region', 'OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

SELECT test, esperado, resultado, detalle FROM #R ORDER BY id;
SELECT resultado, COUNT(*) AS total FROM #R GROUP BY resultado;
