const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const token = req.header('x-auth-token') || req.header('Authorization');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    const rawUserId = decoded.userId || decoded.id || decoded.user?.id || decoded.user?._id || null;
    const normalizedUserId = rawUserId != null ? String(rawUserId) : null;
    const normalizedRole = String(decoded.role || decoded.user?.role || '').trim().toUpperCase();
    req.user = {
      ...decoded,
      userId: normalizedUserId,
      role: normalizedRole || decoded.role
    };

    if (!req.user.userId) {
      return res.status(401).json({ msg: 'Token is not valid' });
    }

    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
