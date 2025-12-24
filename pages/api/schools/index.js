import { IncomingForm } from "formidable";
import pool from "../../../lib/db";
import { v2 as cloudinary } from "cloudinary";

export const config = {
  
  api: {
    bodyParser: false,
  },
};

// helper to normalize formidable fields
const getValue = (field) =>
  Array.isArray(field) ? field[0] : field ?? "";

// cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// parse multipart form
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

export default async function handler(req, res) {
  // ===================== GET =====================
  if (req.method === "GET") {
    try {
      const [rows] = await pool.query(
        "SELECT id, name, address, city, state, contact, image, email_id FROM schools ORDER BY id DESC"
      );
      return res.status(200).json(rows);
    } catch (err) {
      console.error("GET /api/schools error:", err);
      return res.status(500).json({ message: "DB error" });
    }
  }

  // ===================== POST =====================
  if (req.method === "POST") {
    try {
      const { fields, files } = await parseForm(req);

      // extract fields safely
      const name = getValue(fields.name).trim();
      const address = getValue(fields.address).trim();
      const city = getValue(fields.city).trim();
      const state = getValue(fields.state).trim();
      const contactRaw = getValue(fields.contact).trim();
      const contact = contactRaw ? Number(contactRaw) : null;
      const email_id = getValue(fields.email_id).trim();

      if (!name || !email_id) {
        return res
          .status(400)
          .json({ message: "name and email_id are required" });
      }

      // ================= Image Upload (Cloudinary) =================
      let imagePath = null;

      if (files && files.image) {
        const file = Array.isArray(files.image)
          ? files.image[0]
          : files.image;

        const tempPath = file.filepath || file.path;

        if (!tempPath) {
          return res
            .status(400)
            .json({ message: "Image upload failed" });
        }

        const uploadResult = await cloudinary.uploader.upload(tempPath, {
          folder: "schoolImages",
        });

        imagePath = uploadResult.secure_url;
      }

      // ================= DB INSERT =================
      const [result] = await pool.query(
        "INSERT INTO schools (name, address, city, state, contact, image, email_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [name, address, city, state, contact, imagePath, email_id]
      );

      return res.status(201).json({
        message: "School added successfully",
        id: result.insertId,
      });
    } catch (err) {
      console.error("POST /api/schools error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }

  // ===================== METHOD NOT ALLOWED =====================
  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
