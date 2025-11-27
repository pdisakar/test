const { db } = require('./db');

db.all('SELECT * FROM trip_fact_categories', [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Categories in database:');
    console.log(rows);
    console.log(`\nTotal: ${rows.length} categories`);
  }
  db.close();
});
