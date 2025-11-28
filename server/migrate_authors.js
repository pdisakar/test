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
    console.log('Starting migration...');

    // 1. Check if slug column exists
    const columns = await all("PRAGMA table_info(authors)");
    const hasSlug = columns.some(c => c.name === 'slug');

    if (hasSlug) {
      console.log('Slug column already exists. Skipping migration.');
      return;
    }

    console.log('Migrating authors table...');

    // 2. Rename old table
    await run("ALTER TABLE authors RENAME TO authors_old");

    // 3. Create new table
    await run(`
      CREATE TABLE authors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullName TEXT NOT NULL,
        urlTitle TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        description TEXT,
        avatar TEXT,
        avatarCaption TEXT,
        bannerImage TEXT,
        metaTitle TEXT,
        metaKeywords TEXT,
        metaDescription TEXT,
        status INTEGER DEFAULT 1,
        deletedAt TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // 4. Copy data
    // We'll use urlTitle as the initial slug value
    await run(`
      INSERT INTO authors (
        id, fullName, urlTitle, slug, email, description,
        avatar, avatarCaption, bannerImage,
        metaTitle, metaKeywords, metaDescription,
        status, deletedAt, createdAt, updatedAt
      )
      SELECT 
        id, fullName, urlTitle, urlTitle, email, description,
        avatar, avatarCaption, bannerImage,
        metaTitle, metaKeywords, metaDescription,
        status, deletedAt, createdAt, updatedAt
      FROM authors_old
    `);

    // 5. Drop old table
    await run("DROP TABLE authors_old");

    console.log('Migration completed successfully.');

  } catch (err) {
    console.error('Migration failed:', err);
    // Attempt rollback if possible, or manual intervention needed
  } finally {
    db.close();
  }
};

migrate();
