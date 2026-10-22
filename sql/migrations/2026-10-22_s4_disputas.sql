USE [RentaCarDB];
GO
SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

/* S4: disputas (apertura y resolucion por ADMIN). */
CREATE OR ALTER PROCEDURE [dbo].[u_sp_CrearDisputa]
    @ID_arriendo INT, @ID_usuario_reporta INT, @tipo_disputa VARCHAR(50),
    @descripcion NVARCHAR(1000), @monto_disputado DECIMAL(12,2) = NULL
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    DECLARE @ID_cliente INT, @ID_proveedor INT, @nombre_estado VARCHAR(50),
            @ID_estado_disputa INT, @ID_disputa INT;

    IF @monto_disputado IS NOT NULL AND @monto_disputado <= 0
        THROW 60113, 'El monto disputado debe ser mayor que cero.', 1;
    IF @tipo_disputa NOT IN ('DANO','COBRO','SERVICIO','DOCUMENTO','OTRO')
        THROW 60114, 'Tipo de disputa invalido.', 1;

    SELECT @ID_cliente = r.ID_usuario_cliente_reserva,
           @ID_proveedor = v.ID_proveedor_vehiculo,
           @nombre_estado = ea.nombre_estado_arriendo
    FROM Arriendo a
    INNER JOIN Reserva r ON r.ID_reserva = a.ID_reserva_arriendo
    INNER JOIN Vehiculo v ON v.ID_vehiculo = r.ID_vehiculo_reserva
    INNER JOIN EstadoArriendo ea ON ea.ID_estado_arriendo = a.ID_estado_arriendo_arriendo
    WHERE a.ID_arriendo = @ID_arriendo;

    IF @ID_cliente IS NULL THROW 60110, 'Arriendo no existe.', 1;
    IF @nombre_estado <> 'FINALIZADO'
        THROW 60110, 'Solo se abren disputas sobre un arriendo FINALIZADO.', 1;

    IF @ID_usuario_reporta <> @ID_cliente
       AND NOT EXISTS (
           SELECT 1 FROM ProveedorUsuario pu
           WHERE pu.ID_proveedor_proveedor_usuario = @ID_proveedor
             AND pu.ID_usuario_proveedor_usuario = @ID_usuario_reporta
       )
        THROW 60112, 'El usuario no es parte del arriendo.', 1;

    IF EXISTS (
        SELECT 1
        FROM Disputa d
        INNER JOIN EstadoDisputa ed ON ed.ID_estado_disputa = d.ID_estado_disputa_disputa
        WHERE d.ID_arriendo_disputa = @ID_arriendo
          AND d.ID_usuario_reporta_disputa = @ID_usuario_reporta
          AND ed.nombre_estado_disputa IN ('ABIERTA','EN_REVISION')
    ) THROW 60111, 'Ya existe una disputa abierta para este arriendo.', 1;

    SELECT @ID_estado_disputa = ID_estado_disputa FROM EstadoDisputa
    WHERE nombre_estado_disputa = 'ABIERTA';

    INSERT INTO Disputa
        (ID_arriendo_disputa, ID_usuario_reporta_disputa, ID_estado_disputa_disputa,
         tipo_disputa, descripcion_disputa, monto_disputado, fecha_apertura_disputa)
    VALUES (@ID_arriendo, @ID_usuario_reporta, @ID_estado_disputa,
            @tipo_disputa, @descripcion, @monto_disputado, SYSDATETIME());
    SET @ID_disputa = CONVERT(INT, SCOPE_IDENTITY());

    SELECT * FROM Disputa WHERE ID_disputa = @ID_disputa;
END;
GO
CREATE OR ALTER PROCEDURE [dbo].[u_sp_ResolverDisputa]
    @ID_disputa INT, @nuevo_estado VARCHAR(30), @resolucion NVARCHAR(1000) = NULL,
    @ID_usuario INT = NULL
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    DECLARE @nombre_estado VARCHAR(30), @ID_estado_disputa INT;

    SELECT @nombre_estado = ed.nombre_estado_disputa
    FROM Disputa d
    INNER JOIN EstadoDisputa ed ON ed.ID_estado_disputa = d.ID_estado_disputa_disputa
    WHERE d.ID_disputa = @ID_disputa;

    IF @nombre_estado IS NULL THROW 60115, 'Disputa no existe.', 1;
    IF @nombre_estado IN ('RESUELTA','CERRADA')
        THROW 60116, 'La disputa ya esta cerrada.', 1;
    IF @nuevo_estado NOT IN ('EN_REVISION','RESUELTA','CERRADA')
        THROW 60118, 'Estado de disputa invalido.', 1;
    IF @nuevo_estado IN ('RESUELTA','CERRADA')
       AND (@resolucion IS NULL OR LTRIM(RTRIM(@resolucion)) = '')
        THROW 60117, 'La resolucion es obligatoria para cerrar la disputa.', 1;

    SELECT @ID_estado_disputa = ID_estado_disputa FROM EstadoDisputa
    WHERE nombre_estado_disputa = @nuevo_estado;

    UPDATE Disputa
    SET ID_estado_disputa_disputa = @ID_estado_disputa,
        resolucion_disputa = COALESCE(@resolucion, resolucion_disputa),
        fecha_cierre_disputa = CASE WHEN @nuevo_estado IN ('RESUELTA','CERRADA')
                                    THEN SYSDATETIME() ELSE fecha_cierre_disputa END
    WHERE ID_disputa = @ID_disputa;

    SELECT * FROM Disputa WHERE ID_disputa = @ID_disputa;
END;
GO