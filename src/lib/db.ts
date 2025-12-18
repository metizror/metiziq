import mongoose from 'mongoose';

interface MongooseGlobal {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached = (global as any).mongoose as MongooseGlobal | undefined;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI as string;

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  if ((cached as any).conn) {
    return cached?.conn as unknown as typeof mongoose;
  }
  
  if (!(cached as any).promise) {
    (cached as any).promise = mongoose
      .connect(MONGODB_URI, { 
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      })
      .then((mongooseInstance) => {
        console.log('MongoDB connected');
        return mongooseInstance;
      })
      .catch(err => {
        console.error('MongoDB connection error:', err);
        (cached as any).promise = null;
        throw err;
      });
  }
  
  try {
    (cached as any).conn = await (cached as any).promise;
    return (cached as any).conn as unknown as typeof mongoose;
  } catch (error) {
    (cached as any).promise = null;
    throw error;
  }
}