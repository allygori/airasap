// dns setServers removed to prevent Edge runtime crashes
// if (process.env.NODE_ENV === 'development') {
//   const { setServers } = await import('node:dns');
//   setServers(['8.8.8.8', '8.8.4.4']);
// }

// if (process.env.NODE_ENV === 'development') {
//   (async () => {
//     const { setServers } = await import('node:dns');
//     setServers(['8.8.8.8', '8.8.4.4']);
//   })();
// }

import mongoose from 'mongoose';

import '@/lib/mongoose/schema/tool-marketplace-income-report';



declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var mongoose: any; // This is necessary for Next.js hot reloading
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  const MONGODB_URI = process.env.MONGODB_URI!;

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

const check = async () => {
  // Check if connection already established
  if (mongoose.connections[0].readyState) {
    return true;
  }

  return false;
}


export async function getClient() {
  const MONGODB_URI = process.env.MONGODB_URI!;
  const conn = await dbConnect();

  return conn.connection.getClient().db(MONGODB_URI);
}

export default dbConnect;

export const db = {
  connect: dbConnect,
  check,
  getClient,
}