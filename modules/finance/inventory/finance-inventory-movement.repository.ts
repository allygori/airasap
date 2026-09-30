import {
  Types,
  type ClientSession,
  type PipelineStage,
  type QueryFilter,
} from 'mongoose';
import { escapeRegex } from '@/lib/string';
import { BaseRepository } from '@/modules/base.repository';
import type { FinanceTenantContext } from '../finance.types';
import {
  FINANCE_INVENTORY_INBOUND_MOVEMENT_TYPES,
  FINANCE_INVENTORY_OUTBOUND_MOVEMENT_TYPES,
} from './finance-inventory.constants';
import type {
  FinanceInventoryAdjustmentDirectionDTO,
  FinanceInventoryAdjustmentReasonDTO,
  FinanceInventoryMovementListQueryDTO,
} from './finance-inventory.dto';
import {
  FinanceInventoryMovementModel,
  type TFinanceInventoryMovement,
} from './finance-inventory-movement.model';

export type FinanceInventoryBalancePersistenceRecord = {
  _id: Types.ObjectId;
  inbound_quantity: number;
  outbound_quantity: number;
  inbound_value: number;
  outbound_value: number;
  location_count: number;
  unresolved_movement_count: number;
  missing_cost_movement_count: number;
};

export type FinanceInventoryMovementPersistenceRecord = {
  _id: Types.ObjectId;
  organization: Types.ObjectId;
  inventory_item: Types.ObjectId;
  location: Types.ObjectId;
  movement_type: TFinanceInventoryMovement['movement_type'];
  adjustment_direction?: FinanceInventoryAdjustmentDirectionDTO;
  adjustment_reason?: FinanceInventoryAdjustmentReasonDTO;
  quantity: number;
  unit_cost?: number | null;
  total_cost?: number | null;
  occurred_at: Date;
  source_type?: string;
  source_id?: string;
  offset_account?: Types.ObjectId;
  idempotency_key?: string;
  reference?: string;
  notes?: string;
  status: TFinanceInventoryMovement['status'];
  journal_entry?: Types.ObjectId;
};

export type CreateFinanceInventoryMovementRecord = Omit<
  FinanceInventoryMovementPersistenceRecord,
  '_id' | 'organization'
>;

export type CreatePostedFinanceInventoryMovementRecord =
  Omit<CreateFinanceInventoryMovementRecord, 'status'> & {
    journal_entry?: Types.ObjectId;
  };

export type FinanceInventoryMovementListPersistenceResult =
  {
    records: FinanceInventoryMovementPersistenceRecord[];
    total: number;
  };

export class FinanceInventoryMovementRepository extends BaseRepository<TFinanceInventoryMovement> {
  constructor(context: FinanceTenantContext) {
    super(FinanceInventoryMovementModel, context);
  }

  // Stock is shared by the organization. The active store is only a UI
  // selection and must not hide organization-wide inventory movements.
  protected override getTenantFilter(): QueryFilter<TFinanceInventoryMovement> {
    return {
      organization: new Types.ObjectId(
        this.tenantContext.organizationId
      ),
    } as QueryFilter<TFinanceInventoryMovement>;
  }

  async listMovements(
    filter: FinanceInventoryMovementListQueryDTO
  ): Promise<FinanceInventoryMovementListPersistenceResult> {
    const queryFilter: QueryFilter<TFinanceInventoryMovement> =
      {
        ...this.getTenantFilter(),
        ...(filter.movement_type !== 'all'
          ? { movement_type: filter.movement_type }
          : {}),
        ...(filter.status !== 'all'
          ? { status: filter.status }
          : {}),
      };

    if (filter.search) {
      const search = new RegExp(
        escapeRegex(filter.search),
        'i'
      );
      queryFilter.$or = [
        { reference: search },
        { source_id: search },
        { notes: search },
      ];
    }

    const recordsQuery = this.model
      .find(queryFilter)
      .select(
        '_id organization inventory_item location movement_type adjustment_direction adjustment_reason quantity unit_cost total_cost occurred_at source_type source_id reference notes status journal_entry'
      )
      .sort({ occurred_at: -1, _id: -1 })
      .skip((filter.page - 1) * filter.limit)
      .limit(filter.limit);
    const countQuery =
      this.model.countDocuments(queryFilter);

    const [records, total] = await Promise.all([
      recordsQuery
        .lean<FinanceInventoryMovementPersistenceRecord[]>()
        .exec(),
      countQuery.exec(),
    ]);

    return { records, total };
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
    session?: ClientSession
  ): Promise<FinanceInventoryMovementPersistenceRecord | null> {
    const query = this.model.findOne({
      ...this.getTenantFilter(),
      idempotency_key: idempotencyKey,
    });
    if (session) query.session(session);

    return query
      .lean<FinanceInventoryMovementPersistenceRecord | null>()
      .exec();
  }

  async findMovementById(
    id: string,
    session?: ClientSession
  ): Promise<FinanceInventoryMovementPersistenceRecord | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const query = this.model.findOne({
      ...this.getTenantFilter(),
      _id: new Types.ObjectId(id),
    });
    if (session) query.session(session);

    return query
      .lean<FinanceInventoryMovementPersistenceRecord | null>()
      .exec();
  }

  async listPostedByJournalEntry(
    journalEntryId: string,
    session?: ClientSession
  ): Promise<FinanceInventoryMovementPersistenceRecord[]> {
    if (!Types.ObjectId.isValid(journalEntryId)) return [];

    const query = this.model
      .find({
        ...this.getTenantFilter(),
        journal_entry: new Types.ObjectId(journalEntryId),
        status: 'posted',
      })
      .sort({ _id: 1 });
    if (session) query.session(session);

    return query
      .lean<FinanceInventoryMovementPersistenceRecord[]>()
      .exec();
  }

  async createDraft(
    data: CreateFinanceInventoryMovementRecord,
    session?: ClientSession
  ): Promise<FinanceInventoryMovementPersistenceRecord> {
    const document = new this.model({
      ...data,
      organization: this.tenantContext.organizationId,
      status: 'draft',
    });
    const saved = await document.save(
      session ? { session } : undefined
    );
    return saved.toObject() as unknown as FinanceInventoryMovementPersistenceRecord;
  }

  async createPosted(
    data: CreatePostedFinanceInventoryMovementRecord,
    session?: ClientSession
  ): Promise<FinanceInventoryMovementPersistenceRecord> {
    const document = new this.model({
      ...data,
      organization: this.tenantContext.organizationId,
      status: 'posted',
    });
    const saved = await document.save(
      session ? { session } : undefined
    );
    return saved.toObject() as unknown as FinanceInventoryMovementPersistenceRecord;
  }

  async markPosted(
    id: string,
    journalEntryId?: string,
    costs?: {
      unit_cost?: number | null;
      total_cost?: number | null;
    },
    session?: ClientSession
  ): Promise<FinanceInventoryMovementPersistenceRecord | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const set: Record<string, unknown> = {
      status: 'posted',
      ...(costs?.unit_cost !== undefined
        ? { unit_cost: costs.unit_cost }
        : {}),
      ...(costs?.total_cost !== undefined
        ? { total_cost: costs.total_cost }
        : {}),
    };
    if (journalEntryId) {
      if (!Types.ObjectId.isValid(journalEntryId))
        return null;
      set.journal_entry = new Types.ObjectId(
        journalEntryId
      );
    }

    const query = this.model.findOneAndUpdate(
      {
        ...this.getTenantFilter(),
        _id: new Types.ObjectId(id),
        status: 'draft',
      },
      { $set: set },
      {
        returnDocument: 'after',
        runValidators: true,
        ...(session ? { session } : {}),
      }
    );
    return query
      .lean<FinanceInventoryMovementPersistenceRecord | null>()
      .exec();
  }

  async aggregatePostedBalances(
    itemIds: string[],
    locationId?: string,
    session?: ClientSession
  ): Promise<FinanceInventoryBalancePersistenceRecord[]> {
    const objectIds = itemIds
      .filter((itemId) => Types.ObjectId.isValid(itemId))
      .map((itemId) => new Types.ObjectId(itemId));
    if (objectIds.length === 0) return [];

    const baseFilter: QueryFilter<TFinanceInventoryMovement> =
      {
        ...this.getTenantFilter(),
        inventory_item: { $in: objectIds },
        status: 'posted',
        ...(locationId && Types.ObjectId.isValid(locationId)
          ? { location: new Types.ObjectId(locationId) }
          : {}),
      };

    const inboundTypes = [
      ...FINANCE_INVENTORY_INBOUND_MOVEMENT_TYPES,
    ];
    const outboundTypes = [
      ...FINANCE_INVENTORY_OUTBOUND_MOVEMENT_TYPES,
    ];
    const inboundCondition = {
      $or: [
        { $in: ['$movement_type', inboundTypes] },
        {
          $and: [
            { $eq: ['$movement_type', 'adjustment'] },
            { $eq: ['$adjustment_direction', 'increase'] },
          ],
        },
      ],
    };
    const outboundCondition = {
      $or: [
        { $in: ['$movement_type', outboundTypes] },
        {
          $and: [
            { $eq: ['$movement_type', 'adjustment'] },
            { $eq: ['$adjustment_direction', 'decrease'] },
          ],
        },
      ],
    };
    const classifiedCondition = {
      $or: [inboundCondition, outboundCondition],
    };

    const pipeline: PipelineStage[] = [
      { $match: baseFilter },
      {
        $group: {
          _id: '$inventory_item',
          inbound_quantity: {
            $sum: {
              $cond: [inboundCondition, '$quantity', 0],
            },
          },
          outbound_quantity: {
            $sum: {
              $cond: [outboundCondition, '$quantity', 0],
            },
          },
          inbound_value: {
            $sum: {
              $cond: [
                inboundCondition,
                { $ifNull: ['$total_cost', 0] },
                0,
              ],
            },
          },
          outbound_value: {
            $sum: {
              $cond: [
                outboundCondition,
                { $ifNull: ['$total_cost', 0] },
                0,
              ],
            },
          },
          locations: { $addToSet: '$location' },
          unresolved_movement_count: {
            $sum: {
              $cond: [
                {
                  $not: [classifiedCondition],
                },
                1,
                0,
              ],
            },
          },
          missing_cost_movement_count: {
            $sum: {
              $cond: [
                {
                  $and: [
                    classifiedCondition,
                    {
                      $eq: [
                        { $ifNull: ['$total_cost', null] },
                        null,
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          inbound_quantity: 1,
          outbound_quantity: 1,
          inbound_value: 1,
          outbound_value: 1,
          location_count: { $size: '$locations' },
          unresolved_movement_count: 1,
          missing_cost_movement_count: 1,
        },
      },
    ];

    const aggregate =
      this.model.aggregate<FinanceInventoryBalancePersistenceRecord>(
        pipeline
      );
    if (session) aggregate.session(session);
    return aggregate.exec();
  }

  async getPostedBalance(
    itemId: string,
    locationId: string,
    session?: ClientSession
  ): Promise<FinanceInventoryBalancePersistenceRecord | null> {
    const [balance] = await this.aggregatePostedBalances(
      [itemId],
      locationId,
      session
    );
    return balance ?? null;
  }
}
