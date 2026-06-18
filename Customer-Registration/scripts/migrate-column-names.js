import { sequelize } from '../models/index.js';
import { rebuildAllUserTeamStats } from '../services/teamStats.js';

async function migrate() {
  try {
    console.log('Starting migration...');
    await sequelize.authenticate();
    console.log('Connected to database.');

    // Step 1: Reorder users table columns to exact specification
    const desiredUserColumnOrder = [
      'id',
      'name',
      'phone',
      'email',
      'regat',
      'userId',
      'refid',
      'refcount',
      'refactcount',
      'teamcount',
      'teamactcount',
      'active',
      'password',
      'pwdtoken',
      'pwdexp',
      'placeid',
      'position',
      'DOJ',
      'DOA'
    ];

    // Get current columns with definitions
    const [columns] = await sequelize.query(`SHOW COLUMNS FROM users`);
    const columnDefs = {};
    columns.forEach(col => {
      columnDefs[col.Field] = {
        type: col.Type,
        null: col.Null === 'YES' ? 'NULL' : 'NOT NULL',
        key: col.Key,
        default: col.Default,
        extra: col.Extra
      };
    });

    console.log('Current users columns:', Object.keys(columnDefs));

    // Create ALTER TABLE statement to reorder columns
    let alterStatements = [];

    // Process each column in desired order
    for (let i = 0; i < desiredUserColumnOrder.length; i++) {
      const colName = desiredUserColumnOrder[i];
      const colDef = columnDefs[colName];
      if (!colDef) continue;

      let alterStmt = `MODIFY COLUMN \`${colName}\` ${colDef.type}`;
      if (colDef.null) alterStmt += ` ${colDef.null}`;
      
      // Handle defaults
      if (colDef.default !== null) {
        if (colDef.type.toUpperCase().includes('TIMESTAMP') || colDef.type.toUpperCase().includes('DATE')) {
          if (colDef.default === 'CURRENT_TIMESTAMP') {
            alterStmt += ` DEFAULT CURRENT_TIMESTAMP`;
          } else {
            alterStmt += ` DEFAULT '${colDef.default}'`;
          }
        } else if (colDef.type.toUpperCase().includes('INT')) {
          alterStmt += ` DEFAULT ${colDef.default}`;
        } else {
          alterStmt += ` DEFAULT '${colDef.default}'`;
        }
      }
      
      if (colDef.extra) alterStmt += ` ${colDef.extra}`;

      // Determine position
      if (i === 0) {
        alterStmt += ` FIRST`;
      } else {
        alterStmt += ` AFTER \`${desiredUserColumnOrder[i-1]}\``;
      }

      alterStatements.push(alterStmt);
    }

    // Execute all ALTER statements
    if (alterStatements.length > 0) {
      const fullAlter = `ALTER TABLE users ${alterStatements.join(', ')}`;
      console.log('Executing column reorder...');
      await sequelize.query(fullAlter);
      console.log('✓ Columns reordered');
    }

    // Step 2: Verify final column order
    const [finalColumns] = await sequelize.query(`SHOW COLUMNS FROM users`);
    console.log('Final users column order:', finalColumns.map(col => col.Field));

    // Rebuild team stats
    console.log('Rebuilding team stats...');
    await rebuildAllUserTeamStats();
    console.log('✓ Team stats rebuilt');

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

migrate();
