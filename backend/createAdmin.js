const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/reliefledger');
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'ADMIN' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      return;
    }

    console.log('Creating admin user...');
    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('admin123', salt);

    const admin = new User({
      name: 'Admin User',
      email: 'admin@reliefledger.com',
      password: hash,
      role: 'ADMIN'
    });

    await admin.save();
    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@reliefledger.com');
    console.log('Password: admin123');

    // List all users
    const allUsers = await User.find({}, 'name email role');
    console.log('All users in database:');
    allUsers.forEach(user => console.log(`  - ${user.name} (${user.email}) - ${user.role}`));

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

createAdmin();