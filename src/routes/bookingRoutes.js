const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const verifyAuth = require('../utils/authMiddleware');

router.use(verifyAuth);


router.get('/packages', async (req, res) => {
    try {
        const prisma = require('../utils/prisma');
        const packages = await prisma.package.findMany();
        res.json(packages);
    } catch (error) {
        res.status(500).json({ error: "Gagal mengambil master paket wisata" });
    }
});


router.get('/', bookingController.getAllBookings);
router.post('/', bookingController.createBooking);

router.put('/:id', bookingController.updateBooking);
router.delete('/:id', bookingController.deleteBooking);

router.patch('/:id/status', bookingController.updateStatus);

module.exports = router;