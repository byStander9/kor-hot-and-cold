from pathlib import Path

from kor_hot_and_cold_pipeline.sources import HubSource, hub_sources, load_catalog, verify_source


CATALOG = Path(__file__).resolve().parents[2] / "data" / "sources" / "data_sources.yml"


def test_catalog_has_pinned_hugging_face_sources() -> None:
    sources = hub_sources(load_catalog(CATALOG))

    assert len(sources) >= 3
    assert all(len(source.revision) == 40 for source in sources)
    assert all(source.license_id for source in sources)


def test_verify_source_accepts_matching_revision_and_license() -> None:
    source = HubSource(
        source_id="example",
        hub_type="model",
        repo_id="owner/model",
        revision="a" * 40,
        license_id="mit",
        status="candidate",
    )

    errors = verify_source(
        source,
        fetcher=lambda _: {"sha": "a" * 40, "tags": ["license:mit"]},
    )

    assert errors == []


def test_verify_source_reports_changed_metadata() -> None:
    source = HubSource(
        source_id="example",
        hub_type="dataset",
        repo_id="owner/dataset",
        revision="a" * 40,
        license_id="apache-2.0",
        status="candidate",
    )

    errors = verify_source(
        source,
        fetcher=lambda _: {"sha": "b" * 40, "tags": ["license:mit"]},
    )

    assert len(errors) == 2
    assert "revision 불일치" in errors[0]
    assert "license 불일치" in errors[1]

