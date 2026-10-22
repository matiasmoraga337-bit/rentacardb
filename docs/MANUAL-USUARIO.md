# Manual de usuario — RentaCarDB

## 1. Acceso

- Web: `http://localhost:5173`
- API: `http://localhost:3000/api`
- Mailpit (correos de desarrollo): `http://localhost:8026`
- Swagger: `http://localhost:3000/api/docs`

Credenciales demo (seed):

| Rol | Email | Password |
|---|---|---|
| Admin | `admin@rentacar.cl` | `Admin1234!` |
| Cliente | `demo@rentacar.cl` | `Demo1234!` |
| Proveedor | `proveedor@rentacar.cl` | `Proveedor1234!` |

## 2. Cliente

1. **Buscar vehiculos** en `/catalogo`; filtrar por fechas, comuna, tipo y precio.
2. **Guardar busqueda** con un nombre; verlas en `/busquedas`.
3. Marcar favoritos con el corazon; verlos en `/favoritos`.
4. Abrir un vehiculo, elegir fechas y **Continuar al checkout**.
5. Pagar con WebPay simulado.
6. En **Mis reservas** ver estado, pago, historial y cancelacion.
7. En **Mis alquileres** ver contrato, agregar conductor y reseñar al finalizar.
8. **Chat** con el proveedor desde la ficha o `/chat`.
9. **Disputas**: abrir una disputa sobre un arriendo finalizado.
10. **Notificaciones**: campana y `/notificaciones`.

## 3. Proveedor / operador

1. **Panel** `/panel`: metricas y actividad.
2. **Mis vehiculos**: crear/editar, fotos, tarifas, caracteristicas y documentos.
3. **Configuracion y sedes** en `/proveedor/panel`.
4. **Reservas** y **Arriendos**: iniciar arriendo, aceptar contrato, devolucion.
5. En el detalle del arriendo: subir **fotos de inspeccion**, registrar **cargos extra** y **multas**.
6. **Liquidaciones** en `/proveedor/liquidaciones`.
7. **Chat** y **Disputas**.

## 4. Administracion

1. **Proveedores**: aprobar pendientes.
2. **Catalogos** `/admin/catalogos`: crear/editar/desactivar catalogos de negocio.
3. **Disputas** `/admin/disputas`: tomar en revision y resolver.
4. **Liquidaciones** `/admin/liquidaciones`: generar, aprobar y pagar.
5. **Outbox** `/admin/outbox`: monitorear y reintentar eventos.
6. **Auditoria** `/admin/auditoria`: eventos del sistema.
7. **Reporte de ingresos** `/admin/reportes`.

## 5. Flujo recomendado de demo

1. `npm run seed`.
2. `npm run smoke:s3` para dejar un arriendo finalizado con cargos, multa y reseñas.
3. Cliente: favoritos, busqueda guardada, reserva/pago.
4. Proveedor: iniciar arriendo, fotos, devolucion, cargos/multas.
5. Cliente/proveedor: resenas y disputa.
6. Admin: resolver disputa, generar/aprobar/pagar liquidacion, revisar outbox.
7. Ver correos en Mailpit.

## 6. Problemas frecuentes

| Sintoma | Causa probable | Solucion |
|---|---|---|
| No aparecen vehiculos | sin seed o sin publicar | `npm run seed`, revisar `/proveedor/vehiculos` |
| No puedo reservar | fechas ocupadas o documento vencido | revisar disponibilidad |
| No puedo iniciar arriendo | sin licencia o reserva no confirmada | revisar estado y licencia |
| No llegan correos | worker outbox apagado | `OUTBOX_JOB_ENABLED=true` y revisar Mailpit |
| Error de catalogo | duplicado/nombre invalido | corregir nombre o usar otro |
