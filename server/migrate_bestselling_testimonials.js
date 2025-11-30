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
        console.log('Starting testimonials bestselling migration...');

        // Check if column exists
        try {
            await runAsync('ALTER TABLE testimonials ADD COLUMN isBestselling INTEGER DEFAULT 0 CHECK(isBestselling IN (0,1))');
            console.log('Added isBestselling column to testimonials table');
        } catch (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('isBestselling column already exists in testimonials table');
            } else {
                throw err;
            }
        }

        console.log('Migration completed successfully.');
        db.close();
    } catch (error) {
        console.error('Migration failed:', error);
        db.close();
        process.exit(1);
    }
};

migrate();
