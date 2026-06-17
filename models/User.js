import { sequelize, DataTypes } from './index.js'

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name:     { type: DataTypes.STRING,  allowNull: false },
    phone:    { type: DataTypes.STRING,  allowNull: false },
    email:    { type: DataTypes.STRING,  allowNull: false, unique: true },
    password: { type: DataTypes.STRING,  allowNull: false },

    // ── Referral ───────────────────────────────────────────────────────────
    referredBy:          { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    referralCount:       { type: DataTypes.INTEGER, defaultValue: 0 },
    // Count of directly referred users who are currently active
    referralActiveCount: { type: DataTypes.INTEGER, defaultValue: 0 },

    // ── Account ────────────────────────────────────────────────────────────
    role:   { type: DataTypes.ENUM('customer', 'admin'), defaultValue: 'customer' },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },

    // ── Dates ──────────────────────────────────────────────────────────────
    registeredAt:     { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    // dateOfJoining mirrors registeredAt — set automatically on create
    dateOfJoining:    { type: DataTypes.DATE, allowNull: true },
    // dateOfActivation — set when the user's active flag becomes true
    dateOfActivation: { type: DataTypes.DATE, allowNull: true },

    // ── Auth tokens ────────────────────────────────────────────────────────
    resetPasswordToken:   { type: DataTypes.STRING, allowNull: true },
    resetPasswordExpires: { type: DataTypes.DATE,   allowNull: true },

    // ── Binary-tree placement ──────────────────────────────────────────────
    placementId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
    },
    position: {
      type: DataTypes.ENUM('LEFT', 'RIGHT'),
      allowNull: true,
    },
  },
  {
    tableName: 'users',
  }
)

// Fields that must NEVER appear in any API response
export const HIDDEN_FIELDS = [
  'password',
  'resetPasswordToken',
  'resetPasswordExpires',
  'placementId',
  'position',
  'dateOfJoining',
  'dateOfActivation',
  'referralActiveCount',
]

export default User
