import unittest

from crawler.normalization import (
    normalize_campaign,
    normalize_campaign_type,
    normalize_platform_type,
    normalize_status,
)


class NormalizationTests(unittest.TestCase):
    def test_platform_normalization(self):
        self.assertEqual(normalize_platform_type("instagram"), "instagram")
        self.assertEqual(normalize_platform_type("insta"), "instagram")
        self.assertEqual(normalize_platform_type("unknown"), "etc")

    def test_campaign_type_normalization(self):
        self.assertEqual(normalize_campaign_type("배송"), "delivery")
        self.assertEqual(normalize_campaign_type("visit"), "visit")

    def test_status_normalization(self):
        self.assertEqual(normalize_status("closed"), "expired")
        self.assertEqual(normalize_status(None), "active")

    def test_campaign_requires_title_and_url(self):
        with self.assertRaises(ValueError):
            normalize_campaign("reviewnote", None, {"title": "only-title"})

    def test_campaign_normalization(self):
        record = normalize_campaign(
            "reviewnote",
            "source-uuid",
            {
                "title": "서울 카페 체험단",
                "original_url": "https://example.com/1",
                "platform_type": "insta",
                "campaign_type": "배송",
                "status": "closed",
            },
        )
        self.assertEqual(record.platform_type, "instagram")
        self.assertEqual(record.campaign_type, "delivery")
        self.assertEqual(record.status, "expired")


if __name__ == "__main__":
    unittest.main()
