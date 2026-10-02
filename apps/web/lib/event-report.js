export function reportTotals(rows) {
  const totals = rows.reduce((sum, row) => ({ impressions: sum.impressions + Number(row.impressions || 0), clicks: sum.clicks + Number(row.clicks || 0), outbound: sum.outbound + Number(row.outbound || 0) }), { impressions: 0, clicks: 0, outbound: 0 });
  return { ...totals, ctr: totals.impressions ? totals.clicks / totals.impressions * 100 : null };
}
