import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  const isProd = process.env.NODE_ENV === 'production';

  // In production: require a real MongoDB URI — no in-memory fallback
  if (isProd) {
    if (!uri || uri.includes('localhost')) {
      throw new Error(
        '❌ MONGO_URI must be set to a real MongoDB connection string in production (e.g. MongoDB Atlas). ' +
        'Do NOT use localhost in production.'
      );
    }
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
    return;
  }

  // In development: try real MongoDB first, fall back to embedded MongoMemoryServer
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
  } catch (realErr) {
    console.warn('⚠️  Real MongoDB unavailable — starting embedded MongoMemoryServer...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memUri = mongod.getUri();
      await mongoose.connect(memUri);
      console.log('✅ MongoDB (in-memory) connected');
      console.log('   ⚠️  Data will be lost on restart. Install MongoDB for persistence.');
    } catch (memErr) {
      console.error('❌ Failed to start embedded MongoDB:', memErr.message);
      throw memErr;
    }
  }
}

