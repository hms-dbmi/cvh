from unittest.mock import patch

from django.test import TestCase

from .cfdb import CfdbDispatchResult, CfdbError, _parse_job_id
from .models import Dataset


class DatasetProcessingStatusTests(TestCase):
    """Processing status is only set to NEEDED for library-sourced datasets
    (i.e. those with cfdb_dcc + cfdb_id populated). User-added datasets stay
    NOT_NEEDED regardless of file_type.
    """

    def _create(self, file_type: str, **kwargs) -> Dataset:
        return Dataset.objects.create(
            name=f"t-{file_type}",
            source_url="https://example.com/file",
            file_type=file_type,
            data_type="genomic",
            **kwargs,
        )

    def test_non_processable_format_starts_not_needed(self):
        dataset = self._create("bigwig")
        self.assertEqual(
            dataset.processing_status,
            Dataset.ProcessingStatus.NOT_NEEDED,
        )

    def test_user_added_processable_format_stays_not_needed(self):
        # A BAM the user pasted via URL+index is not library-sourced, so it
        # doesn't go through cfdb regardless of being a "processable" type.
        dataset = self._create("bam")
        self.assertEqual(
            dataset.processing_status,
            Dataset.ProcessingStatus.NOT_NEEDED,
        )

    def test_library_sourced_processable_starts_needed(self):
        for ft in ("bam", "sam", "vcf", "gff", "gtf", "bed", "bigbed"):
            with self.subTest(file_type=ft):
                dataset = self._create(
                    ft, cfdb_dcc="encode", cfdb_id="ENCFF123"
                )
                self.assertEqual(
                    dataset.processing_status,
                    Dataset.ProcessingStatus.NEEDED,
                )

    def test_library_sourced_non_processable_stays_not_needed(self):
        # cfdb backing doesn't matter for formats that don't need processing
        # (e.g. bigwig). Belt-and-suspenders: even if such a row showed up,
        # we shouldn't enqueue it for processing.
        dataset = self._create("bigwig", cfdb_dcc="encode", cfdb_id="ENCFF1")
        self.assertEqual(
            dataset.processing_status,
            Dataset.ProcessingStatus.NOT_NEEDED,
        )

    def test_library_sourced_processable_is_case_insensitive(self):
        dataset = self._create("BAM", cfdb_dcc="encode", cfdb_id="X")
        self.assertEqual(
            dataset.processing_status,
            Dataset.ProcessingStatus.NEEDED,
        )

    def test_update_preserves_processing_status(self):
        dataset = self._create("bam", cfdb_dcc="encode", cfdb_id="X")
        dataset.processing_status = Dataset.ProcessingStatus.STARTED
        dataset.processing_job_id = "job-123"
        dataset.save()

        dataset.refresh_from_db()
        self.assertEqual(
            dataset.processing_status,
            Dataset.ProcessingStatus.STARTED,
        )
        self.assertEqual(dataset.processing_job_id, "job-123")


class ParseJobIdTests(TestCase):
    """Job ID extraction from cfdb's `Location` header. cfdb may use a
    relative path or absolute URL, both must work.
    """

    def test_relative_path(self):
        self.assertEqual(_parse_job_id("/jobs/abc-123"), "abc-123")

    def test_absolute_url(self):
        self.assertEqual(
            _parse_job_id("https://cfdb.vis-api.link/jobs/abc-123"),
            "abc-123",
        )

    def test_trailing_slash(self):
        self.assertEqual(_parse_job_id("/jobs/abc-123/"), "abc-123")

    def test_missing(self):
        self.assertIsNone(_parse_job_id(""))

    def test_unrelated_path(self):
        self.assertIsNone(_parse_job_id("/data/encode/X"))


class DispatchProcessingTests(TestCase):
    """`dispatch_processing` parses cfdb's response into a CfdbDispatchResult.
    The function does the HTTP call; tests stub `requests.get`.
    """

    def _mock_response(self, status_code: int, location: str | None = None):
        from unittest.mock import MagicMock

        mock = MagicMock()
        mock.__enter__.return_value = mock
        mock.__exit__.return_value = False
        mock.status_code = status_code
        mock.headers = {"Location": location} if location else {}
        return mock

    def test_202_returns_job_id(self):
        from .cfdb import dispatch_artifact

        with patch(
            "api.cfdb.requests.get",
            return_value=self._mock_response(202, "/jobs/xyz"),
        ):
            result = dispatch_artifact("encode", "ENCFF1", kind="data")
        self.assertEqual(result, CfdbDispatchResult(202, "xyz"))

    def test_200_returns_no_job_id(self):
        from .cfdb import dispatch_artifact

        with patch(
            "api.cfdb.requests.get",
            return_value=self._mock_response(200),
        ):
            result = dispatch_artifact("encode", "ENCFF1", kind="data")
        self.assertEqual(result, CfdbDispatchResult(200, None))

    def test_unexpected_status_raises(self):
        from .cfdb import dispatch_artifact

        with patch(
            "api.cfdb.requests.get",
            return_value=self._mock_response(500),
        ), self.assertRaises(CfdbError):
            dispatch_artifact("encode", "ENCFF1", kind="data")

    def test_202_without_location_raises(self):
        from .cfdb import dispatch_artifact

        with patch(
            "api.cfdb.requests.get",
            return_value=self._mock_response(202),
        ), self.assertRaises(CfdbError):
            dispatch_artifact("encode", "ENCFF1", kind="data")
