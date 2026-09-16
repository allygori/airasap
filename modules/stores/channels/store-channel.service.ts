import { Types } from 'mongoose';
import type { QueryOptions } from '@/lib/api/query-builder';
import { StoreRepository } from '@/modules/stores/store.repository';
import type {
  CreateStoreChannelDTO,
  UpdateStoreChannelDTO,
} from './store-channel.dto';
import { StoreChannelRepository } from './store-channel.repository';

type StoreChannelContext = {
  organizationId: string;
  storeId?: string;
};

export class StoreChannelService {
  private readonly repository: StoreChannelRepository;
  private readonly storeRepository: StoreRepository;

  constructor(context: StoreChannelContext) {
    this.repository = new StoreChannelRepository(context);
    this.storeRepository = new StoreRepository(context);
  }

  getWithPagination(
    query: QueryOptions & {
      store?: string;
      platform?: string;
      is_active?: boolean;
    }
  ) {
    return this.repository.getWithPagination(query, query);
  }

  getById(id: string) {
    return this.repository.findConnectionById(id);
  }

  findActiveForStorePlatform(
    storeId: string,
    platform: string,
    session?: Parameters<
      StoreChannelRepository['findActiveForStorePlatform']
    >[2]
  ) {
    return this.repository.findActiveForStorePlatform(
      storeId,
      platform,
      session
    );
  }

  async create(dto: CreateStoreChannelDTO) {
    const store = await this.validateStore(dto.store);
    return this.repository.createConnection({
      store: store._id,
      platform: dto.platform,
      name: dto.name,
      external_account_id: dto.external_account_id,
      is_active: dto.is_active,
    });
  }

  async update(id: string, dto: UpdateStoreChannelDTO) {
    const current =
      await this.repository.findConnectionById(id);
    if (!current) return null;

    const storeId = dto.store ?? String(current.store._id);
    const store = await this.validateStore(storeId);
    return this.repository.updateConnection(id, {
      store: store._id,
      ...(dto.platform === undefined
        ? {}
        : { platform: dto.platform }),
      ...(dto.name === undefined ? {} : { name: dto.name }),
      ...(dto.external_account_id === undefined
        ? {}
        : { external_account_id: dto.external_account_id }),
      ...(dto.is_active === undefined
        ? {}
        : { is_active: dto.is_active }),
    });
  }

  archive(id: string) {
    return this.repository.archiveConnection(id);
  }

  private async validateStore(storeId: string) {
    if (!Types.ObjectId.isValid(storeId)) {
      throw new Error('Store ID tidak valid.');
    }
    const store =
      await this.storeRepository.findById(storeId);
    if (!store) {
      throw new Error(
        'Store tidak ditemukan pada organization aktif.'
      );
    }
    if (!store.is_active || store.deleted_at) {
      throw new Error('Store harus berstatus aktif.');
    }
    return store;
  }
}
