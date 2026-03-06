try {
  const ac = require('./controllers/adminController');
  console.log('Loaded adminController keys:', Object.keys(ac));
} catch (e) {
  console.error('Failed to load adminController:', e);
}