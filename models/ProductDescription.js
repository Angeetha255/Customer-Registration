import { sequelize, DataTypes } from './sequelize.js'

const ProductDescription = sequelize.define(
  'ProductDescription',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'products', key: 'id' },
      onDelete: 'CASCADE',
    },
    descriptionPoint: { type: DataTypes.TEXT, allowNull: false },
    displayOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    tableName: 'product_descriptions',
    timestamps: true,
  }
)

export default ProductDescription