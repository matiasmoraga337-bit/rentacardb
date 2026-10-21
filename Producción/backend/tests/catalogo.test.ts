import request from 'supertest';
import { app } from '../src/app';

describe('GET /api/catalogos/:tipo', () => {
  it('responde 404 para un catalogo inexistente', async () => {
    const res = await request(app).get('/api/catalogos/inexistente');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('CATALOGO_NO_ENCONTRADO');
  });
});

describe('GET /api/regiones/:id/provincias', () => {
  it('responde 400 con un id invalido', async () => {
    const res = await request(app).get('/api/regiones/abc/provincias');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('PARAMETRO_INVALIDO');
  });
});

describe('GET /api/comunas', () => {
  it('exige al menos 2 caracteres en q', async () => {
    const res = await request(app).get('/api/comunas?q=a');
    expect(res.status).toBe(400);
  });
});
