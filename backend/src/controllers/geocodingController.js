const geocodingService = require('../services/geocodingService');
const logger = require('../config/logger');

// Geocode address to coordinates
const geocodeAddress = async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address is required',
      });
    }

    const result = await geocodingService.geocodeAddress(address);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Geocode address error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Reverse geocode coordinates to address
const reverseGeocode = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const result = await geocodingService.reverseGeocode(latitude, longitude);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Reverse geocode error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Search addresses
const searchAddresses = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const results = await geocodingService.searchAddresses(query);

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    logger.error('Search addresses error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  geocodeAddress,
  reverseGeocode,
  searchAddresses,
};
