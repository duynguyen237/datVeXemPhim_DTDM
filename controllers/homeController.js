const phimModel = require('../mongoDAL/phim');
const danhGiaModel = require('../mongoDAL/danhgia');
const rapModel = require('../mongoDAL/rap');

class HomeController {
    // ==========================================
    // 1. TRANG CHỦ (Hiển thị phim và 3 review mới nhất)
    // ==========================================
    async getHomePage(req, res) {
        try {
            const [movies, recentReviews] = await Promise.all([
                phimModel.getAll(),
                danhGiaModel.getRecentReviews(3)
            ]);

            const heroMovies = movies.slice(0, 10);

            // ✅ Lấy user từ session (nếu có)
            const currentUser = req.session ? req.session.user : null;

            // ✅ Truyền biến user ra file index.ejs
            res.render('index', {
                heroMovies: heroMovies,
                recentReviews: recentReviews,
                user: currentUser
            });
        } catch (error) {
            console.error("Lỗi tải trang chủ:", error);
            res.status(500).send("Lỗi server khi tải trang chủ.");
        }
    }
    // ==========================================
    // 2. TRANG HỆ THỐNG RẠP (Hiển thị toàn bộ rạp chiếu)
    // ==========================================
    async getRapChieuPage(req, res) {
        try {
            const raps = await rapModel.getAll();
            res.render('rapchieu', { raps: raps });
        } catch (error) {
            console.error("Lỗi tải trang rạp chiếu:", error);
            res.status(500).send("Lỗi máy chủ khi tải danh sách rạp.");
        }
    }

    // ==========================================
    // 3. TRANG REVIEW PHIM (Hiển thị nhiều đánh giá hơn)
    // ==========================================
    async getReviewPage(req, res) {
        try {
            const reviews = await danhGiaModel.getRecentReviews(20);
            let phimDaXem = [];

            // Lấy thông tin user đăng nhập từ session hoặc locals
            const user = req.session ? req.session.user : res.locals.user;

            // ĐÃ SỬA: Dùng user._id thay cho user.MA_NGUOI_DUNG
            if (user && user._id) {
                // Nếu đã đăng nhập, truy vấn các phim người này đã mua vé
                phimDaXem = await phimModel.getPhimDaXem(user._id);
            }

            res.render('review', {
                reviews: reviews,
                phimDaXem: phimDaXem,
                user: user // Truyền user sang để EJS biết trạng thái đăng nhập
            });
        } catch (error) {
            console.error("Lỗi tải trang review:", error);
            res.status(500).send("Lỗi máy chủ khi tải trang đánh giá.");
        }
    }

    // ==========================================
    // 4. XỬ LÝ KHI KHÁCH BẤM GỬI FORM ĐÁNH GIÁ
    // ==========================================
    async submitReview(req, res) {
        try {
            const { maPhim, maNguoiDung, noiDung } = req.body;

            if (!maNguoiDung) return res.status(401).send("Vui lòng đăng nhập!");

            // ĐÃ SỬA: Truyền vào 1 Object khớp với định dạng của mongoDAL/danhgia.js
            await danhGiaModel.create({
                phimId: maPhim,
                nguoiDungId: maNguoiDung,
                noiDungDanhGia: noiDung,
                soSao: 5 // Bạn có thể thêm input chọn sao ở Frontend sau này, tạm thời set là 5
            });

            res.redirect('/review-phim');
        } catch (error) {
            console.error("Lỗi lưu đánh giá:", error);
            res.status(500).send("Lỗi khi gửi đánh giá.");
        }
    }
}

module.exports = new HomeController();