import type { ClientSession } from 'mongoose';
import { BaseRepository } from '../../base.repository';
import {
  InventoryMovementModel,
  type TInventoryMovement,
} from './inventory-movement.model';
import type { AccountingTenantContext } from '@/modules/accounting/accounting.types';

const INBOUND_MOVEMENT_TYPES = new Set([
  'purchase',
  'return',
  'transfer_in',
]);

export class InventoryMovementRepository extends BaseRepository<TInventoryMovement> {
  constructor(context: AccountingTenantContext) {
    super(InventoryMovementModel, context);
  }

  protected override getTenantFilter() {
    // A movement's workspace is source data, not the active UI scope. Keep
    // repository reads organization-scoped until an explicit store filter is
    // added to the inventory explorer in Phase 7C.
    return {
      organization: this.tenantContext.organizationId,
    };
  }

  async findMovementById(
    id: string,
    session?: ClientSession
  ) {
    const query = this.model.findOne({
      ...this.getTenantFilter(),
      _id: id,
    });
    if (session) query.session(session);
    return query.lean();
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
    session?: ClientSession
  ) {
    const query = this.model.findOne({
      ...this.getTenantFilter(),
      idempotency_key: idempotencyKey,
    });
    if (session) query.session(session);
    return query.lean();
  }

  async createMovement(
    data: Record<string, unknown>,
    session?: ClientSession
  ) {
    const document = new this.model({
      ...data,
      organization: this.tenantContext.organizationId,
    });
    return document.save(session ? { session } : undefined);
  }

  async markPosted(
    id: string,
    journalEntryId: string,
    costs?: {
      unit_cost?: number;
      total_cost?: number;
    },
    session?: ClientSession
  ) {
    const query = this.model.findOneAndUpdate(
      {
        ...this.getTenantFilter(),
        _id: id,
        status: 'draft',
      },
      {
        $set: {
          status: 'posted',
          journal_entry: journalEntryId,
          ...(costs?.unit_cost !== undefined
            ? { unit_cost: costs.unit_cost }
            : {}),
          ...(costs?.total_cost !== undefined
            ? { total_cost: costs.total_cost }
            : {}),
        },
      },
      {
        new: true,
        runValidators: true,
        ...(session ? { session } : {}),
      }
    );
    return query.lean();
  }

  async getPostedBalance(
    inventoryItemId: string,
    locationId: string,
    session?: ClientSession
  ) {
    const query = this.model
      .find({
        ...this.getTenantFilter(),
        inventory_item: inventoryItemId,
        location: locationId,
        status: 'posted',
      })
      .select('movement_type quantity total_cost');
    if (session) query.session(session);

    const movements = await query.lean();
    return movements.reduce(
      (balance, movement) => {
        const sign = INBOUND_MOVEMENT_TYPES.has(
          movement.movement_type
        )
          ? 1
          : -1;
        return {
          quantity:
            balance.quantity + sign * movement.quantity,
          value:
            balance.value +
            sign * (movement.total_cost ?? 0),
        };
      },
      { quantity: 0, value: 0 }
    );
  }
}
