const { db } = require('./lib/firebase-admin');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');

const JWT_SECRET = process.env.JWT_SECRET || 'antigravity-secret-key';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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

    const userData = doc.data();

    if (userData.credits <= 0) {
      return res.status(403).json({ error: 'No credits left' });
    }

    // Deduct 1 credit
    const newCredits = userData.credits - 1;
    await userRef.update({ credits: newCredits });

    return res.status(200).json({ success: true, credits: newCredits });
  } catch (error) {
    console.error('Use Credit Error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};
