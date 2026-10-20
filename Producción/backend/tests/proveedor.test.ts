import request from 'supertest';
import { app } from '../src/app';
import { signToken } from '../src/utils/jwt';

const token = signToken({ sub: 1, email: 'prov@rentacar.cl', roles: ['CLIENTE'] });

describe('POST /api/proveedores', () => {
  it('exige autenticacion', async () => {
    const res = await request(app).post('/api/proveedores').send({});
    expect(res.status).toBe(401);
  });

  it('exige razon social y rut para empresa', async () => {
    const res = await request(app)
      .post('/api/proveedores')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'EMPRESA', nombreComercial: 'Empresa X' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/proveedores', () => {
  it('exige autenticacion', async () => {
    const res = await request(app).get('/api/proveedores');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/proveedores/:id/sedes', () => {
  it('valida la comuna requerida', async () => {
    const res = await request(app)
      .post('/api/proveedores/1/sedes')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Sede', direccion: 'Calle 1' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
