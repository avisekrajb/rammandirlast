const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const admin = require('../middleware/admin');
const {
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  toggleBlogPublish,
} = require('../controllers/blogController');

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================
router.get('/', getAllBlogs);
router.get('/:id', getBlogById);

// ============================================
// PROTECTED ROUTES (Admin only)
// ============================================
router.post('/', protect, admin, createBlog);
router.put('/:id', protect, admin, updateBlog);
router.delete('/:id', protect, admin, deleteBlog);
router.put('/:id/toggle', protect, admin, toggleBlogPublish);

module.exports = router;