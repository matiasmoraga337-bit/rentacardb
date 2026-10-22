import request from 'supertest';
import { app } from '../src/app';
import { signToken } from '../src/utils/jwt';

const clienteToken = signToken({ sub: 2, email: 'demo@rentacar.cl', roles: ['CLIENTE'] });
const proveedorToken = signToken({ sub: 3, email: 'proveedor@rentacar.cl', roles: ['PROVEEDOR'] });

describe('GET /api/arriendos', () => {
  it('exige autenticacion', async () => {
    const res = await request(app).get('/api/arriendos');
    expect(res.status).toBe(401);
  });

  it('rechaza un id invalido', async () => {
    const res = await request(app)
      .get('/api/arriendos/abc')
      .set('Authorization', `Bearer ${clienteToken}`);
    expect(res.status).toBe(400);
  });
});

describe('POST /api/arriendos/iniciar', () => {
  it('exige autenticacion', async () => {
    const res = await request(app).post('/api/arriendos/iniciar').send({});
    expect(res.status).toBe(401);
  });

  it('no permite CLIENTE', async () => {
    const res = await request(app)
      .post('/api/arriendos/iniciar')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it('valida los datos iniciales', async () => {
    const res = await request(app)
      .post('/api/arriendos/iniciar')
      .set('Authorization', `Bearer ${proveedorToken}`)
      .send({ ID_reserva: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/arriendos/:id/devolucion', () => {
  it('no permite CLIENTE', async () => {
    const res = await request(app)
      .post('/api/arriendos/1/devolucion')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it('valida combustible y kilometraje', async () => {
    const res = await request(app)
      .post('/api/arriendos/1/devolucion')
      .set('Authorization', `Bearer ${proveedorToken}`)
      .send({ ID_sede_devolucion_real: 1, kilometraje_final: -1, combustible_final: 101 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('Conductores, contrato y danos', () => {
  it('un proveedor no puede agregar conductores', async () => {
    const res = await request(app)
      .post('/api/arriendos/1/conductores')
      .set('Authorization', `Bearer ${proveedorToken}`)
      .send({ rut: '44444444-4' });
    expect(res.status).toBe(403);
  });

  it('valida el RUT del conductor', async () => {
    const res = await request(app)
      .post('/api/arriendos/1/conductores')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({ rut: 'x' });
    expect(res.status).toBe(400);
  });

  it('exige aceptacion explicita del contrato', async () => {
    const res = await request(app)
      .post('/api/arriendos/1/contrato')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('un cliente no puede registrar danos', async () => {
    const res = await request(app)
      .post('/api/arriendos/1/inspecciones/1/danos')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({
        zona: 'PUERTA',
        tipo: 'RAYON',
        severidad: 'LEVE',
      });
    expect(res.status).toBe(403);
  });

  it('valida la severidad del dano', async () => {
    const res = await request(app)
      .post('/api/arriendos/1/inspecciones/1/danos')
      .set('Authorization', `Bearer ${proveedorToken}`)
      .send({
        zona: 'PUERTA',
        tipo: 'RAYON',
        severidad: 'EXTREMO',
      });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/arriendos/:id/contrato', () => {
  it('exige autenticacion', async () => {
    const res = await request(app).get('/api/arriendos/1/contrato');
    expect(res.status).toBe(401);
  });
});
