USE [RentaCarDB];
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;

IF OBJECT_ID('tempdb..#R') IS NOT NULL DROP TABLE #R;
CREATE TABLE #R (id INT IDENTITY, test NVARCHAR(200), esperado NVARCHAR(100), resultado NVARCHAR(10), detalle NVARCHAR(500));

DECLARE @idAdmin INT = (SELECT ID_usuario FROM Usuario WHERE email_usuario='qa.admin@rentacar.cl');
DECLARE @idArriendo INT = (
    SELECT TOP 1 a.ID_arriendo
    FROM Arriendo a
    INNER JOIN EstadoArriendo ea ON ea.ID_estado_arriendo = a.ID_estado_arriendo_arriendo
    WHERE ea.nombre_estado_arriendo = 'FINALIZADO'
    ORDER BY a.ID_arriendo DESC
);
DECLARE @idCliente INT = (
    SELECT r.ID_usuario_cliente_reserva
    FROM Arriendo a
    INNER JOIN Reserva r ON r.ID_reserva = a.ID_reserva_arriendo
    WHERE a.ID_arriendo = @idArriendo
);
DECLARE @idDisputa INT;

IF @idArriendo IS NULL OR @idCliente IS NULL
BEGIN
    INSERT #R VALUES ('Fixture arriendo finalizado', 'existe', 'FAIL', 'ejecutar 06_arriendos.sql antes');
END
ELSE
BEGIN
    BEGIN TRY
        EXEC dbo.u_sp_CrearDisputa @ID_arriendo=@idArriendo, @ID_usuario_reporta=@idCliente,
            @tipo_disputa='DANO', @descripcion=N'Dano no reconocido por el cliente S4', @monto_disputado=25000;
        SET @idDisputa = (SELECT TOP 1 ID_disputa FROM Disputa WHERE ID_arriendo_disputa=@idArriendo ORDER BY ID_disputa DESC);
        IF EXISTS (
            SELECT 1 FROM Disputa d
            INNER JOIN EstadoDisputa ed ON ed.ID_estado_disputa = d.ID_estado_disputa_disputa
            WHERE d.ID_disputa=@idDisputa AND ed.nombre_estado_disputa='ABIERTA'
        )
            INSERT #R VALUES ('Crear disputa', 'ABIERTA', 'PASS', '');
        ELSE
            INSERT #R VALUES ('Crear disputa', 'ABIERTA', 'FAIL', 'no quedo abierta');
    END TRY
    BEGIN CATCH
        INSERT #R VALUES ('Crear disputa', 'ABIERTA', 'FAIL', ERROR_MESSAGE());
    END CATCH;

    BEGIN TRY
        EXEC dbo.u_sp_CrearDisputa @ID_arriendo=@idArriendo, @ID_usuario_reporta=@idCliente,
            @tipo_disputa='COBRO', @descripcion=N'Duplicada S4', @monto_disputado=1000;
        INSERT #R VALUES ('Disputa duplicada', 'ERROR 60111', 'FAIL', 'no lanzo error');
    END TRY
    BEGIN CATCH
        INSERT #R VALUES ('Disputa duplicada', 'ERROR 60111',
            CASE WHEN ERROR_NUMBER()=60111 THEN 'PASS' ELSE 'FAIL' END,
            CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
    END CATCH;

    BEGIN TRY
        EXEC dbo.u_sp_CrearDisputa @ID_arriendo=@idArriendo, @ID_usuario_reporta=@idAdmin,
            @tipo_disputa='OTRO', @descripcion=N'Usuario ajeno S4', @monto_disputado=NULL;
        INSERT #R VALUES ('Disputa usuario ajeno', 'ERROR 60112', 'FAIL', 'no lanzo error');
    END TRY
    BEGIN CATCH
        INSERT #R VALUES ('Disputa usuario ajeno', 'ERROR 60112',
            CASE WHEN ERROR_NUMBER()=60112 THEN 'PASS' ELSE 'FAIL' END,
            CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
    END CATCH;

    BEGIN TRY
        EXEC dbo.u_sp_ResolverDisputa @ID_disputa=@idDisputa, @nuevo_estado='EN_REVISION', @ID_usuario=@idAdmin;
        IF EXISTS (
            SELECT 1 FROM Disputa d
            INNER JOIN EstadoDisputa ed ON ed.ID_estado_disputa = d.ID_estado_disputa_disputa
            WHERE d.ID_disputa=@idDisputa AND ed.nombre_estado_disputa='EN_REVISION'
        )
            INSERT #R VALUES ('Pasar a EN_REVISION', 'EN_REVISION', 'PASS', '');
        ELSE
            INSERT #R VALUES ('Pasar a EN_REVISION', 'EN_REVISION', 'FAIL', 'no cambio');
    END TRY
    BEGIN CATCH
        INSERT #R VALUES ('Pasar a EN_REVISION', 'EN_REVISION', 'FAIL', ERROR_MESSAGE());
    END CATCH;

    BEGIN TRY
        EXEC dbo.u_sp_ResolverDisputa @ID_disputa=@idDisputa, @nuevo_estado='RESUELTA',
            @resolucion=N'Cargo ajustado a favor del cliente', @ID_usuario=@idAdmin;
        IF EXISTS (SELECT 1 FROM Disputa WHERE ID_disputa=@idDisputa AND fecha_cierre_disputa IS NOT NULL)
            INSERT #R VALUES ('Resolver disputa', 'RESUELTA', 'PASS', '');
        ELSE
            INSERT #R VALUES ('Resolver disputa', 'RESUELTA', 'FAIL', 'sin fecha de cierre');
    END TRY
    BEGIN CATCH
        INSERT #R VALUES ('Resolver disputa', 'RESUELTA', 'FAIL', ERROR_MESSAGE());
    END CATCH;

    BEGIN TRY
        EXEC dbo.u_sp_ResolverDisputa @ID_disputa=@idDisputa, @nuevo_estado='CERRADA',
            @resolucion=N'Cierre posterior', @ID_usuario=@idAdmin;
        INSERT #R VALUES ('Resolver disputa cerrada', 'ERROR 60116', 'FAIL', 'no lanzo error');
    END TRY
    BEGIN CATCH
        INSERT #R VALUES ('Resolver disputa cerrada', 'ERROR 60116',
            CASE WHEN ERROR_NUMBER()=60116 THEN 'PASS' ELSE 'FAIL' END,
            CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
    END CATCH;
END;

SELECT * FROM #R ORDER BY id;
SELECT resultado, COUNT(*) AS total FROM #R GROUP BY resultado;
