/**
 * mongoDAL/ghe.js
 * Data Access Layer cho Ghế Ngồi - thay thế models/ghe.js
 *
 * Trong MongoDB, ghế ngồi là SUBDOCUMENT nhúng bên trong ThongTinRap.phongChieus[].gheNgois[]
 * Nên các thao tác CRUD phải đi qua ThongTinRap và dùng MongoDB positional operators.
 */

const ThongTinRap = require('../mongoModels/Rap');
// Import thêm 2 Model này để phục vụ cho hàm getBySuatChieu
const SuatChieu = require('../mongoModels/SuatChieu');
const HoaDon = require('../mongoModels/HoaDon');

class GheDAL {
    // ─────────────────────────────────────────────
    // BỔ SUNG: LẤY SƠ ĐỒ GHẾ CỦA 1 SUẤT CHIẾU (Kết hợp vé đã bán)
    // ─────────────────────────────────────────────
    async getBySuatChieu(maSuatChieu) {
        try {
            // 1. Lấy Suất Chiếu
            const suatChieu = await SuatChieu.findById(maSuatChieu).lean();
            if (!suatChieu) return [];

            // 2. Lấy Rạp & Phòng chiếu
            const rap = await ThongTinRap.findById(suatChieu.rap).lean();
            if (!rap) return [];

            const phong = rap.phongChieus.find(p => p._id.toString() === suatChieu.phongChieuId.toString());
            if (!phong || !phong.gheNgois) return [];

            // 3. TRUY VẤN (SELECT) Hóa đơn - ĐÂY LÀ CHỖ CẦN FIX
            // Tìm tất cả hóa đơn có suatChieu khớp và trạng thái thành công
            const hoaDons = await HoaDon.find({
                suatChieu: maSuatChieu, // Truy vấn trực tiếp trường suatChieu ở root Hóa đơn
                trangThaiThanhToan: "Đã thanh toán"
            }).lean();

            // 4. Tạo một danh sách các ID ghế đã đặt (Dùng Set để check cho nhanh)
            const bookedSeatIds = new Set();
            hoaDons.forEach(hd => {
                if (hd.veXemPhims && hd.veXemPhims.length > 0) {
                    hd.veXemPhims.forEach(ve => {
                        if (ve.gheNgoiId) {
                            bookedSeatIds.add(ve.gheNgoiId.toString());
                        }
                    });
                }
            });

            // 5. Trả về sơ đồ ghế kèm trạng thái "nhuộm đen"
            return phong.gheNgois.map(ghe => {
                const gheIdStr = ghe._id.toString();
                // Ghế được coi là đã đặt nếu: có trong Hóa đơn HOẶC đã bị khóa cứng trong bảng Rạp
                const isBooked = bookedSeatIds.has(gheIdStr) || ghe.tinhTrangDatGhe === 1;

                return {
                    ...ghe,
                    tinhTrangDatGhe: isBooked ? 1 : 0,
                    DA_DAT: isBooked ? 1 : 0 // Trả về cả 2 tên biến cho chắc
                };
            });
        } catch (error) {
            console.error("Lỗi trong gheDAL.getBySuatChieu:", error);
            throw error;
        
    }
}

    // ─────────────────────────────────────────────
    // READ: Lấy danh sách ghế của 1 phòng chiếu
    // ─────────────────────────────────────────────
    async getByPhongChieuId(rapId, phongChieuId) {
    const rap = await ThongTinRap.findOne(
        { _id: rapId, 'phongChieus._id': phongChieuId },
        { 'phongChieus.$': 1 }  // Projection: chỉ lấy phòng chiếu match
    ).lean();

    const phong = rap?.phongChieus?.[0];
    return phong?.gheNgois || [];
}

    // ─────────────────────────────────────────────
    // UPDATE: Đánh dấu ghế đã được đặt (tinhTrangDatGhe = 1)
    // Dùng positional operator $[elem] để cập nhật nested array
    // ─────────────────────────────────────────────
    async datGhe(rapId, phongChieuId, gheNgoiId) {
    return await ThongTinRap.updateOne(
        {
            _id: rapId,
            'phongChieus._id': phongChieuId,
            'phongChieus.gheNgois._id': gheNgoiId,
        },
        {
            $set: {
                'phongChieus.$[phong].gheNgois.$[ghe].tinhTrangDatGhe': 1,
            },
        },
        {
            arrayFilters: [
                { 'phong._id': phongChieuId },
                { 'ghe._id': gheNgoiId },
            ],
        }
    );
}

    // ─────────────────────────────────────────────
    // UPDATE: Giải phóng ghế (tinhTrangDatGhe = 0) - dùng khi hủy đặt vé
    // ─────────────────────────────────────────────
    async huyDatGhe(rapId, phongChieuId, gheNgoiId) {
    return await ThongTinRap.updateOne(
        {
            _id: rapId,
            'phongChieus._id': phongChieuId,
        },
        {
            $set: {
                'phongChieus.$[phong].gheNgois.$[ghe].tinhTrangDatGhe': 0,
            },
        },
        {
            arrayFilters: [
                { 'phong._id': phongChieuId },
                { 'ghe._id': gheNgoiId },
            ],
        }
    );
}

    // ─────────────────────────────────────────────
    // CREATE: Thêm ghế vào phòng chiếu
    // ─────────────────────────────────────────────
    async addGhe(rapId, phongChieuId, gheData) {
    return await ThongTinRap.updateOne(
        { _id: rapId, 'phongChieus._id': phongChieuId },
        {
            $push: {
                'phongChieus.$.gheNgois': {
                    tenGheNgoi: gheData.tenGheNgoi,
                    loaiGhe: gheData.loaiGhe || 'Thường',
                    giaGheNgoi: gheData.giaGheNgoi || 0,
                    tinhTrangDatGhe: 0,
                },
            },
        }
    );
}
}

module.exports = new GheDAL();