import fetch from 'isomorphic-fetch';
import config from './config';

export const VALID_API_METHODS = ['get', 'post', 'put', 'delete'];

/**
 * call API using isomorphic-fetch
 * @param   endpoint    API endpoint
 * @param   method      HTTP method
 * @param   data        API request body in JSON format
 * @return  promise
 */
export const callApi = (endpoint, method = 'get', data) => {

  const validateMethod = (method) => (VALID_API_METHODS.indexOf(method.toLowerCase()) !== -1);

  const apiUrl = endpoint.startsWith('http') || endpoint.startsWith('//') ? endpoint : config.API_URL + endpoint;

  const options = {
    method: validateMethod(method) ? method : 'get',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  };

  if (data && method !== 'get') {
    options.body = JSON.stringify(data);
  }

  return fetch(apiUrl, options)
    .then(response =>
      response.json().then(json => ({ json, response }))
    ).then(({ json, response }) => {
      if (!response.ok) {
        return Promise.reject(json);
      }
      return json;
    });

};

/**
 * Perform HTTP Ajax request for file
 * @param   url
 * @param   options
 * @return  promise
 */
export const requestFile = (url, params) => {
  return Promise.resolve(jQuery.get(url, params));
};
