export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'RentaCarDB API',
    version: '0.1.0',
    description:
      'API REST de RentaCarDB. Autenticacion con JWT (Bearer). Los errores usan el formato uniforme ' +
      '`{ error: { code, message, details } }`.',
  },
  servers: [{ url: '/api', description: 'API v1 (S0)' }],
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
  },
};
