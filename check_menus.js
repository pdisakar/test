const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./server/users.db');

db.all('SELECT id, title, parentId, type FROM menus', [], (err, rows) => {
    if (err) {
        throw err;
    }
    console.log(JSON.stringify(rows, null, 2));
});

db.close();
