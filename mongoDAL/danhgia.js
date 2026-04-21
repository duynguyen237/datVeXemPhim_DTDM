/**
 * mongoDAL/danhgia.js
 * Data Access Layer cho DanhGia - thay thế models/danhgia.js
 */

// Thêm dòng này lên đầu file nếu chưa có
const DanhGia = require('../mongoModels/DanhGia');

// Có thể bạn cũng đang có sẵn 2 dòng này:
const NguoiDung = require('../mongoModels/NguoiDung');
const Phim = require('../mongoModels/Phim');

class DanhGiaDAL {
    // ─────────────────────────────────────────────
    // READ: Lấy đánh giá theo phim (kèm tên người dùng)
    // ─────────────────────────────────────────────
    async getByPhimId(phimId) {
        return await DanhGia.find({ phim: phimId })
            .sort({ ngayDanhGia: -1 })
            .lean();
        // tenNguoiDung đã được snapshot → không cần populate
    }
    // ─────────────────────────────────────────────
    // CREATE: Thêm đánh giá
    // ─────────────────────────────────────────────
    async create(data) {
        // Lấy snapshot thông tin để nhúng
        const [nguoiDung, phim] = await Promise.all([
            NguoiDung.findById(data.nguoiDungId).lean(),
            Phim.findById(data.phimId).lean(),
        ]);

        const danhGiaMoi = new DanhGia({
            noiDungDanhGia: data.noiDungDanhGia,
            nguoiDung: data.nguoiDungId,
            tenNguoiDung: nguoiDung?.hoTen,
            phim: data.phimId,
            tenPhim: phim?.tenPhim,
            soSao: data.soSao,
            ngayDanhGia: new Date(),
        });
        return await danhGiaMoi.save();
    }

    // ─────────────────────────────────────────────
    // DELETE: Xóa đánh giá (Admin)
    // ─────────────────────────────────────────────
    async delete(id) {
        return await DanhGia.findByIdAndDelete(id);
    }

    // ─────────────────────────────────────────────
    // READ: Kiểm tra người dùng đã đánh giá phim chưa
    // ─────────────────────────────────────────────
    async daDanhGia(nguoiDungId, phimId) {
        const dg = await DanhGia.findOne({ nguoiDung: nguoiDungId, phim: phimId }).lean();
        return !!dg;
    }

    async getRecentReviews(limit = 3) {
        return await DanhGia.find()
            .sort({ ngayDanhGia: -1 }) // Sắp xếp theo ngày đánh giá giảm dần (mới nhất lên đầu)
            .limit(limit)              // Chỉ lấy số lượng theo yêu cầu (mặc định là 3)
            .lean();                   // Trả về JSON thuần để render EJS cho nhanh
    }
}

module.exports = new DanhGiaDAL();
