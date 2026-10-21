import request from 'supertest';
import { app } from '../src/app';
import { signToken } from '../src/utils/jwt';

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

describe('POST /api/auth/verificar-email', () => {
  it('rechaza un token con longitud invalida', async () => {
    const res = await request(app).post('/api/auth/verificar-email').send({ token: 'corto' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/recuperar', () => {
  it('rechaza un email invalido', async () => {
    const res = await request(app).post('/api/auth/recuperar').send({ email: 'no-es-email' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/recuperar/confirmar', () => {
  it('rechaza una contrasena corta', async () => {
    const res = await request(app)
      .post('/api/auth/recuperar/confirmar')
      .send({ token: 'a'.repeat(64), password: 'corta' });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/usuarios/perfil', () => {
  it('exige autenticacion', async () => {
    const res = await request(app).put('/api/usuarios/perfil').send({ nombres: 'X' });
    expect(res.status).toBe(401);
  });

  it('exige al menos un campo', async () => {
    const token = signToken({ sub: 1, email: 'test@rentacar.cl', roles: ['CLIENTE'] });
    const res = await request(app)
      .put('/api/usuarios/perfil')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/usuarios/:id/roles', () => {
  it('exige autenticacion', async () => {
    const res = await request(app).get('/api/usuarios/1/roles');
    expect(res.status).toBe(401);
  });
});
