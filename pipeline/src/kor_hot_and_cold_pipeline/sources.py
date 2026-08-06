from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable

import yaml


HF_API_ROOT = "https://huggingface.co/api"


@dataclass(frozen=True)
class HubSource:
    source_id: str
    hub_type: str
    repo_id: str
    revision: str
    license_id: str
    status: str

    @property
    def api_url(self) -> str:
        collection = "models" if self.hub_type == "model" else "datasets"
        return f"{HF_API_ROOT}/{collection}/{self.repo_id}"


def load_catalog(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as file:
        catalog = yaml.safe_load(file)

    if not isinstance(catalog, dict) or catalog.get("version") != 1:
        raise ValueError("지원하지 않는 데이터 출처 목록 형식입니다.")
    if not isinstance(catalog.get("sources"), list):
        raise ValueError("sources는 목록이어야 합니다.")
    return catalog


def hub_sources(catalog: dict[str, Any]) -> list[HubSource]:
    sources: list[HubSource] = []
    for item in catalog["sources"]:
        hub = item.get("hugging_face")
        if not hub:
            continue
        sources.append(
            HubSource(
                source_id=item["id"],
                hub_type=hub["type"],
                repo_id=hub["repo_id"],
                revision=hub["revision"],
                license_id=item["license"]["id"],
                status=item["status"],
            )
        )
    return sources


def fetch_json(url: str) -> dict[str, Any]:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "kor-hot-and-cold-source-verifier/0.1"},
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.load(response)


def verify_source(
    source: HubSource,
    fetcher: Callable[[str], dict[str, Any]] = fetch_json,
) -> list[str]:
    metadata = fetcher(source.api_url)
    errors: list[str] = []

    if metadata.get("sha") != source.revision:
        errors.append(
            f"revision 불일치: catalog={source.revision}, hub={metadata.get('sha')}"
        )

    declared_licenses = {
        tag.removeprefix("license:")
        for tag in metadata.get("tags", [])
        if tag.startswith("license:")
    }
    if source.license_id not in declared_licenses:
        errors.append(
            "license 불일치: "
            f"catalog={source.license_id}, hub={sorted(declared_licenses) or ['미표기']}"
        )

    return errors


def default_catalog_path() -> Path:
    return Path(__file__).resolve().parents[3] / "data" / "sources" / "data_sources.yml"


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Hugging Face 출처의 고정 리비전과 라이선스를 검증합니다."
    )
    parser.add_argument(
        "--catalog",
        type=Path,
        default=default_catalog_path(),
        help="data_sources.yml 경로",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    catalog = load_catalog(args.catalog)
    failed = False

    for source in hub_sources(catalog):
        try:
            errors = verify_source(source)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
            print(f"[실패] {source.source_id}: Hub 조회 오류: {error}")
            failed = True
            continue

        if errors:
            failed = True
            for error in errors:
                print(f"[실패] {source.source_id}: {error}")
        else:
            print(
                f"[통과] {source.source_id}: {source.repo_id}@{source.revision[:12]} "
                f"({source.license_id}, {source.status})"
            )

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())

