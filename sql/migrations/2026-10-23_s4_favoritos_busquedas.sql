USE [RentaCarDB];
GO
SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

/* S4: favoritos y busquedas guardadas. */
CREATE OR ALTER PROCEDURE [dbo].[u_sp_AgregarFavorito]
    @ID_usuario INT, @ID_vehiculo INT
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM Usuario WHERE ID_usuario = @ID_usuario)
        THROW 60500, 'Usuario no existe.', 1;
    IF NOT EXISTS (SELECT 1 FROM Vehiculo WHERE ID_vehiculo = @ID_vehiculo AND fecha_baja_vehiculo IS NULL)
        THROW 60501, 'Vehiculo no existe.', 1;

    IF NOT EXISTS (SELECT 1 FROM FavoritoVehiculo WHERE ID_usuario_favorito = @ID_usuario AND ID_vehiculo_favorito = @ID_vehiculo)
        INSERT INTO FavoritoVehiculo (ID_usuario_favorito, ID_vehiculo_favorito)
        VALUES (@ID_usuario, @ID_vehiculo);

    SELECT ID_usuario_favorito AS usuarioId, ID_vehiculo_favorito AS vehiculoId, fecha_favorito AS fecha
    FROM FavoritoVehiculo
    WHERE ID_usuario_favorito = @ID_usuario AND ID_vehiculo_favorito = @ID_vehiculo;
END;
GO
CREATE OR ALTER PROCEDURE [dbo].[u_sp_QuitarFavorito]
    @ID_usuario INT, @ID_vehiculo INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM FavoritoVehiculo
    WHERE ID_usuario_favorito = @ID_usuario AND ID_vehiculo_favorito = @ID_vehiculo;
    SELECT @ID_usuario AS usuarioId, @ID_vehiculo AS vehiculoId;
END;
GO
CREATE OR ALTER PROCEDURE [dbo].[u_sp_GuardarBusqueda]
    @ID_usuario INT, @nombre NVARCHAR(100) = NULL,
    @ID_comuna INT = NULL, @ID_tipo_vehiculo INT = NULL,
    @precio_maximo DECIMAL(12,2) = NULL,
    @fecha_desde DATE = NULL, @fecha_hasta DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM Usuario WHERE ID_usuario = @ID_usuario)
        THROW 60500, 'Usuario no existe.', 1;
    IF @fecha_desde IS NOT NULL AND @fecha_hasta IS NOT NULL AND @fecha_hasta < @fecha_desde
        THROW 60502, 'Rango de fechas invalido.', 1;

    INSERT INTO BusquedaGuardada
        (ID_usuario_busqueda, nombre_busqueda, ID_comuna_busqueda, ID_tipo_vehiculo_busqueda,
         precio_maximo_busqueda, fecha_desde_busqueda, fecha_hasta_busqueda)
    VALUES (@ID_usuario, @nombre, @ID_comuna, @ID_tipo_vehiculo,
            @precio_maximo, @fecha_desde, @fecha_hasta);

    SELECT * FROM BusquedaGuardada WHERE ID_busqueda = SCOPE_IDENTITY();
END;
GO
CREATE OR ALTER PROCEDURE [dbo].[u_sp_EliminarBusqueda]
    @ID_busqueda INT, @ID_usuario INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE BusquedaGuardada
    SET activa_busqueda = 0
    WHERE ID_busqueda = @ID_busqueda AND ID_usuario_busqueda = @ID_usuario;
    IF @@ROWCOUNT = 0 THROW 60503, 'Busqueda no encontrada.', 1;
    SELECT @ID_busqueda AS id, CAST(0 AS BIT) AS activa;
END;
GO