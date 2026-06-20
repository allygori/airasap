// plugins/store.ts
import { z } from 'zod';
import {
  createAuthEndpoint,
  sessionMiddleware,
} from 'better-auth/api';
import { type BetterAuthPlugin } from 'better-auth';
import { APIError } from 'better-auth/api';
// import { ObjectId } from 'mongodb';

// import mongoose from 'mongoose';
// import { SessionModel } from '@/modules/sessions/session.model';
// import { PLATFORMS } from '@/modules/constant';
// import { db } from '@/lib/db/connection';

export const storePlugin = () => {
  return {
    id: 'store-plugin',
    schema: {
      store: {
        modelName: 'stores',
        fields: {
          organization: {
            type: 'string',
            required: true,
            references: {
              model: 'organization',
              field: 'id',
            },
          },
          platform: {
            type: 'string',
            required: true,
          },
          name: {
            type: 'string',
            required: true,
          },
          is_active: {
            type: 'boolean',
            required: false,
          },
          // deleted_at: {
          //   type: Date,
          //   alias: 'deletedAt',
          // },
        },
      },
      session: {
        fields: {
          activeStoreId: {
            type: 'string',
            required: false,
            fieldName: 'active_store',
            references: {
              model: 'store',
              field: 'id',
            },
          },
        },
      },
    },
    endpoints: {
      // Registers an internal endpoint: /api/auth/store/set-active
      setActive: createAuthEndpoint(
        '/store/set-active',
        {
          method: 'POST',
          use: [sessionMiddleware],
          body: z.object({
            organizationId: z.string(),
            storeId: z.string().optional().nullable(),
          }),
          // body: {
          //   organizationId: {
          //     type: 'string',
          //     required: true,
          //   },
          //   storeId: { type: 'string', required: true },
          // },
        },
        async (ctx) => {
          // ctx.context.db

          let activeStoreId;
          const sessionToken =
            ctx.context.session.session.token;
          const { organizationId, storeId } = ctx.body;

          if (!sessionToken) {
            // return ctx.json(
            //   { error: '[storePlugin] Unauthorized' },
            //   { status: 401 }
            // );
            return ctx.json({
              success: false,
              error: '[storePlugin] Unauthorized',
            });
          }

          activeStoreId = storeId;

          if (!activeStoreId) {
            // if (!ObjectId.isValid(organizationId)) {
            //   throw new APIError('BAD_REQUEST', {
            //     message: 'Invalid organizationId',
            //   });
            // }

            const stores =
              await ctx.context.adapter.findMany({
                model: 'store',
                where: [
                  {
                    field: 'organization',
                    operator: 'eq',
                    value: organizationId,
                  },
                  {
                    field: 'is_active',
                    operator: 'eq',
                    value: true,
                  },
                ],
                limit: 1,
              });

            activeStoreId = (stores[0] as { id?: string })
              ?.id;
          }

          if (!activeStoreId) {
            // return ctx.json(
            //   {
            //     error:
            //       '[storePlugin] Failed to get activeStoreId',
            //   },
            //   { status: 400 }
            // );
            throw new APIError('BAD_REQUEST', {
              message: 'Failed to get activeStoreId',
            });

            // return ctx.json({
            //   success: false,
            //   error: '[storePlugin] Unauthorized',
            // });
          }

          const updatedDoc =
            await ctx.context.adapter.update({
              model: 'session',
              where: [
                { field: 'token', value: sessionToken },
              ],
              update: {
                activeOrganizationId: organizationId,
                // active_store: activeStoreId,
                activeStoreId: activeStoreId,
              },
            });

          if (!updatedDoc) {
            // return ctx.json(
            //   {
            //     error:
            //       'Activity not found or unverified access',
            //   },
            //   { status: 404 }
            // );

            // return ctx.json({
            //   success: false,
            //   error:
            //     '[storePlugin] Failed to update session',
            // });

            throw new APIError('BAD_REQUEST', {
              message: 'Failed to update session',
            });
          }

          return ctx.json({
            success: true,
            data: updatedDoc,
          });

          // await db.connect();

          // await SessionModel.updateOne(
          //   { token: sessionToken },
          //   {
          //     $set: {
          //       activeOrganizationId: organizationId,
          //       activeStoreId: storeId, // Maps to your customSession schema field
          //     },
          //   }
          // );

          // // Native Mongoose update bypassing the lifecycle hook limitations
          // await mongoose.connection.db
          //   .collection('session')
          //   .updateOne(
          //     { token: sessionToken },
          //     {
          //       $set: {
          //         activeOrganizationId: organizationId,
          //         activeStoreId: storeId, // Maps to your customSession schema field
          //       },
          //     }
          //   );

          // Force a set-cookie headers update to sync client cookies instantly
          // return ctx.json({ success: true });
        }
      ),
      // // Registers an internal endpoint: /api/auth/store
      // list: createAuthEndpoint(
      //   '/store',
      //   {
      //     method: 'GET',
      //     use: [sessionMiddleware], // Requires an active session
      //   },
      //   async (ctx) => {
      //     const userId =
      //       ctx.context.session.session.userId;
      //     // const { organizationId, storeId } = ctx.body;

      //     if (!userId) {
      //       return ctx.json(
      //         { error: '[storePlugin] Unauthorized' },
      //         { status: 401 }
      //       );
      //     }

      //     const stores = await ctx.context.adapter.findOne({
      //       model: 'sessions',
      //       where: [
      //         { field: 'organization', value: }
      //       ]
      //     })

      //     const updatedDoc =
      //       await ctx.context.adapter.update({
      //         model: 'stores',
      //         where: [
      //           { field: 'token', value: sessionToken },
      //         ],
      //         update: {
      //           activeOrganizationId: organizationId,
      //           activeStoreId: storeId,
      //         },
      //       });

      //     if (!updatedDoc) {
      //       return ctx.json(
      //         {
      //           error:
      //             'Activity not found or unverified access',
      //         },
      //         { status: 404 }
      //       );
      //     }

      //     return ctx.json({
      //       success: true,
      //       data: updatedDoc,
      //     });
      //   }
      // ),
    },
  } satisfies BetterAuthPlugin;
};
