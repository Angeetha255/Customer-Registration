import { sequelize, DataTypes } from './index.js'

/**
 * Team table — exactly ONE row in the database (id = 1).
 *
 * teamCount       = total number of users registered in the system
 * teamActiveCount = total number of users where active = true
 *
 * Never store per-user rows. This is a single global record.
 */
const Team = sequelize.define(
  'Team',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    teamCount:       { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
    teamActiveCount: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
  },
  {
    tableName: 'team',
  }
)

export default Team
