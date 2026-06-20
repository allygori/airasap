// source: https://share.google/aimode/gNSM3Vj89AXNCXb8D

// export const workspaceClient = () => ({
//   id: 'workspace-client-plugin',
//   getActions: (client) => ({
//     workspace: {
//       setActive: async (body: {
//         organizationId: string;
//         storeId: string;
//       }) => {
//         // Fires an internal fetch to your server-side custom endpoint
//         return await client.fetch<{ success: boolean }>(
//           '/workspace/set-active',
//           {
//             method: 'POST',
//             body,
//           }
//         );
//       },
//     },
//   }),
// });
