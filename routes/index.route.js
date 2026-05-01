const router = require("express").Router();

router.get('/', (req, res, next) => {
    res.json({ status: 'API is running' });
});

module.exports = router;