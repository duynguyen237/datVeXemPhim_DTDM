/**
 * mongoDAL/suatchieu.js
 * Data Access Layer cho collection SuatChieu - thay thế models/suatchieu.js
 */

const mongoose = require('mongoose');
const SuatChieu = require('../mongoModels/SuatChieu');
const ThongTinRap = require('../mongoModels/Rap');
const Phim = require('../mongoModels/Phim');

class SuatChieuDAL {
    // ─────────────────────────────────────────────
    // READ: Lấy tất cả suất chiếu
    // ─────────────────────────────────────────────
    async getAll() {
        return await SuatChieu.find()
            .populate('phim', 'tenPhim hinhAnhPoster thoiLuongPhim')
            .populate('rap', 'tenRap diaChi')
            .sort({ ngayChieu: 1, gioBatDau: 1 })
            .lean();
    }

    // ─────────────────────────────────────────────
    // READ: Lấy suất chiếu theo phimId
    // ─────────────────────────────────────────────
    async getByPhimId(phimId) {
        return await SuatChieu.find({ phim: phimId })
            .populate('rap', 'tenRap diaChi')
            .sort({ ngayChieu: 1 })
            .lean();
    }

    // ─────────────────────────────────────────────
    // READ: Lấy chi tiết 1 suất chiếu kèm danh sách ghế còn trống
    // (Tương đương query phức tạp: JOIN SUAT_CHIEU + PHONG_CHIEU + GHE_NGOI)
    // ─────────────────────────────────────────────
    async getChiTietSuatChieu(suatChieuId) {
        // Lấy suất chiếu
        const suatChieu = await SuatChieu.findById(suatChieuId)
            .populate('phim')
            .lean();
        if (!suatChieu) return null;

        // Tìm phòng chiếu bên trong rạp (embedded document)
        const rap = await ThongTinRap.findById(suatChieu.rap).lean();
        if (!rap) return suatChieu;

        // Lấy phòng chiếu cụ thể theo phongChieuId
        const phong = rap.phongChieus.find(
            p => p._id.toString() === suatChieu.phongChieuId.toString()
        );

        return {
            ...suatChieu,
            tenRap: rap.tenRap,
            diaChiRap: rap.diaChi,
            phongChieu: phong || null,
            gheNgois: phong?.gheNgois || [],
        };
    }

    // ─────────────────────────────────────────────
    // CREATE: Thêm suất chiếu mới
    // ─────────────────────────────────────────────
    async create(data) {
        // Lấy snapshot phim và phòng chiếu
        const phim = await Phim.findById(data.phimId).lean();
        const rap = await ThongTinRap.findById(data.rapId).lean();
        const phong = rap?.phongChieus.find(
            p => p._id.toString() === data.phongChieuId
        );

        const suatMoi = new SuatChieu({
            phim: data.phimId,
            tenPhim: phim?.tenPhim,
            rap: data.rapId,
            tenRap: rap?.tenRap,
            phongChieuId: data.phongChieuId,
            tenPhongChieu: phong?.tenPhongChieu,
            ngayChieu: data.ngayChieu,
            gioBatDau: data.gioBatDau,
            gioKetThuc: data.gioKetThuc,
            giaVeCoban: data.giaVeCoban || 75000,
        });
        return await suatMoi.save();
    }

    // ─────────────────────────────────────────────
    // UPDATE: Cập nhật suất chiếu
    // ─────────────────────────────────────────────
    async update(id, data) {
        return await SuatChieu.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true, runValidators: true }
        );
    }

    // ─────────────────────────────────────────────
    // DELETE: Xóa suất chiếu
    // ─────────────────────────────────────────────
    async delete(id) {
        return await SuatChieu.findByIdAndDelete(id);
    }
}

module.exports = new SuatChieuDAL();
