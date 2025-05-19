// src/config/config.js
require('ts-node/register'); // Allow running TS code
require('dotenv').config(); 
const config = require('./config.ts').default; // Import the TS config as default export

module.exports = config;
