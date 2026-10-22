import request from 'supertest';
import { app } from '../src/app';
import { signToken } from '../src/utils/jwt';

const clienteToken = signToken({ sub: 2, email: 'demo@rentacar.cl', roles: ['CLIENTE'] });
const proveedorToken = signToken({ sub: 3, email: 'proveedor@rentacar.cl', roles: ['PROVEEDOR'] });

describe('GET /api/conversaciones', () => {
  it('exige autenticacion', async () => {
    const res = await request(app).get('/api/conversaciones');
    expect(res.status).toBe(401);
  });

  it('rechaza un id invalido de mensajes', async () => {
    const res = await request(app)
      .get('/api/conversaciones/abc/mensajes')
      .set('Authorization', `Bearer ${clienteToken}`);
    expect(res.status).toBe(400);
  });
});

describe('POST /api/conversaciones', () => {
  it('exige autenticacion', async () => {
    const res = await request(app).post('/api/conversaciones').send({});
    expect(res.status).toBe(401);
  });

  it('solo permite CLIENTE', async () => {
    const res = await request(app)
      .post('/api/conversaciones')
      .set('Authorization', `Bearer ${proveedorToken}`)
      .send({ ID_proveedor: 1 });
    expect(res.status).toBe(403);
  });

  it('valida el proveedor', async () => {
    const res = await request(app)
      .post('/api/conversaciones')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/conversaciones/:id/mensajes', () => {
  it('rechaza un mensaje vacio', async () => {
    const res = await request(app)
      .post('/api/conversaciones/1/mensajes')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({ contenido: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('exige autenticacion', async () => {
    const res = await request(app).post('/api/conversaciones/1/mensajes').send({
      contenido: 'Hola',
    });
    expect(res.status).toBe(401);
  });
});

describe('Acciones de conversacion', () => {
  it('exige autenticacion para marcar leidos', async () => {
    const res = await request(app).post('/api/conversaciones/1/leidos');
    expect(res.status).toBe(401);
  });

  it('exige autenticacion para cerrar', async () => {
    const res = await request(app).post('/api/conversaciones/1/cerrar');
    expect(res.status).toBe(401);
  });
});
