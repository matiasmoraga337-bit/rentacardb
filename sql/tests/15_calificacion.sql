USE [RentaCarDB];
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;

IF OBJECT_ID('tempdb..#R') IS NOT NULL DROP TABLE #R;
CREATE TABLE #R (id INT IDENTITY, test NVARCHAR(200), esperado NVARCHAR(100), resultado NVARCHAR(10), detalle NVARCHAR(500));

DECLARE @idArriendo INT = (
    SELECT TOP 1 a.ID_arriendo
    FROM Arriendo a
    INNER JOIN EstadoArriendo ea ON ea.ID_estado_arriendo = a.ID_estado_arriendo_arriendo
    WHERE ea.nombre_estado_arriendo = 'FINALIZADO'
    ORDER BY a.ID_arriendo DESC
);
DECLARE @idVehiculo INT = (
    SELECT r.ID_vehiculo_reserva
    FROM Arriendo a INNER JOIN Reserva r ON r.ID_reserva = a.ID_reserva_arriendo
    WHERE a.ID_arriendo = @idArriendo
);
DECLARE @esperado DECIMAL(3,2) = (
    SELECT CONVERT(DECIMAL(3,2), AVG(CONVERT(DECIMAL(4,2), re.calificacion_resena)))
    FROM Resena re
    INNER JOIN Arriendo a ON a.ID_arriendo = re.ID_arriendo_resena
    INNER JOIN Reserva r ON r.ID_reserva = a.ID_reserva_arriendo
    INNER JOIN TipoResena tr ON tr.ID_tipo_resena = re.ID_tipo_resena_resena
    WHERE r.ID_vehiculo_reserva = @idVehiculo AND re.activo_resena = 1
      AND tr.nombre_tipo_resena = 'CLIENTE_A_VEHICULO'
);

BEGIN TRY
    EXEC dbo.u_sp_RecalcularCalificacionVehiculo @ID_arriendo=@idArriendo;
    IF EXISTS (
        SELECT 1 FROM Vehiculo
        WHERE ID_vehiculo=@idVehiculo AND calificacion_promedio_vehiculo=@esperado
    )
        INSERT #R VALUES ('Recalcular promedio', CONVERT(VARCHAR(10),@esperado), 'PASS', '');
    ELSE
        INSERT #R VALUES ('Recalcular promedio', CONVERT(VARCHAR(10),@esperado), 'FAIL', 'no coincide');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Recalcular promedio', CONVERT(VARCHAR(10),@esperado), 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_RecalcularCalificacionVehiculo @ID_arriendo=999999;
    INSERT #R VALUES ('Recalcular arriendo inexistente', 'ERROR 60600', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Recalcular arriendo inexistente', 'ERROR 60600',
        CASE WHEN ERROR_NUMBER()=60600 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

SELECT * FROM #R ORDER BY id;
SELECT resultado, COUNT(*) AS total FROM #R GROUP BY resultado;
