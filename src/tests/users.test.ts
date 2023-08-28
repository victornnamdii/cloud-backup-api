import chai, { expect } from 'chai';
import { before, after, describe, it } from 'mocha';
import dotenv from 'dotenv';
import chaiHttp from 'chai-http';
import { setTimeout } from 'node:timers/promises';
import db from '../config/db';
import app from '../server';
import { redisClient } from '../config/redis';
import hashPassword from '../utils/hashPassword';

dotenv.config();
chai.use(chaiHttp);

interface User {
  id: string
  email: string
  password: string
  first_name: string
  last_name: string
  is_superuser: boolean
  isVerified: boolean
}

interface emailverifications {
  user_id: string
  unique_string: string
  expires_at: Date
}

describe('User Tests', () => {
  before(async () => {
    await db<User>('users')
      .where({ email: process.env.TESTS_MAIL })
      .del();
    
    await db<User>('users')
      .where({ email: process.env.WRONG_TESTS_MAIL })
      .del();
  });
  after(async () => {
    await db<User>('users')
      .where({ email: process.env.TESTS_MAIL })
      .del();
    
    await db<User>('users')
      .where({ email: process.env.WRONG_TESTS_MAIL })
      .del();
  });
  describe('POST /signup', () => {
    after(async () => {
      await db<User>('users')
        .where({ email: process.env.TESTS_MAIL })
        .del();
    });
    it('should create a new user', async () => {
      let res = await chai.request(app).post('/signup').send({
        email: process.env.TESTS_MAIL,
        password: 'test123',
        firstName: 'Victor',
        lastName: 'Ilodiuba'
      });

      await setTimeout(3000);
      expect(res).to.have.status(201);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'message',
        'Sign up successful, Please check your mail inbox/junk for a verification mail.'
      );
      expect(res.body).to.have.property('email', process.env.TESTS_MAIL);

      res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123',
      });
      expect(res).to.have.status(401);
      expect(res.body).to.have.property(
        'error',
        'Please verify your email'
      );
    });

    it('should say email already taken', async () => {
      const res = await chai.request(app).post('/signup').send({
        email: process.env.TESTS_MAIL,
        password: 'test123',
        firstName: 'Victor',
        lastName: 'Ilodiuba'
      });

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('error', 'Email already taken');
    });

    it('should return email error', async () => {
      const res = await chai.request(app).post('/signup').send({
        email: undefined,
        password: 'test123',
        firstName: 'Victor',
        lastName: 'Ilodiuba'
      });

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('error', 'Please enter your email');
    });

    it('should return email error, alt', async () => {
      const res = await chai.request(app).post('/signup').send({
        email: null,
        password: 'test123',
        firstName: 'Victor',
        lastName: 'Ilodiuba'
      });

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('error', 'Please enter your email');
    });

    it('should return email error, alt 2', async () => {
      const res = await chai.request(app).post('/signup').send({
        email: true,
        password: 'test123',
        firstName: 'Victor',
        lastName: 'Ilodiuba'
      });

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('error', 'Please enter your email');
    });

    it('should return email error, alt 3', async () => {
      const res = await chai.request(app).post('/signup').send({
        email: 'invalidemail',
        password: 'test123',
        firstName: 'Victor',
        lastName: 'Ilodiuba'
      });

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('error', 'Please enter a valid email');
    });

    it('should return email error, alt 4', async () => {
      const res = await chai.request(app).post('/signup').send({
        email: '',
        password: 'test123',
        firstName: 'Victor',
        lastName: 'Ilodiuba'
      });

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('error', 'Please enter a valid email');
    });

    it('should return password error', async () => {
      const res = await chai.request(app).post('/signup').send({
        email: process.env.TESTS_MAIL,
        firstName: 'Victor',
        lastName: 'Ilodiuba'
      });

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('error', 'Please enter a password');
    });

    it('should return password error, alt', async () => {
      const res = await chai.request(app).post('/signup').send({
        email: process.env.TESTS_MAIL,
        password: undefined,
        firstName: 'Victor',
        lastName: 'Ilodiuba'
      });

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('error', 'Please enter a password');
    });

    it('should return password error, alt 2', async () => {
      const res = await chai.request(app).post('/signup').send({
        email: process.env.TESTS_MAIL,
        password: true,
        firstName: 'Victor',
        lastName: 'Ilodiuba'
      });

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('error', 'Please enter a password');
    });

    it('should return password error, alt 3', async () => {
      const res = await chai.request(app).post('/signup').send({
        email: process.env.TESTS_MAIL,
        password: 'short',
        firstName: 'Victor',
        lastName: 'Ilodiuba'
      });

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('error', 'Please enter a password of atleast six(6) characters');
    });

    it('should return first name error', async () => {
      const res = await chai.request(app).post('/signup').send({
        email: process.env.TESTS_MAIL,
        password: 'notshort',
        firstName: undefined,
        lastName: 'Ilodiuba'
      });

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('error', 'Please enter your first name');
    });

    it('should return first name error, alt ', async () => {
      const res = await chai.request(app).post('/signup').send({
        email: process.env.TESTS_MAIL,
        password: 'notshort',
        firstName: true,
        lastName: 'Ilodiuba'
      });

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('error', 'Please enter your first name');
    });

    it('should return first name error, alt 2', async () => {
      const res = await chai.request(app).post('/signup').send({
        email: process.env.TESTS_MAIL,
        password: 'notshort',
        lastName: 'Ilodiuba'
      });

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('error', 'Please enter your first name');
    });

    it('should return first name error, alt 3', async () => {
      const res = await chai.request(app).post('/signup').send({
        email: process.env.TESTS_MAIL,
        password: 'notshort',
        firstName: '',
        lastName: 'Ilodiuba'
      });

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('error', 'Please enter your first name');
    });

    it('should return last name error', async () => {
      const res = await chai.request(app).post('/signup').send({
        email: process.env.TESTS_MAIL,
        password: 'notshort',
        firstName: 'true',
        lastName: undefined
      });

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('error', 'Please enter your last name');
    });

    it('should return last name error, alt', async () => {
      const res = await chai.request(app).post('/signup').send({
        email: process.env.TESTS_MAIL,
        password: 'notshort',
        firstName: 'true',
        lastName: true
      });

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('error', 'Please enter your last name');
    });

    it('should return last name error, alt 2', async () => {
      const res = await chai.request(app).post('/signup').send({
        email: process.env.TESTS_MAIL,
        password: 'notshort',
        firstName: 'true',
        lastName: ''
      });

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('error', 'Please enter your last name');
    });

    it('should return last name error, alt 3', async () => {
      const res = await chai.request(app).post('/signup').send({
        email: process.env.TESTS_MAIL,
        password: 'notshort',
        firstName: 'true'
      });

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('error', 'Please enter your last name');
    });
  });

  describe('POST /admin/create', () => {
    after(async () => {
      await db<User>('users')
        .where({ email: process.env.TESTS_MAIL })
        .del();
    });
    it('should create a new admin', async () => {
      await db<User>('users')
        .where({ email: process.env.TESTS_MAIL })
        .del();
      let res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res.body).to.have.property('token');
      const adminToken = res.body.token;
      res = await chai.request(app).post('/admin/create').send({
        email: process.env.TESTS_MAIL,
        firstName: 'Victor',
        lastName: 'Ilodiuba'
      }).set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.have.status(201);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('message', 'Admin successfully created');
      expect(res.body).to.have.property('email', process.env.TESTS_MAIL);
      expect(res.body).to.have.property('password');

      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
      await db<User>('users')
        .where({ email: process.env.TESTS_MAIL })
        .del();
    });

    it('should create a new admin, alt', async () => {
      await db<User>('users')
        .where({ email: process.env.TESTS_MAIL })
        .del();
      let res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res.body).to.have.property('token');
      const adminToken = res.body.token;
      res = await chai.request(app).post(`/admin/create?token=${adminToken}`).send({
        email: process.env.TESTS_MAIL,
        firstName: 'Victor',
        lastName: 'Ilodiuba'
      });

      expect(res).to.have.status(201);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('message', 'Admin successfully created');
      expect(res.body).to.have.property('email', process.env.TESTS_MAIL);
      expect(res.body).to.have.property('password');

      const adminPassword = res.body.password;

      res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: adminPassword
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say email already taken', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res.body).to.have.property('token');
      const adminToken = res.body.token;
      res = await chai.request(app).post('/admin/create').send({
        email: process.env.TESTS_MAIL,
        firstName: 'Victor',
        lastName: 'Ilodiuba'
      }).set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('error', 'Email already taken');

      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
    });

    it('should say unauthorized', async () => {
      await db<User>('users')
        .where({ email: process.env.TESTS_MAIL })
        .del();
      let res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res.body).to.have.property('token');
      const adminToken = res.body.token;
      res = await chai.request(app).post('/admin/create').send({
        email: process.env.TESTS_MAIL,
        firstName: 'Victor',
        lastName: 'Ilodiuba'
      }).set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.have.status(201);
      const adminPassword = res.body.password;

      res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: adminPassword
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app).post('/admin/create').send({
        email: process.env.TESTS_MAIL,
        firstName: 'Victor',
        lastName: 'Ilodiuba'
      }).set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(401);
      expect(res.body).to.have.property('error', 'Unauthorized');

      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say unauthorized, alt', async () => {
      await db<User>('users')
        .where({ email: process.env.TESTS_MAIL })
        .del();

      await db<User>('users')
        .insert({
          email: process.env.TESTS_MAIL,
          password: await hashPassword('test123'),
          first_name: 'Victor',
          last_name: 'Ilodiuba',
          isVerified: true
        });

      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app).post('/admin/create').send({
        email: process.env.TESTS_MAIL,
        firstName: 'Victor',
        lastName: 'Ilodiuba'
      }).set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(401);
      expect(res.body).to.have.property('error', 'Unauthorized');

      await redisClient.del(`auth_${decodeURIComponent(token)}`);
      await db<User>('users')
        .where({ email: process.env.TESTS_MAIL })
        .del();
    });

    it('should say unauthorized, alt 2', async () => {
      const res = await chai.request(app).post('/admin/create').send({
        email: process.env.TESTS_MAIL,
        firstName: 'Victor',
        lastName: 'Ilodiuba'
      });

      expect(res).to.have.status(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });

    it('should return email error', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res.body).to.have.property('token');
      const adminToken = res.body.token;
      res = await chai.request(app).post('/admin/create').send({
        email: undefined,
        firstName: 'Victor',
        lastName: 'Ilodiuba'
      }).set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'error',
        'Please enter an email'
      );

      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
    });

    it('should return email error, alt', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res.body).to.have.property('token');
      const adminToken = res.body.token;
      res = await chai.request(app).post('/admin/create').send({
        email: true,
        firstName: 'Victor',
        lastName: 'Ilodiuba'
      }).set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'error',
        'Please enter an email'
      );

      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
    });

    it('should return email error, alt 2', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res.body).to.have.property('token');
      const adminToken = res.body.token;
      res = await chai.request(app).post('/admin/create').send({
        firstName: 'Victor',
        lastName: 'Ilodiuba'
      }).set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'error',
        'Please enter an email'
      );

      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
    });

    it('should return email error, alt 3', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res.body).to.have.property('token');
      const adminToken = res.body.token;
      res = await chai.request(app).post('/admin/create').send({
        email: '',
        firstName: 'Victor',
        lastName: 'Ilodiuba'
      }).set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'error',
        'Please enter a valid email'
      );

      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
    });

    it('should return email error, alt 4', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res.body).to.have.property('token');
      const adminToken = res.body.token;
      res = await chai.request(app).post('/admin/create').send({
        email: 'invalidemail',
        firstName: 'Victor',
        lastName: 'Ilodiuba'
      }).set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'error',
        'Please enter a valid email'
      );

      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
    });

    it('should return first name error', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res.body).to.have.property('token');
      const adminToken = res.body.token;
      res = await chai.request(app).post('/admin/create').send({
        email: process.env.TESTS_MAIL,
        firstName: undefined,
        lastName: 'Ilodiuba'
      }).set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'error',
        'Please enter a first name'
      );

      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
    });

    it('should return first name error, alt', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res.body).to.have.property('token');
      const adminToken = res.body.token;
      res = await chai.request(app).post('/admin/create').send({
        email: process.env.TESTS_MAIL,
        firstName: true,
        lastName: 'Ilodiuba'
      }).set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'error',
        'Please enter a first name'
      );

      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
    });

    it('should return first name error, alt 2', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res.body).to.have.property('token');
      const adminToken = res.body.token;
      res = await chai.request(app).post('/admin/create').send({
        email: process.env.TESTS_MAIL,
        firstName: '',
        lastName: 'Ilodiuba'
      }).set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'error',
        'Please enter a first name'
      );

      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
    });

    it('should return last name error', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res.body).to.have.property('token');
      const adminToken = res.body.token;
      res = await chai.request(app).post('/admin/create').send({
        email: process.env.TESTS_MAIL,
        firstName: 'Victor',
        lastName: undefined
      }).set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'error',
        'Please enter a last name'
      );

      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
    });

    it('should return last name error, alt', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res.body).to.have.property('token');
      const adminToken = res.body.token;
      res = await chai.request(app).post('/admin/create').send({
        email: process.env.TESTS_MAIL,
        firstName: 'Victor',
        lastName: true
      }).set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'error',
        'Please enter a last name'
      );

      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
    });

    it('should return last name error, alt 2', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res.body).to.have.property('token');
      const adminToken = res.body.token;
      res = await chai.request(app).post('/admin/create').send({
        email: process.env.TESTS_MAIL,
        firstName: 'Victor',
        lastName: ''
      }).set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.have.status(400);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property(
        'error',
        'Please enter a last name'
      );

      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
    });
  });

  describe('GET /users/verify-email/:userId/:uniqueString', () => {
    it('should verify user\'s email', async () => {
      const user = await db<User>('users')
        .insert({
          email: process.env.TESTS_MAIL,
          password: await hashPassword('test123'),
          first_name: 'Victor',
          last_name: 'Ilodiuba',
          isVerified: false
        }, ['id']);
      const sixHours = new Date();
      sixHours.setHours(sixHours.getHours() + 6);
      await db<emailverifications>('emailverifications')
        .insert({
          user_id: user[0].id,
          unique_string: await hashPassword('wowthisisgreat'),
          expires_at: sixHours
        }, ['user_id']);
      const res = await chai.request(app).get(`/users/verify-email/${user[0].id}/wowthisisgreat`);
      expect(res).to.have.status(200);
      expect(res.body).to.have.property(
        'message',
        'You have been successfully verified'
      );
      await db<emailverifications>('emailverifications')
        .where({
          user_id: user[0].id
        })
        .del();
      await db<User>('users')
        .where({
          email: process.env.TESTS_MAIL,
        })
        .del();
    });

    it('should not verify user\'s email if expired', async () => {
      const user = await db<User>('users')
        .insert({
          email: process.env.TESTS_MAIL,
          password: await hashPassword('test123'),
          first_name: 'Victor',
          last_name: 'Ilodiuba',
          isVerified: false
        }, ['id']);
      const sixHours = new Date();
      sixHours.setHours(sixHours.getHours() - 6);
      await db<emailverifications>('emailverifications')
        .insert({
          user_id: user[0].id,
          unique_string: await hashPassword('wowthisisgreat'),
          expires_at: sixHours
        }, ['user_id']);
      const res = await chai.request(app).get(`/users/verify-email/${user[0].id}/wowthisisgreat`);
      expect(res).to.have.status(400);
      expect(res.body).to.have.property(
        'error',
        'Verification link has expired, Please sign up again.'
      );
      await db<emailverifications>('emailverifications')
        .where({
          user_id: user[0].id
        })
        .del();
      await db<User>('users')
        .where({
          email: process.env.TESTS_MAIL,
        })
        .del();
    });

    it('should not verify user\'s email if link is invalid', async () => {
      const user = await db<User>('users')
        .insert({
          email: process.env.TESTS_MAIL,
          password: await hashPassword('test123'),
          first_name: 'Victor',
          last_name: 'Ilodiuba',
          isVerified: false
        }, ['id']);
      const sixHours = new Date();
      sixHours.setHours(sixHours.getHours() + 6);
      await db<emailverifications>('emailverifications')
        .insert({
          user_id: user[0].id,
          unique_string: await hashPassword('wowthisisgreat'),
          expires_at: sixHours
        }, ['user_id']);
      const res = await chai.request(app).get(`/users/verify-email/${user[0].id}/wowthisisnotgreat`);
      expect(res).to.have.status(400);
      expect(res.body).to.have.property(
        'error',
        'Verification link is invalid'
      );
      await db<emailverifications>('emailverifications')
        .where({
          user_id: user[0].id
        })
        .del();
      await db<User>('users')
        .where({
          email: process.env.TESTS_MAIL,
        })
        .del();
    });
  });
});
