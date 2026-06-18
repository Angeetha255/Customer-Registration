import { sequelize, DataTypes } from './index.js'

const Settings = sequelize.define(
  'Settings',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    key: { type: DataTypes.STRING, allowNull: false, unique: true },
    value: { type: DataTypes.STRING, allowNull: false },
  },
  {
    tableName: 'settings',
  }
)

export default Settings
