/**
 * mongoDAL/rap.js
 * Data Access Layer cho ThongTinRap + PhongChieu - thay thế models/rap.js & models/phong.js
 */

const ThongTinRap = require('../mongoModels/Rap');

class RapDAL {
    // ─────────────────────────────────────────────
    // READ: Lấy tất cả rạp (không lấy ghế để tránh payload lớn)
    // ─────────────────────────────────────────────
    async getAll() {
        return await ThongTinRap.find(
            {},
            { 'phongChieus.gheNgois': 0 }  // Exclude mảng ghế
        ).lean();
    }

    // ─────────────────────────────────────────────
    // READ: Lấy chi tiết 1 rạp kèm phòng chiếu và ghế ngồi
    // ─────────────────────────────────────────────
    async getById(id) {
        return await ThongTinRap.findById(id).lean();
    }

    // ─────────────────────────────────────────────
    // READ: Lấy các phòng chiếu của 1 rạp
    // ─────────────────────────────────────────────
    async getPhongChieuByRap(rapId) {
        const rap = await ThongTinRap.findById(rapId, { 'phongChieus.gheNgois': 0 }).lean();
        return rap?.phongChieus || [];
    }

    // ─────────────────────────────────────────────
    // CREATE: Thêm rạp mới
    // ─────────────────────────────────────────────
    async create(data) {
        const rapMoi = new ThongTinRap({
            tenRap: data.tenRap,
            diaChi: data.diaChi,
            soDienThoai: data.soDienThoai,
            email: data.email,
            phongChieus: [],
        });
        return await rapMoi.save();
    }

    // ─────────────────────────────────────────────
    // UPDATE: Cập nhật thông tin rạp
    // ─────────────────────────────────────────────
    async update(id, data) {
        return await ThongTinRap.findByIdAndUpdate(
            id,
            { $set: { tenRap: data.tenRap, diaChi: data.diaChi, soDienThoai: data.soDienThoai, email: data.email } },
            { new: true, runValidators: true }
        ).lean();
    }

    // ─────────────────────────────────────────────
    // DELETE: Xóa rạp
    // ─────────────────────────────────────────────
    async delete(id) {
        return await ThongTinRap.findByIdAndDelete(id);
    }

    // ─────────────────────────────────────────────
    // CREATE (nested): Thêm phòng chiếu vào rạp
    // ─────────────────────────────────────────────
    async addPhongChieu(rapId, tenPhongChieu, dsGheKhoiTao = []) {
        return await ThongTinRap.findByIdAndUpdate(
            rapId,
            {
                $push: {
                    phongChieus: {
                        tenPhongChieu,
                        gheNgois: dsGheKhoiTao,
                    },
                },
            },
            { new: true }
        );
    }

    // ─────────────────────────────────────────────
    // DELETE (nested): Xóa phòng chiếu khỏi rạp
    // ─────────────────────────────────────────────
    async removePhongChieu(rapId, phongChieuId) {
        return await ThongTinRap.findByIdAndUpdate(
            rapId,
            { $pull: { phongChieus: { _id: phongChieuId } } },
            { new: true }
        );
    }
}

module.exports = new RapDAL();
