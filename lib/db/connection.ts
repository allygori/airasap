// import dns from 'node:dns';
// dns.setServers(['8.8.8.8', '8.8.4.4']);

import mongoose from 'mongoose';

// Import all models to ensure they are registered with Mongoose and prevent "Schema hasn't been registered" errors when populating
// import '@/models/user';
// import '@/models/category';
// import '@/models/tag';
// import '@/models/media';
// import '@/models/blog-post';
// import '@/lib/db/schema/users';
// import '@/lib/db/schema/accounts';
// import '@/lib/db/schema/organizations';
// import '@/lib/db/schema/members';
// import '@/lib/db/schema/invitations';
// import '@/lib/db/schema/sessions';
// import '@/lib/db/schema/verifications';
// import '@/lib/db/schema/products';
// import '@/lib/db/schema/stores';

import '@/modules/users/users.model';
import '@/modules/accounts/account.model';
import '@/modules/organizations/organization.model';
import '@/modules/members/member.model';
import '@/modules/invitations/invitations.model';
import '@/modules/sessions/session.model';
import '@/modules/verifications/verifications.model';
import '@/modules/files/file.model';
import '@/modules/stores/store.model';
import '@/modules/products/product.model';
// import '@/modules/product-costs/product-cost.model';
import '@/modules/orders/order.model';
import '@/modules/tools/marketing/profit-intelligence/profit-intelligence.model';
import '@/modules/accounting/accounts/account.model';
import '@/modules/accounting/journal-entries/journal-entry.model';
import '@/modules/accounting/periods/accounting-period.model';
import '@/modules/accounting/opening-balances/opening-balance.model';
import '@/modules/accounting/audit/audit-log.model';
import '@/modules/inventory/items/inventory-item.model';
import '@/modules/inventory/mappings/inventory-item-mapping.model';
import '@/modules/inventory/locations/inventory-location.model';
import '@/modules/inventory/movements/inventory-movement.model';
import '@/modules/expenses/expenses/expense.model';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var mongoose: any; // This is necessary for Next.js hot reloading
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connect() {
  const MONGODB_URI = process.env.MONGODB_URI!;

  if (!MONGODB_URI) {
    throw new Error(
      'Please define the MONGODB_URI environment variable inside .env'
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
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
};

export async function getClient() {
  const MONGODB_URI = process.env.MONGODB_URI!;
  const conn = await connect();

  return conn.connection.getClient().db(MONGODB_URI);
}

export default connect;

export const db = {
  connect,
  check,
  getClient,
};
