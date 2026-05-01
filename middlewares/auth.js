const { roles } = require("../utils/constants");

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({ error: 'Please log in to view that resource' });
}

function ensureAdmin(req, res, next) {
    if (req.user.role !== roles.admin) {
        return res.status(403).json({ error: 'Unauthorized Access' });
    }
    next();
}

module.exports = { ensureAuthenticated, ensureAdmin };

