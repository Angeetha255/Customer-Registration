import { sequelize, DataTypes } from './sequelize.js'

const State = sequelize.define(
  'State',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    stateName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    countryId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'country_id',
      references: {
        model: 'countries',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
  },
  {
    tableName: 'states',
    timestamps: true,
  }
)

export default State