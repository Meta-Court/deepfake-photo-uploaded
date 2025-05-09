import type { VercelRequest, VercelResponse } from '@vercel/node'
import formidable, { File as FormidableFile } from 'formidable'
import { config as dotenvConfig } from 'dotenv'
import fs from 'fs'
import nodemailer from 'nodemailer'
import mssql from 'mssql'

// Load environment variables
dotenvConfig()

export const config = {
  api: {
    bodyParser: false,
  },
}

const dbConfig = {
  user: process.env.DATABASE_USER || '',
  password: process.env.DATABASE_PASSWORD || '',
  server: process.env.DATABASE_HOST || '',
  port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT) : 1433,
  database: process.env.DATABASE_NAME || '',
  connectionTimeout: process.env.DATABASE_TIMEOUT ? parseInt(process.env.DATABASE_TIMEOUT) : 15000, // in ms
  requestTimeout: 15000, // in ms
  options: {
    encrypt: true, // required for Azure SQL or secure connections
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
}

function parseForm(
  req: VercelRequest,
): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
  const form = formidable({ multiples: false })
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err)
      resolve({ fields, files })
    })
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { fields, files } = await parseForm(req)
    const email = Array.isArray(fields.email) ? fields.email[0] : fields.email || ''
    const nickname = Array.isArray(fields.nickname) ? fields.nickname[0] : fields.nickname || ''
    const photoFile = files.photo
      ? ((Array.isArray(files.photo) ? files.photo[0] : files.photo) as FormidableFile)
      : undefined

    if (!email || !nickname || !photoFile?.filepath) {
      return res.status(400).json({ error: '缺少必要的欄位或文件' })
    }

    // Read file buffer
    const fileBuffer = fs.readFileSync(photoFile.filepath)

    // Connect to SQL Server and insert record
    const pool = await mssql.connect(dbConfig)
    const query = `
      INSERT INTO Uploads (Email, Nickname, Photo)
      VALUES (@Email, @Nickname, @Photo);
    `
    await pool
      .request()
      .input('Email', mssql.NVarChar(255), email)
      .input('Nickname', mssql.NVarChar(50), nickname)
      .input('Photo', mssql.VarBinary(mssql.MAX), fileBuffer)
      .query(query)
    await pool.close()

    // Create a nodemailer transporter using the .env settings
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })

    // Compose a polite email in traditional Chinese
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '感謝您的照片上傳',
      text: `尊敬的使用者您好，

感謝您使用我們的 AI 深度偽造照片上傳平台。我們已成功收到您上傳的照片，並將進一步處理。若您有任何疑問，請隨時與我們聯繫。

祝您有美好的一天！

此致
敬禮`,
      attachments: [
        {
          filename: photoFile.originalFilename || 'uploaded_photo',
          content: fileBuffer,
        },
      ],
    }

    await transporter.sendMail(mailOptions)

    return res.status(200).json({ message: '上傳成功，請查收您的電子郵件。' })
  } catch (error) {
    console.error('上傳處理錯誤：', error)
    return res.status(500).json({ error: '伺服器錯誤，請稍後再試。' })
  }
}
