const mongoose = require('mongoose');

/**
 * VAI_TRO → Collection: vaitros
 * Vai trò người dùng: admin | user
 */
const vaiTroSchema = new mongoose.Schema(
    {
        tenVaiTro: {
            type: String,
            required: [true, 'Tên vai trò là bắt buộc'],
            trim: true,
            enum: ['admin', 'user'],
        },
    },
    {
        collection: 'vaitros',
        timestamps: true,
    }
);

module.exports = mongoose.model('VaiTro', vaiTroSchema);
