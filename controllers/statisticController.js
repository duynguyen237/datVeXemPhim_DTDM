// Thay vì dùng pool SQL, ta gọi thẳng Model HoaDon để sử dụng Aggregation Pipeline
const HoaDon = require('../mongoModels/HoaDon');

const getRevenueStatistics = async (req, res) => {
    try {
        console.log("Đang tổng hợp dữ liệu thống kê bằng MongoDB...");

        // =====================================================================
        // 1. LẤY TỔNG QUAN (Doanh thu hôm nay, Tổng vé, Tổng HĐ, Tổng doanh thu)
        // =====================================================================
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const tongQuanResult = await HoaDon.aggregate([
            { $match: { trangThaiThanhToan: 'Đã thanh toán' } },
            {
                $group: {
                    _id: null,
                    // Dùng $cond để chỉ cộng tiền nếu hóa đơn lập >= 0h hôm nay
                    DoanhThuHnay: {
                        $sum: { $cond: [{ $gte: ["$ngayDatVe", startOfDay] }, "$tongTienThanhToan", 0] }
                    },
                    // Tính tổng số vé bằng cách đếm chiều dài của mảng veXemPhims
                    TongVeBanRa: { $sum: { $size: "$veXemPhims" } },
                    TongHoaDon: { $sum: 1 },
                    TongDoanhThu: { $sum: "$tongTienThanhToan" }
                }
            }
        ]);
        const tongQuan = tongQuanResult[0] || { DoanhThuHnay: 0, TongVeBanRa: 0, TongHoaDon: 0, TongDoanhThu: 0 };

        // =====================================================================
        // 2. LẤY TOP 5 PHIM DOANH THU CAO NHẤT
        // =====================================================================
        const topPhim = await HoaDon.aggregate([
            { $match: { trangThaiThanhToan: 'Đã thanh toán' } },
            // $unwind sẽ "bung" mảng vé ra thành từng dòng để dễ đếm
            { $unwind: "$veXemPhims" },
            {
                $group: {
                    _id: "$veXemPhims.tenPhim",
                    SoVe: { $sum: 1 },
                    DoanhThu: { $sum: "$veXemPhims.giaGhe" } // Cộng tổng tiền ghế
                }
            },
            { $sort: { DoanhThu: -1 } }, // Sắp xếp giảm dần theo doanh thu
            { $limit: 5 },               // Chỉ lấy Top 5
            {
                // Định dạng lại tên biến để khớp với EJS cũ của bạn
                $project: { TenPhim: "$_id", SoVe: 1, DoanhThu: 1, _id: 0 }
            }
        ]);

        // =====================================================================
        // 3. LẤY DOANH THU THEO THÁNG TRONG NĂM NAY
        // =====================================================================
        const currentYear = new Date().getFullYear();
        const doanhThuThang = await HoaDon.aggregate([
            {
                $match: {
                    trangThaiThanhToan: 'Đã thanh toán',
                    ngayDatVe: {
                        $gte: new Date(`${currentYear}-01-01`),
                        $lte: new Date(`${currentYear}-12-31T23:59:59`)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: "$ngayDatVe" }, // Tách tháng ra từ ngày
                    DoanhThu: { $sum: "$tongTienThanhToan" }
                }
            },
            { $sort: { "_id": 1 } },
            {
                $project: { Thang: "$_id", DoanhThu: 1, _id: 0 }
            }
        ]);

        // =====================================================================
        // RENDER GIAO DIỆN
        // =====================================================================
        res.render('admin/doanhthu', {
            tongQuan: tongQuan,
            doanhThuThang: doanhThuThang,
            topPhim: topPhim,
            doanhThuPhim: topPhim // Dùng chung TopPhim cho biểu đồ nếu logic giống nhau
        });

    } catch (error) {
        console.error("Lỗi trang thống kê Admin:", error);
        res.status(500).send("Lỗi tải trang thống kê.");
    }
};

module.exports = { getRevenueStatistics };