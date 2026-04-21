document.addEventListener('DOMContentLoaded', function () {
    const registerForm = document.getElementById('register-form');
    
    if (registerForm) {
        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            
            const fullname = document.getElementById('reg-fullname').value;
            const username = document.getElementById('reg-username').value;
            const password = document.getElementById('reg-password').value;
            const phone = document.getElementById('reg-phone').value;
            const email = document.getElementById('reg-email').value;

            Swal.fire({
                title: 'Đang tạo tài khoản...',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fullname, username, password, phone, email })
                });
                const result = await response.json();

                if (result.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Tuyệt vời!',
                        text: 'Đăng ký thành công. Bạn có thể đăng nhập ngay bây giờ!',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        window.location.href = '/login'; 
                    });
                } else {
                    Swal.fire({ icon: 'error', title: 'Đăng ký thất bại', text: result.message });
                }
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Lỗi kết nối', text: 'Không thể kết nối tới máy chủ!' });
            }
        });
    }
});