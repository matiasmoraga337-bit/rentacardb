# Break UI — Catálogo de vehículos

Ejecutado con la skill `break-ui` (commit `2d22863` de `emilkowalski/skills`).

## Cómo probarlo

- `npm run dev`
- `/catalogo?data=demo`
- `/catalogo?data=worst`
- `/catalogo?data=empty`
- `/catalogo?data=one`
- `/catalogo?data=many` (1.000 filas)

El toggle **Demo / Worst case / Empty / One / 1.000** solo aparece en desarrollo.
Los datos entran por el boundary del catálogo (`vehiculosFixture`), no editando CSS.

> Validado con capturas headless a 390 y 1440 px. Falta QA en dispositivo real,
> zoom 200% y navegación táctil.

## Part 1 — What broke

| # | Severidad | Campo | Worst-case | Qué pasa | Fix propuesto |
|---|---|---|---|---|---|
| 1 | Broken | `many` | 1.000 vehículos | Se renderizan 1.000 tarjetas sin paginar ni virtualizar. Scroll y DOM costoso. | Paginar/virtualizar o limitar el demo a 60; en producción mantener paginación. |
| 2 | Broken | `nombre_comercial_proveedor` | email de 78 caracteres sin espacios | En la tarjeta no hay `break-words`/`min-w-0`; puede desbordar a 320 px. | `min-w-0` + `overflow-wrap:anywhere`/`break-words` + truncado con detalle. |
| 3 | Ugly | `nombre_marca`/`nombre_modelo` | “Clase GLS 450 4MATIC AMG Line” / nombre de 74 caracteres | La tarjeta aumenta de alto y desalinea el grid; el favorito puede quedar sobre el texto. | `line-clamp-2` en modelo, `min-w-0`, favorito fuera del flujo del título. |
| 4 | Ugly | `precio_cotizado` | 12.345.678,9 | El precio grande + “/ dia” puede envolver en una tarjeta de 320 px. | `whitespace-nowrap`, tamaño responsivo y `min-w-0` en el contenedor. |
| 5 | Ugly | `nombre_comuna`/`nombre_region` | “San Pedro de la Paz · Biobío” | La línea usa `·` y no trunca; puede romper el ritmo de la tarjeta. | `truncate` con `title` o dos líneas controladas. |
| 6 | Fragile | `empty` | 0 resultados | Solo muestra “Sin resultados”, sin acción para limpiar filtros. | Estado vacío con “Limpiar filtros” y enlace a búsqueda amplia. |
| 7 | Fragile | Texto árabe / RTL | “تويوتا كامري” | Se renderiza, pero el layout no declara `dir` ni manejo RTL. | Si se soporta RTL, `dir="auto"` en nombre/modelo; si no, documentar alcance. |
| 8 | Fragile | `patente_vehiculo` | No se muestra en la tarjeta | El dato existe pero no se usa; el usuario no puede distinguir vehículos idénticos. | Mostrar patente en una línea secundaria o en el detalle. |

## Estado de correcciones

- Corregidos: #1 paginación server-side (12 por página), #2 proveedor largo,
  #3 modelo/marca, #4 precio, #5 comuna/región, #6 estado vacío con limpieza de
  filtros, #7 `dir="auto"` para texto RTL, #8 patente visible.
- El modo fixture `many` conserva paginación cliente sobre los 1.000 registros
  simulados.

## Part 2 — Decisions for you

1. **1.000 resultados:** resuelto paginando la API en páginas de 12; el modo
   `many` conserva el corte cliente solo como fixture de estrés.
2. **Proveedor largo:** ¿truncar en la tarjeta con `title` o mostrar dos líneas?
   - Recomendado: dos líneas máximo y nombre completo en el detalle.
3. **Modelo largo:** ¿`line-clamp-2` o altura fija de tarjeta?
   - Recomendado: `line-clamp-2`; la altura fija recorta nombres legítimos.
4. **Patente:** ¿mostrarla siempre en la tarjeta o solo en el detalle?
   - Recomendado: mostrarla en la tarjeta para desambiguar.
5. **RTL:** ¿soportarlo o declararlo fuera de alcance?
   - Recomendado: fuera de alcance para la demo; documentarlo.

## Part 3 — What held up

- Precio de $1 y precios con separador de miles se leen bien.
- Nombres de una letra (`Jo`) y proveedores cortos no rompen.
- Falta de comuna/sede muestra `Sin comuna` sin dejar un hueco raro.
- Texto con emoji se renderiza.
- El grid colapsa a una columna en móvil.
- Los estados `empty` y `one` no lanzan errores.

## Ubicación del toggle

`/catalogo?data=worst|empty|one|many` en desarrollo.
Componente: `src/features/vehiculos/__fixtures__/DataModeToggle.tsx`.
Fixture: `src/features/vehiculos/__fixtures__/worstCase.ts`.

Para aplicar correcciones: `fix all` o indicar los números.
