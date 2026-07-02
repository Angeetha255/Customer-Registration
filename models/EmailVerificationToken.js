import { DataTypes } from 'sequelize'
import { sequelize } from './sequelize.js'

const EmailVerificationToken = sequelize.define('EmailVerificationToken', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  tokenHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  redirectUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'email_verification_tokens',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['tokenHash']
    },
    {
      fields: ['email']
    },
    {
      fields: ['expiresAt']
    }
  ]
})

export default EmailVerificationToken
