const phimModel = require('../mongoDAL/phim');

class PhimController {
    // API: Lấy toàn bộ danh sách phim
    async getAllMovies(req, res) {
        try {
            const movies = await phimModel.getAll();
            res.status(200).json({
                success: true,
                data: movies
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Lỗi khi lấy danh sách phim",
                error: error.message
            });
        }
    }

    // API: Lấy chi tiết 1 bộ phim theo ID
    async getMovieDetail(req, res) {
        try {
            const id = req.params.id;
            const movie = await phimModel.getById(id);
            if (!movie) return res.status(404).json({ message: "Không tìm thấy phim" });

            // Log để kiểm tra dữ liệu thực tế chảy từ DB ra
            console.log("Data Phim:", movie);
            res.json(movie);
        } catch (error) {
            res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    }
    // Thêm vào trong class PhimController
    async getPhimDaXemAPI(req, res) {
        try {
            const maND = req.params.maND;
            const movies = await phimModel.getPhimDaXem(maND);
            res.status(200).json({ success: true, data: movies });
        } catch (error) {
            console.error("Lỗi lấy danh sách phim đã xem:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new PhimController();