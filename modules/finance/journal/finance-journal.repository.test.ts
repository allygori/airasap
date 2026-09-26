import { Types } from 'mongoose';
import { FinanceJournalRepository } from './finance-journal.repository';

class TestFinanceJournalRepository extends FinanceJournalRepository {
  getScopedTenantFields() {
    return this.getTenantFilter();
  }
}

describe('FinanceJournalRepository aggregation tenant scope', () => {
  it('uses an ObjectId organization filter for Mongo aggregation pipelines', () => {
    const organizationId = '6a64d53fb427fb66c352640a';
    const repository = new TestFinanceJournalRepository({
      organizationId,
    });

    expect(repository.getScopedTenantFields()).toEqual({
      organization: new Types.ObjectId(organizationId),
    });
  });
});
