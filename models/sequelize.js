import { Sequelize, DataTypes } from 'sequelize'
import 'dotenv/config'

const sequelize = new Sequelize(
  process.env.DB_NAME || 'customer_management',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
)

export { sequelize, DataTypes }
export default sequelize
