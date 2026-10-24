import request from 'supertest';
import { app } from '../src/app';
import { signToken } from '../src/utils/jwt';

const clienteToken = signToken({ sub: 2, email: 'demo@rentacar.cl', roles: ['CLIENTE'] });

const adminRoutes = [
  '/api/admin/vehiculos-publicados',
  '/api/admin/pagos-pendientes',
  '/api/admin/documentos-vencidos',
  '/api/reportes/liquidaciones',
  '/api/reportes/proveedores',
  '/api/reportes/tipos-proveedor',
  '/api/reportes/integridad',
];

describe('Objetos SQL integrados', () => {
  it.each(adminRoutes)('%s exige autenticacion', async (path) => {
    const res = await request(app).get(path);
    expect(res.status).toBe(401);
  });

  it.each(adminRoutes)('%s solo permite ADMIN', async (path) => {
    const res = await request(app)
      .get(path)
      .set('Authorization', `Bearer ${clienteToken}`);
    expect(res.status).toBe(403);
  });

  it('documentos vencidos de proveedor exige autenticacion', async () => {
    const res = await request(app).get('/api/proveedores/documentos-vencidos');
    expect(res.status).toBe(401);
  });
});
