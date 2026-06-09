import TravelJournal from '../models/TravelJournal.js';
import Post from '../models/Post.js';

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')         // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-');        // Replace multiple - with single -
};

export const createJournal = async (req, res, next) => {
  try {
    const { title, description, coverImage, isPublic } = req.body;
    const userId = req.user.id;

    let baseSlug = slugify(title);
    let slug = baseSlug;
    
    // Ensure uniqueness
    let exists = await TravelJournal.findOne({ slug });
    let count = 1;
    while (exists) {
      slug = `${baseSlug}-${count}`;
      exists = await TravelJournal.findOne({ slug });
      count++;
    }

    const journal = await TravelJournal.create({
      user: userId,
      title,
      slug,
      description,
      coverImage,
      isPublic
    });

    // Also auto-create a Post in the news feed referencing this journal
    await Post.create({
      user: userId,
      content: `Created a new Travel Journal: ${title}. ${description}`,
      type: 'journal',
      mediaUrls: coverImage ? [coverImage] : [],
      journal: journal._id
    });

    return res.status(201).json({ success: true, journal });
  } catch (error) {
    next(error);
  }
};

export const getJournalBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const journal = await TravelJournal.findOne({ slug }).populate('user', 'displayName username profilePicture');
    
    if (!journal) {
      return res.status(404).json({ success: false, message: 'Journal not found' });
    }

    return res.status(200).json({ success: true, journal });
  } catch (error) {
    next(error);
  }
};

export const getUserJournals = async (req, res, next) => {
  try {
    const { username } = req.params;
    const { id: reqUserId } = req.user;

    const user = await TravelJournal.db.model('User').findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If viewing someone else, show only public journals
    const query = { user: user._id };
    if (user._id.toString() !== reqUserId) {
      query.isPublic = true;
    }

    const journals = await TravelJournal.find(query).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, journals });
  } catch (error) {
    next(error);
  }
};

export const addDayLog = async (req, res, next) => {
  try {
    const { id } = req.params; // Journal ID
    const { day, date, title, description, photos, videos, locations, expenses } = req.body;

    const journal = await TravelJournal.findById(id);
    if (!journal) {
      return res.status(404).json({ success: false, message: 'Journal not found' });
    }

    if (journal.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this journal' });
    }

    journal.timeline.push({
      day,
      date,
      title,
      description,
      photos,
      videos,
      locations,
      expenses
    });

    // Sort timeline by day number
    journal.timeline.sort((a, b) => a.day - b.day);

    await journal.save();
    return res.status(200).json({ success: true, journal });
  } catch (error) {
    next(error);
  }
};

export const updateDayLog = async (req, res, next) => {
  try {
    const { id, logId } = req.params; // Journal ID, Log ID
    const updates = req.body;

    const journal = await TravelJournal.findById(id);
    if (!journal) {
      return res.status(404).json({ success: false, message: 'Journal not found' });
    }

    if (journal.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const log = journal.timeline.id(logId);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Timeline day log not found' });
    }

    // Apply updates
    Object.assign(log, updates);
    
    // Sort timeline just in case the day was changed
    journal.timeline.sort((a, b) => a.day - b.day);

    await journal.save();
    return res.status(200).json({ success: true, journal });
  } catch (error) {
    next(error);
  }
};

export const deleteDayLog = async (req, res, next) => {
  try {
    const { id, logId } = req.params;

    const journal = await TravelJournal.findById(id);
    if (!journal) {
      return res.status(404).json({ success: false, message: 'Journal not found' });
    }

    if (journal.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Mongoose pull subdocument
    journal.timeline.pull({ _id: logId });
    await journal.save();

    return res.status(200).json({ success: true, journal });
  } catch (error) {
    next(error);
  }
};
