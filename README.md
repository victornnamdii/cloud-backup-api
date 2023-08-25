# Cloud Backup System API

This repo contains an API that serves as an cloud backup system for users to for back up files to AWS S3. Built with Node.js, Typescript, Redis, PostgreSQL, and S3.

This api is hosted on https://cloudbackupapi-7336ea76e701.herokuapp.com

## Requirements

* PostgreSQL
* Node.js
* Typescript
* Redis
* An S3 bucket

## Setup

* Clone this repository `https://github.com/victornnamdii/cloud-backup-api.git`
* Access the directory `cd cloud-backup-api`
* Run `npm install`.
* Duplicate `env.example` to a `.env` file and fill in correct fields.
* Run `npm run migrate` to start migrations to the database.
* Run `npm test` to confirm server would function properly.
* Run `npm start` to start the server.
* Access server from specified port.

## Tests

Unit tests are located in `src/tests` directory. To test large files (> 200MB) upload, add a large file to the `testfiles` folder and name it `largefile`.
