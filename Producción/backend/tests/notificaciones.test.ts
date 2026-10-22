import request from 'supertest';
import { app } from '../src/app';
import { signToken } from '../src/utils/jwt';

const clienteToken = signToken({ sub: 2, email: 'demo@rentacar.cl', roles: ['CLIENTE'] });

describe('Notificaciones', () => {
  it('exige autenticacion para listar', async () => {
    const res = await request(app).get('/api/notificaciones');
    expect(res.status).toBe(401);
  });

  it('rechaza un estado invalido', async () => {
    const res = await request(app)
      .get('/api/notificaciones?estado=OTRO')
      .set('Authorization', `Bearer ${clienteToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('exige autenticacion para el contador', async () => {
    const res = await request(app).get('/api/notificaciones/no-leidas');
    expect(res.status).toBe(401);
  });

  it('exige autenticacion para marcar leida', async () => {
    const res = await request(app).post('/api/notificaciones/1/leer');
    expect(res.status).toBe(401);
  });

  it('rechaza un id invalido al marcar leida', async () => {
    const res = await request(app)
      .post('/api/notificaciones/abc/leer')
      .set('Authorization', `Bearer ${clienteToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('PARAMETRO_INVALIDO');
  });
});

describe('Outbox admin', () => {
  it('exige autenticacion', async () => {
    const res = await request(app).get('/api/admin/outbox');
    expect(res.status).toBe(401);
  });

  it('solo permite ADMIN', async () => {
    const res = await request(app)
      .get('/api/admin/outbox')
      .set('Authorization', `Bearer ${clienteToken}`);
    expect(res.status).toBe(403);
  });

  it('valida el id al reintentar', async () => {
    const res = await request(app)
      .post('/api/admin/outbox/abc/reintentar')
      .set('Authorization', `Bearer ${clienteToken}`);
    expect(res.status).toBe(403);
  });
});
