USE [RentaCarDB];
GO
SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

/* S4: CRUD de catalogos de negocio. */
CREATE OR ALTER PROCEDURE [dbo].[u_sp_AdminCatalogoSimple]
    @tipo VARCHAR(40), @accion VARCHAR(20), @id INT = NULL,
    @nombre NVARCHAR(100), @activo BIT = NULL
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    IF @accion NOT IN ('CREAR','ACTUALIZAR','DESACTIVAR')
        THROW 60400, 'Accion de catalogo invalida.', 1;
    IF @accion IN ('CREAR','ACTUALIZAR') AND (@nombre IS NULL OR LTRIM(RTRIM(@nombre)) = '')
        THROW 60401, 'El nombre es obligatorio.', 1;

    IF @tipo = 'marcas'
    BEGIN
        IF @accion = 'CREAR'
        BEGIN
            IF EXISTS (SELECT 1 FROM Marca WHERE nombre_marca = @nombre) THROW 60403, 'Marca duplicada.', 1;
            INSERT INTO Marca (nombre_marca, activo_marca) VALUES (@nombre, ISNULL(@activo,1));
            SELECT ID_marca AS id, nombre_marca AS nombre, activo_marca AS activo FROM Marca WHERE ID_marca = SCOPE_IDENTITY();
            RETURN;
        END;
        IF @accion = 'ACTUALIZAR'
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM Marca WHERE ID_marca = @id) THROW 60402, 'Marca no encontrada.', 1;
            IF EXISTS (SELECT 1 FROM Marca WHERE nombre_marca = @nombre AND ID_marca <> @id) THROW 60403, 'Marca duplicada.', 1;
            UPDATE Marca SET nombre_marca = @nombre, activo_marca = ISNULL(@activo, activo_marca) WHERE ID_marca = @id;
            SELECT ID_marca AS id, nombre_marca AS nombre, activo_marca AS activo FROM Marca WHERE ID_marca = @id;
            RETURN;
        END;
        UPDATE Marca SET activo_marca = 0 WHERE ID_marca = @id;
        IF @@ROWCOUNT = 0 THROW 60402, 'Marca no encontrada.', 1;
        SELECT ID_marca AS id, nombre_marca AS nombre, activo_marca AS activo FROM Marca WHERE ID_marca = @id;
        RETURN;
    END;

    IF @tipo = 'tipos-vehiculo'
    BEGIN
        IF @accion = 'CREAR'
        BEGIN
            IF EXISTS (SELECT 1 FROM TipoVehiculo WHERE nombre_tipo_vehiculo = @nombre) THROW 60403, 'Tipo de vehiculo duplicado.', 1;
            INSERT INTO TipoVehiculo (nombre_tipo_vehiculo, activo_tipo_vehiculo) VALUES (@nombre, ISNULL(@activo,1));
            SELECT ID_tipo_vehiculo AS id, nombre_tipo_vehiculo AS nombre, activo_tipo_vehiculo AS activo FROM TipoVehiculo WHERE ID_tipo_vehiculo = SCOPE_IDENTITY();
            RETURN;
        END;
        IF @accion = 'ACTUALIZAR'
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM TipoVehiculo WHERE ID_tipo_vehiculo = @id) THROW 60402, 'Tipo de vehiculo no encontrado.', 1;
            IF EXISTS (SELECT 1 FROM TipoVehiculo WHERE nombre_tipo_vehiculo = @nombre AND ID_tipo_vehiculo <> @id) THROW 60403, 'Tipo de vehiculo duplicado.', 1;
            UPDATE TipoVehiculo SET nombre_tipo_vehiculo = @nombre, activo_tipo_vehiculo = ISNULL(@activo, activo_tipo_vehiculo) WHERE ID_tipo_vehiculo = @id;
            SELECT ID_tipo_vehiculo AS id, nombre_tipo_vehiculo AS nombre, activo_tipo_vehiculo AS activo FROM TipoVehiculo WHERE ID_tipo_vehiculo = @id;
            RETURN;
        END;
        UPDATE TipoVehiculo SET activo_tipo_vehiculo = 0 WHERE ID_tipo_vehiculo = @id;
        IF @@ROWCOUNT = 0 THROW 60402, 'Tipo de vehiculo no encontrado.', 1;
        SELECT ID_tipo_vehiculo AS id, nombre_tipo_vehiculo AS nombre, activo_tipo_vehiculo AS activo FROM TipoVehiculo WHERE ID_tipo_vehiculo = @id;
        RETURN;
    END;

    IF @tipo = 'combustibles'
    BEGIN
        IF @accion = 'CREAR'
        BEGIN
            IF EXISTS (SELECT 1 FROM TipoCombustible WHERE nombre_tipo_combustible = @nombre) THROW 60403, 'Combustible duplicado.', 1;
            INSERT INTO TipoCombustible (nombre_tipo_combustible, activo_tipo_combustible) VALUES (@nombre, ISNULL(@activo,1));
            SELECT ID_tipo_combustible AS id, nombre_tipo_combustible AS nombre, activo_tipo_combustible AS activo FROM TipoCombustible WHERE ID_tipo_combustible = SCOPE_IDENTITY();
            RETURN;
        END;
        IF @accion = 'ACTUALIZAR'
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM TipoCombustible WHERE ID_tipo_combustible = @id) THROW 60402, 'Combustible no encontrado.', 1;
            IF EXISTS (SELECT 1 FROM TipoCombustible WHERE nombre_tipo_combustible = @nombre AND ID_tipo_combustible <> @id) THROW 60403, 'Combustible duplicado.', 1;
            UPDATE TipoCombustible SET nombre_tipo_combustible = @nombre, activo_tipo_combustible = ISNULL(@activo, activo_tipo_combustible) WHERE ID_tipo_combustible = @id;
            SELECT ID_tipo_combustible AS id, nombre_tipo_combustible AS nombre, activo_tipo_combustible AS activo FROM TipoCombustible WHERE ID_tipo_combustible = @id;
            RETURN;
        END;
        UPDATE TipoCombustible SET activo_tipo_combustible = 0 WHERE ID_tipo_combustible = @id;
        IF @@ROWCOUNT = 0 THROW 60402, 'Combustible no encontrado.', 1;
        SELECT ID_tipo_combustible AS id, nombre_tipo_combustible AS nombre, activo_tipo_combustible AS activo FROM TipoCombustible WHERE ID_tipo_combustible = @id;
        RETURN;
    END;

    IF @tipo = 'transmisiones'
    BEGIN
        IF @accion = 'CREAR'
        BEGIN
            IF EXISTS (SELECT 1 FROM TipoTransmision WHERE nombre_tipo_transmision = @nombre) THROW 60403, 'Transmision duplicada.', 1;
            INSERT INTO TipoTransmision (nombre_tipo_transmision, activo_tipo_transmision) VALUES (@nombre, ISNULL(@activo,1));
            SELECT ID_tipo_transmision AS id, nombre_tipo_transmision AS nombre, activo_tipo_transmision AS activo FROM TipoTransmision WHERE ID_tipo_transmision = SCOPE_IDENTITY();
            RETURN;
        END;
        IF @accion = 'ACTUALIZAR'
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM TipoTransmision WHERE ID_tipo_transmision = @id) THROW 60402, 'Transmision no encontrada.', 1;
            IF EXISTS (SELECT 1 FROM TipoTransmision WHERE nombre_tipo_transmision = @nombre AND ID_tipo_transmision <> @id) THROW 60403, 'Transmision duplicada.', 1;
            UPDATE TipoTransmision SET nombre_tipo_transmision = @nombre, activo_tipo_transmision = ISNULL(@activo, activo_tipo_transmision) WHERE ID_tipo_transmision = @id;
            SELECT ID_tipo_transmision AS id, nombre_tipo_transmision AS nombre, activo_tipo_transmision AS activo FROM TipoTransmision WHERE ID_tipo_transmision = @id;
            RETURN;
        END;
        UPDATE TipoTransmision SET activo_tipo_transmision = 0 WHERE ID_tipo_transmision = @id;
        IF @@ROWCOUNT = 0 THROW 60402, 'Transmision no encontrada.', 1;
        SELECT ID_tipo_transmision AS id, nombre_tipo_transmision AS nombre, activo_tipo_transmision AS activo FROM TipoTransmision WHERE ID_tipo_transmision = @id;
        RETURN;
    END;

    THROW 60400, 'Tipo de catalogo simple invalido.', 1;
END;
GO
CREATE OR ALTER PROCEDURE [dbo].[u_sp_AdminModelo]
    @accion VARCHAR(20), @id INT = NULL, @ID_marca INT = NULL,
    @nombre NVARCHAR(100), @activo BIT = NULL
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    IF @accion NOT IN ('CREAR','ACTUALIZAR','DESACTIVAR') THROW 60400, 'Accion de catalogo invalida.', 1;
    IF @accion IN ('CREAR','ACTUALIZAR') AND (@nombre IS NULL OR LTRIM(RTRIM(@nombre)) = '') THROW 60401, 'El nombre es obligatorio.', 1;

    IF @accion = 'CREAR'
    BEGIN
        IF @ID_marca IS NULL OR NOT EXISTS (SELECT 1 FROM Marca WHERE ID_marca = @ID_marca)
            THROW 60404, 'Marca invalida.', 1;
        IF EXISTS (SELECT 1 FROM Modelo WHERE ID_marca_modelo = @ID_marca AND nombre_modelo = @nombre)
            THROW 60403, 'Modelo duplicado para la marca.', 1;
        INSERT INTO Modelo (ID_marca_modelo, nombre_modelo, activo_modelo) VALUES (@ID_marca, @nombre, ISNULL(@activo,1));
        SELECT ID_modelo AS id, nombre_modelo AS nombre, activo_modelo AS activo, ID_marca_modelo AS marcaId
        FROM Modelo WHERE ID_modelo = SCOPE_IDENTITY();
        RETURN;
    END;

    IF @accion = 'ACTUALIZAR'
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM Modelo WHERE ID_modelo = @id) THROW 60402, 'Modelo no encontrado.', 1;
        IF @ID_marca IS NULL OR NOT EXISTS (SELECT 1 FROM Marca WHERE ID_marca = @ID_marca)
            THROW 60404, 'Marca invalida.', 1;
        IF EXISTS (SELECT 1 FROM Modelo WHERE ID_marca_modelo = @ID_marca AND nombre_modelo = @nombre AND ID_modelo <> @id)
            THROW 60403, 'Modelo duplicado para la marca.', 1;
        UPDATE Modelo SET ID_marca_modelo = @ID_marca, nombre_modelo = @nombre, activo_modelo = ISNULL(@activo, activo_modelo) WHERE ID_modelo = @id;
        SELECT ID_modelo AS id, nombre_modelo AS nombre, activo_modelo AS activo, ID_marca_modelo AS marcaId
        FROM Modelo WHERE ID_modelo = @id;
        RETURN;
    END;

    UPDATE Modelo SET activo_modelo = 0 WHERE ID_modelo = @id;
    IF @@ROWCOUNT = 0 THROW 60402, 'Modelo no encontrado.', 1;
    SELECT ID_modelo AS id, nombre_modelo AS nombre, activo_modelo AS activo, ID_marca_modelo AS marcaId
    FROM Modelo WHERE ID_modelo = @id;
END;
GO
CREATE OR ALTER PROCEDURE [dbo].[u_sp_AdminCaracteristica]
    @accion VARCHAR(20), @id INT = NULL, @nombre NVARCHAR(80),
    @categoria VARCHAR(30) = NULL, @descripcion NVARCHAR(200) = NULL,
    @activo BIT = NULL
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    IF @accion NOT IN ('CREAR','ACTUALIZAR','DESACTIVAR') THROW 60400, 'Accion de catalogo invalida.', 1;
    IF @accion IN ('CREAR','ACTUALIZAR') AND (@nombre IS NULL OR LTRIM(RTRIM(@nombre)) = '') THROW 60401, 'El nombre es obligatorio.', 1;
    IF @accion IN ('CREAR','ACTUALIZAR') AND (@categoria IS NULL OR LTRIM(RTRIM(@categoria)) = '') THROW 60406, 'La categoria es obligatoria.', 1;

    IF @accion = 'CREAR'
    BEGIN
        IF EXISTS (SELECT 1 FROM CaracteristicaVehiculo WHERE nombre_caracteristica = @nombre) THROW 60403, 'Caracteristica duplicada.', 1;
        INSERT INTO CaracteristicaVehiculo (nombre_caracteristica, categoria_caracteristica, descripcion_caracteristica, activo_caracteristica)
        VALUES (@nombre, @categoria, @descripcion, ISNULL(@activo,1));
        SELECT ID_caracteristica_vehiculo AS id, nombre_caracteristica AS nombre, activo_caracteristica AS activo,
               categoria_caracteristica AS categoria, descripcion_caracteristica AS descripcion
        FROM CaracteristicaVehiculo WHERE ID_caracteristica_vehiculo = SCOPE_IDENTITY();
        RETURN;
    END;

    IF @accion = 'ACTUALIZAR'
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM CaracteristicaVehiculo WHERE ID_caracteristica_vehiculo = @id) THROW 60402, 'Caracteristica no encontrada.', 1;
        IF EXISTS (SELECT 1 FROM CaracteristicaVehiculo WHERE nombre_caracteristica = @nombre AND ID_caracteristica_vehiculo <> @id)
            THROW 60403, 'Caracteristica duplicada.', 1;
        UPDATE CaracteristicaVehiculo
        SET nombre_caracteristica = @nombre, categoria_caracteristica = @categoria,
            descripcion_caracteristica = @descripcion, activo_caracteristica = ISNULL(@activo, activo_caracteristica)
        WHERE ID_caracteristica_vehiculo = @id;
        SELECT ID_caracteristica_vehiculo AS id, nombre_caracteristica AS nombre, activo_caracteristica AS activo,
               categoria_caracteristica AS categoria, descripcion_caracteristica AS descripcion
        FROM CaracteristicaVehiculo WHERE ID_caracteristica_vehiculo = @id;
        RETURN;
    END;

    UPDATE CaracteristicaVehiculo SET activo_caracteristica = 0 WHERE ID_caracteristica_vehiculo = @id;
    IF @@ROWCOUNT = 0 THROW 60402, 'Caracteristica no encontrada.', 1;
    SELECT ID_caracteristica_vehiculo AS id, nombre_caracteristica AS nombre, activo_caracteristica AS activo,
           categoria_caracteristica AS categoria, descripcion_caracteristica AS descripcion
    FROM CaracteristicaVehiculo WHERE ID_caracteristica_vehiculo = @id;
END;
GO
CREATE OR ALTER PROCEDURE [dbo].[u_sp_AdminTipoDocumento]
    @accion VARCHAR(20), @id INT = NULL, @nombre NVARCHAR(100),
    @obligatorio BIT = NULL, @activo BIT = NULL
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    IF @accion NOT IN ('CREAR','ACTUALIZAR','DESACTIVAR') THROW 60400, 'Accion de catalogo invalida.', 1;
    IF @accion IN ('CREAR','ACTUALIZAR') AND (@nombre IS NULL OR LTRIM(RTRIM(@nombre)) = '') THROW 60401, 'El nombre es obligatorio.', 1;

    IF @accion = 'CREAR'
    BEGIN
        IF EXISTS (SELECT 1 FROM TipoDocumentoVehiculo WHERE nombre_tipo_documento = @nombre) THROW 60403, 'Tipo de documento duplicado.', 1;
        INSERT INTO TipoDocumentoVehiculo (nombre_tipo_documento, obligatorio_tipo_documento, activo_tipo_documento)
        VALUES (@nombre, ISNULL(@obligatorio,0), ISNULL(@activo,1));
        SELECT ID_tipo_documento_vehiculo AS id, nombre_tipo_documento AS nombre,
               activo_tipo_documento AS activo, obligatorio_tipo_documento AS obligatorio
        FROM TipoDocumentoVehiculo WHERE ID_tipo_documento_vehiculo = SCOPE_IDENTITY();
        RETURN;
    END;

    IF @accion = 'ACTUALIZAR'
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM TipoDocumentoVehiculo WHERE ID_tipo_documento_vehiculo = @id) THROW 60402, 'Tipo de documento no encontrado.', 1;
        IF EXISTS (SELECT 1 FROM TipoDocumentoVehiculo WHERE nombre_tipo_documento = @nombre AND ID_tipo_documento_vehiculo <> @id)
            THROW 60403, 'Tipo de documento duplicado.', 1;
        UPDATE TipoDocumentoVehiculo
        SET nombre_tipo_documento = @nombre, obligatorio_tipo_documento = ISNULL(@obligatorio, obligatorio_tipo_documento),
            activo_tipo_documento = ISNULL(@activo, activo_tipo_documento)
        WHERE ID_tipo_documento_vehiculo = @id;
        SELECT ID_tipo_documento_vehiculo AS id, nombre_tipo_documento AS nombre,
               activo_tipo_documento AS activo, obligatorio_tipo_documento AS obligatorio
        FROM TipoDocumentoVehiculo WHERE ID_tipo_documento_vehiculo = @id;
        RETURN;
    END;

    UPDATE TipoDocumentoVehiculo SET activo_tipo_documento = 0 WHERE ID_tipo_documento_vehiculo = @id;
    IF @@ROWCOUNT = 0 THROW 60402, 'Tipo de documento no encontrado.', 1;
    SELECT ID_tipo_documento_vehiculo AS id, nombre_tipo_documento AS nombre,
           activo_tipo_documento AS activo, obligatorio_tipo_documento AS obligatorio
    FROM TipoDocumentoVehiculo WHERE ID_tipo_documento_vehiculo = @id;
END;
GO
CREATE OR ALTER PROCEDURE [dbo].[u_sp_AdminPoliticaCancelacion]
    @accion VARCHAR(20), @id INT = NULL, @nombre NVARCHAR(100),
    @descripcion NVARCHAR(300) = NULL, @dias_anticipacion INT = NULL,
    @porcentaje_reembolso DECIMAL(5,2) = NULL, @activo BIT = NULL
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    IF @accion NOT IN ('CREAR','ACTUALIZAR','DESACTIVAR') THROW 60400, 'Accion de catalogo invalida.', 1;
    IF @accion IN ('CREAR','ACTUALIZAR') AND (@nombre IS NULL OR LTRIM(RTRIM(@nombre)) = '') THROW 60401, 'El nombre es obligatorio.', 1;
    IF @accion IN ('CREAR','ACTUALIZAR') AND (@dias_anticipacion IS NULL OR @dias_anticipacion < 0) THROW 60406, 'Dias de anticipacion invalidos.', 1;
    IF @accion IN ('CREAR','ACTUALIZAR') AND (@porcentaje_reembolso IS NULL OR @porcentaje_reembolso < 0 OR @porcentaje_reembolso > 100) THROW 60406, 'Porcentaje de reembolso invalido.', 1;

    IF @accion = 'CREAR'
    BEGIN
        IF EXISTS (SELECT 1 FROM PoliticaCancelacion WHERE nombre_politica_cancelacion = @nombre) THROW 60403, 'Politica duplicada.', 1;
        INSERT INTO PoliticaCancelacion
            (nombre_politica_cancelacion, descripcion_politica_cancelacion, dias_anticipacion_reembolso, porcentaje_reembolso, activa_politica_cancelacion)
        VALUES (@nombre, @descripcion, @dias_anticipacion, @porcentaje_reembolso, ISNULL(@activo,1));
        SELECT ID_politica_cancelacion AS id, nombre_politica_cancelacion AS nombre,
               activa_politica_cancelacion AS activo, descripcion_politica_cancelacion AS descripcion,
               dias_anticipacion_reembolso AS diasAnticipacion, porcentaje_reembolso AS porcentajeReembolso
        FROM PoliticaCancelacion WHERE ID_politica_cancelacion = SCOPE_IDENTITY();
        RETURN;
    END;

    IF @accion = 'ACTUALIZAR'
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM PoliticaCancelacion WHERE ID_politica_cancelacion = @id) THROW 60402, 'Politica no encontrada.', 1;
        IF EXISTS (SELECT 1 FROM PoliticaCancelacion WHERE nombre_politica_cancelacion = @nombre AND ID_politica_cancelacion <> @id)
            THROW 60403, 'Politica duplicada.', 1;
        UPDATE PoliticaCancelacion
        SET nombre_politica_cancelacion = @nombre, descripcion_politica_cancelacion = @descripcion,
            dias_anticipacion_reembolso = @dias_anticipacion, porcentaje_reembolso = @porcentaje_reembolso,
            activa_politica_cancelacion = ISNULL(@activo, activa_politica_cancelacion)
        WHERE ID_politica_cancelacion = @id;
        SELECT ID_politica_cancelacion AS id, nombre_politica_cancelacion AS nombre,
               activa_politica_cancelacion AS activo, descripcion_politica_cancelacion AS descripcion,
               dias_anticipacion_reembolso AS diasAnticipacion, porcentaje_reembolso AS porcentajeReembolso
        FROM PoliticaCancelacion WHERE ID_politica_cancelacion = @id;
        RETURN;
    END;

    UPDATE PoliticaCancelacion SET activa_politica_cancelacion = 0 WHERE ID_politica_cancelacion = @id;
    IF @@ROWCOUNT = 0 THROW 60402, 'Politica no encontrada.', 1;
    SELECT ID_politica_cancelacion AS id, nombre_politica_cancelacion AS nombre,
           activa_politica_cancelacion AS activo, descripcion_politica_cancelacion AS descripcion,
           dias_anticipacion_reembolso AS diasAnticipacion, porcentaje_reembolso AS porcentajeReembolso
    FROM PoliticaCancelacion WHERE ID_politica_cancelacion = @id;
END;
GO