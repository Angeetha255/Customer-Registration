import { sequelize, DataTypes } from './sequelize.js'

const Company = sequelize.define(
  'Company',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    businessName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    mobileNumber: { type: DataTypes.STRING, allowNull: true },
    ownerName: { type: DataTypes.STRING, allowNull: true },
    yearOfEstablishment: { type: DataTypes.INTEGER, allowNull: true },
    gstNumber: { type: DataTypes.STRING, allowNull: true },
    yearlyTurnover: { type: DataTypes.STRING, allowNull: true },
    numberOfEmployees: { type: DataTypes.INTEGER, allowNull: true },
    country: { type: DataTypes.STRING, defaultValue: 'India' },
    state: { type: DataTypes.STRING, allowNull: false },
    district: { type: DataTypes.STRING, allowNull: false },
    area: { type: DataTypes.STRING, allowNull: false },
    pincode: { type: DataTypes.STRING, allowNull: false },
    mapLink: { type: DataTypes.TEXT, allowNull: true, field: 'map_link' },
    createdBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
    },
  },
  {
    tableName: 'company',
    timestamps: false,
  }
)

export default Company