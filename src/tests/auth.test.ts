import chai, { expect } from 'chai';
import { before, after, describe, it } from 'mocha';
import dotenv from 'dotenv';
import chaiHttp from 'chai-http';
import { v4 } from 'uuid';
import db from '../config/db';
import app from '../server';
import hashPassword from '../utils/hashPassword';
import { redisClient } from '../config/redis';

dotenv.config();
chai.use(chaiHttp);

interface User {
  id: string
  email: string
  password: string
  first_name: string
  last_name: string
  updated_at: Date
  token: string
  is_superuser: boolean
}

describe('Authentication Tests', () => {
  before(async () => {
    await db<User>('users')
      .where({ email: process.env.TESTS_MAIL })
      .del();

    await db<User>('users')
      .insert({
        email: process.env.TESTS_MAIL,
        password: await hashPassword('test123'),
        first_name: 'Victor',
        last_name: 'Ilodiuba'
      });
  });
  after(async () => {
    await db<User>('users')
      .where({ email: process.env.TESTS_MAIL })
      .del();
  });
  describe('POST /login', () => {
    it('should log user in', async () => {
      const res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'message',
        'Welcome Victor Ilodiuba'
      );
      expect(res.body).to.have.property('token');

      await redisClient.del(`auth_${decodeURIComponent(res.body.token)}`);
    });

    it('should not log user in', async () => {
      const res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'wrongpassword'
      });

      expect(res).to.have.status(401);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'error',
        'Incorrect email/password'
      );
      expect(res.body).to.not.have.property('token');
    });

    it('should not log user in, alt', async () => {
      const res = await chai.request(app).post('/login').send({
        email: process.env.WRONG_TESTS_MAIL,
        password: 'test123'
      });

      expect(res).to.have.status(401);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'error',
        'Incorrect email/password'
      );
      expect(res.body).to.not.have.property('token');
    });

    it('should log user in, alt', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'message',
        'Welcome Victor Ilodiuba'
      );
      expect(res.body).to.have.property('token');
      const token = res.body.token;

      res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      }).set('Authorization', `Bearer ${res.body.token}`);

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('token');
      const token2 = res.body.token;

      await redisClient.del(`auth_${decodeURIComponent(token)}`);
      await redisClient.del(`auth_${decodeURIComponent(token2)}`);
    });

    it('should log user in, alt 2', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'message',
        'Welcome Victor Ilodiuba'
      );
      expect(res.body).to.have.property('token');
      const token = res.body.token;

      res = await chai.request(app)
        .post(`/login?token=${res.body.token}`).send({
          email: process.env.TESTS_MAIL,
          password: 'test123'
        });

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('token');
      const token2 = res.body.token;

      await redisClient.del(`auth_${decodeURIComponent(token)}`);
      await redisClient.del(`auth_${decodeURIComponent(token2)}`);
    });

    it('should return no email error', async () => {
      const res = await chai.request(app).post('/login').send({
        password: 'test123'
      });

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'error',
        'Please enter your email'
      );
      expect(res.body).to.not.have.property('token');
    });

    it('should return empty email error', async () => {
      const res = await chai.request(app).post('/login').send({
        email: '',
        password: 'test123'
      });

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'error',
        'Please enter a valid email'
      );
      expect(res.body).to.not.have.property('token');
    });

    it('should return no email error, alt', async () => {
      const res = await chai.request(app).post('/login').send({
        email: null,
        password: 'test'
      });

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'error',
        'Please enter your email'
      );
      expect(res.body).to.not.have.property('token');
    });

    it('should return no email error, alt 2', async () => {
      const res = await chai.request(app).post('/login').send({
        email: undefined,
        password: 'test'
      });

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'error',
        'Please enter your email'
      );
      expect(res.body).to.not.have.property('token');
    });

    it('should return no email error, alt 3', async () => {
      const res = await chai.request(app).post('/login').send({
        email: true,
        password: 'test'
      });

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'error',
        'Please enter your email'
      );
      expect(res.body).to.not.have.property('token');
    });

    it('should return valid email error', async () => {
      const res = await chai.request(app).post('/login').send({
        email: 'invalidemail',
        password: 'test'
      });

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'error',
        'Please enter a valid email'
      );
      expect(res.body).to.not.have.property('token');
    });

    it('should return password error', async () => {
      const res = await chai.request(app).post('/login').send({
        email: 'invalidemail@gmail.com',
        password: undefined
      });

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'error',
        'Please enter a password'
      );
      expect(res.body).to.not.have.property('token');
    });

    it('should return password error, alt', async () => {
      const res = await chai.request(app).post('/login').send({
        email: 'invalidemail@gmail.com',
        password: null
      });

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'error',
        'Please enter a password'
      );
      expect(res.body).to.not.have.property('token');
    });

    it('should return password error, alt 2', async () => {
      const res = await chai.request(app).post('/login').send({
        email: 'invalidemail@gmail.com',
        password: true
      });

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'error',
        'Please enter a password'
      );
      expect(res.body).to.not.have.property('token');
    });

    it('should return password error, alt 3', async () => {
      const res = await chai.request(app).post('/login').send({
        email: 'invalidemail@gmail.com',
        password: false
      });

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'error',
        'Please enter a password'
      );
      expect(res.body).to.not.have.property('token');
    });
  });

  describe('GET /logout', () => {
    it('should log user out', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'message',
        'Welcome Victor Ilodiuba'
      );
      expect(res.body).to.have.property('token');
      const token = res.body.token;

      res = await chai.request(app).get('/logout')
        .set('Authorization', `Bearer ${res.body.token}`);

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'message',
        'Goodbye Victor Ilodiuba'
      );

      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should log user out, alt', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'message',
        'Welcome Victor Ilodiuba'
      );
      expect(res.body).to.have.property('token');
      const token = res.body.token;

      res = await chai.request(app)
        .get(`/logout?token=${res.body.token}`);

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'message',
        'Goodbye Victor Ilodiuba'
      );

      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say unauthorized', async () => {
      const res = await chai.request(app)
        .get('/logout?token=wrongtoken');

      expect(res).to.have.status(401);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      );
    });

    it('should say unauthorized, alt', async () => {
      const res = await chai.request(app)
        .get('/logout')
        .set('Authorization', 'wrongtoken');

      expect(res).to.have.status(401);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      );
    });

    it('should say unauthorized, alt 2', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'message',
        'Welcome Victor Ilodiuba'
      );
      expect(res.body).to.have.property('token');
      const token = res.body.token;
      await redisClient.del(`auth_${decodeURIComponent(token)}`);

      res = await chai.request(app).get('/logout')
        .set('Authorization', `Bearer ${res.body.token}`);

      expect(res).to.have.status(401);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      );
    });

    it('should say unauthorized, alt 3', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'message',
        'Welcome Victor Ilodiuba'
      );
      expect(res.body).to.have.property('token');
      const token = res.body.token;
      await redisClient.del(`auth_${decodeURIComponent(token)}`);

      res = await chai.request(app)
        .get(`/logout?token=${res.body.token}`);

      expect(res).to.have.status(401);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      );
    });
  });

  describe('DELETE /session/:userId', () => {
    it('should revoke user\'s session', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'message',
        'Welcome Victor Ilodiuba'
      );
      expect(res.body).to.have.property('token');
      const userToken = res.body.token;
      const userId = res.body.id;

      res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('token');
      const adminToken = res.body.token;

      res = await chai.request(app).delete(`/session/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'message',
        'Victor Ilodiuba\'s session revoked'
      );

      await redisClient.del(`auth_${decodeURIComponent(userToken)}`);
      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
    });

    it('should say unauthorized', async () => {
      await db<User>('users')
        .insert({
          email: 'lowadmin@gmail.com',
          password: await hashPassword('test123'),
          first_name: 'Victor',
          last_name: 'Ilodiuba',
          is_superuser: true
        });
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'message',
        'Welcome Victor Ilodiuba'
      );
      expect(res.body).to.have.property('token');
      const userToken = res.body.token;
      const userId = res.body.id;

      res = await chai.request(app).post('/login').send({
        email: 'lowadmin@gmail.com',
        password: 'test123'
      });

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('token');
      const adminToken = res.body.token;

      res = await chai.request(app).delete(`/session/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.have.status(401);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      );

      await redisClient.del(`auth_${decodeURIComponent(userToken)}`);
      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);

      await db<User>('users')
        .where({ email: 'lowadmin@gmail.com' })
        .del();
    });

    it('should revoke user\'s session, alt', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'message',
        'Welcome Victor Ilodiuba'
      );
      expect(res.body).to.have.property('token');
      const userToken = res.body.token;
      const userId = res.body.id;

      res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('token');
      const adminToken = res.body.token;

      res = await chai.request(app).delete(`/session/${userId}?token=${adminToken}`);

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'message',
        'Victor Ilodiuba\'s session revoked'
      );

      await redisClient.del(`auth_${decodeURIComponent(userToken)}`);
      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
    });

    it('should say unauthorized, alt', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'message',
        'Welcome Victor Ilodiuba'
      );
      expect(res.body).to.have.property('token');
      const userToken = res.body.token;
      const userId = res.body.id;

      res = await chai.request(app).delete(`/session/${userId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res).to.have.status(401);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      );

      await redisClient.del(`auth_${decodeURIComponent(userToken)}`);
    });

    it('should say unauthorized, alt 2', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'message',
        'Welcome Victor Ilodiuba'
      );
      expect(res.body).to.have.property('token');
      const userToken = res.body.token;
      const userId = res.body.id;

      res = await chai.request(app).delete(`/session/${userId}`);

      expect(res).to.have.status(401);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      );

      await redisClient.del(`auth_${decodeURIComponent(userToken)}`);
    });

    it('should say invalid id', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'message',
        'Welcome Victor Ilodiuba'
      );
      expect(res.body).to.have.property('token');
      const userToken = res.body.token;

      res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('token');
      const adminToken = res.body.token;

      res = await chai.request(app).delete('/session/invalidid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'error',
        'Invalid user id'
      );

      await redisClient.del(`auth_${decodeURIComponent(userToken)}`);
      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
    });

    it('should say no user found', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'message',
        'Welcome Victor Ilodiuba'
      );
      expect(res.body).to.have.property('token');
      const userToken = res.body.token;

      res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('token');
      const adminToken = res.body.token;

      const users = await db<User>('users')
        .select('id');

      const ids: string[] = [];
      users.forEach((user) => {
        ids.push(user.id);
      });

      const wronguuid = (): string | undefined => {
        const uuid = v4();
        if (ids.includes(uuid)) {
          wronguuid();
        } else {
          return uuid;
        }
      };

      res = await chai.request(app).delete(`/session/${wronguuid()}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.have.status(404);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'error',
        'No user with specified id'
      );

      await redisClient.del(`auth_${decodeURIComponent(userToken)}`);
      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
    });
  });
});
