from __future__ import annotations

import json
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any


PROJECT = Path(__file__).resolve().parents[1]
WORKSPACE = PROJECT.parents[1]
sys.path.insert(0, str(WORKSPACE))

import easystore_direct_upload as uploader  # noqa: E402


FULL_JSON = PROJECT / "public" / "official-search.json"
COMPACT_JSON = PROJECT / "public" / "official-search-compact.json"
COMPACT_PARTS = (
    PROJECT / "public" / "official-search-compact-1.json",
    PROJECT / "public" / "official-search-compact-2.json",
)


def product_rows(data: object) -> list[dict[str, Any]]:
    if not isinstance(data, dict):
        return []
    rows = ((data.get("data") or {}).get("products") or [])
    return rows if isinstance(rows, list) else []


def load_existing() -> dict[str, dict[str, Any]]:
    if not FULL_JSON.exists():
        return {}
    rows = json.loads(FULL_JSON.read_text(encoding="utf-8"))
    return {
        str(row.get("url") or ""): row
        for row in rows
        if isinstance(row, dict) and row.get("url")
    }


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


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="backslashreplace")
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

    FULL_JSON.write_text(json.dumps(rows, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    compact = [
        [
            row["title"],
            row["author"],
            row["publisher"],
            row["url"].removeprefix("https://2book.tw"),
            row["image_url"],
        ]
        for row in rows
    ]
    COMPACT_JSON.write_text(json.dumps(compact, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    split_at = (len(compact) + 1) // 2
    compact_parts = (compact[:split_at], compact[split_at:])
    for path, part in zip(COMPACT_PARTS, compact_parts, strict=True):
        path.write_text(json.dumps(part, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(
        json.dumps(
            {
                "backend_products": len(products),
                "published_unique_urls": len(rows),
                "with_images": sum(bool(row["image_url"]) for row in rows),
                "full_bytes": FULL_JSON.stat().st_size,
                "compact_bytes": COMPACT_JSON.stat().st_size,
                "compact_part_bytes": [path.stat().st_size for path in COMPACT_PARTS],
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
