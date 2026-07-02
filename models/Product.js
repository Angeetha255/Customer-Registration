import { sequelize, DataTypes } from './sequelize.js'

const Product = sequelize.define(
  'Product',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    companyId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'companyId',
      references: { model: 'company', key: 'id' },
      onDelete: 'CASCADE',
    },
    coverImage: { type: DataTypes.STRING, allowNull: true, field: 'coverImage' },
    productImages: { type: DataTypes.JSON, allowNull: true, field: 'productImages' },
    gallery: { type: DataTypes.JSON, allowNull: true, field: 'gallery' },
    productName: { type: DataTypes.STRING, allowNull: false, field: 'productName' },
    productMrp: { type: DataTypes.DECIMAL(10, 2), allowNull: true, field: 'product_mrp' },
    discountPercentage: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0, field: 'discount_percentage' },
    discountPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: true, field: 'discount_price' },
    isEnabled: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_enabled' },
    displayPrice: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'displayPrice' },
    specifications: { type: DataTypes.JSON, allowNull: true, field: 'specifications' },
    descriptions: { type: DataTypes.JSON, allowNull: true, field: 'descriptions' },
    youtubeLinks: { type: DataTypes.JSON, allowNull: true, field: 'youtube_links' },
    productCategory: { type: DataTypes.STRING, allowNull: true, field: 'product_category' },
    createdBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'createdBy',
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
    },
  },
  {
    tableName: 'products',
    timestamps: false,
  }
)

export default Product