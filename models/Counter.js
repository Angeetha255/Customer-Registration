import { sequelize, DataTypes } from './sequelize.js'

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
    timestamps: false,
  }
)

export default Counter
