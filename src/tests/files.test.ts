import chai, { expect } from 'chai';
import { before, after, describe, it } from 'mocha';
import dotenv from 'dotenv';
import chaiHttp from 'chai-http';
import fs from 'fs';
import { v4 } from 'uuid';
import { parse } from 'node-html-parser';
import db from '../config/db';
import app from '../server';
import { redisClient } from '../config/redis';
import hashPassword from '../utils/hashPassword';
import { deleteObject } from '../middlewares/uploadMiddleware';

dotenv.config();
chai.use(chaiHttp);

interface File {
  id: string
  name: string
  displayName: string
  folder_id: string | null
  link: string
  s3_key: string
  user_id: string
  updated_at: Date
  mimetype: string
  history: string | Array<{ event: string, date: Date }>
  false_review_by: string | string[]
}

interface Folder {
  id: string
  name: string
  displayName: string
  user_id: string
  updated_at: Date
}

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

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const binaryParser = function (res: any, cb: any): void {
  res.setEncoding('binary');
  res.data = '';
  res.on('data', function (chunk: string) {
    res.data += chunk;
  });
  res.on('end', function () {
    cb(null, Buffer.from(res.data, 'binary'));
  });
};

describe('File and Folder Tests', () => {
  let id: string;
  let id2: string;
  before(async () => {
    const user = await db<User>('users')
      .insert({
        email: process.env.TESTS_MAIL,
        password: await hashPassword('test123'),
        first_name: 'Victor',
        last_name: 'Ilodiuba'
      }, ['id']);
    id = user[0].id;

    const folder = await db<Folder>('folders')
      .insert({
        name: 'testfolder',
        displayName: 'TestFolder',
        user_id: id
      }, ['id']);

    await db<File>('files')
      .insert({
        name: 'test2',
        displayName: 'Test',
        folder_id: null,
        link: 'https://risevest.com',
        s3_key: process.env.VALID_S3_KEY,
        user_id: id,
        mimetype: 'audio/mpeg',
        history: JSON.stringify([{ event: 'Created', date: new Date() }])
      });

    await db<File>('files')
      .insert({
        name: 'test',
        displayName: 'Test',
        folder_id: folder[0].id,
        link: 'https://risevest.com',
        s3_key: process.env.VALID_S3_KEY,
        user_id: id,
        mimetype: 'audio/mpeg',
        history: JSON.stringify([{ event: 'Created', date: new Date() }])
      });

    const user2 = await db<User>('users')
      .insert({
        email: process.env.WRONG_TESTS_MAIL,
        password: await hashPassword('test123'),
        first_name: 'Victor',
        last_name: 'Ilodiuba'
      }, ['id']);

    id2 = user2[0].id;
    await db<File>('files')
      .insert({
        name: 'test',
        displayName: 'Test',
        folder_id: null,
        link: 'https://risevest.com',
        s3_key: 'nosuchkey',
        user_id: user2[0].id,
        mimetype: 'image/jpeg',
        history: JSON.stringify([{ event: 'Created', date: new Date() }])
      });
  });
  after(async () => {
    await db<File>('files')
      .where({ user_id: id })
      .del();

    await db<File>('files')
      .where({ user_id: id2 })
      .del();

    await db<Folder>('folders')
      .where({ user_id: id })
      .del();

    await db<User>('users')
      .where({ email: process.env.TESTS_MAIL })
      .del();

    await db<User>('users')
      .where({ email: process.env.WRONG_TESTS_MAIL })
      .del();
  });
  describe('GET /files', () => {
    it('should get user files', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist;
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files;
      files.forEach((file) => {
        expect(file.file_id).to.exist;
        expect(file.file_name).to.exist;
        expect(typeof file.folder_name === 'string' ||
            file.folder_name === null
        ).to.equal(true);
        expect(file.file_history).to.exist;
        expect(file.file_history).to.be.an('array');
        file.file_history.forEach((event) => {
          expect(event.event).to.exist;
          expect(event.date).to.exist;
        });
      });
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should get user files, alt', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get(`/files?token=${token}`);
      expect(res).to.have.status(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist;
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files;
      files.forEach((file) => {
        expect(file.file_id).to.exist;
        expect(file.file_name).to.exist;
        expect(typeof file.folder_name === 'string' ||
              file.folder_name === null
        ).to.equal(true);
        expect(file.file_history).to.exist;
        expect(file.file_history).to.be.an('array');
        file.file_history.forEach((event) => {
          expect(event.event).to.exist;
          expect(event.date).to.exist;
        });
      });
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should get all files for admin', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist;
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
        file_user_id: string
      }> = res.body.files;
      files.forEach((file) => {
        expect(file.file_id).to.exist;
        expect(file.file_name).to.exist;
        expect(file.file_user_id).to.exist;
        expect(typeof file.folder_name === 'string' ||
              file.folder_name === null
        ).to.equal(true);
        expect(file.file_history).to.exist;
        expect(file.file_history).to.be.an('array');
        file.file_history.forEach((event) => {
          expect(event.event).to.exist;
          expect(event.date).to.exist;
        });
      });
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should get user files, alt', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get(`/files?token=${token}`);
      expect(res).to.have.status(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist;
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
        file_user_id: string
      }> = res.body.files;
      files.forEach((file) => {
        expect(file.file_id).to.exist;
        expect(file.file_name).to.exist;
        expect(file.file_user_id).to.exist;
        expect(typeof file.folder_name === 'string' ||
                file.folder_name === null
        ).to.equal(true);
        expect(file.file_history).to.exist;
        expect(file.file_history).to.be.an('array');
        file.file_history.forEach((event) => {
          expect(event.event).to.exist;
          expect(event.date).to.exist;
        });
      });
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say unauthorized', async () => {
      const res = await chai.request(app)
        .get('/files');
      expect(res).to.have.status(401);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.not.exist;
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      );
    });

    it('should say unauthorized, alt', async () => {
      const res = await chai.request(app)
        .get('/files')
        .set('Authorization', 'Bearer wrongtoken');
      expect(res).to.have.status(401);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.not.exist;
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      );
    });

    it('should say unauthorized, alt 2', async () => {
      const res = await chai.request(app)
        .get('/files?token=wrongtoken');
      expect(res).to.have.status(401);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.not.exist;
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      );
    });
  });

  describe('GET /files/download/:fileId', () => {
    it('should download file', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist;
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files;

      //   console.log(files)
      res = await chai.request(app)
        .get(`/files/download/${files[0].file_id}`)
        .set('Authorization', `Bearer ${token}`)
        .buffer()
        .parse(binaryParser);

      expect(res).to.have.status(200);
      expect(res.headers['transfer-encoding']).to.equal('chunked');
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should download file, alt', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get(`/files?token=${token}`);
      expect(res).to.have.status(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist;
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files;

      res = await chai.request(app)
        .get(`/files/download/${files[0].file_id}`)
        .set('Authorization', `Bearer ${token}`)
        .buffer()
        .parse(binaryParser);

      expect(res).to.have.status(200);
      expect(res.headers['transfer-encoding']).to.equal('chunked');
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should download file for admin', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist;
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files;

      res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res).to.have.status(200);
      const adminToken = res.body.token;

      res = await chai.request(app)
        .get(`/files/download/${files[0].file_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .buffer()
        .parse(binaryParser);

      expect(res).to.have.status(200);
      expect(res.headers['transfer-encoding']).to.equal('chunked');
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
    });

    it('should download file for admin, alt', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get(`/files?token=${token}`);
      expect(res).to.have.status(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist;
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files;

      res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res).to.have.status(200);
      const adminToken = res.body.token;

      res = await chai.request(app)
        .get(`/files/download/${files[0].file_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .buffer()
        .parse(binaryParser);

      expect(res).to.have.status(200);
      expect(res.headers['transfer-encoding']).to.equal('chunked');
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
    });

    it('should say invalid id', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get('/files/download/invalidid')
        .set('Authorization', `Bearer ${token}`)
        .buffer()
        .parse(binaryParser);

      expect(res).to.have.status(400);
      expect(res.header['content-type']
        .startsWith('application/json')).to.equal(true);
      const jsonString = res.body.toString();
      const json = JSON.parse(jsonString);
      expect(json).to.have.property('error', 'Invalid file id');
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say unauthorized', async () => {
      const uuid = v4();
      const res = await chai.request(app)
        .get(`/files/download/${uuid}`);
      expect(res).to.have.status(401);
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      );
    });

    it('should say unauthorized, alt', async () => {
      const res = await chai.request(app)
        .get('/files/download/fileid')
        .set('Authorization', 'Bearer wrongtoken');
      expect(res).to.have.status(401);
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      );
    });

    it('should say unauthorized, alt 2', async () => {
      const res = await chai.request(app)
        .get('/files/download/file?token=wrongtoken');
      expect(res).to.have.status(401);
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      );
    });

    it('should say file not found', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist;
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files;

      const ids: string[] = [];

      files.forEach((file) => {
        ids.push(file.file_id);
      });

      const wronguuid = (): string | undefined => {
        const uuid = v4();
        if (ids.includes(uuid)) {
          wronguuid();
        } else {
          return uuid;
        }
      };

      //   console.log(files)
      res = await chai.request(app)
        .get(`/files/download/${wronguuid()}`)
        .set('Authorization', `Bearer ${token}`)
        .buffer()
        .parse(binaryParser);

      expect(res).to.have.status(404);
      expect(res.header['content-type']
        .startsWith('application/json')).to.equal(true);
      const jsonString = res.body.toString();
      const json = JSON.parse(jsonString);
      expect(json).to.have.property('error', 'File not found. Please check file id in the URL.');
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say file not found in storage', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.WRONG_TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist;
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files;

      //   console.log(files)
      res = await chai.request(app)
        .get(`/files/download/${files[0].file_id}`)
        .set('Authorization', `Bearer ${token}`)
        .buffer()
        .parse(binaryParser);

      expect(res).to.have.status(404);
      expect(res.header['content-type']
        .startsWith('application/json')).to.equal(true);
      const jsonString = res.body.toString();
      const json = JSON.parse(jsonString);
      expect(json).to.have.property('error', 'File not found in storage');
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });
  });

  describe('GET /files/stream/:fileId', () => {
    it('should stream file', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist;
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files;

      //   console.log(files)
      res = await chai.request(app)
        .get(`/files/stream/${files[0].file_id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(200);
      const page = parse(res.text);
      const stream = page.querySelector('audio');
      expect(stream?.rawAttrs).to.exist;
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should stream file, alt', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist;
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files;

      //   console.log(files)
      res = await chai.request(app)
        .get(`/files/stream/${files[0].file_id}?token=${token}`);

      expect(res).to.have.status(200);
      const page = parse(res.text);
      const stream = page.querySelector('audio');
      expect(stream?.rawAttrs).to.exist;
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should stream file for admin', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist;
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files;

      res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res).to.have.status(200);
      const adminToken = res.body.token;

      //   console.log(files)
      res = await chai.request(app)
        .get(`/files/stream/${files[0].file_id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.have.status(200);
      const page = parse(res.text);
      const stream = page.querySelector('audio');
      expect(stream?.rawAttrs).to.exist;
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
    });

    it('should stream file for admin, alt', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist;
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files;

      res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res).to.have.status(200);
      const adminToken = res.body.token;

      //   console.log(files)
      res = await chai.request(app)
        .get(`/files/stream/${files[0].file_id}?token=${adminToken}`);

      expect(res).to.have.status(200);
      const page = parse(res.text);
      const stream = page.querySelector('audio');
      expect(stream?.rawAttrs).to.exist;
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
    });

    it('should say invalid id', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get('/files/stream/invalidid')
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('error', 'Invalid file id');
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say unauthorized', async () => {
      const uuid = v4();
      const res = await chai.request(app)
        .get(`/files/stream/${uuid}`);
      expect(res).to.have.status(401);
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      );
    });

    it('should say unauthorized, alt', async () => {
      const res = await chai.request(app)
        .get('/files/stream/fileid')
        .set('Authorization', 'Bearer wrongtoken');
      expect(res).to.have.status(401);
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      );
    });

    it('should say unauthorized, alt 2', async () => {
      const res = await chai.request(app)
        .get('/files/stream/file?token=wrongtoken');
      expect(res).to.have.status(401);
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      );
    });

    it('should say file not found', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist;
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files;

      const ids: string[] = [];

      files.forEach((file) => {
        ids.push(file.file_id);
      });

      const wronguuid = (): string | undefined => {
        const uuid = v4();
        if (ids.includes(uuid)) {
          wronguuid();
        } else {
          return uuid;
        }
      };

      //   console.log(files)
      res = await chai.request(app)
        .get(`/files/stream/${wronguuid()}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(404);
      expect(res.body).to.have.property('error', 'File not found. Please check file id in the URL.');
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say return file type error', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.WRONG_TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist;
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files;

      //   console.log(files)
      res = await chai.request(app)
        .get(`/files/stream/${files[0].file_id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(400);
      expect(res.body).to.have.property(
        'error',
        'File requested for is neither a video nor audio'
      );
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });
  });

  describe('POST /files', () => {
    it('should create a new file', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app).post('/files')
        .field('name', 'testfilesss')
        .attach('file', 'testfiles/t-rex-roar.mp3')
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property(
        'message',
        'File succesfully uploaded'
      );
      expect(res.body).to.have.property('id');
      expect(res.body).to.have.property('folderId', null);
      const file = await db<File>('files')
        .where({ id: res.body.id })
        .first('s3_key');
      await deleteObject({ key: file?.s3_key as string });
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should create a new file with token query', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app).post(`/files?token=${token}`)
        .field('name', 'testfiles2')
        .attach('file', 'testfiles/t-rex-roar.mp3');

      expect(res).to.have.status(201);
      expect(res.body).to.have.property(
        'message',
        'File succesfully uploaded'
      );
      expect(res.body).to.have.property('id');
      expect(res.body).to.have.property('folderId', null);
      const file = await db<File>('files')
        .where({ id: res.body.id })
        .first('s3_key');
      await deleteObject({ key: file?.s3_key as string });
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should create a new file without name field', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app).post('/files')
        .attach('file', 'testfiles/t-rex-roar.mp3')
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property(
        'message',
        'File succesfully uploaded'
      );
      expect(res.body).to.have.property('id');
      expect(res.body).to.have.property('folderId', null);
      const file = await db<File>('files')
        .where({ id: res.body.id })
        .first('s3_key');
      await deleteObject({ key: file?.s3_key as string });
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should create a new file with new folder name in query', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app).post('/files?folderName=newfolder')
        .field('name', 'testfilesss')
        .attach('file', 'testfiles/t-rex-roar.mp3')
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property(
        'message',
        'File succesfully uploaded'
      );
      expect(res.body).to.have.property('id');
      expect(res.body).to.have.property('folderId');
      expect(res.body.folderId !== null).to.equal(true);
      const file = await db<File>('files')
        .where({ id: res.body.id })
        .first('s3_key');
      await deleteObject({ key: file?.s3_key as string });
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should create a new file with already existing folder name in query', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app).post('/files?folderName=testfolder')
        .field('name', 'testfilesss')
        .attach('file', 'testfiles/t-rex-roar.mp3')
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property(
        'message',
        'File succesfully uploaded'
      );
      expect(res.body).to.have.property('id');
      expect(res.body).to.have.property('folderId');
      expect(res.body.folderId !== null).to.equal(true);
      const file = await db<File>('files')
        .where({ id: res.body.id })
        .first('s3_key');
      await deleteObject({ key: file?.s3_key as string });
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should create a new file with already existing folder name and token in query', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app).post(`/files?folderName=testfolder&token=${token}`)
        .field('name', 'testfilesss2')
        .attach('file', 'testfiles/t-rex-roar.mp3');

      expect(res).to.have.status(201);
      expect(res.body).to.have.property(
        'message',
        'File succesfully uploaded'
      );
      expect(res.body).to.have.property('id');
      expect(res.body).to.have.property('folderId');
      expect(res.body.folderId !== null).to.equal(true);
      const file = await db<File>('files')
        .where({ id: res.body.id })
        .first('s3_key');
      await deleteObject({ key: file?.s3_key as string });
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say file aready exists', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app).post('/files')
        .field('name', 'testfilesss')
        .attach('file', 'testfiles/t-rex-roar.mp3')
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(400);
      expect(res.body).to.have.property(
        'error',
        'testfilesss already exists'
      );
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say file aready exists without name field', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app).post('/files')
      //   .field('name', 'testfilesss')
        .attach('file', 'testfiles/t-rex-roar.mp3')
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(400);
      expect(res.body).to.have.property(
        'error',
        't-rex-roar.mp3 already exists'
      );
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    if (fs.existsSync('testfiles/largefile')) {
      it('should say file too large', async () => {
        let res = await chai.request(app).post('/login').send({
          email: process.env.TESTS_MAIL,
          password: 'test123'
        });
        expect(res).to.have.status(200);
        const token = res.body.token;

        res = await chai.request(app).post('/files')
          .attach('file', 'testfiles/largefile')
          .set('Authorization', `Bearer ${token}`);

        expect(res).to.have.status(400);
        expect(res.body).to.have.property(
          'error',
          'File too large'
        );
        await redisClient.del(`auth_${decodeURIComponent(token)}`);
      });
    }

    it('should say unauthorized', async () => {
      const res = await chai.request(app).post('/files')
        .attach('file', 'testfiles/t-rex-roar.mp3');

      expect(res).to.have.status(401);
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      );
    });
  });

  describe('PATCH /files/file:id', () => {
    it('should update file name', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });

      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist;
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files;

      res = await chai.request(app)
        .patch(`/files/${files[0].file_id}`)
        .send({ name: 'newname' })
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(201);
      //   expect(res.body.message.startsWith('Name changed from')).to.equal(true)
      expect(res.body).to.have.property(
        'message',
        `Name changed from ${files[0].file_name} to newname`
      );
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should not update id', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });

      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist;
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files;

      res = await chai.request(app)
        .patch(`/files/${files[0].file_id}`)
        .send({ id: 'newname' })
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(400);
      expect(res.body).to.have.property(
        'error',
        'No valid field specified to update'
      );
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say you do not have file with id error', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });

      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist;
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files;

      const ids: string[] = [];

      files.forEach((file) => {
        ids.push(file.file_id);
      });

      const wronguuid = (): string | undefined => {
        const uuid = v4();
        if (ids.includes(uuid)) {
          wronguuid();
        } else {
          return uuid;
        }
      };

      const fileId = wronguuid();
      res = await chai.request(app)
        .patch(`/files/${fileId}`)
        .send({ name: 'newname', user_id: 'newid' })
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(404);
      expect(res.body).to.have.property(
        'error',
        'File not found. Please check file id in the URL.'
      );
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say invalid id', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });

      expect(res).to.have.status(200);
      const token = res.body.token;
      res = await chai.request(app)
        .patch('/files/invalidid')
        .send({ name: 'newname' })
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(400);
      expect(res.body).to.have.property(
        'error',
        'Invalid file id'
      );
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say unauthorized', async () => {
      const uuid = v4();
      const res = await chai.request(app)
        .patch(`/files/${uuid}`)
        .send({ name: 'newname' });
      expect(res).to.have.status(401);
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      );
    });
  });

  describe('PATCH /admin/files/:fileId', () => {
    it('should mark file as unsafe', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res).to.have.status(200);
      const adminToken = res.body.token;

      res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist;
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files;
      res = await chai.request(app)
        .patch(`/admin/files/${files[0].file_id}`)
        .send({ safe: false })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property(
        'message', `${files[0].file_name} marked as unsafe by an Admin`
      );
      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say already marked file as unsafe', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res).to.have.status(200);
      const adminToken = res.body.token;

      res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist;
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files;
      res = await chai.request(app)
        .patch(`/admin/files/${files[0].file_id}`)
        .send({ safe: false })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property(
        'message', `${files[0].file_name} marked as unsafe by an Admin`
      );

      res = await chai.request(app)
        .patch(`/admin/files/${files[0].file_id}`)
        .send({ safe: false })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property(
        'message', `${files[0].file_name} already marked as unsafe by you`
      );
      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say now marked safe', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res).to.have.status(200);
      const adminToken = res.body.token;

      res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist;
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files;
      res = await chai.request(app)
        .patch(`/admin/files/${files[0].file_id}`)
        .send({ safe: false })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property(
        'message', `${files[0].file_name} marked as unsafe by an Admin`
      );

      res = await chai.request(app)
        .patch(`/admin/files/${files[0].file_id}`)
        .send({ safe: true })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property(
        'message',
        `${files[0].file_name} marked as safe by an Admin that marked as unsafe previously`
      );
      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should mark safe', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res).to.have.status(200);
      const adminToken = res.body.token;

      res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist;
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files;

      res = await chai.request(app)
        .patch(`/admin/files/${files[0].file_id}`)
        .send({ safe: true })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property(
        'message',
        `${files[0].file_name} marked as safe by an Admin`
      );
      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should delete file after 3 different unsafe reviews', async () => {
      await db<User>('users')
        .update({ is_superuser: true })
        .where({ id });

      await db<User>('users')
        .update({ is_superuser: true })
        .where({ id: id2 });

      const file = await db<File>('files')
        .insert({
          name: 'testreview',
          displayName: 'Test',
          folder_id: null,
          link: 'https://risevest.com',
          s3_key: 'testall',
          user_id: id,
          mimetype: 'audio/mpeg',
          history: JSON.stringify([{ event: 'Created', date: new Date() }])
        }, ['id', 'displayName']);

      let res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res).to.have.status(200);
      const token1 = res.body.token;

      res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token2 = res.body.token;

      res = await chai.request(app).post('/login').send({
        email: process.env.WRONG_TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token3 = res.body.token;

      res = await chai.request(app)
        .patch(`/admin/files/${file[0].id}`)
        .send({ safe: false })
        .set('Authorization', `Bearer ${token1}`);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property(
        'message', `${file[0].displayName} marked as unsafe by an Admin`
      );

      res = await chai.request(app)
        .patch(`/admin/files/${file[0].id}`)
        .send({ safe: false })
        .set('Authorization', `Bearer ${token2}`);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property(
        'message', `${file[0].displayName} marked as unsafe by an Admin`
      );

      res = await chai.request(app)
        .patch(`/admin/files/${file[0].id}`)
        .send({ safe: false })
        .set('Authorization', `Bearer ${token3}`);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property(
        'message', `${file[0].displayName} marked as unsafe by 3 admins and automatically deleted`
      );

      const deletedFile = await db<File>('files')
        .where({ id: file[0].id });

      expect(deletedFile[0]).to.not.exist;

      await db<User>('users')
        .update({ is_superuser: false })
        .where({ id });

      await db<User>('users')
        .update({ is_superuser: false })
        .where({ id: id2 });
      await redisClient.del(`auth_${decodeURIComponent(token1)}`);
      await redisClient.del(`auth_${decodeURIComponent(token2)}`);
      await redisClient.del(`auth_${decodeURIComponent(token3)}`);
    });

    it('should not delete file is not 3 unique false admin reviews', async () => {
      const file = await db<File>('files')
        .insert({
          name: 'testreview',
          displayName: 'Test',
          folder_id: null,
          link: 'https://risevest.com',
          s3_key: 'testall',
          user_id: id,
          mimetype: 'audio/mpeg',
          history: JSON.stringify([{ event: 'Created', date: new Date() }])
        }, ['id', 'displayName']);

      let res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res).to.have.status(200);
      const token1 = res.body.token;

      res = await chai.request(app)
        .patch(`/admin/files/${file[0].id}`)
        .send({ safe: false })
        .set('Authorization', `Bearer ${token1}`);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property(
        'message', `${file[0].displayName} marked as unsafe by an Admin`
      );

      res = await chai.request(app)
        .patch(`/admin/files/${file[0].id}`)
        .send({ safe: false })
        .set('Authorization', `Bearer ${token1}`);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property(
        'message', `${file[0].displayName} already marked as unsafe by you`
      );

      res = await chai.request(app)
        .patch(`/admin/files/${file[0].id}`)
        .send({ safe: false })
        .set('Authorization', `Bearer ${token1}`);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property(
        'message', `${file[0].displayName} already marked as unsafe by you`
      );

      const deletedFile = await db<File>('files')
        .where({ id: file[0].id });

      expect(deletedFile[0]).to.exist;

      await db<File>('files')
        .where({ id: file[0].id })
        .del();

      await redisClient.del(`auth_${decodeURIComponent(token1)}`);
    });

    it('should say invalid id', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res).to.have.status(200);
      const adminToken = res.body.token;

      res = await chai.request(app)
        .patch('/admin/files/invalidid')
        .send({ safe: false })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.have.status(400);
      expect(res.body).to.have.property(
        'error', 'Invalid file id'
      );
      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
    });

    it('should say file not found', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res).to.have.status(200);
      const adminToken = res.body.token;

      res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist;
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files;

      const ids: string[] = [];

      files.forEach((file) => {
        ids.push(file.file_id);
      });

      const wronguuid = (): string | undefined => {
        const uuid = v4();
        if (ids.includes(uuid)) {
          wronguuid();
        } else {
          return uuid;
        }
      };
      res = await chai.request(app)
        .patch(`/admin/files/${wronguuid()}`)
        .send({ safe: false })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.have.status(404);
      expect(res.body).to.have.property(
        'error', 'File not found. Please check file id in the URL.'
      );
      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say please specify if file is safe', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res).to.have.status(200);
      const adminToken = res.body.token;

      res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist;
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files;

      res = await chai.request(app)
        .patch(`/admin/files/${files[0].file_id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.have.status(400);
      expect(res.body).to.have.property(
        'error', 'Please specify if file is safe'
      );
      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say invalid safe', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res).to.have.status(200);
      const adminToken = res.body.token;

      res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist;
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files;

      res = await chai.request(app)
        .patch(`/admin/files/${files[0].file_id}`)
        .send({ safe: 'true' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.have.status(400);
      expect(res.body).to.have.property(
        'error', 'Invalid value for safe'
      );
      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say invalid safe, alt', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res).to.have.status(200);
      const adminToken = res.body.token;

      res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist;
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files;

      res = await chai.request(app)
        .patch(`/admin/files/${files[0].file_id}`)
        .send({ safe: { safe: true } })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.have.status(400);
      expect(res.body).to.have.property(
        'error', 'Invalid value for safe'
      );
      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say invalid safe, alt 2', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res).to.have.status(200);
      const adminToken = res.body.token;

      res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist;
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files;

      res = await chai.request(app)
        .patch(`/admin/files/${files[0].file_id}`)
        .send({ safe: [true] })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.have.status(400);
      expect(res.body).to.have.property(
        'error', 'Invalid value for safe'
      );
      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say invalid safe, alt 3', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      expect(res).to.have.status(200);
      const adminToken = res.body.token;

      res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist;
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files;

      res = await chai.request(app)
        .patch(`/admin/files/${files[0].file_id}`)
        .send({ safe: 1 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.have.status(400);
      expect(res.body).to.have.property(
        'error', 'Invalid value for safe'
      );
      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`);
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say page not found', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist;
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files;

      res = await chai.request(app)
        .patch(`/admin/files/${files[0].file_id}`)
        .send({ safe: 1 })
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(404);
      expect(res.body).to.have.property(
        'error', 'Page not found'
      );
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say page not found, alt', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist;
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files;

      res = await chai.request(app)
        .patch(`/admin/files/${files[0].file_id}`)
        .send({ safe: 1 });

      expect(res).to.have.status(404);
      expect(res.body).to.have.property(
        'error', 'Page not found'
      );
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });
  });

  describe('DELETE /files/:fileId', () => {
    it('should delete file', async () => {
      const file = await db<File>('files')
        .insert({
          name: 'testdelete',
          displayName: 'Test',
          folder_id: null,
          link: 'https://risevest.com',
          s3_key: 'testalldelete',
          user_id: id,
          mimetype: 'audio/mpeg',
          history: JSON.stringify([{ event: 'Created', date: new Date() }])
        }, ['id', 'displayName']);

      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .delete(`/files/${file[0].id}`)
        .send({
          email: process.env.TESTS_MAIL,
          password: 'test123'
        }).set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      expect(res.body).to.have.property(
        'message',
        `${file[0].displayName} successfully deleted`
      );

      const deletedFile = await db<File>('files')
        .where({ id: file[0].id });
      expect(deletedFile[0]).to.not.exist;
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should delete file, alt', async () => {
      const file = await db<File>('files')
        .insert({
          name: 'testdelete',
          displayName: 'Test',
          folder_id: null,
          link: 'https://risevest.com',
          s3_key: 'testalldelete',
          user_id: id,
          mimetype: 'audio/mpeg',
          history: JSON.stringify([{ event: 'Created', date: new Date() }])
        }, ['id', 'displayName']);

      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .delete(`/files/${file[0].id}?token=${token}`)
        .send({
          email: process.env.TESTS_MAIL,
          password: 'test123'
        });
      expect(res).to.have.status(200);
      expect(res.body).to.have.property(
        'message',
        `${file[0].displayName} successfully deleted`
      );

      const deletedFile = await db<File>('files')
        .where({ id: file[0].id });
      expect(deletedFile[0]).to.not.exist;
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say not found', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist;
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files;

      const ids: string[] = [];

      files.forEach((file) => {
        ids.push(file.file_id);
      });

      const wronguuid = (): string | undefined => {
        const uuid = v4();
        if (ids.includes(uuid)) {
          wronguuid();
        } else {
          return uuid;
        }
      };

      res = await chai.request(app)
        .delete(`/files/${wronguuid()}?token=${token}`)
        .send({
          email: process.env.TESTS_MAIL,
          password: 'test123'
        });
      expect(res).to.have.status(404);
      expect(res.body).to.have.property(
        'error',
        'File not found. Please check file id in the URL.'
      );
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say unauthorized', async () => {
      const res = await chai.request(app)
        .delete(`/files/${v4()}`)
        .send({
          email: process.env.TESTS_MAIL,
          password: 'test123'
        });
      expect(res).to.have.status(401);
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      );
    });
  });

  describe('GET /folders', () => {
    it('should get all folders', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get('/folders')
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(200);
      expect(res.body.folders).to.exist;

      const folders: Array<{
        folder_name: string
        file_count: number
      }> = res.body.folders;

      folders.forEach((folder) => {
        expect(folder.file_count).to.exist;
        expect(folder.file_count).to.be.a('number');
        expect(folder.folder_name).to.exist;
        expect(folder.folder_name).to.be.a('string');
      });
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should get all folders, alt', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get(`/folders?token=${token}`);

      expect(res).to.have.status(200);
      expect(res.body.folders).to.exist;

      const folders: Array<{
        folder_name: string
        file_count: number
      }> = res.body.folders;

      folders.forEach((folder) => {
        expect(folder.file_count).to.exist;
        expect(folder.file_count).to.be.a('number');
        expect(folder.folder_name).to.exist;
        expect(folder.folder_name).to.be.a('string');
      });
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say unauthorized', async () => {
      const res = await chai.request(app)
        .get('/folders');

      expect(res).to.have.status(401);
      expect(res.body.error).to.equal('Unauthorized');
    });
  });

  describe('GET /folders/:folderName', () => {
    it('should get all files in folder', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get('/folders/testfolder')
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(200);
      expect(res.body.files).to.exist;

      const files: Array<{
        file_name: string
        file_id: string
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files;

      files.forEach((file) => {
        expect(file.file_id).to.exist;
        expect(file.file_id).to.be.a('string');
        expect(file.file_name).to.exist;
        expect(file.file_name).to.be.a('string');
        expect(file.file_history).to.exist;
        expect(file.file_history).to.be.an('array');
        file.file_history.forEach((event) => {
          expect(event.event).to.exist;
          expect(event.date).to.exist;
        });
      });
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should get all files in folder, alt', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get(`/folders/testfolder?token=${token}`);

      expect(res).to.have.status(200);
      expect(res.body.files).to.exist;

      const files: Array<{
        file_name: string
        file_id: string
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files;

      files.forEach((file) => {
        expect(file.file_id).to.exist;
        expect(file.file_id).to.be.a('string');
        expect(file.file_name).to.exist;
        expect(file.file_name).to.be.a('string');
        expect(file.file_history).to.exist;
        expect(file.file_history).to.be.an('array');
        file.file_history.forEach((event) => {
          expect(event.event).to.exist;
          expect(event.date).to.exist;
        });
      });
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should get all files in folder, alt', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .get(`/folders/wrongfolderdoes?token=${token}`);

      expect(res).to.have.status(404);
      expect(res.body).to.have.property(
        'error',
        'You do not have a folder named wrongfolderdoes'
      );
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say unauthorized', async () => {
      const res = await chai.request(app)
        .get('/folders/testfolder');

      expect(res).to.have.status(401);
      expect(res.body.error).to.equal('Unauthorized');
    });
  });

  describe('POST /folders', () => {
    it('should create a new folder', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app).post('/folders').send({
        name: 'newboys'
      }).set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property(
        'message',
        'newboys folder succesfully created'
      );
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should create a new folder, alt', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app).post(`/folders?token=${token}`).send({
        name: 'newboys2'
      });

      expect(res).to.have.status(201);
      expect(res.body).to.have.property(
        'message',
        'newboys2 folder succesfully created'
      );
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say folder already exists', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app).post(`/folders?token=${token}`).send({
        name: 'testfolder'
      });

      expect(res).to.have.status(400);
      expect(res.body).to.have.property(
        'error',
        'testfolder folder already exists'
      );
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say name cannot be null', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app).post(`/folders?token=${token}`).send({
        name: 'null'
      });

      expect(res).to.have.status(400);
      expect(res.body).to.have.property(
        'error',
        'Name cannot be "null"'
      );
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say name error', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app).post(`/folders?token=${token}`).send({});

      expect(res).to.have.status(400);
      expect(res.body).to.have.property(
        'error',
        'Please enter a Folder name'
      );
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say name error, alt', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app).post(`/folders?token=${token}`).send({
        name: true
      });

      expect(res).to.have.status(400);
      expect(res.body).to.have.property(
        'error',
        'Please enter a Folder name'
      );
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say name error, alt 2', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app).post(`/folders?token=${token}`).send({
        name: undefined
      });

      expect(res).to.have.status(400);
      expect(res.body).to.have.property(
        'error',
        'Please enter a Folder name'
      );
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say name error, alt 3', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app).post(`/folders?token=${token}`).send({
        name: null
      });

      expect(res).to.have.status(400);
      expect(res.body).to.have.property(
        'error',
        'Please enter a Folder name'
      );
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say unauthorized', async () => {
      const res = await chai.request(app).post('/folders').send({
        name: 'tratra'
      });

      expect(res).to.have.status(401);
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      );
    });
  });

  describe('PUT /folders/:folderName', () => {
    it('should move file to folder', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app).put('/folders/testfolder').send({
        fileName: 'test2',
        source: 'null'
      }).set('Authorization', `Bearer ${token}`);
      console.log(res.body);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property(
        'message',
        'test2 moved from root directory to testfolder'
      );

      res = await chai.request(app).put('/folders/null').send({
        fileName: 'test2',
        source: 'testfolder'
      }).set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property(
        'message',
        'test2 moved from testfolder to root directory'
      );
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should move file to folder, alt', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app).put(`/folders/testfolder?token=${token}`).send({
        fileName: 'test2',
        source: 'null'
      });
      console.log(res.body);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property(
        'message',
        'test2 moved from root directory to testfolder'
      );

      res = await chai.request(app).put(`/folders/null?token=${token}`).send({
        fileName: 'test2',
        source: 'testfolder'
      });

      expect(res).to.have.status(201);
      expect(res.body).to.have.property(
        'message',
        'test2 moved from testfolder to root directory'
      );
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say file already exists', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app).put(`/folders/null?token=${token}`).send({
        fileName: 'test2',
        source: 'null'
      });

      expect(res).to.have.status(400);
      expect(res.body).to.have.property(
        'error',
        'test2 already exists in root directory'
      );
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say do not have folder', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app).put(`/folders/nofolder?token=${token}`).send({
        fileName: 'test2',
        source: 'null'
      });

      expect(res).to.have.status(404);
      expect(res.body).to.have.property(
        'error',
        'You do not have a folder named nofolder'
      );
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say do not have folder, alt', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app).put(`/folders/testfolder?token=${token}`).send({
        fileName: 'test2',
        source: 'nofolder'
      });

      expect(res).to.have.status(404);
      expect(res.body).to.have.property(
        'error',
        'You do not have a folder named nofolder'
      );
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say do not have file', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app).put(`/folders/testfolder?token=${token}`).send({
        fileName: 'test5',
        source: 'null'
      });

      expect(res).to.have.status(404);
      expect(res.body).to.have.property(
        'error',
        'You do not have a file named test5 in root directory'
      );
      await redisClient.del(`auth_${decodeURIComponent(token)}`);
    });

    it('should say unauthorized', async () => {
      const res = await chai.request(app).put('/folders/testfolder').send({
        fileName: 'test5',
        source: 'null'
      });

      expect(res).to.have.status(401);
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      );
    });
  });

  describe('DELETE /folder/:folderName', () => {
    it('should delete folder', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app).post('/folders').send({
        name: 'newboys5'
      }).set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property(
        'message',
        'newboys5 folder succesfully created'
      );

      res = await chai.request(app)
        .delete('/folders/newboys5')
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property(
        'message',
        'newboys5 successfully deleted'
      );
    });

    it('should say folder not found', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      });
      expect(res).to.have.status(200);
      const token = res.body.token;

      res = await chai.request(app)
        .delete('/folders/newboys7')
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(404);
      expect(res.body).to.have.property(
        'error',
        'You do not have a folder named newboys7'
      );
    });

    it('should say unauthorized', async () => {
      const res = await chai.request(app)
        .delete('/folders/testfolder');

      expect(res).to.have.status(401);
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      );
    });
  });
});
