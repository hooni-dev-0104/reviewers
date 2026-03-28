from __future__ import annotations

from datetime import date, timedelta
import html as html_lib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import parse_qs, quote, urlencode, unquote, urljoin, urlsplit

from crawler.models import SourceDefinition
from crawler.sources.base import (
    FileSourceAdapter,
    PlaceholderSourceAdapter,
    fetch_json_url,
    fetch_session_text,
    fetch_json_with_headers,
    fetch_session_json,
    fetch_text_url,
    post_form_for_text,
    post_json_with_headers,
)


SEEDED_SOURCES: dict[str, SourceDefinition] = {
    "chehumview": SourceDefinition("chehumview", "체험뷰", "https://chvu.co.kr", "mixed", "dynamic"),
    "modan": SourceDefinition("modan", "모두의체험단", "https://www.modan.kr", "mixed", "static"),
    "reviewnote": SourceDefinition("reviewnote", "리뷰노트", "https://www.reviewnote.co.kr", "mixed", "dynamic"),
    "reviewplace": SourceDefinition("reviewplace", "리뷰플레이스", "https://www.reviewplace.co.kr", "mixed", "dynamic"),
    "revu": SourceDefinition("revu", "레뷰", "https://www.revu.net", "mixed", "dynamic"),
    "dinnerqueen": SourceDefinition("dinnerqueen", "디너의여왕", "https://dinnerqueen.net", "mixed", "static"),
    "mrblog": SourceDefinition("mrblog", "미블", "https://www.mrblog.net", "mixed", "dynamic"),
    "4blog": SourceDefinition("4blog", "포블로그", "https://4blog.net", "blog", "static"),
    "seouloppa": SourceDefinition("seouloppa", "서울오빠", "https://www.seoulouba.co.kr", "mixed", "static"),
    "ringble": SourceDefinition("ringble", "링블", "https://www.ringble.co.kr", "mixed", "static"),
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

SEOULOUPPA_BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/137.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
}

SEOULOUPPA_FETCH_TIMEOUT = 20

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

CHEHUMVIEW_BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/137.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://chvu.co.kr/campaign?sort=latest",
}

CHEHUMVIEW_CATEGORY_URLS = (
    ("search", "https://chvu.co.kr/campaign?sort=latest"),
    ("ad", "https://chvu.co.kr/campaign?sort=latest"),
)

CHEHUMVIEW_CHANNEL_MAP = {
    "blog": "blog",
    "insta": "instagram",
    "instagram": "instagram",
    "youtube": "youtube",
    "clip": "instagram",
}

CHEHUMVIEW_SERVICE_MAP = {
    "hotplaces": "맛집",
    "beauty": "뷰티/건강",
    "life": "생활",
    "food": "식품",
    "fashion": "패션/잡화",
    "kids": "유아동",
    "digital": "디지털",
    "sports": "운동/건강",
    "travel": "숙박",
}

REVIEWPLACE_LISTING_URLS = tuple(
    f"https://www.reviewplace.co.kr/pr/?ct1={quote(value)}"
    for value in ("제품", "지역", "기자단", "구매평")
)

REVIEWPLACE_BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/137.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
}

REVIEWPLACE_PLATFORM_MAP = {
    "blog": "blog",
    "블로그": "blog",
    "인스타": "instagram",
    "insta": "instagram",
    "instagram": "instagram",
    "릴스": "instagram",
    "클립": "instagram",
    "reels": "instagram",
    "youtube": "youtube",
    "유튜브": "youtube",
    "쇼츠": "youtube",
    "shorts": "youtube",
    "더블리뷰": "mixed",
    "멀티리뷰": "mixed",
}

REVIEWPLACE_NON_REGION_TOKENS = {
    "기자단",
    "방문형기자단",
    "방문형",
    "참여형",
    "원고형",
    "회수형",
    "어플체험",
    "구매평",
    "구매평리뷰",
    "쿠팡",
    "로켓프레시",
    "스마트스토어",
    "마켓컬리",
    "자사몰",
    "스스",
    *REVIEWPLACE_PLATFORM_MAP.keys(),
}

REVIEWPLACE_CAMPAIGN_TYPE_MAP = {
    "제품": "delivery",
    "지역": "visit",
    "기자단": "content",
    "구매평": "purchase",
}

REVIEWPLACE_FETCH_TIMEOUT = 20

MODAN_FETCH_TIMEOUT = 20

MODAN_BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/137.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
}

MODAN_BOARD_CONFIGS = (
    ("matzip", "맛집", "visit"),
    ("beauty", "뷰티/건강", "visit"),
    ("lodging", "숙박", "visit"),
    ("product", "제품/서비스", None),
    ("delivery", "배송", "delivery"),
    ("culture", "문화/스포츠", "visit"),
    ("various", "기타", None),
    ("reporters", "기자단", "content"),
)

MODAN_SECTION_MARKERS = (
    "체험 제공 혜택",
    "모집 대상 및 인원",
    "리뷰 미션 안내",
    "모집 및 진행 일정",
    "배송 및 체험 안내",
    "이런 분께 추천합니다",
    "매장 정보",
    "✅ 체크사항",
    "⚠️ 주의사항",
)

MODAN_INLINE_FIELD_LABELS = (
    "신청조건",
    "주소",
    "상세주소",
    "방문주소",
    "키워드",
    "방문일",
    "기타/특이사항",
    "참고 사항",
    "모집 인원",
    "모집기간",
    "체험 방식",
    "방문 여부",
    "제품 수령",
)

RINGBLE_BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/137.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
}

RINGBLE_FETCH_TIMEOUT = 20

RINGBLE_LISTING_CATEGORIES = (
    ("829", "제품", "mixed", None),
    ("832", "방문", "blog", "visit"),
    ("1015", "인스타", "instagram", None),
    ("833", "유튜브", "youtube", None),
    ("834", "기자단", "blog", "content"),
)

RINGBLE_NON_REGION_TOKENS = {
    *REVIEWPLACE_NON_REGION_TOKENS,
    "인스타",
    "릴스",
    "릴스&피드",
    "릴스피드",
    "피드",
    "유튜브",
    "쇼츠",
    "기자단",
    "구매평+포스팅",
    "구매평-포스팅",
    "프리미엄",
    "도서",
    "사진 촬영 체험단",
    "사진촬영체험단",
    "원고료 포함",
    "포인트 추가지급",
}

RINGBLE_TITLE_PLATFORM_MAP = {
    "인스타": "instagram",
    "릴스": "instagram",
    "릴스&피드": "instagram",
    "피드": "instagram",
    "유튜브": "youtube",
    "쇼츠": "youtube",
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
    if location_text:
        enriched["exact_location"] = _strip_tags(location_text)

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


def _parse_iso_date(value: str | None) -> str | None:
    if not value:
        return None
    try:
        return date.fromisoformat(str(value).replace("Z", "+00:00").split("T")[0]).isoformat()
    except Exception:
        try:
            return date.fromisoformat(str(value)[:10]).isoformat()
        except Exception:
            return None


def _parse_reviewplace_mmdd_range(value: str | None) -> tuple[str | None, str | None]:
    if not value:
        return None, None
    match = re.search(r"(\d{2})\.(\d{2})\s*[~\-]\s*(\d{2})\.(\d{2})", value)
    if not match:
        return None, None
    sm, sd, em, ed = [int(part) for part in match.groups()]
    today = date.today()
    start_year = today.year
    end_year = today.year
    if sm < today.month - 6:
        start_year += 1
    if em < today.month - 6:
        end_year += 1
    return date(start_year, sm, sd).isoformat(), date(end_year, em, ed).isoformat()


def _normalize_prefixed_image_url(base_url: str, value: str | None) -> str | None:
    if not value:
        return None
    raw = str(value).strip()
    if not raw:
        return None
    return urljoin(base_url, raw)


def _build_ringble_listing_url(category_id: str, page: int) -> str:
    if page <= 1:
        return f"https://www.ringble.co.kr/category.php?category={category_id}"
    return f"https://www.ringble.co.kr/category.php?start={page}&category={category_id}"


def _extract_ringble_listing_page_count(html: str, category_id: str) -> int:
    matches = [
        int(value)
        for value in re.findall(
            rf"/category\.php\?start=(\d+)&category={category_id}",
            html,
        )
    ]
    return max(matches) if matches else 1


def _is_ringble_region_token(token: str) -> bool:
    compact = token.strip().replace(" ", "")
    if not compact or compact in RINGBLE_NON_REGION_TOKENS:
        return False
    if compact in FOUR_BLOG_LOCATION_PREFIXES:
        return True
    if compact.endswith(("시", "군", "구", "도", "읍", "면", "동")):
        return True
    return bool(re.fullmatch(r"[가-힣]{2,4}", compact))


def _clean_ringble_title(title: str) -> tuple[str, str | None, str | None, list[str]]:
    annotations, cleaned = _split_4blog_title_annotations(title)
    region_primary = None
    region_secondary = None
    tags: list[str] = []

    for token in annotations:
        normalized = token.strip()
        if not normalized:
            continue
        if "/" in normalized:
            left, right = [part.strip() for part in normalized.split("/", 1)]
            if _is_ringble_region_token(left):
                if not region_primary:
                    region_primary = left
                if not region_secondary:
                    region_secondary = right or None
                continue
        if _is_ringble_region_token(normalized):
            if not region_primary:
                region_primary = normalized
            continue
        tags.append(normalized)

    return cleaned or title.strip(), region_primary, region_secondary, tags


def _infer_ringble_platform_type(
    raw_title: str,
    icon_src: str | None,
    default_platform_type: str | None,
) -> str:
    annotations, _cleaned = _split_4blog_title_annotations(raw_title)
    for token in annotations:
        mapped = RINGBLE_TITLE_PLATFORM_MAP.get(token.strip())
        if mapped:
            return mapped

    if default_platform_type and default_platform_type != "mixed":
        return default_platform_type

    icon_text = (icon_src or "").lower()
    if "iconinsta" in icon_text:
        return "instagram"
    if "iconyoutube" in icon_text:
        return "youtube"
    if "iconbuy" in icon_text:
        return default_platform_type or "mixed"
    if "iconblog" in icon_text:
        return "blog"
    return default_platform_type or "blog"


def _infer_ringble_campaign_type(
    raw_title: str,
    category_id: str,
    region_primary: str | None,
    region_secondary: str | None,
    platform_type: str,
    default_campaign_type: str | None,
) -> str:
    if category_id == "834" or "기자단" in raw_title:
        return "content"
    if "구매평" in raw_title:
        return "purchase"
    if category_id == "832" or region_primary or region_secondary or "방문" in raw_title:
        return "visit"
    if category_id == "829":
        return "delivery"
    if platform_type in {"instagram", "youtube"}:
        return "content"
    return default_campaign_type or "visit"


def _extract_ringble_reward_text(block: str) -> str | None:
    value = _extract_first(r">(\+[0-9,\s]+(?:원|P))</div>", block, re.S)
    if not value:
        return None
    return " ".join(value.split())


def _parse_ringble_recruit_count(block: str) -> int | None:
    patterns = (
        re.compile(
            r"graph_percent.*?<font[^>]*>\s*[0-9,]+\s*명\s*</font>\s*/\s*<font[^>]*>\s*([0-9,]+)\s*명\s*</font>",
            re.S,
        ),
        re.compile(r"신청\s*[0-9,]+\s*(?:명)?\s*/\s*모집\s*([0-9,]+)\s*(?:명)?"),
        re.compile(r"모집\s*([0-9,]+)\s*</font>", re.S),
        re.compile(r"모집\s*([0-9,]+)\s*(?:명)?"),
    )
    plain_text = _strip_tags(block)
    for pattern in patterns:
        target = block if pattern.flags & re.S else plain_text
        match = pattern.search(target)
        if not match:
            continue
        try:
            return int(match.group(1).replace(",", ""))
        except Exception:
            continue
    return None


def _parse_ringble_date_range(value: str | None) -> tuple[str | None, str | None]:
    if not value:
        return None, None
    normalized = " ".join(html_lib.unescape(value).split())
    match = re.search(
        r"(\d{2})년\s*(\d{2})월\s*(\d{2})일.*?[~–-]\s*(\d{2})년\s*(\d{2})월\s*(\d{2})일",
        normalized,
    )
    if not match:
        return None, None
    try:
        sy, sm, sd, ey, em, ed = [int(part) for part in match.groups()]
        return date(2000 + sy, sm, sd).isoformat(), date(2000 + ey, em, ed).isoformat()
    except Exception:
        return None, None


def _extract_ringble_mission_html(detail_html: str) -> str | None:
    patterns = (
        r"리뷰어 미션.*?<td[^>]*class=\"font11\">(.*?)</td>",
        r"구매 안내사항.*?<td[^>]*class=\"font11\">(.*?)</td>",
    )
    for pattern in patterns:
        block = _extract_first(pattern, detail_html, re.S)
        if block:
            return block
    return None


def _extract_ringble_exact_location(detail_html: str) -> str | None:
    decoded = html_lib.unescape(detail_html)
    patterns = (
        r"(?:위치|주소|방문주소|매장주소)\s*[:：]\s*([^<]{6,140})",
        r"(?:위치|주소|방문주소|매장주소)\s*[:：]\s*([^\n]{6,140})",
    )
    for pattern in patterns:
        match = re.search(pattern, decoded, re.S)
        if not match:
            continue
        value = " ".join(_strip_tags(match.group(1)).replace(" - ", " ").split())
        if value:
            return value
    return None


def _parse_region_tokens_from_title(title: str) -> tuple[str | None, str | None, list[str]]:
    annotations, cleaned = _split_4blog_title_annotations(title)
    parts: list[str] = []
    for annotation in annotations:
        parts.extend(part.strip() for part in annotation.split("/") if part.strip())

    region_tokens = [part for part in parts if part not in REVIEWPLACE_NON_REGION_TOKENS]
    primary = region_tokens[0] if region_tokens else None
    secondary = region_tokens[1] if len(region_tokens) > 1 else None
    return primary, secondary, parts


def transform_chehumview_campaign(item: dict, source_id: str | None = None, detail: dict | None = None) -> dict:
    detail = detail or {}
    raw_title = str(detail.get("title") or item.get("title") or "").strip()
    cleaned_title = _split_4blog_title_annotations(raw_title)[1]
    region_primary, region_secondary, title_tokens = _parse_region_tokens_from_title(raw_title)

    exact_location = None
    address_1 = str(detail.get("address_1") or "").strip()
    address_2 = str(detail.get("address_2") or "").strip()
    if address_1:
        exact_location = " ".join(part for part in [address_1, address_2] if part).strip()
        address_parts = address_1.split()
        if not region_primary and address_parts:
            region_primary = address_parts[0]
        if address_parts and len(address_parts) > 1:
            region_secondary = address_parts[1]

    channel = str(detail.get("channel") or item.get("channel") or "").lower()
    platform_type = CHEHUMVIEW_CHANNEL_MAP.get(channel, "etc")
    activity = str(detail.get("activity") or item.get("activity") or "").lower()
    campaign_type = activity if activity in {"visit", "delivery", "purchase", "content"} else "etc"

    category_name = CHEHUMVIEW_SERVICE_MAP.get(str(detail.get("service") or item.get("service") or "").lower())
    if campaign_type == "visit" and not category_name:
        category_name = "지역"

    raw_status = str(detail.get("status") or item.get("status") or "active").lower()
    published_at = _parse_iso_date(detail.get("appl_start_date"))
    apply_deadline = _parse_iso_date(detail.get("appl_end_date")) or _parse_iso_date(item.get("closeAt"))
    snippet = str(detail.get("subtitle") or item.get("subtitle") or "").strip() or None

    return {
        "source_id": source_id,
        "title": cleaned_title,
        "original_url": f"https://chvu.co.kr/campaign/{detail.get('campaign_id') or item.get('campaignId')}",
        "platform_type": platform_type,
        "campaign_type": campaign_type,
        "category_name": category_name,
        "subcategory_name": str(detail.get("content_type") or item.get("contentType") or "").strip() or None,
        "region_primary_name": region_primary,
        "region_secondary_name": region_secondary,
        "exact_location": exact_location,
        "benefit_text": snippet,
        "recruit_count": detail.get("reviewer_limit") or item.get("reviewerLimit"),
        "apply_deadline": apply_deadline,
        "published_at": published_at,
        "thumbnail_url": _normalize_prefixed_image_url("https://chvu.co.kr", detail.get("main_img") or item.get("mainImg")),
        "snippet": snippet,
        "raw_status": raw_status,
        "status": "expired" if raw_status in {"closed", "expired"} else "active",
        "requires_review": False,
        "raw_payload": {
            "product_link": detail.get("product_link"),
            "hashtags": detail.get("hashtags"),
            "search_keyword": detail.get("search_keyword"),
            "title_tokens": title_tokens,
        },
    }


def _reviewplace_ct1_from_url(listing_url: str) -> str | None:
    return _extract_query_params(listing_url).get("ct1")


def _reviewplace_platform_from_tokens(tokens: list[str], fallback: str | None = None) -> str:
    for token in tokens:
        mapped = REVIEWPLACE_PLATFORM_MAP.get(token.lower()) or REVIEWPLACE_PLATFORM_MAP.get(token)
        if mapped:
            return mapped
    if fallback:
        mapped = REVIEWPLACE_PLATFORM_MAP.get(fallback.lower()) or REVIEWPLACE_PLATFORM_MAP.get(fallback)
        if mapped:
            return mapped
    return "blog"


def parse_reviewplace_listing(html: str, listing_url: str, source_id: str | None = None) -> list[dict]:
    ct1 = _reviewplace_ct1_from_url(listing_url)
    pattern = re.compile(
        r"<div class='item'>\s*<a href='(/pr/\?id=(\d+))'>.*?"
        r'<img src="([^"]+)" class="thumbimg".*?'
        r"<p class='tit'>(.*?)</p>.*?"
        r"<p class='txt'>(.*?)</p>.*?"
        r"<p class='date'><em class='d_ico'>D</em>\s*-\s*([0-9]+)</p>.*?"
        r"<p>신청\s*([0-9]+)<span>\s*/\s*([0-9]+)명</span></p>.*?"
        r"<div class='tag_wrap'>(.*?)</div>",
        re.S,
    )
    items: list[dict] = []
    for match in pattern.finditer(html):
        relative_url, campaign_id, thumbnail_url, raw_title, raw_desc, remaining_days, applied, recruit, tag_wrap = match.groups()
        title = _strip_tags(raw_title)
        primary, secondary, tokens = _parse_region_tokens_from_title(title)
        benefit_text = _strip_tags(raw_desc)
        tag_text = _strip_tags(tag_wrap)
        platform_type = _reviewplace_platform_from_tokens(tokens, fallback=tag_text)
        items.append(
            {
                "source_id": source_id,
                "campaign_id": campaign_id,
                "title": _split_4blog_title_annotations(title)[1],
                "original_url": urljoin("https://www.reviewplace.co.kr", relative_url),
                "platform_type": platform_type,
                "campaign_type": REVIEWPLACE_CAMPAIGN_TYPE_MAP.get(ct1 or "", "etc"),
                "category_name": ct1 if ct1 in {"제품", "지역"} else None,
                "subcategory_name": ct1 if ct1 in {"기자단", "구매평"} else tag_text or None,
                "region_primary_name": primary,
                "region_secondary_name": secondary,
                "benefit_text": benefit_text,
                "recruit_count": int(recruit) if recruit else None,
                "apply_deadline": (date.today() + timedelta(days=int(remaining_days))).isoformat() if remaining_days else None,
                "published_at": None,
                "thumbnail_url": thumbnail_url,
                "snippet": benefit_text,
                "raw_status": "active",
                "status": "active",
                "requires_review": False,
            }
        )
    return items


def enrich_reviewplace_detail(item: dict, detail_html: str) -> dict:
    enriched = dict(item)
    detail_title = _extract_first(r'<div class="cmp_title"[^>]*>.*?</div>([^<]+)</div>', detail_html, re.S)
    if detail_title:
        title = _strip_tags(detail_title)
        enriched["title"] = _split_4blog_title_annotations(title)[1]
        primary, secondary, tokens = _parse_region_tokens_from_title(title)
        if not enriched.get("region_primary_name"):
            enriched["region_primary_name"] = primary
        if not enriched.get("region_secondary_name"):
            enriched["region_secondary_name"] = secondary
        enriched["platform_type"] = _reviewplace_platform_from_tokens(tokens, fallback=enriched.get("platform_type"))

    benefit_text = _extract_first(r"<dt>제공내역</dt>\s*<dd[^>]*class=\"bstyle\"[^>]*>(.*?)</dd>", detail_html, re.S)
    if benefit_text:
        cleaned = _strip_tags(benefit_text)
        enriched["benefit_text"] = cleaned
        enriched["snippet"] = cleaned

    address_text = _extract_first(r"<dt>방문주소</dt>\s*<dd[^>]*class=\"bstyle\"[^>]*>(.*?)<div id=\"map\"></div>", detail_html, re.S)
    if address_text:
        cleaned_address = _strip_tags(address_text)
        enriched["exact_location"] = cleaned_address
        address_parts = cleaned_address.split()
        if not enriched.get("region_primary_name") and address_parts:
            enriched["region_primary_name"] = address_parts[0]
        if not enriched.get("region_secondary_name") and len(address_parts) > 1:
            enriched["region_secondary_name"] = address_parts[1]

    period_text = _extract_first(r"<span class=\"tlabel\">모집기간</span>\s*<span class=\"fm_num\">([^<]+)</span>", detail_html, re.S)
    published_at, apply_deadline = _parse_reviewplace_mmdd_range(period_text)
    if published_at:
        enriched["published_at"] = published_at
    if apply_deadline:
        enriched["apply_deadline"] = apply_deadline

    channel = _extract_first(r'<input type="hidden" name="rchannel" id="rchannel" value="([^"]+)"', detail_html)
    if channel:
        enriched["platform_type"] = _reviewplace_platform_from_tokens([], fallback=channel)

    recruit_match = re.search(r"신청한 리뷰어 <em id='cmp_curr_num'>\s*([0-9]+)\s*/\s*([0-9]+)\s*</em>", detail_html)
    if recruit_match:
        enriched["recruit_count"] = int(recruit_match.group(2))

    product_link = _extract_first(r'<input type="hidden" id="wr_link1" value="([^"]+)"', detail_html)
    if product_link:
        payload = dict(enriched.get("raw_payload") or {})
        payload["product_link"] = product_link
        enriched["raw_payload"] = payload

    return enriched


def parse_ringble_listing(
    html: str,
    default_category_name: str | None = None,
    default_platform_type: str | None = None,
    default_campaign_type: str | None = None,
    source_id: str | None = None,
) -> list[dict]:
    pattern = re.compile(
        r"<td><a href='(detail\.php\?number=(\d+)&category=(\d+))' class=\"list_title\"[^>]*font-size:14px;[^>]*>(.*?)</a>",
        re.S,
    )
    matches = list(pattern.finditer(html))
    items: list[dict] = []

    for index, match in enumerate(matches):
        relative_url, campaign_id, category_id, raw_title_html = match.groups()
        block_start = max(0, match.start() - 1400)
        block_end = matches[index + 1].start() if index + 1 < len(matches) else min(len(html), match.end() + 1400)
        block = html[block_start:block_end]

        raw_title = html_lib.unescape(_strip_tags(raw_title_html))
        title, region_primary, region_secondary, tags = _clean_ringble_title(raw_title)
        icon_src = _extract_first(r"(upload/happy_config/Icon[^\"']+\.png)", block)
        platform_type = _infer_ringble_platform_type(raw_title, icon_src, default_platform_type)
        campaign_type = _infer_ringble_campaign_type(
            raw_title,
            category_id,
            region_primary,
            region_secondary,
            platform_type,
            default_campaign_type,
        )
        d_day = _extract_first(
            rf"<a href='{re.escape(relative_url)}' class=\"list_title\"[^>]*font-size:12px;[^>]*>([^<]+)</a>",
            block,
            re.S,
        ) or _extract_first(r'<strong class="ico_comm ico_today_open ">([^<]+)</strong>', block, re.S)
        snippet_text = _extract_first(
            r'<tr><td style="padding-top:5px;font-size:\s*11px;color:#aaaaaa; line-height:15px;">(.*?)</td></tr>',
            block,
            re.S,
        )
        reward_text = _extract_ringble_reward_text(block)
        benefit_bits = []
        if snippet_text:
            benefit_bits.append(_strip_tags(snippet_text))
        if reward_text:
            benefit_bits.append(reward_text)
        benefit_text = " ".join(dict.fromkeys(part for part in benefit_bits if part)).strip() or None
        thumbnail_url = _normalize_prefixed_image_url(
            "https://www.ringble.co.kr/",
            _extract_first(rf"<a href='{re.escape(relative_url)}'><img src=\"([^\"]+)\"", block, re.S),
        )
        recruit_count = _parse_ringble_recruit_count(block)

        items.append(
            {
                "source_id": source_id,
                "campaign_id": campaign_id,
                "title": title,
                "original_url": urljoin("https://www.ringble.co.kr/", relative_url),
                "platform_type": platform_type,
                "campaign_type": campaign_type,
                "category_name": default_category_name,
                "subcategory_name": tags[0] if tags else None,
                "region_primary_name": region_primary,
                "region_secondary_name": region_secondary,
                "benefit_text": benefit_text,
                "recruit_count": recruit_count,
                "apply_deadline": _estimate_deadline_from_d_label(d_day),
                "published_at": None,
                "thumbnail_url": thumbnail_url,
                "snippet": benefit_text,
                "raw_status": "active",
                "status": "active",
                "requires_review": False,
                "raw_payload": {
                    "listing_category_id": category_id,
                    "icon_src": icon_src,
                    "reward_text": reward_text,
                    "title_tags": tags,
                },
            }
        )

    return items


def enrich_ringble_detail(item: dict, detail_html: str) -> dict:
    enriched = dict(item)
    detail_title = _extract_first(r'<td class="detail_page_title">\s*(.*?)\s*</td>', detail_html, re.S)
    if not detail_title:
        detail_title = _extract_first(r'<meta property="og:title"\s+content="([^"]+)"', detail_html)
    if detail_title:
        raw_title = html_lib.unescape(_strip_tags(detail_title))
        title, region_primary, region_secondary, tags = _clean_ringble_title(raw_title)
        enriched["title"] = title
        if not enriched.get("region_primary_name"):
            enriched["region_primary_name"] = region_primary
        if not enriched.get("region_secondary_name"):
            enriched["region_secondary_name"] = region_secondary
        if tags and not enriched.get("subcategory_name"):
            enriched["subcategory_name"] = tags[0]

    thumbnail_url = _extract_first(r'<meta property="og:image"\s+content="([^"]+)"', detail_html)
    if not thumbnail_url:
        thumbnail_url = _extract_first(r"<img src='([^']+)' id='image_large_0'", detail_html, re.S)
    if thumbnail_url:
        enriched["thumbnail_url"] = _normalize_prefixed_image_url("https://www.ringble.co.kr/", thumbnail_url)

    recruit_count = _parse_ringble_recruit_count(detail_html)
    if recruit_count is not None:
        enriched["recruit_count"] = recruit_count

    period_text = _extract_first(r"모집 기간</td>\s*<td[^>]*>(.*?)</td>", detail_html, re.S)
    published_at, apply_deadline = _parse_ringble_date_range(period_text)
    if published_at:
        enriched["published_at"] = published_at
    if apply_deadline:
        enriched["apply_deadline"] = apply_deadline

    benefit_block = _extract_first(r"제공내역.*?<td[^>]*class=\"font11\">(.*?)</td>", detail_html, re.S)
    benefit_text = _strip_tags(benefit_block) if benefit_block else None

    mission_html = _extract_ringble_mission_html(detail_html)
    mission_text = _strip_tags(mission_html) if mission_html else None
    if benefit_text:
        enriched["benefit_text"] = benefit_text
        enriched["snippet"] = benefit_text
    elif mission_text:
        enriched["snippet"] = mission_text

    exact_location = _extract_ringble_exact_location(mission_html or detail_html)
    if exact_location:
        enriched["exact_location"] = exact_location
        region_primary, region_secondary = _infer_region_from_address_text(exact_location)
        if region_primary and not enriched.get("region_primary_name"):
            enriched["region_primary_name"] = region_primary
        if region_secondary and not enriched.get("region_secondary_name"):
            enriched["region_secondary_name"] = region_secondary

    site_url = _extract_first(r"상세 URL.*?<a href='([^']+)'", detail_html, re.S)
    if not site_url:
        site_url = _extract_first(r'상세 URL.*?<a href="([^"]+)"', detail_html, re.S)
    payload = dict(enriched.get("raw_payload") or {})
    if site_url:
        payload["site_url"] = site_url
    if mission_text:
        payload["mission_excerpt"] = mission_text[:400]
    if payload:
        enriched["raw_payload"] = payload

    category_id = str(payload.get("listing_category_id") or _extract_query_params(enriched["original_url"]).get("category") or "")
    enriched["platform_type"] = _infer_ringble_platform_type(
        enriched["title"],
        str(payload.get("icon_src") or ""),
        enriched.get("platform_type"),
    )
    enriched["campaign_type"] = _infer_ringble_campaign_type(
        enriched["title"],
        category_id,
        enriched.get("region_primary_name"),
        enriched.get("region_secondary_name"),
        enriched.get("platform_type") or "blog",
        enriched.get("campaign_type"),
    )
    return enriched


def _build_modan_listing_url(board_path: str, page: int) -> str:
    return f"https://www.modan.kr/{board_path.strip('/')}/?&page={page}&sort=recent"


def _parse_modan_date_range(value: str | None) -> tuple[str | None, str | None]:
    if not value:
        return None, None
    match = re.search(
        r"(\d{4})[.-](\d{1,2})[.-](\d{1,2})\s*[~–]\s*(\d{4})[.-](\d{1,2})[.-](\d{1,2})",
        value,
    )
    if not match:
        return None, None
    sy, sm, sd, ey, em, ed = [int(part) for part in match.groups()]
    return date(sy, sm, sd).isoformat(), date(ey, em, ed).isoformat()


def _extract_modan_labeled_value(text: str | None, label: str) -> str | None:
    if not text:
        return None
    boundaries = [f"{name} :" for name in MODAN_INLINE_FIELD_LABELS if name != label]
    boundaries.extend(f"{name}:" for name in MODAN_INLINE_FIELD_LABELS if name != label)
    boundaries.extend(MODAN_SECTION_MARKERS)
    boundary_pattern = "|".join(re.escape(boundary) for boundary in boundaries)
    match = re.search(
        rf"{re.escape(label)}\s*[:：]\s*(.+?)(?=(?:{boundary_pattern})|$)",
        text,
        re.S,
    )
    if not match:
        return None
    return " ".join(match.group(1).split()).strip() or None


def _extract_modan_platform_type(text: str | None) -> str | None:
    if not text:
        return None
    platforms: list[str] = []
    if re.search(r"네이버\s*블로그|블로그", text, re.I):
        platforms.append("blog")
    if re.search(r"인스타그램|인스타|릴스|클립", text, re.I):
        platforms.append("instagram")
    if re.search(r"유튜브|쇼츠", text, re.I):
        platforms.append("youtube")
    if re.search(r"페이스북|스레드|threads", text, re.I):
        platforms.append("etc")
    unique = list(dict.fromkeys(platforms))
    if not unique:
        return None
    if len(unique) > 1:
        return "mixed"
    return unique[0]


def _extract_modan_template_text(detail_html: str) -> str | None:
    for template_id in ("prodDetailPC", "prodDetailMobile"):
        raw_template = _extract_first(rf'<template id="{template_id}">(.*?)</template>', detail_html, re.S)
        if not raw_template:
            continue
        compact = raw_template.split("<!-- ================================================")[0]
        text = _strip_tags(compact)
        if text:
            return text
    return None


def _infer_modan_campaign_type(
    board_path: str,
    title: str,
    detail_text: str | None,
    exact_location: str | None,
    default_campaign_type: str | None,
) -> str:
    text = " ".join(part for part in (title, detail_text or "") if part)
    if board_path == "reporters" or "기자단" in text:
        return "content"
    if "구매평" in text:
        return "purchase"
    if (
        board_path == "delivery"
        or "택배/배송" in text
        or "배송 제품 체험" in text
        or "방문 불필요" in text
        or "택배 발송" in text
    ):
        return "delivery"
    if exact_location or board_path in {"matzip", "beauty", "lodging", "culture"} or "방문일" in text:
        return "visit"
    return default_campaign_type or "delivery"


def _normalize_modan_regions(primary: str | None, secondary: str | None) -> tuple[str | None, str | None]:
    if primary and not secondary and " " in primary:
        first, second = primary.split(None, 1)
        if first in FOUR_BLOG_LOCATION_PREFIXES:
            return first, second or None
    return primary, secondary


class ModanListingHTMLParser(HTMLParser):
    def __init__(
        self,
        listing_url: str,
        category_name: str | None,
        default_campaign_type: str | None,
        source_id: str | None = None,
    ):
        super().__init__(convert_charrefs=True)
        self.listing_url = listing_url
        self.category_name = category_name
        self.default_campaign_type = default_campaign_type
        self.source_id = source_id
        self.items: list[dict[str, Any]] = []
        self.current: dict[str, Any] | None = None
        self.item_div_depth = 0
        self.capture_key: str | None = None
        self.capture_parts: list[str] = []
        self.capture_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr_map = {key: value or "" for key, value in attrs}
        classes = set(attr_map.get("class", "").split())

        if tag == "div" and {"shop-item", "_shop_item"} <= classes:
            self.current = {
                "source_id": self.source_id,
                "listing_url": self.listing_url,
                "category_name": self.category_name,
                "default_campaign_type": self.default_campaign_type,
            }
            self.item_div_depth = 1
            properties_raw = attr_map.get("data-product-properties", "").strip()
            if properties_raw:
                try:
                    self.current["product_properties"] = json.loads(html_lib.unescape(properties_raw))
                except Exception:
                    self.current["product_properties"] = {}
            return

        if not self.current:
            return

        if tag == "div":
            self.item_div_depth += 1

        if tag == "a" and "?idx=" in attr_map.get("href", "") and not self.current.get("original_url"):
            self.current["original_url"] = urljoin("https://www.modan.kr", attr_map["href"])
        elif tag == "img" and "org_img" in classes and attr_map.get("src") and not self.current.get("thumbnail_url"):
            self.current["thumbnail_url"] = attr_map["src"].strip()

        if self.capture_key:
            self.capture_depth += 1
            return

        if tag == "h2" and "shop-title" in classes:
            self._start_capture("title")
        elif tag == "div" and "item-summary" in classes:
            self._start_capture("summary")

    def handle_endtag(self, tag: str) -> None:
        if self.capture_key:
            self.capture_depth -= 1
            if self.capture_depth == 0:
                self._finish_capture()

        if self.current and tag == "div":
            self.item_div_depth -= 1
            if self.item_div_depth == 0:
                finalized = self._finalize_current()
                if finalized:
                    self.items.append(finalized)
                self.current = None

    def handle_data(self, data: str) -> None:
        if self.capture_key and self.current is not None:
            self.capture_parts.append(data)

    def _start_capture(self, key: str) -> None:
        self.capture_key = key
        self.capture_parts = []
        self.capture_depth = 1

    def _finish_capture(self) -> None:
        if not self.current or not self.capture_key:
            self.capture_key = None
            self.capture_parts = []
            self.capture_depth = 0
            return
        text = " ".join("".join(self.capture_parts).split()).strip()
        if text:
            self.current[self.capture_key] = text
        self.capture_key = None
        self.capture_parts = []
        self.capture_depth = 0

    def _finalize_current(self) -> dict[str, Any] | None:
        if not self.current:
            return None
        product_properties = self.current.get("product_properties") or {}
        raw_title = str(self.current.get("title") or product_properties.get("name") or "").strip()
        original_url = str(self.current.get("original_url") or "").strip()
        if not raw_title or not original_url:
            return None
        title = _split_4blog_title_annotations(raw_title)[1]
        region_primary, region_secondary, _tokens = _parse_region_tokens_from_title(raw_title)
        region_primary, region_secondary = _normalize_modan_regions(region_primary, region_secondary)
        summary = _strip_tags(self.current.get("summary") or "").replace("상품 요약설명", "").strip()
        product_code = str(product_properties.get("code") or "").strip() or None
        thumbnail_url = self.current.get("thumbnail_url") or product_properties.get("image_url")

        return {
            "source_id": self.source_id,
            "campaign_id": str(product_properties.get("idx") or _extract_query_params(original_url).get("idx") or ""),
            "title": title,
            "original_url": original_url,
            "platform_type": "mixed",
            "campaign_type": _infer_modan_campaign_type(
                urlsplit(original_url).path.strip("/"),
                raw_title,
                summary,
                None,
                self.default_campaign_type,
            ),
            "category_name": self.category_name,
            "subcategory_name": None,
            "region_primary_name": region_primary,
            "region_secondary_name": region_secondary,
            "benefit_text": summary or None,
            "recruit_count": None,
            "apply_deadline": None,
            "published_at": None,
            "thumbnail_url": thumbnail_url,
            "snippet": summary or None,
            "raw_status": "active",
            "status": "active",
            "requires_review": False,
            "raw_payload": {
                "board_path": urlsplit(original_url).path.strip("/"),
                "product_code": product_code,
            },
        }


def parse_modan_listing(
    html: str,
    listing_url: str,
    category_name: str | None,
    default_campaign_type: str | None,
    source_id: str | None = None,
) -> list[dict]:
    parser = ModanListingHTMLParser(
        listing_url=listing_url,
        category_name=category_name,
        default_campaign_type=default_campaign_type,
        source_id=source_id,
    )
    parser.feed(html)
    parser.close()
    return parser.items


def enrich_modan_detail(item: dict, detail_html: str) -> dict:
    enriched = dict(item)
    canonical_url = _extract_first(r'<link rel="canonical" href="([^"]+)"', detail_html)
    if canonical_url:
        enriched["original_url"] = canonical_url

    detail_title = _extract_first(r'<h1 class="view_tit[^"]*"[^>]*>(.*?)<div class="ns-icon', detail_html, re.S)
    if not detail_title:
        detail_title = _extract_first(r'<meta id=\'meta_og_title\' property=\'og:title\' content=\'([^\']+)\'', detail_html)
    raw_title = _strip_tags(detail_title) if detail_title else item.get("title", "")
    if raw_title:
        enriched["title"] = _split_4blog_title_annotations(raw_title)[1]
        primary, secondary, _tokens = _parse_region_tokens_from_title(raw_title)
        primary, secondary = _normalize_modan_regions(primary, secondary)
        if not enriched.get("region_primary_name"):
            enriched["region_primary_name"] = primary
        if not enriched.get("region_secondary_name"):
            enriched["region_secondary_name"] = secondary

    summary_html = _extract_first(
        r'<div class="goods_summary[^"]*">\s*<div class="fr-view">\s*(.*?)\s*</div>\s*</div>',
        detail_html,
        re.S,
    )
    summary_text = _strip_tags(summary_html) if summary_html else None
    if summary_text:
        enriched["benefit_text"] = summary_text
        enriched["snippet"] = summary_text

    template_text = _extract_modan_template_text(detail_html)
    meta_description = _extract_first(r"<meta name='description' content='([^']+)'", detail_html)
    detail_text = " ".join(part for part in (template_text, meta_description) if part)

    exact_location = _extract_modan_labeled_value(detail_text, "주소") or _extract_modan_labeled_value(detail_text, "방문주소")
    if exact_location:
        enriched["exact_location"] = exact_location
        if not enriched.get("region_primary_name") or not enriched.get("region_secondary_name"):
            primary, secondary = _infer_4blog_regions_from_detail_text(exact_location)
            if not enriched.get("region_primary_name"):
                enriched["region_primary_name"] = primary
            if not enriched.get("region_secondary_name"):
                enriched["region_secondary_name"] = secondary

    platform_type = _extract_modan_platform_type(detail_text)
    if platform_type:
        enriched["platform_type"] = platform_type

    published_at, apply_deadline = _parse_modan_date_range(_extract_modan_labeled_value(detail_text, "모집기간"))
    if published_at:
        enriched["published_at"] = published_at
    if apply_deadline:
        enriched["apply_deadline"] = apply_deadline

    recruit_text = _extract_modan_labeled_value(detail_text, "모집 인원") or detail_text
    recruit_match = re.search(r"모집\s*인원\s*[:：]?\s*([0-9]+)\s*명|([0-9]+)\s*명", recruit_text or "")
    if recruit_match:
        enriched["recruit_count"] = int(recruit_match.group(1) or recruit_match.group(2))

    board_path = str((enriched.get("raw_payload") or {}).get("board_path") or urlsplit(enriched["original_url"]).path.strip("/"))
    enriched["campaign_type"] = _infer_modan_campaign_type(
        board_path,
        raw_title,
        detail_text,
        enriched.get("exact_location"),
        item.get("campaign_type"),
    )

    payload = dict(enriched.get("raw_payload") or {})
    if template_text:
        payload["detail_excerpt"] = template_text
    enriched["raw_payload"] = payload
    return enriched


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


class ReviewPlaceSourceAdapter(PlaceholderSourceAdapter):
    def __init__(self, definition: SourceDefinition, page_limit: int = 20):
        super().__init__(definition)
        self.page_limit = page_limit

    def fetch(self) -> list[dict]:
        items: list[dict] = []
        seen_urls: set[str] = set()
        for listing_url in REVIEWPLACE_LISTING_URLS:
            try:
                listing_html = fetch_text_url(listing_url, headers=REVIEWPLACE_BROWSER_HEADERS, timeout=REVIEWPLACE_FETCH_TIMEOUT)
            except Exception:
                continue

            for item in parse_reviewplace_listing(listing_html, listing_url, source_id=self.definition.source_id):
                if item["original_url"] in seen_urls:
                    continue
                seen_urls.add(item["original_url"])
                items.append(item)

            for page in range(2, self.page_limit + 1):
                params = urlencode({"rpage": page, "device": "pc", **{k: v for k, v in _extract_query_params(listing_url).items() if v}})
                try:
                    fragment = fetch_text_url(
                        f"https://www.reviewplace.co.kr/theme/rp/_ajax_cmp_list_tpl.php?{params}",
                        headers=REVIEWPLACE_BROWSER_HEADERS,
                        timeout=REVIEWPLACE_FETCH_TIMEOUT,
                    )
                except Exception:
                    break
                batch = parse_reviewplace_listing(fragment, listing_url, source_id=self.definition.source_id)
                if not batch:
                    break
                new_count = 0
                for item in batch:
                    if item["original_url"] in seen_urls:
                        continue
                    seen_urls.add(item["original_url"])
                    items.append(item)
                    new_count += 1
                if new_count == 0:
                    break

        enriched: list[dict] = []
        for item in items:
            try:
                detail_html = fetch_text_url(item["original_url"], headers=REVIEWPLACE_BROWSER_HEADERS, timeout=REVIEWPLACE_FETCH_TIMEOUT)
            except Exception:
                detail_html = None
            enriched.append(enrich_reviewplace_detail(item, detail_html) if detail_html else item)
        return enriched


class ModanSourceAdapter(PlaceholderSourceAdapter):
    def __init__(
        self,
        definition: SourceDefinition,
        page_limit: int = 20,
        detail_limit: int | None = 160,
        board_configs: tuple[tuple[str, str, str | None], ...] = MODAN_BOARD_CONFIGS,
    ):
        super().__init__(definition)
        self.page_limit = page_limit
        self.detail_limit = detail_limit
        self.board_configs = board_configs

    def fetch(self) -> list[dict]:
        items: list[dict] = []
        seen_urls: set[str] = set()
        fetch_errors: list[str] = []

        for board_path, category_name, default_campaign_type in self.board_configs:
            for page in range(1, self.page_limit + 1):
                listing_url = _build_modan_listing_url(board_path, page)
                listing_candidates = [listing_url]
                if page == 1:
                    listing_candidates.insert(0, f"https://www.modan.kr/{board_path.strip('/')}")
                listing_html = None
                last_error: Exception | None = None
                for candidate_url in dict.fromkeys(listing_candidates):
                    try:
                        try:
                            listing_html = fetch_session_text(
                                "https://www.modan.kr/",
                                candidate_url,
                                headers={**MODAN_BROWSER_HEADERS, "Referer": "https://www.modan.kr/"},
                                timeout=MODAN_FETCH_TIMEOUT,
                            )
                        except Exception:
                            listing_html = fetch_text_url(
                                candidate_url,
                                headers={**MODAN_BROWSER_HEADERS, "Referer": "https://www.modan.kr/"},
                                timeout=MODAN_FETCH_TIMEOUT,
                            )
                        break
                    except Exception as exc:
                        last_error = exc
                if not listing_html:
                    if last_error:
                        fetch_errors.append(
                            f"listing fetch failed: {board_path} page={page} :: {_format_source_exception(last_error)}"
                        )
                    break

                batch = parse_modan_listing(
                    listing_html,
                    listing_url,
                    category_name=category_name,
                    default_campaign_type=default_campaign_type,
                    source_id=self.definition.source_id,
                )
                if not batch:
                    fetch_errors.append(f"listing parsed zero items: {board_path} page={page} bytes={len(listing_html)}")
                    break

                new_count = 0
                for item in batch:
                    if item["original_url"] in seen_urls:
                        continue
                    seen_urls.add(item["original_url"])
                    items.append(item)
                    new_count += 1
                if new_count == 0:
                    break

        prioritized = sorted(
            items,
            key=lambda item: (
                0 if item.get("campaign_type") == "visit" else 1,
                0 if item.get("category_name") in {"맛집", "뷰티/건강", "숙박", "문화/스포츠"} else 1,
                0 if item.get("region_primary_name") else 1,
                item.get("original_url") or "",
            ),
        )
        detail_targets = prioritized if self.detail_limit is None else prioritized[: self.detail_limit]
        detail_urls = {item["original_url"] for item in detail_targets}

        enriched: list[dict] = []
        for item in items:
            if item["original_url"] not in detail_urls:
                enriched.append(item)
                continue
            try:
                detail_html = fetch_text_url(
                    item["original_url"],
                    headers={**MODAN_BROWSER_HEADERS, "Referer": item["original_url"]},
                    timeout=MODAN_FETCH_TIMEOUT,
                )
            except Exception:
                detail_html = None
            enriched.append(enrich_modan_detail(item, detail_html) if detail_html else item)
        print(f"[modan] fetched listing_items={len(items)} detail_targets={len(detail_urls)} errors={len(fetch_errors)}")
        for error in fetch_errors[:20]:
            print(f"[modan] {error}")
        return enriched


class ChehumviewSourceAdapter(PlaceholderSourceAdapter):
    listing_api = "https://chvu.co.kr/v2/campaigns?{query}"
    detail_api = "https://chvu.co.kr/api/campaign/getCampaignById?campaign_id={campaign_id}"

    def __init__(self, definition: SourceDefinition, page_limit: int = 20):
        super().__init__(definition)
        self.page_limit = page_limit

    def fetch(self) -> list[dict]:
        items: list[dict] = []
        seen_ids: set[int] = set()

        for category, _page_url in CHEHUMVIEW_CATEGORY_URLS:
            for page in range(1, self.page_limit + 1):
                query = urlencode({"category": category, "page": page})
                try:
                    payload = fetch_json_with_headers(self.listing_api.format(query=query), headers=CHEHUMVIEW_BROWSER_HEADERS)
                except Exception:
                    break
                rows = payload.get("data", []) if isinstance(payload, dict) else []
                if not rows:
                    break
                for row in rows:
                    campaign_id = row.get("campaignId")
                    if (
                        not campaign_id
                        or campaign_id in seen_ids
                        or str(row.get("activity") or "").lower() == "misc"
                        or str(row.get("channel") or "").lower() == "misc"
                    ):
                        continue
                    seen_ids.add(campaign_id)
                    try:
                        detail_rows = fetch_json_with_headers(
                            self.detail_api.format(campaign_id=campaign_id),
                            headers=CHEHUMVIEW_BROWSER_HEADERS,
                        )
                    except Exception:
                        detail_rows = []
                    detail = detail_rows[0] if isinstance(detail_rows, list) and detail_rows else {}
                    items.append(transform_chehumview_campaign(row, source_id=self.definition.source_id, detail=detail))
                if len(rows) < 14:
                    break

        return items


class RingbleSourceAdapter(PlaceholderSourceAdapter):
    def __init__(
        self,
        definition: SourceDefinition,
        page_limit: int = 8,
        detail_limit: int | None = 120,
        category_configs: tuple[tuple[str, str, str | None, str | None], ...] = RINGBLE_LISTING_CATEGORIES,
    ):
        super().__init__(definition)
        self.page_limit = page_limit
        self.detail_limit = detail_limit
        self.category_configs = category_configs

    def fetch(self) -> list[dict]:
        listing_items: list[dict] = []
        seen_urls: set[str] = set()
        fetch_errors: list[str] = []

        for category_id, category_name, default_platform_type, default_campaign_type in self.category_configs:
            max_page = self.page_limit
            for page in range(1, self.page_limit + 1):
                listing_url = _build_ringble_listing_url(category_id, page)
                try:
                    listing_html = fetch_text_url(
                        listing_url,
                        headers=RINGBLE_BROWSER_HEADERS,
                        timeout=RINGBLE_FETCH_TIMEOUT,
                    )
                except Exception as exc:
                    fetch_errors.append(f"listing fetch failed: {listing_url} :: {_format_source_exception(exc)}")
                    break

                if page == 1:
                    max_page = min(self.page_limit, _extract_ringble_listing_page_count(listing_html, category_id))

                batch = parse_ringble_listing(
                    listing_html,
                    default_category_name=category_name,
                    default_platform_type=default_platform_type,
                    default_campaign_type=default_campaign_type,
                    source_id=self.definition.source_id,
                )
                if not batch:
                    break

                new_count = 0
                for item in batch:
                    if item["original_url"] in seen_urls:
                        continue
                    seen_urls.add(item["original_url"])
                    listing_items.append(item)
                    new_count += 1
                if new_count == 0 or page >= max_page:
                    break

        prioritized_items = sorted(
            listing_items,
            key=lambda item: (
                0 if item.get("campaign_type") == "visit" else 1,
                0 if item.get("platform_type") in {"instagram", "youtube"} else 1,
                item.get("apply_deadline") or "9999-12-31",
                item.get("original_url") or "",
            ),
        )
        detail_targets = prioritized_items if self.detail_limit is None else prioritized_items[: self.detail_limit]
        detail_urls = {item["original_url"] for item in detail_targets}

        items: list[dict] = []
        for item in listing_items:
            if item["original_url"] not in detail_urls:
                items.append(item)
                continue
            try:
                detail_html = fetch_text_url(
                    item["original_url"],
                    headers={
                        **RINGBLE_BROWSER_HEADERS,
                        "Referer": item["original_url"],
                    },
                    timeout=RINGBLE_FETCH_TIMEOUT,
                )
            except Exception as exc:
                fetch_errors.append(f"detail fetch failed: {item['original_url']} :: {_format_source_exception(exc)}")
                detail_html = None
            items.append(enrich_ringble_detail(item, detail_html) if detail_html else item)

        print(
            f"[ringble] fetched listing_items={len(listing_items)} "
            f"detail_targets={len(detail_urls)} errors={len(fetch_errors)}"
        )
        for message in fetch_errors[:12]:
            print(f"[ringble] {message}")
        return items


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
        fetch_errors: list[str] = []

        try:
            listing_html = fetch_text_url(
                self.listing_url,
                timeout=SEOULOUPPA_FETCH_TIMEOUT,
                headers=SEOULOUPPA_BROWSER_HEADERS,
            )
        except Exception as exc:
            fetch_errors.append(f"initial listing failed: {self.listing_url} :: {_format_source_exception(exc)}")
            listing_html = None
        listing_items: list[dict] = []
        seen_urls: set[str] = set()
        seed_urls = _extract_seouloppa_listing_urls(listing_html) if listing_html else list(SEOULOUPPA_LISTING_URLS)
        if listing_html:
            print(
                f"[seouloppa] initial listing ok: bytes={len(listing_html)} "
                f"campaign_content={listing_html.count('campaign_content')} seed_urls={len(seed_urls)}"
            )
        else:
            print(f"[seouloppa] initial listing unavailable; falling back to {len(seed_urls)} seeded listing urls")
        for listing_url in seed_urls:
            try:
                page_html = (
                    listing_html
                    if listing_html and listing_url == self.listing_url
                    else fetch_text_url(
                        listing_url,
                        timeout=SEOULOUPPA_FETCH_TIMEOUT,
                        headers=SEOULOUPPA_BROWSER_HEADERS,
                    )
                )
                fragments = _fetch_seouloppa_listing_fragments(listing_url, base_html=page_html)
            except Exception as exc:
                fetch_errors.append(f"listing fetch failed: {listing_url} :: {_format_source_exception(exc)}")
                continue
            parsed_count = 0
            for fragment in fragments:
                parsed_items = parse_seouloppa_listing(fragment, source_id=self.definition.source_id)
                parsed_count += len(parsed_items)
                for item in parsed_items:
                    if item["original_url"] in seen_urls:
                        continue
                    seen_urls.add(item["original_url"])
                    listing_items.append(item)
            if parsed_count == 0:
                fetch_errors.append(
                    "listing parsed zero items: "
                    f"{listing_url} :: bytes={len(page_html)} campaign_content={page_html.count('campaign_content')}"
                )
        prioritized_items = sorted(
            listing_items,
            key=lambda item: (
                0 if item.get("campaign_type") == "visit" else 1,
                0 if item.get("region_primary_name") else 1,
                item.get("apply_deadline") or "9999-12-31",
            ),
        )
        detail_targets = prioritized_items if self.detail_limit is None else prioritized_items[: self.detail_limit]
        detail_map = {item["original_url"]: index for index, item in enumerate(detail_targets)}
        items = [dict(item) for item in listing_items]
        for item in items:
            if item["original_url"] not in detail_map:
                continue
            try:
                detail_html = fetch_text_url(
                    item["original_url"],
                    timeout=SEOULOUPPA_FETCH_TIMEOUT,
                    headers={
                        **SEOULOUPPA_BROWSER_HEADERS,
                        "Referer": self.listing_url,
                    },
                )
            except Exception as exc:
                fetch_errors.append(f"detail fetch failed: {item['original_url']} :: {_format_source_exception(exc)}")
                detail_html = None
            if detail_html:
                item.update(enrich_seouloppa_detail(item, detail_html))
        print(
            f"[seouloppa] fetched listing_items={len(listing_items)} "
            f"detail_targets={len(detail_targets)} errors={len(fetch_errors)}"
        )
        if not listing_items and fetch_errors:
            for message in fetch_errors[:12]:
                print(f"[seouloppa] {message}")
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
    base_page = (
        base_html
        if base_html is not None
        else fetch_text_url(
            listing_url,
            timeout=SEOULOUPPA_FETCH_TIMEOUT,
            headers=SEOULOUPPA_BROWSER_HEADERS,
        )
    )
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
                headers={
                    **SEOULOUPPA_BROWSER_HEADERS,
                    "X-Requested-With": "XMLHttpRequest",
                    "Referer": listing_url,
                },
                timeout=SEOULOUPPA_FETCH_TIMEOUT,
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


def _format_source_exception(exc: Exception) -> str:
    return f"{type(exc).__name__}: {exc}"


class SeoulOppaListingHTMLParser(HTMLParser):
    def __init__(self, source_id: str | None = None):
        super().__init__(convert_charrefs=True)
        self.source_id = source_id
        self.items: list[dict[str, Any]] = []
        self.current: dict[str, Any] | None = None
        self.tag_stack: list[tuple[str, set[str]]] = []
        self.capture_key: str | None = None
        self.capture_parts: list[str] = []
        self.capture_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr_map = {key: value or "" for key, value in attrs}
        classes = set(attr_map.get("class", "").split())
        self.tag_stack.append((tag, classes))

        if tag == "li" and "campaign_content" in classes:
            self.current = {
                "source_id": self.source_id,
                "tags": [],
                "platform_markers": [],
            }
            return

        if not self.current:
            return

        if tag == "a" and "tum_img" in classes and attr_map.get("href") and not self.current.get("original_url"):
            self.current["original_url"] = urljoin("https://www.seoulouba.co.kr", attr_map["href"])

        if tag == "img":
            src = attr_map.get("src", "").strip()
            alt = attr_map.get("alt", "").strip()
            if src and "/data/campaign_list/" in src and not self.current.get("thumbnail_url"):
                self.current["thumbnail_url"] = src
            if src and "thum_ch_" in src:
                self.current["platform_markers"].append(src)
            if alt:
                self.current["platform_markers"].append(alt)

        if self.capture_key:
            self.capture_depth += 1
            return

        if tag == "strong" and "s_campaign_title" in classes:
            self._start_capture("title")
        elif tag == "span" and "basic_blue" in classes:
            self._start_capture("benefit_text")
        elif tag == "span" and self._has_ancestor_class("icon_tag"):
            self._start_capture("tag")
        elif tag == "span" and self._has_ancestor_class("d_day"):
            self._start_capture("d_day")
        elif tag == "div" and "recruit" in classes:
            self._start_capture("recruit_text")

    def handle_endtag(self, tag: str) -> None:
        if self.capture_key:
            self.capture_depth -= 1
            if self.capture_depth == 0:
                self._finish_capture()

        if self.current and tag == "li":
            finalized = self._finalize_current()
            if finalized:
                self.items.append(finalized)
            self.current = None

        if self.tag_stack:
            self.tag_stack.pop()

    def handle_data(self, data: str) -> None:
        if self.capture_key and self.current is not None:
            self.capture_parts.append(data)

    def _start_capture(self, key: str) -> None:
        self.capture_key = key
        self.capture_parts = []
        self.capture_depth = 1

    def _finish_capture(self) -> None:
        if not self.current or not self.capture_key:
            self.capture_key = None
            self.capture_parts = []
            self.capture_depth = 0
            return

        text = " ".join("".join(self.capture_parts).split()).strip()
        if text:
            if self.capture_key == "tag":
                self.current["tags"].append(text)
            else:
                self.current[self.capture_key] = text

        self.capture_key = None
        self.capture_parts = []
        self.capture_depth = 0

    def _has_ancestor_class(self, target_class: str) -> bool:
        return any(target_class in classes for _, classes in self.tag_stack)

    def _finalize_current(self) -> dict[str, Any] | None:
        if not self.current:
            return None

        raw_title = self.current.get("title")
        original_url = self.current.get("original_url")
        if not raw_title or not original_url:
            return None

        title, region_primary, region_secondary = _clean_seouloppa_title(html_lib.unescape(_strip_tags(raw_title)))
        type_matches = [html_lib.unescape(tag).strip() for tag in self.current.get("tags", []) if str(tag).strip()]
        benefit_text = html_lib.unescape(_strip_tags(self.current.get("benefit_text") or ""))

        platform_type = "blog"
        platform_markers = " ".join(self.current.get("platform_markers", []))
        for token, mapped in SEOULOUPPA_PLATFORM_MAP.items():
            if token in platform_markers:
                platform_type = mapped
                break
        if "인스타" in platform_markers:
            platform_type = "instagram"
        elif "유튜브" in platform_markers:
            platform_type = "youtube"

        campaign_type = "visit"
        for label in type_matches:
            if label in SEOULOUPPA_TYPE_MAP:
                campaign_type = SEOULOUPPA_TYPE_MAP[label]
            elif label.endswith("P") and not benefit_text:
                benefit_text = label

        recruit_match = re.search(r"모집\s*([\d,]+)", self.current.get("recruit_text", ""))
        recruit_count = int(recruit_match.group(1).replace(",", "")) if recruit_match else None
        d_day = self.current.get("d_day")

        return {
            "source_id": self.source_id,
            "campaign_id": _extract_query_params(original_url).get("c"),
            "title": title,
            "original_url": original_url,
            "platform_type": "blog" if platform_type == "purchase" else platform_type,
            "campaign_type": campaign_type,
            "category_name": None,
            "subcategory_name": type_matches[0] if type_matches else None,
            "region_primary_name": region_primary,
            "region_secondary_name": region_secondary,
            "benefit_text": benefit_text or None,
            "recruit_count": recruit_count,
            "apply_deadline": _estimate_deadline_from_d_label(d_day),
            "published_at": None,
            "thumbnail_url": self.current.get("thumbnail_url"),
            "snippet": benefit_text or None,
            "raw_status": "active",
            "status": "active",
            "requires_review": False,
        }


def parse_seouloppa_listing(html: str, source_id: str | None = None) -> list[dict]:
    parser = SeoulOppaListingHTMLParser(source_id=source_id)
    parser.feed(html)
    parser.close()
    return parser.items


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
    if address_text:
        enriched['exact_location'] = _strip_tags(address_text)
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
    address_text = _extract_first(r'var\s+loca\s*=\s*"([^"]+)"', detail_html, re.S)
    if address_text:
        enriched['exact_location'] = _strip_tags(address_text)
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
    if source_slug == "modan":
        return ModanSourceAdapter(definition, page_limit=2 if report_mode else 20, detail_limit=24 if report_mode else 160)
    if source_slug == "chehumview":
        return ChehumviewSourceAdapter(definition, page_limit=2 if report_mode else 20)
    if source_slug == "reviewplace":
        return ReviewPlaceSourceAdapter(definition, page_limit=2 if report_mode else 20)
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
        return SeoulOppaSourceAdapter(definition, detail_limit=12 if report_mode else 80)
    if source_slug == "ringble":
        return RingbleSourceAdapter(definition, page_limit=2 if report_mode else 8, detail_limit=16 if report_mode else 120)
    if source_slug == "gangnammatzip":
        return GangnamMatzipSourceAdapter(definition, detail_limit=10 if report_mode else 120)
    return PlaceholderSourceAdapter(definition)
