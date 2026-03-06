const mongoose = require('mongoose');
const User = require('./models/User');
const Application = require('./models/Application');

async function checkData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/reliefledger');
    console.log('Connected to MongoDB');

    const users = await User.find({}, 'name email role');
    console.log('Users:', users);

    const applications = await Application.find({}, 'recipient_id amount_requested status');
    console.log('Applications:', applications);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkData();