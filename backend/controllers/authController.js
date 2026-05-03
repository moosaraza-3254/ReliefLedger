const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/** Case-insensitive email match (handles mixed-case emails already in the DB). */
function findByEmail(emailNorm) {
  return User.findOne({
    $expr: { $eq: [{ $toLower: '$email' }, emailNorm] },
  });
}

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const emailNorm = normalizeEmail(email);
    if (!name || !emailNorm || !password || !role) {
      return res.status(400).json({ msg: 'Please enter all fields' });
    }

    let user = await findByEmail(emailNorm);
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    user = new User({ name, email: emailNorm, password: hash, role });
    await user.save();

    res.json({ msg: 'User registered successfully' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).send('Server error');
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const emailNorm = normalizeEmail(email);
    if (!emailNorm || !password) {
      return res.status(400).json({ msg: 'Please enter all fields' });
    }

    const user = await findByEmail(emailNorm);
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    if (!process.env.JWT_SECRET) {
      console.error('Login error: JWT_SECRET is not set in environment');
      return res.status(500).json({ msg: 'Server configuration error' });
    }

    const payload = { userId: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, role: user.role });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Server error');
  }
};
