import { Sequelize, DataTypes } from 'sequelize'
import sequelize from './sequelize.js'

// Import models
import User from './User.js'
import Admin from './Admin.js'
import Business from './Business.js'
import Product from './Product.js'
import Level from './Level.js'
import Counter from './Counter.js'
import Settings from './Settings.js'
import State from './State.js'
import District from './District.js'
import Area from './Area.js'
import Category from './Category.js'
import Subcategory from './Subcategory.js'

const db = {
  sequelize,
  Sequelize,
  DataTypes,
  User,
  Admin,
  Business,
  Product,
  Level,
  Counter,
  Settings,
  State,
  District,
  Area,
  Category,
  Subcategory,
}

// Define relationships only after all models are loaded
if (State && District) {
  State.hasMany(District, { foreignKey: 'stateId', as: 'districts' })
  District.belongsTo(State, { foreignKey: 'stateId', as: 'state' })
}

if (District && Area) {
  District.hasMany(Area, { foreignKey: 'districtId', as: 'areas' })
  Area.belongsTo(District, { foreignKey: 'districtId', as: 'district' })
}

if (Category && Subcategory) {
  Category.hasMany(Subcategory, { foreignKey: 'categoryId', as: 'subcategories' })
  Subcategory.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' })
}

export default db
