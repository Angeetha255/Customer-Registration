import { Sequelize, DataTypes } from 'sequelize'
import sequelize from './sequelize.js'

// Import models
import User from './User.js'
import Admin from './Admin.js'
import Company from './Company.js'
import Business from './Business.js'
import Product from './Product.js'
import Level from './Level.js'
import Counter from './Counter.js'
import Settings from './Settings.js'
import Country from './Country.js'
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
  Company,
  Business,
  Product,
  Level,
  Counter,
  Settings,
  Country,
  State,
  District,
  Area,
  Category,
  Subcategory,
}

// Define relationships only after all models are loaded
if (Country && State) {
  Country.hasMany(State, { foreignKey: 'countryId', as: 'states' })
  State.belongsTo(Country, { foreignKey: 'countryId', as: 'country' })
}

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

// Company, Business, and Product relationships
if (Company && Business) {
  Company.hasMany(Business, { foreignKey: 'companyId', as: 'businesses' })
  Business.belongsTo(Company, { foreignKey: 'companyId', as: 'company' })
}

if (Company && Product) {
  Company.hasMany(Product, { foreignKey: 'companyId', as: 'products' })
  Product.belongsTo(Company, { foreignKey: 'companyId', as: 'company' })
}


export default db
