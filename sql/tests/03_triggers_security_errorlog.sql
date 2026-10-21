USE [RentaCarDB];
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;

IF OBJECT_ID('tempdb..#R') IS NOT NULL DROP TABLE #R;
CREATE TABLE #R (id INT IDENTITY, test NVARCHAR(200), esperado NVARCHAR(100), resultado NVARCHAR(10), detalle NVARCHAR(500));

DECLARE @idCliente INT = (SELECT ID_usuario FROM Usuario WHERE email_usuario='qa.cliente@rentacar.cl');
DECLARE @idVeh INT = (SELECT ID_vehiculo FROM Vehiculo WHERE patente_vehiculo='QAAB12');
DECLARE @idSede INT = (SELECT TOP 1 ID_sede_proveedor FROM SedeProveedor WHERE ID_proveedor_sede_proveedor =
    (SELECT ID_proveedor FROM Proveedor WHERE nombre_comercial_proveedor='QA Provider') ORDER BY ID_sede_proveedor);

-- ===================== TRIGGERS DE SOLAPAMIENTO (RESERVA) =====================
DECLARE @idRes1 INT;
BEGIN TRY
    INSERT INTO Reserva (ID_usuario_cliente_reserva, ID_vehiculo_reserva, ID_sede_retiro_reserva,
        ID_sede_devolucion_reserva, ID_estado_reserva_reserva, fecha_inicio_reserva, fecha_fin_reserva,
        precio_diario_aplicado_reserva, monto_subtotal_reserva, monto_total_reserva)
    VALUES (@idCliente, @idVeh, @idSede, @idSede, 1, '2026-03-01', '2026-03-05', 20000, 80000, 95200);
    SET @idRes1 = SCOPE_IDENTITY();
    INSERT #R VALUES ('Reserva base insertada', 'OK', 'PASS', CONCAT('ID=', @idRes1));
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Reserva base insertada', 'OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    INSERT INTO Reserva (ID_usuario_cliente_reserva, ID_vehiculo_reserva, ID_sede_retiro_reserva,
        ID_sede_devolucion_reserva, ID_estado_reserva_reserva, fecha_inicio_reserva, fecha_fin_reserva,
        precio_diario_aplicado_reserva, monto_subtotal_reserva, monto_total_reserva)
    VALUES (@idCliente, @idVeh, @idSede, @idSede, 1, '2026-03-03', '2026-03-07', 20000, 80000, 95200);
    INSERT #R VALUES ('Trigger reserva solapada', 'ERROR 70900', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Trigger reserva solapada', 'ERROR 70900', CASE WHEN ERROR_NUMBER()=70900 THEN 'PASS' ELSE 'FAIL' END, CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

BEGIN TRY
    INSERT INTO Reserva (ID_usuario_cliente_reserva, ID_vehiculo_reserva, ID_sede_retiro_reserva,
        ID_sede_devolucion_reserva, ID_estado_reserva_reserva, fecha_inicio_reserva, fecha_fin_reserva,
        precio_diario_aplicado_reserva, monto_subtotal_reserva, monto_total_reserva)
    VALUES (@idCliente, @idVeh, @idSede, @idSede, 1, '2026-03-05', '2026-03-08', 20000, 60000, 71400);
    INSERT #R VALUES ('Reserva adyacente (sin solape)', 'OK', 'PASS', '');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Reserva adyacente (sin solape)', 'OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

-- ===================== TRIGGER DE BLOQUEO =====================
BEGIN TRY
    INSERT INTO BloqueoVehiculo (ID_vehiculo_bloqueo, tipo_bloqueo, fecha_inicio_bloqueo, fecha_fin_bloqueo)
    VALUES (@idVeh, 'MANUAL', '2026-04-01', '2026-04-05');
    INSERT #R VALUES ('Bloqueo base insertado', 'OK', 'PASS', '');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Bloqueo base insertado', 'OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    INSERT INTO BloqueoVehiculo (ID_vehiculo_bloqueo, tipo_bloqueo, fecha_inicio_bloqueo, fecha_fin_bloqueo)
    VALUES (@idVeh, 'MANUAL', '2026-04-03', '2026-04-07');
    INSERT #R VALUES ('Trigger bloqueo solapado', 'ERROR 70901', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Trigger bloqueo solapado', 'ERROR 70901', CASE WHEN ERROR_NUMBER()=70901 THEN 'PASS' ELSE 'FAIL' END, CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

BEGIN TRY
    INSERT INTO BloqueoVehiculo (ID_vehiculo_bloqueo, tipo_bloqueo, fecha_inicio_bloqueo, fecha_fin_bloqueo)
    VALUES (@idVeh, 'MANUAL', '2026-04-05', '2026-04-08');
    INSERT #R VALUES ('Bloqueo adyacente (sin solape)', 'OK', 'PASS', '');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Bloqueo adyacente (sin solape)', 'OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

-- ===================== TRIGGER DE AUDITORIA =====================
DECLARE @audBefore INT = (SELECT COUNT(*) FROM Auditoria WHERE entidad_auditoria='Reserva' AND accion_auditoria='STATE_CHANGE');
BEGIN TRY
    UPDATE Reserva SET ID_estado_reserva_reserva = 2 WHERE ID_reserva = @idRes1;
    DECLARE @audAfter INT = (SELECT COUNT(*) FROM Auditoria WHERE entidad_auditoria='Reserva' AND accion_auditoria='STATE_CHANGE');
    INSERT #R VALUES ('Trigger auditoria STATE_CHANGE', 'nueva fila', CASE WHEN @audAfter > @audBefore THEN 'PASS' ELSE 'FAIL' END, CONCAT(@audBefore, '->', @audAfter));
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Trigger auditoria STATE_CHANGE', 'nueva fila', 'FAIL', ERROR_MESSAGE());
END CATCH;

-- ===================== SEGURIDAD / PERMISOS =====================
BEGIN TRY
    EXECUTE AS USER = 'api_user';
    DECLARE @cnt INT = (SELECT COUNT(*) FROM dbo.Vehiculo);
    REVERT;
    INSERT #R VALUES ('api_user puede SELECT en Vehiculo', 'OK', 'PASS', CONCAT('filas=', @cnt));
END TRY
BEGIN CATCH
    IF USER_NAME() <> 'dbo' REVERT;
    INSERT #R VALUES ('api_user puede SELECT en Vehiculo', 'OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXECUTE AS USER = 'api_user';
    EXEC dbo.u_sp_ValidarIntegridad;
    REVERT;
    INSERT #R VALUES ('api_user puede EXECUTE en SP', 'OK', 'PASS', '');
END TRY
BEGIN CATCH
    IF USER_NAME() <> 'dbo' REVERT;
    INSERT #R VALUES ('api_user puede EXECUTE en SP', 'OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXECUTE AS USER = 'api_user';
    UPDATE dbo.Vehiculo SET precio_diario_base_vehiculo = 1 WHERE 1=0;
    REVERT;
    INSERT #R VALUES ('api_user NO puede UPDATE directo en Vehiculo', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    IF USER_NAME() <> 'dbo' REVERT;
    INSERT #R VALUES ('api_user NO puede UPDATE directo en Vehiculo', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXECUTE AS USER = 'report_user';
    DECLARE @cnt2 INT = (SELECT COUNT(*) FROM dbo.Vehiculo);
    UPDATE dbo.Vehiculo SET precio_diario_base_vehiculo = 1 WHERE 1=0;
    REVERT;
    INSERT #R VALUES ('report_user NO puede UPDATE', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    IF USER_NAME() <> 'dbo' REVERT;
    INSERT #R VALUES ('report_user NO puede UPDATE', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

-- ===================== ERRORLOG =====================
DECLARE @elBefore INT = (SELECT COUNT(*) FROM ErrorLog);
BEGIN TRY
    EXEC dbo.u_sp_Login @email='noexiste.qa@rentacar.cl', @password_hash='x';
    INSERT #R VALUES ('ErrorLog: login invalido', 'ERROR + log', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    DECLARE @elAfter INT = (SELECT COUNT(*) FROM ErrorLog);
    IF @elAfter > @elBefore
       AND EXISTS (SELECT 1 FROM ErrorLog WHERE nombre_sp_origen_log='u_sp_Login'
                   AND parametros_json_log LIKE '%noexiste.qa@rentacar.cl%'
                   AND parametros_json_log NOT LIKE '%password%')
        INSERT #R VALUES ('ErrorLog: login invalido', 'ERROR + log', 'PASS', CONCAT('errores=', @elAfter - @elBefore));
    ELSE
        INSERT #R VALUES ('ErrorLog: login invalido', 'ERROR + log', 'FAIL', 'no se registro');
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_Login @email=''' OR 1=1 --', @password_hash='x';
    INSERT #R VALUES ('Intento de inyeccion (email)', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Intento de inyeccion (email)', 'ERROR', CASE WHEN OBJECT_ID('dbo.u_sp_Login') IS NOT NULL THEN 'PASS' ELSE 'FAIL' END, 'SP sigue existiendo');
END CATCH;

SELECT * FROM #R ORDER BY id;
SELECT resultado, COUNT(*) AS total FROM #R GROUP BY resultado;
