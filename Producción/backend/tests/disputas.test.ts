import request from 'supertest';
import { app } from '../src/app';
import { signToken } from '../src/utils/jwt';

const clienteToken = signToken({ sub: 2, email: 'demo@rentacar.cl', roles: ['CLIENTE'] });
const adminToken = signToken({ sub: 1, email: 'admin@rentacar.cl', roles: ['ADMIN'] });

describe('Disputas', () => {
  it('exige autenticacion para listar', async () => {
    const res = await request(app).get('/api/disputas');
    expect(res.status).toBe(401);
  });

  it('rechaza un estado invalido en el filtro', async () => {
    const res = await request(app)
      .get('/api/disputas?estado=OTRO')
      .set('Authorization', `Bearer ${clienteToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('exige autenticacion para crear', async () => {
    const res = await request(app).post('/api/disputas').send({});
    expect(res.status).toBe(401);
  });

  it('valida la descripcion y el tipo', async () => {
    const res = await request(app)
      .post('/api/disputas')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({ ID_arriendo: 1, tipo_disputa: 'OTRO_TIPO', descripcion: 'corta' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rechaza un id invalido en el detalle', async () => {
    const res = await request(app)
      .get('/api/disputas/abc')
      .set('Authorization', `Bearer ${clienteToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('PARAMETRO_INVALIDO');
  });

  it('solo ADMIN puede resolver', async () => {
    const res = await request(app)
      .post('/api/disputas/1/resolver')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({ estado: 'RESUELTA', resolucion: 'Resolucion de prueba' });
    expect(res.status).toBe(403);
  });

  it('valida la resolucion de un ADMIN', async () => {
    const res = await request(app)
      .post('/api/disputas/1/resolver')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ estado: 'RESUELTA', resolucion: 'corta' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
