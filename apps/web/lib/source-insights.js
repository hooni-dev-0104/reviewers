import { formatText } from '@/lib/format';

function uniquePush(items, value) {
  const text = formatText(value);
  if (!text) {
    return;
  }
  if (!items.includes(text)) {
    items.push(text);
  }
}

function addKeywordNote(items, text, pattern, formatter = (value) => value) {
  const normalized = formatText(text);
  if (!normalized) {
    return;
  }
  const match = normalized.match(pattern);
  if (match?.[1]) {
    uniquePush(items, formatter(match[1]));
  }
}

function buildGenericNotes(campaign, rawPayload) {
  const notes = [];
  if (campaign.campaign_type === 'visit' && campaign.exact_location) {
    uniquePush(notes, `방문 위치: ${campaign.exact_location}`);
  }
  if (campaign.snippet && campaign.snippet !== campaign.benefit_text && campaign.snippet !== campaign.title) {
    uniquePush(notes, campaign.snippet);
  }
  if (rawPayload?.site_url) {
    uniquePush(notes, '원문 상품/매장 링크가 따로 제공돼요.');
  }
  if (rawPayload?.product_link) {
    uniquePush(notes, '상품 링크가 원문에 함께 제공돼요.');
  }
  return notes;
}

function buildRingbleNotes(campaign, rawPayload) {
  const notes = buildGenericNotes(campaign, rawPayload);
  const missionText = formatText(rawPayload?.mission_excerpt);

  addKeywordNote(notes, missionText, /(평일,?\s*주말[^.]*방문가능)/, (value) => `방문 가능 시간: ${value}`);
  addKeywordNote(notes, missionText, /(최대\s*\d+인[^. ]*)/, (value) => `인원 조건: ${value}`);
  addKeywordNote(notes, missionText, /(예약[^.]*필수[^.]*)/, (value) => `예약 조건: ${value}`);
  if (/초과비용|추가금액|본인 부담/.test(missionText)) {
    uniquePush(notes, '추가금액/초과비용은 본인 부담일 수 있어요.');
  }
  addKeywordNote(notes, missionText, /(필수 키워드[^.]*|키워드[^.]*넣어주세요[^.]*)/, (value) => value);
  return notes;
}

function buildModanNotes(campaign, rawPayload) {
  const notes = buildGenericNotes(campaign, rawPayload);
  const detailText = formatText(rawPayload?.detail_excerpt);

  addKeywordNote(notes, detailText, /신청조건\s*[:：]?\s*([^:：]+?)(?=\s+(?:주소|키워드|방문일|모집))/);
  addKeywordNote(notes, detailText, /방문일\s*[:：]?\s*([^:：]+?)(?=\s+(?:주소|키워드|모집|체험))/);
  addKeywordNote(notes, detailText, /체험 방식\s*[:：]?\s*([^:：]+?)(?=\s+(?:주소|키워드|모집))/);
  return notes;
}

function buildChehumviewNotes(campaign, rawPayload) {
  const notes = buildGenericNotes(campaign, rawPayload);
  if (rawPayload?.search_keyword) {
    uniquePush(notes, `검색 키워드: ${rawPayload.search_keyword}`);
  }
  if (rawPayload?.hashtags) {
    uniquePush(notes, `해시태그: ${formatText(String(rawPayload.hashtags).replaceAll(',', ', '))}`);
  }
  return notes;
}

function buildReviewplaceNotes(campaign, rawPayload) {
  const notes = buildGenericNotes(campaign, rawPayload);
  if (campaign.exact_location) {
    uniquePush(notes, `방문 주소: ${campaign.exact_location}`);
  }
  return notes;
}

function buildSeoulOppaNotes(campaign, rawPayload) {
  const notes = buildGenericNotes(campaign, rawPayload);
  if (rawPayload?.site_url) {
    uniquePush(notes, '원문에서 별도 사이트 URL이 제공돼요.');
  }
  return notes;
}

function buildReviewnoteNotes(campaign) {
  return buildGenericNotes(campaign, {});
}

function buildGangnamMatzipNotes(campaign) {
  return buildGenericNotes(campaign, {});
}

function buildMrblogNotes(campaign) {
  const notes = buildGenericNotes(campaign, {});
  if (/영수증리뷰|캠페인미션|개인부담|예약/.test(formatText(campaign.benefit_text))) {
    uniquePush(notes, campaign.benefit_text);
  }
  return notes;
}

function buildRevuNotes(campaign) {
  return buildGenericNotes(campaign, {});
}

function buildFourBlogNotes(campaign) {
  return buildGenericNotes(campaign, {});
}

function buildDinnerqueenNotes(campaign) {
  return buildGenericNotes(campaign, {});
}

export function buildSourceInsights(campaign, rawPayload) {
  const sourceSlug = campaign?.sources?.slug || '';
  const sourceName = campaign?.sources?.name || '원문';

  const bySource = {
    ringble: buildRingbleNotes,
    modan: buildModanNotes,
    chehumview: buildChehumviewNotes,
    reviewplace: buildReviewplaceNotes,
    seouloppa: buildSeoulOppaNotes,
    reviewnote: buildReviewnoteNotes,
    gangnammatzip: buildGangnamMatzipNotes,
    mrblog: buildMrblogNotes,
    revu: buildRevuNotes,
    '4blog': buildFourBlogNotes,
    dinnerqueen: buildDinnerqueenNotes
  };

  const builder = bySource[sourceSlug];
  const items = builder ? builder(campaign, rawPayload || {}) : buildGenericNotes(campaign, rawPayload || {});
  const filtered = items.filter(Boolean).slice(0, 4);
  if (!filtered.length) {
    return null;
  }

  return {
    title: `${sourceName} 참여 전 확인사항`,
    items: filtered
  };
}
