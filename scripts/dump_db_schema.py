import sqlite3

conn = sqlite3.connect("launchtwin.db")
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;")
tables = [row[0] for row in cursor.fetchall()]

for t in tables:
    print(f"### Table: `{t}`")
    cursor.execute(f"PRAGMA table_info({t});")
    cols = cursor.fetchall()
    print("| Column | Type | NotNull | Default | PK |")
    print("| :--- | :--- | :---: | :--- | :---: |")
    for c in cols:
        name = c[1]
        col_type = c[2]
        notnull = "YES" if c[3] else "NO"
        dflt = str(c[4]) if c[4] is not None else "NULL"
        pk = "PK" if c[5] else ""
        print(f"| `{name}` | `{col_type}` | {notnull} | `{dflt}` | {pk} |")
    print()
