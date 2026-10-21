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
DECLARE @idSede INT = (SELECT TOP 1 ID_sede_proveedor FROM SedeProveedor WHERE ID_proveedor_sede_proveedor=@idProv ORDER BY ID_sede_proveedor);

-- Pago con reserva inexistente
BEGIN TRY
    EXEC dbo.u_sp_RegistrarPago @ID_reserva=999999, @ID_tipo_operacion_pago=1, @ID_metodo_pago=1,
        @monto_pago=1000, @aprobado=1;
    INSERT #R VALUES ('Pago con reserva inexistente', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Pago con reserva inexistente', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

-- WebPay iniciar con reserva inexistente
BEGIN TRY
    DECLARE @tok CHAR(64), @url VARCHAR(200);
    EXEC dbo.u_sp_WebPay_IniciarTransaccion @ID_reserva=999999, @monto=1000, @token_ws=@tok OUTPUT, @url_redireccion=@url OUTPUT;
    INSERT #R VALUES ('WebPay iniciar reserva inexistente', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('WebPay iniciar reserva inexistente', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

-- WebPay confirmar token invalido
BEGIN TRY
    DECLARE @badToken CHAR(64) = REPLICATE('x',64);
    EXEC dbo.u_sp_WebPay_ConfirmarTransaccion @token_ws=@badToken, @aprobada=1;
    INSERT #R VALUES ('WebPay confirmar token invalido', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('WebPay confirmar token invalido', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

-- Iniciar arriendo con reserva inexistente
BEGIN TRY
    EXEC dbo.u_sp_IniciarArriendo @ID_reserva=999999, @ID_sede_retiro_real=@idSede,
        @kilometraje_inicial=1000, @combustible_inicial=50;
    INSERT #R VALUES ('Iniciar arriendo reserva inexistente', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Iniciar arriendo reserva inexistente', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

-- Devolucion con arriendo inexistente
BEGIN TRY
    EXEC dbo.u_sp_RegistrarDevolucion @ID_arriendo=999999, @ID_sede_devolucion_real=@idSede,
        @kilometraje_final=2000, @combustible_final=50;
    INSERT #R VALUES ('Devolucion arriendo inexistente', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Devolucion arriendo inexistente', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

-- Multa con monto negativo
BEGIN TRY
    EXEC dbo.u_sp_RegistrarMulta @ID_arriendo=999999, @fecha_multa='2026-01-01',
        @descripcion='Prueba', @monto=-1;
    INSERT #R VALUES ('Multa monto negativo', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Multa monto negativo', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

-- Chat: crear conversacion, enviar mensaje Unicode y cerrar
DECLARE @idConv INT;
BEGIN TRY
    EXEC dbo.u_sp_CrearConversacion @ID_usuario=@idCliente, @ID_proveedor=@idProv, @ID_vehiculo=@idVeh;
    SET @idConv = (SELECT ID_conversacion FROM Conversacion
                   WHERE ID_usuario_conversacion=@idCliente AND ID_proveedor_conversacion=@idProv
                     AND ID_vehiculo_conversacion=@idVeh);
    INSERT #R VALUES ('Crear conversacion', 'OK', CASE WHEN @idConv IS NOT NULL THEN 'PASS' ELSE 'FAIL' END, CONCAT('ID=', @idConv));
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Crear conversacion', 'OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_EnviarMensaje @ID_conversacion=@idConv, @ID_usuario_emisor=@idCliente,
        @contenido=N'Mensaje de prueba con Ñ y acentos áéíóú';
    IF EXISTS (SELECT 1 FROM Mensaje WHERE ID_conversacion_mensaje=@idConv AND contenido_mensaje LIKE N'%Ñ%')
        INSERT #R VALUES ('Enviar mensaje Unicode', 'OK', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Enviar mensaje Unicode', 'OK', 'FAIL', 'no se guardo');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Enviar mensaje Unicode', 'OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_CerrarConversacion @ID_conversacion=@idConv, @ID_usuario=@idCliente;
    IF EXISTS (SELECT 1 FROM Conversacion WHERE ID_conversacion=@idConv AND activa_conversacion=0)
        INSERT #R VALUES ('Cerrar conversacion', 'OK', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Cerrar conversacion', 'OK', 'FAIL', 'sigue activa');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Cerrar conversacion', 'OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

-- Liquidaciones / outbox inexistentes
BEGIN TRY
    EXEC dbo.u_sp_AprobarLiquidacion @ID_liquidacion=999999, @ID_usuario=@idAdmin;
    INSERT #R VALUES ('Aprobar liquidacion inexistente', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Aprobar liquidacion inexistente', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_MarcarLiquidacionPagada @ID_liquidacion=999999, @ID_usuario=@idAdmin;
    INSERT #R VALUES ('Pagar liquidacion inexistente', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Pagar liquidacion inexistente', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_ReintentarOutboxError @ID_evento=999999;
    INSERT #R VALUES ('Reintentar outbox inexistente', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Reintentar outbox inexistente', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

SELECT * FROM #R ORDER BY id;
SELECT resultado, COUNT(*) AS total FROM #R GROUP BY resultado;
