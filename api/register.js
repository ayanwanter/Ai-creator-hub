const { auth, db } = require('./lib/firebase-admin');
const bcrypt = require('bcryptjs');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // 1. Create Firebase Auth User
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name || 'Creator',
    });

    // 2. Hash password for secondary storage if needed (though Firebase Auth handles this)
    // Here we mainly follow the user's specific requirement for a users table
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create User Document in Firestore
    const userRef = db.collection('users').doc(userRecord.uid);
    const now = new Date();
    await userRef.set({
      id: userRecord.uid,
      name: name || 'Creator',
      email: email,
      password: hashedPassword, // Storing hashed password in DB as requested
      credits: 5,
      last_credit_reset: now.toISOString(),
      created_at: now.toISOString(),
    });

    return res.status(201).json({ message: 'User registered successfully', uid: userRecord.uid });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
