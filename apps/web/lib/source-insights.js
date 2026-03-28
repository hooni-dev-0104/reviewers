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
  const notes = buildGenericNotes(campaign, {});
  if (/페이백|구매가/.test(formatText(campaign.snippet))) {
    uniquePush(notes, campaign.snippet);
  }
  if (!notes.length) {
    uniquePush(notes, '리뷰노트는 포인트/구매가 조건이 함께 붙는 경우가 많아 원문 확인이 중요해요.');
  }
  return notes;
}

function buildGangnamMatzipNotes(campaign) {
  const notes = buildGenericNotes(campaign, {});
  if (/가이드|자세한 상품/.test(formatText(campaign.benefit_text))) {
    uniquePush(notes, '제공 상세는 원문 가이드에서 한 번 더 확인하는 편이 좋아요.');
  }
  if (!notes.length) {
    uniquePush(notes, '강남맛집은 체험권/가이드 조건이 함께 붙는 경우가 많아요.');
  }
  return notes;
}

function buildMrblogNotes(campaign) {
  const notes = buildGenericNotes(campaign, {});
  if (/영수증리뷰|캠페인미션|개인부담|예약/.test(formatText(campaign.benefit_text))) {
    uniquePush(notes, campaign.benefit_text);
  }
  if (!notes.length) {
    uniquePush(notes, '미블은 영수증 리뷰·예약·개인부담 조건이 원문에 길게 붙는 경우가 많아요.');
  }
  return notes;
}

function buildRevuNotes(campaign) {
  const notes = buildGenericNotes(campaign, {});
  if (/콘텐츠|예약|테이크아웃/.test(formatText(campaign.snippet))) {
    uniquePush(notes, campaign.snippet);
  }
  if (!notes.length) {
    uniquePush(notes, '레뷰는 예약 여부, 콘텐츠 개수, 테이크아웃 같은 추가 조건이 원문에 붙는 경우가 있어요.');
  }
  return notes;
}

function buildFourBlogNotes(campaign) {
  const notes = buildGenericNotes(campaign, {});
  if (/키워드|#/.test(formatText(campaign.snippet))) {
    uniquePush(notes, campaign.snippet);
  }
  if (!notes.length) {
    uniquePush(notes, '포블로그는 제공내역과 키워드가 함께 내려오는 편이라 원문 키워드를 같이 보는 게 좋아요.');
  }
  return notes;
}

function buildDinnerqueenNotes(campaign) {
  const notes = buildGenericNotes(campaign, {});
  if (/\[랜덤픽\]/.test(formatText(campaign.title))) {
    uniquePush(notes, '랜덤픽 캠페인은 일반 체험단보다 별도 미션/선정 조건을 확인해야 해요.');
  }
  if (!notes.length) {
    uniquePush(notes, '디너의여왕은 제공내역 아래 추가금액·참여조건 공지가 함께 붙는 경우가 많아요.');
  }
  return notes;
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
