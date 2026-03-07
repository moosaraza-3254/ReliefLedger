const User = require('../models/User');

/**
 * Middleware to check if the authenticated user's account is frozen.
 * Frozen users are blocked from performing sensitive actions (donate, apply, disburse).
 * Must be used AFTER the auth middleware so req.user is available.
 */
module.exports = async function checkFrozen(req, res, next) {
    try {
        const user = await User.findById(req.user.userId).select('isFrozen');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (user.isFrozen) {
            return res.status(403).json({
                msg: 'Your account has been frozen due to suspicious activity. Please contact support.'
            });
        }

        next();
    } catch (err) {
        console.error('checkFrozen middleware error:', err.message);
        res.status(500).send('Server error');
    }
};
