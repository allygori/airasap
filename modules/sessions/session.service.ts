/**
 * Session Service
 * Handles business logic for session operations
 */

import { SessionResponseDTO } from './session.dto';
import { SessionModel } from './session.model';
import { SessionRepository } from './session.repository';

export class SessionService {
  private repository: SessionRepository;

  constructor(tenantContext: {
    // organizationId: string;
    // storeId?: string;
  }) {
    this.repository = new SessionRepository(tenantContext);
  }

  async getLatestSession(
    userId: string
  ): Promise<SessionResponseDTO> {
    try {
      const session =
        await this.repository.findLatestSessionByUserId(
          userId
        );

      if (!session) {
        throw new Error(`Session terakhir tidak ditemukan`);
      }
      return session;
    } catch (error: any) {
      throw new Error(
        `Gagal mencari session terakhir: ${error.message}`
      );
    }
  }

  static async getLatestSession(
    userId: string
  ): Promise<SessionResponseDTO> {
    try {
      const session = SessionModel.findOne({ user: userId })
        .sort({ createdAt: -1 })
        .lean();

      if (!session) {
        throw new Error(`Session terakhir tidak ditemukan`);
      }
      return session;
    } catch (error: any) {
      throw new Error(
        `Gagal mencari session terakhir: ${error.message}`
      );
    }
  }
}
