USE [RentaCarDB];
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;

IF OBJECT_ID('tempdb..#R') IS NOT NULL DROP TABLE #R;
CREATE TABLE #R (id INT IDENTITY, test NVARCHAR(200), esperado NVARCHAR(100), resultado NVARCHAR(10), detalle NVARCHAR(500));

DECLARE @idCliente INT = (SELECT ID_usuario FROM Usuario WHERE email_usuario='qa.cliente@rentacar.cl');
DECLARE @idAdmin INT = (SELECT ID_usuario FROM Usuario WHERE email_usuario='qa.admin@rentacar.cl');
DECLARE @idNotif BIGINT, @idEvento BIGINT, @lock UNIQUEIDENTIFIER;

BEGIN TRY
    EXEC dbo.u_sp_RegistrarNotificacion @ID_usuario=@idCliente, @tipo='TEST_S4',
        @canal='PUSH', @destinatario='qa.cliente@rentacar.cl',
        @asunto=N'Notificacion S4', @cuerpo=N'Cuerpo de prueba S4';
    SET @idNotif = (SELECT TOP 1 ID_notificacion FROM Notificacion
                    WHERE ID_usuario_notificacion=@idCliente AND tipo_notificacion='TEST_S4'
                    ORDER BY ID_notificacion DESC);
    IF @idNotif IS NOT NULL
        INSERT #R VALUES ('Crear notificacion', 'PENDIENTE', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Crear notificacion', 'PENDIENTE', 'FAIL', 'no se creo');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Crear notificacion', 'PENDIENTE', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_MarcarNotificacionLeida @ID_notificacion=@idNotif, @ID_usuario=@idCliente;
    IF EXISTS (SELECT 1 FROM Notificacion WHERE ID_notificacion=@idNotif
               AND estado_notificacion='LEIDA' AND fecha_lectura_notificacion IS NOT NULL)
        INSERT #R VALUES ('Marcar notificacion leida', 'LEIDA', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Marcar notificacion leida', 'LEIDA', 'FAIL', 'no cambio');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Marcar notificacion leida', 'LEIDA', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_MarcarNotificacionLeida @ID_notificacion=@idNotif, @ID_usuario=@idAdmin;
    INSERT #R VALUES ('Marcar notificacion ajena', 'ERROR 60200', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Marcar notificacion ajena', 'ERROR 60200',
        CASE WHEN ERROR_NUMBER()=60200 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_MarcarNotificacionLeida @ID_notificacion=@idNotif, @ID_usuario=@idCliente;
    INSERT #R VALUES ('Marcar notificacion dos veces', 'ERROR 60200', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Marcar notificacion dos veces', 'ERROR 60200',
        CASE WHEN ERROR_NUMBER()=60200 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_PublicarEvento @tipo_evento='TestS4', @agregado_tipo='Test',
        @agregado_id=1, @payload='{"ok":true}';
    SET @idEvento = (SELECT TOP 1 ID_evento FROM OutboxEvento
                     WHERE tipo_evento='TestS4' ORDER BY ID_evento DESC);
    EXEC dbo.u_sp_ObtenerOutboxPendiente @cantidad=500;
    SELECT @lock = lock_id_outbox_evento FROM OutboxEvento WHERE ID_evento=@idEvento;
    IF @lock IS NOT NULL AND EXISTS (SELECT 1 FROM OutboxEvento WHERE ID_evento=@idEvento AND estado_outbox_evento='PROCESANDO')
        INSERT #R VALUES ('Outbox pendiente', 'PROCESANDO', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Outbox pendiente', 'PROCESANDO', 'FAIL', 'no se bloqueo');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Outbox pendiente', 'PROCESANDO', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_MarcarEventoProcesado @ID_evento=@idEvento, @exito=1, @lock_id=@lock;
    IF EXISTS (SELECT 1 FROM OutboxEvento WHERE ID_evento=@idEvento AND estado_outbox_evento='PROCESADO')
        INSERT #R VALUES ('Marcar evento procesado', 'PROCESADO', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Marcar evento procesado', 'PROCESADO', 'FAIL', 'no cambio');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Marcar evento procesado', 'PROCESADO', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_MarcarEventoProcesado @ID_evento=@idEvento, @exito=1, @lock_id=@lock;
    INSERT #R VALUES ('Marcar evento procesado dos veces', 'ERROR 70311', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Marcar evento procesado dos veces', 'ERROR 70311',
        CASE WHEN ERROR_NUMBER()=70311 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_ReintentarOutboxError @ID_evento=@idEvento;
    INSERT #R VALUES ('Reintentar evento procesado', 'ERROR 70312', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Reintentar evento procesado', 'ERROR 70312',
        CASE WHEN ERROR_NUMBER()=70312 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

SELECT * FROM #R ORDER BY id;
SELECT resultado, COUNT(*) AS total FROM #R GROUP BY resultado;
