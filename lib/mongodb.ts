import mongoose, { type ConnectOptions } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: ConnectOptions = {
      bufferCommands: false,
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      },
      // Force IPv4 to prevent issues on Windows/certain networks trying to resolve IPv6 first
      family: 4,
      // Useful for Serverless/Next.js environments
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseClient) => {
        return mongooseClient;
      })
      .catch((error) => {
        // Clear cache on failure so the next attempt can retry connecting
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  // ping admin via connection object safely
  if (cached.conn.connection && cached.conn.connection.db) {
    try {
      await cached.conn.connection.db
        .admin()
        .command({ ping: 1 });
    } catch (pingError) {
      console.warn(
        'MongoDB ping failed, but connection might still be active:',
        pingError
      );
    }
  }

  return cached.conn;
}

async function disconnectDatabase() {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}

const shutdownSignals: NodeJS.Signals[] = [
  'SIGINT',
  'SIGTERM',
  'SIGHUP',
];
shutdownSignals.forEach((signal) => {
  process.once(signal, async () => {
    try {
      await disconnectDatabase();
      process.exit(0);
    } catch (error) {
      console.error(
        'Error during MongoDB graceful shutdown:',
        error
      );
      process.exit(1);
    }
  });
});

export { connectToDatabase, disconnectDatabase };
export default connectToDatabase;
