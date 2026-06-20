// source: https://share.google/aimode/gNSM3Vj89AXNCXb8D

// plugins/workspace.ts
// import {
//   createAuthMiddleware,
//   createAuthEndpoint,
// } from 'better-auth/api';
// import type { BetterAuthPlugin } from 'better-auth';
// import mongoose from 'mongoose';

// export const workspacePlugin = () => {
//   return {
//     id: 'workspace-plugin',
//     endpoints: {
//       // Registers an internal endpoint: /api/auth/workspace/set-active
//       setActiveWorkspace: createAuthEndpoint(
//         '/workspace/set-active',
//         {
//           method: 'POST',
//           use: [createAuthMiddleware()], // Requires an active session
//           body: {
//             organizationId: {
//               type: 'string',
//               required: true,
//             },
//             storeId: { type: 'string', required: true },
//           },
//         },
//         async (ctx) => {
//           const sessionToken = ctx.context.session.token;
//           const { organizationId, storeId } = ctx.body;

//           // Native Mongoose update bypassing the lifecycle hook limitations
//           await mongoose.connection.db
//             .collection('session')
//             .updateOne(
//               { token: sessionToken },
//               {
//                 $set: {
//                   activeOrganizationId: organizationId,
//                   activeStoreId: storeId, // Maps to your customSession schema field
//                 },
//               }
//             );

//           // Force a set-cookie headers update to sync client cookies instantly
//           return ctx.json({ success: true });
//         }
//       ),
//     },
//   } satisfies BetterAuthPlugin;
// };
