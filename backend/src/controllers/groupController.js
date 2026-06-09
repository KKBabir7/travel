import Group from '../models/Group.js';
import Post from '../models/Post.js';

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

export const createGroup = async (req, res, next) => {
  try {
    const { name, description, isPrivate, coverImage } = req.body;
    const userId = req.user.id;

    let baseSlug = slugify(name);
    let slug = baseSlug;

    let exists = await Group.findOne({ slug });
    let count = 1;
    while (exists) {
      slug = `${baseSlug}-${count}`;
      exists = await Group.findOne({ slug });
      count++;
    }

    const group = await Group.create({
      name,
      slug,
      description,
      creator: userId,
      members: [userId],
      isPrivate,
      coverImage
    });

    return res.status(201).json({ success: true, group });
  } catch (error) {
    next(error);
  }
};

export const getGroupDetails = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const group = await Group.findOne({ slug })
      .populate('creator', 'displayName username profilePicture')
      .populate('members', 'displayName username profilePicture bio');

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    return res.status(200).json({ success: true, group });
  } catch (error) {
    next(error);
  }
};

export const joinGroup = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const userId = req.user.id;

    const group = await Group.findOne({ slug });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (group.members.includes(userId)) {
      return res.status(400).json({ success: false, message: 'You are already a member of this group' });
    }

    group.members.push(userId);
    await group.save();

    return res.status(200).json({ success: true, message: 'Joined group successfully', group });
  } catch (error) {
    next(error);
  }
};

export const leaveGroup = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const userId = req.user.id;

    const group = await Group.findOne({ slug });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (!group.members.includes(userId)) {
      return res.status(400).json({ success: false, message: 'You are not a member of this group' });
    }

    // Creator cannot leave their own group (or must delegate creator role)
    if (group.creator.toString() === userId) {
      return res.status(400).json({ success: false, message: 'Creators cannot leave their group. Delete the group instead.' });
    }

    group.members.pull(userId);
    await group.save();

    return res.status(200).json({ success: true, message: 'Left group successfully', group });
  } catch (error) {
    next(error);
  }
};

export const getGroupPosts = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const group = await Group.findOne({ slug });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // If private group, check membership
    if (group.isPrivate && !group.members.includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Access denied. This is a private group.' });
    }

    const posts = await Post.find({ group: group._id, status: 'active' })
      .populate('user', 'displayName username profilePicture')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, posts });
  } catch (error) {
    next(error);
  }
};

export const createGroupPost = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { content, mediaUrls } = req.body;
    const userId = req.user.id;

    const group = await Group.findOne({ slug });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (!group.members.includes(userId)) {
      return res.status(403).json({ success: false, message: 'You must be a member to post in this group' });
    }

    const post = await Post.create({
      user: userId,
      content,
      mediaUrls,
      group: group._id,
      type: mediaUrls && mediaUrls.length > 0 ? 'image' : 'text'
    });

    const populatedPost = await post.populate('user', 'displayName username profilePicture');

    return res.status(201).json({ success: true, post: populatedPost });
  } catch (error) {
    next(error);
  }
};

export const listGroups = async (req, res, next) => {
  try {
    const groups = await Group.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, groups });
  } catch (error) {
    next(error);
  }
};
