const { allAsync } = require('./db');

(async () => {
  try {
    // Wait a bit for db init if needed (though requiring db.js triggers it)
    await new Promise(r => setTimeout(r, 500));
    const users = await allAsync('SELECT * FROM users');
    console.log('Users found:', users);
  } catch (err) {
    console.error('Error checking DB:', err);
  }
})();
