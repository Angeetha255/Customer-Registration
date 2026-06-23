import { sequelize, DataTypes } from './index.js'

const Product = sequelize.define(
  'Product',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    businessId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'business', key: 'id' },
      onDelete: 'CASCADE',
    },
    coverImage: { type: DataTypes.STRING, allowNull: true },
    productImages: { type: DataTypes.JSON, allowNull: true },
    productName: { type: DataTypes.STRING, allowNull: false },
    displayPrice: { type: DataTypes.BOOLEAN, defaultValue: false },
    productPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    createdBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
    },
  },
  {
    tableName: 'products',
  }
)

export default Product
