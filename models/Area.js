import { sequelize, DataTypes } from './sequelize.js'

const Area = sequelize.define(
  'Area',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    districtId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'districts', key: 'id' },
      onDelete: 'CASCADE',
    },
    areaName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
  },
  {
    tableName: 'areas',
    timestamps: true,
  }
)

export default Area