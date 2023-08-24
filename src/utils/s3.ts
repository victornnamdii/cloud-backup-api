import {
  GetObjectCommand,
  HeadObjectCommand,
  NoSuchKey,
  NotFound
} from '@aws-sdk/client-s3';
import { S3ReadStream, type S3ReadStreamOptions } from 's3-readstream';
import { s3client } from '../middlewares/uploadMiddleware';

const createReadStream = async (key: string): Promise<S3ReadStream> => {
  const bucketParams = {
    Bucket: process.env.S3_BUCKET,
    Key: key
  };
  const headObjectCommand = new HeadObjectCommand(bucketParams);
  const headObject = await s3client.send(headObjectCommand);

  const options: S3ReadStreamOptions = {
    s3: s3client,
    command: new GetObjectCommand(bucketParams),
    maxLength: headObject.ContentLength as number,
    byteRange: 10 * 1024 * 1024 // 10 MiB (optional - defaults to 64kb)
  };

  return new S3ReadStream(options);
};

export { createReadStream, NoSuchKey, NotFound };
