# SEGURIDAD

Buenas prácticas aplicadas a la aplicación web (API + frontend).

## 1) Autenticación y sesión

- **Contraseñas:** hash con **bcrypt** (nunca en texto plano). El hash se guarda en
  `Usuario.password_hash_usuario` (255).
- **JWT:** firmado con secreto en variable de entorno (`JWT_SECRET`), con expiración corta
  (p. ej. 1 h) y **refresh token** opcional.
- **Roles:** en el token y **revalidados** contra `UsuarioRol` en operaciones sensibles.
- **Login:** se usa `sp_Login`; registrar intentos en `LoginHistorial` (ya existe).
- **Verificación de correo** (`EmailVerificacion`) y **reset** (`PasswordResetToken`) con tokens
  de un solo uso y expiración.

## 2) Autorización

- Middleware `authorize(roles)` en cada endpoint; **mínimo privilegio**.
- La app se conecta a la BD con el usuario **`api_user`** (rol `db_rentacar_rw`), que **no**
  escribe tablas directamente (solo `EXECUTE`/`SELECT`); la escritura pasa por SPs.

## 3) Validación y entrada

- **Validación estricta** con `zod` en el borde (API) y en formularios (frontend).
- **Consultas parametrizadas** siempre (evita inyección SQL). Con SPs, pasar parámetros tipados.
- **Uploads:** validar tipo MIME y tamaño; renombrar archivos; no ejecutar contenido subido.

## 4) OWASP Top 10 (checklist)

| Riesgo | Mitigación |
|---|---|
| A01 Control de acceso | `authorize`, ownership checks (reserva/vehículo del usuario) |
| A02 Fallos criptográficos | bcrypt, HTTPS, secretos en entorno |
| A03 Inyección | Consultas parametrizadas / SPs, validación |
| A04 Diseño inseguro | Reglas en SPs + servicios; revisión de PRs |
| A05 Configuración | Helmet, CORS restringido, sin `debug` en prod |
| A06 Componentes vulnerables | `npm audit`, dependencias actualizadas |
| A07 Fallos de identificación | Rate limiting en login, bloqueo por intentos |
| A08 Integridad de datos | Idempotencia (`idempotency_key`), transacciones |
| A09 Logging/monitoreo | Logs estructurados, `Auditoria`, alertas básicas |
| A10 SSRF | No exponer URLs de usuario a fetch del servidor |

## 5) Cabeceras y transporte

- **Helmet** (cabeceras de seguridad), **CORS** con lista blanca de orígenes.
- **Rate limiting** (p. ej. `express-rate-limit`) en `/auth/*` y endpoints costosos.
- En producción, **HTTPS** obligatorio.

## 6) Secretos y configuración

- Secretos en `.env` (nunca en el repo). `.env.example` con claves vacías.
- Variables: `DB_HOST/PORT/USER/PASSWORD/DATABASE`, `JWT_SECRET`, `CORS_ORIGIN`, `UPLOAD_DIR`.
- `.gitignore` cubre `.env`, `node_modules`, `uploads/`, `dist/`.

## 7) Datos personales (Ley 19.628, Chile)

- Minimizar datos; **RUT** y contacto son datos personales.
- No loguear RUT/contraseñas/tokens.
- Acceso restringido a datos personales (solo roles autorizados).
- Retención: no borrar historial con datos personales sin anonimizar.

## 8) Respuesta y errores

- No exponer trazas ni detalles internos en respuestas (mensajes genéricos + código).
- Logs internos con `correlation_id` para trazabilidad sin filtrar datos sensibles.
