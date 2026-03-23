from __future__ import annotations

import json
import ssl
import http.cookiejar
import urllib.parse
import urllib.request
import urllib.error
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

from crawler.models import SourceDefinition


class BaseSourceAdapter(ABC):
    def __init__(self, definition: SourceDefinition):
        self.definition = definition

    @abstractmethod
    def fetch(self) -> list[dict[str, Any]]:
        raise NotImplementedError


class FileSourceAdapter(BaseSourceAdapter):
    def __init__(self, definition: SourceDefinition, path: str | Path):
        super().__init__(definition)
        self.path = Path(path)

    def fetch(self) -> list[dict[str, Any]]:
        data = json.loads(self.path.read_text(encoding="utf-8"))
        if not isinstance(data, list):
            raise ValueError("source file must contain a JSON array")
        return data


class PlaceholderSourceAdapter(BaseSourceAdapter):
    def fetch(self) -> list[dict[str, Any]]:
        raise NotImplementedError(
            f"Real scraping for '{self.definition.slug}' is intentionally not implemented in this stdlib scaffold."
        )


def fetch_text_url(url: str, timeout: int = 30) -> str:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; ReviewersCrawler/0.1; +https://reviewers.local)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return response.read().decode("utf-8", errors="ignore")
    except ssl.SSLCertVerificationError:
        insecure_context = ssl._create_unverified_context()
        with urllib.request.urlopen(request, timeout=timeout, context=insecure_context) as response:
            return response.read().decode("utf-8", errors="ignore")
    except urllib.error.URLError as exc:
        if isinstance(exc.reason, ssl.SSLCertVerificationError):
            insecure_context = ssl._create_unverified_context()
            with urllib.request.urlopen(request, timeout=timeout, context=insecure_context) as response:
                return response.read().decode("utf-8", errors="ignore")
        raise


def fetch_json_url(url: str, timeout: int = 30) -> Any:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; ReviewersCrawler/0.1; +https://4blog.net)",
            "Accept": "application/json,text/plain,*/*",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except ssl.SSLCertVerificationError:
        insecure_context = ssl._create_unverified_context()
        with urllib.request.urlopen(request, timeout=timeout, context=insecure_context) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.URLError as exc:
        if isinstance(exc.reason, ssl.SSLCertVerificationError):
            insecure_context = ssl._create_unverified_context()
            with urllib.request.urlopen(request, timeout=timeout, context=insecure_context) as response:
                return json.loads(response.read().decode("utf-8"))
        raise


def fetch_session_json(seed_url: str, url: str, timeout: int = 30, headers: dict[str, str] | None = None) -> Any:
    cookie_jar = http.cookiejar.CookieJar()
    context = ssl._create_unverified_context()
    opener = urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor(cookie_jar),
        urllib.request.HTTPSHandler(context=context),
    )
    opener.addheaders = [("User-Agent", "Mozilla/5.0 (compatible; ReviewersCrawler/0.1; +https://reviewers.local)")]
    opener.open(seed_url, timeout=timeout).read()
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; ReviewersCrawler/0.1; +https://reviewers.local)",
            "X-Requested-With": "XMLHttpRequest",
            **(headers or {}),
        },
    )
    with opener.open(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8", errors="ignore"))


def fetch_json_with_headers(url: str, headers: dict[str, str], timeout: int = 30) -> Any:
    request = urllib.request.Request(url, headers=headers)
    context = ssl._create_unverified_context()
    with urllib.request.urlopen(request, timeout=timeout, context=context) as response:
        return json.loads(response.read().decode("utf-8", errors="ignore"))


def post_json_with_headers(url: str, headers: dict[str, str], payload: dict[str, Any], timeout: int = 30) -> Any:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            **headers,
        },
        method="POST",
    )
    context = ssl._create_unverified_context()
    with urllib.request.urlopen(request, timeout=timeout, context=context) as response:
        return json.loads(response.read().decode("utf-8", errors="ignore"))


def post_form_for_text(url: str, payload: dict[str, Any], headers: dict[str, str] | None = None, timeout: int = 30) -> str:
    request = urllib.request.Request(
        url,
        data=urllib.parse.urlencode(payload).encode("utf-8"),
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; ReviewersCrawler/0.1; +https://reviewers.local)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            **(headers or {}),
        },
        method="POST",
    )
    context = ssl._create_unverified_context()
    with urllib.request.urlopen(request, timeout=timeout, context=context) as response:
        return response.read().decode("utf-8", errors="ignore")
