# Cuentas y datos de prueba

Datos extendidos para QA manual, demos y pruebas de flotas.

## Preparación

```powershell
cd Producción/backend
npm run seed
npm run seed:qa
npm run seed:fotos
npm run smoke:qa
```

`seed:qa` es idempotente y separado de `seed` para no alterar la suite E2E de CI.

## Cuentas

| Cuenta | Contraseña | Rol | Proveedor | Flota |
|---|---|---|---|---|
| `admin@rentacar.cl` | `Admin1234!` | ADMIN | — | — |
| `demo@rentacar.cl` | `Demo1234!` | CLIENTE | — | — |
| `cliente2@rentacar.cl` | `Cliente1234!` | CLIENTE | — | — |
| `proveedor@rentacar.cl` | `Proveedor1234!` | PROVEEDOR | AutoDemo | 2 vehículos |
| `flota@rentacar.cl` | `Flota1234!` | PROVEEDOR | Flota Chile | 16 vehículos |
| `unico@rentacar.cl` | `Unico1234!` | PROVEEDOR | Renta Natales | 1 vehículo |

## Proveedor Flota Chile

| Región | Comuna | Patente | Vehículo |
|---|---|---|---|
| Arica y Parinacota | Arica | FLAA01 | Toyota Yaris |
| Tarapacá | Iquique | FLAA02 | Nissan Versa |
| Antofagasta | Antofagasta | FLAA03 | Mazda CX-5 |
| Atacama | Copiapó | FLAA04 | Chevrolet Sail |
| Coquimbo | La Serena | FLAA05 | Hyundai Accent |
| Valparaíso | Viña del Mar | FLAA06 | Kia Sportage |
| Metropolitana | Santiago | FLAA07 | Toyota Prius |
| O’Higgins | Rancagua | FLAA08 | Suzuki Swift |
| Maule | Talca | FLAA09 | Peugeot 208 |
| Ñuble | Chillán | FLAA10 | Renault Duster |
| Biobío | Concepción | FLAA11 | Ford Ranger |
| La Araucanía | Temuco | FLAA12 | Volkswagen T-Cross |
| Los Ríos | Valdivia | FLAA13 | Honda CR-V |
| Los Lagos | Puerto Montt | FLAA14 | Mitsubishi L200 |
| Aysén | Coihaique | FLAA15 | Subaru Forester |
| Magallanes | Punta Arenas | FLAA16 | Toyota Hilux |

Cada vehículo tiene sede local, tarifa, documentos vigentes, publicación y una foto real.

## Proveedor Renta Natales

- Cuenta: `unico@rentacar.cl` / `Unico1234!`
- Sede: Natales, provincia Última Esperanza, Magallanes.
- Vehículo: Suzuki Jimny, patente `UNAA01`.
- Ideal para probar un proveedor pequeño frente a una flota grande.

## Segundo cliente

`cliente2@rentacar.cl` permite probar:

- reservas entre usuarios distintos;
- autorizaciones y propietario de reserva;
- chat y reseñas con otra cuenta;
- que un cliente no vea recursos de otro.

## Qué probar

### Admin

- Proveedores: AutoDemo, Flota Chile y Renta Natales.
- Reportes, integridad, outbox y auditoría.
- Vehículos publicados y pagos pendientes.

### Cliente

- Catálogo con vehículos en 16 regiones.
- Filtro regional y por comuna.
- Reserva, pago, favoritos, chat y reseña.
- Licencia y perfil.

### Proveedor con flota

- `/proveedor/vehiculos`: 16 vehículos.
- Vehículos en distintas regiones.
- Fotos, tarifas y documentos.
- Mantenimiento y documentos por vencer.

### Proveedor único

- `/proveedor/vehiculos`: 1 vehículo.
- Flota pequeña en Natales.
- Reservas y arriendos de esa sede.

## Fixtures de UI

Estos modos se mantienen para QA y **no aparecen en producción**:

- `/catalogo?data=worst`
- `/catalogo?data=empty`
- `/catalogo?data=one`
- `/catalogo?data=many` (1.000 filas)

No son datos reales: se usan para probar textos largos, estados vacíos y estrés de tarjetas.

## Verificación

```powershell
npm run smoke:qa
```

Comprueba login de las cuentas, los 3 proveedores, 16 vehículos de flota, 1 de Natales y 16 regiones en el catálogo.

## Fotos

Las imágenes están en `scripts/assets/vehiculos/qa/` y sus fuentes en
`scripts/assets/vehiculos/CREDITS.md`. Son fotos de stock Pexels usadas solo
para la demo.
