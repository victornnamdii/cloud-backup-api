import chai, { expect } from 'chai'
import { before, after, describe, it } from 'mocha'
import dotenv from 'dotenv'
import chaiHttp from 'chai-http'
import fs from 'fs'
import { v4 } from 'uuid'
import { parse } from 'node-html-parser'
import db from '../config/db'
import app from '../server'
import { redisClient } from '../config/redis'
import hashPassword from '../utils/hashPassword'

dotenv.config()
chai.use(chaiHttp)

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

const binaryParser = function (res: any, cb: any): void {
  res.setEncoding('binary')
  res.data = ''
  res.on('data', function (chunk: string) {
    res.data += chunk
  })
  res.on('end', function () {
    cb(null, Buffer.from(res.data, 'binary'))
  })
}

describe('File Tests', () => {
  let id: string
  let id2: string
  before(async () => {
    const user = await db<User>('users')
      .insert({
        email: process.env.TESTS_MAIL,
        password: await hashPassword('test123'),
        first_name: 'Victor',
        last_name: 'Ilodiuba'
      }, ['id'])
    id = user[0].id

    const folder = await db<Folder>('folders')
      .insert({
        name: 'testfolder',
        displayName: 'TestFolder',
        user_id: id
      }, ['id'])

    await db<File>('files')
      .insert({
        name: 'test',
        displayName: 'Test',
        folder_id: null,
        link: 'https://risevest.com',
        s3_key: 'risevest_cloud_1441553a-9218-42c5-8ad2-794c7bf6dd10_t-rex-roar.mp3',
        user_id: id,
        mimetype: 'audio/mpeg',
        history: JSON.stringify([{ event: 'Created', date: new Date() }])
      })

    await db<File>('files')
      .insert({
        name: 'test',
        displayName: 'Test',
        folder_id: folder[0].id,
        link: 'https://risevest.com',
        s3_key: 'risevest_cloud_1441553a-9218-42c5-8ad2-794c7bf6dd10_t-rex-roar.mp3',
        user_id: id,
        mimetype: 'audio/mpeg',
        history: JSON.stringify([{ event: 'Created', date: new Date() }])
      })

    const user2 = await db<User>('users')
      .insert({
        email: process.env.WRONG_TESTS_MAIL,
        password: await hashPassword('test123'),
        first_name: 'Victor',
        last_name: 'Ilodiuba'
      }, ['id'])

    id2 = user2[0].id
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
      })
  })
  after(async () => {
    await db<File>('files')
      .where({ user_id: id })
      .del()

    await db<File>('files')
      .where({ user_id: id2 })
      .del()

    await db<Folder>('folders')
      .where({ user_id: id })
      .del()

    await db<User>('users')
      .where({ email: process.env.TESTS_MAIL })
      .del()

    await db<User>('users')
      .where({ email: process.env.WRONG_TESTS_MAIL })
      .del()
  })
  describe('GET /files', () => {
    it('should get user files', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      })
      expect(res).to.have.status(200)
      const token = res.body.token

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`)
      expect(res).to.have.status(200)
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files
      files.forEach((file) => {
        expect(file.file_id).to.exist
        expect(file.file_name).to.exist
        expect(typeof file.folder_name === 'string' ||
            file.folder_name === null
        ).to.equal(true)
        expect(file.file_history).to.exist
        expect(file.file_history).to.be.an('array')
        file.file_history.forEach((event) => {
          expect(event.event).to.exist
          expect(event.date).to.exist
        })
      })
      await redisClient.del(`auth_${decodeURIComponent(token)}`)
    })

    it('should get user files, alt', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      })
      expect(res).to.have.status(200)
      const token = res.body.token

      res = await chai.request(app)
        .get(`/files?token=${token}`)
      expect(res).to.have.status(200)
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files
      files.forEach((file) => {
        expect(file.file_id).to.exist
        expect(file.file_name).to.exist
        expect(typeof file.folder_name === 'string' ||
              file.folder_name === null
        ).to.equal(true)
        expect(file.file_history).to.exist
        expect(file.file_history).to.be.an('array')
        file.file_history.forEach((event) => {
          expect(event.event).to.exist
          expect(event.date).to.exist
        })
      })
      await redisClient.del(`auth_${decodeURIComponent(token)}`)
    })

    it('should get all files for admin', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      })
      expect(res).to.have.status(200)
      const token = res.body.token

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`)
      expect(res).to.have.status(200)
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
        file_user_id: string
      }> = res.body.files
      files.forEach((file) => {
        expect(file.file_id).to.exist
        expect(file.file_name).to.exist
        expect(file.file_user_id).to.exist
        expect(typeof file.folder_name === 'string' ||
              file.folder_name === null
        ).to.equal(true)
        expect(file.file_history).to.exist
        expect(file.file_history).to.be.an('array')
        file.file_history.forEach((event) => {
          expect(event.event).to.exist
          expect(event.date).to.exist
        })
      })
      await redisClient.del(`auth_${decodeURIComponent(token)}`)
    })

    it('should get user files, alt', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      })
      expect(res).to.have.status(200)
      const token = res.body.token

      res = await chai.request(app)
        .get(`/files?token=${token}`)
      expect(res).to.have.status(200)
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
        file_user_id: string
      }> = res.body.files
      files.forEach((file) => {
        expect(file.file_id).to.exist
        expect(file.file_name).to.exist
        expect(file.file_user_id).to.exist
        expect(typeof file.folder_name === 'string' ||
                file.folder_name === null
        ).to.equal(true)
        expect(file.file_history).to.exist
        expect(file.file_history).to.be.an('array')
        file.file_history.forEach((event) => {
          expect(event.event).to.exist
          expect(event.date).to.exist
        })
      })
      await redisClient.del(`auth_${decodeURIComponent(token)}`)
    })

    it('should say unauthorized', async () => {
      const res = await chai.request(app)
        .get('/files')
      expect(res).to.have.status(401)
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.not.exist
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      )
    })

    it('should say unauthorized, alt', async () => {
      const res = await chai.request(app)
        .get('/files')
        .set('Authorization', 'Bearer wrongtoken')
      expect(res).to.have.status(401)
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.not.exist
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      )
    })

    it('should say unauthorized, alt 2', async () => {
      const res = await chai.request(app)
        .get('/files?token=wrongtoken')
      expect(res).to.have.status(401)
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.not.exist
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      )
    })
  })

  describe('GET /files/download/:fileId', () => {
    it('should download file', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      })
      expect(res).to.have.status(200)
      const token = res.body.token

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`)
      expect(res).to.have.status(200)
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files

      //   console.log(files)
      res = await chai.request(app)
        .get(`/files/download/${files[0].file_id}`)
        .set('Authorization', `Bearer ${token}`)
        .buffer()
        .parse(binaryParser)

      expect(res).to.have.status(200)
      expect(res.headers['transfer-encoding']).to.equal('chunked')
      await redisClient.del(`auth_${decodeURIComponent(token)}`)
    })

    it('should download file, alt', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      })
      expect(res).to.have.status(200)
      const token = res.body.token

      res = await chai.request(app)
        .get(`/files?token=${token}`)
      expect(res).to.have.status(200)
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files

      res = await chai.request(app)
        .get(`/files/download/${files[0].file_id}`)
        .set('Authorization', `Bearer ${token}`)
        .buffer()
        .parse(binaryParser)

      expect(res).to.have.status(200)
      expect(res.headers['transfer-encoding']).to.equal('chunked')
      await redisClient.del(`auth_${decodeURIComponent(token)}`)
    })

    it('should download file for admin', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      })
      expect(res).to.have.status(200)
      const token = res.body.token

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`)
      expect(res).to.have.status(200)
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files

      res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      })
      expect(res).to.have.status(200)
      const adminToken = res.body.token

      res = await chai.request(app)
        .get(`/files/download/${files[0].file_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .buffer()
        .parse(binaryParser)

      expect(res).to.have.status(200)
      expect(res.headers['transfer-encoding']).to.equal('chunked')
      await redisClient.del(`auth_${decodeURIComponent(token)}`)
      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`)
    })

    it('should download file for admin, alt', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      })
      expect(res).to.have.status(200)
      const token = res.body.token

      res = await chai.request(app)
        .get(`/files?token=${token}`)
      expect(res).to.have.status(200)
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files

      res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      })
      expect(res).to.have.status(200)
      const adminToken = res.body.token

      res = await chai.request(app)
        .get(`/files/download/${files[0].file_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .buffer()
        .parse(binaryParser)

      expect(res).to.have.status(200)
      expect(res.headers['transfer-encoding']).to.equal('chunked')
      await redisClient.del(`auth_${decodeURIComponent(token)}`)
      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`)
    })

    it('should say invalid id', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      })
      expect(res).to.have.status(200)
      const token = res.body.token

      res = await chai.request(app)
        .get('/files/download/invalidid')
        .set('Authorization', `Bearer ${token}`)
        .buffer()
        .parse(binaryParser)

      expect(res).to.have.status(400)
      expect(res.header['content-type']
        .startsWith('application/json')).to.equal(true)
      const jsonString = res.body.toString()
      const json = JSON.parse(jsonString)
      expect(json).to.have.property('error', 'Invalid file id')
      await redisClient.del(`auth_${decodeURIComponent(token)}`)
    })

    it('should say unauthorized', async () => {
      const uuid = v4()
      const res = await chai.request(app)
        .get(`/files/download/${uuid}`)
      expect(res).to.have.status(401)
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      )
    })

    it('should say unauthorized, alt', async () => {
      const res = await chai.request(app)
        .get('/files/download/fileid')
        .set('Authorization', 'Bearer wrongtoken')
      expect(res).to.have.status(401)
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      )
    })

    it('should say unauthorized, alt 2', async () => {
      const res = await chai.request(app)
        .get('/files/download/file?token=wrongtoken')
      expect(res).to.have.status(401)
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      )
    })

    it('should say file not found', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      })
      expect(res).to.have.status(200)
      const token = res.body.token

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`)
      expect(res).to.have.status(200)
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files

      const ids: string[] = []

      files.forEach((file) => {
        ids.push(file.file_id)
      })

      const wronguuid = (): string | undefined => {
        const uuid = v4()
        if (ids.includes(uuid)) {
          wronguuid()
        } else {
          return uuid
        }
      }

      //   console.log(files)
      res = await chai.request(app)
        .get(`/files/download/${wronguuid()}`)
        .set('Authorization', `Bearer ${token}`)
        .buffer()
        .parse(binaryParser)

      expect(res).to.have.status(404)
      expect(res.header['content-type']
        .startsWith('application/json')).to.equal(true)
      const jsonString = res.body.toString()
      const json = JSON.parse(jsonString)
      expect(json).to.have.property('error', 'File not found. Please check file id in the URL.')
      await redisClient.del(`auth_${decodeURIComponent(token)}`)
    })

    it('should say file not found in storage', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.WRONG_TESTS_MAIL,
        password: 'test123'
      })
      expect(res).to.have.status(200)
      const token = res.body.token

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`)
      expect(res).to.have.status(200)
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files

      //   console.log(files)
      res = await chai.request(app)
        .get(`/files/download/${files[0].file_id}`)
        .set('Authorization', `Bearer ${token}`)
        .buffer()
        .parse(binaryParser)

      expect(res).to.have.status(404)
      expect(res.header['content-type']
        .startsWith('application/json')).to.equal(true)
      const jsonString = res.body.toString()
      const json = JSON.parse(jsonString)
      expect(json).to.have.property('error', 'File not found in storage')
      await redisClient.del(`auth_${decodeURIComponent(token)}`)
    })
  })

  describe('GET /files/stream/:fileId', () => {
    it('should stream file', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      })
      expect(res).to.have.status(200)
      const token = res.body.token

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`)
      expect(res).to.have.status(200)
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files

      //   console.log(files)
      res = await chai.request(app)
        .get(`/files/stream/${files[0].file_id}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res).to.have.status(200)
      const page = parse(res.text)
      const stream = page.querySelector('audio')
      expect(stream?.rawAttrs).to.exist
      await redisClient.del(`auth_${decodeURIComponent(token)}`)
    })

    it('should stream file, alt', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      })
      expect(res).to.have.status(200)
      const token = res.body.token

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`)
      expect(res).to.have.status(200)
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files

      //   console.log(files)
      res = await chai.request(app)
        .get(`/files/stream/${files[0].file_id}?token=${token}`)

      expect(res).to.have.status(200)
      const page = parse(res.text)
      const stream = page.querySelector('audio')
      expect(stream?.rawAttrs).to.exist
      await redisClient.del(`auth_${decodeURIComponent(token)}`)
    })

    it('should stream file for admin', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      })
      expect(res).to.have.status(200)
      const token = res.body.token

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`)
      expect(res).to.have.status(200)
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files

      res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      })
      expect(res).to.have.status(200)
      const adminToken = res.body.token

      //   console.log(files)
      res = await chai.request(app)
        .get(`/files/stream/${files[0].file_id}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res).to.have.status(200)
      const page = parse(res.text)
      const stream = page.querySelector('audio')
      expect(stream?.rawAttrs).to.exist
      await redisClient.del(`auth_${decodeURIComponent(token)}`)
      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`)
    })

    it('should stream file for admin, alt', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      })
      expect(res).to.have.status(200)
      const token = res.body.token

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`)
      expect(res).to.have.status(200)
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files

      res = await chai.request(app).post('/login').send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      })
      expect(res).to.have.status(200)
      const adminToken = res.body.token

      //   console.log(files)
      res = await chai.request(app)
        .get(`/files/stream/${files[0].file_id}?token=${adminToken}`)

      expect(res).to.have.status(200)
      const page = parse(res.text)
      const stream = page.querySelector('audio')
      expect(stream?.rawAttrs).to.exist
      await redisClient.del(`auth_${decodeURIComponent(token)}`)
      await redisClient.del(`auth_${decodeURIComponent(adminToken)}`)
    })

    it('should say invalid id', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      })
      expect(res).to.have.status(200)
      const token = res.body.token

      res = await chai.request(app)
        .get('/files/stream/invalidid')
        .set('Authorization', `Bearer ${token}`)

      expect(res).to.have.status(400)
      expect(res.body).to.have.property('error', 'Invalid file id')
      await redisClient.del(`auth_${decodeURIComponent(token)}`)
    })

    it('should say unauthorized', async () => {
      const uuid = v4()
      const res = await chai.request(app)
        .get(`/files/stream/${uuid}`)
      expect(res).to.have.status(401)
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      )
    })

    it('should say unauthorized, alt', async () => {
      const res = await chai.request(app)
        .get('/files/stream/fileid')
        .set('Authorization', 'Bearer wrongtoken')
      expect(res).to.have.status(401)
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      )
    })

    it('should say unauthorized, alt 2', async () => {
      const res = await chai.request(app)
        .get('/files/stream/file?token=wrongtoken')
      expect(res).to.have.status(401)
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      )
    })

    it('should say file not found', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      })
      expect(res).to.have.status(200)
      const token = res.body.token

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`)
      expect(res).to.have.status(200)
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files

      const ids: string[] = []

      files.forEach((file) => {
        ids.push(file.file_id)
      })

      const wronguuid = (): string | undefined => {
        const uuid = v4()
        if (ids.includes(uuid)) {
          wronguuid()
        } else {
          return uuid
        }
      }

      //   console.log(files)
      res = await chai.request(app)
        .get(`/files/stream/${wronguuid()}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res).to.have.status(404)
      expect(res.body).to.have.property('error', 'File not found. Please check file id in the URL.')
      await redisClient.del(`auth_${decodeURIComponent(token)}`)
    })

    it('should say return file type error', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.WRONG_TESTS_MAIL,
        password: 'test123'
      })
      expect(res).to.have.status(200)
      const token = res.body.token

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`)
      expect(res).to.have.status(200)
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files

      //   console.log(files)
      res = await chai.request(app)
        .get(`/files/stream/${files[0].file_id}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res).to.have.status(400)
      expect(res.body).to.have.property(
        'error',
        'File requested for is neither a video nor audio'
      )
      await redisClient.del(`auth_${decodeURIComponent(token)}`)
    })
  })

  describe('POST /files', () => {
    it('should create a new file', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      })
      expect(res).to.have.status(200)
      const token = res.body.token

      res = await chai.request(app).post('/files')
        .field('name', 'testfilesss')
        .attach('file', 'testfiles/t-rex-roar.mp3')
        .set('Authorization', `Bearer ${token}`)

      expect(res).to.have.status(201)
      expect(res.body).to.have.property(
        'message',
        'File succesfully uploaded'
      )
      expect(res.body).to.have.property('id')
      expect(res.body).to.have.property('folderId', null)
      await redisClient.del(`auth_${decodeURIComponent(token)}`)
    })

    it('should create a new file with token query', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      })
      expect(res).to.have.status(200)
      const token = res.body.token

      res = await chai.request(app).post(`/files?token=${token}`)
        .field('name', 'testfiles2')
        .attach('file', 'testfiles/t-rex-roar.mp3')

      expect(res).to.have.status(201)
      expect(res.body).to.have.property(
        'message',
        'File succesfully uploaded'
      )
      expect(res.body).to.have.property('id')
      expect(res.body).to.have.property('folderId', null)
      await redisClient.del(`auth_${decodeURIComponent(token)}`)
    })

    it('should create a new file without name field', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      })
      expect(res).to.have.status(200)
      const token = res.body.token

      res = await chai.request(app).post('/files')
        .attach('file', 'testfiles/t-rex-roar.mp3')
        .set('Authorization', `Bearer ${token}`)

      expect(res).to.have.status(201)
      expect(res.body).to.have.property(
        'message',
        'File succesfully uploaded'
      )
      expect(res.body).to.have.property('id')
      expect(res.body).to.have.property('folderId', null)
      await redisClient.del(`auth_${decodeURIComponent(token)}`)
    })

    it('should create a new file with new folder name in query', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      })
      expect(res).to.have.status(200)
      const token = res.body.token

      res = await chai.request(app).post('/files?folderName=newfolder')
        .field('name', 'testfilesss')
        .attach('file', 'testfiles/t-rex-roar.mp3')
        .set('Authorization', `Bearer ${token}`)

      expect(res).to.have.status(201)
      expect(res.body).to.have.property(
        'message',
        'File succesfully uploaded'
      )
      expect(res.body).to.have.property('id')
      expect(res.body).to.have.property('folderId')
      expect(res.body.folderId !== null).to.equal(true)
      await redisClient.del(`auth_${decodeURIComponent(token)}`)
    })

    it('should create a new file with already existing folder name in query', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      })
      expect(res).to.have.status(200)
      const token = res.body.token

      res = await chai.request(app).post('/files?folderName=testfolder')
        .field('name', 'testfilesss')
        .attach('file', 'testfiles/t-rex-roar.mp3')
        .set('Authorization', `Bearer ${token}`)

      expect(res).to.have.status(201)
      expect(res.body).to.have.property(
        'message',
        'File succesfully uploaded'
      )
      expect(res.body).to.have.property('id')
      expect(res.body).to.have.property('folderId')
      expect(res.body.folderId !== null).to.equal(true)
      await redisClient.del(`auth_${decodeURIComponent(token)}`)
    })

    it('should create a new file with already existing folder name and token in query', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      })
      expect(res).to.have.status(200)
      const token = res.body.token

      res = await chai.request(app).post(`/files?folderName=testfolder&token=${token}`)
        .field('name', 'testfilesss2')
        .attach('file', 'testfiles/t-rex-roar.mp3')

      expect(res).to.have.status(201)
      expect(res.body).to.have.property(
        'message',
        'File succesfully uploaded'
      )
      expect(res.body).to.have.property('id')
      expect(res.body).to.have.property('folderId')
      expect(res.body.folderId !== null).to.equal(true)
      await redisClient.del(`auth_${decodeURIComponent(token)}`)
    })

    it('should say file aready exists', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      })
      expect(res).to.have.status(200)
      const token = res.body.token

      res = await chai.request(app).post('/files')
        .field('name', 'testfilesss')
        .attach('file', 'testfiles/t-rex-roar.mp3')
        .set('Authorization', `Bearer ${token}`)

      expect(res).to.have.status(400)
      expect(res.body).to.have.property(
        'error',
        'testfilesss already exists'
      )
      await redisClient.del(`auth_${decodeURIComponent(token)}`)
    })

    it('should say file aready exists without name field', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      })
      expect(res).to.have.status(200)
      const token = res.body.token

      res = await chai.request(app).post('/files')
        //   .field('name', 'testfilesss')
        .attach('file', 'testfiles/t-rex-roar.mp3')
        .set('Authorization', `Bearer ${token}`)

      expect(res).to.have.status(400)
      expect(res.body).to.have.property(
        'error',
        't-rex-roar.mp3 already exists'
      )
      await redisClient.del(`auth_${decodeURIComponent(token)}`)
    })

    if (fs.existsSync('testfiles/largefile')) {
      it('should say file too large', async () => {
        let res = await chai.request(app).post('/login').send({
          email: process.env.TESTS_MAIL,
          password: 'test123'
        })
        expect(res).to.have.status(200)
        const token = res.body.token

        res = await chai.request(app).post('/files')
          .attach('file', 'testfiles/largefile')
          .set('Authorization', `Bearer ${token}`)

        expect(res).to.have.status(400)
        expect(res.body).to.have.property(
          'error',
          'File too large'
        )
        await redisClient.del(`auth_${decodeURIComponent(token)}`)
      })
    }

    it('should say unauthorized', async () => {
      const res = await chai.request(app).post('/files')
        .attach('file', 'testfiles/t-rex-roar.mp3')

      expect(res).to.have.status(401)
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      )
    })
  })

  describe('PATCH /files/file:id', () => {
    it('should update file name', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      })

      expect(res).to.have.status(200)
      const token = res.body.token

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`)
      expect(res).to.have.status(200)
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files

      res = await chai.request(app)
        .patch(`/files/${files[0].file_id}`)
        .send({ name: 'newname' })
        .set('Authorization', `Bearer ${token}`)
      expect(res).to.have.status(201)
      expect(res.body.message.startsWith('Name changed from')).to.equal(true)
    })

    it('should not update id', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      })

      expect(res).to.have.status(200)
      const token = res.body.token

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`)
      expect(res).to.have.status(200)
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files

      res = await chai.request(app)
        .patch(`/files/${files[0].file_id}`)
        .send({ id: 'newname' })
        .set('Authorization', `Bearer ${token}`)
      expect(res).to.have.status(400)
      expect(res.body).to.have.property(
        'error',
        'No valid field specified to update'
      )
    })

    it('should say you do not have file with id error', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      })

      expect(res).to.have.status(200)
      const token = res.body.token

      res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`)
      expect(res).to.have.status(200)
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(res.body.files).to.exist
      const files: Array<{
        file_id: string
        file_name: string
        folder_name: string | null
        file_history: Array<{ event: string, date: Date }>
      }> = res.body.files

      const ids: string[] = []

      files.forEach((file) => {
        ids.push(file.file_id)
      })

      const wronguuid = (): string | undefined => {
        const uuid = v4()
        if (ids.includes(uuid)) {
          wronguuid()
        } else {
          return uuid
        }
      }

      const fileId = wronguuid()
      res = await chai.request(app)
        .patch(`/files/${fileId}`)
        .send({ name: 'newname', user_id: 'newid' })
        .set('Authorization', `Bearer ${token}`)
      expect(res).to.have.status(404)
      expect(res.body).to.have.property(
        'error',
        'File not found. Please check file id in the URL.'
      )
    })

    it('should say invalid id', async () => {
      let res = await chai.request(app).post('/login').send({
        email: process.env.TESTS_MAIL,
        password: 'test123'
      })

      expect(res).to.have.status(200)
      const token = res.body.token
      res = await chai.request(app)
        .patch('/files/invalidid')
        .send({ name: 'newname' })
        .set('Authorization', `Bearer ${token}`)
      expect(res).to.have.status(400)
      expect(res.body).to.have.property(
        'error',
        'Invalid file id'
      )
    })

    it('should say unauthorized', async () => {
      const uuid = v4()
      const res = await chai.request(app)
        .patch(`/files/${uuid}`)
        .send({ name: 'newname' })
      expect(res).to.have.status(401)
      expect(res.body).to.have.property(
        'error',
        'Unauthorized'
      )
    })
  })
})
