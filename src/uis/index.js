import { requireAll } from '../libs/utils';

/**
 * Collecting UI controllers
 * NOTE: Schema, template, data are loaded from database
 */

const uis = { };

// require all files in the current directory, except index.js
const arrModules = requireAll(require.context('.', true, /^((?!(index|base)).)*\.js$/));
arrModules.forEach(module => {
  Object.assign(uis, module);
});

module.exports = uis;
