document.getElementById('login-form').addEventListener('submit', async function (e) {
    // Ngăn chặn form tải lại trang
    e.preventDefault();

    // Lấy dữ liệu từ ô input
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        // Gửi request lên API của MongoDB
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        // Hứng kết quả trả về
        const result = await response.json();

        if (result.success) {
            // ✅ ĐĂNG NHẬP THÀNH CÔNG
            // Sử dụng result.message (chữ m viết thường)
            Swal.fire({
                icon: 'success',
                title: 'Thành công',
                text: result.message,
                confirmButtonText: 'Vào trang chủ'
            }).then(() => {
                // Chuyển hướng về trang chủ sau khi bấm OK
                window.location.href = '/';
            });
        } else {
            // ❌ ĐĂNG NHẬP THẤT BẠI (Sai pass, sai tên)
            Swal.fire({
                icon: 'error',
                title: 'Đăng nhập thất bại',
                text: result.message // Chữ m viết thường
            });
        }
    } catch (error) {
        console.error("Lỗi:", error);
        Swal.fire({
            icon: 'error',
            title: 'Lỗi hệ thống',
            text: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau!'
        });
    }
});