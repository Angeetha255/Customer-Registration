import { sequelize, DataTypes } from './index.js'

const Customer = sequelize.define(
  'Customer',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    phone: { type: DataTypes.STRING, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    customerId: { type: DataTypes.STRING, unique: true },
    introducerId: { type: DataTypes.STRING, unique: true },
    referredBy: { type: DataTypes.STRING, allowNull: true },
    referralCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
    registeredAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    resetPasswordToken: { type: DataTypes.STRING, allowNull: true },
    resetPasswordExpires: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'customers',
  }
)

export default Customer
