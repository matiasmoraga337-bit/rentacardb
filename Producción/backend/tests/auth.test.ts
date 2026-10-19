import request from 'supertest';
import { app } from '../src/app';

describe('POST /api/auth/login (validacion)', () => {
  it('rechaza un email invalido con 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'no-es-email', password: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('exige la contrasena', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo@rentacar.cl', password: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/auth/registro (validacion)', () => {
  it('rechaza contrasena corta con 400', async () => {
    const res = await request(app).post('/api/auth/registro').send({
      rut: '12345678-5',
      nombres: 'Test',
      apellidoPaterno: 'Demo',
      email: 'test@rentacar.cl',
      password: 'corta',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/auth/me (protegido)', () => {
  it('responde 401 sin token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});
