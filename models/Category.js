import { sequelize, DataTypes } from './sequelize.js'

const Category = sequelize.define(
  'Category',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    categoryName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
    bannerImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'banner_image'
    },
    bannerImages: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'banner_images'
    },
  },
  {
    tableName: 'categories',
    timestamps: true,
  }
)

export default Category