function checkLogin() {
    const userData = localStorage.getItem('user');
    const userInfoDiv = document.getElementById('user-info');
    if (!userInfoDiv || !userData) return;

    try {
        const user = JSON.parse(userData);
        // Nếu localStorage có user, ta cập nhật lại giao diện cho chắc chắn
        const isAdmin = user.vaiTro === 'admin';
        const actionBtn = isAdmin
            ? `<a href="/admin" class="btn btn-danger btn-sm rounded-pill px-3 fw-bold">Trang Quản Trị</a>`
            : `<a href="/lichsu?id=${user._id}" class="btn btn-outline-danger btn-sm rounded-pill px-3 fw-medium">Vé của tôi</a>`;

        userInfoDiv.innerHTML = `
        <div class="d-flex align-items-center gap-3">
            ${actionBtn}
            
            <a href="/profile" class="d-flex align-items-center gap-2 py-1 px-2 rounded-pill bg-light border text-decoration-none transition-all shadow-sm-hover">
                <i class="bi bi-person-circle text-secondary fs-5"></i>
                <span class="text-dark fw-bold" style="font-size: 14px;">${user.hoTen}</span>
            </a>

            <button onclick="logout()" class="btn btn-light btn-sm rounded-pill px-3 text-secondary border fw-medium">
                Đăng xuất
            </button>
        </div>
`;
    } catch (e) {
        localStorage.removeItem('user');
    }
}

window.logout = function () {
    Swal.fire({
        title: 'Bạn muốn đăng xuất?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Đăng xuất',
        cancelButtonText: 'Hủy'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                // Xóa session trên Server
                await fetch('/api/auth/logout', { method: 'POST' });

                // Xóa localStorage trên Client
                localStorage.removeItem('user');

                // Về trang chủ và reload
                window.location.href = '/';
            } catch (e) {
                console.error("Lỗi đăng xuất:", e);
                window.location.href = '/';
            }
        }
    });
};

document.addEventListener('DOMContentLoaded', checkLogin);