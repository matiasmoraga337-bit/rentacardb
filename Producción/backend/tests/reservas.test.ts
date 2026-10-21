import request from 'supertest';
import { app } from '../src/app';
import { signToken } from '../src/utils/jwt';

const clienteToken = signToken({ sub: 2, email: 'demo@rentacar.cl', roles: ['CLIENTE'] });
const proveedorToken = signToken({ sub: 3, email: 'proveedor@rentacar.cl', roles: ['PROVEEDOR'] });

describe('POST /api/reservas', () => {
  it('exige autenticacion', async () => {
    const res = await request(app).post('/api/reservas').send({});
    expect(res.status).toBe(401);
  });

  it('valida el cuerpo de la reserva', async () => {
    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${clienteToken}`)
      .set('Idempotency-Key', 'test-key-123')
      .send({ ID_vehiculo: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rechaza una fecha de fin anterior al inicio', async () => {
    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${clienteToken}`)
      .set('Idempotency-Key', 'test-key-123')
      .send({
        ID_vehiculo: 1,
        ID_sede_retiro: 1,
        ID_sede_devolucion: 1,
        fecha_inicio: '2027-01-10',
        fecha_fin: '2027-01-05',
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/reservas', () => {
  it('exige autenticacion', async () => {
    const res = await request(app).get('/api/reservas');
    expect(res.status).toBe(401);
  });

  it('rechaza un id invalido antes de consultar la BD', async () => {
    const res = await request(app)
      .get('/api/reservas/abc')
      .set('Authorization', `Bearer ${clienteToken}`);
    expect(res.status).toBe(400);
  });
});

describe('Autorizacion de reservas', () => {
  it('un cliente no puede cambiar el estado de una reserva', async () => {
    const res = await request(app)
      .post('/api/reservas/1/estado')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({ estado: 'CANCELADA' });
    expect(res.status).toBe(403);
  });

  it('un proveedor no puede cancelar con el endpoint de cliente', async () => {
    const res = await request(app)
      .post('/api/reservas/1/cancelar')
      .set('Authorization', `Bearer ${proveedorToken}`)
      .send({ motivo: 'Prueba', solicitar_reembolso: false });
    expect(res.status).toBe(403);
  });
});
