const express = require('express');
const router = express.Router();
const phimController = require('../controllers/phimController');

// Đường dẫn: http://localhost:5000/api/phim/all
router.get('/all', phimController.getAllMovies);

// Đường dẫn: http://localhost:5000/api/phim/detail/:id
router.get('/detail/:id', phimController.getMovieDetail);
router.get('/da-xem/:maND', phimController.getPhimDaXemAPI);

module.exports = router;