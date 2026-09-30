const Booking = require('../models/Booking');
const User = require('../models/User');
const { sendBookingConfirmation } = require('../services/emailService');
const { createNotification } = require('./notificationController');

// @desc    Create booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res) => {
  try {
    const { name, phone, date, type } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const booking = await Booking.create({
      userId: req.user.id,
      name: name || user.name,
      phone: phone || user.phone,
      email: user.email,
      date,
      type,
      status: 'pending',
    });

    // Send confirmation email
    try {
      await sendBookingConfirmation(booking, user);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail the request if email fails
    }

    // Notify admins about new booking
    await createNotification(
      'booking',
      'New Puja Booking',
      `${booking.name} booked a ${booking.type} puja`,
      { id: booking._id, name: booking.name, email: booking.email, type: booking.type, date: booking.date, status: booking.status, createdAt: booking.createdAt }
    );

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking created successfully',
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user bookings
// @route   GET /api/bookings/my
// @access  Private
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking or is admin
    if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private
exports.updateBooking = async (req, res) => {
  try {
    const { name, phone, date, type } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    booking.name = name || booking.name;
    booking.phone = phone || booking.phone;
    booking.date = date || booking.date;
    booking.type = type || booking.type;
    await booking.save();

    res.json({
      success: true,
      data: booking,
      message: 'Booking updated successfully',
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({
      success: true,
      data: booking,
      message: 'Booking cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};