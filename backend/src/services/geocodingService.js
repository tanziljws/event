const axios = require('axios');
const logger = require('../config/logger');

// Nominatim API base URL (OpenStreetMap geocoding service)
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

/**
 * Convert address to coordinates using Nominatim API
 * @param {string} address - Address to geocode
 * @returns {Promise<{latitude: number, longitude: number, address: string}>}
 */
const geocodeAddress = async (address) => {
  try {
    if (!address || address.trim() === '') {
      throw new Error('Address is required');
    }

    const response = await axios.get(`${NOMINATIM_BASE_URL}/search`, {
      params: {
        q: address,
        format: 'json',
        limit: 1,
        countrycodes: 'id', // Limit to Indonesia
        addressdetails: 1,
      },
      headers: {
        'User-Agent': 'EventManagementApp/1.0',
      },
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('Address not found');
    }

    const result = response.data[0];
    
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      address: result.display_name,
      city: result.address?.city || result.address?.town || result.address?.village,
      province: result.address?.state,
      country: result.address?.country,
      postalCode: result.address?.postcode,
    };
  } catch (error) {
    logger.error('Geocoding error:', error);
    throw new Error(`Failed to geocode address: ${error.message}`);
  }
};

/**
 * Convert coordinates to address using Nominatim API (reverse geocoding)
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<{address: string, city: string, province: string, country: string}>}
 */
const reverseGeocode = async (latitude, longitude) => {
  try {
    if (!latitude || !longitude) {
      throw new Error('Latitude and longitude are required');
    }

    const response = await axios.get(`${NOMINATIM_BASE_URL}/reverse`, {
      params: {
        lat: latitude,
        lon: longitude,
        format: 'json',
        addressdetails: 1,
      },
      headers: {
        'User-Agent': 'EventManagementApp/1.0',
      },
    });

    if (!response.data || !response.data.display_name) {
      throw new Error('Address not found for coordinates');
    }

    const result = response.data;
    
    return {
      address: result.display_name,
      city: result.address?.city || result.address?.town || result.address?.village,
      province: result.address?.state,
      country: result.address?.country,
      postalCode: result.address?.postcode,
    };
  } catch (error) {
    logger.error('Reverse geocoding error:', error);
    throw new Error(`Failed to reverse geocode coordinates: ${error.message}`);
  }
};

/**
 * Search for addresses using Nominatim API
 * @param {string} query - Search query
 * @returns {Promise<Array<{address: string, latitude: number, longitude: number}>>}
 */
const searchAddresses = async (query) => {
  try {
    if (!query || query.trim() === '') {
      return [];
    }

    const response = await axios.get(`${NOMINATIM_BASE_URL}/search`, {
      params: {
        q: query,
        format: 'json',
        limit: 5,
        countrycodes: 'id', // Limit to Indonesia
        addressdetails: 1,
      },
      headers: {
        'User-Agent': 'EventManagementApp/1.0',
      },
    });

    if (!response.data || response.data.length === 0) {
      return [];
    }

    return response.data.map(result => ({
      address: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      city: result.address?.city || result.address?.town || result.address?.village,
      province: result.address?.state,
      country: result.address?.country,
      postalCode: result.address?.postcode,
    }));
  } catch (error) {
    logger.error('Address search error:', error);
    throw new Error(`Failed to search addresses: ${error.message}`);
  }
};

module.exports = {
  geocodeAddress,
  reverseGeocode,
  searchAddresses,
};
