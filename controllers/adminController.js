const phimDAL = require('../mongoDAL/phim');
const suatChieuDAL = require('../mongoDAL/suatchieu');
const rapDAL = require('../mongoDAL/rap');
const taiKhoanDAL = require('../mongoDAL/taikhoan');
const hoadonDAL = require('../mongoDAL/hoadon');

const TheLoai = require('../mongoModels/TheLoai');
const Phim = require('../mongoModels/Phim');
const Rap = require('../mongoModels/Rap');
const mongoose = require('mongoose');

class AdminController {
    // ==========================================
    // 0. DASHBOARD
    // ==========================================
    async getDashboard(req, res) {
        try {
            res.render('admin/dashboard');
        } catch (error) {
            res.status(500).send("Lỗi tải trang Dashboard.");
        }
    }

    // ==========================================
    // 1. QUẢN LÝ PHIM
    // ==========================================
    async listPhim(req, res) {
        try {
            const phims = await phimDAL.getAll();
            const theLoais = await TheLoai.find().lean();
            res.render('admin/phim', { phims, theLoais });
        } catch (error) {
            res.status(500).send("Lỗi tải danh sách phim.");
        }
    }

    async addPhim(req, res) {
        try {
            const { ten, trailer, noidung, tuoi, thoiluong, daodien, dienvien, poster, nen, maTL } = req.body;
            const theLoaiInfo = await TheLoai.findById(maTL).lean();

            await phimDAL.create({
                tenPhim: ten,
                duongDanTrailer: trailer,
                noiDungPhim: noidung,
                gioiHanTuoi: tuoi,
                thoiLuongPhim: thoiluong,
                daoDien: daodien,
                dienVien: dienvien,
                hinhAnhPoster: poster,
                hinhAnhNen: nen,
                theLoaiId: maTL,
                tenTheLoai: theLoaiInfo ? theLoaiInfo.tenTheLoai : 'Chưa cập nhật'
            });
            res.redirect('/admin/phim');
        } catch (error) {
            res.status(500).send("Lỗi xử lý thêm phim.");
        }
    }

    async toggleHidePhim(req, res) {
        try {
            const { id } = req.params;
            const phim = await Phim.findById(id);
            if (!phim) return res.status(404).json({ success: false, message: "Không tìm thấy phim!" });

            phim.daAn = !phim.daAn;
            await phim.save();
            res.json({ success: true, message: "Đã cập nhật trạng thái phim thành công!" });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi máy chủ!" });
        }
    }

    // ==========================================
    // 2. QUẢN LÝ RẠP & PHÒNG
    // ==========================================
    async listRap(req, res) {
        try {
            const raps = await rapDAL.getAll();
            res.render('admin/rap', { raps });
        } catch (error) {
            res.status(500).send("Lỗi tải danh sách rạp.");
        }
    }

    async addRap(req, res) {
        try {
            const { tenRap, diaChi, soDienThoai, email } = req.body;
            await rapDAL.create({ tenRap, diaChi, soDienThoai, email });
            res.redirect('/admin/rap');
        } catch (error) {
            res.status(500).send("Lỗi xử lý thêm rạp.");
        }
    }

    async listPhong(req, res) {
        try {
            const raps = await rapDAL.getAll();
            res.render('admin/phong', { raps });
        } catch (error) {
            res.status(500).send("Lỗi tải trang quản lý phòng.");
        }
    }

    async getPhongByRap(req, res) {
        try {
            const maRap = req.params.id;
            const rap = await Rap.findById(maRap).lean();
            if (!rap) return res.json({ success: false, message: "Không tìm thấy rạp." });

            // Sửa lại theo tên field thực tế: phongChieus
            res.json({ success: true, data: rap.phongChieus || [] });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi máy chủ." });
        }
    }

    async addPhong(req, res) {
        try {
            const { maRap, tenPhong } = req.body;
            const rap = await Rap.findById(maRap);
            if (rap) {
                // Sửa lại theo tên field thực tế: phongChieus
                if (!rap.phongChieus) rap.phongChieus = [];
                rap.phongChieus.push({ tenPhongChieu: tenPhong });
                await rap.save();
            }
            res.redirect('/admin/phong');
        } catch (error) {
            res.status(500).send("Lỗi khi thêm phòng chiếu.");
        }
    }

    // ==========================================
    // 3. QUẢN LÝ GHẾ (Nested inside phongChieus)
    // ==========================================
    async getGheByPhong(req, res) {
        try {
            const maPhong = req.params.id;
            const rap = await Rap.findOne({ "phongChieus._id": maPhong }).lean();
            if (!rap) return res.json({ success: false, message: "Không tìm thấy phòng." });

            const phong = rap.phongChieus.find(p => p._id.toString() === maPhong);
            // Sửa lại theo tên field thực tế: gheNgois
            res.json({ success: true, data: phong.gheNgois || [] });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi máy chủ khi tải ghế." });
        }
    }

    async generateSeats(req, res) {
        try {
            const { maRap, maPhong, soHang, soGheMotHang, hangVip, giaThuong, phuThuVip } = req.body;
            const rap = await Rap.findById(maRap);
            if (!rap) return res.status(404).json({ success: false, message: "Không tìm thấy rạp" });

            const phong = rap.phongChieus.id(maPhong);
            if (!phong) return res.status(404).json({ success: false, message: "Không tìm thấy phòng" });

            const vipRows = hangVip ? hangVip.split(',').map(r => r.trim().toUpperCase()) : [];
            const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            const newSeats = [];

            for (let i = 0; i < soHang; i++) {
                const rowLetter = alphabet[i];
                const isVip = vipRows.includes(rowLetter);
                for (let j = 1; j <= soGheMotHang; j++) {
                    newSeats.push({
                        tenGheNgoi: `${rowLetter}${j}`,
                        loaiGhe: isVip ? 'VIP' : 'Thường',
                        giaGheNgoi: isVip ? (parseFloat(giaThuong) + parseFloat(phuThuVip)) : parseFloat(giaThuong),
                        tinhTrangDatGhe: 0 // 0: Trống, 1: Đã đặt
                    });
                }
            }

            // Gán thẳng vào field gheNgois bên trong phòng
            phong.gheNgois = newSeats;
            await rap.save();

            res.json({ success: true, message: `Thành công! Đã tạo ${newSeats.length} ghế.` });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi server khi tạo sơ đồ ghế." });
        }
    }

    // ==========================================
    // 4. QUẢN LÝ SUẤT CHIẾU
    // ==========================================
    async listSuatChieu(req, res) {
        try {
            const suatChieus = await suatChieuDAL.getAll();
            const phims = await phimDAL.getAll();
            const raps = await rapDAL.getAll();
            res.render('admin/suatchieu', { suatChieus, phims, raps });
        } catch (error) {
            res.status(500).send("Lỗi tải danh sách suất chiếu.");
        }
    }

    async addSuatChieu(req, res) {
        try {
            const { maPhim, maRap, maPhong, ngayChieu, gioBatDau, giaVe } = req.body;

            const phimInfo = await Phim.findById(maPhim).lean();
            const rapInfo = await Rap.findById(maRap).lean();

            let tenPhong = '';
            if (rapInfo && rapInfo.phongChieus) {
                const phong = rapInfo.phongChieus.find(p => p._id.toString() === maPhong);
                if (phong) tenPhong = phong.tenPhongChieu;
            }

            // ========================================================
            // SỬA TẠI ĐÂY: Gọi thẳng Model SuatChieu để bỏ qua lỗi DAL
            // ========================================================
            const SuatChieu = require('../mongoModels/SuatChieu');

            await SuatChieu.create({
                phim: maPhim,
                tenPhim: phimInfo ? phimInfo.tenPhim : 'N/A',
                rap: maRap,
                tenRap: rapInfo ? rapInfo.tenRap : 'N/A',
                phongChieuId: maPhong,
                tenPhongChieu: tenPhong,
                ngayChieu: ngayChieu,
                gioBatDau: gioBatDau,
                giaVeCoban: giaVe
            });

            res.redirect('/admin/suatchieu');
        } catch (error) {
            console.error("Lỗi xử lý thêm suất chiếu:", error);
            res.status(500).send("Lỗi xử lý thêm suất chiếu.");
        }
    }

    async deleteSuatChieu(req, res) {
        try {
            const { id } = req.params;
            await suatChieuDAL.delete(id);
            res.json({ success: true, message: "Đã xóa suất chiếu thành công!" });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi khi xóa suất chiếu." });
        }
    }

    // ==========================================
    // 5. NGƯỜI DÙNG & HÓA ĐƠN
    // ==========================================
    async listUser(req, res) {
        try {
            const users = await taiKhoanDAL.getAll();
            res.render('admin/users', { users });
        } catch (error) {
            res.status(500).send("Lỗi tải danh sách tài khoản.");
        }
    }

    async listHoaDon(req, res) {
        try {
            const hoaDons = await hoadonDAL.getAllAdmin();
            res.render('admin/hoadon', { hoaDons });
        } catch (error) {
            res.status(500).send("Lỗi tải danh sách hóa đơn.");
        }
    }
}

module.exports = new AdminController();