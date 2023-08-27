# Cloud Backup System API

This repo contains an API that serves as an cloud backup system for users to for back up files to AWS S3. Built with Node.js, Typescript, Redis, PostgreSQL, and S3.

This api is hosted on https://cloudbackupapi-7336ea76e701.herokuapp.com

- - - -
## Features

* Users can create an account with their email address, password and full name.
* Users can upload files up to 200mb
* Users can download uploaded files
* Users can create folders to hold files
* An admin user type for managing the content uploaded
* Admins can mark pictures and videos as unsafe
* Files are automatically deleted when marked unsafe by 3 different admins
* Users can stream videos and audio
* File History
* Revokable session management

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
    * Migrating creates a super admin account with the details you insert in `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FIRST_NAME` and `ADMIN_LAST_NAME` in the `.env` file. This account will be the only one to have permissions to create other admins and revoke user sessions. The other admins created by this account would have permissions to review user files and view all files in the database.
* Run `npm test` to confirm server would function properly.
* Run `npm start` to start the server.
* Access server from specified port.

## Tests

Unit tests are located in `src/tests` directory. To test large files (> 200MB) upload, add a large file to the `testfiles` folder and name it `largefile`.

## Documentation

The API documentation can be found on postman [here](https://documenter.getpostman.com/view/27917912/2s9Y5YRhRy)
