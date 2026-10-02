# Shanghai gold premium — morning refresh

Field: `prices.shaGoldPrem` (integer USD/oz; positive = Shanghai premium, negative = discount).

## Preferred source (free, daily table)

1. Open https://findbullionprices.com/spot-prices/gold-price/shanghai
2. From the **Last 30 Trading Days** table, take the latest row:
   - `AM $/oz` (SHAU morning fix, USD/oz)
   - `COMEX $/oz`
3. Compute: `round(AM_USD_oz − COMEX_USD_oz)` → write as `shaGoldPrem`.
4. Optional cross-check: page header “Premium vs COMEX” % ≈ prem / COMEX.

## Alternates

- World Gold Council Weekly Markets Monitor (Chinese Au9999 vs LBMA PM; weekly avg).
- Gate/Jin10 or SGE prints in ¥/g vs international — convert with USD/CNY and troy-oz factor (31.1035 g/oz) if needed; prefer the USD table above.
- SGE daily report: https://en.sge.com.cn/ (Au99.99 / Au9999) when the English daily table is up.

## Desk label

Shown as a **subline under GOLD** (`SHA +$N` / `SHA -$N`, green premium / red discount). No standalone SHA+/- cell.
