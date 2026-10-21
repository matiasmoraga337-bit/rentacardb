USE [RentaCarDB];
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;

IF OBJECT_ID('tempdb..#R') IS NOT NULL DROP TABLE #R;
CREATE TABLE #R (id INT IDENTITY, test NVARCHAR(200), esperado NVARCHAR(100), resultado NVARCHAR(10), detalle NVARCHAR(500));

DECLARE @idCliente INT = (SELECT ID_usuario FROM Usuario WHERE email_usuario='qa.cliente@rentacar.cl');
DECLARE @idAdmin INT = (SELECT ID_usuario FROM Usuario WHERE email_usuario='qa.admin@rentacar.cl');
DECLARE @idProv INT = (SELECT ID_proveedor FROM Proveedor WHERE nombre_comercial_proveedor='QA Provider');
DECLARE @idVeh INT = (SELECT ID_vehiculo FROM Vehiculo WHERE patente_vehiculo='QAAB12');
DECLARE @idSede INT = (SELECT TOP 1 ID_sede_proveedor FROM SedeProveedor
                       WHERE ID_proveedor_sede_proveedor=@idProv ORDER BY ID_sede_proveedor);

DECLARE @hoy DATE = CAST(GETDATE() AS DATE);
DECLARE @inicio DATE = DATEADD(DAY, 20, @hoy);
DECLARE @fin DATE = DATEADD(DAY, 4, @inicio);
DECLARE @inicio2 DATE = DATEADD(DAY, 40, @hoy);
DECLARE @fin2 DATE = DATEADD(DAY, 4, @inicio2);
DECLARE @finTarifa DATE = DATEADD(YEAR, 3, @hoy);
DECLARE @inicioSolape DATE = DATEADD(DAY, 1, @inicio);
DECLARE @finAdyacente DATE = DATEADD(DAY, 4, @fin);

-- Tarifa dinamica para que la prueba no dependa del ano calendario.
IF NOT EXISTS (SELECT 1 FROM TarifaVehiculo WHERE ID_vehiculo_tarifa=@idVeh AND nombre_tarifa='QA Tarifa S2')
    EXEC dbo.u_sp_RegistrarTarifaVehiculo @ID_vehiculo=@idVeh, @ID_proveedor=@idProv,
        @nombre='QA Tarifa S2', @fecha_inicio=@hoy, @fecha_fin=@finTarifa,
        @precio_dia=20000, @prioridad=99, @dias_minimos=1, @dias_maximos=60;

-- ===================== CREAR RESERVA =====================
DECLARE @key VARCHAR(100) = CONCAT('QA-S2-', CONVERT(VARCHAR(36), NEWID()));
DECLARE @idRes INT;
BEGIN TRY
    EXEC dbo.u_sp_CrearReserva @ID_usuario_cliente=@idCliente, @ID_vehiculo=@idVeh,
        @ID_sede_retiro=@idSede, @ID_sede_devolucion=@idSede,
        @fecha_inicio=@inicio, @fecha_fin=@fin,
        @observaciones=N'Reserva QA S2', @idempotency_key=@key;
    SET @idRes = (SELECT ID_reserva FROM Reserva WHERE idempotency_key_reserva=@key);
    IF @idRes IS NOT NULL
       AND EXISTS (SELECT 1 FROM Reserva r INNER JOIN EstadoReserva er ON er.ID_estado_reserva=r.ID_estado_reserva_reserva
                   WHERE r.ID_reserva=@idRes AND er.nombre_estado_reserva='PENDIENTE')
        INSERT #R VALUES ('Crear reserva PENDIENTE', 'OK', 'PASS', CONCAT('ID=', @idRes));
    ELSE
        INSERT #R VALUES ('Crear reserva PENDIENTE', 'OK', 'FAIL', 'no se creo');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Crear reserva PENDIENTE', 'OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

IF EXISTS (SELECT 1 FROM ReservaSnapshot WHERE ID_reserva_snapshot=@idRes)
    INSERT #R VALUES ('Snapshot de reserva', 'existe', 'PASS', '');
ELSE
    INSERT #R VALUES ('Snapshot de reserva', 'existe', 'FAIL', 'no existe');

IF EXISTS (SELECT 1 FROM BloqueoVehiculo WHERE ID_reserva_bloqueo=@idRes AND activo_bloqueo=1)
    INSERT #R VALUES ('Bloqueo de vehiculo activo', 'existe', 'PASS', '');
ELSE
    INSERT #R VALUES ('Bloqueo de vehiculo activo', 'existe', 'FAIL', 'no existe');

IF EXISTS (SELECT 1 FROM HistorialEstadoReserva WHERE ID_reserva_historial=@idRes
           AND evento_historial_estado_reserva='CREAR')
    INSERT #R VALUES ('Historial CREAR', 'existe', 'PASS', '');
ELSE
    INSERT #R VALUES ('Historial CREAR', 'existe', 'FAIL', 'no existe');

-- ===================== IDEMPOTENCIA =====================
BEGIN TRY
    EXEC dbo.u_sp_CrearReserva @ID_usuario_cliente=@idCliente, @ID_vehiculo=@idVeh,
        @ID_sede_retiro=@idSede, @ID_sede_devolucion=@idSede,
        @fecha_inicio=@inicio, @fecha_fin=@fin, @idempotency_key=@key;
    DECLARE @cantidad INT = (SELECT COUNT(*) FROM Reserva WHERE idempotency_key_reserva=@key);
    IF @cantidad = 1
        INSERT #R VALUES ('Idempotencia de reserva', '1 fila', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Idempotencia de reserva', '1 fila', 'FAIL', CONCAT('filas=', @cantidad));
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Idempotencia de reserva', '1 fila', 'FAIL', ERROR_MESSAGE());
END CATCH;

-- ===================== SOLAPAMIENTO =====================
DECLARE @keyOver VARCHAR(100) = CONCAT('QA-S2-OVER-', CONVERT(VARCHAR(36), NEWID()));
BEGIN TRY
    EXEC dbo.u_sp_CrearReserva @ID_usuario_cliente=@idCliente, @ID_vehiculo=@idVeh,
        @ID_sede_retiro=@idSede, @ID_sede_devolucion=@idSede,
        @fecha_inicio=@inicioSolape, @fecha_fin=@fin,
        @idempotency_key=@keyOver;
    INSERT #R VALUES ('Rechazo de solapamiento', 'ERROR 70209/70900', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Rechazo de solapamiento', 'ERROR 70209/70900',
        CASE WHEN ERROR_NUMBER() IN (70209, 70900) THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

DECLARE @idRes2 INT;
DECLARE @key2 VARCHAR(100) = CONCAT('QA-S2-ADJ-', CONVERT(VARCHAR(36), NEWID()));
BEGIN TRY
    EXEC dbo.u_sp_CrearReserva @ID_usuario_cliente=@idCliente, @ID_vehiculo=@idVeh,
        @ID_sede_retiro=@idSede, @ID_sede_devolucion=@idSede,
        @fecha_inicio=@fin, @fecha_fin=@finAdyacente,
        @idempotency_key=@key2;
    SET @idRes2 = (SELECT ID_reserva FROM Reserva WHERE idempotency_key_reserva=@key2);
    INSERT #R VALUES ('Reserva adyacente permitida', 'OK', CASE WHEN @idRes2 IS NOT NULL THEN 'PASS' ELSE 'FAIL' END, '');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Reserva adyacente permitida', 'OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

-- ===================== WEBPAY =====================
DECLARE @token CHAR(64), @url VARCHAR(200), @montoTotal DECIMAL(14,2);
SELECT @montoTotal = monto_total_reserva FROM Reserva WHERE ID_reserva=@idRes;
BEGIN TRY
    EXEC dbo.u_sp_WebPay_IniciarTransaccion @ID_reserva=@idRes, @monto=@montoTotal,
        @token_ws=@token OUTPUT, @url_redireccion=@url OUTPUT;
    IF LEN(RTRIM(@token)) = 64
        INSERT #R VALUES ('WebPay iniciar', 'token 64', 'PASS', @url);
    ELSE
        INSERT #R VALUES ('WebPay iniciar', 'token 64', 'FAIL', CONCAT('token=', @token));
END TRY
BEGIN CATCH
    INSERT #R VALUES ('WebPay iniciar', 'token 64', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_WebPay_ConfirmarTransaccion @token_ws=@token, @aprobada=1;
    IF EXISTS (SELECT 1 FROM Reserva r INNER JOIN EstadoReserva er ON er.ID_estado_reserva=r.ID_estado_reserva_reserva
               WHERE r.ID_reserva=@idRes AND er.nombre_estado_reserva='CONFIRMADA')
        INSERT #R VALUES ('WebPay confirmar reserva', 'CONFIRMADA', 'PASS', '');
    ELSE
        INSERT #R VALUES ('WebPay confirmar reserva', 'CONFIRMADA', 'FAIL', 'no confirmo');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('WebPay confirmar reserva', 'CONFIRMADA', 'FAIL', ERROR_MESSAGE());
END CATCH;

IF EXISTS (SELECT 1 FROM Pago p INNER JOIN EstadoPago ep ON ep.ID_estado_pago=p.ID_estado_pago_pago
           WHERE p.ID_reserva_pago=@idRes AND ep.nombre_estado_pago='APROBADO')
    INSERT #R VALUES ('Pago aprobado registrado', 'APROBADO', 'PASS', '');
ELSE
    INSERT #R VALUES ('Pago aprobado registrado', 'APROBADO', 'FAIL', 'no existe');

IF EXISTS (SELECT 1 FROM Auditoria WHERE entidad_auditoria='Pago' AND accion_auditoria='FINANCIAL'
           AND ID_registro_auditoria IN (SELECT ID_pago FROM Pago WHERE ID_reserva_pago=@idRes))
    INSERT #R VALUES ('Trigger auditoria de Pago', 'fila FINANCIAL', 'PASS', '');
ELSE
    INSERT #R VALUES ('Trigger auditoria de Pago', 'fila FINANCIAL', 'FAIL', 'no existe');

BEGIN TRY
    EXEC dbo.u_sp_RegistrarPago @ID_reserva=@idRes, @ID_tipo_operacion_pago=1,
        @ID_metodo_pago=1, @monto_pago=@montoTotal, @aprobado=1;
    INSERT #R VALUES ('Pago duplicado rechazado', 'ERROR 52005', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Pago duplicado rechazado', 'ERROR 52005',
        CASE WHEN ERROR_NUMBER()=52005 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

-- ===================== CANCELACION CON REEMBOLSO =====================
DECLARE @keyCancel VARCHAR(100) = CONCAT('QA-S2-CANCEL-', CONVERT(VARCHAR(36), NEWID()));
DECLARE @fueIdempotente BIT = 0;
BEGIN TRY
    EXEC dbo.u_sp_CancelarReserva @ID_reserva=@idRes, @ID_usuario=@idCliente,
        @motivo=N'Cancelacion QA S2', @monto_reembolso=@montoTotal,
        @motivo_reembolso=N'Reembolso QA S2', @idempotency_key=@keyCancel,
        @referencia_externa='QA-S2-REF', @fue_idempotente=@fueIdempotente OUTPUT;
    IF EXISTS (SELECT 1 FROM Reserva r INNER JOIN EstadoReserva er ON er.ID_estado_reserva=r.ID_estado_reserva_reserva
               WHERE r.ID_reserva=@idRes AND er.nombre_estado_reserva='CANCELADA')
        INSERT #R VALUES ('Cancelar reserva', 'CANCELADA', 'PASS', CONCAT('idempotente=', @fueIdempotente));
    ELSE
        INSERT #R VALUES ('Cancelar reserva', 'CANCELADA', 'FAIL', 'no cancelo');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Cancelar reserva', 'CANCELADA', 'FAIL', ERROR_MESSAGE());
END CATCH;

IF EXISTS (SELECT 1 FROM Reembolso WHERE ID_reserva_reembolso=@idRes AND estado_reembolso='COMPLETADO')
    INSERT #R VALUES ('Reembolso completado', 'COMPLETADO', 'PASS', '');
ELSE
    INSERT #R VALUES ('Reembolso completado', 'COMPLETADO', 'FAIL', 'no existe');

IF EXISTS (SELECT 1 FROM MovimientoFinanciero WHERE ID_reserva_movimiento=@idRes
           AND tipo_movimiento='REEMBOLSO' AND monto_movimiento < 0)
    INSERT #R VALUES ('Movimiento de reembolso', 'negativo', 'PASS', '');
ELSE
    INSERT #R VALUES ('Movimiento de reembolso', 'negativo', 'FAIL', 'no existe');

BEGIN TRY
    SET @fueIdempotente = 0;
    EXEC dbo.u_sp_CancelarReserva @ID_reserva=@idRes, @ID_usuario=@idCliente,
        @motivo=N'Cancelacion QA S2', @monto_reembolso=@montoTotal,
        @motivo_reembolso=N'Reembolso QA S2', @idempotency_key=@keyCancel,
        @referencia_externa='QA-S2-REF', @fue_idempotente=@fueIdempotente OUTPUT;
    DECLARE @cantReembolsos INT = (SELECT COUNT(*) FROM Reembolso WHERE ID_reserva_reembolso=@idRes);
    IF @fueIdempotente = 1 AND @cantReembolsos = 1
        INSERT #R VALUES ('Cancelacion idempotente', '1 reembolso', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Cancelacion idempotente', '1 reembolso', 'FAIL',
            CONCAT('idempotente=', @fueIdempotente, ' reembolsos=', @cantReembolsos));
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Cancelacion idempotente', '1 reembolso', 'FAIL', ERROR_MESSAGE());
END CATCH;

-- ===================== CANCELACION SIN REEMBOLSO =====================
BEGIN TRY
    EXEC dbo.u_sp_CancelarReserva @ID_reserva=@idRes2, @ID_usuario=@idCliente,
        @motivo=N'Cancelacion sin pago QA', @monto_reembolso=NULL;
    IF EXISTS (SELECT 1 FROM Reserva r INNER JOIN EstadoReserva er ON er.ID_estado_reserva=r.ID_estado_reserva_reserva
               WHERE r.ID_reserva=@idRes2 AND er.nombre_estado_reserva='CANCELADA')
       AND NOT EXISTS (SELECT 1 FROM Reembolso WHERE ID_reserva_reembolso=@idRes2)
        INSERT #R VALUES ('Cancelar sin reembolso', 'CANCELADA', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Cancelar sin reembolso', 'CANCELADA', 'FAIL', 'estado o reembolso inesperado');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Cancelar sin reembolso', 'CANCELADA', 'FAIL', ERROR_MESSAGE());
END CATCH;

-- ===================== EXPIRACION (CURSOR) =====================
DECLARE @key3 VARCHAR(100) = CONCAT('QA-S2-EXP-', CONVERT(VARCHAR(36), NEWID()));
DECLARE @idRes3 INT;
BEGIN TRY
    EXEC dbo.u_sp_CrearReserva @ID_usuario_cliente=@idCliente, @ID_vehiculo=@idVeh,
        @ID_sede_retiro=@idSede, @ID_sede_devolucion=@idSede,
        @fecha_inicio=@inicio2, @fecha_fin=@fin2, @idempotency_key=@key3;
    SET @idRes3 = (SELECT ID_reserva FROM Reserva WHERE idempotency_key_reserva=@key3);
    UPDATE Reserva SET fecha_expiracion_reserva = DATEADD(MINUTE, -1, SYSDATETIME())
    WHERE ID_reserva=@idRes3;
    EXEC dbo.u_sp_ExpirarReservas;
    IF EXISTS (SELECT 1 FROM Reserva r INNER JOIN EstadoReserva er ON er.ID_estado_reserva=r.ID_estado_reserva_reserva
               WHERE r.ID_reserva=@idRes3 AND er.nombre_estado_reserva='EXPIRADA')
       AND NOT EXISTS (SELECT 1 FROM BloqueoVehiculo WHERE ID_reserva_bloqueo=@idRes3 AND activo_bloqueo=1)
        INSERT #R VALUES ('Expiracion de reserva (cursor)', 'EXPIRADA', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Expiracion de reserva (cursor)', 'EXPIRADA', 'FAIL', 'no expiro o bloqueo activo');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Expiracion de reserva (cursor)', 'EXPIRADA', 'FAIL', ERROR_MESSAGE());
END CATCH;

-- ===================== VISTA =====================
IF EXISTS (SELECT 1 FROM vw_ReservasDetalle WHERE ID_reserva=@idRes)
    INSERT #R VALUES ('vw_ReservasDetalle integrada', 'fila', 'PASS', '');
ELSE
    INSERT #R VALUES ('vw_ReservasDetalle integrada', 'fila', 'FAIL', 'no aparece');

SELECT * FROM #R ORDER BY id;
SELECT resultado, COUNT(*) AS total FROM #R GROUP BY resultado;
