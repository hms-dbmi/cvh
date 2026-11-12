from unittest.mock import patch

from django.test import TestCase, TransactionTestCase

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
                dataset = self._create(ft, cfdb_dcc="encode", cfdb_id="ENCFF123")
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

        with (
            patch(
                "api.cfdb.requests.get",
                return_value=self._mock_response(500),
            ),
            self.assertRaises(CfdbError),
        ):
            dispatch_artifact("encode", "ENCFF1", kind="data")

    def test_202_without_location_raises(self):
        from .cfdb import dispatch_artifact

        with (
            patch(
                "api.cfdb.requests.get",
                return_value=self._mock_response(202),
            ),
            self.assertRaises(CfdbError),
        ):
            dispatch_artifact("encode", "ENCFF1", kind="data")


class AddWorkspaceMemberTests(TestCase):
    """POST /api/workspaces/<uuid>/members. The frontend branches on the
    `user_not_found` code to tell the inviter the email has no account, so
    that contract is asserted exactly.
    """

    def setUp(self):
        from django.contrib.auth.models import User

        from .models import Project, ProjectMember

        self.admin = User.objects.create(username="admin", email="admin@example.com")
        self.project = Project.objects.create(name="Shared", user_key=self.admin)
        ProjectMember.objects.create(
            project_key=self.project, user_key=self.admin, permissions=3
        )

        # Skip Auth0 JWT verification; authenticate every request as the admin.
        auth_patch = patch("api.auth.Authorized.authenticate", return_value=self.admin)
        auth_patch.start()
        self.addCleanup(auth_patch.stop)

    def _invite(self, email: str):
        return self.client.post(
            f"/api/workspaces/{self.project.uuid}/members",
            data={"email": email},
            content_type="application/json",
            HTTP_AUTHORIZATION="Bearer test-token",
        )

    def test_unknown_email_returns_user_not_found(self):
        from .models import ProjectMember

        response = self._invite("nobody@example.com")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["code"], "user_not_found")
        self.assertEqual(
            ProjectMember.objects.filter(project_key=self.project).count(), 1
        )

    def test_known_email_adds_read_member(self):
        from django.contrib.auth.models import User

        from .models import ProjectMember

        invitee = User.objects.create(username="invitee", email="invitee@example.com")

        response = self._invite("invitee@example.com")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})
        member = ProjectMember.objects.get(project_key=self.project, user_key=invitee)
        self.assertEqual(member.permissions, 1)

    def test_existing_member_returns_already_member(self):
        from django.contrib.auth.models import User

        from .models import ProjectMember

        invitee = User.objects.create(username="invitee", email="invitee@example.com")
        ProjectMember.objects.create(
            project_key=self.project, user_key=invitee, permissions=2
        )

        response = self._invite("invitee@example.com")

        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json()["code"], "already_member")
        # Still one row, with the permission they already had.
        member = ProjectMember.objects.get(project_key=self.project, user_key=invitee)
        self.assertEqual(member.permissions, 2)

    def test_inviting_yourself_keeps_your_access(self):
        from .models import ProjectMember

        response = self._invite("admin@example.com")

        self.assertEqual(response.status_code, 409)
        # A duplicate row used to make the workspace itself fail to load.
        workspace = self.client.get(
            f"/api/workspaces/{self.project.uuid}",
            HTTP_AUTHORIZATION="Bearer test-token",
        )
        self.assertEqual(workspace.status_code, 200)
        self.assertEqual(workspace.json()["permissions"], 3)
        self.assertEqual(
            ProjectMember.objects.filter(project_key=self.project).count(), 1
        )


class RemoveDuplicateMembersMigrationTests(TransactionTestCase):
    """0034 collapses duplicate memberships before adding its constraint, so
    it has to cope with the duplicates production may already hold."""

    def _migrate(self, target):
        from django.db import connection
        from django.db.migrations.executor import MigrationExecutor

        executor = MigrationExecutor(connection)
        executor.loader.build_graph()
        executor.migrate([("api", target)])
        return executor.loader.project_state([("api", target)]).apps

    def test_keeps_the_highest_permission_row(self):
        apps = self._migrate("0033_rename_vitessce_file_types")
        User = apps.get_model("auth", "User")
        Project = apps.get_model("api", "Project")
        ProjectMember = apps.get_model("api", "ProjectMember")
        user = User.objects.create(username="dup", email="dup@example.com")
        project = Project.objects.create(name="Dup", user_key=user)
        for permissions in (1, 3, 2):
            ProjectMember.objects.create(
                project_key=project, user_key=user, permissions=permissions
            )

        apps = self._migrate("0034_unique_project_member")

        rows = apps.get_model("api", "ProjectMember").objects.filter(
            project_key_id=project.pk, user_key_id=user.pk
        )
        self.assertEqual(list(rows.values_list("permissions", flat=True)), [3])


class CreateResponseTests(TestCase):
    """POST /api/workspaces and POST /api/datasets return the created
    record (uuid included), so API clients can act on it without a
    follow-up lookup.
    """

    def setUp(self):
        from django.contrib.auth.models import User

        from .models import Project, ProjectMember

        self.user = User.objects.create(username="owner", email="owner@example.com")
        self.project = Project.objects.create(name="Mine", user_key=self.user)
        ProjectMember.objects.create(
            project_key=self.project, user_key=self.user, permissions=3
        )

        auth_patch = patch("api.auth.Authorized.authenticate", return_value=self.user)
        auth_patch.start()
        self.addCleanup(auth_patch.stop)

    def _post(self, path: str, data: dict):
        return self.client.post(
            path,
            data=data,
            content_type="application/json",
            HTTP_AUTHORIZATION="Bearer test-token",
        )

    def test_create_workspace_returns_workspace(self):
        from .models import Project

        response = self._post(
            "/api/workspaces",
            {"name": "New", "description": "", "private": True},
        )

        self.assertEqual(response.status_code, 201)
        body = response.json()
        created = Project.objects.get(name="New")
        self.assertEqual(body["uuid"], str(created.uuid))
        self.assertEqual(body["permissions"], 3)
        self.assertEqual(body["datasets_count"], 0)
        # The backend seeds every new workspace with one visualization.
        self.assertEqual(body["visualizations_count"], 1)
        self.assertEqual(body["created_by"]["username"], "owner")

    def test_create_dataset_returns_dataset(self):
        response = self._post(
            "/api/datasets",
            {
                "workspace_uuid": str(self.project.uuid),
                "tool": "vitessce",
                "dataset": {
                    "name": "Cells",
                    "source_url": "https://example.com/cells.h5ad",
                    "file_type": "anndata.h5ad",
                },
            },
        )

        self.assertEqual(response.status_code, 201)
        body = response.json()
        created = Dataset.objects.get(name="Cells")
        self.assertEqual(body["uuid"], str(created.uuid))
        self.assertEqual(body["tool"], "vitessce")
        self.assertEqual(body["tags"], [])


class TokenVerificationTests(TestCase):
    """Bad tokens are the caller's problem (401, sign in again); an
    unreachable Auth0 is not (503). Before this, everything except a
    malformed token escaped as a 500."""

    DOMAIN = "https://cvh-test.example/"
    AUDIENCE = "https://api.cvh-test.example"

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        from cryptography.hazmat.primitives.asymmetric import rsa

        cls.private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

    def setUp(self):
        import os

        from django.contrib.auth.models import User

        env_patch = patch.dict(
            os.environ, {"AUTH0_DOMAIN": self.DOMAIN, "AUTH0_IDENTIFIER": self.AUDIENCE}
        )
        env_patch.start()
        self.addCleanup(env_patch.stop)

        self.jwks = patch("api.auth.PyJWKClient").start()
        self.addCleanup(patch.stopall)
        self.jwks.return_value.get_signing_key_from_jwt.return_value.key = (
            self.private_key.public_key()
        )

        User.objects.create(username="auth0_tester", email="tester@example.com")

    def _token(self, **overrides):
        import time

        import jwt

        claims = {
            "sub": "auth0|tester",
            "aud": self.AUDIENCE,
            "iss": self.DOMAIN,
            "iat": int(time.time()),
            "exp": int(time.time()) + 3600,
            **overrides,
        }
        return jwt.encode(claims, self.private_key, algorithm="RS256")

    def _get_user(self, token):
        return self.client.get("/api/user", HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_valid_token_is_accepted(self):
        response = self._get_user(self._token())

        self.assertEqual(response.status_code, 200)

    def test_expired_token_is_unauthorized(self):
        import time

        response = self._get_user(self._token(exp=int(time.time()) - 60))

        self.assertEqual(response.status_code, 401)

    def test_token_for_another_audience_is_unauthorized(self):
        response = self._get_user(self._token(aud="https://someone-else.example"))

        self.assertEqual(response.status_code, 401)

    def test_malformed_token_is_unauthorized(self):
        from jwt.exceptions import DecodeError

        self.jwks.return_value.get_signing_key_from_jwt.side_effect = DecodeError()

        response = self._get_user("not-a-jwt")

        self.assertEqual(response.status_code, 401)

    def test_unknown_signing_key_is_unauthorized(self):
        from jwt.exceptions import PyJWKClientError

        self.jwks.return_value.get_signing_key_from_jwt.side_effect = PyJWKClientError(
            "Unable to find a signing key that matches"
        )

        response = self._get_user(self._token())

        self.assertEqual(response.status_code, 401)

    def test_unreachable_auth0_is_service_unavailable(self):
        from jwt.exceptions import PyJWKClientConnectionError

        self.jwks.return_value.get_signing_key_from_jwt.side_effect = (
            PyJWKClientConnectionError("Fail to fetch data from the url")
        )

        response = self._get_user(self._token())

        self.assertEqual(response.status_code, 503)


class GlobalTagsEndpointRemovedTests(TestCase):
    """`GET /api/tags` needed no login and listed every workspace's tags,
    private ones included. Tags are only served per workspace now."""

    def test_global_tag_list_is_gone(self):
        from .models import Project, Tag

        Tag.objects.create(
            tag="embargoed-assay",
            key="assay",
            project_key=Project.objects.create(name="Private", private=True),
        )

        for path in ("/api/tags", "/api/tags?sub_str=embargoed"):
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 404)
                self.assertNotIn(b"embargoed-assay", response.content)


class VisualizationAuthorsTests(TestCase):
    """Authors are linked users: the creator is added on create, and anyone
    added must be a workspace member. Public pages show `name`, so it falls
    back to the email's local part and never carries an email."""

    def setUp(self):
        from django.contrib.auth.models import User

        from .models import Project, ProjectMember, VisualizationConf

        self.owner = User.objects.create(
            username="owner", email="owner@example.com", first_name="Ada"
        )
        self.member = User.objects.create(username="member", email="mem@example.com")
        self.outsider = User.objects.create(username="outsider", email="out@x.org")
        self.project = Project.objects.create(name="Shared", user_key=self.owner)
        for user, permissions in ((self.owner, 3), (self.member, 2)):
            ProjectMember.objects.create(
                project_key=self.project, user_key=user, permissions=permissions
            )
        self.viz = VisualizationConf.objects.create(
            project_key=self.project, name="Viz", published=True
        )

        auth_patch = patch("api.auth.Authorized.authenticate", return_value=self.owner)
        auth_patch.start()
        self.addCleanup(auth_patch.stop)

    def _send(self, method, path, data):
        return getattr(self.client, method)(
            path,
            data=data,
            content_type="application/json",
            HTTP_AUTHORIZATION="Bearer test-token",
        )

    def _set_authors(self, usernames):
        return self._send(
            "put",
            f"/api/visualizations/{self.viz.uuid}/authors",
            {"usernames": usernames},
        )

    def test_create_adds_creator_and_requested_members(self):
        response = self._send(
            "post",
            "/api/visualizations",
            {
                "workspace_uuid": str(self.project.uuid),
                "name": "New",
                "tool": "gosling",
                "author_usernames": ["member"],
            },
        )

        self.assertEqual(response.status_code, 201)
        self.assertCountEqual(
            response.json()["authors"],
            [
                {"username": "owner", "name": "Ada"},
                {"username": "member", "name": "mem"},
            ],
        )

    def test_create_rejects_non_members_and_creates_nothing(self):
        from .models import VisualizationConf

        response = self._send(
            "post",
            "/api/visualizations",
            {
                "workspace_uuid": str(self.project.uuid),
                "name": "New",
                "tool": "gosling",
                "author_usernames": ["outsider"],
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["code"], "not_a_member")
        self.assertFalse(VisualizationConf.objects.filter(name="New").exists())

    def test_set_authors_replaces_the_list(self):
        self.viz.authors.set([self.owner])

        response = self._set_authors(["member"])

        self.assertEqual(response.status_code, 200)
        self.assertEqual(list(self.viz.authors.all()), [self.member])

    def test_set_authors_rejects_non_members(self):
        response = self._set_authors(["owner", "outsider"])

        self.assertEqual(response.status_code, 400)
        self.assertIn("outsider", response.json()["detail"])
        self.assertEqual(self.viz.authors.count(), 0)

    def test_former_members_stay_authors(self):
        from .models import ProjectMember

        self.viz.authors.set([self.member])
        ProjectMember.objects.filter(user_key=self.member).delete()

        response = self._set_authors(["owner", "member"])

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.viz.authors.count(), 2)

    def test_public_visualization_shows_names_not_emails(self):
        self.viz.authors.set([self.owner, self.member])

        response = self.client.get(f"/api/public/visualizations/{self.viz.uuid}")

        self.assertEqual(
            sorted(a["name"] for a in response.json()["authors"]), ["Ada", "mem"]
        )
        self.assertNotIn(b"@example.com", response.content)


class YacAccessRequestTests(TestCase):
    """GET and POST /api/yac/access: the profile and Explore tab read the
    user's AI access state from these, and a request records the Auth0 ID."""

    def setUp(self):
        from django.contrib.auth.models import User

        self.user = User.objects.create(username="google-oauth2_42", email="a@x.org")

        def authenticate(request, token):
            request.auth0_user_id = "google-oauth2|42"
            return self.user

        auth_patch = patch("api.auth.Authorized.authenticate", side_effect=authenticate)
        auth_patch.start()
        self.addCleanup(auth_patch.stop)

    def _get(self):
        return self.client.get("/api/yac/access", HTTP_AUTHORIZATION="Bearer t")

    def _request(self):
        return self.client.post("/api/yac/access", HTTP_AUTHORIZATION="Bearer t")

    def test_new_user_has_not_asked(self):
        self.assertEqual(
            self._get().json(),
            {"status": "none", "requested_at": None, "decided_at": None},
        )

    def test_request_is_pending_and_records_the_auth0_id(self):
        from .models import YacAccessRequest

        response = self._request()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "pending")
        self.assertIsNotNone(response.json()["requested_at"])
        access = YacAccessRequest.objects.get(user=self.user)
        self.assertEqual(access.auth0_user_id, "google-oauth2|42")

    def test_cannot_request_again_in_any_state(self):
        from .models import YacAccessRequest

        self._request()
        for status in ("pending", "approved", "declined", "revoked"):
            YacAccessRequest.objects.filter(user=self.user).update(status=status)
            response = self._request()
            with self.subTest(status=status):
                self.assertEqual(response.status_code, 409)
                self.assertEqual(response.json()["code"], "already_requested")
                self.assertEqual(self._get().json()["status"], status)


class YacAccessAdminTests(TestCase):
    """Approve and revoke change the role in Auth0 first, and record the
    decision only if Auth0 accepted it."""

    def setUp(self):
        from django.contrib.admin.sites import site
        from django.contrib.auth.models import User
        from django.test import RequestFactory
        from django.utils import timezone

        from .admin import YacAccessRequestAdmin
        from .models import YacAccessRequest

        self.admin_user = User.objects.create(username="admin")
        requester = User.objects.create(username="google-oauth2_42")
        self.access = YacAccessRequest.objects.create(
            user=requester,
            auth0_user_id="google-oauth2|42",
            requested_at=timezone.now(),
        )
        self.model_admin = YacAccessRequestAdmin(YacAccessRequest, site)
        self.request = RequestFactory().post("/admin/")
        self.request.user = self.admin_user
        message_patch = patch.object(self.model_admin, "message_user")
        self.messages = message_patch.start()
        self.addCleanup(message_patch.stop)

    def _run(self, action):
        from .models import YacAccessRequest

        getattr(self.model_admin, action)(self.request, YacAccessRequest.objects.all())
        self.access.refresh_from_db()

    def test_approve_grants_the_role_then_records_it(self):
        with patch("api.admin.grant_yac_role") as grant:
            self._run("approve")

        grant.assert_called_once_with("google-oauth2|42")
        self.assertEqual(self.access.status, "approved")
        self.assertEqual(self.access.decided_by, self.admin_user)

    def test_approve_stays_pending_when_auth0_refuses(self):
        from .yac_access import Auth0ManagementError

        with patch("api.admin.grant_yac_role", side_effect=Auth0ManagementError("403")):
            self._run("approve")

        self.assertEqual(self.access.status, "pending")
        self.assertIsNone(self.access.decided_at)

    def test_approving_a_declined_request_restores_access(self):
        # Declined and revoked people contact us instead of asking again.
        self.access.status = "declined"
        self.access.save()

        with patch("api.admin.grant_yac_role") as grant:
            self._run("approve")

        grant.assert_called_once_with("google-oauth2|42")
        self.assertEqual(self.access.status, "approved")

    def test_revoke_removes_the_role(self):
        self.access.status = "approved"
        self.access.save()

        with patch("api.admin.remove_yac_role") as remove:
            self._run("revoke")

        remove.assert_called_once_with("google-oauth2|42")
        self.assertEqual(self.access.status, "revoked")

    def test_decline_needs_no_auth0_call(self):
        with patch("api.admin.grant_yac_role") as grant:
            self._run("decline")

        grant.assert_not_called()
        self.assertEqual(self.access.status, "declined")


class Auth0ManagementTests(TestCase):
    """The Management API call: one cached token, and the user ID encoded,
    since Auth0 IDs contain `|`."""

    def setUp(self):
        from django.core.cache import cache

        cache.clear()
        self.addCleanup(cache.clear)

    def test_grant_posts_the_role_with_an_encoded_user_id(self):
        from unittest.mock import MagicMock

        from django.test import override_settings

        from .yac_access import grant_yac_role

        token = MagicMock(ok=True)
        token.json.return_value = {"access_token": "mgmt", "expires_in": 86400}
        with (
            override_settings(
                AUTH0_DOMAIN="https://cvh-test.example/",
                AUTH0_MGMT_CLIENT_ID="id",
                AUTH0_MGMT_CLIENT_SECRET="secret",
                YAC_AUTH0_ROLE_ID="rol_yac",
            ),
            patch("api.yac_access.requests.post", return_value=token) as post,
            patch(
                "api.yac_access.requests.request", return_value=MagicMock(ok=True)
            ) as call,
        ):
            grant_yac_role("google-oauth2|42")
            grant_yac_role("google-oauth2|43")

        post.assert_called_once()  # the token is reused
        method, url = call.call_args.args
        self.assertEqual(method, "POST")
        self.assertEqual(
            url, "https://cvh-test.example/api/v2/users/google-oauth2%7C43/roles"
        )
        self.assertEqual(call.call_args.kwargs["json"], {"roles": ["rol_yac"]})
        headers = call.call_args.kwargs["headers"]
        self.assertEqual(headers["Authorization"], "Bearer mgmt")

    def test_unreachable_auth0_is_reported_not_raised(self):
        import requests
        from django.test import override_settings

        from .yac_access import Auth0ManagementError, grant_yac_role

        with (
            override_settings(
                AUTH0_DOMAIN="https://cvh-test.example/",
                AUTH0_MGMT_CLIENT_ID="id",
                AUTH0_MGMT_CLIENT_SECRET="secret",
                YAC_AUTH0_ROLE_ID="rol_yac",
            ),
            patch("api.yac_access.requests.post", side_effect=requests.Timeout()),
            self.assertRaisesMessage(Auth0ManagementError, "Couldn't reach Auth0"),
        ):
            grant_yac_role("google-oauth2|42")
