import Notification from '../models/Notification.js';

export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.find({ recipient: userId })
      .populate('sender', 'displayName username profilePicture')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, notifications });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.status(200).json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });

    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};
