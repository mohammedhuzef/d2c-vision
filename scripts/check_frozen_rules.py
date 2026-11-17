import os
import re

keywords = [
    "payback", "segment", "willingness", "elasticity", "lifetime",
    "weight", "dimension", "effort"
]

stage_dir = "backend/app/services/validation/stages"
files_to_check = [os.path.join(stage_dir, f) for f in os.listdir(stage_dir) if f.endswith(".py")]
files_to_check.append("backend/app/services/finance.py")

for filepath in files_to_check:
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()
    for idx, line in enumerate(lines, 1):
        for kw in keywords:
            if re.search(r"\b" + kw + r"\b", line, re.IGNORECASE):
                print(f"{filepath}:{idx} [{kw}]: {line.strip()}")
