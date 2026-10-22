# Demo S3 — Arriendos e inspecciones (H3 parcial)

Guion reproducible de E9: retiro, contrato, conductor adicional, devolución y daños.

## 1. Prerrequisitos

- Stack Docker de S2 funcionando con la BD y el seed.
- `.env` raíz con `DB_PASSWORD` y `JWT_SECRET`.
- Recompilar y resembrar después de los cambios de S3:

```powershell
docker compose --env-file .env -p rentacardb-s2 -f "Producción/infra/docker-compose.yml" up -d --build
cd Producción/backend
$env:DOTENV_CONFIG_PATH=(Resolve-Path '../../.env').Path
$env:DB_HOST='localhost'
$env:DB_PORT='14330'
npm run seed
```

El seed crea:

- licencia vigente y verificada para `demo@rentacar.cl`;
- persona `44444444-4` (Conductor Demo Adicional) con licencia;
- vehículos con sede actual y sedes habilitadas;
- datos de proveedor y tarifas.

> No ejecutes el seed durante una demo con un arriendo `ACTIVO`: el seed restaura
> el estado del vehículo solo cuando no hay arriendos activos.

## 2. Flujo cliente → proveedor

1. Cliente `demo@rentacar.cl` crea una reserva en `/catalogo`.
2. En el checkout se muestra la política del servidor: **200 km incluidos por día** y **$100 por km excedido**. El cliente no puede editarla.
3. Pagar la reserva con WebPay simulado.
4. Proveedor `proveedor@rentacar.cl` abre **Reservas**, entra al detalle de la reserva `CONFIRMADA` y pulsa **Iniciar arriendo**.
5. En el formulario de inicio:
   - sede de retiro real: la sede actual del vehículo (viene preseleccionada);
   - kilometraje inicial: el del vehículo;
   - combustible inicial: 100.
6. El arriendo queda `ACTIVO` y el vehículo `ARRENDADO`.
7. Cliente entra a **Mis alquileres** → detalle:
   - agrega conductor adicional con RUT `44444444-4`;
   - acepta el contrato.
8. Proveedor registra la devolución:
   - sede de devolución;
   - km final (para demo, inicial + 900);
   - combustible final (ej. 80);
   - limpieza `BUENA`.
9. El sistema calcula el cargo por km excedido (200 km/día × 4 días, exceso de 100 km × $100 = $10.000).
10. Proveedor registra un daño sobre la inspección `DEVOLUCION`.
11. Cliente y proveedor ven el detalle final: inspecciones, daños, cargos y contrato.

## 3. Casos límite

| Caso | Resultado |
|---|---|
| Iniciar sin licencia vigente | `409 REQUISITO_NO_CUMPLIDO` |
| Iniciar reserva no confirmada | `409 RESERVA_NO_CONFIRMADA` |
| Iniciar en sede distinta a la actual sin entrega a domicilio | `400 SEDE_INVALIDA` |
| Devolver un arriendo ya finalizado | `409 ARRIENDO_NO_ACTIVO` |
| Km final menor al inicial | `400 KILOMETRAJE_INVALIDO` |
| Daño en inspección `ENTREGA` | `409 DANO_SOLO_DEVOLUCION` |
| Conductor con RUT inexistente | `404 PERSONA_NO_ENCONTRADA` |
| Contrato sin `aceptado: true` | `400 VALIDATION_ERROR` |

## 4. Smoke automático

Con la API y la BD levantadas:

```powershell
cd Producción/backend
$env:API_URL='http://localhost:3000/api'
npm run smoke:s3
```

El script hace login cliente/proveedor, crea reserva con política de km, paga, inicia arriendo, acepta contrato, agrega conductor, registra devolución, valida cargo por km y registra un daño. Termina con `SMOKE S3/E9 OK`.

## 5. Pendiente para cerrar H3

- Chat (E12).
- Reseñas visibles en el detalle público (E13).
- Paneles con widgets de alquileres (E14).
- Fotos de inspección y cargos extra manuales (S4).
