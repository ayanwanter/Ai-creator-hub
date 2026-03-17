const cookie = require('cookie');

module.exports = async (req, res) => {
  res.setHeader('Set-Cookie', cookie.serialize('auth_token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  }));

  return res.status(200).json({ message: 'Logged out successfully' });
};
