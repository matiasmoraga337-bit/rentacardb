import request from 'supertest';
import { app } from '../src/app';
import { signToken } from '../src/utils/jwt';

const token = signToken({ sub: 5, email: 'veh@rentacar.cl', roles: ['PROVEEDOR'] });

describe('POST /api/vehiculos', () => {
  it('exige autenticacion', async () => {
    const res = await request(app).post('/api/vehiculos').send({});
    expect(res.status).toBe(401);
  });

  it('valida el VIN de 17 caracteres', async () => {
    const res = await request(app)
      .post('/api/vehiculos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ID_modelo: 1,
        ID_tipo_vehiculo: 1,
        ID_tipo_combustible: 1,
        ID_tipo_transmision: 1,
        patente: 'ABCD12',
        vin: 'corto',
        anio: 2020,
        kilometraje: 1000,
        precioDiarioBase: 20000,
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/vehiculos/:id', () => {
  it('rechaza un id invalido', async () => {
    const res = await request(app).get('/api/vehiculos/abc');
    expect(res.status).toBe(400);
  });
});
