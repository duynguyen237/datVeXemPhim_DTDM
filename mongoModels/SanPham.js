const mongoose = require('mongoose');

/**
 * SAN_PHAM → Collection: sanphams
 * Sản phẩm bán kèm (bắp rang, nước uống...)
 */
const sanPhamSchema = new mongoose.Schema(
    {
        tenSanPham: {
            type: String,
            required: [true, 'Tên sản phẩm là bắt buộc'],
            trim: true,
            maxlength: 250,
        },
        moTaSanPham: {
            type: String,
        },
        giaSanPham: {
            type: Number,
            default: 0,
            min: 0,
        },
        urlImage: {
            type: String,
        },
    },
    {
        collection: 'sanphams',
        timestamps: true,
    }
);

module.exports = mongoose.model('SanPham', sanPhamSchema);
