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
    website: { type: DataTypes.STRING, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    yearOfEstablishment: { type: DataTypes.INTEGER, allowNull: true },
    gstNumber: { type: DataTypes.STRING, allowNull: true },
    yearlyTurnover: { type: DataTypes.STRING, allowNull: true },
    numberOfEmployees: { type: DataTypes.INTEGER, allowNull: true },
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
