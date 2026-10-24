USE [RentaCarDB];
GO
SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

IF COL_LENGTH('dbo.BusquedaGuardada', 'ID_region_busqueda') IS NULL
BEGIN
    ALTER TABLE [dbo].[BusquedaGuardada]
        ADD [ID_region_busqueda] [int] NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_busqueda_guardada_region'
)
BEGIN
    ALTER TABLE [dbo].[BusquedaGuardada] WITH CHECK
        ADD CONSTRAINT [FK_busqueda_guardada_region]
        FOREIGN KEY ([ID_region_busqueda]) REFERENCES [dbo].[Region] ([ID_region]);
END;
GO

USE [RentaCarDB];
GO
SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

/* S4: filtrar la busqueda publica por region e incluir la region en busquedas guardadas. */
CREATE OR ALTER PROCEDURE [dbo].[u_sp_BuscarVehiculos]
    @fecha_inicio     DATE = NULL,
    @fecha_fin        DATE = NULL,
    @ID_comuna        INT  = NULL,
    @ID_region        INT  = NULL,
    @ID_tipo_vehiculo INT  = NULL,
    @precio_maximo    DECIMAL(14,2) = NULL,
    @ID_caracteristica INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @fecha_inicio IS NULL OR @fecha_fin IS NULL OR @fecha_fin <= @fecha_inicio
    BEGIN
        SELECT v.ID_vehiculo, v.patente_vehiculo, v.precio_diario_base_vehiculo,
               v.calificacion_promedio_vehiculo, v.anio_vehiculo,
               m.nombre_marca, mo.nombre_modelo, tv.nombre_tipo_vehiculo,
               s.nombre_sede_proveedor, c.nombre_comuna, r.nombre_region,
               p.nombre_comercial_proveedor,
               foto.url_foto_vehiculo AS url_foto_principal,
               CASE
                   WHEN foto.url_foto_vehiculo LIKE '%.webp'
                       THEN REPLACE(foto.url_foto_vehiculo, '.webp', '-thumb.webp')
                   ELSE foto.url_foto_vehiculo
               END AS url_foto_principal_thumb
        FROM Vehiculo v
        INNER JOIN Modelo mo  ON mo.ID_modelo = v.ID_modelo_vehiculo
        INNER JOIN Marca m    ON m.ID_marca  = mo.ID_marca_modelo
        INNER JOIN TipoVehiculo tv ON tv.ID_tipo_vehiculo = v.ID_tipo_vehiculo_vehiculo
        INNER JOIN Proveedor p     ON p.ID_proveedor = v.ID_proveedor_vehiculo
        LEFT  JOIN SedeProveedor s ON s.ID_sede_proveedor = v.ID_sede_actual_vehiculo
        LEFT  JOIN Comuna   c ON c.ID_comuna   = s.ID_comuna_sede_proveedor
        LEFT  JOIN Provincia pr ON pr.ID_provincia = c.ID_provincia_comuna
        LEFT  JOIN Region   r ON r.ID_region   = pr.ID_region_provincia
        OUTER APPLY (
            SELECT TOP 1 f.url_foto_vehiculo
            FROM VehiculoFoto f
            WHERE f.ID_vehiculo_vehiculo_foto = v.ID_vehiculo
              AND f.es_principal_foto = 1
              AND f.activo_foto_vehiculo = 1
            ORDER BY f.fecha_subida_foto DESC, f.ID_foto_vehiculo DESC
        ) foto
        WHERE v.ID_vehiculo IN (SELECT ID_vehiculo FROM vw_VehiculosDisponibles)
          AND (@ID_comuna         IS NULL OR c.ID_comuna = @ID_comuna)
          AND (@ID_region         IS NULL OR r.ID_region = @ID_region)
          AND (@ID_tipo_vehiculo  IS NULL OR v.ID_tipo_vehiculo_vehiculo = @ID_tipo_vehiculo)
          AND (@precio_maximo     IS NULL OR v.precio_diario_base_vehiculo <= @precio_maximo)
          AND (@ID_caracteristica IS NULL OR EXISTS (
                SELECT 1 FROM VehiculoCaracteristica vc
                WHERE vc.ID_vehiculo_vehiculo_caracteristica = v.ID_vehiculo
                  AND vc.ID_caracteristica_vehiculo_caracteristica = @ID_caracteristica
                  AND vc.disponible_vehiculo_caracteristica = 1))
        ORDER BY v.precio_diario_base_vehiculo;
        RETURN;
    END

    SELECT v.ID_vehiculo, v.patente_vehiculo, v.precio_diario_base_vehiculo,
           v.calificacion_promedio_vehiculo, v.anio_vehiculo, v.kilometraje_vehiculo,
           m.nombre_marca, mo.nombre_modelo, tv.nombre_tipo_vehiculo,
           s.nombre_sede_proveedor, c.nombre_comuna, r.nombre_region,
           p.nombre_comercial_proveedor,
           foto.url_foto_vehiculo AS url_foto_principal,
           CASE
               WHEN foto.url_foto_vehiculo LIKE '%.webp'
                   THEN REPLACE(foto.url_foto_vehiculo, '.webp', '-thumb.webp')
               ELSE foto.url_foto_vehiculo
           END AS url_foto_principal_thumb,
           dbo.fn_PrecioAplicable(v.ID_vehiculo, @fecha_inicio, @fecha_fin) AS precio_cotizado,
           DATEDIFF(DAY, @fecha_inicio, @fecha_fin)                            AS dias
    FROM Vehiculo v
    INNER JOIN Modelo mo  ON mo.ID_modelo = v.ID_modelo_vehiculo
    INNER JOIN Marca m    ON m.ID_marca  = mo.ID_marca_modelo
    INNER JOIN TipoVehiculo tv ON tv.ID_tipo_vehiculo = v.ID_tipo_vehiculo_vehiculo
    INNER JOIN Proveedor p     ON p.ID_proveedor = v.ID_proveedor_vehiculo
    LEFT  JOIN SedeProveedor s ON s.ID_sede_proveedor = v.ID_sede_actual_vehiculo
    LEFT  JOIN Comuna   c ON c.ID_comuna   = s.ID_comuna_sede_proveedor
    LEFT  JOIN Provincia pr ON pr.ID_provincia = c.ID_provincia_comuna
    LEFT  JOIN Region   r ON r.ID_region   = pr.ID_region_provincia
    OUTER APPLY (
        SELECT TOP 1 f.url_foto_vehiculo
        FROM VehiculoFoto f
        WHERE f.ID_vehiculo_vehiculo_foto = v.ID_vehiculo
          AND f.es_principal_foto = 1
          AND f.activo_foto_vehiculo = 1
        ORDER BY f.fecha_subida_foto DESC, f.ID_foto_vehiculo DESC
    ) foto
    WHERE v.ID_vehiculo IN (SELECT ID_vehiculo FROM vw_VehiculosDisponibles)
      AND NOT EXISTS (SELECT 1 FROM Reserva re
                      INNER JOIN EstadoReserva er ON er.ID_estado_reserva = re.ID_estado_reserva_reserva
                      WHERE re.ID_vehiculo_reserva = v.ID_vehiculo
                        AND er.nombre_estado_reserva IN ('PENDIENTE','CONFIRMADA','EN_CURSO')
                        AND @fecha_inicio < re.fecha_fin_reserva
                        AND @fecha_fin    > re.fecha_inicio_reserva)
      AND NOT EXISTS (SELECT 1 FROM BloqueoVehiculo b
                      WHERE b.ID_vehiculo_bloqueo = v.ID_vehiculo
                        AND b.activo_bloqueo = 1
                        AND CAST(@fecha_inicio AS DATETIME2) < b.fecha_fin_bloqueo
                        AND CAST(@fecha_fin    AS DATETIME2) > b.fecha_inicio_bloqueo)
      AND (@ID_comuna         IS NULL OR c.ID_comuna = @ID_comuna)
      AND (@ID_region         IS NULL OR r.ID_region = @ID_region)
      AND (@ID_tipo_vehiculo  IS NULL OR v.ID_tipo_vehiculo_vehiculo = @ID_tipo_vehiculo)
      AND (@precio_maximo     IS NULL OR v.precio_diario_base_vehiculo <= @precio_maximo)
      AND (@ID_caracteristica IS NULL OR EXISTS (
            SELECT 1 FROM VehiculoCaracteristica vc
            WHERE vc.ID_vehiculo_vehiculo_caracteristica = v.ID_vehiculo
              AND vc.ID_caracteristica_vehiculo_caracteristica = @ID_caracteristica
              AND vc.disponible_vehiculo_caracteristica = 1))
    ORDER BY precio_cotizado;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[u_sp_GuardarBusqueda]
    @ID_usuario INT, @nombre NVARCHAR(100) = NULL,
    @ID_comuna INT = NULL, @ID_region INT = NULL,
    @ID_tipo_vehiculo INT = NULL,
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
        (ID_usuario_busqueda, nombre_busqueda, ID_comuna_busqueda, ID_region_busqueda,
         ID_tipo_vehiculo_busqueda, precio_maximo_busqueda,
         fecha_desde_busqueda, fecha_hasta_busqueda)
    VALUES (@ID_usuario, @nombre, @ID_comuna, @ID_region,
            @ID_tipo_vehiculo, @precio_maximo, @fecha_desde, @fecha_hasta);

    SELECT * FROM BusquedaGuardada WHERE ID_busqueda = SCOPE_IDENTITY();
END;
GO
