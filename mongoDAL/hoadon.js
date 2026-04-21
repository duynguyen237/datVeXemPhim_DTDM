/**
 * mongoDAL/hoadon.js
 * Data Access Layer cho collection HoaDon - thay thế models/hoadon.js (mssql)
 */

const mongoose = require('mongoose');
const HoaDon = require('../mongoModels/HoaDon');
const SuatChieu = require('../mongoModels/SuatChieu');
const ThongTinRap = require('../mongoModels/Rap');

class HoaDonDAL {
    // ─────────────────────────────────────────────
    // CREATE: Tạo hóa đơn mới (kèm vé nhúng)
    // Thay thế: INSERT INTO HOA_DON + INSERT INTO VE_XEM_PHIM
    // ─────────────────────────────────────────────
    async create({ nguoiDungId, hoTenNguoiDung, suatChieuId, tongTienThanhToan, dsVe, dsSanPham }) {
        // Lấy thông tin suất chiếu để snapshot
        const suatChieu = await SuatChieu.findById(suatChieuId).lean();
        if (!suatChieu) throw new Error('Suất chiếu không tồn tại');

        // Xây dựng mảng vé nhúng
        const veXemPhims = (dsVe || []).map(ve => ({
            gheNgoiId: ve.gheNgoiId,
            tenGheNgoi: ve.tenGheNgoi,
            loaiGhe: ve.loaiGhe,
            giaGhe: ve.giaGhe,
            suatChieu: suatChieuId,
            // Snapshot từ suất chiếu
            tenPhim: suatChieu.tenPhim,
            ngayChieu: suatChieu.ngayChieu,
            gioBatDau: suatChieu.gioBatDau,
            tenPhongChieu: suatChieu.tenPhongChieu,
            tenRap: suatChieu.tenRap,
        }));

        // Xây dựng mảng sản phẩm nhúng
        const chiTietHoaDons = (dsSanPham || []).map(sp => ({
            sanPham: sp.sanPhamId,
            tenSanPham: sp.tenSanPham,
            giaBan: sp.giaBan,
            soLuong: sp.soLuong || 1,
        }));

        const gioDatVe = new Date().toTimeString().split(' ')[0]; // "HH:mm:ss"

        const hoaDonMoi = new HoaDon({
            nguoiDung: nguoiDungId,
            hoTenNguoiDung,
            suatChieu: suatChieuId,
            ngayDatVe: new Date(),
            gioDatVe,
            tongTienThanhToan,
            trangThaiThanhToan: 'Chờ thanh toán',
            veXemPhims,
            chiTietHoaDons,
        });

        const saved = await hoaDonMoi.save();
        return saved._id; // Trả về ID để dùng trong VNPay
    }

    // ─────────────────────────────────────────────
    // READ: Lấy tất cả hóa đơn cho trang Admin (kèm JOIN thông tin)
    // ─────────────────────────────────────────────
    async getAllAdmin() {
        return await HoaDon.find()
            .populate('nguoiDung', 'hoTen soDienThoai')
            .populate('suatChieu', 'tenPhim ngayChieu gioBatDau')
            .sort({ ngayDatVe: -1 })
            .lean();
    }

    // ─────────────────────────────────────────────
    // READ: Lấy lịch sử hóa đơn của 1 người dùng
    // ─────────────────────────────────────────────
    async getLichSuByNguoiDung(nguoiDungId) {
        return await HoaDon.find({ nguoiDung: nguoiDungId })
            .sort({ ngayDatVe: -1, gioDatVe: -1 })
            .lean();
    }

    // ─────────────────────────────────────────────
    // READ: Lấy chi tiết hóa đơn kèm vé để in
    // Thay thế: JOIN HOA_DON + VE_XEM_PHIM + GHE_NGOI + SUAT_CHIEU + PHIM + PHONG
    // → Trong MongoDB: dữ liệu đã được nhúng sẵn, chỉ cần findById
    // ─────────────────────────────────────────────
    async getDanhSachVeDeIn(hoaDonId) {
        const hoaDon = await HoaDon.findById(hoaDonId).lean();
        if (!hoaDon) throw new Error('Hóa đơn không tồn tại');

        // Dữ liệu vé đã nhúng sẵn với đầy đủ snapshot, chỉ cần return
        return hoaDon;
    }

    // ─────────────────────────────────────────────
    // UPDATE: Cập nhật trạng thái thanh toán
    // ─────────────────────────────────────────────
    async updateTrangThai(hoaDonId, trangThai, maGiaoDich = null) {
        const updateData = { trangThaiThanhToan: trangThai };
        if (maGiaoDich) updateData.maGiaoDichVNPay = maGiaoDich;

        return await HoaDon.findByIdAndUpdate(
            hoaDonId,
            { $set: updateData },
            { new: true }
        );
    }

    // ─────────────────────────────────────────────
    // READ: Tìm hóa đơn theo mã giao dịch VNPay
    // ─────────────────────────────────────────────
    async findByMaGiaoDich(maGiaoDich) {
        return await HoaDon.findOne({ maGiaoDichVNPay: maGiaoDich }).lean();
    }

    // ─────────────────────────────────────────────
    // READ: Thống kê doanh thu (ví dụ cho admin dashboard)
    // ─────────────────────────────────────────────
    async getThongKeDoanhThu() {
        return await HoaDon.aggregate([
            { $match: { trangThaiThanhToan: 'Đã thanh toán' } },
            {
                $group: {
                    _id: {
                        nam: { $year: '$ngayDatVe' },
                        thang: { $month: '$ngayDatVe' },
                    },
                    doanhThu: { $sum: '$tongTienThanhToan' },
                    soHoaDon: { $count: {} },
                },
            },
            { $sort: { '_id.nam': -1, '_id.thang': -1 } },
        ]);
    }
    async deleteHoaDon(hoaDonId) {
        try {
            // Kiểm tra ID hợp lệ trước khi xóa
            if (!mongoose.Types.ObjectId.isValid(hoaDonId)) {
                console.error("ID hóa đơn không hợp lệ để xóa:", hoaDonId);
                return null;
            }
            return await HoaDon.findByIdAndDelete(hoaDonId);
        } catch (error) {
            console.error("Lỗi xóa hóa đơn tại DAL:", error.message);
            throw error;
        }
    }
}

module.exports = new HoaDonDAL();
