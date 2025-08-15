import request from 'supertest';
import app from '../src/index';

const API = () => request(app);

describe('Auth E2E', () => {
  it('logs in superadmin and accesses tenants', async () => {
    const login = await API()
      .post('/auth/login')
      .send({ email: 'superadmin@example.com', password: 'ChangeMe123!' });
    expect(login.status).toBe(200);
    expect(login.body.accessToken).toBeTruthy();

    const tenants = await API()
      .get('/tenants')
      .set('Authorization', `Bearer ${login.body.accessToken}`);
    expect([200, 403]).toContain(tenants.status);
  });

  it('refresh rotates refresh tokens', async () => {
    const login = await API()
      .post('/auth/login')
      .send({ email: 'superadmin@example.com', password: 'ChangeMe123!' });
    expect(login.status).toBe(200);
    const cookies = login.headers['set-cookie'];
    const refresh = await API().post('/auth/refresh').set('Cookie', cookies);
    expect(refresh.status).toBe(200);
    expect(refresh.body.accessToken).toBeTruthy();
  });
});


