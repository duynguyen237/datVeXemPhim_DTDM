const crypto = require("crypto");
const moment = require("moment");
const qs = require("qs");

class VNPayService {
    // Hàm tạo URL thanh toán để gửi khách sang VNPay
    createPaymentUrl(req, amount, orderId) {
        const date = new Date();
        const createDate = moment(date).format('YYYYMMDDHHmmss');

        const tmnCode = process.env.VNP_TMNCODE;
        const secretKey = process.env.VNP_HASHSECRET;
        const vnpUrl = process.env.VNP_URL;
        const returnUrl = process.env.VNP_RETURNURL;

        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = 'vn';
        vnp_Params['vnp_CurrCode'] = 'VND';
        vnp_Params['vnp_TxnRef'] = String(orderId);
        // Lưu ý: Mình bỏ dấu '#' đi để tránh lỗi mã hóa ký tự đặc biệt không đáng có
        vnp_Params['vnp_OrderInfo'] = 'Thanh toan ve xem phim Hoa don ' + orderId;
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_Amount'] = Math.floor(amount * 100);
        vnp_Params['vnp_ReturnUrl'] = returnUrl;

        // Thực tế trên Server nên lấy IP thật của khách: req.headers['x-forwarded-for'] || req.socket.remoteAddress
        vnp_Params['vnp_IpAddr'] = '127.0.0.1';
        vnp_Params['vnp_CreateDate'] = createDate;

        // 1. Sắp xếp và Encode các tham số theo đúng "Luật" của VNPAY
        vnp_Params = this.sortObject(vnp_Params);

        // 2. Tạo chuỗi dữ liệu để băm (Lúc này KHÔNG encode nữa vì hàm sortObject đã làm rồi)
        const signData = qs.stringify(vnp_Params, { encode: false });

        // 3. Băm dữ liệu bằng SHA512
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        // 4. Gán mã băm vào params
        vnp_Params['vnp_SecureHash'] = signed;

        // 5. Tạo URL cuối cùng (Cũng KHÔNG encode ở bước này luôn)
        return vnpUrl + '?' + qs.stringify(vnp_Params, { encode: false });
    }

    // --- HÀM CHUẨN CỦA VNPAY CUNG CẤP ---
    // Nhiệm vụ: Sắp xếp key theo bảng chữ cái và encode giá trị (biến khoảng trắng thành dấu +)
    sortObject(obj) {
        let sorted = {};
        let str = [];
        let key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                str.push(encodeURIComponent(key));
            }
        }
        str.sort();
        for (key = 0; key < str.length; key++) {
            sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
        }
        return sorted;
    }
}

module.exports = new VNPayService();