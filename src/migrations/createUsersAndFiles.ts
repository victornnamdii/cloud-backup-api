import hashPassword from '../utils/hashPassword';
import db from '../config/db';
import validateNewUserBody from '../utils/validators/newUser';
import RequestError from '../utils/BodyError';

const createTables = async (): Promise<void> => {
  try {
    const body = {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      firstName: process.env.ADMIN_FIRST_NAME,
      lastName: process.env.ADMIN_LAST_NAME
    };
    validateNewUserBody(body);
    let exists: boolean = await db.schema.hasTable('users');
    if (!exists) {
      await db.schema.createTable('users', (table) => {
        table.uuid('id').primary().defaultTo(db.fn.uuid());
        table.string('email').notNullable().unique();
        table.string('password').notNullable();
        table.string('first_name').notNullable();
        table.string('last_name').notNullable();
        table.string('token').nullable().defaultTo(null);
        table.boolean('is_superuser').defaultTo(false);
        table.boolean('is_superadmin').defaultTo(false);
        table.boolean('isVerified').defaultTo(false);
        table.timestamps(false, true);
      });
      console.log('Created Users Table');
      await db('users').insert({
        email: process.env.ADMIN_EMAIL,
        password: await hashPassword(process.env.ADMIN_PASSWORD as string),
        first_name: process.env.ADMIN_FIRST_NAME,
        last_name: process.env.ADMIN_LAST_NAME,
        is_superuser: true,
        is_superadmin: true
      });
      console.log('Created Admin Account');
    }

    exists = await db.schema.hasTable('emailverifications');
    if (!exists) {
      await db.schema.createTable('emailverifications', (table) => {
        table.uuid('user_id')
          .notNullable()
          .references('id')
          .inTable('users')
          .onUpdate('CASCADE')
          .onDelete('CASCADE');
        table.string('unique_string').notNullable();
        table.datetime('expires_at').notNullable();
      });
      console.log('Created email verifications Table');
    }

    exists = await db.schema.hasTable('folders');
    if (!exists) {
      await db.schema.createTable('folders', (table) => {
        table.uuid('id').primary().defaultTo(db.fn.uuid());
        table.string('name', 100).notNullable();
        table.string('displayName', 100).notNullable();
        table.uuid('user_id')
          .notNullable()
          .references('id')
          .inTable('users')
          .onUpdate('CASCADE')
          .onDelete('CASCADE');
        table.timestamps(false, true);
      });
      await db.schema.alterTable('folders', (table) => {
        table.unique(['user_id', 'name'], {
          indexName: 'user_folders',
          useConstraint: true
        });
      });
      console.log('Created Folders Table');
    }

    exists = await db.schema.hasTable('files');
    if (!exists) {
      await db.schema.createTable('files', (table) => {
        table.uuid('id').primary().defaultTo(db.fn.uuid());
        table.string('name', 100).notNullable();
        table.string('displayName', 100).notNullable();
        table.uuid('folder_id')
          .references('id')
          .inTable('folders')
          .onUpdate('CASCADE')
          .onDelete('CASCADE')
          .nullable();
        table.string('link').notNullable();
        table.string('s3_key').notNullable();
        table.uuid('user_id')
          .notNullable()
          .references('id')
          .inTable('users')
          .onUpdate('CASCADE')
          .onDelete('CASCADE');
        table.boolean('safe').defaultTo(true);
        table.string('mimetype').nullable();
        table.json('history').notNullable();
        table.json('false_review_by').notNullable().defaultTo([]);
        table.timestamps(false, true);
      });
      await db.schema.alterTable('files', (table) => {
        table.unique(['user_id', 'name', 'folder_id'], {
          indexName: 'user_files',
          useConstraint: true
        });
      });
      console.log('Created Files Table');
    }
    console.log('Connected to DB');
  } catch (error) {
    if (error instanceof RequestError) {
      throw new Error(
        `An error occured creating the super admin account: ${error.message} in the ADMIN environmental variables`
      );
    } else {
      console.log('Error connecting to DB');
      console.log(error);
      throw error;
    }
  }
};

export default createTables;
