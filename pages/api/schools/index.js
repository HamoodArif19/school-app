import { IncomingForm } from "formidable";
import fs from "fs";
import path from "path";
import pool from "../../../lib/db";
import { v2 as cloudinary } from "cloudinary";

export const config = {
  api: {
    bodyParser: false,
  },
};

const getValue = (field) => (Array.isArray(field) ? field[0] : field ?? "");

if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// const parseForm = (req) =>
//   new Promise((resolve, reject) => {
//     const form = new IncomingForm({ multiples: false, keepExtensions: true });
//     form.parse(req, (err, fields, files) => {
//       if (err) reject(err);
//       else resolve({ fields, files });
//     });

//   });
const parseForm = (req) =>
  new Promise((resolve, reject) => {
    const form = new IncomingForm({
      multiples: false,
      keepExtensions: true,
    });

    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });

//const name = getValue(fields.name).toString().trim();

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const [rows] = await pool.query(
        "SELECT id, name, address, city, state, contact, image, email_id FROM schools ORDER BY id DESC"
      );
      res.status(200).json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "DB error" });
    }
    return;
  }

  if (req.method === "POST") {
    try {
      const { fields, files } = await parseForm(req);

      // basic validation
      const name = getValue(fields.name).trim();
      const address = getValue(fields.address).trim();
      const city = getValue(fields.city).trim();
      const state = getValue(fields.state).trim();
      const contactRaw = getValue(fields.contact).trim();
      const contact = contactRaw ? Number(contactRaw) : null;
      const email_id = getValue(fields.email_id).trim();

      if (!name || !email_id) {
        res.status(400).json({ message: "name and email_id are required" });
        return;
      }

      // let imagePath = null;

      // if (files && files.image) {
      //   const file = files.image;
      //   // If Cloudinary configured -> upload to cloud
      //   if (process.env.CLOUDINARY_CLOUD_NAME) {
      //     const result = await cloudinary.uploader.upload(
      //       file.filepath || file.path,
      //       {
      //         folder: "schoolImages",
      //       }
      //     );
      //     imagePath = result.secure_url;
      //   } else {
      //     // Save to public/schoolImages
      //     // const publicDir = path.join(process.cwd(), "public", "schoolImages");
      //     // if (!fs.existsSync(publicDir))
      //     //   fs.mkdirSync(publicDir, { recursive: true });
      //     // const ext =
      //     //   path.extname(
      //     //     file.originalFilename || file.newFilename || file.name
      //     //   ) || ".jpg";
      //     // const fileName = `${Date.now()}-${(
      //     //   file.originalFilename || "image"
      //     // ).replace(/\s+/g, "-")}${ext}`;

      //     // determine extension safely
      //     let ext = ".jpg";
      //     if (file.mimetype) {
      //       if (file.mimetype.includes("png")) ext = ".png";
      //       else if (file.mimetype.includes("jpeg")) ext = ".jpg";
      //       else if (file.mimetype.includes("webp")) ext = ".webp";
      //     }

      //     // ensure upload directory exists
      //     const publicDir = path.join(process.cwd(), "public", "schoolImages");
      //     if (!fs.existsSync(publicDir)) {
      //       fs.mkdirSync(publicDir, { recursive: true });
      //     }

      //     // generate filename safely
      //     const fileName = `${Date.now()}${ext}`;
      //     const destPath = path.join(publicDir, fileName);

      //     // move file
      //     fs.renameSync(file.filepath, destPath);

      //     // save relative path in DB
      //     imagePath = `/schoolImages/${fileName}`;

      //     const dest = path.join(publicDir, fileName);

      //     // move
      //     fs.renameSync(file.filepath || file.path, dest);
      //     imagePath = `/schoolImages/${fileName}`;
      //   }
      // }

      // let imagePath = null;

      // if (files && files.image) {
      //   const file = files.image;

      //   // determine extension safely
      //   let ext = ".jpg";
      //   if (file.mimetype) {
      //     if (file.mimetype.includes("png")) ext = ".png";
      //     else if (file.mimetype.includes("jpeg")) ext = ".jpg";
      //     else if (file.mimetype.includes("webp")) ext = ".webp";
      //   }

      //   // ensure upload directory exists
      //   const publicDir = path.join(process.cwd(), "public", "schoolImages");
      //   if (!fs.existsSync(publicDir)) {
      //     fs.mkdirSync(publicDir, { recursive: true });
      //   }

      //   // generate filename
      //   const fileName = `${Date.now()}${ext}`;
      //   const destPath = path.join(publicDir, fileName);

      //   // get temp path (formidable v2/v3 safe)
      //   const tempPath = file.filepath || file.path;
      //   if (!tempPath) {
      //     throw new Error("File upload failed: temp path missing");
      //   }

      //   // move file
      //   fs.renameSync(tempPath, destPath);

      //   // save path for DB
      //   imagePath = `/schoolImages/${fileName}`;
      // }

      let imagePath = null;

      if (files && Object.keys(files).length > 0) {
        // Try common key names (the client used 'image', but be defensive)
        const possibleKeys = ["image", "file", "upload"];
        let file = null;

        for (const k of possibleKeys) {
          if (files[k]) {
            file = files[k];
            break;
          }
        }

        // If still not found, use the first file entry in object
        if (!file) {
          const firstKey = Object.keys(files)[0];
          file = files[firstKey];
        }

        // If formidable returned an array for the file, pick first element
        const fileItem = Array.isArray(file) ? file[0] : file;

        // Get the temp path (cover both possible properties)
        const tempPath = fileItem?.filepath || fileItem?.path;

        if (!tempPath) {
          // Helpful debug response for dev: show what 'files' object looked like
          console.error(
            "Upload arrived but no temp path found. files object:",
            files
          );
          // send back structure so you can inspect from client/network tab
          res
            .status(400)
            .json({ message: "File upload failed: temp path missing", files });
          return;
        }

        // Determine extension from mimetype (safer)
        let ext = ".jpg";
        if (fileItem.mimetype) {
          if (fileItem.mimetype.includes("png")) ext = ".png";
          else if (fileItem.mimetype.includes("jpeg")) ext = ".jpg";
          else if (fileItem.mimetype.includes("webp")) ext = ".webp";
        }

        // ensure upload dir exists
        const publicDir = path.join(process.cwd(), "public", "schoolImages");
        if (!fs.existsSync(publicDir))
          fs.mkdirSync(publicDir, { recursive: true });

        const fileName = `${Date.now()}${ext}`;
        const destPath = path.join(publicDir, fileName);

        // Move file from temp to public dir
        fs.renameSync(tempPath, destPath);

        imagePath = `/schoolImages/${fileName}`;
      } else {
        // No files were sent. If image is optional, that's OK — otherwise return an error:
        // res.status(400).json({ message: 'No file was uploaded', fields, files });
        // return;
        console.log("No files object in parsed form. fields:", fields);
      }

      // Insert into DB
      const [result] = await pool.query(
        "INSERT INTO schools (name, address, city, state, contact, image, email_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [name, address, city, state, contact, imagePath, email_id]
      );

      const insertedId = result.insertId;
      res.status(201).json({ message: "School added", id: insertedId });
    } catch (err) {
      console.error("POST /api/schools error:", err);
      res.status(500).json({ message: "Server error" });
    }
    return;
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
