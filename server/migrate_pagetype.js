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
        console.log('Starting pageType migration...');

        const tables = ['places', 'articles', 'blogs', 'packages'];

        for (const table of tables) {
            try {
                // Check if column exists
                // SQLite doesn't have a simple "IF COLUMN EXISTS" so we try to add it and ignore error if it exists
                // Or we can check pragma table_info

                await runAsync(`ALTER TABLE ${table} ADD COLUMN pageType TEXT DEFAULT 'default'`);
                console.log(`Added pageType column to ${table}`);
            } catch (err) {
                if (err.message.includes('duplicate column name')) {
                    console.log(`pageType column already exists in ${table}`);
                } else {
                    console.error(`Error altering ${table}:`, err.message);
                }
            }
        }

        console.log('Migration completed.');
        db.close();
    } catch (error) {
        console.error('Migration failed:', error);
        db.close();
        process.exit(1);
    }
};

migrate();
