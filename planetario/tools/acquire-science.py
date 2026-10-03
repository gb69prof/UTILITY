"""Reproducible JPL acquisition. Sequential requests; originals and exact URLs retained."""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlencode
import json,hashlib,datetime
ROOT=Path(__file__).resolve().parents[1]
RAW=ROOT/'data/raw'
RAW.mkdir(parents=True,exist_ok=True)
manifest=[]
previous={m['file']:m for m in json.loads((ROOT/'data/acquisition.json').read_text(encoding='utf-8'))} if (ROOT/'data/acquisition.json').exists() else {}
def get(name,url):
 p=RAW/name
 if not p.exists():
  with urlopen(Request(url,headers={'User-Agent':'Planetario-gbprof-scientific-acquisition/0.5'}),timeout=120) as r: p.write_bytes(r.read())
 content=p.read_bytes()
 recorded=previous.get('data/raw/'+name,{}).get('accessedOn',datetime.datetime.now(datetime.timezone.utc).isoformat())
 manifest.append(dict(file='data/raw/'+name,url=url,sha256=hashlib.sha256(content).hexdigest(),bytes=len(content),accessedOn=recorded))
 print(name,len(content),flush=True)
 return content
for name in ['pck00011.tpc','gm_de440.tpc']:
 get(name,'https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/'+name)
base={'format':'json','OBJ_DATA':'YES','MAKE_EPHEM':'YES','TIME_TYPE':'TDB','REF_SYSTEM':'ICRF','REF_PLANE':'ECLIPTIC','OUT_UNITS':'KM-S','CSV_FORMAT':'YES'}
for name,target,center in [('emb-sun',3,10),('mars-sun',499,10),('moon-earth',301,399)]:
 params={**base,'COMMAND':str(target),'CENTER':f'500@{center}','EPHEM_TYPE':'ELEMENTS','TLIST':'2451545.0','TLIST_TYPE':'JD'}
 url='https://ssd.jpl.nasa.gov/api/horizons.api?'+urlencode({k:v if k=='format' else "'"+v+"'" for k,v in params.items()})
 response=json.loads(get(name+'-elements.json',url));assert 'error' not in response,response.get('error')
for name,target,center in [('emb-sun',3,10),('earth-sun',399,10),('moon-sun',301,10),('mars-sun',499,10),('moon-earth',301,399)]:
 params={**base,'COMMAND':str(target),'CENTER':f'500@{center}','EPHEM_TYPE':'VECTORS','VEC_TABLE':'2','VEC_CORR':'NONE','START_TIME':'JD2451530.0','STOP_TIME':'JD2451560.0','STEP_SIZE':'3 h'}
 url='https://ssd.jpl.nasa.gov/api/horizons.api?'+urlencode({k:v if k=='format' else "'"+v+"'" for k,v in params.items()})
 response=json.loads(get(name+'-vectors.json',url));assert 'error' not in response,response.get('error')
(ROOT/'data/acquisition.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
