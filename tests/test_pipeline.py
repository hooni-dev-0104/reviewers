import json
import tempfile
import unittest
from datetime import date, timedelta
from unittest import mock
from pathlib import Path

from crawler.config import AppConfig
from crawler.pipeline import (
    _geocode_exact_location,
    _normalize_exact_location_candidates,
    build_campaign_payload,
    build_campaign_snapshot_payloads,
    run_daily_refresh,
    run_source_pipeline,
)
from crawler.reporting import build_source_quality_report
from crawler.normalization import normalize_campaign
from crawler.sources.seeded import (
    DinnerQueenSourceAdapter,
    GangnamMatzipSourceAdapter,
    SEEDED_SOURCES,
    SeoulOppaSourceAdapter,
    _build_gangnammatzip_ajax_url,
    _build_seouloppa_ajax_payload,
    _estimate_deadline_from_d_label,
    _extract_gangnammatzip_listing_urls,
    _extract_seouloppa_listing_urls,
    enrich_4blog_item_from_detail,
    enrich_gangnammatzip_detail,
    enrich_seouloppa_detail,
    parse_mrblog_listing,
    parse_gangnammatzip_listing,
    parse_reviewnote_listing,
    parse_seouloppa_listing,
    transform_revu_item,
    transform_reviewnote_api_item,
    transform_4blog_item,
    transform_dinnerqueen_detail,
)


class PipelineTests(unittest.TestCase):
    class _MockHTTPResponse:
        def __init__(self, payload):
            self.payload = payload

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def read(self):
            return json.dumps(self.payload, ensure_ascii=False).encode("utf-8")

    def test_build_campaign_payload(self):
        campaign = normalize_campaign(
            "reviewnote",
            "source-1",
            {
                "title": "테스트",
                "original_url": "https://example.com/c/1",
                "platform_type": "blog",
                "campaign_type": "visit",
                "latitude": 37.5,
                "longitude": 127.0,
            },
        )
        payload = build_campaign_payload(campaign)
        self.assertEqual(payload["source_id"], "source-1")
        self.assertEqual(payload["original_url"], "https://example.com/c/1")
        self.assertIsNone(payload["exact_location"])
        self.assertEqual(payload["latitude"], 37.5)
        self.assertEqual(payload["longitude"], 127.0)

    def test_build_campaign_snapshot_payloads(self):
        campaign = normalize_campaign(
            "reviewnote",
            "source-1",
            {
                "title": "테스트",
                "original_url": "https://example.com/c/1",
                "platform_type": "blog",
                "campaign_type": "visit",
                "exact_location": "서울 강남구 테헤란로 1",
            },
        )
        campaign.crawled_at = "2026-03-23T00:00:00Z"
        snapshots = build_campaign_snapshot_payloads(
            [{"id": "campaign-1", "source_id": "source-1", "original_url": "https://example.com/c/1"}],
            [campaign],
        )
        self.assertEqual(len(snapshots), 1)
        self.assertEqual(snapshots[0]["campaign_id"], "campaign-1")
        self.assertEqual(snapshots[0]["raw_payload"]["exact_location"], "서울 강남구 테헤란로 1")

    def test_geocode_exact_location_prefers_vworld(self):
        with mock.patch.dict("os.environ", {"VWORLD_API_KEY": "test-key"}, clear=False):
            with mock.patch(
                "crawler.pipeline.urlopen",
                return_value=self._MockHTTPResponse(
                    {
                        "response": {
                            "status": "OK",
                            "result": {
                                "items": [
                                    {"point": {"x": "127.029194860", "y": "37.496419834"}}
                                ]
                            },
                        }
                    }
                ),
            ) as mocked:
                coordinates = _geocode_exact_location("서울 강남구 강남대로84길 6")

        self.assertEqual(coordinates, (37.496419834, 127.02919486))
        self.assertIn("api.vworld.kr/req/search", mocked.call_args.args[0].full_url)

    def test_geocode_exact_location_falls_back_to_nominatim(self):
        responses = [
            self._MockHTTPResponse({"response": {"status": "NOT_FOUND"}}),
            self._MockHTTPResponse({"response": {"status": "NOT_FOUND"}}),
            self._MockHTTPResponse([{"lat": "37.543218", "lon": "126.973928"}]),
        ]
        with mock.patch.dict("os.environ", {"VWORLD_API_KEY": "test-key"}, clear=False):
            with mock.patch("crawler.pipeline.urlopen", side_effect=responses):
                coordinates = _geocode_exact_location("서울 용산구 한강대로80길 11-47")

        self.assertEqual(coordinates, (37.543218, 126.973928))

    def test_normalize_exact_location_candidates_trims_room_floor_noise(self):
        candidates = _normalize_exact_location_candidates("서울 강남구 테헤란로 1 3층 301호")
        self.assertGreaterEqual(len(candidates), 2)
        self.assertEqual(candidates[0], "서울 강남구 테헤란로 1 3층 301호")
        self.assertIn("서울 강남구 테헤란로 1 3층", candidates)
        self.assertIn("서울 강남구 테헤란로 1", candidates)

    def test_run_source_pipeline_with_file(self):
        sample = [
            {
                "title": "서울 카페 체험단",
                "original_url": "https://example.com/campaign/1",
                "platform_type": "blog",
                "campaign_type": "visit",
                "category_name": "카페",
            }
        ]
        with tempfile.TemporaryDirectory() as tmpdir:
            path = Path(tmpdir) / "sample.json"
            path.write_text(json.dumps(sample, ensure_ascii=False), encoding="utf-8")
            result = run_source_pipeline(
                "reviewnote",
                AppConfig(dry_run=True),
                source_file=str(path),
                dry_run=True,
            )
        self.assertEqual(result["stats"].fetched, 1)
        self.assertEqual(result["stats"].normalized, 1)
        self.assertEqual(len(result["payload"]), 1)

    def test_run_daily_refresh_aggregates_results(self):
        sample = [
            {
                "title": "서울 카페 체험단",
                "original_url": "https://example.com/campaign/1",
            }
        ]
        with tempfile.TemporaryDirectory() as tmpdir:
            for slug in ("reviewnote", "revu"):
                path = Path(tmpdir) / f"{slug}.json"
                path.write_text(json.dumps(sample, ensure_ascii=False), encoding="utf-8")
            result = run_daily_refresh(
                ["reviewnote", "revu"],
                AppConfig(dry_run=True),
                source_file_dir=tmpdir,
                dry_run=True,
                delete_before_refresh=True,
            )
        self.assertEqual(result["totals"]["fetched"], 2)
        self.assertEqual(result["totals"]["normalized"], 2)
        self.assertEqual(result["totals"]["deleted"], 0)

    def test_run_daily_refresh_continues_after_source_error(self):
        def fake_run_source_pipeline(slug, *args, **kwargs):
            if slug == "revu":
                raise RuntimeError("HTTP Error 429: Too Many Requests")
            return {
                "source": slug,
                "dry_run": True,
                "delete_before_refresh": True,
                "report_mode": False,
                "deleted_count": 0,
                "stats": type("Stats", (), {"fetched": 2, "normalized": 2, "failed": 0, "skipped": 0})(),
                "payload": [{"title": "ok"}],
                "errors": [],
            }

        with mock.patch("crawler.pipeline.run_source_pipeline", side_effect=fake_run_source_pipeline):
            result = run_daily_refresh(
                ["reviewnote", "revu", "4blog"],
                AppConfig(dry_run=True),
                dry_run=True,
            )

        self.assertEqual(result["totals"]["fetched"], 4)
        self.assertEqual(result["totals"]["normalized"], 4)
        self.assertEqual(result["totals"]["failed"], 1)
        revu_result = next(item for item in result["results"] if item["source"] == "revu")
        self.assertIn("429", revu_result["errors"][0])

    def test_run_source_pipeline_skips_expired_deadline(self):
        sample = [
            {
                "title": "지난 캠페인",
                "original_url": "https://example.com/campaign/old",
                "apply_deadline": "2026-03-20",
                "status": "active",
            },
            {
                "title": "현재 캠페인",
                "original_url": "https://example.com/campaign/live",
                "apply_deadline": "2026-03-25",
                "status": "active",
            },
        ]
        with tempfile.TemporaryDirectory() as tmpdir:
            path = Path(tmpdir) / "sample.json"
            path.write_text(json.dumps(sample, ensure_ascii=False), encoding="utf-8")
            with mock.patch("crawler.pipeline._kst_today", return_value=date(2026, 3, 23)):
                result = run_source_pipeline(
                    "reviewnote",
                    AppConfig(dry_run=True),
                    source_file=str(path),
                    dry_run=True,
                )
        self.assertEqual(result["stats"].fetched, 2)
        self.assertEqual(result["stats"].normalized, 1)
        self.assertEqual(result["stats"].skipped, 1)
        self.assertEqual(len(result["payload"]), 1)

    def test_dinnerqueen_adapter_skips_failed_detail(self):
        response = {
            "layout": """
            <a class="qz-dq-card__link" href="/taste/1" title="A">
              <strong style="letter-spacing: -0.2px">방문</strong>
              <span class="color-subtitle">신청 1</span><span> / 모집 1</span>
            </a>
            <a class="qz-dq-card__link" href="/taste/2" title="B">
              <strong style="letter-spacing: -0.2px">방문</strong>
              <span class="color-subtitle">신청 1</span><span> / 모집 2</span>
            </a>
            """,
            "has_next": False,
        }

        def fake_fetch_text(url):
            if url.endswith("/taste/1"):
                raise TimeoutError("boom")
            return """
            <html>
              <head>
                <meta property="og:title" content="맛있는 파스타 | 디너의여왕" />
                <meta property="og:image" content="https://example.com/thumb.jpg" />
              </head>
              <body>
                <a href="/taste?ct=배달">배달</a>
                <a href="/taste?area1=서울&amp;area2=강남">지역</a>
                <div>제공내역</div>
                <p class="qz-body-kr mb-qz-body2-kr color-title">파스타 2개 제공<br>음료 포함</p>
                <div>기간: 26.03.16 – 26.04.12</div>
              </body>
            </html>
            """

        with mock.patch("crawler.sources.seeded.fetch_session_json", return_value=response), mock.patch(
            "crawler.sources.seeded.fetch_text_url", side_effect=fake_fetch_text
        ):
            adapter = DinnerQueenSourceAdapter(SEEDED_SOURCES["dinnerqueen"], page_limit=1)
            items = adapter.fetch()

        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["title"], "B")

    def test_transform_4blog_item(self):
        raw = {
            "CID": 123,
            "CAMPAIGN_NM": "[대구/수성구] 테스트 캠페인",
            "LOCATION_NM": "",
            "REVIEWER_BENEFIT": "상품 제공",
            "REMAINDATE": 3,
            "CATEGORY": "blog",
            "CATEGORY1": "deliv",
            "PRID": 456,
            "IMGKEY": "image.jpg",
            "REQ_CLOSE_DT": "03.27",
            "REQ_OPEN_DT": "03.20",
            "REVIEWER_CNT": 10,
            "KEYWORD": "#테스트 #체험단",
        }
        transformed = transform_4blog_item(raw)
        self.assertEqual(transformed["original_url"], "https://4blog.net/campaign/123/")
        self.assertEqual(transformed["campaign_type"], "delivery")
        self.assertEqual(transformed["platform_type"], "blog")
        self.assertEqual(transformed["benefit_text"], "상품 제공")
        self.assertEqual(transformed["title"], "테스트 캠페인")
        self.assertEqual(transformed["region_primary_name"], "대구")
        self.assertEqual(transformed["region_secondary_name"], "수성구")
        self.assertIn("#테스트", transformed["snippet"])

    def test_enrich_4blog_item_from_detail(self):
        item = {
            "title": "테스트 캠페인",
            "original_url": "https://4blog.net/campaign/123/",
            "region_primary_name": None,
            "region_secondary_name": None,
            "snippet": None,
        }
        detail_html = """
        <div>체험 장소</div>
        서교동 양화로6길 67
        """
        enriched = enrich_4blog_item_from_detail(item, detail_html)
        self.assertEqual(enriched["region_primary_name"], "서교동")
        self.assertIsNone(enriched["region_secondary_name"])
        self.assertEqual(enriched["snippet"], "서교동 양화로6길 67")

    def test_transform_dinnerqueen_detail(self):
        html = """
        <html>
          <head>
            <meta property="og:title" content="맛있는 파스타 | 디너의여왕" />
            <meta property="og:image" content="https://example.com/thumb.jpg" />
          </head>
          <body>
            <a href="/taste?ct=배달">배달</a>
            <a href="/taste?area1=서울&amp;area2=강남">지역</a>
            <div>제공내역</div>
            <p class="qz-body-kr mb-qz-body2-kr color-title">파스타 2개 제공<br>음료 포함</p>
            <div>기간: 26.03.16 – 26.04.12</div>
          </body>
        </html>
        """
        transformed = transform_dinnerqueen_detail(html, "1261156")
        self.assertEqual(transformed["title"], "맛있는 파스타")
        self.assertEqual(transformed["campaign_type"], "delivery")
        self.assertEqual(transformed["region_primary_name"], "서울")
        self.assertEqual(transformed["region_secondary_name"], "강남")
        self.assertEqual(transformed["thumbnail_url"], "https://example.com/thumb.jpg")
        self.assertIn("파스타 2개 제공", transformed["benefit_text"])
        self.assertEqual(transformed["published_at"], "2026-03-16")
        self.assertEqual(transformed["apply_deadline"], "2026-04-12")

    def test_parse_reviewnote_listing(self):
        html = """
        <div class="relative pl-[2.5px]">
          <div class="transform overflow-hidden rounded border transition-all duration-300 ease-in-out hover:shadow-lg">
            <a href="/campaigns/1111346"><noscript><img src="/_next/image?url=https%3A%2F%2Fexample.com%2Fimage.webp&amp;w=640&amp;q=60"/></noscript></a>
            <div class="z-50 flex flex-col items-center border-gray-200 bg-white py-2 text-14m md:max-h-[34px] md:min-h-[38px] md:flex-row md:justify-center md:divide-x">
              <div class="text-gray-600 md:pr-3"><div><span class="text-secondary-600 text-14b">10</span> <!-- -->일 남음</div></div>
              <div class="flex items-center gap-1 text-gray-600 md:pl-3"><div>신청<!-- --> <span class="text-secondary-600 text-14b">38</span> <!-- -->/ <!-- -->35</div></div>
            </div>
          </div>
          <div class="mt-4 flex flex-col gap-2">
            <div class="flex items-center gap-2"><div class="flex items-center"><img alt="" src="/svgIcon/blog.svg"/></div><span class="flex items-center whitespace-nowrap font-semibold text-gray-600 text-14m">배송형</span></div>
            <div class="flex min-w-0 flex-col"><a class="truncate text-16m" href="/campaigns/1111346">[서울/강남] 미닉스 더 플렌더 PRO 음식물 처리기</a><div class="mt-1 truncate text-gray-600 text-14r">미닉스 더 플렌더 PRO 음식물 처리기 (옵션랜덤)</div></div>
            <div class="text-system-point"><span class="mr-2 text-16m">50%</span><span class="mr-1 font-semibold text-16b">99,000</span></div>
            <div class="flex"><span><span>페이백 100,000 P</span></span></div>
          </div>
        </div>
        """
        items = parse_reviewnote_listing(html)
        self.assertEqual(len(items), 1)
        item = items[0]
        self.assertEqual(item["title"], "미닉스 더 플렌더 PRO 음식물 처리기")
        self.assertEqual(item["original_url"], "https://www.reviewnote.co.kr/campaigns/1111346")
        self.assertEqual(item["platform_type"], "blog")
        self.assertEqual(item["campaign_type"], "delivery")
        self.assertEqual(item["region_primary_name"], "서울")
        self.assertEqual(item["region_secondary_name"], "강남")
        self.assertEqual(item["recruit_count"], 35)
        self.assertEqual(item["thumbnail_url"], "https://example.com/image.webp")
        self.assertIn("페이백 100,000 P", item["snippet"])

    def test_parse_seouloppa_listing(self):
        html = """
        <li class="campaign_content">
          <div class="load_campaign">
            <a href="https://www.seoulouba.co.kr/campaign/?c=400861" class="tum_img">
              <img src="https://www.seoulouba.co.kr/data/campaign_list/400861/thumb.jpg">
            </a>
          </div>
          <div class="load_info">
            <div class="com_icon">
              <div class="icon_tag">
                <span>배송형</span>
              </div>
            </div>
            <div class="t_ttl">
              <a href="https://www.seoulouba.co.kr/campaign/?c=400861"><strong class="s_campaign_title">[서울/강남] 팩앤롤 디럭스 1EA</strong></a>
            </div>
            <div class="t_basic"><span class="basic_blue">팩앤롤 디럭스 1EA (색상 선택)</span></div>
            <div class="campaign_day_people">
              <div class="d_day"><span>D-1</span></div>
              <div class="recruit"><span>신청 262 <span class="span_gray">/ 모집 5</span></span></div>
            </div>
          </div>
          <div class="icon_box">
            <img src="https://www.seoulouba.co.kr/theme/souba3/img/thum_ch_blog.png" alt="네이버블로그">
          </div>
        </li>
        """
        items = parse_seouloppa_listing(html)
        self.assertEqual(len(items), 1)
        item = items[0]
        self.assertEqual(item["title"], "팩앤롤 디럭스 1EA")
        self.assertEqual(item["campaign_type"], "delivery")
        self.assertEqual(item["platform_type"], "blog")
        self.assertEqual(item["region_primary_name"], "서울")
        self.assertEqual(item["region_secondary_name"], "강남")
        self.assertEqual(item["recruit_count"], 5)
        self.assertEqual(item["apply_deadline"], (date.today() + timedelta(days=1)).isoformat())

    def test_parse_seouloppa_listing_live_markup_shape(self):
        html = """
        <li class="campaign_content">
            <div class="load_campaign">
                <a href="https://www.seoulouba.co.kr/campaign/?c=400975" target="_blank" class="tum_img">
                    <img src="https://www.seoulouba.co.kr/data/campaign_list/327572/thumb-910e7b9c56f53c28f2f5672a73054feb_400975_260x260.jpg" width="90;" height="90;">
                </a>
                <a href="https://www.seoulouba.co.kr/campaign/?c=400975" target="_blank" class="load_blind_box">
                    <div class="load_blind"><div class="load_blind_box"></div></div>
                </a>
                <div class="load_icon_box">
                    <div class="ltop_icon">
                        <div class="icon_box">
                            <img src="https://www.seoulouba.co.kr/theme/souba3/img/thum_ch_blog.png" alt="네이버블로그">
                        </div>
                    </div>
                </div>
            </div>
            <div class="load_info">
                <div class="com_icon">
                    <div class="icon_tag">
                        <span>방문형</span>
                        <span>주말</span>
                    </div>
                </div>
                <div class="t_ttl">
                    <a href="https://www.seoulouba.co.kr/campaign/?c=400975" target="_blank"><strong class="s_campaign_title">[당산] 진안 생숯불구이 저녁</strong></a>
                </div>
                <div class="t_basic">
                    <span class="basic_blue">메인메뉴 3가지 중 업체추천메뉴 1개</span>
                </div>
                <div class="campaign_day_people">
                    <div class="d_day"><span>D-day</span></div>
                    <div class="recruit"><span>신청 31 <span class="span_gray">/ 모집 5</span></span></div>
                </div>
            </div>
        </li>
        """
        items = parse_seouloppa_listing(html)
        self.assertEqual(len(items), 1)
        item = items[0]
        self.assertEqual(item["campaign_id"], "400975")
        self.assertEqual(item["title"], "진안 생숯불구이 저녁")
        self.assertEqual(item["platform_type"], "blog")
        self.assertEqual(item["campaign_type"], "visit")
        self.assertEqual(item["region_primary_name"], "당산")
        self.assertIsNone(item["region_secondary_name"])
        self.assertEqual(item["benefit_text"], "메인메뉴 3가지 중 업체추천메뉴 1개")
        self.assertEqual(item["recruit_count"], 5)
        self.assertEqual(item["apply_deadline"], date.today().isoformat())

    def test_enrich_seouloppa_detail(self):
        item = {
            "benefit_text": None,
            "snippet": None,
            "published_at": None,
            "apply_deadline": None,
        }
        detail_html = """
        <dt class="cam_info_con_dt lititle">제공내역</dt>
        <dd class="cam_info_con_dd">팩앤롤 디럭스 1EA (색상 선택)</dd>
        <li class="campaign_guide_li">
          <strong class="p_title on">크리에이터 모집</strong>
          <span class="period on">26-03-19 ~ 26-03-23</span>
        </li>
        <script>
        geocoder.addressSearch('서울 강남구 강남대로102길 28 (역삼동)', function(result, status) {});
        </script>
        <dt class="cam_info_con_dt lititle">사이트 URL</dt>
        <dd class="cam_info_con_dd"><a href="https://m.site.naver.com/23cJ9"></a></dd>
        """
        enriched = enrich_seouloppa_detail(item, detail_html)
        self.assertEqual(enriched["benefit_text"], "팩앤롤 디럭스 1EA (색상 선택)")
        self.assertEqual(enriched["published_at"], "2026-03-19")
        self.assertEqual(enriched["apply_deadline"], "2026-03-23")
        self.assertEqual(enriched["region_primary_name"], "서울")
        self.assertEqual(enriched["region_secondary_name"], "강남구")
        self.assertEqual(enriched["exact_location"], "서울 강남구 강남대로102길 28 (역삼동)")

    def test_parse_gangnammatzip_listing(self):
        html = """
        <li class='list_item ' data-product='2079866'>
          <div>
            <div class='imgArea'><a href='/cp/?id=2079866'><img src='//gangnam-review.net/data/file/cmp/thumb.jpg'></a></div>
            <div class='textArea'>
              <dl>
                <span class='label'><em class='blog'>Blog</em><em class='type'>배송형</em><span class='dday'><em class='day_c'>9일 남음</em></span></span>
                <dt class='tit'><a href='/cp/?id=2079866'>[서울/강남] 롯데상품권</a></dt>
                <dd class='sub_tit'>롯데상품권 (30만원)</dd>
              </dl>
              <div class='item_detail'><p class='item_info'><span class='numb'><b style='color:#000'>신청 4,144</b> / 모집 1</span></p></div>
            </div>
          </div>
        </li>
        """
        items = parse_gangnammatzip_listing(html)
        self.assertEqual(len(items), 1)
        item = items[0]
        self.assertEqual(item["title"], "롯데상품권")
        self.assertEqual(item["platform_type"], "blog")
        self.assertEqual(item["campaign_type"], "delivery")
        self.assertEqual(item["region_primary_name"], "서울")
        self.assertEqual(item["region_secondary_name"], "강남")
        self.assertEqual(item["recruit_count"], 1)
        self.assertEqual(item["apply_deadline"], (date.today() + timedelta(days=9)).isoformat())

    def test_enrich_gangnammatzip_detail(self):
        item = {
            "benefit_text": None,
            "snippet": None,
            "published_at": None,
            "apply_deadline": None,
        }
        detail_html = """
        <dt>제공내역</dt>
        <dd>롯데상품권 (30만원)<p class="info_s">설명</p></dd>
        <dt>신청기간</dt>
        <dd>03.03 ~ 03.31</dd>
        """
        enriched = enrich_gangnammatzip_detail(item, detail_html)
        self.assertEqual(enriched["benefit_text"], "롯데상품권 (30만원)")
        self.assertEqual(enriched["published_at"], "2026-03-03")
        self.assertEqual(enriched["apply_deadline"], "2026-03-31")

    def test_enrich_gangnammatzip_detail_extracts_exact_location(self):
        item = {}
        detail_html = 'var loca = "경기 파주시 경의로 1114 (야당동, 에펠타워) 2층 네일갤러리";'
        enriched = enrich_gangnammatzip_detail(item, detail_html)
        self.assertEqual(enriched["exact_location"], "경기 파주시 경의로 1114 (야당동, 에펠타워) 2층 네일갤러리")

    def test_extract_seouloppa_listing_urls_keeps_category_urls_only(self):
        html = """
        <a href="https://www.seoulouba.co.kr/campaign/?cat=377">방문형</a>
        <a href="?cat=&qq=popular&q=&q1=&q2=&&ar1=455">서울</a>
        """
        urls = _extract_seouloppa_listing_urls(html)
        self.assertIn("https://www.seoulouba.co.kr/campaign/?cat=377", urls)
        self.assertNotIn("https://www.seoulouba.co.kr/campaign/?cat=&qq=popular&q=&q1=&q2=&&ar1=455", urls)

    def test_build_seouloppa_ajax_payload_tracks_filters(self):
        payload = _build_seouloppa_ajax_payload(
            "https://www.seoulouba.co.kr/campaign/?cat=377&qq=popular&ar1=455&sort=deadline",
            page=3,
        )
        self.assertEqual(payload["cat"], "377")
        self.assertEqual(payload["qq"], "popular")
        self.assertEqual(payload["ar1"], "455")
        self.assertEqual(payload["sort"], "deadline")
        self.assertEqual(payload["page"], 3)

    def test_extract_gangnammatzip_listing_urls_discovers_category_links(self):
        html = """
        <a href="https://강남맛집.net/cp/?ca=30">제품</a>
        <a href="/cp/?rec=rc">선정확률 높은 캠페인</a>
        """
        urls = _extract_gangnammatzip_listing_urls(html)
        self.assertIn("https://gangnam-review.net/cp/?ca=30", urls)
        self.assertIn("https://gangnam-review.net/cp/?rec=rc", urls)

    def test_build_gangnammatzip_ajax_url_preserves_filters(self):
        url = _build_gangnammatzip_ajax_url(
            "https://gangnam-review.net/cp/?ca=20&rec=rc&sst=cmp_date_select&sod=asc",
            rpage=2,
        )
        self.assertIn("ca=20", url)
        self.assertIn("rec=rc", url)
        self.assertIn("sst=cmp_date_select", url)
        self.assertIn("sod=asc", url)
        self.assertIn("rpage=2", url)

    def test_estimate_deadline_from_labels(self):
        self.assertEqual(_estimate_deadline_from_d_label("D-day", today=date(2026, 3, 23)), "2026-03-23")
        self.assertEqual(_estimate_deadline_from_d_label("D-3", today=date(2026, 3, 23)), "2026-03-26")
        self.assertEqual(_estimate_deadline_from_d_label("6일 남음", today=date(2026, 3, 23)), "2026-03-29")

    def test_seouloppa_adapter_does_not_truncate_list_to_detail_limit(self):
        listing_html = """
        <li class="campaign_content">
          <div class="load_campaign"><a href="https://www.seoulouba.co.kr/campaign/?c=1" class="tum_img"><img src="https://example.com/1.jpg"></a></div>
          <div class="load_info"><div class="com_icon"><div class="icon_tag"><span>방문형</span></div></div><div class="t_ttl"><a href="https://www.seoulouba.co.kr/campaign/?c=1"><strong class="s_campaign_title">[서울] A</strong></a></div><div class="t_basic"><span class="basic_blue">A</span></div><div class="campaign_day_people"><div class="d_day"><span>D-1</span></div><div class="recruit"><span>신청 1 <span class="span_gray">/ 모집 1</span></span></div></div></div><div class="icon_box"><img src="https://www.seoulouba.co.kr/theme/souba3/img/thum_ch_blog.png"></div>
        </li>
        <li class="campaign_content">
          <div class="load_campaign"><a href="https://www.seoulouba.co.kr/campaign/?c=2" class="tum_img"><img src="https://example.com/2.jpg"></a></div>
          <div class="load_info"><div class="com_icon"><div class="icon_tag"><span>방문형</span></div></div><div class="t_ttl"><a href="https://www.seoulouba.co.kr/campaign/?c=2"><strong class="s_campaign_title">[서울] B</strong></a></div><div class="t_basic"><span class="basic_blue">B</span></div><div class="campaign_day_people"><div class="d_day"><span>D-2</span></div><div class="recruit"><span>신청 1 <span class="span_gray">/ 모집 1</span></span></div></div></div><div class="icon_box"><img src="https://www.seoulouba.co.kr/theme/souba3/img/thum_ch_blog.png"></div>
        </li>
        """

        with mock.patch("crawler.sources.seeded.fetch_text_url", return_value=listing_html), mock.patch(
            "crawler.sources.seeded._fetch_seouloppa_listing_fragments", return_value=[listing_html]
        ):
            items = SeoulOppaSourceAdapter(SEEDED_SOURCES["seouloppa"], detail_limit=1).fetch()

        self.assertEqual(len(items), 2)

    def test_gangnammatzip_adapter_does_not_truncate_list_to_detail_limit(self):
        listing_html = """
        <li class='list_item ' data-product='1'><div><div class='imgArea'><a href='/cp/?id=1'><img src='//example.com/1.jpg'></a></div><div class='textArea'><dl><span class='label'><em class='blog'>Blog</em><em class='type'>방문형</em><span class='dday'><em class='day_c'>6일 남음</em></span></span><dt class='tit'><a href='/cp/?id=1'>[서울] A</a></dt><dd class='sub_tit'>A</dd></dl><div class='item_detail'><p class='item_info'><span class='numb'><b style='color:#000'>신청 0</b> / 모집 1</span></p></div></div></div></li>
        <li class='list_item ' data-product='2'><div><div class='imgArea'><a href='/cp/?id=2'><img src='//example.com/2.jpg'></a></div><div class='textArea'><dl><span class='label'><em class='blog'>Blog</em><em class='type'>방문형</em><span class='dday'><em class='day_c'>6일 남음</em></span></span><dt class='tit'><a href='/cp/?id=2'>[서울] B</a></dt><dd class='sub_tit'>B</dd></dl><div class='item_detail'><p class='item_info'><span class='numb'><b style='color:#000'>신청 0</b> / 모집 1</span></p></div></div></div></li>
        """

        with mock.patch("crawler.sources.seeded.fetch_text_url", return_value=listing_html), mock.patch(
            "crawler.sources.seeded._fetch_gangnammatzip_listing_fragments", return_value=[listing_html]
        ), mock.patch("crawler.sources.seeded._extract_gangnammatzip_listing_urls", return_value=[]):
            items = GangnamMatzipSourceAdapter(SEEDED_SOURCES["gangnammatzip"], detail_limit=1).fetch()

        self.assertEqual(len(items), 2)

    def test_transform_reviewnote_api_item(self):
        item = transform_reviewnote_api_item(
            {
                "id": 1111346,
                "title": "미닉스 더 플렌더 PRO 음식물 처리기",
                "sort": "DELIVERY",
                "channel": "BLOG",
                "infNum": 1,
                "offer": "음식물 처리기 제공",
                "imageKey": "campaigns/c919ff8c-c092-4167-bd0e-d9f92b0ff9e7",
                "city": "재택",
                "applyEndAt": "2026-03-31T14:59:59.999Z",
                "productPurchasePoint": 199000,
                "additionalRewardPoint": 100000,
                "category": {"title": "디지털"},
                "status": "SELECT",
                "sido": {"name": "재택"},
            }
        )
        self.assertEqual(item["original_url"], "https://www.reviewnote.co.kr/campaigns/1111346")
        self.assertEqual(item["platform_type"], "blog")
        self.assertEqual(item["campaign_type"], "delivery")
        self.assertEqual(item["region_primary_name"], None)
        self.assertEqual(item["category_name"], "디지털")
        self.assertIn("페이백 100,000P", item["snippet"])

    def test_transform_revu_item(self):
        item = transform_revu_item(
            {
                "id": 1309316,
                "item": "[미사] 링크포토사진관 하남미사점",
                "media": "blog",
                "reviewerLimit": 3,
                "requestStartedOn": "2026-03-20",
                "requestEndedOn": "2026-03-25",
                "status": "REQUEST",
                "active": True,
                "thumbnail": "https://files.weble.net/campaign/data/1309316/thumb200.jpg",
                "campaignData": {"point": 0, "reward": "사진 중 택1"},
                "label": None,
                "category": ["지역_기타", "방문형"],
                "localTag": ["하남"],
                "venue": {"addressFirst": "경기 하남시 미사강변중앙로 173"},
            }
        )
        self.assertEqual(item["original_url"], "https://www.revu.net/campaign/1309316")
        self.assertEqual(item["platform_type"], "blog")
        self.assertEqual(item["campaign_type"], "visit")
        self.assertEqual(item["recruit_count"], 3)
        self.assertEqual(item["region_primary_name"], "경기")
        self.assertEqual(item["region_secondary_name"], "하남시")

    def test_parse_mrblog_listing(self):
        html = """
        <a href="https://www.mrblog.net/campaigns/1064298" class="campaign_item">
          <div class="thumb">
            <img src="https://storage.mrblog.net/sample.jpg" alt="">
          </div>
          <div class="txt">
            <span class="area"><span class="sns_icon blog"></span>대구 칠성동</span>
            <strong class="subject">스모프치킨 칠성점</strong>
            <p class="desc">3만원식사권 (반반치킨 양념/후라이드 필수 주문)</p>
            <div class="status">
              <span class="d_day">4일 남음</span>
              <div class="count"><span class="current">신청 <strong>21명</strong></span> / 모집 5명</div>
            </div>
          </div>
        </a>
        """
        items = parse_mrblog_listing(html)
        self.assertEqual(len(items), 1)
        item = items[0]
        self.assertEqual(item["title"], "스모프치킨 칠성점")
        self.assertEqual(item["original_url"], "https://www.mrblog.net/campaigns/1064298")
        self.assertEqual(item["platform_type"], "blog")
        self.assertEqual(item["region_primary_name"], "대구")
        self.assertEqual(item["region_secondary_name"], "칠성동")
        self.assertEqual(item["recruit_count"], 5)

    def test_build_source_quality_report(self):
        sample = [
            {
                "title": "서울 카페 체험단",
                "original_url": "https://example.com/campaign/1",
            }
        ]
        with tempfile.TemporaryDirectory() as tmpdir:
            path = Path(tmpdir) / "reviewnote.json"
            path.write_text(json.dumps(sample, ensure_ascii=False), encoding="utf-8")
            result = run_daily_refresh(
                ["reviewnote"],
                AppConfig(dry_run=True),
                source_file_dir=tmpdir,
                dry_run=True,
                delete_before_refresh=False,
            )
        report = build_source_quality_report(result)
        self.assertIn("# Public Source Quality Report", report)
        self.assertIn("| source | fetched | normalized |", report)


if __name__ == "__main__":
    unittest.main()
