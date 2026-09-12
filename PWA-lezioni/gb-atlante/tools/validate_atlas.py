import gzip
"""Independently validate canonical, temporal, bibliographic and offline data.
Mutation tests operate on in-memory copies; checkpoint tests use the original tool.
"""
import json,copy,hashlib,sys
from pathlib import Path
from datetime import date
from collections import Counter
from jsonschema import Draft202012Validator
from shapely.geometry import shape
ROOT=Path(__file__).resolve().parents[1];C=ROOT/'data/common'
ALLOWED={'documented','reconstructed','approximate','disputed','administrative_control','military_control','sphere_of_influence'}
def read(p):return json.loads(gzip.decompress(p.read_bytes()).decode('utf-8') if p.suffix=='.gz' else p.read_text(encoding='utf-8'))
def load():return {'snapshots':read(C/'snapshots.json'),'sources':read(C/'sources.json'),'entities':read(ROOT/'data/MAP_10/entities.json')['entities'],'polities':read(C/'polities.json'),'geometries':read(C/'geometries.geojson'),'canonical':read(C/'canonical.geojson.gz'),'events':read(C/'events.json'),'routes':read(C/'campaign-routes.geojson'),'campaigns':read(C/'campaigns.json'),'states':[read(p) for p in sorted((ROOT/'data').glob('MAP_*/atlas.json'))]}
def validate(d):
 errors=[];checks=0
 def require(cond,msg):
  nonlocal checks;checks+=1
  if not cond:errors.append(msg)
 def unique(items,key,what):
  for id,n in Counter(x.get(key) for x in items).items():require(bool(id) and n==1,f'{what}: duplicate or empty ID {id}')
 for k,key in [('snapshots','id'),('sources','source_id'),('entities','id'),('polities','id'),('events','id'),('campaigns','id')]:unique(d[k],key,k)
 src={s['source_id'] for s in d['sources']};entities={e['id'] for e in d['entities']+d['polities']};snaps={s['id']:s for s in d['snapshots']};geoms={f['id'] for f in d['geometries']['features']};events={e['id'] for e in d['events']};campaigns={c['id'] for c in d['campaigns']}
 require(len(snaps)==15,'15 snapshots required');require(snaps['MAP_13']['nature']=='diplomatic_normative','MAP_13 must be normative')
 for s in d['sources']:
  for field in ['title','author_or_institution','url','date','license','accessed','reliability']:require(bool(s.get(field)),s['source_id']+': missing '+field)
  require(s.get('url','').startswith('https://'),s['source_id']+': unsafe source URL')
 for layer in ['canonical','geometries','routes']:
  fc=d[layer];require(fc.get('type')=='FeatureCollection',layer+': GeoJSON collection required');unique(fc['features'],'id',layer)
  for f in fc['features']:
   id=f['id'];p=f['properties'];g=f.get('geometry')
   require(g and g.get('type') in ('Polygon','MultiPolygon','LineString'),id+': supported geometry type')
   if not g:continue
   try:
    sh=shape(g);require(not sh.is_empty,id+': empty geometry');require(sh.is_valid,id+': invalid topology');b=sh.bounds;require(-180<=b[0]<=b[2]<=180 and -90<=b[1]<=b[3]<=90,id+': invalid coordinates')
   except Exception as e:require(False,id+': '+str(e))
   if g['type'] in ('Polygon','MultiPolygon'):
    polys=[g['coordinates']] if g['type']=='Polygon' else g['coordinates']
    for poly in polys:
     for ring in poly:require(len(ring)>=4 and ring[0]==ring[-1],id+': unclosed or invalid ring')
   require(p.get('boundary_type') in ALLOWED,id+': unknown boundary_type');require(p.get('certainty') in ('low','medium','high'),id+': unknown certainty');require(p.get('certainty')=='high' or p.get('boundary_type')!='documented',id+': uncertain boundary cannot be documented')
   require(bool(p.get('geometry_source_ids')),id+': geometry missing provenance')
   for source in p.get('geometry_source_ids',[]):require(source in src,id+': missing source '+source)
   if layer=='routes':require(p.get('campaign_id') in campaigns,id+': unknown campaign')
 for st in d['states']:
  id=st['snapshot_id'];require(id in snaps,id+': unknown snapshot');require(st['date']==snaps[id]['date'],id+': date mismatch');unique(st['features'],'geometry_id',id)
  require(len(st['features'])>0,id+': no geometry')
  for f in st['features']:
   require(f.get('entity_id') in entities,id+': unknown entity '+str(f.get('entity_id')));require(f.get('geometry_id') in geoms,id+': unknown geometry');require(f.get('snapshot_id')==id,id+': snapshot mismatch');require(f.get('valid_from')==st['date']==f.get('valid_to'),id+': invalid snapshot validity')
   for source in f.get('source_ids',[]):require(source in src,id+': missing source '+source)
 categories={'battaglia','campagna','trattato','annessione','rivoluzione','cambio_di_regime','nascita_di_stato','scomparsa_di_stato','congresso','abdicazione','restaurazione','occupazione','trasferimento_territoriale'}
 event_schema={'type':'object','required':['id','title','date_start','date_end','location','coordinates','category','actors','description_it','territorial_consequences','entity_ids','map_before','map_after','certainty','sources'],'properties':{'id':{'type':'string','minLength':1},'sources':{'type':'array','minItems':1},'category':{'enum':sorted(categories)},'certainty':{'enum':['low','medium','high']}}}
 for e in d['events']:
  require(not list(Draft202012Validator(event_schema).iter_errors(e)),e['id']+': event schema')
  try:require(date.fromisoformat(e['date_start'])<=date.fromisoformat(e['date_end']),e['id']+': date range')
  except:require(False,e['id']+': invalid ISO date')
  require(e['map_before'] in snaps and e['map_after'] in snaps,e['id']+': unknown map')
  require(bool(e['actors']) and all('vedi fonte' not in a for a in e['actors']),e['id']+': placeholder actors')
  for eid in e['entity_ids']:require(eid in entities,e['id']+': unknown entity reference')
  for source in e['sources']+e.get('coordinate_source_ids',[]):require(source in src,e['id']+': missing source '+source)
  if e['coordinates'] is not None:require(len(e['coordinates'])==2 and -180<=e['coordinates'][0]<=180 and -90<=e['coordinates'][1]<=90 and bool(e.get('coordinate_source_ids')),e['id']+': unverified coordinates')
 for c in d['campaigns']:
  for eid in c['stages']:require(eid in events,c['id']+': unknown event')
  for source in c['sources']:require(source in src,c['id']+': missing source')
 return {'checks':checks,'errors':errors,'valid':not errors}
def main():
 d=load();report=validate(d);mutations=[]
 def mutate(name,fn):
  x=copy.deepcopy(d);fn(x);r=validate(x);mutations.append({'name':name,'rejected':not r['valid'],'detected_errors':len(r['errors'])})
 mutate('orphan entity',lambda x:x['states'][0]['features'][0].update(entity_id='NONEXISTENT'))
 mutate('missing geometry source',lambda x:x['geometries']['features'][0]['properties'].update(geometry_source_ids=[]))
 mutate('uncertain boundary promoted to documented',lambda x:x['geometries']['features'][0]['properties'].update(boundary_type='documented'))
 mutate('out of range event coordinates',lambda x:x['events'][0].update(coordinates=[999,300],coordinate_source_ids=['SRC_NE']))
 mutate('false snapshot date',lambda x:x['states'][0].update(date='1812-01-01'))
 mutate('unknown event category',lambda x:x['events'][0].update(category='invented'))
 mutate('duplicate event ID',lambda x:x['events'].append(copy.deepcopy(x['events'][0])))
 mutate('Vienna labelled actual control',lambda x:x['snapshots'][12].update(nature='actual_control'))
 mutate('unclosed polygon ring',lambda x:x['geometries']['features'][0]['geometry'].update(type='Polygon',coordinates=[[[0,0],[1,0],[1,1],[0,1]]]))
 mutate('self-intersecting polygon',lambda x:x['geometries']['features'][0]['geometry'].update(type='Polygon',coordinates=[[[0,0],[1,1],[1,0],[0,1],[0,0]]]))
 report['mutation_tests']=mutations
 manifest=read(ROOT/'manifest.webmanifest');pwa_errors=[]
 for path in read(C/'cache-inventory.json')['files']:
  if path!='./' and not (ROOT/path).is_file():pwa_errors.append('Missing cache asset '+path)
 for field in ['id','start_url','scope']:
  if manifest.get(field)!='./':pwa_errors.append('Subdirectory-unsafe '+field)
 for icon in manifest['icons']:
  if not (ROOT/icon['src']).is_file():pwa_errors.append('Missing icon '+icon['src'])
 report['pwa_errors']=pwa_errors;report['valid']=report['valid'] and all(m['rejected'] for m in mutations) and not pwa_errors
 report['counts']={k:len(d[k]) for k in ['snapshots','entities','polities','sources','events','campaigns']};report['counts']['geometries']=len(d['geometries']['features'])
 report['scientific_release_ready']=False;report['scientific_limit']='Geometries retain upstream uncertainties; several MAP_10 components and other-snapshot political profiles remain incomplete.'
 out=ROOT/'docs/validation.json';out.parent.mkdir(exist_ok=True);out.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=False,indent=2));return 0 if report['valid'] else 1
if __name__=='__main__':raise SystemExit(main())
