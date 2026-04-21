/**
 * mongoDAL/taikhoan.js
 * Data Access Layer cho NguoiDung - thay thế models/taikhoan.js
 */

const NguoiDung = require('../mongoModels/NguoiDung');

class TaiKhoanDAL {
    // ─────────────────────────────────────────────
    // READ: Tìm theo tên đăng nhập (dùng khi login)
    // ─────────────────────────────────────────────
    async findByTenDangNhap(tenDangNhap) {
        // select('+matKhau') vì matKhau có select: false
        return await NguoiDung.findOne({ tenDangNhap }).select('+matKhau').lean();
    }

    // ─────────────────────────────────────────────
    // READ: Lấy thông tin người dùng theo ID (không lấy mật khẩu)
    // ─────────────────────────────────────────────
    async getById(id) {
        return await NguoiDung.findById(id).lean();
    }

    async findById(id) {
        return await NguoiDung.findById(id).select('+matKhau');
    }
    // ─────────────────────────────────────────────
    // READ: Lấy tất cả người dùng (Admin)
    // ─────────────────────────────────────────────
    async getAll() {
        return await NguoiDung.find().sort({ createdAt: -1 }).lean();
    }

    // ─────────────────────────────────────────────
    // CREATE: Đăng ký tài khoản mới
    // ─────────────────────────────────────────────
    async create(data) {
        const nguoiDungMoi = new NguoiDung({
            tenDangNhap: data.tenDangNhap,
            matKhau: data.matKhau,      // Đã hash ở Service layer
            hoTen: data.hoTen,
            soDienThoai: data.soDienThoai,
            email: data.email,
            vaiTro: data.vaiTro || 'user',
        });
        return await nguoiDungMoi.save();
    }

    // ─────────────────────────────────────────────
    // UPDATE: Cập nhật thông tin người dùng
    // ─────────────────────────────────────────────
    async update(id, data) {
        // Không cho cập nhật mật khẩu qua đây (có hàm đổi mật khẩu riêng)
        const { matKhau, tenDangNhap, ...updateData } = data;
        return await NguoiDung.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).lean();
    }

    // ─────────────────────────────────────────────
    // UPDATE: Đổi mật khẩu (hash đã được xử lý ở Service layer)
    // ─────────────────────────────────────────────
    async updatePassword(id, hashedPassword) {
        return await NguoiDung.findByIdAndUpdate(id, {
            $set: { matKhau: hashedPassword }
        });
    }

    // ─────────────────────────────────────────────
    // DELETE: Xóa tài khoản
    // ─────────────────────────────────────────────
    async delete(id) {
        return await NguoiDung.findByIdAndDelete(id);
    }
}

module.exports = new TaiKhoanDAL();
