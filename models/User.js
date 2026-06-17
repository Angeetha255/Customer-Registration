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
    // referredBy: primary key of the user who referred this user
    referredBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    referralCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    role: { type: DataTypes.ENUM('customer', 'admin'), defaultValue: 'customer' },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
    registeredAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    resetPasswordToken: { type: DataTypes.STRING, allowNull: true },
    resetPasswordExpires: { type: DataTypes.DATE, allowNull: true },
    // ── Binary-tree placement ──────────────────────────────────────────────
    // placementId: the parent node's primary key in the binary tree
    placementId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
    },
    // position: which side of the parent this user occupies
    position: {
      type: DataTypes.ENUM('LEFT', 'RIGHT'),
      allowNull: true,
    },
  },
  {
    tableName: 'users',
  }
)

// Fields that must never appear in any API response
export const HIDDEN_FIELDS = [
  'password',
  'resetPasswordToken',
  'resetPasswordExpires',
  'placementId',
  'position',
]

export default User
