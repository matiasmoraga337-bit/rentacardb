import request from 'supertest';
import { app } from '../src/app';

describe('GET /api/health', () => {
  it('responde 200 con el estado del servicio', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', service: 'rentacardb-api' });
    expect(['up', 'down']).toContain(res.body.db);
    expect(typeof res.body.timestamp).toBe('string');
  });
});

describe('ruta inexistente', () => {
  it('responde 404 con error uniforme', async () => {
    const res = await request(app).get('/api/no-existe');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
