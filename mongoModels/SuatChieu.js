const mongoose = require('mongoose');

/**
 * SUAT_CHIEU → Collection: suatchieus
 *
 * Quyết định thiết kế NoSQL:
 * - Tham chiếu (ref) tới Phim và ThongTinRap.
 * - NHÚNG snapshot thông tin phòng chiếu (tên phòng, tên rạp) để truy xuất
 *   nhanh khi hiển thị lịch chiếu mà không cần populate toàn bộ embedded arrays.
 * - phongChieuId lưu ObjectId của embedded phòng chiếu bên trong ThongTinRap.
 */
const suatChieuSchema = new mongoose.Schema(
    {
        // Ref tới collection Phim
        phim: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Phim',
            required: true,
        },
        // Snapshot tên phim để hiển thị nhanh
        tenPhim: {
            type: String,
        },

        // Ref tới collection ThongTinRap
        rap: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ThongTinRap',
            required: true,
        },
        // Snapshot tên rạp
        tenRap: {
            type: String,
        },

        // ID của phòng chiếu (sub-document _id bên trong ThongTinRap.phongChieus)
        phongChieuId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        // Snapshot tên phòng chiếu
        tenPhongChieu: {
            type: String,
        },

        ngayChieu: {
            type: Date,
            required: [true, 'Ngày chiếu là bắt buộc'],
        },
        gioBatDau: {
            type: String,      // Lưu dạng "HH:mm" (string) cho đơn giản
            required: true,
        },
        gioKetThuc: {
            type: String,
        },
        giaVeCoban: {
            type: Number,
            default: 75000,
            min: 0,
        },
    },
    {
        collection: 'suatchieus',
        timestamps: true,
    }
);

// Index kép để lọc suất chiếu theo phim + ngày
suatChieuSchema.index({ phim: 1, ngayChieu: 1 });
suatChieuSchema.index({ rap: 1, ngayChieu: 1 });

module.exports = mongoose.model('SuatChieu', suatChieuSchema);
