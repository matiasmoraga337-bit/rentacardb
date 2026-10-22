import request from 'supertest';
import { app } from '../src/app';
import { signToken } from '../src/utils/jwt';

const clienteToken = signToken({ sub: 2, email: 'demo@rentacar.cl', roles: ['CLIENTE'] });
const adminToken = signToken({ sub: 1, email: 'admin@rentacar.cl', roles: ['ADMIN'] });

describe('Admin catalogos', () => {
  it('exige autenticacion', async () => {
    const res = await request(app).get('/api/admin/catalogos/marcas');
    expect(res.status).toBe(401);
  });

  it('solo permite ADMIN', async () => {
    const res = await request(app)
      .get('/api/admin/catalogos/marcas')
      .set('Authorization', `Bearer ${clienteToken}`);
    expect(res.status).toBe(403);
  });

  it('rechaza un catalogo inexistente', async () => {
    const res = await request(app)
      .get('/api/admin/catalogos/no-existe')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('CATALOGO_NO_ENCONTRADO');
  });

  it('rechaza escribir un catalogo de solo lectura', async () => {
    const res = await request(app)
      .post('/api/admin/catalogos/estados-vehiculo')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'Nuevo estado' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CATALOGO_SOLO_LECTURA');
  });

  it('valida el cuerpo segun el catalogo', async () => {
    const res = await request(app)
      .post('/api/admin/catalogos/marcas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('valida el id al actualizar', async () => {
    const res = await request(app)
      .put('/api/admin/catalogos/marcas/abc')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'Marca' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('PARAMETRO_INVALIDO');
  });
});
