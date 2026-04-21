// controllers/suatChieuController.js
const SuatChieuModel = require('../mongoDAL/suatchieu');

const suatChieuController = {
    // Hàm này để hiện lịch chiếu ở trang Chi tiết phim/Đặt vé
    getSuatChieuByPhim: async (req, res) => {
        try {
            const maPhim = req.params.maPhim;
            // Gọi đúng hàm getByPhimId trong file mongoDAL/suatchieu.js
            const data = await SuatChieuModel.getByPhimId(maPhim);

            res.json({
                success: true,
                data: data
            });
        } catch (error) {
            console.error("Lỗi lấy lịch chiếu:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // Hàm này để hiện thông tin ở Sidebar trang chọn ghế
    getThongTin: async (req, res) => {
        try {
            const id = req.params.id;
            const data = await SuatChieuModel.getChiTietSuatChieu(id);
            if (data) {
                res.json({ success: true, data: data });
            } else {
                res.status(404).json({ success: false, message: "Không tìm thấy suất chiếu" });
            }
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};





const HoaDon = require('../mongoModels/HoaDon');

const getGheDaDat = async (maSuatChieu) => {
    try {
        // 1. Tìm tất cả hóa đơn ĐÃ THANH TOÁN của suất chiếu này
        const hoaDons = await HoaDon.find({
            suatChieuId: maSuatChieu,
            trangThaiThanhToan: 'Đã thanh toán'
        });

        // 2. Gom tất cả maGhe từ danh sách hóa đơn vào một mảng duy nhất
        let danhSachGheDaDat = [];
        hoaDons.forEach(hd => {
            hd.dsVe.forEach(ve => {
                danhSachGheDaDat.push(ve.gheNgoiId.toString());
            });
        });

        return danhSachGheDaDat; // Trả về mảng các ID ghế (ví dụ: ["65abc...", "65def..."])
        console.log("Danh sách ghế đã đặt:", danhSachGheDaDat);

    } catch (error) {
        console.error("Lỗi truy vấn ghế đã đặt:", error);
        return [];
    }
};

module.exports = suatChieuController;