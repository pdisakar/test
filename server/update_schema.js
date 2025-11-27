const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'users.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open SQLite DB:', err);
    process.exit(1);
  }
  console.log('Connected to SQLite DB at', dbPath);
});

const runAsync = (sql) => {
  return new Promise((resolve, reject) => {
    db.run(sql, function (err) {
      if (err) {
        // Ignore "duplicate column name" errors if we run this multiple times
        if (err.message.includes('duplicate column name')) {
          resolve(null);
        } else {
          reject(err);
        }
      } else {
        resolve(this);
      }
    });
  });
};

const updateSchema = async () => {
  try {
    console.log('Adding missing columns to package_itinerary...');

    const columns = [
      'distance TEXT',
      'origin TEXT',
      'destination TEXT',
      'originElevation TEXT',
      'destinationElevation TEXT',
      'transportation TEXT'
    ];

    for (const col of columns) {
      try {
        await runAsync(`ALTER TABLE package_itinerary ADD COLUMN ${col}`);
        console.log(`Added column: ${col}`);
      } catch (err) {
        console.log(`Skipped (maybe exists): ${col}`);
      }
    }

    console.log('Schema update completed successfully.');
  } catch (error) {
    console.error('Schema update failed:', error);
  } finally {
    db.close();
  }
};

updateSchema();
