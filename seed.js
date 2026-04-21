const mongoose = require('mongoose');
require('dotenv').config();
require('colors');
const connectDB = require('./config/mongodb'); // Đường dẫn file cấu hình DB

// Import Models
const NguoiDung = require('./mongoModels/NguoiDung');
const TheLoai = require('./mongoModels/TheLoai');
const Phim = require('./mongoModels/Phim');
const ThongTinRap = require('./mongoModels/ThongTinRap');
const SanPham = require('./mongoModels/SanPham');
const SuatChieu = require('./mongoModels/SuatChieu');

// --- HÀM TẠO GHẾ TỰ ĐỘNG ---
// Thay thế cho 600 dòng INSERT GHE_NGOI trong SQL
const generateSeats = () => {
    const gheNgois = [];
    // Ghế VIP (Dãy A, B, C - 8 ghế/dãy)
    ['A', 'B', 'C'].forEach(day => {
        for (let i = 1; i <= 8; i++) {
            gheNgois.push({ tenGheNgoi: `${day}${i}`, loaiGhe: 'VIP', giaGheNgoi: 20000, tinhTrangDatGhe: 0 });
        }
    });
    // Ghế Thường (Dãy D đến J - 8 ghế/dãy)
    ['D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(day => {
        for (let i = 1; i <= 8; i++) {
            gheNgois.push({ tenGheNgoi: `${day}${i}`, loaiGhe: 'Thường', giaGheNgoi: 0, tinhTrangDatGhe: 0 });
        }
    });
    return gheNgois;
};

// --- DỮ LIỆU GỐC TỪ SQL ---
const dataNguoiDung = [
    { tenDangNhap: 'nhduy', matKhau: '$2b$10$pFnvShspVpJZjQ4piq1ug.HhZj/gVJBTzHcOBE6zFKd6EG1mjpBmW', hoTen: 'Nguyễn Hữu Duy', soDienThoai: '0387482440', email: 'duy@gmail.com', vaiTro: 'admin' },
    { tenDangNhap: 'khach', matKhau: '$2b$10$whhkJ3JdoxDwXE4mEItrLukM3qucr/NLFx80UcU.n3AvgSLYslrSG', hoTen: 'Duy Nguyễn', soDienThoai: '0387482449', email: 'duy2@gmail.com', vaiTro: 'user' },
    { tenDangNhap: 'j97', matKhau: '$2b$10$UgMDTkVCALWSYKQcP8VUR.WMwMS1gzb66N5IbNTRjN8ZOmhIbMqRa', hoTen: 'Trịnh Trần Phương Tuấn', soDienThoai: '0387482445', email: 'duy123@gmail.com', vaiTro: 'user' }
];

const dataTheLoai = [
    { tenTheLoai: 'Hành động' }, { tenTheLoai: 'Hoạt hình' }, { tenTheLoai: 'Kinh dị' }, { tenTheLoai: 'Tình cảm' }, { tenTheLoai: 'Hài hước' }
];

const dataSanPham = [
    { tenSanPham: '1 Bắp siêu lớn', moTaSanPham: '1 hộp bắp siêu lớn nóng hổi', giaSanPham: 25000, urlImage: 'https://png.pngtree.com/png-clipart/20240323/original/pngtree-cinema-pop-corn-bag-png-image_14659053.png' }
];

const dataRap = [
    {
        tenRap: 'WhyCinema Long Xuyên', diaChi: 'Trần Hưng Đạo, Mỹ Xuyên, Long Xuyên, An Giang', soDienThoai: '02963123456', email: 'contactlongxuyen@whycinema.vn',
        phongChieus: [
            { tenPhongChieu: 'Phòng 01', gheNgois: generateSeats() },
            { tenPhongChieu: 'Phòng 02', gheNgois: generateSeats() },
            { tenPhongChieu: 'Phòng 03', gheNgois: generateSeats() }
        ]
    },
    {
        tenRap: 'WhyCinema Hà Nội', diaChi: 'Tầng 7, 54A Nguyễn Chí Thanh, Đống Đa, Hà Nội', soDienThoai: '02963123456', email: 'whycinemahanoi@whycinema.vn',
        phongChieus: [
            { tenPhongChieu: 'Phòng 01', gheNgois: generateSeats() },
            { tenPhongChieu: 'Phòng 02', gheNgois: generateSeats() }
        ]
    }
];

const seedData = async () => {
    try {
        await connectDB();
        console.log('🔄 Đang xóa dữ liệu cũ...'.yellow);
        await Promise.all([NguoiDung.deleteMany(), TheLoai.deleteMany(), Phim.deleteMany(), ThongTinRap.deleteMany(), SanPham.deleteMany(), SuatChieu.deleteMany()]);

        console.log('⏳ Đang Import Người dùng, Thể loại, Sản phẩm...'.cyan);
        await NguoiDung.insertMany(dataNguoiDung);
        await SanPham.insertMany(dataSanPham);
        const theLoais = await TheLoai.insertMany(dataTheLoai);

        console.log('⏳ Đang Import Phim...'.cyan);
        // Hàm tìm ID thể loại để gán cho Phim
        const getIdTheLoai = (ten) => theLoais.find(tl => tl.tenTheLoai === ten)._id;

        const phims = await Phim.insertMany([
            { tenPhim: 'Kung Fu Panda 4', noiDungPhim: 'Gấu Po trở lại...', gioiHanTuoi: 'P', thoiLuongPhim: 94, daoDien: 'Hữu Duy', dienVien: 'Hữu Duy', hinhAnhPoster: 'https://occ-0-8407-2218.1.nflxso.net/dnm/api/v6/6AYY37jfdO6hpXcMjf9Yu5cnmO0/AAAABeDf5pRjDYdgdIdQk7QVjwHWcdJVUNazPZbV2ntdATDbRf6i8xDM3bLfkf4KzCqNuxPJWciR-xUxy-5hQvmgRVSx2OY7PGbjb_VT.jpg', theLoai: getIdTheLoai('Hoạt hình'), tenTheLoai: 'Hoạt hình' },
            { tenPhim: 'Godzilla x Kong', noiDungPhim: 'Hai siêu quái vật hợp sức...', gioiHanTuoi: 'T13', thoiLuongPhim: 115, hinhAnhPoster: 'https://occ-0-8407-2218.1.nflxso.net/dnm/api/v6/6AYY37jfdO6hpXcMjf9Yu5cnmO0/AAAABeDf5pRjDYdgdIdQk7QVjwHWcdJVUNazPZbV2ntdATDbRf6i8xDM3bLfkf4KzCqNuxPJWciR-xUxy-5hQvmgRVSx2OY7PGbjb_VT.jpg', theLoai: getIdTheLoai('Hành động'), tenTheLoai: 'Hành động' }
        ]);

        console.log('⏳ Đang Import Rạp và Cấu trúc Ghế...'.cyan);
        const raps = await ThongTinRap.insertMany(dataRap);

        console.log('⏳ Đang Import Suất Chiếu mẫu...'.cyan);
        // Lấy Rạp Long Xuyên và Phòng 01 của nó
        const rapLongXuyen = raps.find(r => r.tenRap === 'WhyCinema Long Xuyên');
        const phong01 = rapLongXuyen.phongChieus.find(p => p.tenPhongChieu === 'Phòng 01');
        const phimKungFu = phims.find(p => p.tenPhim === 'Kung Fu Panda 4');

        await SuatChieu.create({
            phim: phimKungFu._id,
            tenPhim: phimKungFu.tenPhim,
            rap: rapLongXuyen._id,
            tenRap: rapLongXuyen.tenRap,
            phongChieuId: phong01._id,
            tenPhongChieu: phong01.tenPhongChieu,
            ngayChieu: new Date('2026-05-16'),
            gioBatDau: '10:51',
            giaVeCoban: 75000
        });

        console.log('✅ IMPORT DỮ LIỆU SQL LÊN MONGODB THÀNH CÔNG!'.green.bold);
        process.exit();
    } catch (err) {
        console.error('❌ Lỗi Import:', err);
        process.exit(1);
    }
};

seedData();