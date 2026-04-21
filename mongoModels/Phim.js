const mongoose = require('mongoose');

/**
 * PHIM → Collection: phims
 *
 * Quyết định thiết kế NoSQL:
 * - NHÚNG thông tin thể loại (tenTheLoai) để có thể hiển thị danh sách phim
 *   mà không cần JOIN/populate tốn I/O.
 * - Giữ theLoaiId (ref) để hỗ trợ filter theo thể loại.
 * - danhSachDanhGia KHÔNG nhúng vào đây vì review số lượng lớn, unbounded array
 *   → tránh document quá lớn. Để collection riêng DANH_GIA với ref về phim.
 */
const phimSchema = new mongoose.Schema(
    {
        tenPhim: {
            type: String,
            required: [true, 'Tên phim là bắt buộc'],
            trim: true,
            maxlength: 250,
        },
        duongDanTrailer: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        noiDungPhim: {
            type: String,
        },
        gioiHanTuoi: {
            type: String,
            trim: true,
            maxlength: 10,  // P, K, T13, T16, T18
        },
        thoiLuongPhim: {
            type: Number,   // Phút
            min: 0,
        },
        daoDien: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        dienVien: {
            type: String,   // Hoặc [String] nếu muốn tách thành mảng
        },
        hinhAnhPoster: {
            type: String,
            maxlength: 500,
        },
        hinhAnhNen: {
            type: String,
            maxlength: 500,
        },
        // THAM CHIẾU (ref) tới TheLoai - dùng khi cần filter
        theLoai: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TheLoai',
        },
        // NHÚNG tên thể loại để tránh lookup khi hiển thị danh sách
        tenTheLoai: {
            type: String,
            trim: true,
        },
    },
    {
        collection: 'phims',
        timestamps: true,
    }
);

// Text index để tìm kiếm phim theo tên
phimSchema.index({ tenPhim: 'text', tenTheLoai: 1 });

module.exports = mongoose.model('Phim', phimSchema);
