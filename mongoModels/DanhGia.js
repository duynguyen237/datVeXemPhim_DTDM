const mongoose = require('mongoose');

/**
 * DANH_GIA → Collection: danhgias
 *
 * Quyết định thiết kế NoSQL:
 * - Tham chiếu (ref) tới NguoiDung và Phim.
 * - KHÔNG nhúng vào Phim vì: số lượng đánh giá unbounded (có thể hàng nghìn)
 *   → nhúng sẽ khiến document Phim phình to quá giới hạn 16MB của MongoDB.
 * - Giữ collection riêng, query dễ dàng: DanhGia.find({ phim: phimId })
 */
const danhGiaSchema = new mongoose.Schema(
    {
        noiDungDanhGia: {
            type: String,
            required: [true, 'Nội dung đánh giá là bắt buộc'],
            trim: true,
        },
        nguoiDung: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'NguoiDung',
            required: true,
        },
        // Snapshot tên người dùng để hiển thị mà không cần populate
        tenNguoiDung: {
            type: String,
            trim: true,
        },
        phim: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Phim',
            required: true,
        },
        // Snapshot tên phim
        tenPhim: {
            type: String,
            trim: true,
        },
        ngayDanhGia: {
            type: Date,
            default: Date.now,
        },
        // Tuỳ chọn: thêm điểm đánh giá (1-5 sao)
        soSao: {
            type: Number,
            min: 1,
            max: 5,
        },
    },
    {
        collection: 'danhgias',
        timestamps: true,
    }
);

// Index để tìm đánh giá theo phim (use-case phổ biến nhất)
danhGiaSchema.index({ phim: 1, ngayDanhGia: -1 });
// Index để xem người dùng đã đánh giá phim nào
danhGiaSchema.index({ nguoiDung: 1 });

module.exports = mongoose.model('DanhGia', danhGiaSchema);
