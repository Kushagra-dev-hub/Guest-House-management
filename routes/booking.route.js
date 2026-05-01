const express = require('express');
const Booking = require('../models/Booking');
const router = express.Router();
const { ensureAuthenticated, ensureAdmin } = require('../middlewares/auth');

// ✅ 1. User submits a booking
router.post('/add', ensureAuthenticated, async (req, res) => {
    try {
        const { checkInDate, checkOutDate, roomType, numberOfGuests } = req.body;
        const newBooking = new Booking({
            checkInDate,
            checkOutDate,
            roomType,
            numberOfGuests,
            status: 'Pending',
            user: req.user._id,
        });
        await newBooking.save();
        res.json({ success: true, message: 'Booking requested successfully', booking: newBooking });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to submit booking' });
    }
});

// ✅ 2. User can view only their bookings
router.get('/my-bookings', ensureAuthenticated, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .select('checkInDate checkOutDate roomType numberOfGuests status createdAt'); 
        res.json({ success: true, bookings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
});

// ✅ 3. Admin can view all pending/rejected bookings
router.get('/all', ensureAuthenticated, ensureAdmin, async (req, res) => {
    try {
        const bookings = await Booking.find({ status: { $ne: 'Confirmed' } })
            .populate({
                path: 'user',
                select: 'name email mobileNo',
            });
        res.json({ success: true, bookings });
    } catch (error) {
        console.error('Error in fetching bookings:', error);
        res.status(500).json({ error: 'Server Error' });
    }
});

// ✅ 4. Admin can view confirmed bookings
router.get('/resolved', ensureAuthenticated, ensureAdmin, async (req, res) => {
    try {
        const bookings = await Booking.find({ status: 'Confirmed' })
            .populate({
                path: 'user',
                select: 'name email mobileNo',
            });
        res.json({ success: true, bookings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching confirmed bookings' });
    }
});

// ✅ 5. Admin updates booking status
router.post('/update-status', ensureAuthenticated, ensureAdmin, async (req, res) => {
    try {
        const { bookingId, status } = req.body;

        const booking = await Booking.findById(bookingId).populate('user');
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        booking.status = status;
        await booking.save();

        res.json({ success: true, message: 'Booking status updated successfully', booking });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

module.exports = router;
