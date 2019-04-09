const API_HOST = (typeof location !== 'undefined' && '//' + location.host) || 'http://0.0.0.0:8000';
module.exports = {
  API_HOST,
  API_URL: API_HOST,
};
