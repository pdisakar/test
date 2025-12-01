const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./server/database.sqlite');

db.all("SELECT * FROM menus WHERE urlSegmentType = 'package'", [], (err, rows) => {
  if (err) {
    throw err;
  }
  console.log('Package Menu Items:', rows);
  console.log('Count:', rows.length);
});

db.close();
