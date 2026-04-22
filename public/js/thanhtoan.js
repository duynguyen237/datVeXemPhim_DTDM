const params = new URLSearchParams(window.location.search);
const [maSC, ghesStr, combosStr] = ['maSC', 'ghes', 'combos'].map(k => params.get(k));

let finalTotalAmount = 0;

document.addEventListener('DOMContentLoaded', () => {
    loadUserInfo();
    loadOrderDetails();
});

// =========================================================
// 1. TỰ ĐỘNG LẤY THÔNG TIN TỪ TÀI KHOẢN (Tương thích MongoDB)
// =========================================================
function loadUserInfo() {
    const user = JSON.parse(localStorage.getItem('user')) || window.currentUser; // Hỗ trợ lấy từ biến toàn cục nếu có
    if (!user) {
        alert("Vui lòng đăng nhập để tiếp tục.");
        return window.location.href = '/login';
    }

    // Gán dữ liệu (Hỗ trợ cả object MongoDB mới và SQL cũ)
    const hoTen = user.hoTen || user.HO_TEN || '';
    const soDienThoai = user.soDienThoai || user.SO_DIEN_THOAI || '';
    const email = user.email || user.EMAIL || '';

    const elName = document.getElementById('cus_name');
    const elPhone = document.getElementById('cus_phone');
    const elEmail = document.getElementById('cus_email');

    if (elName) { elName.value = hoTen; elName.readOnly = true; }
    if (elPhone) { elPhone.value = soDienThoai; elPhone.readOnly = true; }
    if (elEmail) { elEmail.value = email; elEmail.readOnly = true; }
}

// =========================================================
// 2. TÍNH TIỀN VÀ HIỂN THỊ ĐƠN HÀNG (Dùng Promise.all)
// =========================================================
async function loadOrderDetails() {
    const body = document.getElementById('billing-body');

    try {
        const [resSC, resGhe, resSp] = await Promise.all([
            fetch(`/api/suat-chieu/thong-tin/${maSC}`).then(r => r.json()),
            fetch(`/api/ghe/sodo/${maSC}`).then(r => r.json()),
            combosStr ? fetch('/api/san-pham').then(r => r.json()) : Promise.resolve({ data: [] })
        ]);

        // Giá vé cơ bản
        const basePrice = parseFloat(resSC.data?.giaVeCoban || resSC.data?.GIA_VE_CO_BAN) || 0;
        const selectedGheIds = ghesStr ? ghesStr.split(',') : [];
        let html = '';

        // Render Vé
        if (resGhe.data) {
            resGhe.data.filter(g => {
                const idGhe = (g._id || g.MA_GHE_NGOI).toString();
                return selectedGheIds.includes(idGhe);
            }).forEach(g => {
                const phuPhi = parseFloat(g.giaGheNgoi || g.PHU_PHI_GHE) || 0;
                const price = basePrice + phuPhi;
                const tenGhe = g.tenGheNgoi || g.TEN_GHE_NGOI;

                finalTotalAmount += price;
                html += `<tr>
                    <td>Ghế ${tenGhe} <span class="badge bg-danger ms-1">${phuPhi > 0 ? 'VIP' : 'Thường'}</span></td>
                    <td class="text-center">1</td>
                    <td class="text-end">${price.toLocaleString('vi-VN')} đ</td>
                </tr>`;
            });
        }

        // Render Combo Bắp Nước
        if (combosStr && resSp.data) {
            combosStr.split('|').forEach(item => {
                const [id, qty] = item.split(':');
                const p = resSp.data.find(x => (x._id || x.MA_SAN_PHAM).toString() === id);

                if (p) {
                    const tenSP = p.tenSanPham || p.TEN_SAN_PHAM;
                    const giaSP = parseFloat(p.giaSanPham || p.GIA_SAN_PHAM) || 0;
                    const sub = giaSP * parseInt(qty);

                    finalTotalAmount += sub;
                    html += `<tr>
                        <td>${tenSP}</td>
                        <td class="text-center">${qty}</td>
                        <td class="text-end">${sub.toLocaleString('vi-VN')} đ</td>
                    </tr>`;
                }
            });
        }

        body.innerHTML = html;
        document.getElementById('final-total').innerText = finalTotalAmount.toLocaleString('vi-VN') + " VNĐ";

    } catch (err) {
        console.error("Lỗi load chi tiết:", err);
        body.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Lỗi tải dữ liệu. Vui lòng tải lại trang.</td></tr>';
    }
}

// =========================================================
// 3. XỬ LÝ THANH TOÁN VÀ CHUYỂN HƯỚNG VNPAY
// =========================================================
async function submitOrder() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return alert("Lỗi: Không tìm thấy thông tin người dùng!");

    // Lấy số tiền thực tế đang hiển thị trên giao diện (đã được format)
    // Cách an toàn nhất là dùng biến finalTotalAmount đã tính ở loadOrderDetails

    const btn = document.querySelector('button[onclick="submitOrder()"]');
    btn.disabled = true;

    try {
        const idNguoiDung = user._id || user.MA_NGUOI_DUNG;
        const hoTenNguoiDung = user.hoTen || user.HO_TEN;

        // Chuẩn bị danh sách sản phẩm để gửi lên (nếu có)
        const dsSanPham = combosStr ? combosStr.split('|').map(item => {
            const [id, qty] = item.split(':');
            return { sanPhamId: id, soLuong: parseInt(qty) };
        }) : [];

        const danhSachGheGuiDi = selectedSeatsObjects.map(s => ({
            maGhe: s._id,          // Để khớp với gheNgoiId ở Backend
            tenGhe: s.tenGheNgoi,  // Để in vé
            loaiGhe: s.loaiGhe,    // Snapshot loại ghế (Thường/VIP)
            giaGhe: s.giaGheNgoi   // Snapshot giá ghế
        }));
        const res = await fetch('/api/ve/dat-ve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                maNguoiDung: idNguoiDung,
                hoTenNguoiDung: hoTenNguoiDung,
                maSuatChieu: maSC,
                danhSachMaGhe: danhSachGheGuiDi,
                dsSanPham: dsSanPham, // PHẢI GỬI THÊM CÁI NÀY
                tongTien: finalTotalAmount // Giá trị này đã bao gồm cả ghế + bắp nước
            })
        });

        const result = await res.json();
        if (result.success && result.paymentUrl) {
            window.location.href = result.paymentUrl;
        } else {
            throw new Error(result.message || "Không xác định");
        }
    } catch (error) {
        alert("Lỗi: " + error.message);
        btn.disabled = false;
    }
}