USE [RentaCarDB];
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;

IF OBJECT_ID('tempdb..#R') IS NOT NULL DROP TABLE #R;
CREATE TABLE #R (id INT IDENTITY, test NVARCHAR(200), esperado NVARCHAR(100), resultado NVARCHAR(10), detalle NVARCHAR(500));

DECLARE @idCliente INT = (SELECT ID_usuario FROM Usuario WHERE email_usuario='qa.cliente@rentacar.cl');
DECLARE @idAdmin INT = (SELECT ID_usuario FROM Usuario WHERE email_usuario='qa.admin@rentacar.cl');
DECLARE @idProv INT = (SELECT ID_proveedor FROM Proveedor WHERE nombre_comercial_proveedor='QA Provider');
DECLARE @idVeh INT = (SELECT ID_vehiculo FROM Vehiculo WHERE patente_vehiculo='QAAB12');
DECLARE @idSede INT = (SELECT TOP 1 ID_sede_proveedor FROM SedeProveedor
                       WHERE ID_proveedor_sede_proveedor=@idProv ORDER BY ID_sede_proveedor);
DECLARE @hoy DATE = CAST(GETDATE() AS DATE);
DECLARE @inicio DATE = DATEADD(DAY, 160, @hoy);
DECLARE @fin DATE = DATEADD(DAY, 4, @inicio);
DECLARE @inicioNoLic DATE = DATEADD(DAY, 180, @hoy);
DECLARE @finNoLic DATE = DATEADD(DAY, 4, @inicioNoLic);
DECLARE @licEmision DATE = DATEADD(YEAR,-1,@hoy);
DECLARE @licVencimiento DATE = DATEADD(YEAR,3,@hoy);
DECLARE @hash60 VARCHAR(255) = REPLICATE('x',60);

-- Licencia vigente y verificada para el cliente QA.
IF NOT EXISTS (SELECT 1 FROM LicenciaConducir WHERE ID_persona_licencia_conducir =
               (SELECT ID_persona_usuario FROM Usuario WHERE ID_usuario=@idCliente)
               AND activa_licencia=1 AND verificada_licencia=1
               AND fecha_vencimiento_licencia >= @hoy)
BEGIN
    DECLARE @idPersonaCliente INT = (SELECT ID_persona_usuario FROM Usuario WHERE ID_usuario=@idCliente);
    EXEC dbo.u_sp_RegistrarLicenciaConducir @ID_persona=@idPersonaCliente, @ID_clase_licencia=6,
        @numero_licencia='QA-S3-CLIENTE', @fecha_emision=@licEmision,
        @fecha_vencimiento=@licVencimiento, @url_archivo=NULL;
    UPDATE LicenciaConducir SET verificada_licencia=1
    WHERE ID_persona_licencia_conducir=@idPersonaCliente AND activa_licencia=1;
END

-- Segunda persona para conductor adicional.
IF NOT EXISTS (SELECT 1 FROM Persona WHERE rut_persona='44444444-4')
    INSERT INTO Persona (rut_persona, nombres_persona, apellido_paterno_persona, fecha_nacimiento_persona)
    VALUES ('44444444-4', N'Conductor', N'QA Adicional', '1990-01-01');
DECLARE @idPersonaExtra INT = (SELECT ID_persona FROM Persona WHERE rut_persona='44444444-4');
IF NOT EXISTS (SELECT 1 FROM LicenciaConducir WHERE ID_persona_licencia_conducir=@idPersonaExtra AND activa_licencia=1)
BEGIN
    EXEC dbo.u_sp_RegistrarLicenciaConducir @ID_persona=@idPersonaExtra, @ID_clase_licencia=6,
        @numero_licencia='QA-S3-EXTRA', @fecha_emision=@licEmision,
        @fecha_vencimiento=@licVencimiento, @url_archivo=NULL;
    UPDATE LicenciaConducir SET verificada_licencia=1
    WHERE ID_persona_licencia_conducir=@idPersonaExtra AND activa_licencia=1;
END

-- ===================== RESERVA + PAGO + INICIO =====================
DECLARE @key VARCHAR(100) = CONCAT('QA-S3-', CONVERT(VARCHAR(36), NEWID()));
DECLARE @idRes INT, @monto DECIMAL(14,2), @token CHAR(64), @url VARCHAR(200), @idArriendo INT;
BEGIN TRY
    EXEC dbo.u_sp_CrearReserva @ID_usuario_cliente=@idCliente, @ID_vehiculo=@idVeh,
        @ID_sede_retiro=@idSede, @ID_sede_devolucion=@idSede,
        @fecha_inicio=@inicio, @fecha_fin=@fin,
        @km_incluidos_dia=200, @cargo_km_excedido=100,
        @idempotency_key=@key;
    SET @idRes = (SELECT ID_reserva FROM Reserva WHERE idempotency_key_reserva=@key);
    SELECT @monto = monto_total_reserva FROM Reserva WHERE ID_reserva=@idRes;
    EXEC dbo.u_sp_WebPay_IniciarTransaccion @ID_reserva=@idRes, @monto=@monto,
        @token_ws=@token OUTPUT, @url_redireccion=@url OUTPUT;
    EXEC dbo.u_sp_WebPay_ConfirmarTransaccion @token_ws=@token, @aprobada=1;
    INSERT #R VALUES ('Reserva confirmada para arriendo', 'CONFIRMADA', 'PASS', CONCAT('ID=', @idRes));
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Reserva confirmada para arriendo', 'CONFIRMADA', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_IniciarArriendo @ID_reserva=@idRes, @ID_sede_retiro_real=@idSede,
        @kilometraje_inicial=1000, @combustible_inicial=100, @ID_usuario_operador=@idAdmin;
    SET @idArriendo = (SELECT ID_arriendo FROM Arriendo WHERE ID_reserva_arriendo=@idRes);
    INSERT #R VALUES ('Iniciar arriendo', 'ACTIVO', CASE WHEN @idArriendo IS NOT NULL THEN 'PASS' ELSE 'FAIL' END, CONCAT('ID=', @idArriendo));
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Iniciar arriendo', 'ACTIVO', 'FAIL', ERROR_MESSAGE());
END CATCH;

IF EXISTS (SELECT 1 FROM Arriendo a INNER JOIN EstadoArriendo ea ON ea.ID_estado_arriendo=a.ID_estado_arriendo_arriendo
           WHERE a.ID_arriendo=@idArriendo AND ea.nombre_estado_arriendo='ACTIVO')
    INSERT #R VALUES ('Arriendo ACTIVO', 'ACTIVO', 'PASS', '');
ELSE
    INSERT #R VALUES ('Arriendo ACTIVO', 'ACTIVO', 'FAIL', 'no activo');

IF EXISTS (SELECT 1 FROM Reserva r INNER JOIN EstadoReserva er ON er.ID_estado_reserva=r.ID_estado_reserva_reserva
           WHERE r.ID_reserva=@idRes AND er.nombre_estado_reserva='EN_CURSO')
    INSERT #R VALUES ('Reserva EN_CURSO', 'EN_CURSO', 'PASS', '');
ELSE
    INSERT #R VALUES ('Reserva EN_CURSO', 'EN_CURSO', 'FAIL', 'no cambio');

IF EXISTS (SELECT 1 FROM InspeccionArriendo WHERE ID_arriendo_inspeccion_arriendo=@idArriendo AND tipo_inspeccion='ENTREGA')
    INSERT #R VALUES ('Inspeccion ENTREGA creada', 'ENTREGA', 'PASS', '');
ELSE
    INSERT #R VALUES ('Inspeccion ENTREGA creada', 'ENTREGA', 'FAIL', 'no existe');

IF EXISTS (SELECT 1 FROM Vehiculo v INNER JOIN EstadoVehiculo ev ON ev.ID_estado_vehiculo=v.ID_estado_vehiculo_vehiculo
           WHERE v.ID_vehiculo=@idVeh AND ev.nombre_estado_vehiculo='ARRENDADO')
    INSERT #R VALUES ('Vehiculo ARRENDADO', 'ARRENDADO', 'PASS', '');
ELSE
    INSERT #R VALUES ('Vehiculo ARRENDADO', 'ARRENDADO', 'FAIL', 'no cambio');

-- ===================== CONTRATO, CONDUCTOR Y DANO EN ENTREGA =====================
DECLARE @hash CHAR(64) = REPLICATE('a', 64);
BEGIN TRY
    EXEC dbo.u_sp_CrearAceptacionContrato @ID_arriendo=@idArriendo, @hash_contrato=@hash,
        @url_contrato='/contratos/qa', @ip_aceptacion='127.0.0.1', @user_agent=N'QA', @ID_usuario=@idCliente;
    IF EXISTS (SELECT 1 FROM AceptacionContratoArriendo
               WHERE ID_arriendo_aceptacion=@idArriendo AND hash_contrato=@hash)
        INSERT #R VALUES ('Aceptacion de contrato', 'registrada', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Aceptacion de contrato', 'registrada', 'FAIL', 'no existe');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Aceptacion de contrato', 'registrada', 'FAIL', ERROR_MESSAGE());
END CATCH;

DECLARE @idLicenciaExtra INT = (SELECT TOP 1 ID_licencia_conducir FROM LicenciaConducir
    WHERE ID_persona_licencia_conducir=@idPersonaExtra AND activa_licencia=1 ORDER BY ID_licencia_conducir DESC);
BEGIN TRY
    EXEC dbo.u_sp_RegistrarConductorAdicional @ID_arriendo=@idArriendo, @ID_persona=@idPersonaExtra,
        @ID_licencia_conducir=@idLicenciaExtra;
    IF EXISTS (SELECT 1 FROM ConductorAdicional WHERE ID_arriendo_conductor_adicional=@idArriendo AND activo_conductor_adicional=1)
        INSERT #R VALUES ('Conductor adicional', 'registrado', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Conductor adicional', 'registrado', 'FAIL', 'no existe');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Conductor adicional', 'registrado', 'FAIL', ERROR_MESSAGE());
END CATCH;

DECLARE @idInspeccionEntrega INT = (SELECT TOP 1 ID_inspeccion_arriendo FROM InspeccionArriendo
    WHERE ID_arriendo_inspeccion_arriendo=@idArriendo AND tipo_inspeccion='ENTREGA');
BEGIN TRY
    EXEC dbo.u_sp_RegistrarDanoInspeccion @ID_inspeccion=@idInspeccionEntrega, @zona='PUERTA',
        @tipo='RAYON', @severidad='LEVE';
    INSERT #R VALUES ('Dano en ENTREGA rechazado', 'ERROR 60063', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Dano en ENTREGA rechazado', 'ERROR 60063',
        CASE WHEN ERROR_NUMBER()=60063 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_CrearResena @ID_usuario_autor=@idCliente, @ID_arriendo=@idArriendo,
        @tipo_resena='CLIENTE_A_VEHICULO', @calificacion=5, @comentario=N'Aun no finalizado';
    INSERT #R VALUES ('Resena antes de finalizar rechazada', 'ERROR 53014', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Resena antes de finalizar rechazada', 'ERROR 53014',
        CASE WHEN ERROR_NUMBER()=53014 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

-- ===================== DEVOLUCION =====================
BEGIN TRY
    EXEC dbo.u_sp_RegistrarDevolucion @ID_arriendo=@idArriendo, @ID_sede_devolucion_real=@idSede,
        @kilometraje_final=1900, @combustible_final=80, @limpieza='BUENA',
        @observaciones=N'Devolucion QA S3', @ID_usuario_operador=@idAdmin;
    IF EXISTS (SELECT 1 FROM Arriendo a INNER JOIN EstadoArriendo ea ON ea.ID_estado_arriendo=a.ID_estado_arriendo_arriendo
               WHERE a.ID_arriendo=@idArriendo AND ea.nombre_estado_arriendo='FINALIZADO')
        INSERT #R VALUES ('Registrar devolucion', 'FINALIZADO', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Registrar devolucion', 'FINALIZADO', 'FAIL', 'no finalizo');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Registrar devolucion', 'FINALIZADO', 'FAIL', ERROR_MESSAGE());
END CATCH;

IF EXISTS (SELECT 1 FROM Reserva r INNER JOIN EstadoReserva er ON er.ID_estado_reserva=r.ID_estado_reserva_reserva
           WHERE r.ID_reserva=@idRes AND er.nombre_estado_reserva='COMPLETADA')
    INSERT #R VALUES ('Reserva COMPLETADA', 'COMPLETADA', 'PASS', '');
ELSE
    INSERT #R VALUES ('Reserva COMPLETADA', 'COMPLETADA', 'FAIL', 'no cambio');

IF EXISTS (SELECT 1 FROM Vehiculo v INNER JOIN EstadoVehiculo ev ON ev.ID_estado_vehiculo=v.ID_estado_vehiculo_vehiculo
           WHERE v.ID_vehiculo=@idVeh AND ev.nombre_estado_vehiculo='DISPONIBLE')
    INSERT #R VALUES ('Vehiculo DISPONIBLE', 'DISPONIBLE', 'PASS', '');
ELSE
    INSERT #R VALUES ('Vehiculo DISPONIBLE', 'DISPONIBLE', 'FAIL', 'no cambio');

IF EXISTS (SELECT 1 FROM InspeccionArriendo WHERE ID_arriendo_inspeccion_arriendo=@idArriendo AND tipo_inspeccion='DEVOLUCION')
    INSERT #R VALUES ('Inspeccion DEVOLUCION creada', 'DEVOLUCION', 'PASS', '');
ELSE
    INSERT #R VALUES ('Inspeccion DEVOLUCION creada', 'DEVOLUCION', 'FAIL', 'no existe');

IF EXISTS (SELECT 1 FROM CargoExtra ce
           INNER JOIN TipoCargoExtra tce ON tce.ID_tipo_cargo_extra=ce.ID_tipo_cargo_extra_cargo_extra
           WHERE ce.ID_arriendo_cargo_extra=@idArriendo AND tce.nombre_tipo_cargo_extra='KM_EXCEDIDO'
             AND ce.monto_cargo_extra=10000)
    INSERT #R VALUES ('Cargo por km excedido', '10000', 'PASS', '');
ELSE
    INSERT #R VALUES ('Cargo por km excedido', '10000', 'FAIL', 'no existe o monto distinto');

IF EXISTS (SELECT 1 FROM MovimientoFinanciero WHERE ID_reserva_movimiento=@idRes AND tipo_movimiento='CARGO_KM' AND monto_movimiento=10000)
    INSERT #R VALUES ('Movimiento CARGO_KM', '10000', 'PASS', '');
ELSE
    INSERT #R VALUES ('Movimiento CARGO_KM', '10000', 'FAIL', 'no existe');

IF EXISTS (SELECT 1 FROM Notificacion WHERE ID_usuario_notificacion=@idCliente AND tipo_notificacion='ARRIENDO_FINALIZADO')
    INSERT #R VALUES ('Notificacion de finalizacion', 'existe', 'PASS', '');
ELSE
    INSERT #R VALUES ('Notificacion de finalizacion', 'existe', 'FAIL', 'no existe');

-- ===================== DANO EN DEVOLUCION Y RESENA =====================
DECLARE @idInspeccionDevolucion INT = (SELECT TOP 1 ID_inspeccion_arriendo FROM InspeccionArriendo
    WHERE ID_arriendo_inspeccion_arriendo=@idArriendo AND tipo_inspeccion='DEVOLUCION');
BEGIN TRY
    EXEC dbo.u_sp_RegistrarDanoInspeccion @ID_inspeccion=@idInspeccionDevolucion, @zona='PARACHOQUES',
        @tipo='GOLPE', @severidad='MEDIO', @descripcion=N'Golpe leve', @monto_estimado=25000;
    IF EXISTS (SELECT 1 FROM InspeccionDano WHERE ID_inspeccion_arriendo_inspeccion_dano=@idInspeccionDevolucion AND activo_dano=1)
        INSERT #R VALUES ('Dano en DEVOLUCION', 'registrado', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Dano en DEVOLUCION', 'registrado', 'FAIL', 'no existe');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Dano en DEVOLUCION', 'registrado', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_CrearResena @ID_usuario_autor=@idCliente, @ID_arriendo=@idArriendo,
        @tipo_resena='CLIENTE_A_VEHICULO', @calificacion=5, @comentario=N'Excelente vehiculo';
    IF EXISTS (SELECT 1 FROM Resena WHERE ID_arriendo_resena=@idArriendo AND activo_resena=1)
        INSERT #R VALUES ('Resena tras finalizar', 'registrada', 'PASS', '');
    ELSE
        INSERT #R VALUES ('Resena tras finalizar', 'registrada', 'FAIL', 'no existe');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Resena tras finalizar', 'registrada', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_CrearResena @ID_usuario_autor=@idCliente, @ID_arriendo=@idArriendo,
        @tipo_resena='CLIENTE_A_VEHICULO', @calificacion=4, @comentario=N'Duplicada';
    INSERT #R VALUES ('Resena duplicada rechazada', 'ERROR 53017', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Resena duplicada rechazada', 'ERROR 53017',
        CASE WHEN ERROR_NUMBER()=53017 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_RegistrarDevolucion @ID_arriendo=@idArriendo, @ID_sede_devolucion_real=@idSede,
        @kilometraje_final=2000, @combustible_final=80, @ID_usuario_operador=@idAdmin;
    INSERT #R VALUES ('Devolucion duplicada rechazada', 'ERROR 53009', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Devolucion duplicada rechazada', 'ERROR 53009',
        CASE WHEN ERROR_NUMBER()=53009 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

-- ===================== CLIENTE SIN LICENCIA =====================
IF NOT EXISTS (SELECT 1 FROM Usuario WHERE email_usuario='qa.s3.sinlicencia@rentacar.cl')
    EXEC dbo.u_sp_RegistrarUsuario @rut='21000000-3', @nombres='QA', @apellido_paterno='SinLicencia',
        @email='qa.s3.sinlicencia@rentacar.cl', @password_hash=@hash60, @rol='CLIENTE';
DECLARE @idClienteSinLic INT = (SELECT ID_usuario FROM Usuario WHERE email_usuario='qa.s3.sinlicencia@rentacar.cl');
DECLARE @keySinLic VARCHAR(100) = CONCAT('QA-S3-NOLIC-', CONVERT(VARCHAR(36), NEWID()));
DECLARE @idResSinLic INT, @montoSinLic DECIMAL(14,2), @tokenSinLic CHAR(64), @urlSinLic VARCHAR(200);
BEGIN TRY
    EXEC dbo.u_sp_CrearReserva @ID_usuario_cliente=@idClienteSinLic, @ID_vehiculo=@idVeh,
        @ID_sede_retiro=@idSede, @ID_sede_devolucion=@idSede,
        @fecha_inicio=@inicioNoLic, @fecha_fin=@finNoLic,
        @km_incluidos_dia=200, @cargo_km_excedido=100, @idempotency_key=@keySinLic;
    SET @idResSinLic = (SELECT ID_reserva FROM Reserva WHERE idempotency_key_reserva=@keySinLic);
    SELECT @montoSinLic = monto_total_reserva FROM Reserva WHERE ID_reserva=@idResSinLic;
    EXEC dbo.u_sp_WebPay_IniciarTransaccion @ID_reserva=@idResSinLic, @monto=@montoSinLic,
        @token_ws=@tokenSinLic OUTPUT, @url_redireccion=@urlSinLic OUTPUT;
    EXEC dbo.u_sp_WebPay_ConfirmarTransaccion @token_ws=@tokenSinLic, @aprobada=1;
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Preparar cliente sin licencia', 'OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_IniciarArriendo @ID_reserva=@idResSinLic, @ID_sede_retiro_real=@idSede,
        @kilometraje_inicial=1000, @combustible_inicial=100, @ID_usuario_operador=@idAdmin;
    INSERT #R VALUES ('Iniciar sin licencia rechazado', 'ERROR 53014', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Iniciar sin licencia rechazado', 'ERROR 53014',
        CASE WHEN ERROR_NUMBER()=53014 THEN 'PASS' ELSE 'FAIL' END,
        CONCAT(ERROR_NUMBER(), ': ', ERROR_MESSAGE()));
END CATCH;

SELECT * FROM #R ORDER BY id;
SELECT resultado, COUNT(*) AS total FROM #R GROUP BY resultado;
