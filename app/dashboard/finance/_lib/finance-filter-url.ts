export function buildFinanceFilterHref(
  pathname: string,
  values: Readonly<Record<string, string>>
) {
  const params = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    const normalizedValue = value.trim();
    if (normalizedValue && normalizedValue !== 'all') {
      params.set(key, normalizedValue);
    }
  });

  const search = params.toString();
  return search ? `${pathname}?${search}` : pathname;
}
