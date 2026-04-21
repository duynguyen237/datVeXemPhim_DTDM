const mongoose = require('mongoose');
require('dotenv').config();
const connectMongoDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            // Các option hiện đại của Mongoose 7+ không cần useNewUrlParser nữa
        });
        console.log('Đã kết nối thành công tới MongoDB (Mongoose)'.green?.bold ?? 'Đã kết nối thành công tới MongoDB (Mongoose)');
    } catch (err) {
        console.error('Lỗi kết nối MongoDB:', err.message);
        process.exit(1);
    }
};
// Lắng nghe sự kiện sau khi kết nối
mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB đã ngắt kết nối.');
});

module.exports = connectMongoDB;
