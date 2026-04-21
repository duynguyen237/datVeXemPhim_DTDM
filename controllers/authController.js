const taiKhoanModel = require('../mongoDAL/taikhoan');
const bcrypt = require('bcrypt');

class AuthController {
    // ==========================================
    // --- XỬ LÝ ĐĂNG NHẬP ---
    // ==========================================
    async login(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ success: false, message: "Vui lòng nhập tài khoản và mật khẩu!" });
            }

            // Gọi hàm tìm theo tên đăng nhập từ mongoDAL/taikhoan.js
            const user = await taiKhoanModel.findByTenDangNhap(username);

            // 1. Kiểm tra user có tồn tại không
            if (!user) {
                return res.status(401).json({ success: false, message: "Tài khoản hoặc mật khẩu không chính xác!" });
            }

            // 2. SO SÁNH MẬT KHẨU (Băm vs Văn bản thuần)
            // Lưu ý: MongoDB dùng trường 'matKhau' (không phải MAT_KHAU)
            const isMatch = await bcrypt.compare(password, user.matKhau);

            if (!isMatch) {
                return res.status(401).json({ success: false, message: "Tài khoản hoặc mật khẩu không chính xác!" });
            }

            // Đăng nhập thành công!
            // Xóa trường mật khẩu khỏi object trước khi trả về cho client
            delete user.matKhau;

            req.session.user = {
                _id: user._id,
                tenDangNhap: user.tenDangNhap,
                hoTen: user.hoTen,
                vaiTro: user.vaiTro, // 'admin' hoặc 'user'
                email: user.email
            };

            // BẮT BUỘC CHỜ LƯU XONG SESSION MỚI TRẢ VỀ FRONTEND
            req.session.save((err) => {
                if (err) {
                    console.error("Lỗi lưu session:", err);
                    return res.status(500).json({ success: false, message: "Lỗi phiên đăng nhập!" });
                }

                console.log(`🎬 Người dùng [${user.hoTen}] đã đăng nhập thành công!`);
                res.status(200).json({
                    success: true,
                    message: "Đăng nhập thành công!",
                    user: req.session.user
                });
            });

        } catch (error) {
            console.error("Lỗi Login Controller:", error);
            res.status(500).json({ success: false, message: "Lỗi hệ thống khi xử lý đăng nhập." });
        }
    }
    // ==========================================
    // --- XỬ LÝ ĐĂNG KÝ ---
    // ==========================================
    async register(req, res) {
        try {
            const { username, password, fullname, email, phone } = req.body;

            // Kiểm tra thông tin bắt buộc
            if (!username || !password || !fullname) {
                return res.status(400).json({ success: false, message: "Vui lòng nhập đủ thông tin bắt buộc!" });
            }

            // Kiểm tra trùng lặp tên đăng nhập
            const existingUser = await taiKhoanModel.findByTenDangNhap(username);
            if (existingUser) {
                return res.status(400).json({ success: false, message: "Tên đăng nhập này đã có người sử dụng!" });
            }

            // 3. BĂM MẬT KHẨU TRƯỚC KHI LƯU
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Gọi hàm create từ mongoDAL/taikhoan.js với các trường mới
            await taiKhoanModel.create({
                tenDangNhap: username,
                matKhau: hashedPassword,
                hoTen: fullname,
                email: email,
                soDienThoai: phone,
                vaiTro: 'user' // Sử dụng chuỗi 'user' theo Schema mới
            });

            res.status(200).json({
                success: true,
                message: "Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ."
            });

        } catch (error) {
            console.error("Lỗi Đăng ký:", error);
            res.status(500).json({ success: false, message: "Lỗi hệ thống khi đăng ký." });
        }
    }
    // Quên MK
    async changePassword(req, res) {
        try {
            const { oldPassword, newPassword } = req.body;

            // 1. Kiểm tra session
            if (!req.session.user) {
                return res.status(401).json({ success: false, message: "Hết phiên làm việc, vui lòng đăng nhập lại!" });
            }

            const userId = req.session.user._id;

            // 2. Lấy user từ DB
            const user = await taiKhoanModel.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: "Người dùng không tồn tại!" });
            }

            // --- ĐOẠN DEBUG VÀ CHẶN LỖI CRASH ---
            console.log("1. Mật khẩu Client gửi lên (oldPassword):", oldPassword);
            console.log("2. Mật khẩu lấy từ DB (user.matKhau):", user?.matKhau);

            if (!oldPassword) {
                return res.status(400).json({ success: false, message: "Vui lòng nhập mật khẩu cũ!" });
            }
            if (!user.matKhau) {
                return res.status(400).json({ success: false, message: "Lỗi DB: Tài khoản này không có dữ liệu mật khẩu!" });
            }
            // ------------------------------------

            // 3. So sánh mật khẩu cũ với mật khẩu trong DB
            const isMatch = await bcrypt.compare(oldPassword, user.matKhau);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: "Mật khẩu hiện tại không chính xác!" });
            }

            // 4. Băm mật khẩu mới
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            // 5. Cập nhật vào DB
            await taiKhoanModel.updatePassword(userId, hashedPassword);

            console.log(`🔒 User [${user.hoTen}] đã đổi mật khẩu thành công.`);
            res.json({ success: true, message: "Đổi mật khẩu thành công!" });

        } catch (error) {
            console.error("Lỗi ChangePassword Controller:", error);
            res.status(500).json({ success: false, message: "Lỗi hệ thống khi đổi mật khẩu." });
        }
    }
    async getProfile(req, res) {
        // Kiểm tra an toàn, chưa đăng nhập thì đá về trang login
        if (!req.session.user) {
            return res.redirect('/login');
        }
        res.render('profile', { user: req.session.user });
    }
    // ==========================================
    // --- XỬ LÝ ĐĂNG XUẤT ---
    // ==========================================
    async logout(req, res) {
        req.session.destroy((err) => {
            if (err) {
                console.error("Lỗi khi đăng xuất:", err);
                return res.status(500).json({ success: false, message: "Lỗi khi đăng xuất." });
            }
            res.clearCookie('connect.sid');
            res.status(200).json({ success: true, message: "Đăng xuất thành công!" });
        });
    }
}

module.exports = new AuthController();
