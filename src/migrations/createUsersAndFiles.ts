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
    exists = await db.schema.hasTable('folders')
    if (!exists) {
      await db.schema.createTable('folders', (table) => {
        table.uuid('id').primary().defaultTo(db.fn.uuid())
        table.string('name', 100).notNullable()
        table.string('displayName', 100).notNullable()
        table.uuid('user_id').notNullable().references('id').inTable('users')
        table.timestamps(false, true)
      })
      await db.schema.alterTable('folders', (table) => {
        table.unique(['user_id', 'name'], {
          indexName: 'user_folders',
          useConstraint: true
        })
      })
      console.log('Created Folders Table')
    }
    exists = await db.schema.hasTable('files')
    if (!exists) {
      await db.schema.createTable('files', (table) => {
        table.uuid('id').primary().defaultTo(db.fn.uuid())
        table.string('name', 100).notNullable()
        table.string('displayName', 100).notNullable()
        table.uuid('folder_id').references('id').inTable('folders').nullable()
        table.string('link').notNullable()
        table.string('s3_key').notNullable()
        table.uuid('user_id').notNullable().references('id').inTable('users')
        table.timestamps(false, true)
      })
      await db.schema.alterTable('files', (table) => {
        table.unique(['user_id', 'name', 'folder_id'], {
          indexName: 'user_files',
          useConstraint: true
        })
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
