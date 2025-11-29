const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data/users.db');
const db = new sqlite3.Database(dbPath);

async function checkDatabaseIntegrity() {
    console.log('Starting Database Integrity Check...\n');

    const runQuery = (query, params = []) => {
        return new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    };

    try {
        // 1. Check for Orphaned Menus
        console.log('--- Checking for Orphaned Menus ---');
        const orphans = await runQuery(`
            SELECT m.id, m.title, m.parentId 
            FROM menus m 
            LEFT JOIN menus p ON m.parentId = p.id 
            WHERE m.parentId IS NOT NULL AND p.id IS NULL
        `);
        if (orphans.length > 0) {
            console.log('WARNING: Found orphaned menus (parentId exists but parent not found):');
            console.table(orphans);
        } else {
            console.log('OK: No orphaned menus found.');
        }

        // 2. Check for Circular References (Simple check for direct self-reference)
        console.log('\n--- Checking for Circular References ---');
        const selfRefs = await runQuery('SELECT id, title FROM menus WHERE id = parentId');
        if (selfRefs.length > 0) {
            console.log('WARNING: Found self-referencing menus:');
            console.table(selfRefs);
        } else {
            console.log('OK: No direct self-referencing menus found.');
        }

        // 3. Check for Broken Links (urlSegmentId pointing to non-existent items)
        console.log('\n--- Checking for Broken Content Links ---');

        // Places
        const brokenPlaces = await runQuery(`
            SELECT m.id, m.title, m.urlSegmentId 
            FROM menus m 
            LEFT JOIN places p ON m.urlSegmentId = p.id 
            WHERE m.urlSegmentType = 'place' AND p.id IS NULL
        `);
        if (brokenPlaces.length > 0) {
            console.log('WARNING: Found menus linking to non-existent Places:');
            console.table(brokenPlaces);
        } else {
            console.log('OK: All Place links are valid.');
        }

        // Articles
        const brokenArticles = await runQuery(`
            SELECT m.id, m.title, m.urlSegmentId 
            FROM menus m 
            LEFT JOIN articles a ON m.urlSegmentId = a.id 
            WHERE m.urlSegmentType = 'article' AND a.id IS NULL
        `);
        if (brokenArticles.length > 0) {
            console.log('WARNING: Found menus linking to non-existent Articles:');
            console.table(brokenArticles);
        } else {
            console.log('OK: All Article links are valid.');
        }

        // Packages
        const brokenPackages = await runQuery(`
            SELECT m.id, m.title, m.urlSegmentId 
            FROM menus m 
            LEFT JOIN packages p ON m.urlSegmentId = p.id 
            WHERE m.urlSegmentType = 'package' AND p.id IS NULL
        `);
        if (brokenPackages.length > 0) {
            console.log('WARNING: Found menus linking to non-existent Packages:');
            console.table(brokenPackages);
        } else {
            console.log('OK: All Package links are valid.');
        }

        // 4. Check for Duplicate Menus (Same title and parent)
        console.log('\n--- Checking for Duplicate Menus ---');
        const duplicates = await runQuery(`
            SELECT title, parentId, COUNT(*) as count 
            FROM menus 
            WHERE deletedAt IS NULL 
            GROUP BY title, parentId 
            HAVING count > 1
        `);
        if (duplicates.length > 0) {
            console.log('WARNING: Found duplicate active menus (same title under same parent):');
            console.table(duplicates);
        } else {
            console.log('OK: No duplicate active menus found.');
        }

    } catch (err) {
        console.error('Error during integrity check:', err);
    } finally {
        db.close();
    }
}

checkDatabaseIntegrity();
