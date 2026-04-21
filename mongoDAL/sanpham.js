/**
 * mongoDAL/sanpham.js
 * Quản lý lấy dữ liệu Bắp / Nước
 */
const SanPham = require('../mongoModels/SanPham');

class SanPhamDAL {
    // Lấy tất cả sản phẩm
    async getAll() {
        return await SanPham.find().sort({ giaSanPham: 1 }).lean();
    }
}

module.exports = new SanPhamDAL();