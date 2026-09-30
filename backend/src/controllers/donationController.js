const Donation = require('../models/Donation');
const User = require('../models/User');
const AdminSettings = require('../models/AdminSettings');
const { sendDonationConfirmation } = require('../services/emailService');
const { createNotification } = require('./notificationController');

// @desc    Create donation
// @route   POST /api/donations
// @access  Private
exports.createDonation = async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const donation = await Donation.create({
      userId: req.user.id,
      name: user.name,
      email: user.email,
      amount: amount || 0,
    });

    // Update donation count in settings
    const settings = await AdminSettings.getSettings();
    settings.donate.baseCount += 1;
    await settings.save();

    // Send confirmation email
    try {
      await sendDonationConfirmation(donation, user);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail the request if email fails
    }

    // Notify admins about new donation
    await createNotification(
      'donation',
      'New Donation Received',
      `${donation.name} donated to the temple`,
      { id: donation._id, name: donation.name, email: donation.email, amount: donation.amount, date: donation.date, status: donation.status }
    );

    res.status(201).json({
      success: true,
      data: donation,
      message: 'Donation recorded successfully',
    });
  } catch (error) {
    console.error('Create donation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user donations
// @route   GET /api/donations/my
// @access  Private
exports.getMyDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ userId: req.user.id })
      .sort({ date: -1 });
    res.json({
      success: true,
      count: donations.length,
      data: donations,
    });
  } catch (error) {
    console.error('Get my donations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get donation by ID
// @route   GET /api/donations/:id
// @access  Private
exports.getDonationById = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (donation.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({
      success: true,
      data: donation,
    });
  } catch (error) {
    console.error('Get donation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get donation statistics
// @route   GET /api/donations/stats
// @access  Private
exports.getDonationStats = async (req, res) => {
  try {
    const totalDonations = await Donation.countDocuments();
    const settings = await AdminSettings.getSettings();
    const totalDonors = settings.donate.baseCount + totalDonations;

    res.json({
      success: true,
      data: {
        totalDonors,
        totalRecorded: totalDonations,
      },
    });
  } catch (error) {
    console.error('Get donation stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};