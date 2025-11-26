const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'users.db');
const db = new sqlite3.Database(dbPath);

db.run("ALTER TABLE articles ADD COLUMN deletedAt TEXT", (err) => {
  if (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('Column deletedAt already exists');
    } else {
      console.error('Error adding column:', err);
    }
  } else {
    console.log('Successfully added deletedAt column');
  }
  db.close();
});
