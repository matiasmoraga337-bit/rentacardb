import request from 'supertest';
import { app } from '../src/app';
import { signToken } from '../src/utils/jwt';

const clienteToken = signToken({ sub: 2, email: 'demo@rentacar.cl', roles: ['CLIENTE'] });
const proveedorToken = signToken({ sub: 3, email: 'proveedor@rentacar.cl', roles: ['PROVEEDOR'] });
const adminToken = signToken({ sub: 1, email: 'admin@rentacar.cl', roles: ['ADMIN'] });

describe('Liquidaciones', () => {
  it('exige autenticacion para listar', async () => {
    const res = await request(app).get('/api/liquidaciones');
    expect(res.status).toBe(401);
  });

  it('un cliente no puede listar liquidaciones', async () => {
    const res = await request(app)
      .get('/api/liquidaciones')
      .set('Authorization', `Bearer ${clienteToken}`);
    expect(res.status).toBe(403);
  });

  it('solo ADMIN puede generar', async () => {
    const res = await request(app)
      .post('/api/liquidaciones')
      .set('Authorization', `Bearer ${proveedorToken}`)
      .send({ ID_proveedor: 1, periodo_inicio: '2026-01-01', periodo_fin: '2026-01-31' });
    expect(res.status).toBe(403);
  });

  it('valida las fechas del periodo', async () => {
    const res = await request(app)
      .post('/api/liquidaciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ID_proveedor: 1, periodo_inicio: '2026-02-31', periodo_fin: '2026-03-01' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('PERIODO_INVALIDO');
  });

  it('rechaza un estado invalido en el filtro', async () => {
    const res = await request(app)
      .get('/api/liquidaciones?estado=OTRO')
      .set('Authorization', `Bearer ${proveedorToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
