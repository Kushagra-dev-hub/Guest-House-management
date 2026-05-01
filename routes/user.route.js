const router = require('express').Router();

router.get('/profile', async (req, res, next) => {
   res.json({ success: true, user: req.user });
});

module.exports = router;