import cron from 'cron';
import db from '../../config/db';

interface User {
    id: string
    email: string
    password: string
    first_name: string
    last_name: string
    is_superuser: boolean
    isVerified: boolean
  }
  
interface emailverifications {
    user_id: string
    unique_string: string
    expires_at: Date
}

const clearVerifications = new cron.CronJob('0 * * * *', async () => {
  try {
    console.log('Searching for Expired Verifications');
    const userVerifications = await db<emailverifications>('emailverifications')
      .where('expires_at', '<', new Date());
    console.log('Deleting Expired Verifications');
    userVerifications.forEach(async (userVerification) => {
      try {
        const user = await db<User>('users').where({ id: userVerification.user_id }).first();
        if (user && !user.isVerified) {
          await db<User>('users').where({ id: userVerification.user_id }).del();
        }
        await db<emailverifications>('emailverifications')
          .where({user_id: userVerification.user_id}).del();
      } catch (error) {
        console.log(error);
      }
    });
    console.log('Deleted Expired Verifications');
  } catch (error) {
    console.log(error);
  }
});

export default clearVerifications;
