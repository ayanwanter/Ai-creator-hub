# Local Environment Variables for AI Creator Hub

To run the application locally with full-stack functionality, you need to create a `.env` file in the root directory with the following values:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
JWT_SECRET=your-random-secret-key
```

### How to Run:
1. Create your `.env` file as described above.
2. Run: `node server.js`
3. Open `http://localhost:3000` in your browser.
