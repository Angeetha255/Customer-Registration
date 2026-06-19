// import { Sequelize, DataTypes } from 'sequelize'
// import dotenv from 'dotenv'

// dotenv.config()

// const MYSQL_URI = process.env.MYSQL_URI || process.env.DATABASE_URL || 'mysql://root:password@127.0.0.1:3306/customer_management'

// const sequelize = new Sequelize(MYSQL_URI, {
//   logging: false,
//   define: {
//     timestamps: false,
//   },
// })

// export { sequelize, DataTypes }
import { Sequelize, DataTypes } from 'sequelize'
import 'dotenv/config' // 

const sequelize = new Sequelize(
  process.env.DB_NAME || 'customer_management', 
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '', 
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    define: {
      timestamps: false,
    },
  }
)

export { sequelize, DataTypes }