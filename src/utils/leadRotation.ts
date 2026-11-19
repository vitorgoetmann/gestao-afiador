export function makeLeadQueue<T>(results: T[], limit: number, random = Math.random) {
  const first = results.slice(0, limit);
  const remaining = results.slice(limit);
  for (let i = remaining.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
  }
  return { first, remaining };
}

export function takeLeadBatch<T>(remaining: T[], limit: number) {
  return { places: remaining.slice(0, limit), remaining: remaining.slice(limit) };
}
