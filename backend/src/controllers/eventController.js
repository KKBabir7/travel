import Event from '../models/Event.js';
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

export const createEvent = async (req, res, next) => {
  try {
    const { title, description, date, location, coverImage } = req.body;
    const userId = req.user.id;

    let baseSlug = slugify(title);
    let slug = baseSlug;

    let exists = await Event.findOne({ slug });
    let count = 1;
    while (exists) {
      slug = `${baseSlug}-${count}`;
      exists = await Event.findOne({ slug });
      count++;
    }

    const event = await Event.create({
      title,
      slug,
      description,
      organizer: userId,
      location,
      date,
      coverImage
    });

    return res.status(201).json({ success: true, event });
  } catch (error) {
    next(error);
  }
};

export const getEventDetails = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const event = await Event.findOne({ slug })
      .populate('organizer', 'displayName username profilePicture')
      .populate('rsvp.going', 'displayName username profilePicture')
      .populate('rsvp.interested', 'displayName username profilePicture');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    return res.status(200).json({ success: true, event });
  } catch (error) {
    next(error);
  }
};

export const rsvpEvent = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { status } = req.body; // 'going', 'interested', or 'none'
    const userId = req.user.id;

    const event = await Event.findOne({ slug });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Pull from both arrays first to reset
    event.rsvp.going.pull(userId);
    event.rsvp.interested.pull(userId);

    if (status === 'going') {
      event.rsvp.going.push(userId);
    } else if (status === 'interested') {
      event.rsvp.interested.push(userId);
    }

    await event.save();
    return res.status(200).json({ success: true, message: `RSVP updated to ${status}`, event });
  } catch (error) {
    next(error);
  }
};

export const listEvents = async (req, res, next) => {
  try {
    // Show upcoming events
    const events = await Event.find({ date: { $gte: new Date() } })
      .populate('organizer', 'displayName username profilePicture')
      .sort({ date: 1 });

    return res.status(200).json({ success: true, events });
  } catch (error) {
    next(error);
  }
};

export const getEventDiscussion = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const event = await Event.findOne({ slug });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const posts = await Post.find({ event: event._id })
      .populate('user', 'displayName username profilePicture')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, posts });
  } catch (error) {
    next(error);
  }
};

export const createEventDiscussionPost = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { content, mediaUrls } = req.body;
    const userId = req.user.id;

    const event = await Event.findOne({ slug });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const post = await Post.create({
      user: userId,
      content,
      mediaUrls,
      event: event._id,
      type: mediaUrls && mediaUrls.length > 0 ? 'image' : 'text'
    });

    const populatedPost = await post.populate('user', 'displayName username profilePicture');

    return res.status(201).json({ success: true, post: populatedPost });
  } catch (error) {
    next(error);
  }
};
