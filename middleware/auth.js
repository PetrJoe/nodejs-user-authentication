const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    const accessToken = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

module.exports = auth;
