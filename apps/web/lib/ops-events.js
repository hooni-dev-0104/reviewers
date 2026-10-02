import 'server-only';
import { isOpsAuthenticated } from '@/lib/ops';
import { rpc } from '@/lib/server-data';
import { reportTotals } from './event-report.js';
export async function getEventReport(days = 7) {
  if (!await isOpsAuthenticated()) return { state: 'unauthorized' };
  if (process.env.AD_EVENTS_ENABLED !== 'true') return { state: 'disabled' };
  try {
    const report = await rpc('ad_event_report', { p_days: days === 30 ? 30 : 7 });
    return { state: 'ready', ...report, totals: reportTotals(report.rows) };
  } catch (error) {
    return { state: /PGRST202|42883|42P01/.test(String(error)) ? 'migration-required' : 'error' };
  }
}
