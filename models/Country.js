import { sequelize, DataTypes } from './sequelize.js'

const Country = sequelize.define(
  'Country',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    countryName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
  },
  {
    tableName: 'countries',
    timestamps: true,
  }
)

export default Country
