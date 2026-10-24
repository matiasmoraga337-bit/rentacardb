USE [RentaCarDB];
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;

IF OBJECT_ID('tempdb..#R') IS NOT NULL DROP TABLE #R;
CREATE TABLE #R (id INT IDENTITY, test NVARCHAR(200), esperado NVARCHAR(100), resultado NVARCHAR(10), detalle NVARCHAR(500));

DECLARE @idEvento BIGINT, @idNotificacion BIGINT, @idUsuario INT;

BEGIN TRY
    EXEC dbo.u_sp_PublicarEvento
        @tipo_evento = 'QA_PUBLICAR',
        @agregado_tipo = 'QA',
        @agregado_id = 1,
        @payload = '{"ok":true}',
        @devolver_evento = 0;
    SET @idEvento = (SELECT TOP 1 ID_evento FROM OutboxEvento WHERE tipo_evento = 'QA_PUBLICAR' ORDER BY ID_evento DESC);
    IF @idEvento IS NOT NULL
        INSERT #R VALUES ('SP u_sp_PublicarEvento', 'evento creado', 'PASS', '');
    ELSE
        INSERT #R VALUES ('SP u_sp_PublicarEvento', 'evento creado', 'FAIL', 'sin evento');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('SP u_sp_PublicarEvento', 'evento creado', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    IF EXISTS (SELECT 1 FROM OutboxEvento WHERE tipo_evento = 'ReservaCreada')
        INSERT #R VALUES ('u_sp_CrearReserva usa u_sp_PublicarEvento', 'ReservaCreada', 'PASS', '');
    ELSE
        INSERT #R VALUES ('u_sp_CrearReserva usa u_sp_PublicarEvento', 'ReservaCreada', 'FAIL', 'sin evento');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('u_sp_CrearReserva usa u_sp_PublicarEvento', 'ReservaCreada', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    SET @idUsuario = (SELECT TOP 1 ID_usuario FROM Usuario WHERE activo_usuario = 1 ORDER BY ID_usuario);
    EXEC dbo.u_sp_RegistrarNotificacion
        @ID_usuario = @idUsuario,
        @tipo = 'QA_NOTIFICACION',
        @canal = 'PUSH',
        @destinatario = 'qa@rentacar.cl',
        @asunto = 'QA',
        @cuerpo = 'Notificacion QA';
    SET @idNotificacion = (SELECT TOP 1 ID_notificacion FROM Notificacion WHERE tipo_notificacion = 'QA_NOTIFICACION' ORDER BY ID_notificacion DESC);
    EXEC dbo.u_sp_MarcarNotificacionEnviada @ID_notificacion = @idNotificacion, @enviada = 1;
    IF EXISTS (SELECT 1 FROM Notificacion WHERE ID_notificacion = @idNotificacion AND estado_notificacion = 'ENVIADA')
        INSERT #R VALUES ('SP u_sp_MarcarNotificacionEnviada', 'ENVIADA', 'PASS', '');
    ELSE
        INSERT #R VALUES ('SP u_sp_MarcarNotificacionEnviada', 'ENVIADA', 'FAIL', 'estado incorrecto');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('SP u_sp_MarcarNotificacionEnviada', 'ENVIADA', 'FAIL', ERROR_MESSAGE());
END CATCH;

SELECT * FROM #R ORDER BY id;
SELECT resultado, COUNT(*) AS total FROM #R GROUP BY resultado;
