const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'users.db');
const db = new sqlite3.Database(dbPath, err => {
  if (err) { console.error('DB open error', err); process.exit(1); }
});

const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) {
    if (err) reject(err);
    else resolve(this);
  });
});

(async () => {
  try {
    console.log('Adding packageId column to testimonials (if not exists)...');
    // SQLite doesn't support IF NOT EXISTS for ALTER COLUMN, so we try and ignore error
    await run('ALTER TABLE testimonials ADD COLUMN packageId INTEGER');
    console.log('Column added.');
  } catch (e) {
    if (e && e.message && e.message.includes('duplicate column name')) {
      console.log('Column already exists, skipping add.');
    } else {
      console.error('Error adding column:', e);
    }
  }

  // Populate existing testimonials that belong to package 22 (ids 1 and 2 in this DB)
  console.log('Updating existing testimonial rows to link to package 22...');
  await run('UPDATE testimonials SET packageId = ? WHERE id IN (1,2)', [22]);
  console.log('Update complete.');

  db.close();
})();
