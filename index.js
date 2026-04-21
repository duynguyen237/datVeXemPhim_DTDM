const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const colors = require('colors');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const app = express();

// IMPORT VÀ KHỞI ĐỘNG KẾT NỐI MONGODB
const connectMongoDB = require('./config/mongodb');
connectMongoDB();

// Cấu hình EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- MIDDLEWARES CƠ BẢN ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// =========================================================
// 1. CẤU HÌNH SESSION DUY NHẤT (QUAN TRỌNG)
// =========================================================
app.use(session({
    secret: 'duy_movie_secret_key_pipipilapy', // Gộp 2 cái secret lại cho chắc
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false, // Chạy localhost phải để false
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // Sống 1 ngày
    }
}));

// Middleware truyền biến user ra toàn bộ giao diện EJS
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// =========================================================
// 2. IMPORT DAL & ROUTERS
// =========================================================
const hoadonDAL = require('./mongoDAL/hoadon');
const phimDAL = require('./mongoDAL/phim');

const phimRouter = require('./routers/phimRouter');
const suatChieuRouter = require('./routers/suatChieuRouter');
const authRouter = require('./routers/authRouter');
const gheRouter = require('./routers/gheRouter');
const veRouter = require('./routers/veRouter');
const adminRouter = require('./routers/adminRouter');
const sanPhamRouter = require('./routers/sanphamRouter');
const homeRouter = require('./routers/homeRouter');

// =========================================================
// 3. ROUTES GIAO DIỆN (VIEW ROUTES) - ĐẶT TRÊN API
// =========================================================

app.get('/login', (req, res) => res.render('login'));
app.get('/register', (req, res) => res.render('register'));
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});
app.get('/admin', (req, res) => res.render('admin/dashboard'));
// Trang Profile (Hết lỗi 404)
app.get('/profile', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.render('profile', { user: req.session.user });
});

// Trang Lịch sử

// Các trang giao diện khác
app.get('/chitietphim', (req, res) => res.render('chitietphim'));
app.get('/datve', (req, res) => res.render('datve'));
app.get('/sodoghe', (req, res) => res.render('sodoghe'));
app.get('/tat-ca-phim', async (req, res) => {
    try {
        const movies = await phimDAL.getAll();
        res.render('tatcaphim', { movies });
    } catch (err) {
        res.render('tatcaphim', { movies: [] });
    }
});

// =========================================================
// 4. API ROUTES & GẮN ROUTERS
// =========================================================
app.use('/api/auth', authRouter);
app.use('/api/phim', phimRouter);
app.use('/api/suat-chieu', suatChieuRouter);
app.use('/api/ve', veRouter);
app.use('/api/ghe', gheRouter);
app.use('/api', sanPhamRouter);
app.use('/admin', adminRouter);
app.use('/', homeRouter);

// API Lấy chi tiết hóa đơn
app.get('/api/hoa-don/chi-tiet/:maHD', async (req, res) => {
    try {
        const chiTiet = await hoadonDAL.getDanhSachVeDeIn(req.params.maHD);
        res.json({ success: !!chiTiet, data: chiTiet });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// =========================================================
// 5. START SERVER & 404 (LUÔN ĐỂ CUỐI CÙNG)
// =========================================================
const PORT = process.env.PORT || 5000;

app.use((req, res) => {
    res.status(404).render('404');
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at: http://localhost:${PORT}`.green.bold);
});