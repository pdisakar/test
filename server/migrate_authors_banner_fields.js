const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'users.db');
const db = new sqlite3.Database(dbPath);

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const migrate = async () => {
  try {
    console.log('Starting banner image alt/caption migration...');

    // Check if columns exist
    const columns = await all("PRAGMA table_info(authors)");
    const hasBannerAlt = columns.some(c => c.name === 'bannerImageAlt');
    const hasBannerCaption = columns.some(c => c.name === 'bannerImageCaption');

    if (hasBannerAlt && hasBannerCaption) {
      console.log('Banner columns already exist. Skipping migration.');
      return;
    }

    console.log('Adding banner columns to authors table...');

    if (!hasBannerAlt) {
      await run("ALTER TABLE authors ADD COLUMN bannerImageAlt TEXT");
      console.log('Added bannerImageAlt column');
    }

    if (!hasBannerCaption) {
      await run("ALTER TABLE authors ADD COLUMN bannerImageCaption TEXT");
      console.log('Added bannerImageCaption column');
    }

    console.log('Migration completed successfully.');

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    db.close();
  }
};

migrate();
