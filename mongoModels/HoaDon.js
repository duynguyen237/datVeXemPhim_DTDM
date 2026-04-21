const mongoose = require('mongoose');

/**
 * HOA_DON + VE_XEM_PHIM + CHI_TIET_HOA_DON → Collection: hoadons
 *
 * ===================================================
 * ĐÂY LÀ QUYẾT ĐỊNH THIẾT KẾ QUAN TRỌNG NHẤT:
 * ===================================================
 * Trong SQL có 3 bảng riêng:
 *   HOA_DON  ←  VE_XEM_PHIM  (1 hóa đơn - nhiều vé)
 *   HOA_DON  ←  CHI_TIET_HOA_DON  (1 hóa đơn - nhiều sản phẩm)
 *
 * Trong MongoDB, ta NHÚNG (embed) tất cả vào HOA_DON vì:
 *   1. Vé (VeXemPhim) chỉ tồn tại trong ngữ cảnh của 1 hóa đơn cụ thể.
 *   2. Chi tiết sản phẩm (ChiTietHoaDon) cũng chỉ thuộc 1 hóa đơn.
 *   3. Đọc hóa đơn = đọc toàn bộ vé + sản phẩm → 1 query duy nhất.
 *   4. Số lượng vé/sản phẩm trong 1 hóa đơn là bounded (thường < 20).
 *
 * Pattern: HOA_DON là "aggregate root" bọc tất cả dữ liệu con.
 */

// ------- Sub-schema: Vé xem phim (nhúng vào hóa đơn) -------
const veXemPhimSchema = new mongoose.Schema(
    {
        // Ref tới embedded gheNgoi._id bên trong ThongTinRap
        gheNgoiId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        // Snapshot thông tin ghế để hiển thị trên vé (không cần lookup lại)
        tenGheNgoi: { type: String },
        loaiGhe: { type: String },
        giaGhe: { type: Number, default: 0 },

        // Ref tới SuatChieu
        suatChieu: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SuatChieu',
            required: true,
        },
        // Snapshot suất chiếu
        tenPhim: { type: String },
        ngayChieu: { type: Date },
        gioBatDau: { type: String },
        tenPhongChieu: { type: String },
        tenRap: { type: String },
    },
    { _id: true }
);

// ------- Sub-schema: Chi tiết sản phẩm bán kèm (nhúng vào hóa đơn) -------
const chiTietHoaDonSchema = new mongoose.Schema(
    {
        sanPham: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SanPham',
        },
        // Snapshot tên & giá sản phẩm tại thời điểm mua
        tenSanPham: { type: String },
        giaBan: { type: Number, default: 0 },
        soLuong: { type: Number, default: 1, min: 1 },
    },
    { _id: true }
);

// ------- Schema chính: Hóa đơn -------
const hoaDonSchema = new mongoose.Schema(
    {
        // Ref tới NguoiDung
        nguoiDung: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'NguoiDung',
            required: true,
        },
        // Snapshot tên người dùng để hiển thị trên hóa đơn
        hoTenNguoiDung: { type: String },

        // Ref tới SuatChieu (suất chiếu của hóa đơn này)
        suatChieu: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SuatChieu',
        },

        ngayDatVe: {
            type: Date,
            default: Date.now,
        },
        gioDatVe: {
            type: String,   // "HH:mm:ss"
        },
        tongTienThanhToan: {
            type: Number,
            default: 0,
            min: 0,
        },
        trangThaiThanhToan: {
            type: String,
            enum: ['Chờ thanh toán', 'Đã thanh toán', 'Đã hủy'],
            default: 'Chờ thanh toán',
        },
        maGiaoDichVNPay: {
            type: String,
            trim: true,
            maxlength: 100,
        },

        // ✅ NHÚNG danh sách vé xem phim
        veXemPhims: {
            type: [veXemPhimSchema],
            default: [],
        },

        // ✅ NHÚNG danh sách sản phẩm bán kèm
        chiTietHoaDons: {
            type: [chiTietHoaDonSchema],
            default: [],
        },
    },
    {
        collection: 'hoadons',
        timestamps: true,
    }
);

// Index để truy vấn hóa đơn theo người dùng và trạng thái (câu query phức tạp)
hoaDonSchema.index({ nguoiDung: 1, trangThaiThanhToan: 1 });
hoaDonSchema.index({ suatChieu: 1 });
hoaDonSchema.index({ ngayDatVe: -1 });

module.exports = mongoose.model('HoaDon', hoaDonSchema);
