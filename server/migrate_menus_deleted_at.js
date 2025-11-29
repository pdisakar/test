const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'data', 'users.db');
const db = new sqlite3.Database(dbPath);

console.log('Adding deletedAt column to menus table...');

db.run("ALTER TABLE menus ADD COLUMN deletedAt TEXT", (err) => {
    if (err) {
        if (err.message.includes('duplicate column name')) {
            console.log('Column deletedAt already exists.');
        } else {
            console.error('Error adding column:', err);
            process.exit(1);
        }
    } else {
        console.log('Successfully added deletedAt column.');
    }
    db.close();
});
