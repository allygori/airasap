/**
 * Organization Service
 * Handles business logic for organization operations
 */

import { OrganizationResponseDTO } from './organization.dto';
import { OrganizationModel } from './organization.model';
import { OrganizationRepository } from './organization.repository';

export class OrganizationService {
  private repository: OrganizationRepository;

  constructor(tenantContext: {
    organizationId: string;
    storeId?: string;
  }) {
    this.repository = new OrganizationRepository(
      tenantContext
    );
  }

  static async getOneByUserId(userId: string) {
    try {
      const session = OrganizationModel.findOne({
        user: userId,
      })
        .sort({ createdAt: -1 })
        .lean();

      if (!session) {
        throw new Error(`Organisasi tidak ditemukan`);
      }
      return session;
    } catch (error: any) {
      throw new Error(
        `Gagal mencari organisasi: ${error.message}`
      );
    }
  }
}
