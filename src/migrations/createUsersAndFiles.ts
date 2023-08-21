import db from '../config/db'

const createTables = async (): Promise<void> => {
  try {
    let exists: boolean = await db.schema.hasTable('users')
    if (!exists) {
      await db.schema.createTable('users', (table) => {
        table.uuid('id').primary().defaultTo(db.fn.uuid())
        table.string('email').notNullable().unique()
        table.string('password').notNullable()
        table.string('first_name').notNullable()
        table.string('last_name').notNullable()
        table.boolean('is_superuser').defaultTo(false)
        table.timestamps(false, true)
      })
      console.log('Created Users Table')
    }
    exists = await db.schema.hasTable('files')
    if (!exists) {
      await db.schema.createTable('files', (table) => {
        table.uuid('id').primary()
        table.string('name', 100).notNullable()
        table.string('folder', 100).nullable().defaultTo(null)
        table.uuid('user_id').references('id').inTable('users')
      })
      console.log('Created Files Table')
    }
    console.log('Connected to DB')
  } catch (error) {
    console.log('Error connecting to DB')
    console.log(error)
    throw error
  }
}

export default createTables
