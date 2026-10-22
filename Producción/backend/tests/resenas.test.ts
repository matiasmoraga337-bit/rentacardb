import request from 'supertest';
import { app } from '../src/app';
import { signToken } from '../src/utils/jwt';

const clienteToken = signToken({ sub: 2, email: 'demo@rentacar.cl', roles: ['CLIENTE'] });

describe('POST /api/resenas', () => {
  it('exige autenticacion', async () => {
    const res = await request(app).post('/api/resenas').send({});
    expect(res.status).toBe(401);
  });

  it('valida una calificacion entre 1 y 5', async () => {
    const res = await request(app)
      .post('/api/resenas')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({
        ID_arriendo: 1,
        tipo_resena: 'CLIENTE_A_VEHICULO',
        calificacion: 6,
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('valida el tipo de resena', async () => {
    const res = await request(app)
      .post('/api/resenas')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({
        ID_arriendo: 1,
        tipo_resena: 'OTRO',
        calificacion: 4,
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('limita el comentario a 1000 caracteres', async () => {
    const res = await request(app)
      .post('/api/resenas')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({
        ID_arriendo: 1,
        tipo_resena: 'CLIENTE_A_VEHICULO',
        calificacion: 4,
        comentario: 'x'.repeat(1001),
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/vehiculos/:id/resenas', () => {
  it('es publico y rechaza un id invalido', async () => {
    const res = await request(app).get('/api/vehiculos/abc/resenas');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('PARAMETRO_INVALIDO');
  });
});

describe('GET /api/proveedores/:id/resenas', () => {
  it('es publico y rechaza un id invalido', async () => {
    const res = await request(app).get('/api/proveedores/abc/resenas');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('PARAMETRO_INVALIDO');
  });
});
