USE [RentaCarDB];
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;

IF OBJECT_ID('tempdb..#R') IS NOT NULL DROP TABLE #R;
CREATE TABLE #R (id INT IDENTITY, test NVARCHAR(200), esperado NVARCHAR(100), resultado NVARCHAR(10), detalle NVARCHAR(500));

DECLARE @idInspeccion INT = (SELECT TOP 1 ID_inspeccion_arriendo FROM InspeccionArriendo ORDER BY ID_inspeccion_arriendo DESC);
DECLARE @idCliente INT = (SELECT ID_usuario FROM Usuario WHERE email_usuario='qa.cliente@rentacar.cl');
DECLARE @idAdmin INT = (SELECT ID_usuario FROM Usuario WHERE email_usuario='qa.admin@rentacar.cl');
DECLARE @idMensaje BIGINT = (SELECT TOP 1 ID_mensaje FROM Mensaje ORDER BY ID_mensaje DESC);

BEGIN TRY
    EXEC dbo.u_sp_RegistrarInspeccionFoto @ID_inspeccion=@idInspeccion,
        @url_foto='/uploads/inspecciones/qa.webp', @angulo='FRENTE';
    IF EXISTS (SELECT 1 FROM InspeccionFoto WHERE ID_inspeccion_arriendo_inspeccion_foto=@idInspeccion
               AND url_foto_inspeccion='/uploads/inspecciones/qa.webp' AND activa_foto_inspeccion=1)
        INSERT #R VALUES ('Registrar foto inspeccion', 'activa', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Registrar foto inspeccion', 'activa', 'FAIL', 'no existe');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Registrar foto inspeccion', 'activa', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_RegistrarInspeccionFoto @ID_inspeccion=999999,
        @url_foto='/uploads/inspecciones/no.webp';
    INSERT #R VALUES ('Foto inspeccion inexistente', 'ERROR 60300', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Foto inspeccion inexistente', 'ERROR 60300',
        CASE WHEN ERROR_NUMBER()=60300 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_RegistrarMensajeAdjunto @ID_mensaje=@idMensaje,
        @url='/uploads/adjuntos/qa.pdf', @nombre=N'qa.pdf', @tipo_mime='application/pdf',
        @tamano=1024, @ID_usuario=@idCliente;
    IF EXISTS (SELECT 1 FROM MensajeAdjunto WHERE ID_mensaje_mensaje_adjunto=@idMensaje
               AND url_archivo_mensaje_adjunto='/uploads/adjuntos/qa.pdf' AND activo_mensaje_adjunto=1)
        INSERT #R VALUES ('Registrar adjunto chat', 'activo', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Registrar adjunto chat', 'activo', 'FAIL', 'no existe');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Registrar adjunto chat', 'activo', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_RegistrarMensajeAdjunto @ID_mensaje=@idMensaje,
        @url='/uploads/adjuntos/qa2.pdf', @nombre=N'qa2.pdf', @tipo_mime='application/pdf',
        @tamano=1024, @ID_usuario=@idAdmin;
    INSERT #R VALUES ('Adjunto usuario ajeno', 'ERROR 60303', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Adjunto usuario ajeno', 'ERROR 60303',
        CASE WHEN ERROR_NUMBER()=60303 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_RegistrarMensajeAdjunto @ID_mensaje=@idMensaje,
        @url='/uploads/adjuntos/qa3.pdf', @nombre=N'qa3.pdf', @tipo_mime='application/pdf',
        @tamano=0, @ID_usuario=@idCliente;
    INSERT #R VALUES ('Adjunto tamano invalido', 'ERROR 60305', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Adjunto tamano invalido', 'ERROR 60305',
        CASE WHEN ERROR_NUMBER()=60305 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_RegistrarMensajeAdjunto @ID_mensaje=999999,
        @url='/uploads/adjuntos/qa4.pdf', @nombre=N'qa4.pdf', @tipo_mime='application/pdf',
        @tamano=1024, @ID_usuario=@idCliente;
    INSERT #R VALUES ('Adjunto mensaje inexistente', 'ERROR 60302', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Adjunto mensaje inexistente', 'ERROR 60302',
        CASE WHEN ERROR_NUMBER()=60302 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

SELECT * FROM #R ORDER BY id;
SELECT resultado, COUNT(*) AS total FROM #R GROUP BY resultado;
