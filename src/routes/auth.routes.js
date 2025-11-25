const { Router } = require('express');
const router = Router();
const { login } = require('../controllers/auth.controller');

router.post('/api/login', login);

module.exports = router;