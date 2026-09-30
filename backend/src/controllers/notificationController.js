const Notification = require('../models/Notification');

// @desc    Helper to create an admin notification
const MAX_NOTIFICATIONS = 30;

const createNotification = async (type, title, message, data = {}) => {
  try {
    await Notification.create({ type, title, message, data });

    // Auto-delete the oldest notifications once the total exceeds 30
    const total = await Notification.countDocuments();
    if (total > MAX_NOTIFICATIONS) {
      const excess = await Notification.find()
        .sort({ createdAt: 1 })
        .limit(total - MAX_NOTIFICATIONS)
        .select('_id');
      const excessIds = excess.map(n => n._id);
      if (excessIds.length > 0) {
        await Notification.deleteMany({ _id: { $in: excessIds } });
        console.log(`🗑️ Auto-deleted ${excessIds.length} old notification(s), keeping the latest ${MAX_NOTIFICATIONS}`);
      }
    }
  } catch (error) {
    console.error('❌ Notification create error:', error.message);
  }
};
exports.createNotification = createNotification;

// @desc    Get all notifications
// @route   GET /api/admin/notifications
// @access  Private/Admin
exports.getNotifications = async (req, res) => {
  try {
    const { type, limit = 100, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (type && type !== 'all') {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unread = await Notification.countDocuments({ read: false });

    res.json({
      success: true,
      data: notifications,
      stats: {
        total,
        unread,
        users: await Notification.countDocuments({ type: 'user' }),
        bookings: await Notification.countDocuments({ type: 'booking' }),
        donations: await Notification.countDocuments({ type: 'donation' }),
        contacts: await Notification.countDocuments({ type: 'contact' }),
        subscribes: await Notification.countDocuments({ type: 'subscribe' }),
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Mark a single notification as read / unread
// @route   PUT /api/admin/notifications/:id/read
// @access  Private/Admin
exports.markNotificationRead = async (req, res) => {
  try {
    const { read } = req.body;
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notification.read = typeof read === 'boolean' ? read : !notification.read;
    await notification.save();

    res.json({ success: true, data: notification });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/admin/notifications/read-all
// @access  Private/Admin
exports.markAllNotificationsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { read: false },
      { $set: { read: true } }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
    });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a single notification
// @route   DELETE /api/admin/notifications/:id
// @access  Private/Admin
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete all notifications (optionally by type)
// @route   DELETE /api/admin/notifications
// @access  Private/Admin
exports.deleteAllNotifications = async (req, res) => {
  try {
    const { type } = req.body;
    let query = {};
    if (type && type !== 'all') {
      query.type = type;
    }

    const result = await Notification.deleteMany(query);
    res.json({
      success: true,
      message: `${result.deletedCount} notifications deleted`,
    });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};