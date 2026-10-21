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

DECLARE @token2 CHAR(64), @url2 VARCHAR(200);
BEGIN TRY
    EXEC dbo.u_sp_WebPay_IniciarTransaccion @ID_reserva=@idRes, @monto=@montoTotal,
        @token_ws=@token2 OUTPUT, @url_redireccion=@url2 OUTPUT;
    DECLARE @pagosPendientes INT;
    SELECT @pagosPendientes = COUNT(*)
        FROM Pago p INNER JOIN EstadoPago ep ON ep.ID_estado_pago=p.ID_estado_pago_pago
        WHERE p.ID_reserva_pago=@idRes AND ep.nombre_estado_pago='PENDIENTE';
    IF @token2 = @token AND @pagosPendientes = 1
        INSERT #R VALUES ('WebPay reutiliza transaccion pendiente', '1 pago', 'PASS', '');
    ELSE
        INSERT #R VALUES ('WebPay reutiliza transaccion pendiente', '1 pago', 'FAIL',
            CONCAT('tokens=', CASE WHEN @token2=@token THEN 'iguales' ELSE 'distintos' END,
                   ' pagos=', @pagosPendientes));
END TRY
BEGIN CATCH
    INSERT #R VALUES ('WebPay reutiliza transaccion pendiente', '1 pago', 'FAIL', ERROR_MESSAGE());
END CATCH;

DECLARE @montoMalo DECIMAL(12,2) = @montoTotal + 1;
BEGIN TRY
    EXEC dbo.u_sp_WebPay_IniciarTransaccion @ID_reserva=@idRes, @monto=@montoMalo,
        @token_ws=@token2 OUTPUT, @url_redireccion=@url2 OUTPUT;
    INSERT #R VALUES ('WebPay monto distinto rechazado', 'ERROR 52007', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('WebPay monto distinto rechazado', 'ERROR 52007',
        CASE WHEN ERROR_NUMBER()=52007 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
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

IF EXISTS (SELECT 1 FROM HistorialEstadoReserva
           WHERE ID_reserva_historial=@idRes AND evento_historial_estado_reserva='CONFIRMAR')
    INSERT #R VALUES ('Historial CONFIRMAR por WebPay', 'existe', 'PASS', '');
ELSE
    INSERT #R VALUES ('Historial CONFIRMAR por WebPay', 'existe', 'FAIL', 'no existe');

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
    INSERT #R VALUES ('Pago sobre reserva ya confirmada', 'ERROR 52005', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Pago sobre reserva ya confirmada', 'ERROR 52005',
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

-- ===================== HARDENING WEBPAY =====================
DECLARE @inicio3 DATE = DATEADD(DAY, 60, @hoy);
DECLARE @fin3 DATE = DATEADD(DAY, 4, @inicio3);
DECLARE @inicio4 DATE = DATEADD(DAY, 80, @hoy);
DECLARE @fin4 DATE = DATEADD(DAY, 4, @inicio4);
DECLARE @inicio5 DATE = DATEADD(DAY, 100, @hoy);
DECLARE @fin5 DATE = DATEADD(DAY, 4, @inicio5);

DECLARE @keyPay VARCHAR(100) = CONCAT('QA-S2-PAY-', CONVERT(VARCHAR(36), NEWID()));
DECLARE @idPay INT, @montoPay DECIMAL(14,2), @tokenPay CHAR(64), @urlPay VARCHAR(200);
BEGIN TRY
    EXEC dbo.u_sp_CrearReserva @ID_usuario_cliente=@idCliente, @ID_vehiculo=@idVeh,
        @ID_sede_retiro=@idSede, @ID_sede_devolucion=@idSede,
        @fecha_inicio=@inicio3, @fecha_fin=@fin3, @idempotency_key=@keyPay;
    SET @idPay = (SELECT ID_reserva FROM Reserva WHERE idempotency_key_reserva=@keyPay);
    SELECT @montoPay = monto_total_reserva FROM Reserva WHERE ID_reserva=@idPay;
    EXEC dbo.u_sp_WebPay_IniciarTransaccion @ID_reserva=@idPay, @monto=@montoPay,
        @token_ws=@tokenPay OUTPUT, @url_redireccion=@urlPay OUTPUT;
    EXEC dbo.u_sp_WebPay_ConfirmarTransaccion @token_ws=@tokenPay, @aprobada=1;
    INSERT #R VALUES ('WebPay reserva para hardening', 'CONFIRMADA', 'PASS', CONCAT('ID=', @idPay));
END TRY
BEGIN CATCH
    INSERT #R VALUES ('WebPay reserva para hardening', 'CONFIRMADA', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_WebPay_ConfirmarTransaccion @token_ws=@tokenPay, @aprobada=1;
    INSERT #R VALUES ('WebPay doble confirmacion rechazada', 'ERROR 52034', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('WebPay doble confirmacion rechazada', 'ERROR 52034',
        CASE WHEN ERROR_NUMBER()=52034 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_WebPay_IniciarTransaccion @ID_reserva=@idPay, @monto=@montoPay,
        @token_ws=@tokenPay OUTPUT, @url_redireccion=@urlPay OUTPUT;
    INSERT #R VALUES ('WebPay iniciar sobre reserva confirmada', 'ERROR 52032', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('WebPay iniciar sobre reserva confirmada', 'ERROR 52032',
        CASE WHEN ERROR_NUMBER()=52032 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

DECLARE @keyRef VARCHAR(100) = CONCAT('QA-S2-REF-', CONVERT(VARCHAR(36), NEWID()));
DECLARE @montoExcesivo DECIMAL(14,2) = @montoPay + 1;
BEGIN TRY
    DECLARE @reembolsoId BIGINT;
    EXEC dbo.u_sp_CrearReembolso @ID_reserva=@idPay, @monto=@montoExcesivo,
        @motivo=N'Reembolso excesivo', @idempotency_key=@keyRef,
        @ID_usuario=@idCliente, @ID_reembolso_creado=@reembolsoId OUTPUT;
    INSERT #R VALUES ('Reembolso excesivo rechazado', 'ERROR 70301', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Reembolso excesivo rechazado', 'ERROR 70301',
        CASE WHEN ERROR_NUMBER()=70301 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

DECLARE @keyPend VARCHAR(100) = CONCAT('QA-S2-PEND-', CONVERT(VARCHAR(36), NEWID()));
DECLARE @idPend INT, @tokenPend CHAR(64), @urlPend VARCHAR(200);
BEGIN TRY
    EXEC dbo.u_sp_CrearReserva @ID_usuario_cliente=@idCliente, @ID_vehiculo=@idVeh,
        @ID_sede_retiro=@idSede, @ID_sede_devolucion=@idSede,
        @fecha_inicio=@inicio4, @fecha_fin=@fin4, @idempotency_key=@keyPend;
    SET @idPend = (SELECT ID_reserva FROM Reserva WHERE idempotency_key_reserva=@keyPend);
    DECLARE @montoPend DECIMAL(14,2);
    SELECT @montoPend = monto_total_reserva FROM Reserva WHERE ID_reserva=@idPend;
    EXEC dbo.u_sp_WebPay_IniciarTransaccion @ID_reserva=@idPend, @monto=@montoPend,
        @token_ws=@tokenPend OUTPUT, @url_redireccion=@urlPend OUTPUT;
    EXEC dbo.u_sp_CancelarReserva @ID_reserva=@idPend, @ID_usuario=@idCliente,
        @motivo=N'Cancelacion con pago pendiente', @monto_reembolso=NULL;
    INSERT #R VALUES ('Reserva cancelada con transaccion pendiente', 'CANCELADA', 'PASS', '');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Reserva cancelada con transaccion pendiente', 'CANCELADA', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_WebPay_ConfirmarTransaccion @token_ws=@tokenPend, @aprobada=1;
    INSERT #R VALUES ('WebPay confirmar tras cancelar', 'ERROR 52035', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('WebPay confirmar tras cancelar', 'ERROR 52035',
        CASE WHEN ERROR_NUMBER()=52035 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

DECLARE @inicio6 DATE = DATEADD(DAY, 120, @hoy);
DECLARE @fin6 DATE = DATEADD(DAY, 4, @inicio6);
DECLARE @keyExp VARCHAR(100) = CONCAT('QA-S2-EXP2-', CONVERT(VARCHAR(36), NEWID()));
DECLARE @idExp INT, @tokenExp CHAR(64), @urlExp VARCHAR(200), @montoExp DECIMAL(14,2);
BEGIN TRY
    EXEC dbo.u_sp_CrearReserva @ID_usuario_cliente=@idCliente, @ID_vehiculo=@idVeh,
        @ID_sede_retiro=@idSede, @ID_sede_devolucion=@idSede,
        @fecha_inicio=@inicio6, @fecha_fin=@fin6, @idempotency_key=@keyExp;
    SET @idExp = (SELECT ID_reserva FROM Reserva WHERE idempotency_key_reserva=@keyExp);
    SELECT @montoExp = monto_total_reserva FROM Reserva WHERE ID_reserva=@idExp;
    EXEC dbo.u_sp_WebPay_IniciarTransaccion @ID_reserva=@idExp, @monto=@montoExp,
        @token_ws=@tokenExp OUTPUT, @url_redireccion=@urlExp OUTPUT;
    UPDATE Reserva SET fecha_expiracion_reserva = DATEADD(MINUTE, -1, SYSDATETIME())
    WHERE ID_reserva=@idExp;
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Reserva para expiracion WebPay', 'OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_WebPay_ConfirmarTransaccion @token_ws=@tokenExp, @aprobada=1;
    INSERT #R VALUES ('WebPay confirmar reserva expirada', 'ERROR 52037', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('WebPay confirmar reserva expirada', 'ERROR 52037',
        CASE WHEN ERROR_NUMBER()=52037 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_CancelarReserva @ID_reserva=@idExp, @ID_usuario=@idCliente,
        @motivo=N'Limpieza expirada QA', @monto_reembolso=NULL;
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Limpieza reserva expirada', 'OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

DECLARE @keyOwn VARCHAR(100) = CONCAT('QA-S2-OWN-', CONVERT(VARCHAR(36), NEWID()));
DECLARE @idOwn INT;
BEGIN TRY
    EXEC dbo.u_sp_CrearReserva @ID_usuario_cliente=@idCliente, @ID_vehiculo=@idVeh,
        @ID_sede_retiro=@idSede, @ID_sede_devolucion=@idSede,
        @fecha_inicio=@inicio5, @fecha_fin=@fin5, @idempotency_key=@keyOwn;
    SET @idOwn = (SELECT ID_reserva FROM Reserva WHERE idempotency_key_reserva=@keyOwn);
    EXEC dbo.u_sp_CancelarReserva @ID_reserva=@idOwn, @ID_usuario=@idAdmin,
        @motivo=N'Intento de admin sin ownership', @monto_reembolso=NULL;
    INSERT #R VALUES ('Cancelacion por usuario ajeno rechazada', 'ERROR 70305', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Cancelacion por usuario ajeno rechazada', 'ERROR 70305',
        CASE WHEN ERROR_NUMBER()=70305 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_CancelarReserva @ID_reserva=@idOwn, @ID_usuario=@idCliente,
        @motivo=N'Limpieza QA', @monto_reembolso=NULL;
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Limpieza reserva ownership', 'OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

-- ===================== VISTA =====================
IF EXISTS (SELECT 1 FROM vw_ReservasDetalle WHERE ID_reserva=@idRes)
    INSERT #R VALUES ('vw_ReservasDetalle integrada', 'fila', 'PASS', '');
ELSE
    INSERT #R VALUES ('vw_ReservasDetalle integrada', 'fila', 'FAIL', 'no aparece');

SELECT * FROM #R ORDER BY id;
SELECT resultado, COUNT(*) AS total FROM #R GROUP BY resultado;
