const urlParams = new URLSearchParams(window.location.search);
const currentMaSuatChieu = urlParams.get('maSuatChieu') || urlParams.get('id');
let selectedSeats = [];
let basePrice = 0;

document.addEventListener('DOMContentLoaded', function () {
    if (!currentMaSuatChieu) {
        alert('Không tìm thấy thông tin suất chiếu!');
        window.location.href = '/';
        return;
    }
    loadShowtimeInfo();
    loadSeatMap();
});

async function loadShowtimeInfo() {
    try {
        const res = await fetch(`/api/suat-chieu/thong-tin/${currentMaSuatChieu}`);
        const result = await res.json();

        if (result.success && result.data) {
            const data = result.data;
            const tenPhim = data.tenPhim || data.TEN_PHIM || 'Đang cập nhật';
            const tenRap = data.tenRap || data.TEN_RAP || 'Rạp';
            const tenPhong = data.tenPhongChieu || data.TEN_PHONG_CHIEU || 'Phòng';
            const gioChieu = data.gioBatDau || data.GIO_FORMAT || '';

            let ngayChieu = data.NGAY_FORMAT || '';
            if (data.ngayChieu) {
                const d = new Date(data.ngayChieu);
                ngayChieu = d.toLocaleDateString('vi-VN');
            }

            document.getElementById('display-movie-name').innerText = tenPhim;
            document.getElementById('display-cinema-room').innerText = `${tenRap} - ${tenPhong}`;
            document.getElementById('display-time').innerText = `Giờ chiếu: ${gioChieu} - ${ngayChieu}`;
            basePrice = parseFloat(data.giaVeCoban || data.GIA_VE_CO_BAN) || 0;
        }
    } catch (error) {
        console.error("Lỗi load thông tin suất chiếu:", error);
    }
}

async function loadSeatMap() {
    try {
        const res = await fetch(`/api/ghe/sodo/${currentMaSuatChieu}`);
        const result = await res.json();
        const seatMap = document.getElementById('seat-map');
        seatMap.innerHTML = '';

        if (!result.success || !result.data) return;

        const rows = {};
        let maxCol = 0;

        // Gom nhóm ghế theo hàng
        result.data.forEach(seat => {
            const tenGhe = seat.tenGheNgoi || seat.TEN_GHE_NGOI;
            if (tenGhe) {
                const rowLetter = tenGhe.charAt(0);
                const colNum = parseInt(tenGhe.substring(1));
                if (!rows[rowLetter]) rows[rowLetter] = {};
                rows[rowLetter][colNum] = seat;
                if (colNum > maxCol) maxCol = colNum;
            }
        });

        Object.keys(rows).sort().forEach(rowLetter => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'seat-row d-flex justify-content-center mb-2';

            for (let i = 1; i <= maxCol; i++) {
                const seat = rows[rowLetter][i];
                const seatDiv = document.createElement('div');
                seatDiv.className = 'seat-item';

                if (!seat || seat.trangThai === 0) {
                    seatDiv.style.visibility = 'hidden';
                } else {
                    // LUÔN gán tên ghế ở đây để dù "đã đặt" hay "trống" đều thấy tên
                    seatDiv.innerText = seat.tenGheNgoi || seat.TEN_GHE_NGOI;

                    // KIỂM TRA TRẠNG THÁI ĐÃ ĐẶT (Màu xám)
                    if (seat.tinhTrangDatGhe === 1 || seat.DA_DAT === 1) {
                        seatDiv.classList.add('occupied');
                        // Không gán onclick cho ghế đã đặt để khóa tương tác
                    } else {
                        // GHẾ TRỐNG (Tím hoặc Đỏ tùy loại)
                        seatDiv.classList.add('available');
                        if (seat.loaiGhe === 'VIP') seatDiv.classList.add('vip');
                        seatDiv.onclick = () => toggleSeat(seatDiv, seat);
                    }
                }
                rowDiv.appendChild(seatDiv);
            }
            seatMap.appendChild(rowDiv);
        });
    } catch (error) { 
        console.error("Lỗi tải sơ đồ ghế:", error); 
    }
}

function toggleSeat(element, seat) {
    element.classList.toggle('selected');
    const idGhe = seat._id || seat.MA_GHE_NGOI;

    if (element.classList.contains('selected')) {
        selectedSeats.push(seat);
    } else {
        selectedSeats = selectedSeats.filter(s => (s._id || s.MA_GHE_NGOI) !== idGhe);
    }
    updateUI();
}

function updateUI() {
    if (selectedSeats.length > 0) {
        const seatNames = selectedSeats.map(s => s.tenGheNgoi || s.TEN_GHE_NGOI).join(', ');
        document.getElementById('selected-seats-text').innerText = seatNames;
    } else {
        document.getElementById('selected-seats-text').innerText = 'Chưa chọn';
    }

    const totalTicketPrice = selectedSeats.reduce((sum, seat) => {
        const giaGhe = parseFloat(seat.giaGheNgoi || seat.PHU_PHI_GHE) || 0;
        return sum + basePrice + giaGhe;
    }, 0);

    document.getElementById('total-price').innerText = totalTicketPrice.toLocaleString('vi-VN') + ' VNĐ';
}

let selectedCombos = {};

async function confirmBooking() {
    if (selectedSeats.length === 0) return alert("Vui lòng chọn ít nhất 1 ghế trước!");
    const myModal = new bootstrap.Modal(document.getElementById('productModal'));
    myModal.show();

    // Logic render bắp nước đã hoàn thiện ở code của bạn, mình giữ nguyên gọi fetch ở đây
    const listArea = document.getElementById('product-list');
    listArea.innerHTML = '<div class="text-center w-100 p-4">Đang tải quà tặng...</div>';

    try {
        const res = await fetch('/api/san-pham');
        const result = await res.json();
        if (result.success && result.data.length > 0) {
            listArea.innerHTML = result.data.map(p => {
                const imgUrl = p.urlImage || p.url_image || '/images/default-popcorn.png';
                const tenSP = p.tenSanPham || p.TEN_SAN_PHAM;
                const giaSP = parseFloat(p.giaSanPham || p.GIA_SAN_PHAM) || 0;
                const idSP = p._id || p.MA_SAN_PHAM;

                return `
                <div class="col-md-6 mb-3">
                    <div class="p-2 border border-secondary rounded d-flex align-items-center justify-content-between bg-dark shadow-sm">
                        <div class="d-flex align-items-center">
                            <img src="${imgUrl}" style="width:55px; height:55px; object-fit:cover;" class="rounded me-2">
                            <div>
                                <div class="fw-bold small text-white">${tenSP}</div>
                                <div class="text-warning small">${giaSP.toLocaleString()}đ</div>
                            </div>
                        </div>
                        <div class="d-flex align-items-center gap-2">
                            <button class="btn btn-sm btn-outline-danger px-2 py-0" onclick="updateCombo('${idSP}', -1, ${giaSP})">-</button>
                            <span id="qty-${idSP}" class="fw-bold">0</span>
                            <button class="btn btn-sm btn-danger px-2 py-0" onclick="updateCombo('${idSP}', 1, ${giaSP})">+</button>
                        </div>
                    </div>
                </div>`;
            }).join('');
        } else {
            listArea.innerHTML = '<p class="text-center w-100 opacity-50">Không tìm thấy sản phẩm nào.</p>';
        }
    } catch (err) {
        listArea.innerHTML = '<p class="text-center text-danger w-100">Lỗi kết nối API!</p>';
    }
    updateFinalTotal();
}

function updateCombo(id, delta, price) {
    if (!selectedCombos[id]) selectedCombos[id] = { qty: 0, price: price };
    selectedCombos[id].qty += delta;
    if (selectedCombos[id].qty < 0) selectedCombos[id].qty = 0;
    document.getElementById(`qty-${id}`).innerText = selectedCombos[id].qty;
    updateFinalTotal();
}

function updateFinalTotal() {
    let totalGhe = selectedSeats.reduce((sum, s) => sum + basePrice + (parseFloat(s.giaGheNgoi || s.PHU_PHI_GHE) || 0), 0);
    let totalCombo = 0;
    for (let id in selectedCombos) totalCombo += selectedCombos[id].qty * selectedCombos[id].price;
    document.getElementById('total-final').innerText = (totalGhe + totalCombo).toLocaleString('vi-VN') + " VNĐ";
}

async function goToPayment() {
    if (selectedSeats.length === 0) return alert("Vui lòng chọn ít nhất 1 ghế!");

    // 1. Lấy tổng tiền cuối cùng (đã bao gồm bắp nước) từ giao diện
    // Hoặc tính toán lại từ biến selectedCombos và selectedSeats
    const totalFinalText = document.getElementById('total-final').innerText;
    const totalFinalAmount = parseInt(totalFinalText.replace(/\D/g, ''));

    // 2. Chuyển đổi object selectedCombos thành mảng để gửi lên Backend
    const dsSanPham = Object.keys(selectedCombos)
        .filter(id => selectedCombos[id].qty > 0) // Chỉ lấy những cái có số lượng > 0
        .map(id => ({
            sanPhamId: id,
            soLuong: selectedCombos[id].qty
        }));

    // 3. Chuẩn bị dữ liệu gửi lên Backend
    const bookingData = {
        maSuatChieu: currentMaSuatChieu,
        danhSachMaGhe: selectedSeats.map(s => s._id || s.MA_GHE_NGOI),
        dsSanPham: dsSanPham, // << THÊM DÒNG NÀY ĐỂ GỬI BẮP NƯỚC
        tongTien: totalFinalAmount, // << DÙNG TỔNG CUỐI CÙNG
        hoTenNguoiDung: document.getElementById('user-fullname')?.value || '' 
    };

    try {
        const response = await fetch('/api/ve/dat-ve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });

        const result = await response.json();
        if (result.success && result.paymentUrl) {
            window.location.href = result.paymentUrl;
        } else {
            alert("Lỗi: " + (result.message || "Không thể khởi tạo thanh toán"));
        }
    } catch (error) {
        console.error("Lỗi kết nối thanh toán:", error);
        alert("Lỗi kết nối máy chủ!");
    }
}