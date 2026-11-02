USE [RentaCarDB];
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;

IF OBJECT_ID('tempdb..#R') IS NOT NULL DROP TABLE #R;
CREATE TABLE #R (id INT IDENTITY, test NVARCHAR(200), esperado NVARCHAR(100), resultado NVARCHAR(10), detalle NVARCHAR(500));

DECLARE @hash VARCHAR(255) = REPLICATE('x', 60);
DECLARE @idAdmin INT = (SELECT ID_usuario FROM Usuario WHERE email_usuario = 'qa.admin@rentacar.cl');

-- Persona: registro público completo.
IF NOT EXISTS (SELECT 1 FROM Usuario WHERE email_usuario = 'qa.publico.persona@rentacar.cl')
    EXEC dbo.u_sp_RegistrarProveedorPublico
        @rut = '22222222-2', @nombres = 'QA', @apellido_paterno = 'Publico',
        @email = 'qa.publico.persona@rentacar.cl', @password_hash = @hash,
        @tipo_proveedor = 'PERSONA', @nombre_comercial = 'QA Publico Persona';

DECLARE @idUsuarioP INT = (SELECT ID_usuario FROM Usuario WHERE email_usuario = 'qa.publico.persona@rentacar.cl');
DECLARE @idProvP INT = (SELECT ID_proveedor FROM Proveedor WHERE nombre_comercial_proveedor = 'QA Publico Persona');
DECLARE @rolesP INT = (SELECT COUNT(*) FROM UsuarioRol ur INNER JOIN Rol r ON r.ID_rol = ur.ID_rol_usuario_rol
                       WHERE ur.ID_usuario_usuario_rol = @idUsuarioP AND r.nombre_rol IN ('CLIENTE','PROVEEDOR'));
DECLARE @estadoP VARCHAR(50) = (SELECT ep.nombre_estado_proveedor FROM Proveedor p
                                 INNER JOIN EstadoProveedor ep ON ep.ID_estado_proveedor = p.ID_estado_proveedor_proveedor
                                 WHERE p.ID_proveedor = @idProvP);
DECLARE @personaP INT = (SELECT ID_persona_proveedor FROM Proveedor WHERE ID_proveedor = @idProvP);
DECLARE @configP INT = (SELECT COUNT(*) FROM ConfiguracionProveedor WHERE ID_proveedor_configuracion_proveedor = @idProvP);
DECLARE @vinculoP INT = (SELECT COUNT(*) FROM ProveedorUsuario WHERE ID_proveedor_proveedor_usuario = @idProvP AND ID_usuario_proveedor_usuario = @idUsuarioP);

INSERT #R VALUES ('Registro público persona crea usuario', '1', CASE WHEN @idUsuarioP IS NOT NULL THEN 'PASS' ELSE 'FAIL' END, CONCAT('usuario=', ISNULL(@idUsuarioP, 0)));
INSERT #R VALUES ('Registro público persona crea proveedor', '1', CASE WHEN @idProvP IS NOT NULL THEN 'PASS' ELSE 'FAIL' END, CONCAT('proveedor=', ISNULL(@idProvP, 0)));
INSERT #R VALUES ('Registro público asigna ambos roles', '2', CASE WHEN @rolesP = 2 THEN 'PASS' ELSE 'FAIL' END, CONCAT('roles=', @rolesP));
INSERT #R VALUES ('Registro público deja proveedor PENDIENTE', 'PENDIENTE', CASE WHEN @estadoP = 'PENDIENTE' THEN 'PASS' ELSE 'FAIL' END, CONCAT('estado=', ISNULL(@estadoP, 'NULL')));
INSERT #R VALUES ('Registro público persona asocia Persona', '1', CASE WHEN @personaP IS NOT NULL THEN 'PASS' ELSE 'FAIL' END, CONCAT('persona=', ISNULL(@personaP, 0)));
INSERT #R VALUES ('Registro público crea ConfiguracionProveedor', '1', CASE WHEN @configP = 1 THEN 'PASS' ELSE 'FAIL' END, CONCAT('config=', @configP));
INSERT #R VALUES ('Registro público vincula ProveedorUsuario', '1', CASE WHEN @vinculoP = 1 THEN 'PASS' ELSE 'FAIL' END, CONCAT('vinculo=', @vinculoP));
INSERT #R VALUES ('Registro público genera EmailVerificacion', '1', CASE WHEN EXISTS (SELECT 1 FROM EmailVerificacion WHERE ID_usuario_email_verificacion = @idUsuarioP) THEN 'PASS' ELSE 'FAIL' END, 'email token');

-- Empresa: proveedor sin persona y con razón social/RUT.
IF NOT EXISTS (SELECT 1 FROM Usuario WHERE email_usuario = 'qa.publico.empresa@rentacar.cl')
    EXEC dbo.u_sp_RegistrarProveedorPublico
        @rut = '11111111-1', @nombres = 'QA', @apellido_paterno = 'Empresa',
        @email = 'qa.publico.empresa@rentacar.cl', @password_hash = @hash,
        @tipo_proveedor = 'EMPRESA', @nombre_comercial = 'QA Publico Empresa',
        @razon_social = 'QA Publico SpA', @rut_proveedor = '11111111-1';

DECLARE @idProvE INT = (SELECT ID_proveedor FROM Proveedor WHERE nombre_comercial_proveedor = 'QA Publico Empresa');
DECLARE @personaE INT = (SELECT ID_persona_proveedor FROM Proveedor WHERE ID_proveedor = @idProvE);
INSERT #R VALUES ('Registro público empresa no usa Persona', 'NULL', CASE WHEN @personaE IS NULL THEN 'PASS' ELSE 'FAIL' END, CONCAT('persona=', ISNULL(CONVERT(VARCHAR(20), @personaE), 'NULL')));
INSERT #R VALUES ('Registro público empresa crea proveedor', '1', CASE WHEN @idProvE IS NOT NULL THEN 'PASS' ELSE 'FAIL' END, CONCAT('proveedor=', ISNULL(@idProvE, 0)));

-- Cambio de estado: aprobar, suspender y reactivar.
EXEC dbo.u_sp_CambiarEstadoProveedor @ID_proveedor = @idProvP, @ID_usuario_admin = @idAdmin, @nuevo_estado = 'APROBADO';
DECLARE @estadoAprobado VARCHAR(50) = (SELECT ep.nombre_estado_proveedor FROM Proveedor p
                                        INNER JOIN EstadoProveedor ep ON ep.ID_estado_proveedor = p.ID_estado_proveedor_proveedor
                                        WHERE p.ID_proveedor = @idProvP);
INSERT #R VALUES ('Cambio de estado aprueba proveedor', 'APROBADO', CASE WHEN @estadoAprobado = 'APROBADO' THEN 'PASS' ELSE 'FAIL' END, CONCAT('estado=', ISNULL(@estadoAprobado, 'NULL')));

EXEC dbo.u_sp_CambiarEstadoProveedor @ID_proveedor = @idProvP, @ID_usuario_admin = @idAdmin, @nuevo_estado = 'SUSPENDIDO', @motivo = 'QA suspension';
DECLARE @estadoSuspendido VARCHAR(50) = (SELECT ep.nombre_estado_proveedor FROM Proveedor p
                                          INNER JOIN EstadoProveedor ep ON ep.ID_estado_proveedor = p.ID_estado_proveedor_proveedor
                                          WHERE p.ID_proveedor = @idProvP);
DECLARE @motivoSuspension VARCHAR(300) = (SELECT motivo_baja_proveedor FROM Proveedor WHERE ID_proveedor = @idProvP);
INSERT #R VALUES ('Cambio de estado suspende proveedor', 'SUSPENDIDO', CASE WHEN @estadoSuspendido = 'SUSPENDIDO' THEN 'PASS' ELSE 'FAIL' END, CONCAT('estado=', ISNULL(@estadoSuspendido, 'NULL')));
INSERT #R VALUES ('Suspensión conserva motivo', 'QA suspension', CASE WHEN @motivoSuspension = 'QA suspension' THEN 'PASS' ELSE 'FAIL' END, CONCAT('motivo=', ISNULL(@motivoSuspension, 'NULL')));

EXEC dbo.u_sp_CambiarEstadoProveedor @ID_proveedor = @idProvP, @ID_usuario_admin = @idAdmin, @nuevo_estado = 'APROBADO';
DECLARE @estadoReactivado VARCHAR(50) = (SELECT ep.nombre_estado_proveedor FROM Proveedor p
                                          INNER JOIN EstadoProveedor ep ON ep.ID_estado_proveedor = p.ID_estado_proveedor_proveedor
                                          WHERE p.ID_proveedor = @idProvP);
DECLARE @motivoReactivado VARCHAR(300) = (SELECT motivo_baja_proveedor FROM Proveedor WHERE ID_proveedor = @idProvP);
INSERT #R VALUES ('Reactivar proveedor limpia motivo', 'NULL', CASE WHEN @estadoReactivado = 'APROBADO' AND @motivoReactivado IS NULL THEN 'PASS' ELSE 'FAIL' END, CONCAT('estado=', ISNULL(@estadoReactivado, 'NULL'), ', motivo=', ISNULL(@motivoReactivado, 'NULL')));

DECLARE @auditoria INT = (SELECT COUNT(*) FROM Auditoria WHERE entidad_auditoria = 'Proveedor' AND ID_registro_auditoria = @idProvP AND accion_auditoria = 'STATE_CHANGE');
INSERT #R VALUES ('Cambio de estado registra auditoría', '3', CASE WHEN @auditoria >= 3 THEN 'PASS' ELSE 'FAIL' END, CONCAT('filas=', @auditoria));

-- Transición inválida y motivo obligatorio.
DECLARE @transicionInvalida INT = 0;
BEGIN TRY
    EXEC dbo.u_sp_CambiarEstadoProveedor @ID_proveedor = @idProvP, @ID_usuario_admin = @idAdmin, @nuevo_estado = 'PENDIENTE';
END TRY
BEGIN CATCH
    IF ERROR_NUMBER() = 53032 SET @transicionInvalida = 1;
END CATCH;
INSERT #R VALUES ('Transición APROBADO→PENDIENTE rechazada', '1', CASE WHEN @transicionInvalida = 1 THEN 'PASS' ELSE 'FAIL' END, '');

DECLARE @motivoObligatorio INT = 0;
BEGIN TRY
    EXEC dbo.u_sp_CambiarEstadoProveedor @ID_proveedor = @idProvP, @ID_usuario_admin = @idAdmin, @nuevo_estado = 'SUSPENDIDO', @motivo = NULL;
END TRY
BEGIN CATCH
    IF ERROR_NUMBER() = 53033 SET @motivoObligatorio = 1;
END CATCH;
INSERT #R VALUES ('Suspensión sin motivo rechazada', '1', CASE WHEN @motivoObligatorio = 1 THEN 'PASS' ELSE 'FAIL' END, '');

SELECT test, resultado, detalle FROM #R ORDER BY id;
SELECT resultado, COUNT(*) AS total FROM #R GROUP BY resultado;
