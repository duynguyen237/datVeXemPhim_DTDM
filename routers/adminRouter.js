const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// ==========================================
// 1. QUẢN LÝ PHIM
// ==========================================
router.get('/phim', adminController.listPhim);
router.post('/phim/them', adminController.addPhim);
router.post('/phim/toggle-hide/:id', adminController.toggleHidePhim);

// ==========================================
// 2. QUẢN LÝ RẠP
// ==========================================
router.get('/rap', adminController.listRap);
router.post('/rap/them', adminController.addRap);

// ==========================================
// 2.1 QUẢN LÝ PHÒNG & TẠO SƠ ĐỒ GHẾ (Bổ sung)
// ==========================================
router.get('/phong', adminController.listPhong);
router.post('/phong/add', adminController.addPhong);
router.post('/ghe/generate', adminController.generateSeats);
router.get('/rap/:id/phong', adminController.getPhongByRap);
router.get('/ghe/phong/:id', adminController.getGheByPhong);

// ==========================================
// 3. QUẢN LÝ SUẤT CHIẾU
// ==========================================
router.get('/suatchieu', adminController.listSuatChieu);
router.post('/suatchieu/them', adminController.addSuatChieu);
router.delete('/suatchieu/xoa/:id', adminController.deleteSuatChieu);

// ==========================================
// 4. QUẢN LÝ TÀI KHOẢN
// ==========================================
router.get('/taikhoan', adminController.listUser);

// ==========================================
// 5. QUẢN LÝ HÓA ĐƠN
// ==========================================
router.get('/hoadon', adminController.listHoaDon);

// ==========================================
// 6. DASHBOARD THỐNG KÊ
// ==========================================
const statisticController = require('../controllers/statisticController');
router.get('/thong-ke', statisticController.getRevenueStatistics);

module.exports = router;