const jwt = require('jsonwebtoken');

/**
 * Generates a signed JWT containing userId and username.
 * username in payload means the protect middleware can use it
 * without an extra DB lookup for lightweight operations.
 */
const generateToken = (userId, username) => {
  return jwt.sign(
    { id: userId, username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = { generateToken };
