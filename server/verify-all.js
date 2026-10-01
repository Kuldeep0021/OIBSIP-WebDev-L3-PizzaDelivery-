const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const result = await db.collection('users').updateMany({}, { $set: { isEmailVerified: true } });
  console.log(`Verified ${result.modifiedCount} users.`);
  process.exit(0);
});
