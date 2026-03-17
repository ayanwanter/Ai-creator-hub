const { db } = require('./lib/firebase-admin');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');

const JWT_SECRET = process.env.JWT_SECRET || 'antigravity-secret-key';

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.auth_token;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userRef = db.collection('users').doc(decoded.uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    let userData = doc.data();
    const now = new Date();
    const lastReset = new Date(userData.last_credit_reset);
    
    // Credit Reset Logic: Check if 24 hours have passed since last reset
    const hoursSinceReset = (now - lastReset) / (1000 * 60 * 60);

    if (hoursSinceReset >= 24) {
      await userRef.update({
        credits: 5,
        last_credit_reset: now.toISOString()
      });
      userData.credits = 5;
    }

    // Don't send password back
    const { password, ...safeUser } = userData;

    return res.status(200).json({ user: safeUser });
  } catch (error) {
    console.error('Get User Error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};
