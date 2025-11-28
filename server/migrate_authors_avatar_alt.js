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
    console.log('Starting authors avatarAlt migration...');

    // Check if avatarAlt column exists
    const columns = await all("PRAGMA table_info(authors)");
    const hasAvatarAlt = columns.some(c => c.name === 'avatarAlt');

    if (hasAvatarAlt) {
      console.log('avatarAlt column already exists. Skipping migration.');
      return;
    }

    console.log('Adding avatarAlt column to authors table...');

    // Add avatarAlt column
    await run("ALTER TABLE authors ADD COLUMN avatarAlt TEXT");

    console.log('Migration completed successfully.');

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    db.close();
  }
};

migrate();
