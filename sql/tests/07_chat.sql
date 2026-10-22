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
DECLARE @idConv INT;

BEGIN TRY
    EXEC dbo.u_sp_CrearConversacion @ID_usuario=@idCliente, @ID_proveedor=@idProv, @ID_vehiculo=@idVeh;
    SET @idConv = (SELECT TOP 1 ID_conversacion FROM Conversacion
                   WHERE ID_usuario_conversacion=@idCliente AND ID_proveedor_conversacion=@idProv
                     AND ID_vehiculo_conversacion=@idVeh AND activa_conversacion=1
                   ORDER BY ID_conversacion DESC);
    INSERT #R VALUES ('Crear conversacion', 'activa', CASE WHEN @idConv IS NOT NULL THEN 'PASS' ELSE 'FAIL' END, CONCAT('ID=', @idConv));
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Crear conversacion', 'activa', 'FAIL', ERROR_MESSAGE());
END CATCH;

DECLARE @idConvReuso INT;
BEGIN TRY
    EXEC dbo.u_sp_CrearConversacion @ID_usuario=@idCliente, @ID_proveedor=@idProv, @ID_vehiculo=@idVeh;
    SET @idConvReuso = (SELECT TOP 1 ID_conversacion FROM Conversacion
                        WHERE ID_usuario_conversacion=@idCliente AND ID_proveedor_conversacion=@idProv
                          AND ID_vehiculo_conversacion=@idVeh AND activa_conversacion=1
                        ORDER BY ID_conversacion DESC);
    INSERT #R VALUES ('Reutilizar conversacion activa', 'mismo ID',
        CASE WHEN @idConvReuso = @idConv THEN 'PASS' ELSE 'FAIL' END,
        CONCAT('ID=', @idConvReuso));
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Reutilizar conversacion activa', 'mismo ID', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_EnviarMensaje @ID_conversacion=@idConv, @ID_usuario_emisor=@idCliente,
        @contenido=N'Hola, consulta con Ñ y acentos áéíóú', @tipo_mensaje='TEXTO';
    IF EXISTS (SELECT 1 FROM Mensaje WHERE ID_conversacion_mensaje=@idConv AND contenido_mensaje LIKE N'%Ñ%')
        INSERT #R VALUES ('Enviar mensaje Unicode', 'OK', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Enviar mensaje Unicode', 'OK', 'FAIL', 'no se guardo');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Enviar mensaje Unicode', 'OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

IF (SELECT COUNT(*) FROM Mensaje WHERE ID_conversacion_mensaje=@idConv) >= 1
    INSERT #R VALUES ('Listar mensajes', '>=1', 'PASS', '');
ELSE
    INSERT #R VALUES ('Listar mensajes', '>=1', 'FAIL', 'sin mensajes');

IF EXISTS (SELECT 1 FROM Conversacion WHERE ID_conversacion=@idConv AND fecha_ultimo_mensaje_conversacion IS NOT NULL)
    INSERT #R VALUES ('Preview de ultimo mensaje', 'actualizado', 'PASS', '');
ELSE
    INSERT #R VALUES ('Preview de ultimo mensaje', 'actualizado', 'FAIL', 'sin fecha');

BEGIN TRY
    EXEC dbo.u_sp_MarcarMensajesLeidos @ID_conversacion=@idConv, @ID_usuario=@idAdmin;
    INSERT #R VALUES ('Marcar leidos sin permisos', 'ERROR 60096', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Marcar leidos sin permisos', 'ERROR 60096',
        CASE WHEN ERROR_NUMBER()=60096 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_CerrarConversacion @ID_conversacion=@idConv, @ID_usuario=@idAdmin;
    INSERT #R VALUES ('Cerrar conversacion sin permisos', 'ERROR 60094', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Cerrar conversacion sin permisos', 'ERROR 60094',
        CASE WHEN ERROR_NUMBER()=60094 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_CerrarConversacion @ID_conversacion=@idConv, @ID_usuario=@idCliente;
    IF EXISTS (SELECT 1 FROM Conversacion WHERE ID_conversacion=@idConv AND activa_conversacion=0)
        INSERT #R VALUES ('Cerrar conversacion', 'cerrada', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Cerrar conversacion', 'cerrada', 'FAIL', 'sigue activa');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Cerrar conversacion', 'cerrada', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_EnviarMensaje @ID_conversacion=@idConv, @ID_usuario_emisor=@idCliente,
        @contenido=N'Mensaje tras cierre', @tipo_mensaje='TEXTO';
    INSERT #R VALUES ('Enviar tras cierre rechazado', 'ERROR 60091', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Enviar tras cierre rechazado', 'ERROR 60091',
        CASE WHEN ERROR_NUMBER()=60091 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

DECLARE @idConvNueva INT;
BEGIN TRY
    EXEC dbo.u_sp_CrearConversacion @ID_usuario=@idCliente, @ID_proveedor=@idProv, @ID_vehiculo=@idVeh;
    SET @idConvNueva = (SELECT TOP 1 ID_conversacion FROM Conversacion
                        WHERE ID_usuario_conversacion=@idCliente AND ID_proveedor_conversacion=@idProv
                          AND ID_vehiculo_conversacion=@idVeh AND activa_conversacion=1
                        ORDER BY ID_conversacion DESC);
    IF @idConvNueva IS NOT NULL AND @idConvNueva <> @idConv
        INSERT #R VALUES ('Nueva conversacion tras cierre', 'nuevo ID', 'PASS', CONCAT('ID=', @idConvNueva));
    ELSE
        INSERT #R VALUES ('Nueva conversacion tras cierre', 'nuevo ID', 'FAIL', 'no se creo');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Nueva conversacion tras cierre', 'nuevo ID', 'FAIL', ERROR_MESSAGE());
END CATCH;

SELECT * FROM #R ORDER BY id;
SELECT resultado, COUNT(*) AS total FROM #R GROUP BY resultado;
