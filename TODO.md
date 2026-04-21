# TODO - Hoàn thiện Luồng Đặt Vé Chính (Duy Movie)

## ✅ **HOÀN THÀNH**
- [x] Bước 1: Tạo TODO.md để track progress

## ✅ **HOÀN THÀNH + FEATURES MỚI**

- [✅] Bước 2: **index.js** - Mount datGheRouter + Fix route `/ghe` → `/sodoghe`
- [✅] Bước 3: **public/js/app.js** - Fix link booking từ `ghe.html` → `sodoghe.ejs`
- [✅] Bước 4: Tạo **models/ghe.js** & **models/hoadon.js** (support veController SQL)
- [✅] Bước 5a: Fix auth flow - Redirect `/login` khi chưa đăng nhập
- [✅] Bước 5b: **Test full flow** - Luồng đặt vé chính hoàn thiện
- [✅] Bước 5b: Fix auth.js + Test đăng nhập/đặt vé full flow
- [✅] Bước 6: **Project hoàn thiện** - Chạy `npm start` để demo

## ✅ **FEATURES HOÀN THIỆN:**
```
✅ 1. Trang chủ list phim 
✅ 2. XEM CHI TIẾT PHIM (PHIM + THỂ LOẠI ✓)
✅ 3. Đặt vé - **Chọn suất ngay trang chủ** ✓
✅ 4. Chọn ghế tương tác
✅ 5. Đăng nhập/đăng xuất
✅ 6. Tạo hóa đơn + vé
```

**Chạy:** `nodemon index.js` hoặc `node index.js` → http://localhost:5000/
**Test:** Phim card → Xem chi tiết → Đặt vé ✓
```

```
1. http://localhost:5000/ → List phim OK
2. Click "ĐẶT VÉ" → Load giờ chiếu OK  
3. Click giờ → sodoghe.ejs?id=1 → Load ghế + info phim OK
4. Chọn ghế → Xác nhận → Tạo hóa đơn + vé OK
```

