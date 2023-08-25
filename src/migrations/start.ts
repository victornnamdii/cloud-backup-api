import createTables from './createUsersAndFiles';

const startMigrations = async () => {
  console.log('Starting Migrations');
  await createTables();
  console.log('Migrations completed');
};

startMigrations();
