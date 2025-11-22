const express = require('express');
const contactController = require('../controllers/contactController');
const { validateContactUs } = require('../middlewares/validation');
const { generalRateLimitMiddleware } = require('../middlewares/security');

const router = express.Router();

// Contact us route (public)
router.post('/', generalRateLimitMiddleware, validateContactUs, contactController.contactUs);

module.exports = router;
