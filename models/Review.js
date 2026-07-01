import { sequelize, DataTypes } from './sequelize.js'

/**
 * Review model
 *
 * Stores both company reviews and product reviews in a single table.
 * - companyId is always required
 * - productId is nullable (null = company review, set = product review)
 * - email is the verified email from the magic-link flow
 * - isVerified flags that the reviewer email was verified before submission
 */
const Review = sequelize.define(
  'Review',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    companyId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'company_id',
      references: { model: 'company', key: 'id' },
      onDelete: 'CASCADE',
    },
    productId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'product_id',
      references: { model: 'products', key: 'id' },
      onDelete: 'CASCADE',
    },
    userName: {
      type: DataTypes.STRING(120),
      allowNull: false,
      field: 'user_name',
      validate: { len: [1, 120] },
    },
    userEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'user_email',
      validate: { isEmail: true },
    },
    rating: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_verified',
      comment: 'true when submitted after successful email magic-link verification',
    },
    userAvatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'user_avatar',
    },
  },
  {
    tableName: 'reviews',
    timestamps: true,            // createdAt + updatedAt
    underscored: true,           // maps camelCase fields to snake_case columns
    indexes: [
      { fields: ['company_id'] },
      { fields: ['product_id'] },
      { fields: ['user_email'] },
      { fields: ['created_at'] },
    ],
  }
)

export default Review
