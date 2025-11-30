const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'users.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Failed to open SQLite DB:', err);
        process.exit(1);
    }
});

const runQuery = () => {
    db.all('SELECT * FROM trip_fact_categories', [], (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log('Categories found:', rows.length);
        console.log(JSON.stringify(rows, null, 2));
    });
};

runQuery();
