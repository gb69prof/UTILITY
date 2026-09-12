"""Import explicit OHM relation geometries; retain source tags and all repairs.

Usage: python tools/import_ohm.py --input /path/to/overpass-converted-files
Input: ohm-geometry-*.geojson from osmtogeojson 3.0.0-beta.5, out geom.
No political interpretation is inferred here. Dates and tags remain evidence.
"""
import argparse,json,hashlib,gzip
from pathlib import Path
from shapely.geometry import shape,mapping,box
from shapely import make_valid
from shapely.ops import unary_union

ROOT=Path(__file__).resolve().parents[1]
def polygons(g):
 if g.geom_type in ('Polygon','MultiPolygon'):return g
 return unary_union([p for p in getattr(g,'geoms',[]) if p.geom_type in ('Polygon','MultiPolygon')])
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--input',type=Path,required=True);args=ap.parse_args()
 features=[];log=[];seen=set(); extent=box(-26,33,46,72)
 for file in sorted(args.input.glob('ohm-geometry-*.geojson')):
  for f in json.loads(file.read_text(encoding='utf-8'))['features']:
   if not f['id'].startswith('relation/') or f['id'] in seen:continue
   seen.add(f['id']);t=f['properties'];notes=[]
   if f['geometry']['type'] not in ('Polygon','MultiPolygon') or t.get('tainted'):
    log.append({'id':f['id'],'reason':'incomplete or nonpolygon geometry'});continue
   g=shape(f['geometry'])
   if not g.is_valid:g=polygons(make_valid(g));notes.append('GEOS make_valid: original topology invalid; polygonal result retained.')
   if g.is_empty:continue
   g=polygons(g.intersection(extent))
   if g.is_empty:continue
   raw=json.dumps(f['geometry'],sort_keys=True,separators=(',',':')).encode()
   tags={k:v for k,v in t.items() if not k.startswith('name:') or k in ('name:en','name:it','name:fr','name:de')}
   rid=f['id'].split('/')[1]
   features.append({'type':'Feature','id':'G_OHM_'+rid,'properties':{
    'geometry_id':'G_OHM_'+rid,'relation_id':int(rid),'source_id':'OHM_'+rid,
    'valid_from':t.get('start_date'),'valid_to':t.get('end_date'),
    'geometry_source_ids':['OHM_'+rid],'certainty':'low','boundary_type':'approximate',
    'notes':notes+['Geometria collaborativa OHM; il confine non è certificato da GB-Atlante. Ritaglio cartografico [-26,33,46,72], non confine storico.'],
    'source_geometry_sha256':hashlib.sha256(raw).hexdigest(),'source_tags':tags,
    'license':t.get('license',t.get('licence','CC0-1.0'))},'geometry':mapping(g)})
 out=ROOT/'data/common';out.mkdir(parents=True,exist_ok=True)
 (out/'canonical.geojson.gz').write_bytes(gzip.compress(json.dumps({'type':'FeatureCollection','features':features},ensure_ascii=False,separators=(',',':')).encode('utf-8'),mtime=0))
 (out/'import-report.json').write_text(json.dumps({'features':len(features),'rejected':log,'clipped_extent':[-26,33,46,72],'input_files':[{ 'file':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(args.input.glob('ohm-geometry-*.geojson'))]},indent=2),encoding='utf-8')
 print('Imported',len(features),'rejected',len(log))
if __name__=='__main__':main()
