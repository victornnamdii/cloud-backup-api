import chai, { expect } from 'chai'
import { before, after, describe, it } from 'mocha'
import dotenv from 'dotenv'
import chaiHttp from 'chai-http'
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

describe('File Tests', () => {
  let id: string
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
        s3_key: 'rise',
        user_id: id,
        mimetype: 'image/jpeg',
        history: JSON.stringify([{ event: 'Created', date: new Date() }])
      })

    await db<File>('files')
      .insert({
        name: 'test',
        displayName: 'Test',
        folder_id: folder[0].id,
        link: 'https://risevest.com',
        s3_key: 'rise',
        user_id: id,
        mimetype: 'image/jpeg',
        history: JSON.stringify([{ event: 'Created', date: new Date() }])
      })
  })
  after(async () => {
    await db<File>('files')
      .where({ user_id: id })
      .del()

    await db<Folder>('folders')
      .where({ user_id: id })
      .del()

    await db<User>('users')
      .where({ email: process.env.TESTS_MAIL })
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
})
