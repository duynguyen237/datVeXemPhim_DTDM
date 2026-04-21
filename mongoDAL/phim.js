/**
 * mongoDAL/phim.js
 * Data Access Layer cho collection Phim - thay thế models/phim.js (mssql)
 *
 * Kiến trúc 3 lớp:
 *   Controller → DAL (file này) → Mongoose Model → MongoDB
 */

const Phim = require('../mongoModels/Phim');
const TheLoai = require('../mongoModels/TheLoai');
const SuatChieu = require('../mongoModels/SuatChieu');
const HoaDon = require('../mongoModels/HoaDon');

class PhimDAL {
    // ─────────────────────────────────────────────
    // READ: Lấy toàn bộ phim (kèm ngày khởi chiếu sớm nhất)
    // ─────────────────────────────────────────────
    async getAll() {
        // Dùng aggregation để tính ngày chiếu sớm nhất từ SuatChieu
        const phims = await Phim.aggregate([
            {
                $lookup: {
                    from: 'suatchieus',
                    localField: '_id',
                    foreignField: 'phim',
                    as: 'suatChieus',
                },
            },
            {
                $addFields: {
                    ngayKhoiChieu: { $min: '$suatChieus.ngayChieu' },
                },
            },
            {
                $project: { suatChieus: 0 }, // Không trả về mảng suatChieus
            },
            { $sort: { createdAt: -1 } },
        ]);
        return phims;
    }

    // ─────────────────────────────────────────────
    // READ: Lấy 1 phim theo ID (kèm tên thể loại)
    // ─────────────────────────────────────────────
    async getById(id) {
        // populate() tương đương LEFT JOIN; tenTheLoai đã snapshot sẵn
        return await Phim.findById(id).populate('theLoai', 'tenTheLoai').lean();
    }

    // ─────────────────────────────────────────────
    // READ: Lấy tất cả thể loại (dùng trong form thêm/sửa phim)
    // ─────────────────────────────────────────────
    async getAllTheLoai() {
        return await TheLoai.find().sort({ tenTheLoai: 1 }).lean();
    }

    // ─────────────────────────────────────────────
    // CREATE: Thêm phim mới
    // ─────────────────────────────────────────────
    async create(data) {
        // Lấy tên thể loại để lưu snapshot
        let tenTheLoai = '';
        if (data.theLoaiId) {
            const theLoai = await TheLoai.findById(data.theLoaiId).lean();
            tenTheLoai = theLoai?.tenTheLoai ?? '';
        }

        const phimMoi = new Phim({
            tenPhim: data.tenPhim,
            duongDanTrailer: data.duongDanTrailer,
            noiDungPhim: data.noiDungPhim,
            gioiHanTuoi: data.gioiHanTuoi,
            thoiLuongPhim: data.thoiLuongPhim,
            daoDien: data.daoDien,
            dienVien: data.dienVien,
            hinhAnhPoster: data.hinhAnhPoster,
            hinhAnhNen: data.hinhAnhNen,
            theLoai: data.theLoaiId,
            tenTheLoai,
        });
        return await phimMoi.save();
    }

    // ─────────────────────────────────────────────
    // UPDATE: Cập nhật phim theo ID
    // ─────────────────────────────────────────────
    async update(id, data) {
        // Nếu thay đổi thể loại → cập nhật snapshot tenTheLoai
        let tenTheLoai;
        if (data.theLoaiId) {
            const theLoai = await TheLoai.findById(data.theLoaiId).lean();
            tenTheLoai = theLoai?.tenTheLoai ?? '';
        }

        const updateData = {
            tenPhim: data.tenPhim,
            duongDanTrailer: data.duongDanTrailer,
            noiDungPhim: data.noiDungPhim,
            gioiHanTuoi: data.gioiHanTuoi,
            thoiLuongPhim: data.thoiLuongPhim,
            daoDien: data.daoDien,
            dienVien: data.dienVien,
            hinhAnhPoster: data.hinhAnhPoster,
            hinhAnhNen: data.hinhAnhNen,
        };
        if (data.theLoaiId) {
            updateData.theLoai = data.theLoaiId;
            updateData.tenTheLoai = tenTheLoai;
        }

        return await Phim.findByIdAndUpdate(id, { $set: updateData }, {
            new: true,          // Trả về document sau khi update
            runValidators: true,
        });
    }

    // ─────────────────────────────────────────────
    // DELETE: Xóa phim theo ID
    // ─────────────────────────────────────────────
    async delete(id) {
        return await Phim.findByIdAndDelete(id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // COMPLEX QUERY: Lấy danh sách phim User đã xem
    // (Tương đương SQL getPhimDaXem với JOIN HOA_DON → SUAT_CHIEU → PHIM)
    //
    // Luồng MongoDB:
    //   1. Tìm HoaDon của nguoiDungId với trangThai = 'Đã thanh toán'
    //   2. Lấy danh sách phimId từ veXemPhims[].suatChieu (ref → SuatChieu)
    //   3. Populate SuatChieu để lấy phim._id
    //   4. Distinct để loại trùng
    // ─────────────────────────────────────────────────────────────────────────
    async getPhimDaXem(nguoiDungId) {
        /*
         * Dùng Mongoose Aggregation Pipeline - tương đương SQL:
         *
         * SELECT DISTINCT p.MA_PHIM, p.TEN_PHIM
         * FROM HOA_DON hd
         * JOIN SUAT_CHIEU sc ON hd.MA_SUAT_CHIEU = sc.MA_SUAT_CHIEU
         * JOIN PHIM p ON sc.MA_PHIM = p.MA_PHIM
         * WHERE hd.MA_NGUOI_DUNG = @maND
         *   AND hd.TRANG_THAI_THANH_TOAN IN ('Thành công', 'Đã thanh toán')
         */
        const mongoose = require('mongoose');
        const nguoiDungObjId = new mongoose.Types.ObjectId(nguoiDungId);

        const results = await HoaDon.aggregate([
            // Bước 1: Lọc hóa đơn của người dùng với trạng thái đã thanh toán
            {
                $match: {
                    nguoiDung: nguoiDungObjId,
                    trangThaiThanhToan: { $in: ['Đã thanh toán', 'Thành công'] },
                },
            },

            // Bước 2: Unwind mảng veXemPhims (1 row per vé)
            {
                $unwind: '$veXemPhims',
            },

            // Bước 3: Join với collection SuatChieu để lấy phimId
            {
                $lookup: {
                    from: 'suatchieus',
                    localField: 'veXemPhims.suatChieu',
                    foreignField: '_id',
                    as: 'suatChieuInfo',
                },
            },
            { $unwind: '$suatChieuInfo' },

            // Bước 4: Join với collection Phim để lấy thông tin phim
            {
                $lookup: {
                    from: 'phims',
                    localField: 'suatChieuInfo.phim',
                    foreignField: '_id',
                    as: 'phimInfo',
                },
            },
            { $unwind: '$phimInfo' },

            // Bước 5: Group theo phimId để loại trùng (DISTINCT)
            {
                $group: {
                    _id: '$phimInfo._id',
                    tenPhim: { $first: '$phimInfo.tenPhim' },
                    hinhAnhPoster: { $first: '$phimInfo.hinhAnhPoster' },
                    gioiHanTuoi: { $first: '$phimInfo.gioiHanTuoi' },
                    thoiLuongPhim: { $first: '$phimInfo.thoiLuongPhim' },
                    tenTheLoai: { $first: '$phimInfo.tenTheLoai' },
                },
            },

            // Bước 6: Sắp xếp theo tên phim
            { $sort: { tenPhim: 1 } },
        ]);

        return results;
    }
}

module.exports = new PhimDAL();
