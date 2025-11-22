const express = require('express');
const geocodingController = require('../controllers/geocodingController');

const router = express.Router();

// Geocoding routes
router.post('/geocode', geocodingController.geocodeAddress);
router.post('/reverse-geocode', geocodingController.reverseGeocode);
router.get('/search', geocodingController.searchAddresses);

module.exports = router;
