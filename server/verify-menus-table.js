// Verify menus table structure
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'data', 'users.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Failed to open SQLite DB:', err);
        process.exit(1);
    }
});

db.all("PRAGMA table_info(menus)", (err, columns) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('\nMenus table structure:');
        console.log('----------------------');
        columns.forEach(col => {
            console.log(`${col.name.padEnd(20)} ${col.type.padEnd(10)} ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
        });
    }
    db.close();
});
