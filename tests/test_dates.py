import unittest
from datetime import date
from crawler.dates import parse_day, parse_range, deadline_for_storage

class DateTests(unittest.TestCase):
    def test_october_does_not_promote_march(self):
        self.assertEqual(parse_range('03.26 ~ 03.31', date(2026, 10, 1)), ('2026-03-26', '2026-03-31'))
    def test_year_boundary_and_explicit_year(self):
        for today in (date(2026, 12, 31), date(2027, 1, 1)):
            self.assertEqual(parse_range('12.28 ~ 01.03', today), ('2026-12-28', '2027-01-03'))
        self.assertEqual(parse_range('2024-12-28 ~ 2025-01-03', date(2026, 10, 1)), ('2024-12-28', '2025-01-03'))
    def test_invalid_and_ambiguous_ranges(self):
        for value in (None, '', '02.30 ~ 03.01', '04.02 ~ 03.01', '12.28 ~ 01.03'):
            self.assertEqual(parse_range(value, date(2026, 10, 1)), (None, None))
        self.assertEqual(parse_day('02.29', date(2024, 3, 1)), '2024-02-29')
        self.assertIsNone(parse_day('02.29', date(2026, 3, 1)))
    def test_storage_preserves_timestamp_and_ends_date_in_kst(self):
        self.assertEqual(deadline_for_storage('2026-10-01'), '2026-10-01T23:59:59.999+09:00')
        self.assertEqual(deadline_for_storage('2026-10-01T12:00:00Z'), '2026-10-01T12:00:00Z')
