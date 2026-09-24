import { buildFinanceFilterHref } from './finance-filter-url';

describe('buildFinanceFilterHref', () => {
  it('omits empty and all-option filters', () => {
    expect(
      buildFinanceFilterHref('/dashboard/finance/sales', {
        search: '   ',
        status: 'all',
        posting_mode: 'manual',
      })
    ).toBe('/dashboard/finance/sales?posting_mode=manual');
  });

  it('encodes active filter values and preserves the route', () => {
    expect(
      buildFinanceFilterHref(
        '/dashboard/finance/accounting/general-journal',
        { search: 'order #12', period: '2026-09' }
      )
    ).toBe(
      '/dashboard/finance/accounting/general-journal?search=order+%2312&period=2026-09'
    );
  });
});
