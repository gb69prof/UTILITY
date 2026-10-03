"""Candidate correction: hourly Hermite nodes and withheld half-hour checks, same domain."""
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.parse import urlencode
import json,hashlib,datetime
ROOT=Path(__file__).resolve().parents[1]
manifest=[];nodes={};checks={}
previous={m['file']:m for m in json.loads((ROOT/'data/ephemeris-acquisition.json').read_text(encoding='utf-8'))} if (ROOT/'data/ephemeris-acquisition.json').exists() else {}
for name,target,center in [('emb-sun',3,10),('earth-sun',399,10),('moon-sun',301,10),('mars-sun',499,10),('moon-earth',301,399)]:
 params={'format':'json','COMMAND':str(target),'CENTER':f'500@{center}','OBJ_DATA':'YES','MAKE_EPHEM':'YES','TIME_TYPE':'TDB','REF_SYSTEM':'ICRF','REF_PLANE':'ECLIPTIC','OUT_UNITS':'KM-S','CSV_FORMAT':'YES','EPHEM_TYPE':'VECTORS','VEC_TABLE':'2','VEC_CORR':'NONE','START_TIME':'JD2451530.0','STOP_TIME':'JD2451560.0','STEP_SIZE':'30 m'}
 url='https://ssd.jpl.nasa.gov/api/horizons.api?'+urlencode({k:v if k=='format' else "'"+v+"'" for k,v in params.items()})
 p=ROOT/'data/raw'/f'{name}-30min.json'
 if not p.exists():
  with urlopen(Request(url,headers={'User-Agent':'Planetario-gbprof/0.5'}),timeout=120) as r:p.write_bytes(r.read())
 raw=p.read_bytes();doc=json.loads(raw)['result'];rows=[]
 for i,line in enumerate(doc.split('$$SOE')[1].split('$$EOE')[0].strip().splitlines()):
  v=line.split(','); t=-1296000+1800*i
  assert abs((float(v[0])-2451545)*86400-t)<.0001
  rows.append([t,*[float(x)*1000 for x in v[2:8]]])
 assert len(rows)==1441
 nodes[name]=rows[::2];checks[name]=rows[1::2]
 file=str(p.relative_to(ROOT)).replace('\\','/')
 manifest.append({'file':file,'url':url,'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'accessedOn':previous.get(file,{}).get('accessedOn',datetime.datetime.now(datetime.timezone.utc).isoformat()),'ephemeris':'mar099' if target==499 else 'DE441','frame':'ECLIPJ2000','correction':'geometric','time':'TDB'})
 print(name,len(rows),flush=True)
for file,data in [('ephemeris.json',{'version':'horizons-j2000-hourly-v1','stepSeconds':3600,'nodes':{k:nodes[k] for k in ['emb-sun','mars-sun','moon-earth']}}),('ephemeris-checks.json',checks),('ephemeris-acquisition.json',manifest)]:
 (ROOT/'data'/file).write_text(json.dumps(data,separators=(',',':'))+'\n',encoding='utf-8')
