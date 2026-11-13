"""Build the three messy shift files from the PIADE raw data.

Usage: python fixtures/make_fixtures.py /path/to/piade/raw_data.csv

PIADE (Beghi et al., Zenodo, DOI 10.5281/zenodo.7071747, CC BY 4.0) gives
real machine intervals: start times, output counts and alarm codes. This
script keeps those and adds the shop columns described in fixtures/NOTE.md.
The output is deterministic, so running it twice gives the same files.
"""

import random
import sys
from pathlib import Path

import pandas as pd

OUT = Path(__file__).parent
WEEK_START = pd.Timestamp("2021-05-03")  # Monday
WEEK_END = pd.Timestamp("2021-05-10")
DEMO_DAY = 4  # Tuesday May 4
SLOT_HOURS = 2

MACHINES = {
    "s_1": ("Press 1", "Stamping"),
    "s_2": ("Press 2", "Stamping"),
    "s_3": ("Press 3", "Stamping"),
    "s_4": ("Bench 2", "Deburring"),
    "s_5": ("Weld 1", "Welding"),
}
PARTS = {"s_1": "B-118", "s_2": "B-305", "s_3": "B-220"}
OPERATORS = {  # (machine, shift) -> operator ID
    ("s_1", 1): "OP-114", ("s_2", 1): "OP-207", ("s_3", 1): "OP-114",
    ("s_4", 1): "OP-310", ("s_5", 1): "OP-412",
    ("s_1", 2): "OP-121", ("s_2", 2): "OP-233", ("s_3", 2): "OP-121",
    ("s_4", 2): "OP-318", ("s_5", 2): "OP-420",
    ("s_1", 3): "OP-150", ("s_2", 3): "OP-251", ("s_3", 3): "OP-150",
    ("s_4", 3): "OP-333", ("s_5", 3): "OP-451",
}
DEMO_LOT = 4417


def shift_of(ts):
    h = ts.hour
    return 1 if 6 <= h < 14 else 2 if 14 <= h < 22 else 3


def load_week(path):
    raw = pd.read_csv(path)
    raw["ts"] = pd.to_datetime(raw["interval_start"], format="mixed").dt.tz_localize(None)
    return raw[(raw.ts >= WEEK_START) & (raw.ts < WEEK_END)].copy()


def slot_rows(week):
    """One row per machine per 2-hour slot that produced parts."""
    week["slot"] = week.ts.dt.floor(f"{SLOT_HOURS}h")
    rows = []
    for (eq, slot), g in week.groupby(["equipment_ID", "slot"]):
        prod = g[g.type == "production"]
        qty = int(g.po.max() - g.po.min())
        if prod.empty or qty <= 0:
            continue
        stops = g[g.alarm != "A_000"].alarm
        rows.append({
            "equip": eq,
            "time": prod.ts.min().floor("min"),
            "qty": qty,
            "alarm": stops.value_counts().idxmax() if not stops.empty else "",
        })
    return pd.DataFrame(rows).sort_values("time").reset_index(drop=True)


def assign_lots(rows):
    """Stamping makes a lot; the next Deburring and Welding slots take it."""
    rows["lot"] = None
    rows["part"] = None
    next_lot, to_deburr, to_weld = 1, [], []
    for i, r in rows.iterrows():
        if r.equip in PARTS:
            lot, part = next_lot, PARTS[r.equip]
            next_lot += 1
            to_deburr.append((lot, part))
        elif r.equip == "s_4" and to_deburr:
            lot, part = to_deburr.pop(0)
            to_weld.append((lot, part))
        elif r.equip == "s_5" and to_weld:
            lot, part = to_weld.pop(0)
        else:
            continue
        rows.at[i, "lot"], rows.at[i, "part"] = lot, part
    rows = rows.dropna(subset=["lot"]).reset_index(drop=True)
    return renumber(rows)


def renumber(rows):
    """Shift lot numbers so the demo lot (a Press 3 lot on Tue May 4 whose
    stop code repeats on Press 3 that day) is lot 4417."""
    p3 = rows[(rows.equip == "s_3") & (rows.time.dt.day == DEMO_DAY) & (rows.alarm != "")]
    repeated = p3[p3.alarm.duplicated(keep=False)]
    pick = repeated[repeated.time.dt.hour >= 14]
    demo = (pick if not pick.empty else repeated if not repeated.empty else p3).iloc[0]
    rows["lot"] = rows["lot"].astype(int) + (DEMO_LOT - int(demo.lot))
    return rows


def shop_columns(rows):
    rows["machine"] = rows.equip.map(lambda e: MACHINES[e][0])
    rows["step"] = rows.equip.map(lambda e: MACHINES[e][1])
    rows["shift"] = rows.time.map(shift_of)
    rows["op"] = [OPERATORS[(e, s)] for e, s in zip(rows.equip, rows["shift"])]
    return rows


def press3_spellings(rows, spellings, seed):
    rnd = random.Random(seed)
    return [rnd.choice(spellings) if m == "Press 3" else m for m in rows.machine]


def ampm(ts):
    h = ts.hour % 12 or 12
    return f"{ts.month}/{ts.day}/{ts.strftime('%y')} {h}:{ts.minute:02d}{'a' if ts.hour < 12 else 'p'}"


def file1(rows):
    """shift1_log.csv: 3 title rows, two date columns, 11 columns."""
    df = pd.DataFrame({
        "Ref": rows.lot.astype(str),
        "Part": rows.part,
        "Qty": rows.qty,
        "Prod Dt": rows.time.map(ampm),
        "Logged": (rows.time + pd.Timedelta(hours=9)).dt.strftime("%Y-%m-%d"),
        "Mach": press3_spellings(rows, ["Press 3", "PRESS-3", "P3"], 1),
        "Op": rows.op,
        "Shift": "1st",
        "Step": rows.step,
        "Alarm": rows.alarm,
        "Notes": "",
    })
    df.loc[df.index[len(df) // 3], "Ref"] = ""  # one row with no lot
    df.loc[df.index[5], "Notes"] = "die change before run"
    df.loc[df.index[20], "Notes"] = "first piece ok"
    title = ["DEMO SHOP SHIFT LOG,,,,,,,,,,", "printed 5/10/21,,,,,,,,,,", ",,,,,,,,,,"]
    path = OUT / "shift1_log.csv"
    path.write_text("\n".join(title) + "\n" + df.to_csv(index=False))
    return len(df)


def file2(rows):
    """shift2_export.csv: 2 title rows, ISO dates, upper-case headers."""
    df = pd.DataFrame({
        "REF": rows.lot.astype(str),
        "PART": rows.part,
        "QTY": rows.qty,
        "PROD DT": rows.time.dt.strftime("%Y-%m-%d %H:%M"),
        "MACH": press3_spellings(rows, ["Press 3", "PRESS-3"], 2),
        "OP": rows.op,
        "SHIFT": "2nd",
        "STEP": rows.step,
        "ALARM": rows.alarm,
        "NOTES": "",
    })
    df.loc[df.index[len(df) // 2], "PROD DT"] = "??"  # unreadable time
    title = ["Shift 2 export - Line A,,,,,,,,,", ",,,,,,,,,"]
    path = OUT / "shift2_export.csv"
    path.write_text("\n".join(title) + "\n" + df.to_csv(index=False))
    return len(df)


def file3(rows):
    """shift3.xlsx: 1 title row and a blank, day-month dates, a new column."""
    df = pd.DataFrame({
        "Ref#": rows.lot.astype(str),
        "Part": rows.part,
        "Qty": rows.qty,
        "Prod_Dt": rows.time.dt.strftime("%d-%b-%Y %H:%M"),
        "Mach": press3_spellings(rows, ["P3", "Press 3"], 3),
        "Op": rows.op,
        "Shift": "3",
        "Step": rows.step,
        "Alarm": rows.alarm,
        "Comments": "",
    })
    first_p1 = df.index[df.Mach == "Press 1"][0]
    df.loc[first_p1, "Mach"] = "Press1"  # a spelling never seen before
    path = OUT / "shift3.xlsx"
    with pd.ExcelWriter(path) as xl:
        pd.DataFrame([["Night shift log"], [None]]).to_excel(xl, index=False, header=False)
        df.to_excel(xl, index=False, startrow=2)
    return len(df)


def main(src):
    rows = shop_columns(assign_lots(slot_rows(load_week(src))))
    counts = [f(rows[rows["shift"] == n].reset_index(drop=True)) for n, f in ((1, file1), (2, file2), (3, file3))]
    print("data rows per file:", counts, "lots:", rows.lot.nunique())
    demo = rows[rows.lot == DEMO_LOT]
    print(demo[["time", "machine", "step", "qty", "alarm", "shift", "op"]].to_string(index=False))


if __name__ == "__main__":
    main(sys.argv[1])
