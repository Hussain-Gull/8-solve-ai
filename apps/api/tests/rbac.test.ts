import request from 'supertest';
import app from '../src/index';

describe('RBAC', () => {
  it('ADMIN cannot access tenants endpoints', async () => {
    const login = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@acme.com', password: 'Admin123!' });
    expect(login.status).toBe(200);
    const res = await request(app)
      .get('/tenants')
      .set('Authorization', `Bearer ${login.body.accessToken}`);
    expect(res.status).toBe(403);
  });
});


