USE [RentaCarDB];
GO
SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE [dbo].[u_sp_BuscarVehiculos]
    @fecha_inicio     DATE = NULL,
    @fecha_fin        DATE = NULL,
    @ID_comuna        INT  = NULL,
    @ID_region        INT  = NULL,
    @ID_tipo_vehiculo INT  = NULL,
    @precio_maximo    DECIMAL(14,2) = NULL,
    @ID_caracteristica INT = NULL,
    @pagina INT = 1,
    @tamano_pagina INT = 12
AS
BEGIN
    SET NOCOUNT ON;

    IF @pagina IS NULL OR @pagina < 1 SET @pagina = 1;
    IF @tamano_pagina IS NULL OR @tamano_pagina < 1 SET @tamano_pagina = 12;
    IF @tamano_pagina > 100 SET @tamano_pagina = 100;

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
               END AS url_foto_principal_thumb,
               COUNT(*) OVER() AS total_registros
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
        ORDER BY v.precio_diario_base_vehiculo, v.ID_vehiculo
        OFFSET (@pagina - 1) * @tamano_pagina ROWS
        FETCH NEXT @tamano_pagina ROWS ONLY;
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
           COUNT(*) OVER() AS total_registros,
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
    ORDER BY precio_cotizado, v.ID_vehiculo
    OFFSET (@pagina - 1) * @tamano_pagina ROWS
    FETCH NEXT @tamano_pagina ROWS ONLY;
END;
GO
