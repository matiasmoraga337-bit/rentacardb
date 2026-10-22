USE [RentaCarDB];
GO
SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

/* S4: notificaciones leidas y worker outbox. */

IF COL_LENGTH('dbo.Notificacion','fecha_lectura_notificacion') IS NULL
    ALTER TABLE dbo.Notificacion ADD fecha_lectura_notificacion DATETIME2(0) NULL;
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_notificacion_estado')
    ALTER TABLE dbo.Notificacion DROP CONSTRAINT CK_notificacion_estado;
GO
ALTER TABLE dbo.Notificacion WITH CHECK ADD CONSTRAINT CK_notificacion_estado
    CHECK (estado_notificacion IN ('PENDIENTE','ENVIADA','FALLIDA','LEIDA'));
GO
ALTER TABLE dbo.Notificacion CHECK CONSTRAINT CK_notificacion_estado;
GO

CREATE OR ALTER PROCEDURE [dbo].[u_sp_MarcarNotificacionLeida]
    @ID_notificacion BIGINT, @ID_usuario INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Notificacion
    SET estado_notificacion = 'LEIDA',
        fecha_lectura_notificacion = SYSDATETIME()
    WHERE ID_notificacion = @ID_notificacion
      AND ID_usuario_notificacion = @ID_usuario
      AND estado_notificacion IN ('PENDIENTE','ENVIADA');

    IF @@ROWCOUNT = 0
        THROW 60200, 'Notificacion no encontrada, de otro usuario o ya leida.', 1;

    SELECT * FROM Notificacion WHERE ID_notificacion = @ID_notificacion;
END;
GO
