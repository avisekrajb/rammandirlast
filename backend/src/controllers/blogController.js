const Blog = require('../models/Blog');
const { notifySubscribers } = require('../services/emailService');

// @desc    Get all blogs
// @route   GET /api/blogs
// @access  Public
exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ published: true })
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      count: blogs.length,
      data: blogs,
    });
  } catch (error) {
    console.error('Get all blogs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get blog by ID
// @route   GET /api/blogs/:id
// @access  Public
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    // Increment views
    blog.views += 1;
    await blog.save();
    res.json({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.error('Get blog error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create blog (admin only)
// @route   POST /api/admin/blogs
// @access  Private/Admin
exports.createBlog = async (req, res) => {
  try {
    const blog = await Blog.create(req.body);

    // Notify email subscribers about the new blog
    try {
      await notifySubscribers({
        type: 'blog',
        title: blog.title?.en || 'New Temple Blog',
        summary: blog.excerpt?.en || '',
        url: `${process.env.FRONTEND_URL || 'http://localhost:4000'}/blogs`,
      });
    } catch (notifyError) {
      console.error('Blog subscriber notification error:', notifyError.message);
    }

    res.status(201).json({
      success: true,
      data: blog,
      message: 'Blog created successfully',
    });
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update blog (admin only)
// @route   PUT /api/admin/blogs/:id
// @access  Private/Admin
exports.updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.json({
      success: true,
      data: blog,
      message: 'Blog updated successfully',
    });
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete blog (admin only)
// @route   DELETE /api/admin/blogs/:id
// @access  Private/Admin
exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findByIdAndDelete(id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.json({
      success: true,
      message: 'Blog deleted successfully',
    });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Toggle blog publish status (admin only)
// @route   PUT /api/admin/blogs/:id/toggle
// @access  Private/Admin
exports.toggleBlogPublish = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    blog.published = !blog.published;
    await blog.save();

    // Notify subscribers when a blog is newly published
    if (blog.published) {
      try {
        await notifySubscribers({
          type: 'blog',
          title: blog.title?.en || 'New Temple Blog',
          summary: blog.excerpt?.en || '',
          url: `${process.env.FRONTEND_URL || 'http://localhost:4000'}/blogs`,
        });
      } catch (notifyError) {
        console.error('Blog publish notification error:', notifyError.message);
      }
    }

    res.json({
      success: true,
      data: blog,
      message: `Blog ${blog.published ? 'published' : 'unpublished'}`,
    });
  } catch (error) {
    console.error('Toggle blog error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};