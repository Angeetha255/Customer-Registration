import { sequelize, DataTypes } from './index.js'

const Admin = sequelize.define(
  'Admin',
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
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
    registeredAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    resetPasswordToken: { type: DataTypes.STRING, allowNull: true },
    resetPasswordExpires: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'admins',
  }
)

export default Admin
