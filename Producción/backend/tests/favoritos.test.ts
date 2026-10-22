import request from 'supertest';
import { app } from '../src/app';
import { signToken } from '../src/utils/jwt';

const clienteToken = signToken({ sub: 2, email: 'demo@rentacar.cl', roles: ['CLIENTE'] });

describe('Favoritos', () => {
  it('exige autenticacion para listar', async () => {
    const res = await request(app).get('/api/favoritos');
    expect(res.status).toBe(401);
  });

  it('rechaza un id invalido', async () => {
    const res = await request(app)
      .post('/api/favoritos/abc')
      .set('Authorization', `Bearer ${clienteToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('PARAMETRO_INVALIDO');
  });
});

describe('Busquedas guardadas', () => {
  it('exige autenticacion para listar', async () => {
    const res = await request(app).get('/api/busquedas');
    expect(res.status).toBe(401);
  });

  it('valida el formato de fechas', async () => {
    const res = await request(app)
      .post('/api/busquedas')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({ fecha_desde: '2026-02-31' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('FECHAS_INVALIDAS');
  });

  it('rechaza un id invalido al eliminar', async () => {
    const res = await request(app)
      .delete('/api/busquedas/abc')
      .set('Authorization', `Bearer ${clienteToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('PARAMETRO_INVALIDO');
  });
});
