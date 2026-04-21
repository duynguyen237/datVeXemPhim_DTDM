const express = require('express');
const router = express.Router();
const gheController = require('../controllers/gheController');

// API lấy sơ đồ ghế theo mã suất chiếu
router.get('/sodo/:maSuatChieu', gheController.getSodoGhe);

module.exports = router;