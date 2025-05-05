//File: backend/utils/tokenUtils.js
const jwt = require('jsonwebtoken');

const crearAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION }); // producción
};

const crearRefreshToken = (payload) => {
  return jwt.sign({ ...payload, type: 'refresh' }, process.env.JWT_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION }); // producción
};

module.exports = {
  crearAccessToken,
  crearRefreshToken
};