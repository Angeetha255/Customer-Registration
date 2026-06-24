import { sequelize, DataTypes } from './index.js'

const Counter = sequelize.define(
  'Counter',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    seq: { type: DataTypes.INTEGER, defaultValue: 10000 },
  },
  {
    tableName: 'counters',
  }
)

export default Counter
