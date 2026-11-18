"""Build cfdb.duckdb for YAC from a raw cfdb (C2M2) DuckDB dump.

    uv run --python 3.13 --with 'duckdb>=2,<3' python yac/cfdb/build.py ~/Downloads/cfdb.duckdb yac/cfdb/cfdb.duckdb

The dump is attached read-only. Deploy the output together with
yac-packages.json (docs/yac.md).
"""

import sys
from pathlib import Path

import duckdb

dump, out = sys.argv[1], sys.argv[2]
Path(out).unlink(missing_ok=True)
with duckdb.connect(out) as con:
    con.execute(f"ATTACH '{dump.replace(chr(39), chr(39) * 2)}' AS src (READ_ONLY)")
    con.execute((Path(__file__).parent / "build.sql").read_text())
    con.execute("DETACH src")
    for table in ("files", "collections", "biosamples", "subjects"):
        print(table, con.execute(f'SELECT count(*) FROM "{table}"').fetchone()[0])
