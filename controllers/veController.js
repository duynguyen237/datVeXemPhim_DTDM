const vnpayService = require('../services/vnpayService');
const hoadonDAL = require('../mongoDAL/hoadon');

// ĐẢM BẢO ĐƯỜNG DẪN NÀY ĐÚNG VỚI THƯ MỤC TRONG PROJECT CỦA DUY
const HoaDon = require('../mongoModels/HoaDon');
const GheNgoi = require('../mongoModels/Rap');

class VeController {
    datVe = async (req, res) => {
        try {
            console.log("\n--- [START] KHỞI TẠO ĐƠN HÀNG MONGODB ---");
            const { hoTenNguoiDung, maSuatChieu, danhSachMaGhe, tongTien } = req.body;

            let maNguoiDung = req.session.user ? req.session.user._id : req.body.maNguoiDung;

            if (!maNguoiDung || maNguoiDung.toString().length < 24) {
                return res.status(401).json({
                    success: false,
                    message: "Phiên đăng nhập không hợp lệ! Vui lòng đăng nhập lại."
                });
            }

            let dsVe = [];
            if (Array.isArray(danhSachMaGhe)) {
                dsVe = danhSachMaGhe.map(ghe => ({
                    gheNgoiId: ghe.maGhe,
                    tenGheNgoi: ghe.tenGhe,
                    loaiGhe: ghe.loaiGhe,
                    giaGhe: ghe.giaGhe || 0,
                    suatChieu: maSuatChieu
                }));
            }

            const hoaDonId = await hoadonDAL.create({
                nguoiDungId: maNguoiDung,
                hoTenNguoiDung: hoTenNguoiDung || (req.session.user ? req.session.user.hoTen : 'Khách hàng'),
                suatChieuId: maSuatChieu,
                tongTienThanhToan: tongTien,
                dsVe: dsVe,
                dsSanPham: []
            });

            console.log(`dsSanPham trước khi tạo hóa đơn: ${JSON.stringify(req.body.dsSanPham)}`);

            const paymentUrl = vnpayService.createPaymentUrl(req, tongTien, hoaDonId.toString());
            res.json({ success: true, paymentUrl });

        } catch (error) {
            console.error("LỖI DATVE:", error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    vnpayReturn = async (req, res) => {
        try {
            console.log("\n" + "=".repeat(50));
            console.log("[HIT] Đã chạm được vào hàm vnpayReturn (Bản Mongoose Chuẩn)!");

            let vnp_Params = req.query;
            let secureHash = vnp_Params['vnp_SecureHash'];
            delete vnp_Params['vnp_SecureHash'];
            delete vnp_Params['vnp_SecureHashType'];

            vnp_Params = this.sortObject(vnp_Params);
            const secretKey = process.env.VNP_HASHSECRET;
            const signData = require('qs').stringify(vnp_Params, { encode: false });
            const hmac = require('crypto').createHmac("sha512", secretKey);
            const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

            const hoaDonId = vnp_Params['vnp_TxnRef']; // Lấy ID hóa đơn
            const responseCode = vnp_Params['vnp_ResponseCode'];

            const mongoose = require('mongoose');
            const HoaDon = require('../mongoModels/HoaDon');
            const ThongTinRap = require('../mongoModels/Rap'); // Nhớ check lại tên Model Rạp

            if (secureHash === signed && responseCode === "00") {

                // 1. TÌM HÓA ĐƠN TRONG DB (Thay vì dùng pendingOrders)
                const hoaDon = await HoaDon.findById(hoaDonId);

                if (!hoaDon) {
                    console.error("Không tìm thấy Hóa đơn trong CSDL!");
                    return res.render('ketquathanhtoan', { success: false, message: "Hóa đơn không tồn tại." });
                }

                console.log(`\n=> [OK] Thanh toán thành công cho Hóa đơn: ${hoaDonId}`);

                // 2. CẬP NHẬT TRẠNG THÁI HÓA ĐƠN
                hoaDon.trangThaiThanhToan = 'Đã thanh toán';
                hoaDon.maGiaoDichVNPay = vnp_Params['vnp_TransactionNo'];
                await hoaDon.save();
                console.log("=> Đã chốt trạng thái 'Đã thanh toán'.");

                // 3. LOGIC KHÓA GHẾ LỒNG 2 TẦNG (RAP -> PHONGCHIEU -> GHENGOI)
                try {
                    if (hoaDon.veXemPhims && hoaDon.veXemPhims.length > 0) {

                        // Lấy danh sách ID ghế từ hóa đơn
                        const mangIdGhe = hoaDon.veXemPhims.map(ve => new mongoose.Types.ObjectId(ve.gheNgoiId));

                        // Chọc thủng tầng mảng để khóa ghế
                        const updateResult = await ThongTinRap.updateMany(
                            { "phongChieus.gheNgois._id": { $in: mangIdGhe } },
                            {
                                $set: {
                                    "phongChieus.$[].gheNgois.$[ghe].tinhTrangDatGhe": 1
                                }
                            },
                            {
                                arrayFilters: [{ "ghe._id": { $in: mangIdGhe } }],
                                multi: true
                            }
                        );
                        console.log(`🔒 [THÀNH CÔNG] Đã khóa đen thui ${mangIdGhe.length} ghế!`);
                    } else {
                        console.log("⚠️ Hóa đơn này không có ghế nào được chọn.");
                    }
                } catch (errGhe) {
                    console.error("❌ Lỗi khi khóa ghế MongoDB:", errGhe.message);
                }

                console.log("=".repeat(50));

                // 4. TRẢ KẾT QUẢ RA MÀN HÌNH
                const thongTinVe = await hoadonDAL.getDanhSachVeDeIn(hoaDonId);
                res.render('ketquathanhtoan', { success: true, data: thongTinVe });

            } else {
                console.log(`Giao dịch thất bại. Hủy hóa đơn: ${hoaDonId}`);

                // Nếu khách hàng hủy thanh toán, xóa luôn hóa đơn nháp đi
                await HoaDon.findByIdAndDelete(hoaDonId);
                res.render('ketquathanhtoan', { success: false, message: "Thanh toán không thành công. Giao dịch đã bị hủy." });
            }
        } catch (error) {
            console.error("LỖI HỆ THỐNG:", error);
            res.status(500).send("Lỗi xử lý thanh toán.");
        }
    }

    sortObject(obj) {
        let sorted = {};
        let str = [];
        let key;
        for (key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                str.push(encodeURIComponent(key));
            }
        }
        str.sort();
        for (key = 0; key < str.length; key++) {
            sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
        }
        return sorted;
    }

    lichSuDatVe = async (req, res) => {
        try {
            const maND = req.session.user ? req.session.user._id : req.query.maND;
            if (!maND) return res.render('lichsu', { lichSu: null });
            const lichSu = await hoadonDAL.getLichSuByNguoiDung(maND);
            res.render('lichsu', { lichSu });
        } catch (error) {
            res.status(500).send("Lỗi lấy lịch sử.");
        }
    }
    // Hàm này đặt bên trong class VeController
    showPrintPage = async (req, res) => {
        try {
            const hoaDonId = req.params.id;

            // 1. Tìm hóa đơn và dùng .populate('suatChieu') để lấy thông tin Phim & Phòng
            const hoaDon = await HoaDon.findById(hoaDonId).populate('suatChieu');

            if (!hoaDon) {
                return res.status(404).send("Không tìm thấy thông tin hóa đơn để in vé!");
            }

            // 2. Chuẩn bị dữ liệu để truyền sang file EJS
            // Bạn cần đảm bảo veXemPhims đã có trường tenGheNgoi (đã snapshot lúc đặt vé)
            const danhSachVe = hoaDon.veXemPhims.map(ve => ({
                tenPhim: hoaDon.suatChieu.tenPhim,
                ngayChieu: hoaDon.suatChieu.ngayChieu,
                gioBatDau: hoaDon.suatChieu.gioBatDau,
                tenPhongChieu: hoaDon.suatChieu.tenPhongChieu,
                tenGheNgoi: ve.tenGheNgoi || 'N/A', // Nếu snapshot bị thiếu sẽ hiện N/A
                maHoaDon: hoaDon._id,
                maGiaoDichVNPay: hoaDon.maGiaoDichVNPay || 'Thanh toán trực tuyến'
            }));

            // 3. Gọi file print_ve.ejs và truyền dữ liệu vào
            res.render('print_ve', { danhSachVe });

        } catch (error) {
            console.error("Lỗi khi tải trang in vé:", error);
            res.status(500).send("Lỗi hệ thống khi tạo dữ liệu in vé.");
        }
    }
}

module.exports = new VeController();