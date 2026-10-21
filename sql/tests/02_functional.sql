USE [RentaCarDB];
SET NOCOUNT ON;

IF OBJECT_ID('tempdb..#R') IS NOT NULL DROP TABLE #R;
CREATE TABLE #R (id INT IDENTITY, test NVARCHAR(200), esperado NVARCHAR(100), resultado NVARCHAR(10), detalle NVARCHAR(500));

DECLARE @hash VARCHAR(255) = REPLICATE('x', 60);

-- ===================== FIXTURES =====================
IF NOT EXISTS (SELECT 1 FROM Usuario WHERE email_usuario = 'qa.admin@rentacar.cl')
    EXEC dbo.u_sp_RegistrarUsuario @rut='20000000-5', @nombres='QA', @apellido_paterno='Admin',
        @email='qa.admin@rentacar.cl', @password_hash=@hash, @rol='ADMIN';
IF NOT EXISTS (SELECT 1 FROM Usuario WHERE email_usuario = 'qa.cliente@rentacar.cl')
    EXEC dbo.u_sp_RegistrarUsuario @rut='12345678-5', @nombres='QA', @apellido_paterno='Cliente',
        @email='qa.cliente@rentacar.cl', @password_hash=@hash, @rol='CLIENTE';

DECLARE @idAdmin INT = (SELECT ID_usuario FROM Usuario WHERE email_usuario='qa.admin@rentacar.cl');
DECLARE @idCliente INT = (SELECT ID_usuario FROM Usuario WHERE email_usuario='qa.cliente@rentacar.cl');
DECLARE @idPersonaCliente INT = (SELECT ID_persona_usuario FROM Usuario WHERE ID_usuario=@idCliente);

IF NOT EXISTS (SELECT 1 FROM Proveedor WHERE nombre_comercial_proveedor='QA Provider')
BEGIN
    EXEC dbo.u_sp_RegistrarProveedor @ID_tipo_proveedor=1, @ID_persona_proveedor=@idPersonaCliente,
        @nombre_comercial='QA Provider';
    EXEC dbo.u_sp_AsignarRolUsuario @ID_usuario=@idCliente, @rol='PROVEEDOR', @ID_usuario_ejecutor=@idCliente;
END
DECLARE @idProv INT = (SELECT ID_proveedor FROM Proveedor WHERE nombre_comercial_proveedor='QA Provider');
IF NOT EXISTS (SELECT 1 FROM ProveedorUsuario WHERE ID_proveedor_proveedor_usuario=@idProv AND ID_usuario_proveedor_usuario=@idCliente)
    EXEC dbo.u_sp_VincularUsuarioProveedor @ID_proveedor=@idProv, @ID_usuario=@idCliente, @es_administrador=1;
IF EXISTS (SELECT 1 FROM EstadoProveedor ep INNER JOIN Proveedor p ON p.ID_estado_proveedor_proveedor=ep.ID_estado_proveedor
           WHERE p.ID_proveedor=@idProv AND ep.nombre_estado_proveedor='PENDIENTE')
    EXEC dbo.u_sp_AprobarProveedor @ID_proveedor=@idProv, @ID_usuario_admin=@idAdmin;

IF NOT EXISTS (SELECT 1 FROM SedeProveedor WHERE ID_proveedor_sede_proveedor=@idProv AND nombre_sede_proveedor='QA Sede')
    EXEC dbo.u_sp_RegistrarSedeProveedor @ID_proveedor=@idProv, @ID_comuna=1, @nombre='QA Sede', @direccion='Calle QA 1';
DECLARE @idSede INT = (SELECT ID_sede_proveedor FROM SedeProveedor WHERE ID_proveedor_sede_proveedor=@idProv AND nombre_sede_proveedor='QA Sede');

IF NOT EXISTS (SELECT 1 FROM Vehiculo WHERE patente_vehiculo='QAAB12')
    EXEC dbo.u_sp_RegistrarVehiculo @ID_proveedor=@idProv, @ID_modelo=1, @ID_tipo_vehiculo=1,
        @ID_tipo_combustible=1, @ID_tipo_transmision=1, @patente='QAAB12', @vin='QAVIN00000000001',
        @anio=2022, @kilometraje=1000, @precio_diario_base=20000, @ID_sede_actual=@idSede;
DECLARE @idVeh INT = (SELECT ID_vehiculo FROM Vehiculo WHERE patente_vehiculo='QAAB12');

IF NOT EXISTS (SELECT 1 FROM TarifaVehiculo WHERE ID_vehiculo_tarifa=@idVeh AND nombre_tarifa='QA Tarifa')
    EXEC dbo.u_sp_RegistrarTarifaVehiculo @ID_vehiculo=@idVeh, @ID_proveedor=@idProv, @nombre='QA Tarifa',
        @fecha_inicio='2026-01-01', @fecha_fin='2026-12-31', @precio_dia=20000;
IF NOT EXISTS (SELECT 1 FROM VehiculoFoto WHERE ID_vehiculo_vehiculo_foto=@idVeh AND url_foto_vehiculo='/uploads/vehiculos/qa.webp')
    EXEC dbo.u_sp_RegistrarVehiculoFoto @ID_vehiculo=@idVeh, @ID_proveedor=@idProv,
        @url_foto='/uploads/vehiculos/qa.webp', @es_principal=1;
IF NOT EXISTS (SELECT 1 FROM VehiculoCaracteristica WHERE ID_vehiculo_vehiculo_caracteristica=@idVeh AND ID_caracteristica_vehiculo_caracteristica=1)
    EXEC dbo.u_sp_AgregarCaracteristicaVehiculo @ID_vehiculo=@idVeh, @ID_proveedor=@idProv, @ID_caracteristica=1, @disponible=1;
EXEC dbo.u_sp_PublicarVehiculo @ID_vehiculo=@idVeh, @ID_usuario_admin=@idAdmin;

-- ===================== AUTH =====================
BEGIN TRY
    EXEC dbo.u_sp_Login @email='qa.cliente@rentacar.cl', @password_hash=@hash;
    INSERT #R VALUES ('Login valido', 'OK', 'PASS', '');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Login valido', 'OK', 'FAIL', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_Login @email='qa.cliente@rentacar.cl', @password_hash='incorrecto';
    INSERT #R VALUES ('Login password incorrecta', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Login password incorrecta', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_Login @email='noexiste@rentacar.cl', @password_hash=@hash;
    INSERT #R VALUES ('Login email inexistente', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Login email inexistente', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_RegistrarUsuario @rut='12345678-5', @nombres='Dup', @apellido_paterno='Rut',
        @email='otro@rentacar.cl', @password_hash=@hash, @rol='CLIENTE';
    INSERT #R VALUES ('Registro RUT duplicado', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Registro RUT duplicado', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_RegistrarUsuario @rut='20000001-3', @nombres='Dup', @apellido_paterno='Email',
        @email='qa.cliente@rentacar.cl', @password_hash=@hash, @rol='CLIENTE';
    INSERT #R VALUES ('Registro email duplicado', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Registro email duplicado', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_RegistrarUsuario @rut='12345678-9', @nombres='Malo', @apellido_paterno='Rut',
        @email='malo@rentacar.cl', @password_hash=@hash, @rol='CLIENTE';
    INSERT #R VALUES ('Registro RUT invalido', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Registro RUT invalido', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

DECLARE @vt CHAR(64) = (SELECT TOP 1 token_hash_email_verificacion FROM EmailVerificacion
    WHERE ID_usuario_email_verificacion=@idCliente AND fecha_uso_email_verificacion IS NULL
    ORDER BY ID_email_verificacion DESC);
BEGIN TRY
    EXEC dbo.u_sp_VerificarEmail @token_hash=@vt;
    INSERT #R VALUES ('Verificar email con token valido', 'OK', 'PASS', '');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Verificar email con token valido', 'OK', 'FAIL', ERROR_MESSAGE());
END CATCH;
BEGIN TRY
    EXEC dbo.u_sp_VerificarEmail @token_hash=@vt;
    INSERT #R VALUES ('Verificar email token ya usado', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Verificar email token ya usado', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

DECLARE @newHash1 VARCHAR(255) = REPLICATE('y',60), @newHash2 VARCHAR(255) = REPLICATE('z',60);
DECLARE @rt TABLE (token_reset CHAR(64));
INSERT @rt EXEC dbo.u_sp_SolicitarResetPassword @email='qa.cliente@rentacar.cl';
DECLARE @resetToken CHAR(64) = (SELECT TOP 1 token_reset FROM @rt);
BEGIN TRY
    EXEC dbo.u_sp_ConfirmarResetPassword @token_hash=@resetToken, @nuevo_hash=@newHash1;
    INSERT #R VALUES ('Reset password con token valido', 'OK', 'PASS', '');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Reset password con token valido', 'OK', 'FAIL', ERROR_MESSAGE());
END CATCH;
BEGIN TRY
    EXEC dbo.u_sp_ConfirmarResetPassword @token_hash=@resetToken, @nuevo_hash=@newHash2;
    INSERT #R VALUES ('Reset token ya usado', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Reset token ya usado', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

-- ===================== PROVEEDOR / VEHICULO =====================
BEGIN TRY
    EXEC dbo.u_sp_RegistrarSedeProveedor @ID_proveedor=@idProv, @ID_comuna=1, @nombre='QA Sede', @direccion='Otra';
    INSERT #R VALUES ('Sede nombre duplicado', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Sede nombre duplicado', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_RegistrarSedeProveedor @ID_proveedor=@idProv, @ID_comuna=999999, @nombre='QA Sede 2', @direccion='X';
    INSERT #R VALUES ('Sede comuna inexistente', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Sede comuna inexistente', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_RegistrarVehiculo @ID_proveedor=@idProv, @ID_modelo=1, @ID_tipo_vehiculo=1,
        @ID_tipo_combustible=1, @ID_tipo_transmision=1, @patente='QAAB12', @vin='QAVIN00000000002',
        @anio=2022, @kilometraje=1000, @precio_diario_base=20000, @ID_sede_actual=@idSede;
    INSERT #R VALUES ('Vehiculo patente duplicada', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Vehiculo patente duplicada', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_RegistrarVehiculo @ID_proveedor=@idProv, @ID_modelo=1, @ID_tipo_vehiculo=1,
        @ID_tipo_combustible=1, @ID_tipo_transmision=1, @patente='QAAC12', @vin='QAVIN00000000003',
        @anio=1949, @kilometraje=1000, @precio_diario_base=20000, @ID_sede_actual=@idSede;
    INSERT #R VALUES ('Vehiculo anio 1949', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Vehiculo anio 1949', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_RegistrarVehiculo @ID_proveedor=@idProv, @ID_modelo=1, @ID_tipo_vehiculo=1,
        @ID_tipo_combustible=1, @ID_tipo_transmision=1, @patente='QAAD12', @vin='QAVIN00000000004',
        @anio=2022, @kilometraje=1000, @precio_diario_base=-1, @ID_sede_actual=@idSede;
    INSERT #R VALUES ('Vehiculo precio negativo', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Vehiculo precio negativo', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_RegistrarTarifaVehiculo @ID_vehiculo=@idVeh, @ID_proveedor=@idProv, @nombre='QA Mala',
        @fecha_inicio='2026-12-31', @fecha_fin='2026-01-01', @precio_dia=20000;
    INSERT #R VALUES ('Tarifa fecha fin < inicio', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Tarifa fecha fin < inicio', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_RegistrarTarifaVehiculo @ID_vehiculo=@idVeh, @ID_proveedor=@idProv, @nombre='QA Dia 8',
        @fecha_inicio='2026-01-01', @fecha_fin='2026-12-31', @precio_dia=20000, @dia_semana=8;
    INSERT #R VALUES ('Tarifa dia de semana 8', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Tarifa dia de semana 8', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

IF EXISTS (SELECT 1 FROM vw_VehiculosDisponibles WHERE ID_vehiculo=@idVeh)
    INSERT #R VALUES ('Vehiculo publicado aparece en vw_VehiculosDisponibles', 'OK', 'PASS', '');
ELSE
    INSERT #R VALUES ('Vehiculo publicado aparece en vw_VehiculosDisponibles', 'OK', 'FAIL', 'no aparece');

BEGIN TRY
    EXEC dbo.u_sp_AsignarRolUsuario @ID_usuario=@idCliente, @rol='ADMIN', @ID_usuario_ejecutor=@idCliente;
    INSERT #R VALUES ('Cliente no puede auto-asignarse ADMIN', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Cliente no puede auto-asignarse ADMIN', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_ActualizarConfiguracionProveedor @ID_proveedor=@idProv, @dias_minimos_arriendo=5, @dias_maximos_arriendo=2;
    INSERT #R VALUES ('Config dias max < min', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Config dias max < min', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

BEGIN TRY
    EXEC dbo.u_sp_GenerarLiquidacion @ID_proveedor=@idProv, @periodo_inicio='2026-12-31', @periodo_fin='2026-01-01';
    INSERT #R VALUES ('Liquidacion periodo invertido', 'ERROR', 'FAIL', 'no lanzo error');
END TRY
BEGIN CATCH
    INSERT #R VALUES ('Liquidacion periodo invertido', 'ERROR', 'PASS', ERROR_MESSAGE());
END CATCH;

EXEC dbo.u_sp_PublicarEvento @tipo_evento='QA_TEST', @agregado_tipo='QA', @agregado_id=1, @payload='{"ok":true}';
IF EXISTS (SELECT 1 FROM OutboxEvento WHERE tipo_evento='QA_TEST')
    INSERT #R VALUES ('Outbox publicar evento', 'OK', 'PASS', '');
ELSE
    INSERT #R VALUES ('Outbox publicar evento', 'OK', 'FAIL', 'no se inserto');

SELECT * FROM #R ORDER BY id;
SELECT resultado, COUNT(*) AS total FROM #R GROUP BY resultado;
