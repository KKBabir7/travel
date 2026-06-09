import User from '../models/User.js';
import Post from '../models/Post.js';
import Group from '../models/Group.js';
import Event from '../models/Event.js';
import Report from '../models/Report.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalGroups = await Group.countDocuments();
    const totalEvents = await Event.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });

    // Approximate DAU / MAU based on updatedAt fields
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const dau = await User.countDocuments({ updatedAt: { $gte: oneDayAgo } });
    const mau = await User.countDocuments({ updatedAt: { $gte: thirtyDaysAgo } });

    // Growth rates, trending categories mock or aggregate
    const engagementRate = totalUsers > 0 ? ((totalPosts / totalUsers) * 100).toFixed(1) : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalPosts,
        totalGroups,
        totalEvents,
        pendingReports,
        dau,
        mau,
        engagementRate
      }
    });
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { roles } = req.body; // Array of roles, e.g. ['User', 'Admin']

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.roles = roles;
    await user.save();

    return res.status(200).json({ success: true, message: 'User roles updated successfully', user });
  } catch (error) {
    next(error);
  }
};

export const toggleUserVerification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isVerified = !user.isVerified;
    if (user.isVerified) {
      // Add 'Verified Traveler' to roles if not present
      if (!user.roles.includes('Verified Traveler')) {
        user.roles.push('Verified Traveler');
      }
    } else {
      user.roles = user.roles.filter(r => r !== 'Verified Traveler');
    }

    await user.save();
    return res.status(200).json({ success: true, message: `Verification status toggled to ${user.isVerified}`, user });
  } catch (error) {
    next(error);
  }
};

export const createReport = async (req, res, next) => {
  try {
    const { contentId, contentType, reason } = req.body;
    const reporterId = req.user.id;

    const report = await Report.create({
      reporter: reporterId,
      contentId,
      contentType,
      reason
    });

    return res.status(201).json({ success: true, message: 'Content reported successfully', report });
  } catch (error) {
    next(error);
  }
};

export const listReports = async (req, res, next) => {
  try {
    const reports = await Report.find()
      .populate('reporter', 'displayName username profilePicture')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, reports });
  } catch (error) {
    next(error);
  }
};

export const updateReportStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'resolved' or 'dismissed'

    const report = await Report.findByIdAndUpdate(id, { status }, { new: true });
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    return res.status(200).json({ success: true, message: `Report status marked as ${status}`, report });
  } catch (error) {
    next(error);
  }
};

export const deleteFlaggedContent = async (req, res, next) => {
  try {
    const { contentType, contentId } = req.body;

    if (contentType === 'Post') {
      await Post.findByIdAndDelete(contentId);
    } else if (contentType === 'Comment') {
      await Comment.findByIdAndDelete(contentId);
    } else if (contentType === 'Group') {
      await Group.findByIdAndDelete(contentId);
    } else if (contentType === 'Event') {
      await Event.findByIdAndDelete(contentId);
    } else if (contentType === 'User') {
      await User.findByIdAndDelete(contentId);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid content type' });
    }

    // Resolve reports linked to this content
    await Report.updateMany({ contentId }, { status: 'resolved' });

    return res.status(200).json({ success: true, message: 'Flagged content deleted successfully' });
  } catch (error) {
    next(error);
  }
};
