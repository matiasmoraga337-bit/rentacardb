export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'RentaCarDB API',
    version: '0.2.0',
    description:
      'API REST de RentaCarDB. Autenticacion con JWT (Bearer). Los errores usan el formato uniforme ' +
      '`{ error: { code, message, details } }`. Incluye reservas, pagos WebPay simulados y reembolsos (S2).',
  },
  servers: [{ url: '/api', description: 'API v1 (S2)' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Estado de la API y la base de datos',
        tags: ['Sistema'],
        responses: {
          '200': { description: 'Servicio operativo' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Iniciar sesion',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Token JWT y datos del usuario' },
          '401': { description: 'Credenciales invalidas' },
        },
      },
    },
    '/auth/registro': {
      post: {
        summary: 'Registrar un usuario (por defecto rol CLIENTE)',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['rut', 'nombres', 'apellidoPaterno', 'email', 'password'],
                properties: {
                  rut: { type: 'string' },
                  nombres: { type: 'string' },
                  apellidoPaterno: { type: 'string' },
                  apellidoMaterno: { type: 'string' },
                  telefono: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Usuario creado' },
          '409': { description: 'RUT o email ya registrado' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Datos del usuario autenticado',
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Perfil del usuario' },
          '401': { description: 'No autenticado' },
        },
      },
    },
    '/vehiculos/buscar': {
      get: {
        summary: 'Buscar vehiculos publicados y disponibles',
        tags: ['Vehiculos'],
        parameters: [
          { name: 'fecha_inicio', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'fecha_fin', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'ID_comuna', in: 'query', schema: { type: 'integer' } },
          { name: 'ID_tipo_vehiculo', in: 'query', schema: { type: 'integer' } },
          { name: 'precio_maximo', in: 'query', schema: { type: 'number' } },
        ],
        responses: { '200': { description: 'Listado de vehiculos' } },
      },
    },
    '/vehiculos/{id}/disponibilidad': {
      get: {
        summary: 'Disponibilidad y cotizacion por fechas',
        tags: ['Vehiculos'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'desde', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'hasta', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          '200': { description: 'Disponibilidad, precio y total estimado' },
          '400': { description: 'Fechas invalidas' },
          '404': { description: 'Vehiculo no encontrado' },
        },
      },
    },
    '/reservas': {
      get: {
        summary: 'Listar reservas segun el rol y el scope solicitado',
        tags: ['Reservas'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'scope', in: 'query', schema: { type: 'string', enum: ['cliente', 'proveedor', 'todos'] } },
          { name: 'estado', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'Reservas paginadas' }, '403': { description: 'Sin acceso' } },
      },
      post: {
        summary: 'Crear una reserva (CLIENTE)',
        tags: ['Reservas'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'Idempotency-Key', in: 'header', required: true, schema: { type: 'string', maxLength: 100 } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['ID_vehiculo', 'ID_sede_retiro', 'ID_sede_devolucion', 'fecha_inicio', 'fecha_fin'],
                properties: {
                  ID_vehiculo: { type: 'integer' },
                  ID_sede_retiro: { type: 'integer' },
                  ID_sede_devolucion: { type: 'integer' },
                  fecha_inicio: { type: 'string', format: 'date' },
                  fecha_fin: { type: 'string', format: 'date' },
                  observaciones: { type: 'string', maxLength: 500 },
                  politica_combustible: { type: 'string', enum: ['LLENO_LLENO', 'MISMO_NIVEL', 'LIBRE'] },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Reserva creada' },
          '409': { description: 'Solapamiento, bloqueo o documento invalido' },
        },
      },
    },
    '/reservas/{id}': {
      get: {
        summary: 'Detalle de una reserva (cliente dueno, proveedor o admin)',
        tags: ['Reservas'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Detalle de la reserva' }, '403': { description: 'Sin acceso' } },
      },
    },
    '/reservas/{id}/cancelacion': {
      get: {
        summary: 'Previsualizar politica y monto de reembolso',
        tags: ['Reservas'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Prevision de cancelacion' } },
      },
    },
    '/reservas/{id}/cancelar': {
      post: {
        summary: 'Cancelar una reserva y registrar reembolso si corresponde (CLIENTE)',
        tags: ['Reservas'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'Idempotency-Key', in: 'header', schema: { type: 'string', maxLength: 100 } },
        ],
        responses: {
          '200': { description: 'Reserva cancelada' },
          '409': { description: 'Estado no cancelable o reembolso invalido' },
        },
      },
    },
    '/reservas/{id}/historial': {
      get: {
        summary: 'Historial de estados de la reserva',
        tags: ['Reservas'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Historial' } },
      },
    },
    '/reservas/{id}/snapshot': {
      get: {
        summary: 'Snapshots comerciales de la reserva',
        tags: ['Reservas'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Snapshots' } },
      },
    },
    '/reservas/{id}/estado': {
      post: {
        summary: 'Cambiar estado de una reserva (ADMIN)',
        tags: ['Reservas'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['estado'],
                properties: {
                  estado: { type: 'string', enum: ['CONFIRMADA', 'CANCELADA', 'EXPIRADA'] },
                  motivo: { type: 'string', maxLength: 500 },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Reserva actualizada' }, '409': { description: 'Transicion no permitida' } },
      },
    },
    '/arriendos': {
      get: {
        summary: 'Listar arriendos segun rol y scope',
        tags: ['Arriendos'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'scope', in: 'query', schema: { type: 'string', enum: ['cliente', 'proveedor', 'todos'] } },
          { name: 'estado', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'Arriendos paginados' } },
      },
    },
    '/arriendos/iniciar': {
      post: {
        summary: 'Iniciar arriendo desde una reserva confirmada',
        tags: ['Arriendos'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['ID_reserva', 'ID_sede_retiro_real', 'kilometraje_inicial', 'combustible_inicial'],
                properties: {
                  ID_reserva: { type: 'integer' },
                  ID_sede_retiro_real: { type: 'integer' },
                  kilometraje_inicial: { type: 'integer', minimum: 0 },
                  combustible_inicial: { type: 'number', minimum: 0, maximum: 100 },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Arriendo ACTIVO' }, '409': { description: 'Licencia o estado invalido' } },
      },
    },
    '/arriendos/{id}': {
      get: {
        summary: 'Detalle de arriendo con inspecciones, danos y cargos',
        tags: ['Arriendos'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Detalle del arriendo' } },
      },
    },
    '/arriendos/{id}/devolucion': {
      post: {
        summary: 'Registrar devolucion y finalizar arriendo',
        tags: ['Arriendos'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Arriendo FINALIZADO' }, '409': { description: 'Arriendo no activo' } },
      },
    },
    '/arriendos/{id}/inspecciones/{inspeccionId}/danos': {
      post: {
        summary: 'Registrar dano en una inspeccion de devolucion',
        tags: ['Arriendos'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'inspeccionId', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: { '201': { description: 'Dano registrado' }, '409': { description: 'Inspeccion no es de devolucion' } },
      },
    },
    '/arriendos/{id}/conductores': {
      post: {
        summary: 'Agregar conductor adicional por RUT (CLIENTE)',
        tags: ['Arriendos'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '201': { description: 'Conductor registrado' }, '404': { description: 'Persona no encontrada' } },
      },
    },
    '/arriendos/{id}/contrato': {
      get: {
        summary: 'Ver contrato generado y aceptacion vigente',
        tags: ['Arriendos'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Texto, hash y aceptacion' } },
      },
      post: {
        summary: 'Aceptar contrato de arriendo (CLIENTE)',
        tags: ['Arriendos'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '201': { description: 'Contrato aceptado' } },
      },
    },
    '/pagos': {
      get: {
        summary: 'Listar pagos de una reserva',
        tags: ['Pagos'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'reserva', in: 'query', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Pagos' } },
      },
      post: {
        summary: 'Registrar un pago manual (ADMIN)',
        tags: ['Pagos'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['ID_reserva', 'ID_tipo_operacion_pago', 'ID_metodo_pago', 'monto_pago', 'aprobado'],
                properties: {
                  ID_reserva: { type: 'integer' },
                  ID_tipo_operacion_pago: { type: 'integer' },
                  ID_metodo_pago: { type: 'integer' },
                  monto_pago: { type: 'number', exclusiveMinimum: 0 },
                  aprobado: { type: 'boolean' },
                  referencia: { type: 'string', maxLength: 100 },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Pago registrado' },
          '403': { description: 'Solo ADMIN' },
        },
      },
    },
    '/pagos/webpay/iniciar': {
      post: {
        summary: 'Iniciar una transaccion WebPay simulada (CLIENTE)',
        tags: ['Pagos'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['ID_reserva'],
                properties: { ID_reserva: { type: 'integer' } },
              },
            },
          },
        },
        responses: { '201': { description: 'token_ws y URL de redireccion' } },
      },
    },
    '/pagos/webpay/transaccion/{token}': {
      get: {
        summary: 'Consultar una transaccion WebPay simulada',
        tags: ['Pagos'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string', minLength: 64, maxLength: 64 } }],
        responses: { '200': { description: 'Transaccion' } },
      },
    },
    '/pagos/webpay/confirmar': {
      post: {
        summary: 'Confirmar o rechazar una transaccion WebPay simulada (CLIENTE)',
        tags: ['Pagos'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token_ws'],
                properties: {
                  token_ws: { type: 'string', minLength: 64, maxLength: 64 },
                  aprobada: { type: 'boolean', default: true },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Transaccion resuelta' },
          '409': { description: 'Transaccion ya resuelta o reserva no pendiente' },
        },
      },
    },
    '/reembolsos': {
      get: {
        summary: 'Listar reembolsos de una reserva',
        tags: ['Reembolsos'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'reserva', in: 'query', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Reembolsos' } },
      },
      post: {
        summary: 'Crear un reembolso manual (ADMIN)',
        tags: ['Reembolsos'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['ID_reserva', 'monto', 'motivo', 'idempotency_key'],
                properties: {
                  ID_reserva: { type: 'integer' },
                  monto: { type: 'number', exclusiveMinimum: 0 },
                  motivo: { type: 'string', maxLength: 500 },
                  idempotency_key: { type: 'string', maxLength: 100 },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Reembolso creado' },
          '403': { description: 'Solo ADMIN' },
        },
      },
    },
    '/reembolsos/{id}/completar': {
      post: {
        summary: 'Completar un reembolso pendiente (ADMIN)',
        tags: ['Reembolsos'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Reembolso completado' },
          '403': { description: 'Solo ADMIN' },
        },
      },
    },
    '/reportes/ingresos': {
      get: {
        summary: 'Reporte mensual de ingresos (ADMIN)',
        tags: ['Reportes'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'anio', in: 'query', required: true, schema: { type: 'integer' } },
          { name: 'ID_proveedor', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'Ingresos por mes' } },
      },
    },
    '/admin/reservas/expirar': {
      post: {
        summary: 'Ejecutar la expiracion manual de reservas (ADMIN)',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Proceso ejecutado' } },
      },
    },
  },
};
