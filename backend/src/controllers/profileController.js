import User from '../models/User.js';
import Follow from '../models/Follow.js';
import Post from '../models/Post.js';
import Notification from '../models/Notification.js';
import { getRedisClient } from '../config/redis.js';
import { sendSSEEvent } from '../config/sse.js';
import { addNotificationJob } from '../config/bullmq.js';

export const getProfile = async (req, res, next) => {
  try {
    const { username } = req.params;
    const redis = getRedisClient();

    let profileData;
    // Check Cache
    if (redis) {
      const cached = await redis.get(`profile:${username}`);
      if (cached) {
        profileData = JSON.parse(cached);
      }
    }

    if (!profileData) {
      const user = await User.findOne({ username }).select('-password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Count posts
      const postsCount = await Post.countDocuments({ user: user._id, type: { $ne: 'story' } });
      
      // Count follow relationship
      const followersCount = await Follow.countDocuments({ following: user._id });
      const followingCount = await Follow.countDocuments({ follower: user._id });

      profileData = {
        user,
        stats: {
          postsCount,
          followersCount,
          followingCount
        }
      };

      // Set Cache for 10 minutes
      if (redis) {
        await redis.set(`profile:${username}`, JSON.stringify(profileData), { EX: 600 });
      }
    }

    // Check if the requesting user is following this profile
    let isFollowing = false;
    if (req.user) {
      const followExists = await Follow.findOne({ follower: req.user._id, following: profileData.user._id });
      isFollowing = !!followExists;
    }

    return res.status(200).json({
      success: true,
      data: {
        ...profileData,
        isFollowing
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Remove immutable fields
    delete updates.password;
    delete updates.email;
    delete updates.username;
    delete updates.roles;

    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
    
    // Invalidate Cache
    const redis = getRedisClient();
    if (redis) {
      await redis.del(`profile:${user.username}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

export const followUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.id;

    if (currentUserId === targetUserId) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target user not found' });
    }

    // Check if already following
    const alreadyFollows = await Follow.findOne({ follower: currentUserId, following: targetUserId });
    if (alreadyFollows) {
      return res.status(400).json({ success: false, message: 'You are already following this user' });
    }

    await Follow.create({ follower: currentUserId, following: targetUserId });

    // Invalidate cached profiles
    const redis = getRedisClient();
    if (redis) {
      await redis.del(`profile:${targetUser.username}`);
      await redis.del(`profile:${req.user.username}`);
    }

    // Save and push notification
    const notification = await Notification.create({
      recipient: targetUserId,
      sender: currentUserId,
      type: 'follow',
      link: `/u/${req.user.username}`
    });

    // Populate sender details for the notification event
    const populatedNotif = await notification.populate('sender', 'displayName username profilePicture');

    // Emit live SSE notification
    sendSSEEvent(targetUserId, 'notification', populatedNotif);

    // Queue notification job (e.g. dynamic push notification or email fallback)
    await addNotificationJob(populatedNotif);

    return res.status(200).json({ success: true, message: `You followed ${targetUser.displayName}` });
  } catch (error) {
    next(error);
  }
};

export const unfollowUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.id;

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target user not found' });
    }

    const followRelation = await Follow.findOneAndDelete({ follower: currentUserId, following: targetUserId });
    if (!followRelation) {
      return res.status(400).json({ success: false, message: 'You are not following this user' });
    }

    // Invalidate cached profiles
    const redis = getRedisClient();
    if (redis) {
      await redis.del(`profile:${targetUser.username}`);
      await redis.del(`profile:${req.user.username}`);
    }

    return res.status(200).json({ success: true, message: `You unfollowed ${targetUser.displayName}` });
  } catch (error) {
    next(error);
  }
};

export const getFollowers = async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const followers = await Follow.find({ following: user._id })
      .populate('follower', 'displayName username profilePicture bio country');

    return res.status(200).json({ success: true, followers: followers.map(f => f.follower) });
  } catch (error) {
    next(error);
  }
};

export const getFollowing = async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const following = await Follow.find({ follower: user._id })
      .populate('following', 'displayName username profilePicture bio country');

    return res.status(200).json({ success: true, following: following.map(f => f.following) });
  } catch (error) {
    next(error);
  }
};

export const getSuggestedTravelers = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;

    // Get list of users already followed
    const followingRelations = await Follow.find({ follower: currentUserId }).select('following');
    const followingIds = followingRelations.map(f => f.following);

    // Get suggestions: Users who current user is not following, and not themselves
    const suggestions = await User.find({
      _id: { $nin: [...followingIds, currentUserId] },
      emailVerified: true
    })
    .select('displayName username profilePicture bio travelInterests country')
    .limit(5);

    return res.status(200).json({ success: true, suggestions });
  } catch (error) {
    next(error);
  }
};
