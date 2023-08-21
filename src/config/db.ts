import { type Knex, knex } from 'knex'
import dotenv from 'dotenv'

dotenv.config()
const port: number = Number(process.env.PG_PORT)

const config: Knex.Config = {
  client: 'pg',
  connection: {
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    port
  }
}

const db = knex(config)

export default db
