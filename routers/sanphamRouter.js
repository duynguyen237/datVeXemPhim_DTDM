const express = require('express');
const router = express.Router();
const sanphamDAL = require('../mongoDAL/sanpham'); // Trỏ về DAL mới

// API Lấy danh sách bắp nước
router.get('/san-pham', async (req, res) => {
    try {
        const dsSanPham = await sanphamDAL.getAll();
        res.json({ success: true, data: dsSanPham });
    } catch (error) {
        console.error("Lỗi lấy sản phẩm:", error);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
});

module.exports = router;