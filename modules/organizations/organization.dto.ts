import { z } from 'zod';
import {
  OrganizationBaseSchema,
  OrganizationResponseSchema,
  OrganizationSchema,
} from './organization.schema';

export * from './organization.schema';

export type OrganizationBaseDTO = z.infer<
  typeof OrganizationBaseSchema
>;
export type OrganizationDTO = z.infer<
  typeof OrganizationSchema
>;
export type OrganizationResponseDTO = z.infer<
  typeof OrganizationResponseSchema
>;
