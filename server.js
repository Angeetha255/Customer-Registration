/* global process */
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import Admin from './models/Admin.js'
import bcrypt from 'bcrypt'
import { sequelize } from './models/index.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)

app.get('/', (_req, res) => {
  res.send({ message: 'User Registration and Management API is running.' })
})

async function createDefaultAdmin() {
  const existingAdmin = await Admin.findOne({ where: { email: process.env.ADMIN_EMAIL || 'admin@example.com' } })
  if (existingAdmin) return

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!'
  const hashedPassword = await bcrypt.hash(adminPassword, 10)
  await Admin.create({
    name: 'Admin User',
    email: adminEmail,
    phone: process.env.ADMIN_PHONE || '0000000000',
    password: hashedPassword,
    registeredAt: new Date(),
  })
  console.log(`Default admin created: ${adminEmail}`)
}

const start = async () => {
  try {
    await sequelize.authenticate()
    // Sync models without forcing ALTER operations to avoid repeated index/schema changes
    // If you need schema changes, run migrations or enable alter temporarily.
    await sequelize.sync()
    console.log('Connected to MySQL via Sequelize')
    await createDefaultAdmin()
    const server = app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`)
    })

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please stop the other process or change PORT.`)
        process.exit(1)
      }
      throw err
    })
  } catch (error) {
    console.error('Database connection error:', error)
  }
}

start()
