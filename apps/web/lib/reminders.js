import 'server-only';

import { deleteRows, selectRows, upsertRows } from '@/lib/server-data';
import { getCampaignsByIds } from '@/lib/supabase';

export async function getReminder(userId, campaignId) {
  return selectRows('reminder_subscriptions', {
    select: 'id,campaign_id,remind_before_hours',
    user_id: `eq.${userId}`,
    campaign_id: `eq.${campaignId}`,
    is_enabled: 'eq.true',
    limit: '1'
  }).then((rows) => rows[0] || null);
}

export async function upsertReminder(userId, campaignId, remindBeforeHours) {
  const rows = await upsertRows(
    'reminder_subscriptions',
    [{ user_id: userId, campaign_id: campaignId, remind_before_hours: remindBeforeHours, is_enabled: true }],
    'user_id,campaign_id'
  );
  return rows?.[0] || null;
}

export async function deleteReminder(userId, campaignId) {
  return deleteRows('reminder_subscriptions', {
    user_id: `eq.${userId}`,
    campaign_id: `eq.${campaignId}`
  });
}

export async function getReminderItems(userId) {
  const rows = await selectRows('reminder_subscriptions', {
    select: 'id,campaign_id,remind_before_hours',
    user_id: `eq.${userId}`,
    is_enabled: 'eq.true',
    order: 'remind_before_hours.asc',
    limit: '50'
  });
  const campaigns = await getCampaignsByIds(rows.map((row) => row.campaign_id));
  const campaignMap = new Map(campaigns.map((campaign) => [campaign.id, campaign]));
  return rows
    .map((row) => ({ ...row, campaign: campaignMap.get(row.campaign_id) }))
    .filter((row) => row.campaign);
}
