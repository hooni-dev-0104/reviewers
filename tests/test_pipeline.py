import json
import tempfile
import unittest
from pathlib import Path

from crawler.config import AppConfig
from crawler.pipeline import build_campaign_payload, run_daily_refresh, run_source_pipeline
from crawler.reporting import build_source_quality_report
from crawler.normalization import normalize_campaign
from crawler.sources.seeded import (
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
    def test_build_campaign_payload(self):
        campaign = normalize_campaign(
            "reviewnote",
            "source-1",
            {
                "title": "테스트",
                "original_url": "https://example.com/c/1",
                "platform_type": "blog",
                "campaign_type": "visit",
            },
        )
        payload = build_campaign_payload(campaign)
        self.assertEqual(payload["source_id"], "source-1")
        self.assertEqual(payload["original_url"], "https://example.com/c/1")

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
        <dt class="cam_info_con_dt lititle">사이트 URL</dt>
        <dd class="cam_info_con_dd"><a href="https://m.site.naver.com/23cJ9"></a></dd>
        """
        enriched = enrich_seouloppa_detail(item, detail_html)
        self.assertEqual(enriched["benefit_text"], "팩앤롤 디럭스 1EA (색상 선택)")
        self.assertEqual(enriched["published_at"], "2026-03-19")
        self.assertEqual(enriched["apply_deadline"], "2026-03-23")

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
