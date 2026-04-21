const mongoose = require('mongoose');

/**
 * NGUOI_DUNG → Collection: nguoidungs
 *
 * Quyết định thiết kế NoSQL:
 * - NHÚNG (embed) vai trò dưới dạng string thay vì ObjectId reference,
 *   vì vai trò là tập cố định nhỏ (admin/user) → tránh lookup không cần thiết.
 * - TEN_DANG_NHAP phải unique.
 * - MAT_KHAU lưu dạng bcrypt hash.
 */
const nguoiDungSchema = new mongoose.Schema(
    {
        tenDangNhap: {
            type: String,
            required: [true, 'Tên đăng nhập là bắt buộc'],
            unique: true,
            trim: true,
            lowercase: true,
            maxlength: 50,
        },
        matKhau: {
            type: String,
            required: [true, 'Mật khẩu là bắt buộc'],
            select: false, // Không trả mật khẩu trong query mặc định
        },
        hoTen: {
            type: String,
            trim: true,
            maxlength: 100,
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
        // NHÚNG vai trò thay vì ref để truy xuất nhanh
        vaiTro: {
            type: String,
            enum: ['admin', 'user'],
            default: 'user',
        },
    },
    {
        collection: 'nguoidungs',
        timestamps: true,
    }
);

// Index để tìm kiếm nhanh theo email
nguoiDungSchema.index({ email: 1 });

module.exports = mongoose.model('NguoiDung', nguoiDungSchema);
