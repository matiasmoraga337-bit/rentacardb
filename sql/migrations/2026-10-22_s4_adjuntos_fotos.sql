USE [RentaCarDB];
GO
SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

/* S4: fotos de inspeccion y adjuntos de chat. */
CREATE OR ALTER PROCEDURE [dbo].[u_sp_RegistrarInspeccionFoto]
    @ID_inspeccion INT, @url_foto VARCHAR(500), @angulo VARCHAR(30) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM InspeccionArriendo WHERE ID_inspeccion_arriendo = @ID_inspeccion)
        THROW 60300, 'Inspeccion no existe.', 1;
    IF @url_foto IS NULL OR LTRIM(RTRIM(@url_foto)) = ''
        THROW 60301, 'La URL de la foto es obligatoria.', 1;

    INSERT INTO InspeccionFoto
        (ID_inspeccion_arriendo_inspeccion_foto, url_foto_inspeccion, angulo_foto_inspeccion)
    VALUES (@ID_inspeccion, @url_foto, @angulo);

    SELECT * FROM InspeccionFoto WHERE ID_inspeccion_foto = SCOPE_IDENTITY();
END;
GO
CREATE OR ALTER PROCEDURE [dbo].[u_sp_RegistrarMensajeAdjunto]
    @ID_mensaje BIGINT, @url VARCHAR(500), @nombre NVARCHAR(255),
    @tipo_mime VARCHAR(100), @tamano INT, @ID_usuario INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ID_conversacion INT, @ID_cliente INT, @ID_proveedor INT;

    SELECT @ID_conversacion = m.ID_conversacion_mensaje,
           @ID_cliente = c.ID_usuario_conversacion,
           @ID_proveedor = c.ID_proveedor_conversacion
    FROM Mensaje m
    INNER JOIN Conversacion c ON c.ID_conversacion = m.ID_conversacion_mensaje
    WHERE m.ID_mensaje = @ID_mensaje;

    IF @ID_conversacion IS NULL THROW 60302, 'Mensaje no existe.', 1;
    IF @ID_usuario <> @ID_cliente
       AND NOT EXISTS (
           SELECT 1 FROM ProveedorUsuario pu
           WHERE pu.ID_proveedor_proveedor_usuario = @ID_proveedor
             AND pu.ID_usuario_proveedor_usuario = @ID_usuario
       )
        THROW 60303, 'Usuario no participa en la conversacion.', 1;
    IF @url IS NULL OR LTRIM(RTRIM(@url)) = '' THROW 60304, 'La URL del adjunto es obligatoria.', 1;
    IF @tamano IS NULL OR @tamano <= 0 THROW 60305, 'Tamano de archivo invalido.', 1;

    INSERT INTO MensajeAdjunto
        (ID_mensaje_mensaje_adjunto, url_archivo_mensaje_adjunto, nombre_archivo_mensaje_adjunto,
         tipo_mime_mensaje_adjunto, tamano_bytes_mensaje_adjunto)
    VALUES (@ID_mensaje, @url, @nombre, @tipo_mime, @tamano);

    SELECT * FROM MensajeAdjunto WHERE ID_adjunto_mensaje_adjunto = SCOPE_IDENTITY();
END;
GO