import express, { Request, Response } from 'express'
import multer from 'multer'
import mysql from 'mysql2/promise'
import nodemailer from 'nodemailer'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// Configure Multer to use in-memory storage.
const upload = multer({ storage: multer.memoryStorage() })

// Serve static files from the public directory (the built Vue assets)
app.use(express.static(path.join(__dirname, 'public')))

// Create an interface to extend the Request with Multer file info.
interface MulterRequest extends Request {
  file: Express.Multer.File
}

// Function to initialize the database and auto-create the table if it doesn't exist.
async function initDb(): Promise<void> {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    })

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS uploads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        nickname VARCHAR(255) NOT NULL,
        image LONGBLOB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
    await connection.execute(createTableQuery)
    await connection.end()
    console.log('Database initialized and table ensured.')
  } catch (error) {
    console.error('Error initializing database', error)
  }
}

// POST route via a traditional form submission (no separate API)
app.post('/upload', upload.single('photo'), async (req: Request, res: Response) => {
  try {
    const { email, nickname } = req.body
    const fileReq = req as MulterRequest
    const photoBuffer = fileReq.file.buffer
    const originalName = fileReq.file.originalname

    // Insert upload details into the SQL database.
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    })
    await connection.execute('INSERT INTO uploads (email, nickname, image) VALUES (?, ?, ?)', [
      email,
      nickname,
      photoBuffer,
    ])
    await connection.end()

    // Prepare Nodemailer transporter configuration.
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    // Compose an email in Traditional Chinese greeting the user by nickname.
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `您的 Deepfake 照片`,
      text: `Hi ${nickname},

這是您上傳的照片。請查收附件中的照片。

如果您有任何疑問或需要進一步協助，歡迎隨時與我們聯絡。

Best regards,
MetaX Innovation Limited`,
      attachments: [
        {
          filename: originalName,
          content: photoBuffer,
        },
      ],
    }

    await transporter.sendMail(mailOptions)

    // Redirect back to the homepage with a success flag.
    res.redirect('/?success=1')
  } catch (error) {
    console.error(error)
    res.status(500).send('發生錯誤，請稍後再試。')
  }
})

// First, initialize the database and then start the server.
const PORT: number = Number(process.env.PORT) || 3000
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
  })
})
