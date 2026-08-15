const express = require('express');
const router = express.Router();
const { getAbout, updateAbout } = require('../controllers/aboutController');
const protect = require('../middleware/auth');
const admin = require('../middleware/admin');

router.get('/', getAbout);
router.put('/', protect, admin, updateAbout);

module.exports = router;