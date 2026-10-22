USE [RentaCarDB];
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;

IF OBJECT_ID('tempdb..#R') IS NOT NULL DROP TABLE #R;
CREATE TABLE #R (id INT IDENTITY, test NVARCHAR(200), esperado NVARCHAR(100), resultado NVARCHAR(10), detalle NVARCHAR(500));

DECLARE @idArriendo INT = (
    SELECT TOP 1 a.ID_arriendo
    FROM Arriendo a
    INNER JOIN EstadoArriendo ea ON ea.ID_estado_arriendo = a.ID_estado_arriendo_arriendo
    WHERE ea.nombre_estado_arriendo = 'FINALIZADO'
    ORDER BY a.ID_arriendo DESC
);
DECLARE @idAdmin INT = (SELECT ID_usuario FROM Usuario WHERE email_usuario='qa.admin@rentacar.cl');
DECLARE @idProv INT = (SELECT ID_proveedor FROM Proveedor WHERE nombre_comercial_proveedor='QA Provider');

IF @idArriendo IS NULL
BEGIN
    INSERT #R VALUES ('Fixture arriendo finalizado', 'existe', 'FAIL', 'ejecutar 06_arriendos.sql antes');
END
ELSE
BEGIN
    INSERT #R VALUES ('Fixture arriendo finalizado', 'existe', 'PASS', CONCAT('ID=', @idArriendo));

    BEGIN TRY
        EXEC dbo.u_sp_CrearCargoExtra @ID_arriendo=@idArriendo, @concepto=N'Limpieza especial S4',
            @monto=12000, @ID_usuario_operador=@idAdmin, @nombre_tipo_cargo='LIMPIEZA';
        IF EXISTS (
            SELECT 1 FROM CargoExtra ce
            INNER JOIN TipoCargoExtra t ON t.ID_tipo_cargo_extra = ce.ID_tipo_cargo_extra_cargo_extra
            WHERE ce.ID_arriendo_cargo_extra=@idArriendo
              AND t.nombre_tipo_cargo_extra='LIMPIEZA'
              AND ce.monto_cargo_extra=12000
        ) AND EXISTS (
            SELECT 1 FROM MovimientoFinanciero m
            INNER JOIN Reserva r ON r.ID_reserva = m.ID_reserva_movimiento
            INNER JOIN Arriendo a ON a.ID_reserva_arriendo = r.ID_reserva
            WHERE a.ID_arriendo=@idArriendo AND m.tipo_movimiento='CARGO_EXTRA' AND m.monto_movimiento=12000
        )
            INSERT #R VALUES ('Cargo extra finalizado', 'cargo + movimiento', 'PASS', '');
        ELSE
            INSERT #R VALUES ('Cargo extra finalizado', 'cargo + movimiento', 'FAIL', 'no se creo cargo/movimiento');
    END TRY
    BEGIN CATCH
        INSERT #R VALUES ('Cargo extra finalizado', 'cargo + movimiento', 'FAIL', ERROR_MESSAGE());
    END CATCH;

    BEGIN TRY
        EXEC dbo.u_sp_CrearCargoExtra @ID_arriendo=@idArriendo, @concepto=N'Monto cero',
            @monto=0, @ID_usuario_operador=@idAdmin, @nombre_tipo_cargo='OTRO';
        INSERT #R VALUES ('Cargo extra monto cero', 'ERROR 53020', 'FAIL', 'no lanzo error');
    END TRY
    BEGIN CATCH
        INSERT #R VALUES ('Cargo extra monto cero', 'ERROR 53020',
            CASE WHEN ERROR_NUMBER()=53020 THEN 'PASS' ELSE 'FAIL' END,
            CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
    END CATCH;

    BEGIN TRY
        EXEC dbo.u_sp_CrearCargoExtra @ID_arriendo=999999, @concepto=N'Inexistente',
            @monto=1000, @ID_usuario_operador=@idAdmin;
        INSERT #R VALUES ('Cargo extra arriendo inexistente', 'ERROR 53021', 'FAIL', 'no lanzo error');
    END TRY
    BEGIN CATCH
        INSERT #R VALUES ('Cargo extra arriendo inexistente', 'ERROR 53021',
            CASE WHEN ERROR_NUMBER()=53021 THEN 'PASS' ELSE 'FAIL' END,
            CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
    END CATCH;

    BEGIN TRY
        EXEC dbo.u_sp_RegistrarMulta @ID_arriendo=@idArriendo, @fecha_multa='2026-10-15',
            @descripcion=N'Parte de prueba S4', @monto=5000, @organismo=N'Municipalidad',
            @numero_parte='S4-001', @ID_usuario_registro=@idAdmin;
        IF EXISTS (
            SELECT 1 FROM Multa m
            WHERE m.ID_arriendo_multa=@idArriendo AND m.numero_parte_multa='S4-001' AND m.monto_multa=5000
        ) AND EXISTS (
            SELECT 1 FROM MovimientoFinanciero mf
            INNER JOIN Reserva r ON r.ID_reserva = mf.ID_reserva_movimiento
            INNER JOIN Arriendo a ON a.ID_reserva_arriendo = r.ID_reserva
            WHERE a.ID_arriendo=@idArriendo AND mf.tipo_movimiento='MULTA' AND mf.monto_movimiento=5000
        )
            INSERT #R VALUES ('Multa finalizada', 'multa + movimiento', 'PASS', '');
        ELSE
            INSERT #R VALUES ('Multa finalizada', 'multa + movimiento', 'FAIL', 'no se creo multa/movimiento');
    END TRY
    BEGIN CATCH
        INSERT #R VALUES ('Multa finalizada', 'multa + movimiento', 'FAIL', ERROR_MESSAGE());
    END CATCH;

    BEGIN TRY
        EXEC dbo.u_sp_RegistrarMulta @ID_arriendo=@idArriendo, @fecha_multa='2026-10-15',
            @descripcion=N'Monto cero', @monto=0, @ID_usuario_registro=@idAdmin;
        INSERT #R VALUES ('Multa monto cero', 'ERROR 60040', 'FAIL', 'no lanzo error');
    END TRY
    BEGIN CATCH
        INSERT #R VALUES ('Multa monto cero', 'ERROR 60040',
            CASE WHEN ERROR_NUMBER()=60040 THEN 'PASS' ELSE 'FAIL' END,
            CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
    END CATCH;

    BEGIN TRY
        EXEC dbo.u_sp_RegistrarMulta @ID_arriendo=999999, @fecha_multa='2026-10-15',
            @descripcion=N'Inexistente', @monto=1000, @ID_usuario_registro=@idAdmin;
        INSERT #R VALUES ('Multa arriendo inexistente', 'ERROR 60041', 'FAIL', 'no lanzo error');
    END TRY
    BEGIN CATCH
        INSERT #R VALUES ('Multa arriendo inexistente', 'ERROR 60041',
            CASE WHEN ERROR_NUMBER()=60041 THEN 'PASS' ELSE 'FAIL' END,
            CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
    END CATCH;
END;

SELECT * FROM #R ORDER BY id;
SELECT resultado, COUNT(*) AS total FROM #R GROUP BY resultado;
