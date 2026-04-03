import sqlite3, json, uuid
from datetime import datetime, timezone

conn = sqlite3.connect('aanmeldpunt.db')
users = [json.loads(r[0]) for r in conn.execute('SELECT data FROM users').fetchall()]
links = [json.loads(r[0]) for r in conn.execute('SELECT data FROM user_schools').fetchall()]
schools = [json.loads(r[0]) for r in conn.execute('SELECT data FROM schools').fetchall()]

# Find RHIZO College Zwevegem
zwevegem = next(s for s in schools if 'zwevegem' in s['name'].lower())

for u in users:
    user_links = [l for l in links if l['userId'] == u['id']]
    if not user_links:
        link_doc = {
            "id": str(uuid.uuid4()),
            "userId": u['id'],
            "schoolId": zwevegem['id'],
            "role": u['role'],
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
        conn.execute('INSERT OR REPLACE INTO user_schools (id, data) VALUES (?, ?)',
                     (link_doc['id'], json.dumps(link_doc)))
        print(f"Linked {u['name']} ({u['role']}) -> {zwevegem['name']}")

conn.commit()
conn.close()
print("Done")
