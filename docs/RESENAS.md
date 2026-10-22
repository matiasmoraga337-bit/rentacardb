# Resenas (S3-E13)

Permite calificar un arriendo finalizado y mostrar las resenas del vehiculo en la
ficha publica.

## Reglas

- Solo se califica un arriendo en estado `FINALIZADO`.
- Una resena por arriendo, autor y tipo (`UQ_resena_autor_tipo`).
- Tipos:
  - `CLIENTE_A_VEHICULO`: cliente del arriendo.
  - `CLIENTE_A_PROVEEDOR`: cliente del arriendo.
  - `PROVEEDOR_A_CLIENTE`: usuario vinculado al proveedor del vehiculo.
- Calificacion entera de 1 a 5; comentario opcional de hasta 1000 caracteres.
- La ficha publica muestra solo resenas `CLIENTE_A_VEHICULO` activas.

## API

| Metodo | Ruta | Acceso | Descripcion |
|---|---|---|---|
| POST | `/api/resenas` | AUTH | Crea la resena usando `u_sp_CrearResena`. |
| GET | `/api/vehiculos/:id/resenas` | PUBLICO | `{total, promedio, resenas[]}` del vehiculo. |
| GET | `/api/proveedores/:id/resenas` | PUBLICO | `{total, promedio, resenas[]}` del proveedor. |

Body de creacion:

```json
{
  "ID_arriendo": 12,
  "tipo_resena": "CLIENTE_A_VEHICULO",
  "calificacion": 5,
  "comentario": "Excelente estado y atencion."
}
```

## UI

- `ArriendoDetallePage` muestra el formulario cuando el arriendo esta
  `FINALIZADO` y el usuario aun tiene tipos pendientes. Al enviar, invalida el
  detalle para reflejar la resena.
- `VehiculoPublicoPage` consulta `/vehiculos/:id/resenas` y
  `/proveedores/:id/resenas`, y muestra promedio, total y comentarios de ambos.

## Errores

| Codigo | HTTP | Caso |
|---|---|---|
| `CALIFICACION_INVALIDA` | 400 | Calificacion fuera de 1-5. |
| `TIPO_RESENA_INVALIDO` | 400 | Tipo no existe o inactivo. |
| `ARRIENDO_NO_FINALIZADO` | 409 | Arriendo inexistente o aun no finalizado. |
| `AUTOR_NO_CORRESPONDE` | 403 | El autor no es el cliente del arriendo. |
| `AUTOR_NO_VINCULADO` | 403 | El autor no pertenece al proveedor. |
| `RESENA_DUPLICADA` | 409 | Ya existe esa resena para el arriendo. |

## Pruebas

- API: `Producción/backend/tests/resenas.test.ts`.
- UI: `Producción/frontend/src/features/resenas/__tests__/ResenaForm.test.tsx`.
- Smoke: `npm run smoke:s3` (incluye resenas de cliente/proveedor y listado publico).
