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
    regat: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    userId: { type: DataTypes.STRING, allowNull: true, unique: true },
    refid: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    refcount: { type: DataTypes.INTEGER, defaultValue: 0 },
    refactcount: { type: DataTypes.INTEGER, defaultValue: 0 },
    teamcount: { type: DataTypes.INTEGER, defaultValue: 0 },
    teamactcount: { type: DataTypes.INTEGER, defaultValue: 0 },
    active: { type: DataTypes.BOOLEAN, defaultValue: false },
    password: { type: DataTypes.STRING, allowNull: false },
    pwdtoken: { type: DataTypes.STRING, allowNull: true },
    pwdexp: { type: DataTypes.DATE, allowNull: true },
    placeid: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
    },
    position: {
      type: DataTypes.ENUM('LEFT', 'RIGHT'),
      allowNull: true,
    },
    DOJ: { type: DataTypes.DATE, allowNull: true },
    DOA: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'users',
  }
)

// Fields that must NEVER appear in any API response
export const HIDDEN_FIELDS = [
  'password',
  'pwdtoken',
  'pwdexp',
  'DOJ',
  'DOA',
]

export default User
