USE [RentaCarDB];
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;

IF OBJECT_ID('tempdb..#R') IS NOT NULL DROP TABLE #R;
CREATE TABLE #R (id INT IDENTITY, test NVARCHAR(200), esperado NVARCHAR(100), resultado NVARCHAR(10), detalle NVARCHAR(500));

DECLARE @idReserva INT, @idUsuario INT, @saldo DECIMAL(14,2);

SELECT TOP 1 @idReserva = r.ID_reserva, @idUsuario = r.ID_usuario_cliente_reserva
FROM Reserva r
INNER JOIN EstadoReserva er ON er.ID_estado_reserva = r.ID_estado_reserva_reserva
WHERE er.nombre_estado_reserva IN ('PENDIENTE', 'CONFIRMADA')
ORDER BY r.ID_reserva DESC;

BEGIN TRY
    INSERT INTO MovimientoFinanciero
        (ID_reserva_movimiento, tipo_movimiento, monto_movimiento,
         moneda_movimiento, descripcion_movimiento_financiero, ID_usuario_movimiento)
    VALUES (@idReserva, 'DEPOSITO', 10000, 'CLP', 'Deposito QA liberacion', @idUsuario);

    EXEC dbo.u_sp_CancelarReserva
        @ID_reserva = @idReserva,
        @ID_usuario = @idUsuario,
        @motivo = N'Cancelacion QA con deposito',
        @monto_reembolso = NULL;

    IF EXISTS (
        SELECT 1 FROM MovimientoFinanciero
        WHERE ID_reserva_movimiento = @idReserva
          AND tipo_movimiento = 'LIBERACION_DEPOSITO'
          AND monto_movimiento = -10000
    )
        INSERT #R VALUES ('Cancelacion libera deposito', 'LIBERACION_DEPOSITO', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Cancelacion libera deposito', 'LIBERACION_DEPOSITO', 'FAIL', 'no se libero');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Cancelacion libera deposito', 'LIBERACION_DEPOSITO', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    SELECT @saldo = ISNULL(SUM(monto_movimiento), 0)
    FROM MovimientoFinanciero
    WHERE ID_reserva_movimiento = @idReserva
      AND tipo_movimiento IN ('DEPOSITO', 'LIBERACION_DEPOSITO');

    IF @saldo = 0
        INSERT #R VALUES ('Saldo de deposito', '0', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Saldo de deposito', '0', 'FAIL', CONCAT('saldo=', @saldo));
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Saldo de deposito', '0', 'FAIL', ERROR_MESSAGE());
END CATCH;

SELECT * FROM #R ORDER BY id;
SELECT resultado, COUNT(*) AS total FROM #R GROUP BY resultado;
