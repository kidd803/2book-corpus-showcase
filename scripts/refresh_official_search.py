from __future__ import annotations

import json
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
from typing import Any


PROJECT = Path(__file__).resolve().parents[1]
WORKSPACE = PROJECT.parents[1]
sys.path.insert(0, str(WORKSPACE))

import easystore_direct_upload as uploader  # noqa: E402


FULL_JSON = PROJECT / "data" / "official-search.json"
LEGACY_FULL_JSON = PROJECT / "public" / "official-search.json"
LEGACY_COMPACT_FILES = (
    PROJECT / "public" / "official-search-compact.json",
    PROJECT / "public" / "official-search-compact-1.json",
    PROJECT / "public" / "official-search-compact-2.json",
)
SEARCH_MANIFEST = PROJECT / "public" / "official-search-manifest.json"
SEARCH_INDEX_PARTS = (
    PROJECT / "public" / "official-search-index-1.json",
    PROJECT / "public" / "official-search-index-2.json",
)
SEARCH_DETAIL_PREFIX = "official-search-detail-"
LEGACY_SEARCH_DETAILS_DIR = PROJECT / "public" / "official-search-details"
DETAIL_SHARD_SIZE = 1000


def product_rows(data: object) -> list[dict[str, Any]]:
    if not isinstance(data, dict):
        return []
    rows = ((data.get("data") or {}).get("products") or [])
    return rows if isinstance(rows, list) else []


def load_existing() -> dict[str, dict[str, Any]]:
    migrate_local_source()
    if not FULL_JSON.exists():
        return {}
    rows = json.loads(FULL_JSON.read_text(encoding="utf-8"))
    return {
        str(row.get("url") or ""): row
        for row in rows
        if isinstance(row, dict) and row.get("url")
    }


def migrate_local_source() -> None:
    if FULL_JSON.exists() or not LEGACY_FULL_JSON.exists():
        return
    FULL_JSON.parent.mkdir(parents=True, exist_ok=True)
    LEGACY_FULL_JSON.replace(FULL_JSON)


def fetch_all(client: uploader.EasyStoreClient, limit: int = 1000, workers: int = 12) -> list[dict[str, Any]]:
    def fetch(page: int) -> tuple[int, object]:
        return page, client.get_json(
            "/admin/v2/store/products",
            {"page": page, "limit": limit, "sort": "position.desc"},
        )

    _, first = fetch(1)
    params = first.get("params", {}) if isinstance(first, dict) else {}
    page_count = int(params.get("page_count") or 1)
    pages: dict[int, object] = {1: first}
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = [executor.submit(fetch, page) for page in range(2, page_count + 1)]
        for received, future in enumerate(as_completed(futures), start=2):
            page, data = future.result()
            pages[page] = data
            if received % 10 == 0 or received == page_count:
                print(json.dumps({"pages_received": received, "page_count": page_count}), flush=True)
    products: list[dict[str, Any]] = []
    for page in range(1, page_count + 1):
        products.extend(product_rows(pages[page]))
    return products


def build_fast_search_assets(rows: list[dict[str, Any]]) -> dict[str, Any]:
    version = f"stock-{len(rows)}-{datetime.now().strftime('%Y%m%d')}"
    search_terms = [
        " ".join(
            part
            for part in (
                str(row.get("title") or "").strip(),
                str(row.get("author") or "").strip(),
                str(row.get("publisher") or "").strip(),
            )
            if part
        ).lower()
        for row in rows
    ]
    split_at = (len(search_terms) + 1) // 2
    for path, part in zip(SEARCH_INDEX_PARTS, (search_terms[:split_at], search_terms[split_at:]), strict=True):
        path.write_text(json.dumps(part, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    for old_shard in (PROJECT / "public").glob(f"{SEARCH_DETAIL_PREFIX}*.json"):
        old_shard.unlink()
    if LEGACY_SEARCH_DETAILS_DIR.exists():
        for old_shard in LEGACY_SEARCH_DETAILS_DIR.glob("*.json"):
            old_shard.unlink()
        LEGACY_SEARCH_DETAILS_DIR.rmdir()
    details = [
        [
            str(row.get("title") or "").strip(),
            str(row.get("author") or "").strip(),
            str(row.get("publisher") or "").strip(),
            str(row.get("url") or "").removeprefix("https://2book.tw"),
            str(row.get("image_url") or "").strip(),
        ]
        for row in rows
    ]
    shard_count = 0
    for start in range(0, len(details), DETAIL_SHARD_SIZE):
        shard_path = PROJECT / "public" / f"{SEARCH_DETAIL_PREFIX}{shard_count:03d}.json"
        shard_path.write_text(
            json.dumps(details[start : start + DETAIL_SHARD_SIZE], ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        shard_count += 1

    manifest = {
        "version": version,
        "total": len(rows),
        "shard_size": DETAIL_SHARD_SIZE,
        "shard_count": shard_count,
        "index_parts": [f"/{path.name}?v={version}" for path in SEARCH_INDEX_PARTS],
        "details_prefix": f"/{SEARCH_DETAIL_PREFIX}",
    }
    SEARCH_MANIFEST.write_text(
        json.dumps(manifest, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    for legacy_file in LEGACY_COMPACT_FILES:
        if legacy_file.exists():
            legacy_file.unlink()
    return {
        "search_version": version,
        "search_index_bytes": [path.stat().st_size for path in SEARCH_INDEX_PARTS],
        "detail_shards": shard_count,
    }


def load_rows_for_asset_build() -> list[dict[str, Any]]:
    migrate_local_source()
    if FULL_JSON.exists():
        rows = json.loads(FULL_JSON.read_text(encoding="utf-8"))
        if isinstance(rows, list):
            return [row for row in rows if isinstance(row, dict)]
    raise FileNotFoundError(f"Missing local source: {FULL_JSON}")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="backslashreplace")
    if "--build-assets-only" in sys.argv:
        rows = load_rows_for_asset_build()
        result = {"published_unique_urls": len(rows), **build_fast_search_assets(rows)}
        print(json.dumps(result, ensure_ascii=False))
        return 0
    existing = load_existing()
    client = uploader.EasyStoreClient()
    products = fetch_all(client)
    rows: list[dict[str, Any]] = []
    seen_urls: set[str] = set()
    for product in products:
        if product.get("is_deleted") is True or product.get("is_published") is not True:
            continue
        try:
            total_quantity = int(product.get("total_quantity") or 0)
        except (TypeError, ValueError):
            total_quantity = 0
        if total_quantity <= 0:
            continue
        handle = str(product.get("handle") or "").strip("/")
        if not handle:
            continue
        url = f"https://2book.tw/products/{handle}"
        if url in seen_urls:
            continue
        seen_urls.add(url)
        old = existing.get(url, {})
        rows.append(
            {
                "id": str(product.get("id") or ""),
                "title": str(product.get("title") or old.get("title") or "").strip(),
                "author": str(old.get("author") or "").strip(),
                "publisher": str(old.get("publisher") or "").strip(),
                "publish_date": str(old.get("publish_date") or "").strip(),
                "url": url,
                "image_url": str(product.get("image_url") or "").strip(),
            }
        )

    FULL_JSON.parent.mkdir(parents=True, exist_ok=True)
    FULL_JSON.write_text(json.dumps(rows, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    fast_search = build_fast_search_assets(rows)
    print(
        json.dumps(
            {
                "backend_products": len(products),
                "published_unique_urls": len(rows),
                "with_images": sum(bool(row["image_url"]) for row in rows),
                "full_bytes": FULL_JSON.stat().st_size,
                **fast_search,
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
