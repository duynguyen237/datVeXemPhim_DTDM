const mongoose = require('mongoose');

/**
 * THONG_TIN_RAP → Collection: thongtinraps
 * Rạp chiếu phim và các phòng chiếu của nó.
 *
 * Quyết định thiết kế NoSQL:
 * - NHÚNG danh sách phòng chiếu (phongChieus) vào rạp.
 *   Lý do: phòng chiếu luôn thuộc về 1 rạp, không tự tồn tại độc lập,
 *   số phòng tối đa ~10-20 → mảng bounded, an toàn để nhúng.
 * - Mỗi phòng chiếu nhúng thêm danh sách ghế ngồi (gheNgois) vì ghế
 *   luôn gắn với phòng và số lượng cũng bounded (~100-200 ghế/phòng).
 *
 * ⚠️  Trade-off: Nếu cần cập nhật trạng thái ghế thường xuyên theo thời gian thực
 *     (đặt ghế realtime), hãy cân nhắc tách GheNgoi ra collection riêng.
 */

// Sub-schema: Ghế ngồi (nhúng vào phòng chiếu)
const gheNgoiSchema = new mongoose.Schema(
    {
        tenGheNgoi: {
            type: String,
            required: true,
            trim: true,
            maxlength: 10,  // A1, B2, ...
        },
        loaiGhe: {
            type: String,
            enum: ['VIP', 'Thường', 'Sweetbox'],
            default: 'Thường',
        },
        giaGheNgoi: {
            type: Number,
            default: 0,
            min: 0,
        },
        // 0 = trống, 1 = đã đặt (có thể dùng boolean, hoặc enum)
        tinhTrangDatGhe: {
            type: Number,
            enum: [0, 1],
            default: 0,
        },
    },
    { _id: true }   // Giữ _id để có thể tham chiếu từ VeXemPhim
);

// Sub-schema: Phòng chiếu (nhúng vào rạp)
const phongChieuSchema = new mongoose.Schema(
    {
        tenPhongChieu: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        gheNgois: {
            type: [gheNgoiSchema],
            default: [],
        },
    },
    { _id: true }
);

// Schema chính: Rạp chiếu phim
const thongTinRapSchema = new mongoose.Schema(
    {
        tenRap: {
            type: String,
            required: [true, 'Tên rạp là bắt buộc'],
            trim: true,
            maxlength: 255,
        },
        diaChi: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        soDienThoai: {
            type: String,
            trim: true,
            maxlength: 15,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            maxlength: 100,
        },
        phongChieus: {
            type: [phongChieuSchema],
            default: [],
        },
    },
    {
        collection: 'thongtinraps',
        timestamps: true,
    }
);

module.exports = mongoose.model('ThongTinRap', thongTinRapSchema);
