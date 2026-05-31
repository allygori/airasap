// import {
//   pgTable,
//   text,
//   timestamp,
// } from 'drizzle-orm/pg-core';
// import { relations } from 'drizzle-orm';
// import { member } from './members';
// import { invitation } from './invitations';
// import { eventType } from './event_types';
// import { booking } from './bookings';
// import { auditLog } from './audit_logs';

// export const organization = pgTable('organizations', {
//   id: text('id').primaryKey(),

//   name: text('name').notNull(),

//   slug: text('slug').unique(),

//   logo: text('logo'),

//   createdAt: timestamp('created_at').notNull(),

//   metadata: text('metadata'),

//   plan: text('plan').default('free'),
// });

// export const organizationRelations = relations(
//   organization,
//   ({ many }) => ({
//     members: many(member),
//     invitations: many(invitation),
//     eventTypes: many(eventType),
//     bookings: many(booking),
//     auditLogs: many(auditLog),
//   })
// );

import { Schema, model, models } from 'mongoose';

const OrganizationSchema = new Schema(
  {
    // better-auth fields
    name: { type: String },
    slug: { type: String, unique: true }, // slugify from username
    logo: { type: String },
    metadata: { type: String },

    // Custom fields
    plan: {
      type: String,
      enum: ['free', 'pro', 'plus', 'enterprise'],
      default: 'free',
    },
    username: { type: String },
    deleted_at: { type: Date }, // soft delete
  },
  {
    timestamps: {
      createdAt: 'created_at', // Use `created_at` to store the created date
      updatedAt: 'updated_at', // and `updated_at` to store the last updated date
    },
  }
);

const Organization =
  models.Organization ||
  model(
    'Organization',
    OrganizationSchema,
    'organizations'
  );

export default Organization;
