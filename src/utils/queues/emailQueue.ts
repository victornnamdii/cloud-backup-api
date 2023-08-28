import Queue from 'bull';
import sendVerificationEmail from '../emailVerification';

const sendEmailQueue = new Queue('User Verification', {
  redis: {
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
    port: Number(process.env.REDIS_PORT),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'fixed',
      delay: 5000,
    },
  },
});

sendEmailQueue.on('error', (error) => {
  console.log('User Verification Queue Error');
  console.log(error);
});

sendEmailQueue.process(async (job, done) => {
  const { id, email } = job.data;
  console.log(`Sending User Verification mail to ${email}`);
  try {
    await sendVerificationEmail(id, email);
  } catch (error) {
    // @ts-expect-error: Skip
    return done(error);
  }
  done();
});

export default sendEmailQueue;
