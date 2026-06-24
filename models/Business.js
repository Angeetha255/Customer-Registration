import { sequelize, DataTypes } from './sequelize.js'

const Business = sequelize.define(
  'Business',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    businessName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    mobileNumber: { type: DataTypes.STRING, allowNull: false },
    website: { type: DataTypes.STRING, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    yearOfEstablishment: { type: DataTypes.INTEGER, allowNull: true },
    mapLocation: { type: DataTypes.TEXT, allowNull: true },
    country: { type: DataTypes.STRING, defaultValue: 'India' },
    state: { type: DataTypes.STRING, allowNull: false },
    district: { type: DataTypes.STRING, allowNull: false },
    area: { type: DataTypes.STRING, allowNull: false },
    pincode: { type: DataTypes.STRING, allowNull: false },
    mainCategory: { type: DataTypes.STRING, allowNull: false },
    subCategory: { type: DataTypes.STRING, allowNull: true },
    businessHours: { type: DataTypes.JSON, allowNull: true },
    numberOfEmployees: { type: DataTypes.INTEGER, allowNull: true },
    yearlyTurnover: { type: DataTypes.STRING, allowNull: true },
    createdBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
    },
  },
  {
    tableName: 'business',
    timestamps: false,
  }
)

export default Business
