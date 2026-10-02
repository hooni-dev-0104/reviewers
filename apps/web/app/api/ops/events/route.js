import { getEventReport } from '@/lib/ops-events';
export async function GET(request) {
  const days = Number(new URL(request.url).searchParams.get('days'));
  const report = await getEventReport(days);
  return Response.json(report, { status: report.state === 'unauthorized' ? 401 : 200, headers: { 'Cache-Control': 'no-store' } });
}
