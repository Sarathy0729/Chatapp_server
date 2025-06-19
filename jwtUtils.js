const jwt = require('jsonwebtoken');

const generateToken = (payload) => {
  const secretKey = '0123'; 
  const options = {
    expiresIn: '60h', 
  };

  const token = jwt.sign(payload, secretKey, options);
  return token;
};

module.exports = {
  generateToken,
};