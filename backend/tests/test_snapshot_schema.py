import json
from pathlib import Path


SNAPSHOT = Path(__file__).resolve().parents[2] / "src" / "data" / "snapshot.json"


def test_real_stock_snapshot_is_complete():
    payload = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    assert len(payload["stocks"]) == 6
    for stock in payload["stocks"]:
        assert len(stock["chart"]) == 120
        assert stock["price"] > 0
        assert stock["amount"] > 0
        assert stock["low52"] <= stock["price"] <= stock["high52"]
        for candle in stock["chart"]:
            assert candle["low"] <= min(candle["open"], candle["close"])
            assert candle["high"] >= max(candle["open"], candle["close"])

