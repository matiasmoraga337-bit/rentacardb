USE [RentaCarDB];
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;

IF OBJECT_ID('tempdb..#R') IS NOT NULL DROP TABLE #R;
CREATE TABLE #R (id INT IDENTITY, test NVARCHAR(200), esperado NVARCHAR(100), resultado NVARCHAR(10), detalle NVARCHAR(500));

DECLARE @idPersona INT, @idPersona2 INT, @idClase INT, @numero VARCHAR(20) = 'QALIC001';

SELECT TOP 1 @idPersona = p.ID_persona
FROM Persona p
WHERE NOT EXISTS (
  SELECT 1 FROM LicenciaConducir l
  WHERE l.ID_persona_licencia_conducir = p.ID_persona AND l.activa_licencia = 1
)
ORDER BY p.ID_persona;

SELECT TOP 1 @idPersona2 = p.ID_persona
FROM Persona p
WHERE p.ID_persona <> @idPersona
ORDER BY p.ID_persona;

SELECT TOP 1 @idClase = ID_clase_licencia
FROM ClaseLicencia
WHERE activo_clase_licencia = 1
ORDER BY ID_clase_licencia;

BEGIN TRY
    EXEC dbo.u_sp_RegistrarLicenciaConducir
        @ID_persona = @idPersona,
        @ID_clase_licencia = @idClase,
        @numero_licencia = @numero,
        @fecha_emision = '2020-01-01',
        @fecha_vencimiento = '2030-01-01';
    IF EXISTS (
        SELECT 1 FROM LicenciaConducir
        WHERE ID_persona_licencia_conducir = @idPersona AND numero_licencia = @numero
    )
        INSERT #R VALUES ('Registrar licencia', 'creada', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Registrar licencia', 'creada', 'FAIL', 'no se creo');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Registrar licencia', 'creada', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_RegistrarLicenciaConducir
        @ID_persona = @idPersona2,
        @ID_clase_licencia = @idClase,
        @numero_licencia = @numero,
        @fecha_emision = '2020-01-01',
        @fecha_vencimiento = '2030-01-01';
    INSERT #R VALUES ('Licencia duplicada', 'ERROR 60004', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Licencia duplicada', 'ERROR 60004',
        CASE WHEN ERROR_NUMBER() = 60004 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_RegistrarLicenciaConducir
        @ID_persona = @idPersona,
        @ID_clase_licencia = @idClase,
        @numero_licencia = 'QALIC002',
        @fecha_emision = '2010-01-01',
        @fecha_vencimiento = '2020-01-01';
    INSERT #R VALUES ('Licencia vencida', 'ERROR 60002', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Licencia vencida', 'ERROR 60002',
        CASE WHEN ERROR_NUMBER() = 60002 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

SELECT * FROM #R ORDER BY id;
SELECT resultado, COUNT(*) AS total FROM #R GROUP BY resultado;
