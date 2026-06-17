import { sequelize, DataTypes } from './index.js'

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
   
    password: { type: DataTypes.STRING, allowNull: false },
    //customerId: { type: DataTypes.STRING, unique: true },
    introducerId: { type: DataTypes.STRING, unique: true },
    referredBy: { type: DataTypes.STRING, allowNull: true },
    referralCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    role: { type: DataTypes.ENUM('customer', 'admin'), defaultValue: 'customer' },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
    registeredAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    resetPasswordToken: { type: DataTypes.STRING, allowNull: true },
    resetPasswordExpires: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'users',
  }
)

export default User
