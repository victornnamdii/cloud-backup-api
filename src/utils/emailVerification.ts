import nodemailer from 'nodemailer';
import { v4 } from 'uuid';
import hashString from './hashPassword';
import db from '../config/db';

interface emailverifications {
    user_id: string
    unique_string: string
    expires_at: Date
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  pool: true,
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },
});

const sendVerificationEmail = async ( id: string, email: string ) => {
  const prefixUrl = process.env.HOST;
  const uniqueString = v4() + id;
  
  const mailOptions = {
    from: 'CLOUD BACKUP',
    to: email,
    subject: 'Please verify your Email',
    html: `<p>Please click the link below to verify your email.</p><p>The link <b>expires in 6 hours</b>.</p><p>Click <a href=${`${prefixUrl}/users/verify-email/${id}/${uniqueString}`}>here</a> to verify</p>`,
  };
  
  try {
    const hashedString = await hashString(uniqueString);
    const alreadyExists = await db<emailverifications>('emailverifications')
      .where({ user_id: id})
      .first();
    if (alreadyExists !== undefined) {
      await db<emailverifications>('emailverifications')
        .where({ user_id: id })
        .del();
    }
    const now = new Date();
    now.setHours(now.getHours() + 6);
    await db<emailverifications>('emailverifications').insert({
      user_id: id,
      unique_string: hashedString,
      expires_at: now,
    });
    await transporter.sendMail(mailOptions);
    console.log(`Sent User Verification mail to ${email}`);
    // console.log('Sent');
  } catch (err) {
    console.log(`Didn't send User Verification mail to ${email}`);
    console.log(err);
    throw err;
  }
};

export default sendVerificationEmail;
