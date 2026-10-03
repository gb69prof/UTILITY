from pathlib import Path
import json, hashlib, urllib.request, concurrent.futures, sys
root=Path.cwd()
base=sys.argv[1]
assert base in ['http://127.0.0.1:4186/UTILITY/planetario/','https://gbprof.it/UTILITY/planetario/']
files=[p for p in (root/'.staging').rglob('*') if p.is_file()]
def check(p):
    rel=p.relative_to(root/'.staging').as_posix()
    req=urllib.request.Request(base+(rel if rel!='index.html' else ''),headers={'Cache-Control':'no-cache'})
    with urllib.request.urlopen(req,timeout=45) as response:
        data=response.read(); status=response.status
    local=p.read_bytes(); release=(root/rel).read_bytes()
    return dict(path=rel,status=status,bytes=len(data),sha256=hashlib.sha256(data).hexdigest(),matches_staging=data==local,matches_release=data==release)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool: rows=list(pool.map(check,files))
result={'base':base,'checked':len(rows),'matching':sum(r['matches_staging'] and r['matches_release'] and r['status']==200 for r in rows),'files':rows}
(root/'.tmp'/('phase6-public-http.json' if base.startswith('https:') else 'phase6-local-http.json')).write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k!='files'}))
assert result['matching']==result['checked']
