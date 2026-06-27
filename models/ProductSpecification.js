import { sequelize, DataTypes } from './sequelize.js'

const ProductSpecification = sequelize.define(
  'ProductSpecification',
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
    specificationName: { type: DataTypes.STRING, allowNull: false },
    specificationDetail: { type: DataTypes.TEXT, allowNull: false },
  },
  {
    tableName: 'product_specifications',
    timestamps: true,
  }
)

export default ProductSpecification