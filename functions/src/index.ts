/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";

import * as v2 from 'firebase-functions/v2'
import * as admin from "firebase-admin";
import archiver from "archiver";
import cors from "cors";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// .runWith({ timeoutSeconds: 300, memory: "1GB" })
admin.initializeApp();

const corsHandler = cors({ origin: true });

// export const createZip = v2.https.onRequest((req, res) => {
//     corsHandler(req, res, async () => {
//       // Expect a POST request
//       if (req.method !== "POST") {
//         res.status(405).send("Method Not Allowed");
//         return;
//       }

//       // Destructure the filePaths from the request body
//       const { filePaths } = req.body;

//       // Validate the input: must be a non-empty array of strings
//       if (!Array.isArray(filePaths) || filePaths.length === 0) {
//         res.status(400).send("Please provide an array of filePaths.");
//         return;
//       }

//       // Set response headers for a ZIP file download
//       res.setHeader("Content-Type", "application/zip");
//       res.setHeader("Content-Disposition", `attachment; filename="archiwum.zip"`);

//       // Create an archiver instance
//       const archive = archiver("zip", {
//         zlib: { level: 9 }, // Compression level
//       });

//       // Handle archiver errors
//       archive.on("error", (err: Error) => {
//         console.error("Archiver error:", err);
//         throw new Error(err.message);
//       });

//       // Pipe the archive stream directly to the HTTP response
//       archive.pipe(res);

//       const bucket = admin.storage().bucket();

//       // Iterate through each file path and append it to the archive
//       for (const filePath of filePaths) {
//         const file = bucket.file(filePath);
//         // Get a read stream for the file from Firebase Storage
//         const fileReadStream = file.createReadStream();
//         // Extract the file name from the path
//         const fileName = filePath.split("/").pop();

//         if (fileName) {
//           // Append the file to the archive
//           archive.append(fileReadStream, { name: fileName });
//         }
//       }

//       // Finalize the archive, which sends the response to the client
//       await archive.finalize();
//     });
//   });


export const createZip = v2.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        if (req.method !== "POST") {
            res.status(405).send("Method Not Allowed");
            return;
        }

        const { items, includeSubdirectories } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            res.status(400).send("Please provide an array of items.");
            return;
        }

        res.setHeader("Content-Type", "application/zip");
        res.setHeader("Content-Disposition", `attachment; filename="archiwum.zip"`);

        const archive = archiver("zip", {
            zlib: { level: 9 },
        });

        archive.on("error", (err: Error) => {
            console.error("Archiver error:", err);
            if (!res.headersSent) {
                res.status(500).send("Archive creation failed.");
            }
        });

        archive.pipe(res);

        const bucket = admin.storage().bucket();

        try {
            // Funkcja do rekurencyjnego pobierania plików z folderu
            const getFilesFromFolder = async (folderPath: string): Promise<string[]> => {
                const [files] = await bucket.getFiles({
                    prefix: folderPath,
                    autoPaginate: true
                });
                
                return files
                    .map(file => file.name)
                    .filter(name => !name.endsWith('/')); // Filtrujemy tylko pliki, nie katalogi
            };

            // Zbieramy wszystkie ścieżki plików do pobrania
            let allFilePaths: string[] = [];

            for (const item of items) {
                if (item.type === 'file') {
                    allFilePaths.push(item.fullPath);
                } else if (item.type === 'folder' && includeSubdirectories) {
                    const folderFiles = await getFilesFromFolder(item.fullPath);
                    allFilePaths = [...allFilePaths, ...folderFiles];
                }
            }

            // Usuwamy duplikaty na wypadek, gdyby jakiś plik był już dodany
            allFilePaths = [...new Set(allFilePaths)];

            // Dodajemy pliki do archiwum
            for (const filePath of allFilePaths) {
                const file = bucket.file(filePath);
                const [exists] = await file.exists();

                if (!exists) {
                    console.warn(`File ${filePath} does not exist, skipping.`);
                    continue;
                }

                const fileReadStream = file.createReadStream();
                
                fileReadStream.on('error', (err) => {
                    console.error(`Error reading file ${filePath}:`, err);
                });

                // Zachowujemy strukturę katalogów w archiwum
                archive.append(fileReadStream, { name: filePath });
            }

            await archive.finalize();
        } catch (error) {
            console.error("Error creating archive:", error);
            if (!res.headersSent) {
                res.status(500).send("Internal server error.");
            }
        }
    });
});