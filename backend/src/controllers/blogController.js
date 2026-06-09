import Blog from '../models/Blog.js';
import Saved from '../models/Saved.js';

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

export const createBlog = async (req, res, next) => {
  try {
    const { title, content, coverImage, categories, tags, isFeatured } = req.body;
    const userId = req.user.id;

    let baseSlug = slugify(title);
    let slug = baseSlug;

    let exists = await Blog.findOne({ slug });
    let count = 1;
    while (exists) {
      slug = `${baseSlug}-${count}`;
      exists = await Blog.findOne({ slug });
      count++;
    }

    const blog = await Blog.create({
      title,
      slug,
      content,
      author: userId,
      coverImage,
      categories,
      tags,
      isFeatured
    });

    return res.status(201).json({ success: true, blog });
  } catch (error) {
    next(error);
  }
};

export const getBlogBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOne({ slug }).populate('author', 'displayName username profilePicture');

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog article not found' });
    }

    return res.status(200).json({ success: true, blog });
  } catch (error) {
    next(error);
  }
};

export const listBlogs = async (req, res, next) => {
  try {
    const { category, tag, authorUsername, isFeatured, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};

    if (category) {
      query.categories = category;
    }
    if (tag) {
      query.tags = tag;
    }
    if (isFeatured) {
      query.isFeatured = isFeatured === 'true';
    }
    if (authorUsername) {
      const author = await Blog.db.model('User').findOne({ username: authorUsername });
      if (author) {
        query.author = author._id;
      }
    }

    const blogs = await Blog.find(query)
      .populate('author', 'displayName username profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({ success: true, blogs });
  } catch (error) {
    next(error);
  }
};

export const saveBlog = async (req, res, next) => {
  try {
    const blogId = req.params.id;
    const userId = req.user.id;

    const alreadySaved = await Saved.findOne({ user: userId, item: blogId, itemType: 'Blog' });
    if (alreadySaved) {
      return res.status(400).json({ success: false, message: 'Blog already saved' });
    }

    await Saved.create({ user: userId, item: blogId, itemType: 'Blog' });
    return res.status(200).json({ success: true, message: 'Blog saved successfully' });
  } catch (error) {
    next(error);
  }
};

export const unsaveBlog = async (req, res, next) => {
  try {
    const blogId = req.params.id;
    const userId = req.user.id;

    const savedRecord = await Saved.findOneAndDelete({ user: userId, item: blogId, itemType: 'Blog' });
    if (!savedRecord) {
      return res.status(400).json({ success: false, message: 'Blog was not saved' });
    }

    return res.status(200).json({ success: true, message: 'Blog unsaved successfully' });
  } catch (error) {
    next(error);
  }
};
