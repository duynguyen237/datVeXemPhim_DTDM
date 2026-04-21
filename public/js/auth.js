async function handleAuth() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    // Hiện loading
    Swal.fire({
        title: 'Đang xử lý...',
        text: 'Vui lòng chờ trong giây lát',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const result = await response.json();

        if (result.success) {
            Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: result.message || 'Đăng nhập thành công!',
                confirmButtonText: 'Vào trang chủ'
            }).then(() => {
                window.location.href = '/';
            });
        } else {
            Swal.fire({ icon: 'error', title: 'Lỗi!', text: result.message || 'Đăng nhập thất bại!' });
        }
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Oops...', text: 'Lỗi kết nối server!' });
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            await handleAuth();
        });
    }
});
window.handleAuth = handleAuth;

