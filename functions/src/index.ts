/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from 'firebase-functions';

import * as v2 from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import archiver from 'archiver';
import cors from 'cors';

setGlobalOptions({ maxInstances: 10 });

admin.initializeApp();

const corsHandler = cors({ origin: true });

export const createZip = v2.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { items, includeSubdirectories, baseDirectory } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).send('Please provide an array of items.');
      return;
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="archiwum.zip"`);

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    archive.on('error', (err: Error) => {
      console.error('Archiver error:', err);
      if (!res.headersSent) {
        res.status(500).send('Archive creation failed.');
      }
    });

    archive.pipe(res);

    const bucket = admin.storage().bucket();

    try {
      const getFilesFromFolder = async (
        folderPath: string
      ): Promise<string[]> => {
        const [files] = await bucket.getFiles({
          prefix: folderPath,
          autoPaginate: true,
        });

        return files
          .map((file) => file.name)
          .filter((name) => !name.endsWith('/'))
          .filter((name) => !name.endsWith('.placeholder'));
      };

      let allFilePaths: string[] = [];

      for (const item of items) {
        if (item.type === 'file') {
          if (!item.fullPath.endsWith('.placeholder')) {
            allFilePaths.push(item.fullPath);
          }
        } else if (item.type === 'folder' && includeSubdirectories) {
          const folderFiles = await getFilesFromFolder(item.fullPath);
          allFilePaths = [...allFilePaths, ...folderFiles];
        }
      }

      allFilePaths = [...new Set(allFilePaths)];

      for (const filePath of allFilePaths) {
        const file = bucket.file(filePath);
        const [exists] = await file.exists();

        if (!exists) {
          console.warn(`File ${filePath} does not exist, skipping.`);
          continue;
        }

        let archiveName = filePath;
        if (baseDirectory && filePath.startsWith(baseDirectory)) {
          archiveName = filePath.substring(baseDirectory.length);
          if (archiveName.startsWith('/')) {
            archiveName = archiveName.substring(1);
          }
        }

        const fileReadStream = file.createReadStream();

        fileReadStream.on('error', (err) => {
          console.error(`Error reading file ${filePath}:`, err);
        });

        archive.append(fileReadStream, { name: archiveName });
      }

      await archive.finalize();
    } catch (error) {
      console.error('Error creating archive:', error);
      if (!res.headersSent) {
        res.status(500).send('Internal server error.');
      }
    }
  });
});
