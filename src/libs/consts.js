import globalConsts from 'global_consts.json';

module.exports = Object.assign({
  API_NOT_LOADED: 'API_NOT_LOADED',
  API_LOADING: 'API_LOADING',
  API_LOADED_SUCCESS: 'API_LOADED_SUCCESS',
  API_LOADED_ERROR: 'API_LOADED_ERROR',

  S3BUCKET_URL: 'https://s3.amazonaws.com/mpxdata/eqn_images/',
}, globalConsts);
