const mongoose = require('mongoose');

/**
 * THE_LOAI → Collection: theloais
 * Thể loại phim: Hành động, Kinh dị, Tình cảm...
 */
const theLoaiSchema = new mongoose.Schema(
    {
        tenTheLoai: {
            type: String,
            required: [true, 'Tên thể loại là bắt buộc'],
            trim: true,
            unique: true,
            maxlength: 100,
        },
    },
    {
        collection: 'theloais',
        timestamps: true,
    }
);

module.exports = mongoose.model('TheLoai', theLoaiSchema);
