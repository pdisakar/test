const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'users.db');
const db = new sqlite3.Database(dbPath, err => {
  if (err) {
    console.error('Failed to open DB', err);
    process.exit(1);
  }
});

const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
  });
});

(async () => {
  try {
    const testimonials = await run('SELECT * FROM testimonials');
    console.log('All testimonials:', testimonials);
    const pkgId = 22;
    const links = await run('SELECT * FROM package_testimonials WHERE packageId = ?', [pkgId]);
    console.log('Package_testimonials links for package', pkgId, ':', links);
    if (links.length) {
      const ids = links.map(l => l.testimonialId);
      const linked = await run(`SELECT * FROM testimonials WHERE id IN (${ids.map(() => '?').join(',')})`, ids);
      console.log('Linked testimonials:', linked);
    }
  } catch (e) {
    console.error('Error', e);
  } finally {
    db.close();
  }
})();
