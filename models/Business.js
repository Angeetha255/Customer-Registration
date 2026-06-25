import { sequelize, DataTypes } from './sequelize.js'

const Business = sequelize.define(
  'Business',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    businessName: { type: DataTypes.STRING, allowNull: false, field: 'businessName' },
    companyId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'companyId',
      references: { model: 'company', key: 'id' },
      onDelete: 'SET NULL',
    },
    category: { type: DataTypes.STRING, allowNull: false, field: 'category' },
    subcategory: { type: DataTypes.STRING, allowNull: true, field: 'subcategory' },
    website: { type: DataTypes.STRING, allowNull: true, field: 'website' },
    description: { type: DataTypes.TEXT, allowNull: true, field: 'description' },
    ownerName: { type: DataTypes.STRING, allowNull: true, field: 'owner_name' },
    gstNumber: { type: DataTypes.STRING, allowNull: true, field: 'gst_number' },
    status: { type: DataTypes.STRING, defaultValue: 'draft', field: 'status' },
    businessHours: { type: DataTypes.JSON, allowNull: true, field: 'businessHours' },
    createdBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'createdBy',
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