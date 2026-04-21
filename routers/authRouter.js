const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/logout', authController.logout);

// Route xem và xử lý mật khẩu
router.get('/profile', authController.getProfile);
router.put('/change-password', authController.changePassword);

module.exports = router;