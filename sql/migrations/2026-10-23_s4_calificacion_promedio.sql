USE [RentaCarDB];
GO
SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

/* S4: recalculo de calificacion promedio del vehiculo. */
CREATE OR ALTER PROCEDURE [dbo].[u_sp_RecalcularCalificacionVehiculo]
    @ID_arriendo INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ID_vehiculo INT;
    SELECT @ID_vehiculo = r.ID_vehiculo_reserva
    FROM Arriendo a
    INNER JOIN Reserva r ON r.ID_reserva = a.ID_reserva_arriendo
    WHERE a.ID_arriendo = @ID_arriendo;

    IF @ID_vehiculo IS NULL THROW 60600, 'Arriendo no encontrado.', 1;

    UPDATE Vehiculo
    SET calificacion_promedio_vehiculo = (
        SELECT CONVERT(DECIMAL(3,2), AVG(CONVERT(DECIMAL(4,2), re.calificacion_resena)))
        FROM Resena re
        INNER JOIN Arriendo a ON a.ID_arriendo = re.ID_arriendo_resena
        INNER JOIN Reserva r ON r.ID_reserva = a.ID_reserva_arriendo
        INNER JOIN TipoResena tr ON tr.ID_tipo_resena = re.ID_tipo_resena_resena
        WHERE r.ID_vehiculo_reserva = @ID_vehiculo
          AND re.activo_resena = 1
          AND tr.nombre_tipo_resena = 'CLIENTE_A_VEHICULO'
    )
    WHERE ID_vehiculo = @ID_vehiculo;

    SELECT ID_vehiculo AS id, calificacion_promedio_vehiculo AS promedio
    FROM Vehiculo WHERE ID_vehiculo = @ID_vehiculo;
END;
GO

UPDATE v
SET calificacion_promedio_vehiculo = prom.promedio
FROM dbo.Vehiculo v
OUTER APPLY (
    SELECT CONVERT(DECIMAL(3,2), AVG(CONVERT(DECIMAL(4,2), re.calificacion_resena))) AS promedio
    FROM dbo.Resena re
    INNER JOIN dbo.Arriendo a ON a.ID_arriendo = re.ID_arriendo_resena
    INNER JOIN dbo.Reserva r ON r.ID_reserva = a.ID_reserva_arriendo
    INNER JOIN dbo.TipoResena tr ON tr.ID_tipo_resena = re.ID_tipo_resena_resena
    WHERE r.ID_vehiculo_reserva = v.ID_vehiculo
      AND re.activo_resena = 1
      AND tr.nombre_tipo_resena = 'CLIENTE_A_VEHICULO'
) prom;
