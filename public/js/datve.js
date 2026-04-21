let selectedShowtime = null;
let allShowtimes = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadMovies();
    setupEventListeners();
});

// 1. Load danh sách phim vào Bước 1
async function loadMovies() {
    try {
        const response = await fetch('/api/phim/all');
        const result = await response.json();

        if (result.success) {
            const movieSelect = document.getElementById('movie-select');
            result.data.forEach(phim => {
                // Tương thích MongoDB (_id, tenPhim) và SQL (MA_PHIM, TEN_PHIM)
                const idPhim = phim._id || phim.MA_PHIM;
                const tenPhim = phim.tenPhim || phim.TEN_PHIM;
                movieSelect.innerHTML += `<option value="${idPhim}">${tenPhim}</option>`;
            });
        }
    } catch (error) {
        console.error('Lỗi load phim:', error);
    }
}

function setupEventListeners() {
    document.getElementById('movie-select').addEventListener('change', onMovieChange);
    document.getElementById('date-select').addEventListener('change', onDateChange);
    document.getElementById('cinema-select').addEventListener('change', onCinemaChange);

    document.getElementById('booking-form').addEventListener('submit', function (e) {
        e.preventDefault();
        if (selectedShowtime) {
            window.location.href = `/sodoghe?id=${selectedShowtime}`;
        }
    });
}

// 2. Khi chọn Phim -> Lấy TẤT CẢ suất chiếu
async function onMovieChange() {
    const maPhim = document.getElementById('movie-select').value;
    resetForm();

    if (!maPhim) return;

    try {
        const response = await fetch(`/api/suat-chieu/${maPhim}`);
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            allShowtimes = result.data;

            // Lấy chuỗi ngày an toàn từ MongoDB (ngayChieu) hoặc SQL (NGAY_CHIEU)
            const uniqueDates = [...new Set(allShowtimes.map(sc => {
                const dateStr = sc.ngayChieu || sc.NGAY_CHIEU;
                return dateStr ? dateStr.split('T')[0] : null;
            }).filter(Boolean))];

            const dateSelect = document.getElementById('date-select');
            uniqueDates.forEach(date => {
                const displayDate = new Date(date).toLocaleDateString('vi-VN');
                dateSelect.innerHTML += `<option value="${date}">${displayDate}</option>`;
            });
        } else {
            alert('Phim này hiện chưa có lịch chiếu!');
        }
    } catch (error) {
        console.error('Lỗi load suất chiếu:', error);
    }
}

// 3. Khi chọn Ngày -> Lọc ra Rạp
function onDateChange() {
    const selectedDate = document.getElementById('date-select').value;
    const cinemaSelect = document.getElementById('cinema-select');

    cinemaSelect.innerHTML = '<option value="">-- Chọn rạp --</option>';
    document.getElementById('showtime-list').innerHTML = '';
    document.getElementById('next-step-btn').disabled = true;

    if (!selectedDate) return;

    const showtimesOnDate = allShowtimes.filter(sc => {
        const dateStr = sc.ngayChieu || sc.NGAY_CHIEU;
        return dateStr && dateStr.startsWith(selectedDate);
    });

    // Tương thích tên rạp MongoDB/SQL
    const uniqueCinemas = [...new Set(showtimesOnDate.map(sc => sc.tenRap || sc.TEN_RAP))];

    uniqueCinemas.forEach(cinema => {
        cinemaSelect.innerHTML += `<option value="${cinema}">${cinema}</option>`;
    });
}

// 4. Khi chọn Rạp -> Hiển thị Giờ chiếu
function onCinemaChange() {
    const selectedDate = document.getElementById('date-select').value;
    const selectedCinema = document.getElementById('cinema-select').value;
    const showtimeList = document.getElementById('showtime-list');

    showtimeList.innerHTML = '';
    document.getElementById('next-step-btn').disabled = true;

    if (!selectedDate || !selectedCinema) return;

    const finalShowtimes = allShowtimes.filter(sc => {
        const dateStr = sc.ngayChieu || sc.NGAY_CHIEU;
        const tenRap = sc.tenRap || sc.TEN_RAP;
        return dateStr && dateStr.startsWith(selectedDate) && tenRap === selectedCinema;
    });

    if (finalShowtimes.length === 0) {
        showtimeList.innerHTML = '<p class="text-warning mt-3">Không có suất chiếu nào phù hợp.</p>';
        return;
    }

    finalShowtimes.forEach(sc => {
        const maSC = sc._id || sc.MA_SUAT_CHIEU;
        const tenPhong = sc.tenPhongChieu || sc.TEN_PHONG_CHIEU;

        let timeString = '--:--';
        if (sc.gioBatDau) {
            timeString = sc.gioBatDau;
        } else if (sc.GIO_BAT_DAU) {
            timeString = sc.GIO_BAT_DAU.includes('T') ? sc.GIO_BAT_DAU.split('T')[1].substring(0, 5) : sc.GIO_BAT_DAU.substring(0, 5);
        }

        // LƯU Ý: Bọc '${maSC}' trong dấu nháy đơn để JS hiểu đây là chuỗi ObjectID
        showtimeList.innerHTML += `
            <div class="col-md-3 col-6 mb-3">
                <button type="button" class="btn btn-outline-danger w-100 p-3 showtime-btn" 
                        onclick="selectShowtime(this, '${maSC}')">
                    <strong class="fs-4 d-block mb-1"><i class="bi bi-clock"></i> ${timeString}</strong>
                    <small class="d-block">${tenPhong}</small>
                </button>
            </div>
        `;
    });
}

// 5. Hàm chọn Giờ chiếu
window.selectShowtime = function (btnElement, maSuat) {
    selectedShowtime = maSuat;

    document.querySelectorAll('.showtime-btn').forEach(btn => {
        btn.classList.remove('selected');
    });

    btnElement.classList.add('selected');

    const nextBtn = document.getElementById('next-step-btn');
    nextBtn.disabled = false;
    nextBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetForm() {
    allShowtimes = [];
    selectedShowtime = null;
    document.getElementById('date-select').innerHTML = '<option value="">-- Chọn ngày --</option>';
    document.getElementById('cinema-select').innerHTML = '<option value="">-- Chọn rạp --</option>';
    document.getElementById('showtime-list').innerHTML = '';
    document.getElementById('next-step-btn').disabled = true;
}