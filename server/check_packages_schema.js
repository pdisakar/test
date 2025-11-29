const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data/users.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.all("PRAGMA table_info(packages)", (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log('Packages Table Schema:');
        console.log(JSON.stringify(rows, null, 2));
    });
});

db.close();
