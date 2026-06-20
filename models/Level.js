import { sequelize, DataTypes } from './index.js'

const Level = sequelize.define(
  'Level',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    joiner: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    sponsor: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    level: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    tableName: 'levels',
    indexes: [
      {
        fields: ['sponsor', 'level'],
      },
      {
        fields: ['joiner'],
      },
    ],
  }
)

export default Level