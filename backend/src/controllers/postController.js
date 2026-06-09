import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Reaction from '../models/Reaction.js';
import Follow from '../models/Follow.js';
import Saved from '../models/Saved.js';
import Notification from '../models/Notification.js';
import { getRedisClient } from '../config/redis.js';
import { sendSSEEvent, broadcastSSEEvent } from '../config/sse.js';
import { addNotificationJob } from '../config/bullmq.js';

export const createPost = async (req, res, next) => {
  try {
    const { content, type, mediaUrls, location, group, event, journal } = req.body;
    const userId = req.user.id;

    // Calculate expiration if type is a Story
    let expiresAt = undefined;
    if (type === 'story') {
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    }

    const post = await Post.create({
      user: userId,
      content,
      type,
      mediaUrls,
      location,
      group,
      event,
      journal,
      expiresAt
    });

    const populatedPost = await post.populate('user', 'displayName username profilePicture');

    // Real-time notify via SSE
    if (type === 'story') {
      broadcastSSEEvent('new_story', populatedPost);
    } else if (type === 'reels') {
      broadcastSSEEvent('new_reel', populatedPost);
    } else {
      broadcastSSEEvent('new_post', populatedPost);
    }

    // Invalidate Redis caches for feeds if applicable
    const redis = getRedisClient();
    if (redis) {
      await redis.del(`feed:discover:1`);
      await redis.del(`feed:trending:1`);
    }

    return res.status(201).json({ success: true, post: populatedPost });
  } catch (error) {
    next(error);
  }
};

export const getFeeds = async (req, res, next) => {
  try {
    const { type = 'discover', page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const userId = req.user.id;
    const redis = getRedisClient();

    // Cache key
    const cacheKey = `feed:${type}:${page}`;
    
    // Attempt cache read for page 1 of Discover/Trending (public feeds)
    if (redis && page == 1 && type !== 'following') {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.status(200).json({ success: true, posts: JSON.parse(cached) });
      }
    }

    let query = { 
      status: 'active',
      type: { $nin: ['story'] } // stories are fetched separately
    };

    if (type === 'following') {
      const followingRelations = await Follow.find({ follower: userId }).select('following');
      const followingIds = followingRelations.map(f => f.following);
      // Include current user's posts in their following feed too
      query.user = { $in: [...followingIds, userId] };
    }

    let postsQuery = Post.find(query)
      .populate('user', 'displayName username profilePicture isVerified')
      .populate('journal', 'title slug coverImage')
      .skip(skip)
      .limit(parseInt(limit));

    if (type === 'trending') {
      // Sort by score: likesCount + commentsCount * 2 + sharesCount * 3
      postsQuery = postsQuery.sort({ 
        likesCount: -1, 
        commentsCount: -1, 
        createdAt: -1 
      });
    } else {
      // Default to chronological for Following & Discover
      postsQuery = postsQuery.sort({ createdAt: -1 });
    }

    const posts = await postsQuery;

    // Cache page 1 results
    if (redis && page == 1 && type !== 'following') {
      await redis.set(cacheKey, JSON.stringify(posts), { EX: 60 }); // Cache for 60 seconds
    }

    return res.status(200).json({ success: true, posts });
  } catch (error) {
    next(error);
  }
};

export const reactToPost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const { type = 'Like' } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Check if user already reacted to this post
    const existingReaction = await Reaction.findOne({ user: userId, post: postId });

    if (existingReaction) {
      if (existingReaction.type === type) {
        // Toggle off if same reaction type is clicked again
        await Reaction.findByIdAndDelete(existingReaction._id);
        post.likesCount = Math.max(0, post.likesCount - 1);
        await post.save();

        // Broadcast count update
        broadcastSSEEvent(`reaction_count:${postId}`, { likesCount: post.likesCount });

        return res.status(200).json({ success: true, reacted: false, likesCount: post.likesCount });
      } else {
        // Update reaction type
        existingReaction.type = type;
        await existingReaction.save();
        return res.status(200).json({ success: true, reacted: true, reaction: type, likesCount: post.likesCount });
      }
    } else {
      // Create new reaction
      await Reaction.create({ user: userId, post: postId, type });
      post.likesCount += 1;
      await post.save();

      // Broadcast count update
      broadcastSSEEvent(`reaction_count:${postId}`, { likesCount: post.likesCount });

      // Notify post author (if not reacting to own post)
      if (post.user.toString() !== userId) {
        const notification = await Notification.create({
          recipient: post.user,
          sender: userId,
          type: 'like',
          link: `/u/${req.user.username}?post=${postId}`
        });

        const populatedNotif = await notification.populate('sender', 'displayName username profilePicture');
        sendSSEEvent(post.user, 'notification', populatedNotif);
        await addNotificationJob(populatedNotif);
      }

      return res.status(200).json({ success: true, reacted: true, reaction: type, likesCount: post.likesCount });
    }
  } catch (error) {
    next(error);
  }
};

export const commentOnPost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const { content, parentCommentId } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = await Comment.create({
      post: postId,
      user: userId,
      content,
      parentComment: parentCommentId || null
    });

    post.commentsCount += 1;
    await post.save();

    const populatedComment = await comment.populate('user', 'displayName username profilePicture');

    // Broadcast count update
    broadcastSSEEvent(`comment_count:${postId}`, { commentsCount: post.commentsCount });

    // Notify post author (if not commenting on own post)
    if (post.user.toString() !== userId) {
      const notification = await Notification.create({
        recipient: post.user,
        sender: userId,
        type: 'comment',
        link: `/u/${req.user.username}?post=${postId}`
      });

      const populatedNotif = await notification.populate('sender', 'displayName username profilePicture');
      sendSSEEvent(post.user, 'notification', populatedNotif);
      await addNotificationJob(populatedNotif);
    }

    return res.status(201).json({ success: true, comment: populatedComment });
  } catch (error) {
    next(error);
  }
};

export const getComments = async (req, res, next) => {
  try {
    const postId = req.params.id;
    // Get top-level comments first
    const comments = await Comment.find({ post: postId, parentComment: null })
      .populate('user', 'displayName username profilePicture')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, comments });
  } catch (error) {
    next(error);
  }
};

export const getCommentReplies = async (req, res, next) => {
  try {
    const commentId = req.params.commentId;
    const replies = await Comment.find({ parentComment: commentId })
      .populate('user', 'displayName username profilePicture')
      .sort({ createdAt: 1 });

    return res.status(200).json({ success: true, replies });
  } catch (error) {
    next(error);
  }
};

export const savePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const alreadySaved = await Saved.findOne({ user: userId, item: postId, itemType: 'Post' });
    if (alreadySaved) {
      return res.status(400).json({ success: false, message: 'Post already saved' });
    }

    await Saved.create({ user: userId, item: postId, itemType: 'Post' });
    return res.status(200).json({ success: true, message: 'Post saved successfully' });
  } catch (error) {
    next(error);
  }
};

export const unsavePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const savedRecord = await Saved.findOneAndDelete({ user: userId, item: postId, itemType: 'Post' });
    if (!savedRecord) {
      return res.status(400).json({ success: false, message: 'Post was not saved' });
    }

    return res.status(200).json({ success: true, message: 'Post unsaved successfully' });
  } catch (error) {
    next(error);
  }
};

export const getActiveStories = async (req, res, next) => {
  try {
    // Stories expire after 24 hours. Fetch active ones.
    const stories = await Post.find({
      type: 'story',
      expiresAt: { $gt: new Date() }
    })
    .populate('user', 'displayName username profilePicture')
    .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, stories });
  } catch (error) {
    next(error);
  }
};

export const getReels = async (req, res, next) => {
  try {
    const { page = 1, limit = 5 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reels = await Post.find({ type: 'reels', status: 'active' })
      .populate('user', 'displayName username profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({ success: true, reels });
  } catch (error) {
    next(error);
  }
};
