import { sequelize, DataTypes } from './sequelize.js'

const District = sequelize.define(
  'District',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    stateId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'states', key: 'id' },
      onDelete: 'CASCADE',
    },
    districtName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
  },
  {
    tableName: 'districts',
    timestamps: true,
  }
)

export default District