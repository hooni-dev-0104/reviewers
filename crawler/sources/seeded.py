from __future__ import annotations

from datetime import date, timedelta
import html as html_lib
from pathlib import Path
import re
from urllib.parse import parse_qs, quote, urlencode, unquote, urljoin, urlsplit

from crawler.models import SourceDefinition
from crawler.sources.base import (
    FileSourceAdapter,
    PlaceholderSourceAdapter,
    fetch_json_url,
    fetch_json_with_headers,
    fetch_session_json,
    fetch_text_url,
    post_form_for_text,
    post_json_with_headers,
)


SEEDED_SOURCES: dict[str, SourceDefinition] = {
    "reviewnote": SourceDefinition("reviewnote", "리뷰노트", "https://www.reviewnote.co.kr", "mixed", "dynamic"),
    "revu": SourceDefinition("revu", "레뷰", "https://www.revu.net", "mixed", "dynamic"),
    "dinnerqueen": SourceDefinition("dinnerqueen", "디너의여왕", "https://dinnerqueen.net", "mixed", "static"),
    "mrblog": SourceDefinition("mrblog", "미블", "https://www.mrblog.net", "mixed", "dynamic"),
    "4blog": SourceDefinition("4blog", "포블로그", "https://4blog.net", "blog", "static"),
    "seouloppa": SourceDefinition("seouloppa", "서울오빠", "https://www.seoulouba.co.kr", "mixed", "static"),
    "gangnammatzip": SourceDefinition("gangnammatzip", "강남맛집", "https://xn--939au0g4vj8sq.net", "mixed", "static"),
}

FOUR_BLOG_PLATFORM_MAP = {
    "blog": "blog",
    "instar21": "instagram",
    "reels": "instagram",
    "youtube21": "youtube",
    "shorts": "youtube",
    "tiktok": "tiktok",
    "threads": "etc",
    "etc": "etc",
}

FOUR_BLOG_CATEGORY1_TO_TYPE = {
    "local": "visit",
    "deliv": "delivery",
    "reporter": "content",
}

FOUR_BLOG_LOCATION_PREFIXES = (
    "서울",
    "경기",
    "인천",
    "부산",
    "대구",
    "대전",
    "광주",
    "울산",
    "세종",
    "강원",
    "충북",
    "충남",
    "전북",
    "전남",
    "경북",
    "경남",
    "제주",
)

DINNERQUEEN_CATEGORY_MAP = {
    "배달": "delivery",
    "방문": "visit",
}

DINNERQUEEN_PLATFORM_MAP = {
    "클립": "instagram",
    "릴스": "instagram",
    "인스타": "instagram",
    "유튜브": "youtube",
}

REVIEWNOTE_TYPE_MAP = {
    "방문형": "visit",
    "배송형": "delivery",
    "구매형": "purchase",
}

REVIEWNOTE_PLATFORM_MAP = {
    "blog": "blog",
    "instagram": "instagram",
    "youtube": "youtube",
}

MRBLOG_PLATFORM_MAP = {
    "blog": "blog",
    "insta": "instagram",
    "instagram": "instagram",
    "reels": "instagram",
    "youtube": "youtube",
}

REVU_MEDIA_MAP = {
    "blog": "blog",
    "instagram": "instagram",
    "youtube": "youtube",
    "clip": "instagram",
}




SEOULOUPPA_PLATFORM_MAP = {
    "thum_ch_blog.png": "blog",
    "thum_ch_shop.png": "purchase",
    "thum_ch_store.png": "purchase",
    "thum_ch_insta.png": "instagram",
    "thum_ch_youtube.png": "youtube",
}

SEOULOUPPA_TYPE_MAP = {
    "배송형": "delivery",
    "구매평": "purchase",
    "기자단": "content",
    "서비스": "content",
    "방문형": "visit",
}

SEOULOUPPA_LISTING_URLS = (
    "https://www.seoulouba.co.kr/campaign/?qq=popular",
    "https://www.seoulouba.co.kr/campaign/?cat=377",
    "https://www.seoulouba.co.kr/campaign/?cat=378",
    "https://www.seoulouba.co.kr/campaign/?cat=379",
    "https://www.seoulouba.co.kr/campaign/?cat=380",
    "https://www.seoulouba.co.kr/campaign/?cat=381",
    "https://www.seoulouba.co.kr/campaign/?cat=382",
    "https://www.seoulouba.co.kr/campaign/?cat=383",
    "https://www.seoulouba.co.kr/campaign/?cat=384",
    "https://www.seoulouba.co.kr/campaign/?cat=385",
    "https://www.seoulouba.co.kr/campaign/?cat=386",
    "https://www.seoulouba.co.kr/campaign/?cat=387",
    "https://www.seoulouba.co.kr/campaign/?cat=388",
    "https://www.seoulouba.co.kr/campaign/?cat=389",
    "https://www.seoulouba.co.kr/campaign/?cat=390",
    "https://www.seoulouba.co.kr/campaign/?cat=391",
    "https://www.seoulouba.co.kr/campaign/?cat=446",
    "https://www.seoulouba.co.kr/campaign/?cat=447",
    "https://www.seoulouba.co.kr/campaign/?cat=448",
    "https://www.seoulouba.co.kr/campaign/?cat=449",
    "https://www.seoulouba.co.kr/campaign/?cat=450",
    "https://www.seoulouba.co.kr/campaign/?cat=505",
    "https://www.seoulouba.co.kr/campaign/?cat=506",
    "https://www.seoulouba.co.kr/campaign/?cat=507",
    "https://www.seoulouba.co.kr/campaign/?cat=508",
    "https://www.seoulouba.co.kr/campaign/?cat=510",
)

GANGNAMMATZIP_TYPE_MAP = {
    "배송형": "delivery",
    "기자단": "content",
    "방문형": "visit",
    "구매평": "purchase",
    "클립": "instagram",
}

SEOULOUPPA_TITLE_TAGS = {"배송형", "구매평", "기자단", "방문형", "클립"}

def list_seeded_sources() -> list[SourceDefinition]:
    return [SEEDED_SOURCES[key] for key in sorted(SEEDED_SOURCES.keys())]


def _normalize_4blog_date(mmdd: str | None) -> str | None:
    if not mmdd or "." not in mmdd:
        return None
    month_str, day_str = mmdd.split(".", 1)
    month = int(month_str)
    day = int(day_str)
    today = date.today()
    year = today.year
    if month < today.month - 6:
        year += 1
    return date(year, month, day).isoformat()


def _clean_4blog_location(raw: str | None) -> tuple[str | None, str | None]:
    if not raw:
        return None, None
    value = raw.strip()
    if value.startswith("[") and value.endswith("]"):
        return None, None
    if " " in value:
        first, second = value.split(" ", 1)
        return first.strip() or None, second.strip() or None
    return value, None


def _split_4blog_title_annotations(title: str) -> tuple[list[str], str]:
    annotations: list[str] = []
    remaining = title.strip()
    while remaining.startswith("["):
        end = remaining.find("]")
        if end == -1:
            break
        annotations.append(remaining[1:end].strip())
        remaining = remaining[end + 1 :].strip()
    return annotations, remaining or title.strip()


def _infer_4blog_regions(location_raw: str | None, title: str) -> tuple[str | None, str | None]:
    region_primary, region_secondary = _clean_4blog_location(location_raw)
    if region_primary or region_secondary:
        return region_primary, region_secondary

    annotations, _ = _split_4blog_title_annotations(title)
    for token in annotations:
        if "/" in token:
            first, second = [part.strip() for part in token.split("/", 1)]
            if first in FOUR_BLOG_LOCATION_PREFIXES:
                return first, second or None
        if token in FOUR_BLOG_LOCATION_PREFIXES:
            return token, None
    return None, None


def _infer_4blog_regions_from_detail_text(text: str | None) -> tuple[str | None, str | None]:
    if not text:
        return None, None

    compact = " ".join(str(text).split())
    if not compact:
        return None, None

    parts = compact.split()
    first = parts[0] if parts else None
    second = parts[1] if len(parts) > 1 else None

    if first in FOUR_BLOG_LOCATION_PREFIXES:
        return first, second or None

    if first and first.endswith(("시", "군", "구")):
        return first, second or None

    if first and first.endswith(("동", "읍", "면", "리")):
        return first, None

    return None, None


def _extract_4blog_detail_location_text(detail_html: str) -> str | None:
    block = _extract_first(r"체험\s*장소.*?(?:</div>|</strong>|</dt>)\s*([^<]+)", detail_html, re.S)
    if block:
        return html_lib.unescape(block)

    block = _extract_first(r"체험\s*장소.*?<p[^>]*>(.*?)</p>", detail_html, re.S)
    if block:
        return _strip_tags(block)

    return None


def enrich_4blog_item_from_detail(item: dict, detail_html: str) -> dict:
    enriched = dict(item)
    location_text = _extract_4blog_detail_location_text(detail_html)
    detail_primary, detail_secondary = _infer_4blog_regions_from_detail_text(location_text)

    if detail_primary and not enriched.get("region_primary_name"):
        enriched["region_primary_name"] = detail_primary
    if detail_secondary and not enriched.get("region_secondary_name"):
        enriched["region_secondary_name"] = detail_secondary

    if location_text and not enriched.get("snippet"):
        enriched["snippet"] = location_text

    return enriched


def _extract_image_url_from_next_image(block: str) -> str | None:
    src = _extract_first(r'<noscript><img[^>]+src=\"([^\"]+)\"', block)
    if not src:
        return None
    decoded = html_lib.unescape(src)
    if "/_next/image?url=" in decoded:
        match = re.search(r"url=([^&]+)", decoded)
        if match:
            return unquote(match.group(1))
    return decoded


def _clean_reviewnote_title(title: str) -> tuple[str, str | None, str | None]:
    annotations, cleaned = _split_4blog_title_annotations(title)
    region_primary = None
    region_secondary = None
    if annotations:
        first = annotations[0]
        if "/" in first:
            left, right = [part.strip() for part in first.split("/", 1)]
            if left in FOUR_BLOG_LOCATION_PREFIXES or left == "재택":
                region_primary = None if left == "재택" else left
                region_secondary = right or None
        elif first in FOUR_BLOG_LOCATION_PREFIXES:
            region_primary = first
    return cleaned, region_primary, region_secondary


def parse_reviewnote_listing(html: str, source_id: str | None = None, page_limit: int = 1) -> list[dict]:
    items: list[dict] = []
    href_matches = list(re.finditer(r'<a href="(/campaigns/\d+)">', html))
    for idx, match in enumerate(href_matches):
        start = max(0, match.start() - 800)
        end = href_matches[idx + 1].start() if idx + 1 < len(href_matches) else min(len(html), match.end() + 5000)
        block = html[start:end]
        href = match.group(1)
        title = _extract_first(r'<a class="truncate text-16m" href="/campaigns/\d+">([^<]+)</a>', block)
        benefit = _extract_first(r'<div class="mt-1 truncate text-gray-600 text-14r">([^<]+)</div>', block)
        type_label = _extract_first(r'<span class="flex items-center whitespace-nowrap font-semibold text-gray-600 text-14m">([^<]+)</span>', block)
        remaining_days = _extract_first(r'<span class="text-secondary-600 text-14b">(\d+)</span>\s*<!-- -->일 남음', block)
        apply_counts = re.search(
            r'신청<!-- --> <span class="text-secondary-600 text-14b">([\d,]+)</span> <!-- -->/ <!-- -->([\d,]+)',
            block,
        )
        platform_svg = _extract_first(r'/svgIcon/([a-zA-Z0-9_-]+)\.svg', block)
        points_text = _extract_first(r'<div class="text-system-point">(.*?)</div>', block, re.S)
        point_badge = _extract_first(r'<span>페이백 ([^<]+)</span>', block)
        image_url = _extract_image_url_from_next_image(block)
        cleaned_title, region_primary, region_secondary = _clean_reviewnote_title(html_lib.unescape(title or ""))

        extra_bits = []
        if points_text:
            extra_bits.append(_strip_tags(points_text))
        if point_badge:
            extra_bits.append(f"페이백 {html_lib.unescape(point_badge)}")
        snippet_parts = [benefit] + extra_bits
        snippet = " ".join(part for part in snippet_parts if part)

        status = "active"
        if remaining_days is not None and int(remaining_days) < 0:
            status = "expired"

        if title and href:
            items.append(
                {
                    "source_id": source_id,
                    "title": cleaned_title or html_lib.unescape(title or ""),
                    "original_url": f"https://www.reviewnote.co.kr{href}",
                    "platform_type": REVIEWNOTE_PLATFORM_MAP.get((platform_svg or "").lower(), "etc"),
                    "campaign_type": REVIEWNOTE_TYPE_MAP.get(type_label or "", "etc"),
                    "category_name": None,
                    "subcategory_name": type_label,
                    "region_primary_name": region_primary,
                    "region_secondary_name": region_secondary,
                    "benefit_text": html_lib.unescape(benefit or ""),
                    "recruit_count": int(apply_counts.group(2).replace(",", "")) if apply_counts else None,
                    "apply_deadline": None,
                    "published_at": None,
                    "thumbnail_url": image_url,
                    "snippet": snippet or None,
                    "raw_status": status,
                    "status": status,
                    "requires_review": True,
                }
            )
    return items


def transform_reviewnote_api_item(item: dict, source_id: str | None = None) -> dict:
    channel = str(item.get("channel") or "").upper()
    if "YOUTUBE" in channel:
        platform_type = "youtube"
    elif "INSTA" in channel or "CLIP" in channel:
        platform_type = "instagram"
    else:
        platform_type = "blog"

    sort = str(item.get("sort") or "").upper()
    campaign_type = {
        "VISIT": "visit",
        "DELIVERY": "delivery",
        "TAKEOUT": "purchase",
        "PAYBACK": "visit",
        "ETC": "content",
    }.get(sort, "etc")

    image_key = item.get("imageKey")
    thumbnail_url = (
        f"https://firebasestorage.googleapis.com/v0/b/reviewnote-e92d9.appspot.com/o/"
        f"{quote(str(image_key), safe='')}?alt=media"
        if image_key
        else None
    )

    reward_bits = []
    if item.get("productPurchasePoint"):
        reward_bits.append(f"구매가 {int(item['productPurchasePoint']):,}원")
    if item.get("additionalRewardPoint"):
        reward_bits.append(f"페이백 {int(item['additionalRewardPoint']):,}P")
    snippet = " ".join(part for part in [item.get("offer")] + reward_bits if part)

    city = item.get("city")
    sido = None
    if isinstance(item.get("sido"), dict):
        sido = item["sido"].get("name")
    region_primary = None if city == "재택" else (city or sido)
    region_secondary = None if city == "재택" else (sido if city and sido and city != sido else None)

    category_name = None
    if isinstance(item.get("category"), dict):
        category_name = item["category"].get("title")

    return {
        "source_id": source_id,
        "title": str(item.get("title") or "").strip(),
        "original_url": f"https://www.reviewnote.co.kr/campaigns/{item['id']}",
        "platform_type": platform_type,
        "campaign_type": campaign_type,
        "category_name": category_name,
        "subcategory_name": sort or None,
        "region_primary_name": region_primary,
        "region_secondary_name": region_secondary,
        "benefit_text": item.get("offer"),
        "recruit_count": item.get("infNum"),
        "apply_deadline": item.get("applyEndAt"),
        "published_at": None,
        "thumbnail_url": thumbnail_url,
        "snippet": snippet or None,
        "raw_status": str(item.get("status") or "").lower() or "active",
        "status": "active",
        "requires_review": False,
    }


def parse_mrblog_listing(html: str, source_id: str | None = None) -> list[dict]:
    pattern = re.compile(
        r'<a href="(https://www\.mrblog\.net/campaigns/\d+)" class="campaign_item">.*?'
        r'<img src="([^"]+)".*?'
        r'(<span class="area">.*?</span>)\s*'
        r'<strong class="subject">([^<]+)</strong>.*?'
        r'<p class="desc">\s*(.*?)\s*</p>.*?'
        r'<span class="d_day">\s*([0-9]+)일 남음\s*</span>.*?'
        r'신청 <strong>([0-9]+)명</strong>\s*</span>\s*/ 모집\s*([0-9]+)명',
        re.S,
    )
    items: list[dict] = []
    for match in pattern.finditer(html):
        href, image_url, area_block, subject, desc, d_day, applied, recruit = match.groups()
        area_clean = _strip_tags(area_block)
        region_primary = None
        region_secondary = None
        platform_type = "etc"

        class_match = re.search(r'sns_icon\s+([a-zA-Z0-9_-]+)', area_block)
        if class_match:
            platform_type = MRBLOG_PLATFORM_MAP.get(class_match.group(1).lower(), "etc")
        elif "릴스" in area_clean or "인스타" in area_clean:
            platform_type = "instagram"
        elif "블로그" in area_clean:
            platform_type = "blog"
        elif "유튜브" in area_clean:
            platform_type = "youtube"

        text_after_icon = _extract_first(r'sns_icon[^>]*></span>\s*([^<]+)', area_block, re.S)
        if text_after_icon:
            area_clean = _strip_tags(text_after_icon)
        area_clean = (
            area_clean.replace("릴스", "")
            .replace("인스타그램", "")
            .replace("블로그", "")
            .replace("유튜브", "")
            .strip()
        )

        parts = area_clean.split()
        if parts:
            region_primary = parts[0]
            if len(parts) > 1:
                region_secondary = " ".join(parts[1:])

        campaign_type = "visit"
        if "배송" in desc:
            campaign_type = "delivery"
        elif "숙박" in desc or "이용권" in desc:
            campaign_type = "visit"

        items.append(
            {
                "source_id": source_id,
                "title": html_lib.unescape(subject).strip(),
                "original_url": href,
                "platform_type": platform_type,
                "campaign_type": campaign_type,
                "category_name": None,
                "subcategory_name": None,
                "region_primary_name": region_primary,
                "region_secondary_name": region_secondary,
                "benefit_text": _strip_tags(desc),
                "recruit_count": int(recruit),
                "apply_deadline": None,
                "published_at": None,
                "thumbnail_url": image_url,
                "snippet": _strip_tags(desc),
                "raw_status": "active" if int(d_day) >= 0 else "expired",
                "status": "active" if int(d_day) >= 0 else "expired",
                "requires_review": True,
            }
        )
    return items


def _infer_revu_campaign_type(categories: list[str]) -> str:
    if "배송형" in categories:
        return "delivery"
    if "구매형" in categories:
        return "purchase"
    if "방문형" in categories:
        return "visit"
    return "etc"


def transform_revu_item(item: dict, source_id: str | None = None) -> dict:
    categories = item.get("category") or []
    if not isinstance(categories, list):
        categories = []

    venue = item.get("venue") or {}
    address_first = venue.get("addressFirst") if isinstance(venue, dict) else None
    region_primary = None
    region_secondary = None
    if isinstance(address_first, str) and address_first.strip():
        parts = address_first.split()
        if parts:
            region_primary = parts[0]
            if len(parts) > 1:
                region_secondary = parts[1]

    local_tags = item.get("localTag") or []
    if isinstance(local_tags, list) and local_tags:
        if region_primary is None:
            region_primary = local_tags[0]
        elif region_secondary is None and local_tags[0] != region_primary:
            region_secondary = local_tags[0]

    campaign_data = item.get("campaignData") or {}
    reward_bits = []
    if campaign_data.get("reward"):
        reward_bits.append(str(campaign_data["reward"]))
    if campaign_data.get("point"):
        reward_bits.append(f"리뷰포인트 {int(campaign_data['point']):,}P")
    if item.get("label"):
        reward_bits.append(str(item["label"]))
    benefit_text = " / ".join(reward_bits) if reward_bits else None

    raw_media = str(item.get("media") or "").lower()
    title = (item.get("title") or item.get("item") or "").strip()

    return {
        "source_id": source_id,
        "title": title,
        "original_url": f"https://www.revu.net/campaign/{item['id']}",
        "platform_type": REVU_MEDIA_MAP.get(raw_media, "etc"),
        "campaign_type": _infer_revu_campaign_type(categories),
        "category_name": categories[0] if categories else None,
        "subcategory_name": categories[1] if len(categories) > 1 else None,
        "region_primary_name": region_primary,
        "region_secondary_name": region_secondary,
        "benefit_text": benefit_text,
        "recruit_count": item.get("reviewerLimit"),
        "apply_deadline": item.get("requestEndedOn"),
        "published_at": item.get("requestStartedOn"),
        "thumbnail_url": item.get("thumbnail"),
        "snippet": item.get("item") or benefit_text,
        "raw_status": str(item.get("status") or "").lower(),
        "status": "active" if item.get("active", True) else "expired",
        "requires_review": True,
    }


def transform_4blog_item(item: dict, source_id: str | None = None) -> dict:
    annotations, cleaned_title = _split_4blog_title_annotations((item.get("CAMPAIGN_NM") or "").strip())
    region_primary, region_secondary = _infer_4blog_regions(item.get("LOCATION_NM"), item.get("CAMPAIGN_NM") or "")
    campaign_type = FOUR_BLOG_CATEGORY1_TO_TYPE.get(item.get("CATEGORY1"), "visit")
    platform_type = FOUR_BLOG_PLATFORM_MAP.get(item.get("CATEGORY"), "etc")
    cid = item.get("CID")
    pr_id = item.get("PRID")
    img_key = item.get("IMGKEY")
    raw_status = "active" if (item.get("REMAINDATE") or 0) >= 0 else "expired"
    thumbnail_url = None
    if pr_id and img_key:
        thumbnail_url = f"https://d3oxv6xcx9d0j1.cloudfront.net/public/pr/{pr_id}/thumbnail/{img_key}"

    snippet_parts = [item.get("REVIEWER_BENEFIT"), item.get("KEYWORD")]
    snippet = " ".join(part.strip() for part in snippet_parts if isinstance(part, str) and part.strip()) or None

    return {
        "source_id": source_id,
        "title": cleaned_title,
        "original_url": f"https://4blog.net/campaign/{cid}/" if cid else "",
        "platform_type": platform_type,
        "campaign_type": campaign_type,
        "category_name": None,
        "subcategory_name": item.get("CATEGORY1") or (annotations[0] if annotations else None),
        "region_primary_name": region_primary,
        "region_secondary_name": region_secondary,
        "benefit_text": item.get("REVIEWER_BENEFIT"),
        "recruit_count": item.get("REVIEWER_CNT"),
        "apply_deadline": _normalize_4blog_date(item.get("REQ_CLOSE_DT")),
        "published_at": _normalize_4blog_date(item.get("REQ_OPEN_DT")),
        "thumbnail_url": thumbnail_url,
        "snippet": snippet,
        "raw_status": raw_status,
        "status": raw_status,
        "requires_review": False,
    }


class FourBlogSourceAdapter(PlaceholderSourceAdapter):
    endpoint = "https://4blog.net/loadMoreDataCategory"

    def __init__(self, definition: SourceDefinition, page_limit: int = 50):
        super().__init__(definition)
        self.page_limit = page_limit

    def fetch(self) -> list[dict]:
        limit = 30
        offset = 0
        items: list[dict] = []
        page_count = 0
        while page_count < self.page_limit:
            query = urlencode(
                {
                    "offset": offset,
                    "limit": limit,
                    "category": "",
                    "category1": "",
                    "location": "",
                    "location1": "",
                    "search": "",
                    "bid": "",
                }
            )
            try:
                batch = fetch_json_url(f"{self.endpoint}?{query}")
            except Exception:
                if offset == 0:
                    raise
                break
            if not isinstance(batch, list) or not batch:
                break
            for item in batch:
                transformed = transform_4blog_item(item, source_id=self.definition.source_id)
                if transformed.get("original_url") and not transformed.get("region_primary_name"):
                    try:
                        detail_html = fetch_text_url(transformed["original_url"])
                    except Exception:
                        detail_html = None
                    if detail_html:
                        transformed = enrich_4blog_item_from_detail(transformed, detail_html)
                items.append(transformed)
            if len(batch) < limit:
                break
            offset += limit
            page_count += 1
        return items


class ReviewNoteSourceAdapter(PlaceholderSourceAdapter):
    listing_url = "https://www.reviewnote.co.kr/campaigns?s=new"
    listing_api = "https://www.reviewnote.co.kr/api/v2/campaigns?limit={limit}&page={page}"

    def __init__(self, definition: SourceDefinition, page_limit: int = 20, page_size: int = 50):
        super().__init__(definition)
        self.page_limit = page_limit
        self.page_size = page_size

    def fetch(self) -> list[dict]:
        items: list[dict] = []
        try:
            for page in range(self.page_limit):
                batch = fetch_json_url(self.listing_api.format(limit=self.page_size, page=page))
                objects = batch.get("objects", []) if isinstance(batch, dict) else []
                if not objects:
                    break
                items.extend(transform_reviewnote_api_item(item, source_id=self.definition.source_id) for item in objects)
                total_pages = batch.get("total_pages")
                if total_pages is not None and page + 1 >= int(total_pages):
                    break
            if items:
                return items
        except Exception:
            pass

        listing_html = fetch_text_url(self.listing_url)
        return parse_reviewnote_listing(listing_html, source_id=self.definition.source_id)


class MrBlogSourceAdapter(PlaceholderSourceAdapter):
    listing_url = "https://www.mrblog.net/"

    def fetch(self) -> list[dict]:
        listing_html = fetch_text_url(self.listing_url)
        return parse_mrblog_listing(listing_html, source_id=self.definition.source_id)


class SeoulOppaSourceAdapter(PlaceholderSourceAdapter):
    listing_url = "https://www.seoulouba.co.kr/campaign/?qq=popular"

    def __init__(self, definition: SourceDefinition, detail_limit: int | None = 80):
        super().__init__(definition)
        self.detail_limit = detail_limit

    def fetch(self) -> list[dict]:
        try:
            listing_html = fetch_text_url(self.listing_url, timeout=10)
        except Exception:
            listing_html = None
        listing_items: list[dict] = []
        seen_urls: set[str] = set()
        seed_urls = _extract_seouloppa_listing_urls(listing_html) if listing_html else list(SEOULOUPPA_LISTING_URLS)
        for listing_url in seed_urls:
            try:
                page_html = listing_html if listing_html and listing_url == self.listing_url else fetch_text_url(listing_url, timeout=10)
                fragments = _fetch_seouloppa_listing_fragments(listing_url, base_html=page_html)
            except Exception:
                continue
            for fragment in fragments:
                for item in parse_seouloppa_listing(fragment, source_id=self.definition.source_id):
                    if item["original_url"] in seen_urls:
                        continue
                    seen_urls.add(item["original_url"])
                    listing_items.append(item)
        detail_targets = listing_items if self.detail_limit is None else listing_items[: self.detail_limit]
        detail_map = {item["original_url"]: index for index, item in enumerate(detail_targets)}
        items = [dict(item) for item in listing_items]
        for item in items:
            if item["original_url"] not in detail_map:
                continue
            try:
                detail_html = fetch_text_url(item["original_url"], timeout=10)
            except Exception:
                detail_html = None
            if detail_html:
                item.update(enrich_seouloppa_detail(item, detail_html))
        return items


class GangnamMatzipSourceAdapter(PlaceholderSourceAdapter):
    listing_urls = (
        "https://gangnam-review.net/",
        "https://gangnam-review.net/cp/?ca=20",
        "https://gangnam-review.net/cp/?ca=30",
        "https://gangnam-review.net/cp/?ca=40",
        "https://gangnam-review.net/cp/?ch=clip",
        "https://gangnam-review.net/cp/?rec=rc",
        "https://gangnam-review.net/cp/?spc=50",
        "https://gangnam-review.net/cp/?sst=cmp_ask_num&sod=desc",
        "https://gangnam-review.net/cp/?sst=cmp_date_select&sod=asc",
        "https://gangnam-review.net/cp/?sst=wr_datetime&sod=desc",
    )

    def __init__(self, definition: SourceDefinition, detail_limit: int | None = None):
        super().__init__(definition)
        self.detail_limit = detail_limit

    def fetch(self) -> list[dict]:
        listing_items: list[dict] = []
        seen_urls: set[str] = set()
        discovered_listing_urls: list[str] = []
        for listing_url in self.listing_urls:
            try:
                listing_html = fetch_text_url(listing_url)
            except Exception:
                continue
            discovered_listing_urls.append(listing_url)
            for nested in _extract_gangnammatzip_listing_urls(listing_html):
                if nested not in discovered_listing_urls:
                    discovered_listing_urls.append(nested)
            for fragment in _fetch_gangnammatzip_listing_fragments(listing_url, base_html=listing_html):
                for item in parse_gangnammatzip_listing(fragment, source_id=self.definition.source_id):
                    if item["original_url"] in seen_urls:
                        continue
                    seen_urls.add(item["original_url"])
                    listing_items.append(item)

        for listing_url in discovered_listing_urls[len(self.listing_urls) :]:
            try:
                listing_html = fetch_text_url(listing_url)
            except Exception:
                continue
            for fragment in _fetch_gangnammatzip_listing_fragments(listing_url, base_html=listing_html):
                for item in parse_gangnammatzip_listing(fragment, source_id=self.definition.source_id):
                    if item["original_url"] in seen_urls:
                        continue
                    seen_urls.add(item["original_url"])
                    listing_items.append(item)

        detail_targets = listing_items if self.detail_limit is None else listing_items[: self.detail_limit]
        detail_map = {item["original_url"]: index for index, item in enumerate(detail_targets)}
        items = [dict(item) for item in listing_items]
        for item in items:
            if item["original_url"] not in detail_map:
                continue
            try:
                detail_html = fetch_text_url(item["original_url"])
            except Exception:
                detail_html = None
            if detail_html:
                item.update(enrich_gangnammatzip_detail(item, detail_html))
        return items


class RevuSourceAdapter(PlaceholderSourceAdapter):
    def __init__(self, definition: SourceDefinition, page_limit: int = 100, page_size: int = 35):
        super().__init__(definition)
        self.page_limit = page_limit
        self.page_size = page_size

    def fetch(self) -> list[dict]:
        import os

        token = os.getenv("REVU_ACCESS_TOKEN", "").strip()
        if not token:
            username = os.getenv("REVU_USERNAME", "").strip()
            password = os.getenv("REVU_PASSWORD", "").strip()
            if not username or not password:
                raise ValueError("REVU_ACCESS_TOKEN or REVU_USERNAME/REVU_PASSWORD is required for REVU crawling")
            auth = post_json_with_headers(
                "https://api.weble.net/tokens",
                headers={
                    "User-Agent": "Mozilla/5.0 (compatible; ReviewersCrawler/0.1; +https://reviewers.local)",
                    "Accept": "application/json, text/plain, */*",
                },
                payload={"username": username, "password": password},
            )
            token = str(auth.get("token") or "").strip()
            if not token:
                raise ValueError("REVU token acquisition failed")

        headers = {
            "User-Agent": "Mozilla/5.0 (compatible; ReviewersCrawler/0.1; +https://reviewers.local)",
            "Authorization": f"Bearer {token}",
            "Accept": "application/json, text/plain, */*",
        }

        items: list[dict] = []
        for page in range(1, self.page_limit + 1):
            query = urlencode(
                [
                    ("cat", "지역"),
                    ("limit", str(self.page_size)),
                    ("media[]", "blog"),
                    ("media[]", "instagram"),
                    ("media[]", "youtube"),
                    ("media[]", "clip"),
                    ("page", str(page)),
                    ("sort", "latest"),
                    ("type", "play"),
                ]
            )
            data = fetch_json_with_headers(
                f"https://api.weble.net/v1/campaigns?{query}",
                headers=headers,
            )
            objects = data.get("items", []) if isinstance(data, dict) else []
            if not objects:
                break
            items.extend(transform_revu_item(item, source_id=self.definition.source_id) for item in objects)
            links = data.get("_links", {}) if isinstance(data, dict) else {}
            if not links.get("next"):
                break
        return items




def _parse_yy_mm_dd_range(value: str | None) -> tuple[str | None, str | None]:
    if not value:
        return None, None
    try:
        match = re.search(
            r"(\d{2})[-.](\d{2})[-.](\d{2})\s*[~–]\s*(\d{2})[-.](\d{2})[-.](\d{2})",
            value,
        )
        if not match:
            return None, None
        sy, sm, sd, ey, em, ed = [int(part) for part in match.groups()]
        return date(2000 + sy, sm, sd).isoformat(), date(2000 + ey, em, ed).isoformat()
    except Exception:
        return None, None


def _estimate_deadline_from_d_label(value: str | None, today: date | None = None) -> str | None:
    if not value:
        return None
    today = today or date.today()
    compact = value.strip().lower().replace(" ", "")
    if compact in {"d-day", "dday", "today", "오늘마감", "오늘-내일마감"}:
        return today.isoformat()
    match = re.search(r"d-(\d+)", compact)
    if match:
        return (today + timedelta(days=int(match.group(1)))).isoformat()
    match = re.search(r"(\d+)일남음", compact)
    if match:
        return (today + timedelta(days=int(match.group(1)))).isoformat()
    return None


def _extract_query_params(url: str) -> dict[str, str]:
    query = parse_qs(urlsplit(url).query)
    return {key: values[-1] for key, values in query.items() if values}


def _build_seouloppa_ajax_payload(listing_url: str, page: int, more: int | None = None) -> dict[str, Any]:
    query = _extract_query_params(listing_url)
    return {
        "cat": query.get("cat", ""),
        "qq": query.get("qq", ""),
        "q": query.get("q", ""),
        "q1": query.get("q1", ""),
        "q2": query.get("q2", ""),
        "ar1": query.get("ar1", ""),
        "ar2": query.get("ar2", ""),
        "sort": query.get("sort", ""),
        "page": page,
        "more": more if more is not None else max(36, page * 36),
        "rows": 36,
    }


def _fetch_seouloppa_listing_fragments(
    listing_url: str,
    base_html: str | None = None,
    max_pages: int = 3,
) -> list[str]:
    base_page = base_html if base_html is not None else fetch_text_url(listing_url, timeout=10)
    pages = [base_page]
    seen_fragments: set[str] = set()
    ajax_url = "https://www.seoulouba.co.kr/campaign/ajax/list.ajax.php"
    next_page = int(_extract_first(r'id="list_more_btn"[^>]*data-page="(\d+)"', base_page) or 2)
    current_more = int(_extract_first(r'id="list_more_btn"[^>]*data-more="(\d+)"', base_page) or 0)

    for _ in range(max_pages - 1):
        try:
            fragment = post_form_for_text(
                ajax_url,
                _build_seouloppa_ajax_payload(listing_url, next_page, more=current_more or None),
                headers={"X-Requested-With": "XMLHttpRequest", "Referer": listing_url},
                timeout=10,
            )
        except Exception:
            break
        normalized = fragment.strip()
        if not normalized or normalized in seen_fragments or "campaign_content" not in normalized:
            break
        seen_fragments.add(normalized)
        pages.append(fragment)
        next_page += 1
        current_more += 36
    return pages


def _build_gangnammatzip_ajax_url(listing_url: str, rpage: int) -> str:
    split = urlsplit(listing_url)
    query = parse_qs(split.query)
    params: list[tuple[str, str]] = []
    for key in ("ca", "stx", "sst", "sod", "channel", "ch", "local_1", "local_2", "spc", "rec", "year"):
        for value in query.get(key, []):
            if value:
                params.append((key, value))
    params.append(("rpage", str(rpage)))
    return f"https://gangnam-review.net/theme/go/_list_cmp_tpl.php?{urlencode(params)}"


def _fetch_gangnammatzip_listing_fragments(
    listing_url: str,
    base_html: str | None = None,
    max_pages: int = 12,
) -> list[str]:
    pages = [base_html if base_html is not None else fetch_text_url(listing_url)]
    seen_fragments: set[str] = set()

    for rpage in range(1, max_pages + 1):
        try:
            fragment = fetch_text_url(_build_gangnammatzip_ajax_url(listing_url, rpage))
        except Exception:
            break
        normalized = fragment.strip()
        if (
            not normalized
            or normalized in seen_fragments
            or "list_item" not in normalized
            or "조회된 캠페인이 없습니다." in normalized
        ):
            break
        seen_fragments.add(normalized)
        pages.append(fragment)
    return pages


def _clean_bracket_title(title: str) -> tuple[str, str | None, str | None]:
    annotations, cleaned = _split_4blog_title_annotations(title)
    region_primary = None
    region_secondary = None
    if annotations:
        token = annotations[0]
        if '/' in token:
            left, right = [part.strip() for part in token.split('/', 1)]
            region_primary = left or None
            region_secondary = right or None
        else:
            region_primary = token or None
    return cleaned, region_primary, region_secondary


def _clean_seouloppa_title(title: str) -> tuple[str, str | None, str | None]:
    annotations, cleaned = _split_4blog_title_annotations(title)
    region_primary = None
    region_secondary = None

    for token in annotations:
        if token in SEOULOUPPA_TITLE_TAGS:
            continue
        if "/" in token:
            left, right = [part.strip() for part in token.split("/", 1)]
            region_primary = left or None
            region_secondary = right or None
        else:
            region_primary = token or None
        break

    return cleaned, region_primary, region_secondary


def _extract_seouloppa_listing_urls(html: str) -> list[str]:
    urls = set(SEOULOUPPA_LISTING_URLS)
    patterns = (r'href="([^"]*campaign/\?cat=\d+[^"]*)"', r'href="(\?cat=\d+[^"]*)"')
    for pattern in patterns:
        for href in re.findall(pattern, html):
            cleaned = html_lib.unescape(href).strip()
            if not cleaned:
                continue
            if cleaned.startswith("http"):
                urls.add(cleaned)
            elif cleaned.startswith("/"):
                urls.add(f"https://www.seoulouba.co.kr{cleaned}")
            elif cleaned.startswith("?"):
                urls.add(f"https://www.seoulouba.co.kr/campaign/{cleaned}")
    return sorted(urls)


def _extract_gangnammatzip_listing_urls(html: str) -> list[str]:
    urls: set[str] = set()
    for href in re.findall(r'href="(https?://[^"]+/cp/\?[^"]+)"', html):
        cleaned = html_lib.unescape(href).strip()
        if any(key in cleaned for key in ("ca=", "ch=", "rec=", "spc=", "sst=")):
            urls.add(
                cleaned
                .replace("https://강남맛집.net", "https://gangnam-review.net")
                .replace("https://xn--939au0g4vj8sq.net", "https://gangnam-review.net")
            )
    for href in re.findall(r'href="(/cp/\?[^"]+)"', html):
        cleaned = html_lib.unescape(href).strip()
        if any(key in cleaned for key in ("ca=", "ch=", "rec=", "spc=", "sst=")):
            urls.add(urljoin("https://gangnam-review.net", cleaned))
    return sorted(urls)


def _infer_region_from_address_text(address_text: str | None) -> tuple[str | None, str | None]:
    if not address_text:
        return None, None

    compact = " ".join(str(address_text).split())
    if not compact:
        return None, None

    parts = compact.split()
    primary = parts[0] if parts else None
    secondary = parts[1] if len(parts) > 1 else None

    return primary, secondary


def parse_seouloppa_listing(html: str, source_id: str | None = None) -> list[dict]:
    items = []
    pattern = re.compile(
        r'<li class="campaign_content">.*?'
        r'<a href="(https://www\.seoulouba\.co\.kr/campaign/\?c=(\d+))"[^>]*class="tum_img">.*?'
        r'<img src="([^"]+)".*?'
        r'<div class="icon_tag">(.*?)</div>.*?'
        r'<strong class="s_campaign_title">(.*?)</strong>.*?'
        r'<div class="t_basic">\s*<span class="basic_blue">(.*?)</span>.*?'
        r'<div class="d_day"><span>\s*(D(?:-\d+|\-day|day))\s*</span></div>.*?'
        r'신청\s*([\d,]+)\s*<span class="span_gray">/ 모집\s*([\d,]+)</span>',
        re.S | re.I,
    )
    for match in pattern.finditer(html):
        original_url, campaign_id, image_url, icon_block, raw_title, basic_text, d_day, applied, recruit = match.groups()
        title, region_primary, region_secondary = _clean_seouloppa_title(html_lib.unescape(_strip_tags(raw_title)))
        platform_type = 'blog'
        for token, mapped in SEOULOUPPA_PLATFORM_MAP.items():
            if token in icon_block:
                platform_type = mapped
                break
        type_matches = re.findall(r'<span>([^<]+)</span>', icon_block)
        campaign_type = 'visit'
        benefit_text = html_lib.unescape(_strip_tags(basic_text))
        for label in type_matches:
            cleaned = html_lib.unescape(label).strip()
            if cleaned in SEOULOUPPA_TYPE_MAP:
                campaign_type = SEOULOUPPA_TYPE_MAP[cleaned]
            elif cleaned.endswith('P') and not benefit_text:
                benefit_text = cleaned
        raw_status = 'active'
        if d_day.lower() == 'd-day':
            raw_status = 'active'
        apply_deadline = _estimate_deadline_from_d_label(d_day)
        items.append({
            'source_id': source_id,
            'campaign_id': campaign_id,
            'title': title,
            'original_url': original_url,
            'platform_type': 'blog' if platform_type == 'purchase' else platform_type,
            'campaign_type': campaign_type,
            'category_name': None,
            'subcategory_name': type_matches[0].strip() if type_matches else None,
            'region_primary_name': region_primary,
            'region_secondary_name': region_secondary,
            'benefit_text': benefit_text,
            'recruit_count': int(recruit.replace(',', '')) if recruit else None,
            'apply_deadline': apply_deadline,
            'published_at': None,
            'thumbnail_url': image_url,
            'snippet': benefit_text,
            'raw_status': raw_status,
            'status': 'active',
            'requires_review': False,
        })
    return items


def enrich_seouloppa_detail(item: dict, detail_html: str) -> dict:
    enriched = dict(item)
    benefit_block = _extract_first(r'<dt class="cam_info_con_dt lititle">제공내역</dt>\s*<dd class="cam_info_con_dd">(.*?)</dd>', detail_html, re.S)
    if benefit_block:
        enriched['benefit_text'] = _strip_tags(benefit_block)
        enriched['snippet'] = _strip_tags(benefit_block)
    period = _extract_first(r'<strong[^>]*>\s*크리에이터 모집\s*</strong>\s*<span class="period on">([^<]+)</span>', detail_html, re.S)
    published_at, apply_deadline = _parse_yy_mm_dd_range(period)
    if published_at:
        enriched['published_at'] = published_at
    if apply_deadline:
        enriched['apply_deadline'] = apply_deadline
    address_text = _extract_first(r"addressSearch\('([^']+)'", detail_html, re.S)
    region_primary, region_secondary = _infer_region_from_address_text(address_text)
    if region_primary and not enriched.get('region_primary_name'):
        enriched['region_primary_name'] = region_primary
    if region_secondary and not enriched.get('region_secondary_name'):
        enriched['region_secondary_name'] = region_secondary
    site_url = _extract_first(r'<dt class="cam_info_con_dt lititle">사이트 URL</dt>\s*<dd class="cam_info_con_dd">\s*<a href="([^"]+)"', detail_html, re.S)
    if site_url:
        payload = dict(enriched.get('raw_payload') or {})
        payload['site_url'] = site_url
        enriched['raw_payload'] = payload
    return enriched


def parse_gangnammatzip_listing(html: str, source_id: str | None = None) -> list[dict]:
    items = []
    pattern = re.compile(
        r"<li class='list_item[^']*'.*?"
        r"<a href='(/cp/\?id=(\d+))'[^>]*><img src='([^']+)'[^>]*>.*?"
        r"<span class='label'><em class='([^']+)'>([^<]+)</em><em class='type'>([^<]+)</em><span class='dday'><em class='day_c'>([^<]+)</em></span></span>.*?"
        r"<dt class='tit'><a href='/cp/\?id=\d+'>([^<]+)</a></dt>.*?"
        r"<dd class='sub_tit'>([^<]+)</dd>.*?"
        r"신청\s*([\d,]+)</b> / 모집\s*([\d,]+)",
        re.S,
    )
    for match in pattern.finditer(html):
        relative_url, campaign_id, image_url, platform_class, platform_label, type_label, dday_label, raw_title, subtitle, applied, recruit = match.groups()
        title, region_primary, region_secondary = _clean_bracket_title(html_lib.unescape(raw_title.strip()))
        platform_type = {'blog': 'blog', 'insta': 'instagram', 'youtube': 'youtube', 'clip': 'instagram'}.get(platform_class, 'blog')
        campaign_type = GANGNAMMATZIP_TYPE_MAP.get(type_label.strip(), 'visit')
        subtitle_text = _strip_tags(html_lib.unescape(subtitle.strip()))
        apply_deadline = _estimate_deadline_from_d_label(dday_label)
        items.append({
            'source_id': source_id,
            'campaign_id': campaign_id,
            'title': title,
            'original_url': f'https://gangnam-review.net{relative_url}',
            'platform_type': platform_type,
            'campaign_type': campaign_type if campaign_type in {'visit','delivery','purchase','content'} else 'etc',
            'category_name': None,
            'subcategory_name': type_label.strip(),
            'region_primary_name': region_primary,
            'region_secondary_name': region_secondary,
            'benefit_text': subtitle_text,
            'recruit_count': int(recruit.replace(',', '')) if recruit else None,
            'apply_deadline': apply_deadline,
            'published_at': None,
            'thumbnail_url': image_url if image_url.startswith('http') else f'https:{image_url}',
            'snippet': subtitle_text,
            'raw_status': 'active',
            'status': 'active',
            'requires_review': False,
        })
    return items


def enrich_gangnammatzip_detail(item: dict, detail_html: str) -> dict:
    enriched = dict(item)
    benefit = _extract_first(r'<dt>제공내역</dt>\s*<dd[^>]*>\s*(.*?)\s*(?:<p|</dd>)', detail_html, re.S)
    if benefit:
        enriched['benefit_text'] = _strip_tags(benefit)
        enriched['snippet'] = _strip_tags(benefit)
    period = _extract_first(r'신청기간</dt>.*?<dd>\s*([^<]+)', detail_html, re.S)
    if period:
        current_year = date.today().year
        try:
            left, right = [part.strip() for part in re.split(r'[~–]', period, maxsplit=1)]
            lm, ld = [int(part) for part in left.split('.') if part]
            rm, rd = [int(part) for part in right.split('.') if part]
            enriched['published_at'] = date(current_year, lm, ld).isoformat()
            enriched['apply_deadline'] = date(current_year, rm, rd).isoformat()
        except Exception:
            pass
    return enriched

def _strip_tags(value: str) -> str:
    value = re.sub(r"<br\s*/?>", "\n", value, flags=re.I)
    value = re.sub(r"<[^>]+>", " ", value)
    value = html_lib.unescape(value)
    return " ".join(value.split())


def _extract_first(pattern: str, text: str, flags: int = 0) -> str | None:
    match = re.search(pattern, text, flags)
    return match.group(1).strip() if match else None


def transform_dinnerqueen_detail(detail_html: str, campaign_id: str, source_id: str | None = None) -> dict:
    title = _extract_first(r'<meta property="og:title" content="([^"]+)"', detail_html)
    if not title:
        title = _extract_first(r"<title>(.*?)</title>", detail_html, re.S)
    title = html_lib.unescape((title or "").replace(" | 디너의여왕", "").replace("디너의여왕 - ", "").strip())

    benefit_block = _extract_first(
        r"제공내역.*?<p[^>]*class=\"[^\"]*color-title[^\"]*\"[^>]*>(.*?)</p>",
        detail_html,
        re.S,
    )
    benefit_text = _strip_tags(benefit_block) if benefit_block else None

    category_token = unquote(html_lib.unescape(_extract_first(r"/taste\?ct=([^\"'&]+)", detail_html) or ""))
    campaign_type = DINNERQUEEN_CATEGORY_MAP.get(category_token, "content" if category_token else "visit")
    platform_type = DINNERQUEEN_PLATFORM_MAP.get(category_token, "blog")

    area_match = re.search(r"/taste\?area1=([^\"'&]+)(?:&amp;area2=([^\"']+))?", detail_html)
    region_primary = unquote(html_lib.unescape(area_match.group(1))) if area_match else None
    region_secondary = (
        unquote(html_lib.unescape(area_match.group(2))) if area_match and area_match.group(2) else None
    )
    if region_secondary == "전체":
        region_secondary = None

    deadline_range = _extract_first(
        r"기간:\s*([0-9]{2}\.[0-9]{2}\.[0-9]{2}\s*[–~]\s*[0-9]{2}\.[0-9]{2}\.[0-9]{2})",
        detail_html,
    )
    apply_deadline = None
    published_at = None
    if deadline_range:
        left, right = [part.strip() for part in re.split(r"[–~]", deadline_range, maxsplit=1)]
        try:
            sy, sm, sd = [int(part) for part in left.split(".")]
            ey, em, ed = [int(part) for part in right.split(".")]
            published_at = date(2000 + sy, sm, sd).isoformat()
            apply_deadline = date(2000 + ey, em, ed).isoformat()
        except Exception:
            published_at = None
            apply_deadline = None

    thumbnail_url = _extract_first(r'<meta property="og:image" content="([^"]+)"', detail_html)
    if thumbnail_url and thumbnail_url.startswith("https://dinnerqueen.nethttps://"):
        thumbnail_url = thumbnail_url.replace("https://dinnerqueen.net", "", 1)

    return {
        "source_id": source_id,
        "title": title or f"DinnerQueen {campaign_id}",
        "original_url": f"https://dinnerqueen.net/taste/{campaign_id}",
        "platform_type": platform_type,
        "campaign_type": campaign_type,
        "category_name": "맛집" if campaign_type == "visit" else None,
        "subcategory_name": category_token or None,
        "region_primary_name": region_primary,
        "region_secondary_name": region_secondary,
        "benefit_text": benefit_text,
        "recruit_count": None,
        "apply_deadline": apply_deadline,
        "published_at": published_at,
        "thumbnail_url": thumbnail_url,
        "snippet": benefit_text,
        "raw_status": "active",
        "status": "active",
        "requires_review": True,
    }


class DinnerQueenSourceAdapter(PlaceholderSourceAdapter):
    listing_url = "https://dinnerqueen.net/taste?order=hot"
    listing_api = "https://dinnerqueen.net/taste/taste_list?ct=&page={page}&order=hot"
    def __init__(self, definition: SourceDefinition, page_limit: int = 20, detail_limit: int | None = None):
        super().__init__(definition)
        self.page_limit = page_limit
        self.detail_limit = detail_limit

    def fetch(self) -> list[dict]:
        cards: list[dict[str, str]] = []
        card_pattern = re.compile(
            r'<a class="qz-dq-card__link" href="/taste/(\d+)" title="([^"]+)">.*?'
            r'<strong style="letter-spacing: -0.2px">([^<]+)</strong>.*?'
            r'<span class="color-subtitle">신청 ([0-9,]+)</span><span> / 모집 ([0-9,]+)</span>',
            re.S,
        )
        seen_ids: set[str] = set()
        for page in range(1, self.page_limit + 1):
            response = fetch_session_json(
                self.listing_url,
                self.listing_api.format(page=page),
                headers={"Referer": self.listing_url},
            )
            layout_html = response.get("layout", "") if isinstance(response, dict) else ""
            for match in card_pattern.finditer(layout_html):
                campaign_id = match.group(1)
                if campaign_id in seen_ids:
                    continue
                seen_ids.add(campaign_id)
                cards.append(
                    {
                        "campaign_id": campaign_id,
                        "list_title": html_lib.unescape(match.group(2)).replace(" 신청하기", "").strip(),
                        "badge_type": html_lib.unescape(match.group(3)).strip(),
                        "recruit_count": match.group(5).replace(",", ""),
                    }
                )
            if not (isinstance(response, dict) and response.get("has_next")):
                break
        items: list[dict] = []
        selected_cards = cards if self.detail_limit is None else cards[: self.detail_limit]
        for card in selected_cards:
            campaign_id = card["campaign_id"]
            try:
                detail_html = fetch_text_url(f"https://dinnerqueen.net/taste/{campaign_id}")
            except Exception:
                continue
            item = transform_dinnerqueen_detail(detail_html, campaign_id, source_id=self.definition.source_id)
            item["title"] = card["list_title"] or item["title"]
            if card["badge_type"] == "배송":
                item["campaign_type"] = "delivery"
                item["category_name"] = None
            elif card["badge_type"] == "방문":
                item["campaign_type"] = "visit"
                item["category_name"] = "맛집"
            item["recruit_count"] = int(card["recruit_count"]) if card["recruit_count"].isdigit() else None
            items.append(item)
        return items


def get_adapter(source_slug: str, source_file: str | None = None, report_mode: bool = False):
    definition = SEEDED_SOURCES[source_slug]
    if source_file:
        return FileSourceAdapter(definition, Path(source_file))
    if source_slug == "revu":
        return RevuSourceAdapter(definition, page_limit=2 if report_mode else 100, page_size=35)
    if source_slug == "mrblog":
        return MrBlogSourceAdapter(definition)
    if source_slug == "reviewnote":
        return ReviewNoteSourceAdapter(definition, page_limit=2 if report_mode else 20, page_size=50)
    if source_slug == "4blog":
        return FourBlogSourceAdapter(definition, page_limit=2 if report_mode else 50)
    if source_slug == "dinnerqueen":
        return DinnerQueenSourceAdapter(definition, page_limit=1 if report_mode else 20, detail_limit=12 if report_mode else None)
    if source_slug == "seouloppa":
        return SeoulOppaSourceAdapter(definition, detail_limit=24 if report_mode else 40)
    if source_slug == "gangnammatzip":
        return GangnamMatzipSourceAdapter(definition, detail_limit=10 if report_mode else 120)
    return PlaceholderSourceAdapter(definition)
