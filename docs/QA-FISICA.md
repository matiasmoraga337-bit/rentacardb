# QA física y preflight — RentaCarDB

Checklist para validar la aplicación en hardware real antes de la entrega.

> El preflight automatizado ya cubre 19 pruebas Playwright (desktop + móvil),
> axe y suite SQL. Esta checklist cubre lo que no puede validar un navegador
> headless: tacto, teclado real, lector de pantalla, cámara, archivos y
> comportamiento del sistema operativo.

## 1. Dispositivos mínimos

| Dispositivo | Navegador | Viewport esperado |
|---|---|---|
| Android gama media | Chrome | 360–412 px |
| iPhone | Safari | 375–430 px |
| Tablet Android/iPad | Chrome/Safari | 768–1024 px |
| Notebook | Chrome/Edge | 1366×768 |
| Desktop | Chrome/Edge | 1440×900 |

## 2. Preparación

```powershell
# Desde la raíz
docker compose --env-file .env -f Producción/infra/docker-compose.yml up -d
cd Producción/backend
npm run seed
npm run seed:fotos
```

Credenciales demo:

- Admin: `admin@rentacar.cl` / `Admin1234!`
- Cliente: `demo@rentacar.cl` / `Demo1234!`
- Proveedor: `proveedor@rentacar.cl` / `Proveedor1234!`

Antes de empezar, respaldar la BD y registrar la versión/release desplegada.

## 3. Bloque A — Catálogo público

- [ ] `/catalogo` carga en menos de 3 s en red móvil normal.
- [ ] No hay scroll horizontal en 360, 390, 768, 1024 y 1440 px.
- [ ] Filtros por fecha, comuna, región, tipo y precio funcionan con teclado y tacto.
- [ ] El selector de región filtra y limpia el filtro correctamente.
- [ ] El mapa aparece solo desde 1024 px y es clickeable.
- [ ] En mobile no se descarga `mapa-chile-regiones-horizontal.svg`.
- [ ] La paginación mantiene el total y no duplica tarjetas.
- [ ] Ficha `/catalogo/:id`: galería, miniaturas, flechas y teclado.
- [ ] Imágenes con `loading="lazy"` no dejan huecos ni saltos.
- [ ] Estado vacío permite limpiar filtros.
- [ ] Textos largos, RTL y emoji no rompen la tarjeta.

## 4. Bloque B — Cliente

- [ ] Login con email/contraseña y cierre de sesión.
- [ ] Recuperación y verificación de email con Mailpit.
- [ ] Perfil: editar datos y registrar licencia.
- [ ] La licencia vencida/duplicada muestra un error claro.
- [ ] Favoritos: agregar, quitar y toast.
- [ ] Búsqueda guardada: guardar, aplicar y eliminar.
- [ ] Reserva: fechas, sede, precio, IVA y depósito.
- [ ] Pago WebPay simulado: aprobar y rechazar.
- [ ] Cancelación: confirmar estado y reembolso.
- [ ] Reserva con depósito: verificar liberación al cancelar.
- [ ] Chat: enviar mensaje, adjunto y cierre.
- [ ] Reseña: estrellas, comentario y promedio en la ficha.
- [ ] En mobile, el menú lateral atrapa el foco y cierra con Escape.

## 5. Bloque C — Proveedor

- [ ] Panel: métricas, reservas y arriendos.
- [ ] Configuración de depósito y sedes.
- [ ] Alta/edición de vehículo y publicación.
- [ ] Fotos: subida, miniatura y visualización.
- [ ] Tarifas, características y documentos.
- [ ] Mantenimiento: iniciar, ver activo, finalizar y volver a disponible.
- [ ] Intento de mantenimiento en vehículo arrendado: error claro.
- [ ] Documentos por vencer: alerta y días restantes.
- [ ] Liquidaciones: consulta por período.
- [ ] Arriendos: inicio, inspección, devolución y daños.

## 6. Bloque D — Administración

- [ ] Proveedores: listado y aprobación.
- [ ] Reportes: ingresos, liquidaciones, proveedores, tipos e integridad.
- [ ] Integridad: “sin errores” o tabla de errores.
- [ ] Pagos pendientes y vehículos publicados en el panel.
- [ ] Catálogos: crear, editar y desactivar.
- [ ] Disputas, liquidaciones y auditoría.
- [ ] Outbox: estados, reintento y errores.

## 7. Accesibilidad manual

- [ ] Recorrer toda la app solo con `Tab` y `Shift+Tab`.
- [ ] El foco es visible en todos los controles.
- [ ] El skip link “Saltar al contenido” funciona.
- [ ] El drawer móvil no deja foco detrás y restaura el foco al cerrar.
- [ ] Leer catálogo, ficha, login y checkout con VoiceOver/TalkBack/NVDA.
- [ ] Zoom 200% sin pérdida de contenido ni scroll horizontal.
- [ ] `prefers-reduced-motion`: animaciones reducidas.
- [ ] Contraste de textos y estados en exteriores / brillo alto.

## 8. Rendimiento y red

- [ ] Catálogo móvil no descarga el SVG del mapa.
- [ ] El bundle inicial no bloquea la interacción.
- [ ] Imágenes de vehículos cargan de forma diferida.
- [ ] Navegación entre rutas no recarga la app.
- [ ] La app funciona con latencia alta y red lenta.

## 9. Registro de hallazgos

| ID | Severidad | Dispositivo | Ruta | Pasos | Esperado | Actual | Evidencia |
|---|---|---|---|---|---|---|---|
| QA-001 | Crítica/Alta/Media/Baja | | | | | | captura/video |

Cerrar un hallazgo solo cuando:

- se reproduzca en el dispositivo original;
- exista fix en `develop`;
- CI y E2E estén verdes;
- se adjunte evidencia antes/después.

## 10. Cierre

| Rol | Nombre | Fecha | Resultado |
|---|---|---|---|
| QA cliente | | | |
| QA proveedor | | | |
| QA admin | | | |
| Responsable release | | | |

**Criterio de salida:** cero hallazgos críticos/altos abiertos, flujos de reserva,
pago, arriendo, devolución y mantenimiento verificados en al menos Android e iOS.

## Preflight ya ejecutado

- Playwright: **20 tests** (15 desktop + 5 móvil).
- axe: catálogo, worst-case, login y ficha.
- SQL: **204 PASS**.
- Backend: **143 tests**.
- Frontend: **35 tests**.
- CI de `main`: PASS.

Estos resultados no reemplazan la QA física.
