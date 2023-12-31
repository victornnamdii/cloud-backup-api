import { type Request, type Response, type NextFunction } from 'express';
import isUUID from 'validator/lib/isUUID';
import db from '../config/db';
import RequestBodyError from '../utils/BodyError';
import validateNewFileBody from '../utils/validators/newFile';
import { deleteObject } from '../middlewares/uploadMiddleware';
import validateFileReviewBody from '../utils/validators/fileReview';
import validateNewFolderBody from '../utils/validators/newFolder';
import { createReadStream, NoSuchKey, NotFound } from '../utils/s3';
import validateUpdateFolderBody from '../utils/validators/updateFolder';
import validateUpdateFileBody from '../utils/validators/updateFile';

interface File {
  id: string
  file_id: string
  name: string
  displayName: string
  folder_id: string | null
  link: string
  download_link: string
  s3_key: string
  user_id: string
  updated_at: Date
  mimetype: string
  history: string | Array<{ event: string, date: Date }>
  false_review_by: string | string[]
}

interface Folder {
  id: string
  name: string
  displayName: string
  user_id: string
  updated_at: Date
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
type FinalResponse = (undefined | Response<any, Record<string, any>>)

/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
class FileController {
  static async addFile (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    let name: string;
    let displayName: string | undefined;
    try {
      validateNewFileBody(req.body);
      /* eslint-disable-next-line @typescript-eslint/strict-boolean-expressions */
      if (!req.file.location) {
        return res.status(400).json({ error: 'Please add a file' });
      }

      const folderId: string | null = res.locals.folderId;
      if (req.body.name !== undefined) {
        name = req.body.name.toLowerCase();
        displayName = req.body.name;
      } else {
        name = req.file.originalname.toLowerCase();
        displayName = req.file.originalname;
      }
      const Files = db<File>('files');
      const file = await Files.where({
        name,
        folder_id: folderId ?? null,
        user_id: req.user?.id
      }).first();
      if (file !== undefined) {
        if (req.file !== undefined) {
          await deleteObject(req.file);
        }
        return res.status(400).json({ error: `${displayName} already exists` });
      }

      const newFile = await Files.insert({
        displayName,
        name,
        folder_id: folderId ?? null,
        link: req.file.location,
        s3_key: req.file.key,
        user_id: req.user?.id,
        mimetype: req.file.mimetype,
        history: JSON.stringify([{ event: 'Created', date: new Date() }])
      }, ['id']);
      return res.status(201).json({
        message: 'File succesfully uploaded',
        id: newFile[0].id,
        folderId: folderId ?? null,
        file_name: name
      });
    } catch (error) {
      if (req.file !== undefined) {
        deleteObject(req.file)
          .then()
          .catch(() => {
            console.log('Bad Request');
          });
      }
      console.log(error);
      if (error instanceof RequestBodyError) {
        return res.status(400).json({ error: error.message });
      }
      /* eslint-disable @typescript-eslint/strict-boolean-expressions */
      // @ts-expect-error: Unreachable code error
      if (error?.message?.includes('unique')) {
        return res.status(400).json({ error: `${displayName} already exists` });
      }
      next(error);
    }
  }

  static async addFolder (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    const { name } = req.body;
    try {
      validateNewFolderBody(req.body);

      const Folders = db<Folder>('folders');
      const folder = await Folders.where({
        name: name.toLowerCase(),
        user_id: req.user?.id
      }).first();
      if (folder !== undefined) {
        return res.status(400).json({ error: `${name} folder already exists` });
      }
      await Folders.insert({
        name: name.toLowerCase(),
        displayName: name,
        user_id: req.user?.id
      });
      res.status(201).json({ message: `${name} folder succesfully created` });
    } catch (error) {
      if (error instanceof RequestBodyError) {
        return res.status(400).json({ error: error.message });
      }
      // @ts-expect-error: Unreachable code error
      if (error?.message?.includes('unique')) {
        return res.status(400).json({ error: `${name} folder already exists` });
      }
      next(error);
    }
  }

  static async moveFile (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    const { fileName } = req.body;
    const { folderName } = req.params;
    try {
      const { folderId, fileId, fileHistory, source } = res.locals;
      let message: string = `${fileName} moved from ${source} to `;
      if (folderName !== 'null') {
        message += `${folderName}`;
      } else {
        message += 'root directory';
      }

      const date = new Date();
      fileHistory.push({ event: message, date });
      const Files = db<File>('files');
      await Files.where({
        id: fileId
      }).update({
        folder_id: folderId,
        history: JSON.stringify(fileHistory),
        updated_at: date
      });
      return res.status(201).json({ message });
    } catch (error) {
      // @ts-expect-error: Unreachable code error
      if (error?.message?.includes('unique')) {
        return res.status(400).json({ error: `${fileName} already exists in ${folderName} folder` });
      }
      next(error);
    }
  }

  static async getAllFiles (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    try {
      let files: File[];
      if (!req.user?.is_superuser) {
        files = await db.where(
          'files.user_id', req.user?.id
        ).select(
          'files.id as file_id',
          'files.displayName as file_name',
          'files.mimetype as file_type',
          'folders.displayName as folder_name',
          'files.history as file_history'
        ).from('files')
          .leftJoin('folders', 'files.folder_id', 'folders.id');
      } else {
        files = await db
          .select(
            'files.id as file_id',
            'files.user_id as file_user_id',
            'files.displayName as file_name',
            'files.mimetype as file_type',
            'folders.displayName as folder_name',
            'files.history as file_history'
          ).from('files')
          .leftJoin('folders', 'files.folder_id', 'folders.id');
      }
      files.forEach((file) => {
        file.download_link = `${process.env.HOST}/files/download/${file.file_id}?token=${req.user?.token}`;
      });
      return res.status(200).json({ files });
    } catch (error) {
      next(error);
    }
  }

  static async getFolderFiles (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    try {
      const { folderName } = req.params;
      const subquery = await db<Folder>('folders')
        .where({
          user_id: req.user?.id,
          name: folderName.toLowerCase()
        }).first('id');
      if (subquery === undefined) {
        return res.status(404).json({ error: `You do not have a folder named ${folderName}` });
      }
      const files = await db<File>('files')
        .where('folder_id', '=', subquery.id)
        .select(
          'files.id as file_id',
          'files.displayName as file_name',
          'files.history as file_history'
        );
      files.forEach((file) => {
        file.download_link = `${process.env.HOST}/files/download/${file.file_id}?token=${req.user?.token}`;
      });
      return res.status(200).json({ files });
    } catch (error) {
      next(error);
    }
  }

  static async localGetFolderFiles (folderId: string): Promise<Array<{ s3_key: string }>> {
    const files = await db<File>('files')
      .where('folder_id', '=', folderId)
      .select('s3_key');
    return files;
  }

  static async getAllFolders (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    try {
      const folders = await db.where(
        'folders.user_id', req.user?.id
      ).select(
        db.raw(
          '"folders"."displayName" as folder_name, count(files.name) as file_count'
        )
      ).from('folders')
        .innerJoin('files', 'files.folder_id', 'folders.id')
        .groupBy('folder_name');

      folders.forEach((folder) => {
        folder.file_count = Number(folder.file_count);
      });
      return res.status(200).json({ folders });
    } catch (error) {
      next(error);
    }
  }

  static async updateFolder (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    try {
      validateUpdateFolderBody(req.body);
      const { folderName } = req.params;
      const updates = { updated_at: new Date() };
      if (req.body.name !== undefined) {
        // @ts-expect-error: Unreachable code error
        updates.name = req.body.name.toLowerCase();
        // @ts-expect-error: Unreachable code error
        updates.displayName = req.body.name;
      }
      if (Object.keys(updates).length > 1) {
        const subquery = await db<Folder>('folders')
          .where({
            user_id: req.user?.id,
            name: folderName.toLowerCase()
          }).first('id');
        if (subquery === undefined) {
          return res.status(404).json({ error: `You do not have a folder named ${folderName}` });
        }
        await db<Folder>('folders')
          .update(updates)
          .where('id', '=', subquery.id);
        return res.status(201).json({
          // @ts-expect-error: Unreachable code error
          message: `${folderName} folder successfully updated to ${updates.displayName}`
        });
      }
      return res.status(400).json({ error: 'No field specified to update' });
    } catch (error) {
      if (error instanceof RequestBodyError) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  static async updateFile (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    try {
      validateUpdateFileBody(req.body);
      const fileId: string = req.params.fileId;
      if (!isUUID(fileId, 4)) {
        return res.status(400).json({ error: 'Invalid file id' });
      }
      const date = new Date();
      const updates: {
        updated_at: Date
        history: string
      } = { updated_at: date, history: '[]' };
      if (req.body.name !== undefined) {
        // @ts-expect-error: Unreachable code error
        updates.name = req.body.name.toLowerCase();
        // @ts-expect-error: Unreachable code error
        updates.displayName = req.body.name;
      }
      if (Object.keys(updates).length > 2) {
        const subquery = await db<File>('files')
          .where({
            user_id: req.user?.id,
            id: fileId
          }).first('id', 'displayName', 'history');
        if (subquery === undefined) {
          return res.status(404).json({
            error: 'File not found. Please check file id in the URL.'
          });
        }
        // @ts-expect-error: Unreachable code error
        const message = `Name changed from ${subquery.displayName} to ${updates.displayName}`;
        const fileHistory = subquery.history as Array<{ event: string, date: Date }>;
        fileHistory.push({ event: message, date });

        updates.history = JSON.stringify(fileHistory);
        await db<File>('files')
          .update(updates)
          .where('id', '=', fileId);
        return res.status(201).json({ message });
      }
      return res.status(400).json({ error: 'No valid field specified to update' });
    } catch (error) {
      if (error instanceof RequestBodyError) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  static async deleteFile (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    try {
      const fileId: string = req.params.fileId;
      if (!isUUID(fileId, 4)) {
        return res.status(400).json({ error: 'Invalid file id' });
      }
      const subquery = await db<File>('files')
        .where({
          user_id: req.user?.id,
          id: fileId
        }).first('id', 'displayName', 's3_key');
      if (subquery === undefined) {
        return res.status(404).json({
          error: 'File not found. Please check file id in the URL.'
        });
      }
      deleteObject({ key: subquery.s3_key })
        .catch(() => {
          console.log(`Didn't delete ${subquery.s3_key}`);
        });

      await db<File>('files')
        .del()
        .where('id', '=', fileId);

      return res.status(200).json({
        message: `${subquery.displayName} successfully deleted`
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteFolder (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    try {
      const { folderName } = req.params;
      const subquery = await db<Folder>('folders')
        .where({
          user_id: req.user?.id,
          name: folderName.toLowerCase()
        }).first('id');
      if (subquery === undefined) {
        return res.status(404).json({ error: `You do not have a folder named ${folderName}` });
      }

      const folderFiles = await FileController.localGetFolderFiles(subquery.id);
      folderFiles.forEach((file) => {
        deleteObject({ key: file.s3_key })
          .then(() => {
            console.log(`Deleted ${file.s3_key}`);
          })
          .catch(() => {
            console.log(`Didn't delete ${file.s3_key}`);
          });
      });

      await db<Folder>('folders')
        .del()
        .where('id', '=', subquery.id);

      return res.status(200).json({
        message: `${folderName} successfully deleted`
      });
    } catch (error) {
      next(error);
    }
  }

  static async download (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    try {
      const fileId: string = req.params.fileId;
      if (!isUUID(fileId, 4)) {
        return res.status(400).json({ error: 'Invalid file id' });
      }
      const Files = db<File>('files');
      let file: File | undefined;

      if (req.user?.is_superuser) {
        file = await Files.where({
          id: fileId
        }).first('id', 's3_key', 'mimetype');
      } else {
        file = await Files.where({
          user_id: req.user?.id,
          id: fileId
        }).first('id', 's3_key', 'mimetype');
      }

      if (file === undefined) {
        return res.status(404).json({ error: 'File not found. Please check file id in the URL.' });
      }
      const stream = await createReadStream(file.s3_key);
      stream.pipe(res);
    } catch (error) {
      if (error instanceof NoSuchKey ||
        error instanceof NotFound) {
        return res.status(404).json({ error: 'File not found in storage' });
      }
      next(error);
    }
  }

  static async stream (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    try {
      const fileId: string = req.params.fileId;
      if (!isUUID(fileId, 4)) {
        return res.status(400).json({ error: 'Invalid file id' });
      }

      const Files = db<File>('files');
      let file: File | undefined;

      if (req.user?.is_superuser) {
        file = await Files.where({
          id: fileId
        }).first('id', 's3_key', 'mimetype');
      } else {
        file = await Files.where({
          user_id: req.user?.id,
          id: fileId
        }).first('id', 's3_key', 'mimetype');
      }

      if (file === undefined) {
        return res.status(404).json({ error: 'File not found. Please check file id in the URL.' });
      }
      if (!file.mimetype.startsWith('video') && !file.mimetype.startsWith('audio')) {
        return res.status(400).json({ error: 'File requested for is neither a video nor audio' });
      }
      res.render('stream', { file, token: req.user?.token });
    } catch (error) {
      if (error instanceof NoSuchKey ||
        error instanceof NotFound) {
        return res.status(404).json({ error: 'File not found in storage' });
      }
      next(error);
    }
  }

  static async review (req: Request, res: Response, next: NextFunction): Promise<FinalResponse> {
    try {
      validateFileReviewBody(req.body);
      const date = new Date();
      const fileId: string = req.params.fileId;
      if (!isUUID(fileId, 4)) {
        return res.status(400).json({ error: 'Invalid file id' });
      }

      const Files = db<File>('files');
      const file = await Files.where({
        id: fileId
      }).first('s3_key', 'displayName', 'false_review_by', 'history');
      if (file === undefined) {
        return res.status(404).json({ error: 'File not found. Please check file id in the URL.' });
      }

      const falseAdminReviews = file.false_review_by as string[];
      const fileHistory = file.history as Array<{ event: string, date: Date }>;
      const safe = req.body.safe as boolean;

      let message: string;
      if (!safe && !falseAdminReviews.includes(req.user?.id as string)) {
        message = `${file.displayName} marked as unsafe by an Admin`;
        fileHistory.push({ event: message, date });
        falseAdminReviews.push(req.user?.id as string);
        await db<File>('files').where({
          id: fileId
        }).update({
          updated_at: date,
          history: JSON.stringify(fileHistory),
          false_review_by: JSON.stringify(falseAdminReviews)
        });
      } else if (!safe && falseAdminReviews.includes(req.user?.id as string)) {
        message = `${file.displayName} already marked as unsafe by you`;
      } else if (safe && falseAdminReviews.includes(req.user?.id as string)) {
        const index: number = falseAdminReviews.indexOf(req.user?.id as string);
        falseAdminReviews.splice(index, 1);
        message = `${file.displayName} marked as safe by an Admin that marked as unsafe previously`;
        fileHistory.push({ event: message, date });
        await db<File>('files').where({
          id: fileId
        }).update({
          updated_at: date,
          history: JSON.stringify(fileHistory),
          false_review_by: JSON.stringify(falseAdminReviews)
        });
      } else {
        message = `${file.displayName} marked as safe by an Admin`;
        fileHistory.push({ event: message, date });
        await db<File>('files').where({
          id: fileId
        }).update({
          updated_at: date,
          history: JSON.stringify(fileHistory)
        });
      }

      if (falseAdminReviews.length >= 3) {
        deleteObject({ key: file.s3_key })
          .catch(() => {
            console.log(`Didn't delete ${file.s3_key}`);
          });
        await db<File>('files').where({
          id: fileId
        }).del();
        res.status(201).json({
          message: `${file.displayName} marked as unsafe by 3 admins and automatically deleted`
        });
      } else {
        res.status(201).json({ message });
      }
    } catch (error) {
      if (error instanceof RequestBodyError) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }
}

export default FileController;
