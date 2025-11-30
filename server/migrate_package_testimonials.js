const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'users.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Failed to open SQLite DB:', err);
        process.exit(1);
    }
    console.log('Connected to SQLite DB at', dbPath);
});

const runAsync = (sql) => {
    return new Promise((resolve, reject) => {
        db.run(sql, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

const migrate = async () => {
    try {
        console.log('Starting package_testimonials migration...');

        await runAsync(`
      CREATE TABLE IF NOT EXISTS package_testimonials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        packageId INTEGER NOT NULL,
        testimonialId INTEGER NOT NULL,
        FOREIGN KEY (packageId) REFERENCES packages(id) ON DELETE CASCADE,
        FOREIGN KEY (testimonialId) REFERENCES testimonials(id) ON DELETE CASCADE,
        UNIQUE(packageId, testimonialId)
      );
    `);
        console.log('Created package_testimonials table');

        console.log('Migration completed successfully.');
        db.close();
    } catch (error) {
        console.error('Migration failed:', error);
        db.close();
        process.exit(1);
    }
};

migrate();
