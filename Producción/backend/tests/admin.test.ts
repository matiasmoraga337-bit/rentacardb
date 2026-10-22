import request from 'supertest';
import { app } from '../src/app';
import { signToken } from '../src/utils/jwt';

const clienteToken = signToken({ sub: 2, email: 'demo@rentacar.cl', roles: ['CLIENTE'] });

describe('GET /api/admin/auditoria', () => {
  it('exige autenticacion', async () => {
    const res = await request(app).get('/api/admin/auditoria');
    expect(res.status).toBe(401);
  });

  it('solo permite ADMIN', async () => {
    const res = await request(app)
      .get('/api/admin/auditoria')
      .set('Authorization', `Bearer ${clienteToken}`);
    expect(res.status).toBe(403);
  });

});
