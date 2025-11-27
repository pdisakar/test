const { db } = require('./db');

// Add isDefault column to trip_fact_categories table
db.run('ALTER TABLE trip_fact_categories ADD COLUMN isDefault INTEGER DEFAULT 0', (err) => {
  if (err) {
    if (err.message.includes('duplicate column')) {
      console.log('Column isDefault already exists');
    } else {
      console.error('Error adding column:', err);
    }
  } else {
    console.log('Added isDefault column');
  }
  
  // Mark existing categories as default
  db.run('UPDATE trip_fact_categories SET isDefault = 1 WHERE slug IN (?, ?, ?, ?, ?)', 
    ['grade', 'style', 'transportation', 'accommodation', 'meals'],
    (err) => {
      if (err) console.error('Error marking defaults:', err);
      else console.log('Marked 5 default categories');
      db.close();
    }
  );
});
