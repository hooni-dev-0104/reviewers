import 'server-only';

import { cookies } from 'next/headers';

import { countRows, selectRows } from '@/lib/server-data';
import { isValidOpsCookie } from '@/lib/auth';

const OPS_COOKIE = 'rv_ops';

function getKstToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

export async function isOpsAuthenticated() {
  const cookieStore = await cookies();
  return isValidOpsCookie(cookieStore.get(OPS_COOKIE)?.value || '');
}

export async function getOpsSnapshot() {
  const [
    activeCampaigns,
    visitorsToday,
    visitorsTotal,
    userCount,
    savedCount,
    reminderCount,
    errorCount,
    recentJobs,
    sources,
    sponsors
  ] = await Promise.all([
    countRows('campaigns', { status: 'eq.active' }),
    countRows('site_daily_visitors', { visit_date: `eq.${getKstToday()}` }),
    countRows('site_daily_visitors'),
    countRows('app_users'),
    countRows('user_saved_campaigns'),
    countRows('reminder_subscriptions', { is_enabled: 'eq.true' }),
    countRows('crawl_errors'),
    selectRows('crawl_jobs', { select: 'id,job_status,fetched_count,inserted_count,failed_count,created_at,source_id', order: 'created_at.desc', limit: '8' }),
    selectRows('sources', { select: 'slug,name', is_active: 'eq.true', order: 'priority.asc' }),
    selectRows('sponsor_slots', { select: 'id,slot_key,title,is_active,priority', order: 'priority.asc', limit: '10' })
  ]);

  return { activeCampaigns, visitorsToday, visitorsTotal, userCount, savedCount, reminderCount, errorCount, recentJobs, sources, sponsors };
}
