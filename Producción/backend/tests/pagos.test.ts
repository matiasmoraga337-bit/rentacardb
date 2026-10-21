import request from 'supertest';
import { app } from '../src/app';
import { signToken } from '../src/utils/jwt';

const adminToken = signToken({ sub: 1, email: 'admin@rentacar.cl', roles: ['ADMIN'] });
const clienteToken = signToken({ sub: 2, email: 'demo@rentacar.cl', roles: ['CLIENTE'] });

describe('POST /api/pagos', () => {
  it('exige autenticacion', async () => {
    const res = await request(app).post('/api/pagos').send({});
    expect(res.status).toBe(401);
  });

  it('solo permite ADMIN', async () => {
    const res = await request(app)
      .post('/api/pagos')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({
        ID_reserva: 1,
        ID_tipo_operacion_pago: 1,
        ID_metodo_pago: 1,
        monto_pago: 1000,
        aprobado: true,
      });
    expect(res.status).toBe(403);
  });

  it('valida el monto para ADMIN', async () => {
    const res = await request(app)
      .post('/api/pagos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ID_reserva: 1,
        ID_tipo_operacion_pago: 1,
        ID_metodo_pago: 1,
        monto_pago: 0,
        aprobado: true,
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('WebPay', () => {
  it('exige autenticacion para iniciar', async () => {
    const res = await request(app).post('/api/pagos/webpay/iniciar').send({ ID_reserva: 1 });
    expect(res.status).toBe(401);
  });

  it('valida el ID de reserva al iniciar', async () => {
    const res = await request(app)
      .post('/api/pagos/webpay/iniciar')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({ ID_reserva: 0 });
    expect(res.status).toBe(400);
  });

  it('valida el token al confirmar', async () => {
    const res = await request(app)
      .post('/api/pagos/webpay/confirmar')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({ token_ws: 'corto', aprobada: true });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('Reembolsos y reportes', () => {
  it('un cliente puede consultar reembolsos de una reserva (validacion de query)', async () => {
    const res = await request(app)
      .get('/api/reembolsos')
      .set('Authorization', `Bearer ${clienteToken}`);
    expect(res.status).toBe(400);
  });

  it('el reporte de ingresos es solo ADMIN', async () => {
    const res = await request(app)
      .get('/api/reportes/ingresos?anio=2026')
      .set('Authorization', `Bearer ${clienteToken}`);
    expect(res.status).toBe(403);
  });
});
