from pathlib import Path
from urllib.request import urlopen
import hashlib,json,datetime
root=Path(__file__).resolve().parents[1]; records=[]
previous={m['file']:m for m in json.loads((root/'data/assets.json').read_text(encoding='utf-8'))} if (root/'data/assets.json').exists() else {}
for body,file in [('earth','2k_earth_daymap.jpg'),('mars','2k_mars.jpg'),('moon','2k_moon.jpg'),('sun','2k_sun.jpg')]:
 url='https://www.solarsystemscope.com/textures/download/'+file
 p=root/'src/assets'/file
 if not p.exists():
  with urlopen(url,timeout=90) as r:p.write_bytes(r.read())
 raw=p.read_bytes();records.append(dict(body=body,file='src/assets/'+file,url=url,author='Solar System Scope / INOVE',license='CC BY 4.0',licenseUrl='https://creativecommons.org/licenses/by/4.0/',sourcePage='https://www.solarsystemscope.com/textures/',sha256=hashlib.sha256(raw).hexdigest(),bytes=len(raw),accessedOn=previous.get('src/assets/'+file,{}).get('accessedOn',datetime.datetime.now(datetime.timezone.utc).isoformat()),modifications='None. Original 2K JPEG; GPU mipmaps.',limitations='Processed illustrative surface map; color and details are not a dated observation. Sun is an illustrative photosphere, not current activity.'))
 print(file,len(raw))
(root/'data/assets.json').write_text(json.dumps(records,indent=2)+'\n',encoding='utf-8')
