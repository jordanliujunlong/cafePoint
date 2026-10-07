const jwt = require('jsonwebtoken');
const config = require('../config');

function sign(payload, expiresIn) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: expiresIn || '30d' });
}

function verify(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (e) {
    return null;
  }
}

module.exports = { sign, verify };
