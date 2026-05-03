const User = require('../models/User');

module.exports = (...allowedRoles) => {
  const normalizedAllowedRoles = allowedRoles.map((role) => String(role).trim().toUpperCase());

  return async (req, res, next) => {
    if (!req.user?.userId) {
      return res.status(401).json({ msg: 'Not authenticated' });
    }

    const tokenRole = String(req.user.role || '').trim().toUpperCase();
    if (tokenRole && normalizedAllowedRoles.includes(tokenRole)) {
      req.user.role = tokenRole;
      return next();
    }

    try {
      const user = await User.findById(String(req.user.userId)).select('role');
      if (!user) {
        return res.status(401).json({ msg: 'User not found' });
      }

      const dbRole = String(user.role || '').trim().toUpperCase();
      req.user.role = dbRole;

      if (!normalizedAllowedRoles.includes(dbRole)) {
        return res.status(403).json({ msg: 'Access denied. Insufficient permissions.' });
      }

      return next();
    } catch (err) {
      console.error('authorizeRole middleware error:', err.message);
      return res.status(500).send('Server error');
    }
  };
};
