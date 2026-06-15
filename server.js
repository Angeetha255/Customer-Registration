/* global process */
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import customerRoutes from './routes/customers.js'
import User from './models/User.js'
import bcrypt from 'bcrypt'
import { sequelize } from './models/index.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/customer-management'

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/customers', customerRoutes)

app.get('/', (_req, res) => {
  res.send({ message: 'Customer Registration and Management API is running.' })
})

async function createDefaultAdmin() {
  const existingAdmin = await User.findOne({ where: { role: 'admin' } })
  if (existingAdmin) return

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!'
  const hashedPassword = await bcrypt.hash(adminPassword, 10)
  await User.create({
    name: 'Admin User',
    email: adminEmail,
    phone: process.env.ADMIN_PHONE || '0000000000',
    password: hashedPassword,
    role: 'admin',
    registeredAt: new Date(),
  })
  console.log(`Default admin created: ${adminEmail}`)
}

const start = async () => {
  try {
    await sequelize.authenticate()
    // In development, allow Sequelize to alter tables to match models (adds new columns like `active`).
    // Avoid using `alter` in production.
    const syncOptions = process.env.NODE_ENV === 'production' ? {} : { alter: true }
    await sequelize.sync(syncOptions)
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
