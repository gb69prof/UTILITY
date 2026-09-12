import gzip
"""Build the temporal atlas from canonical geometries and curated interpretation.
Never rewrites the frozen MAP_10 checkpoint. No interpolated political boundaries.
"""
import json,hashlib,calendar
from pathlib import Path
from shapely.geometry import shape,mapping
from shapely import make_valid
from shapely.ops import unary_union
ROOT=Path(__file__).resolve().parents[1];COMMON=ROOT/'data/common'
def read(p):return json.loads(gzip.decompress(p.read_bytes()).decode('utf-8') if p.suffix=='.gz' else p.read_text(encoding='utf-8'))
def write(p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
DATES=['1796-01-01','1797-12-31','1802-12-31','1803-12-31','1805-12-31','1806-12-31','1807-12-31','1809-12-31','1811-01-22','1812-06-01','1813-12-31','1814-08-31','1815-06-09','1815-12-31','1816-12-31']
TITLES=['Prima di Napoleone','Dopo Campoformio','Lunéville e Amiens','Germania e Svizzera si trasformano','Dopo Austerlitz','La fine del Sacro Romano Impero','Dopo Tilsit','Dopo Schönbrunn','Il Grande Impero','L’apogeo del sistema napoleonico','La disgregazione dell’Impero','La Prima Restaurazione','L’Europa decisa a Vienna','Dopo Waterloo','La Restaurazione prende forma']
NOTES=['La Francia rivoluzionaria e l’Europa delle monarchie. Il Sacro Romano Impero è una compagine istituzionale, non uno Stato unitario.','Campoformio ridisegna l’Italia settentrionale e sancisce la fine della Repubblica di Venezia.','La pace europea è temporanea; il Piemonte entra nella Francia e in Italia esistono nuove repubbliche.','La Mediatizzazione e la secolarizzazione modificano lo spazio tedesco. La Svizzera riceve l’Atto di Mediazione.','La pace di Presburgo riduce la presenza austriaca in Germania e trasferisce il Veneto al Regno d’Italia.','La Confederazione del Reno riunisce Stati distinti. Il Sacro Romano Impero si scioglie il 6 agosto.','Tilsit istituisce il Ducato di Varsavia e riduce la Prussia; l’alleanza franco-russa non equivale ad annessione.','Il trattato di Schönbrunn istituisce le Province Illiriche sotto sovranità francese.','L’annessione dell’Olanda e di territori della Germania settentrionale estende l’amministrazione francese.','1 giugno: la campagna di Russia non è ancora iniziata. Sovranità, amministrazione e controllo militare devono essere letti separatamente.','Dopo Lipsia si dissolve il sistema degli Stati clienti. La sovranità formale può sopravvivere alla perdita del controllo.','Il primo trattato di Parigi e il ritorno dei Borbone aprono la Restaurazione. Il Congresso di Vienna deve ancora concludersi.','Assetto diplomatico e normativo: questa carta mostra decisioni territoriali, non il controllo effettivo al 9 giugno. Napoleone è ancora al potere in Francia.','Il secondo trattato di Parigi segue Waterloo. Restano occupazioni militari e transizioni amministrative.','L’attuazione degli accordi continua. A dicembre nasce il Regno delle Due Sicilie; non tutti i cambiamenti europei sono simultanei.']
MATCH={
 'French Empire':'FRA_EMPIRE','Kingdom of Italy':'ITA_KINGDOM','Kingdom of Naples':'NAP_KINGDOM','Spain':'ESP_CADIZ','Duchy of Warsaw':'WARSAW_GD','Free City of Danzig':'DANZIG_FREE','Swiss Confederation':'SWISS_CONF','Austrian Empire':'AUT_EMPIRE','Kingdom of Prussia':'PRU_KINGDOM','Russian Empire':'RUS_EMPIRE','United Kingdom of Great Britain and Ireland':'UK','Sweden':'SWE_KINGDOM','Denmark–Norway':'DEN_NOR','Kingdom of Portugal':'POR_KINGDOM','Kingdom of Sicily':'SIC_KINGDOM','Kingdom of Sardinia':'SAR_KINGDOM','Ottoman Empire':'OTT_EMPIRE','Principality of Neuchâtel':'NEUCHATEL','Principality of Lucca and Piombino':'LUCCA_PIOMBINO','Principality of Benevento (Napoleonic)':'BENEVENTO','Principality of Pontecorvo (1805-1815)':'PONTECORVO','Andorra':'ANDORRA','San Marino':'SAN_MARINO','Republic of Cospaia':'COSPAIA_LOCAL','Kingdom of Bavaria':'BAV_KINGDOM','Württemberg':'WUR_KINGDOM','Kingdom of Saxony':'SAX_KINGDOM','Kingdom of Westphalia':'WEST_KINGDOM','Baden':'BAD_GD','Grand Duchy of Hesse':'HES_GD','Grand Duchy of Berg':'BERG_GD','Duchy of Anhalt-Bernburg':'ANH_BERN','Duchy of Anhalt-Köthen':'ANH_KOTH','Duchy of Anhalt-Dessau':'ANH_DESS','Duchy of Mecklenburg-Schwerin':'MECK_SCH','Duchy of Mecklenburg-Strelitz':'MECK_STR','Hohenzollern-Hechingen':'HOH_HECH','Hohenzollern-Sigmaringen':'HOH_SIG','Principality Isenburg':'ISENBURG','Liechtenstein':'LIECHTENSTEIN','Principality of Leyen':'LEYEN','Principality of Lippe':'LIPPE','Schaumburg-Lippe':'SCHAUM_LIPPE','Principality of Reuss-Greiz':'REUSS_GREIZ','Waldeck':'WALDECK','Principality of Schwarzburg-Rudolstadt':'SCHW_RUD','Principality of Schwarzburg-Sondershausen':'SCHW_SOND','Pyrmont':'PYRMONT','Illyrian Provinces':'FRA_ILLYRIA','Principality of Moldavia':'MOLDAVIA','Principality of Wallachia':'WALLACHIA','Prince-Bishopric of Montenegro':'MONTENEGRO','British Protectorate of Malta':'MALTA','Gibraltar':'GIBRALTAR','Grand Duchy of Finland':'FIN_GD','Swedish Pomerania':'SWEDISH_POMERANIA','Heligoland':'HELIGOLAND','Principality of Erfurt':'ERFURT_DOMAIN','Kingdom of Denmark':'DENMARK_COMPONENT','Kingdom of Norway':'NORWAY_COMPONENT','Duchy of Schleswig':'SCHLESWIG_DUCHY','Duchy of Holstein':'HOLSTEIN_DUCHY','Iceland':'ICELAND_COMPONENT','Faroe Islands':'FAROE_COMPONENT','Simplon':'FRA_SIMPLON'}
ITALIAN={'Holy Roman Empire':'Sacro Romano Impero','French Republic':'Repubblica francese','French Republic (Empire)':'Impero francese','Kingdom of France':'Regno di Francia','Kingdom of the Netherlands':'Regno dei Paesi Bassi','Switzerland':'Confederazione svizzera','Papal States':'Stato pontificio','Kingdom of the Two Sicilies':'Regno delle Due Sicilie','Kingdom of Poland':'Regno di Polonia','Free City of Cracow':'Città libera di Cracovia','Grand Duchy of Tuscany':'Granducato di Toscana','Duchy of Parma and Piacenza':'Ducato di Parma e Piacenza','Kingdom of Etruria':'Regno d’Etruria','Duchy of Modena and Reggio':'Ducato di Modena e Reggio','Republic of Venice':'Repubblica di Venezia','Republic of Genoa':'Repubblica di Genova','Cisalpine Republic':'Repubblica Cisalpina','Italian Republic':'Repubblica Italiana','Batavian Republic':'Repubblica Batava','Batavian Commonwealth':'Repubblica Batava','Kingdom of Holland':'Regno d’Olanda','Helvetic Republic':'Repubblica Elvetica','Kingdom of Great Britain':'Regno di Gran Bretagna','Kingdom of Ireland':'Regno d’Irlanda','Sweden–Norway':'Unione Svezia-Norvegia','Denmark':'Regno di Danimarca','Hanover':'Regno di Hannover','Nassau':'Ducato di Nassau','Duchy of Lucca':'Ducato di Lucca','Valais Republic':'Repubblica del Vallese','Principality of Elba':'Principato dell’Elba','United States of the Ionian Islands':'Stati Uniti delle Isole Ionie','Septinsular Republic':'Repubblica delle Sette Isole','Crown Colony of Malta':'Colonia britannica di Malta','Electorate of Hesse':'Elettorato d’Assia','Oldenburg':'Ducato di Oldenburg','Brunswick':'Ducato di Brunswick'}
def bounds(d):
 if not d:return ('0001-01-01','9999-12-31')
 parts=d.split('-')
 if len(parts)==1:return(d+'-01-01',d+'-12-31')
 if len(parts)==2:return(d+'-01',d+'-'+str(calendar.monthrange(int(parts[0]),int(parts[1]))[1]))
 return(d,d)
def active(f,date):
 p=f['properties'];return bounds(p['valid_from'])[0]<=date and (not p['valid_to'] or date<bounds(p['valid_to'])[1] if len(p.get('valid_to') or '')<10 else date<p['valid_to'])
def main():
 canonical=read(COMMON/'canonical.geojson.gz')['features'];byrid={f['properties']['relation_id']:f for f in canonical}
 entities=read(ROOT/'data/MAP_10/entities.json')['entities'];eb={e['id']:e for e in entities}
 sources=read(ROOT/'data/MAP_10/sources.json')['sources']+read(COMMON/'editorial-sources.json')
 issues=[];polities={};features=[]
 for f in canonical:
  p=f['properties'];t=p['source_tags'];name=t.get('name:en',t.get('name','')); rid=p['relation_id']
  pid='POL_'+t.get('wikidata',str(rid)).replace(';','_')
  sources.append({'source_id':p['source_id'],'title':name+' — relazione OHM '+str(rid),'author_or_institution':'OpenHistoricalMap contributors','date':t.get('source:date','data dinamica'),'source_type':'collaborative_vector','url':'https://www.openhistoricalmap.org/relation/'+str(rid),'license':p['license'],'accessed':'2026-09-12','reliability':'low','supports':['geometry '+p['geometry_id'],'upstream temporal tags'],'upstream':{k:v for k,v in t.items() if 'source' in k or 'fixme' in k}})
  polities.setdefault(pid,{'id':pid,'names':{'it':ITALIAN.get(name,t.get('name:it',name))},'entity_class':'historical_polity','record_nature':'upstream_record','source_ids':[]})['source_ids'].append(p['source_id'])
  p['polity_id']=pid;p['name_it']=ITALIAN.get(name,t.get('name:it',name));p['name_en']=name
  p['checkpoint_entity_id']=MATCH.get(name)
  if p['valid_to'] and bounds(p['valid_from'])[0]>bounds(p['valid_to'])[1]:
   issues.append({'id':'ERR_DATE_'+str(rid),'snapshot':'all','area':name,'problem':'Intervallo temporale invertito nella fonte OHM','solution':'Escluso da tutti gli snapshot','status':'open','certainty':'low','sources':[p['source_id']]});continue
  for k,v in t.items():
   if k.startswith('fixme'):
    issues.append({'id':'UPSTREAM_'+str(rid)+'_'+k.replace(':','_'),'snapshot':'all','area':name,'problem':v,'solution':'Confine tratteggiato e certezza bassa; segnalazione conservata','status':'open','certainty':'low','sources':[p['source_id']]})
  features.append(f)
 # Catalonia: difference between the OHM pre/post annexation extents. Kept as
 # administration, NEVER treated as uncontested French legal sovereignty.
 cat=None
 if 2696587 in byrid and 2914131 in byrid:
  g=shape(byrid[2696587]['geometry']).difference(shape(byrid[2914131]['geometry']))
  from shapely.geometry import box
  g=g.intersection(box(-0.5,40,3.5,43.5))
  if not g.is_empty:
   cat={'type':'Feature','id':'G_CAT_ADMIN','properties':{'geometry_id':'G_CAT_ADMIN','entity_id':'CAT_SPECIAL','source_id':'OHM_2696587','geometry_source_ids':['OHM_2696587','OHM_2914131'],'certainty':'low','boundary_type':'administrative_control','notes':['Differenza fra perimetri OHM 1811/1812, limitata alla Catalogna. Non prova una sovranità francese incontestata.'],'valid_from':'1812-01-26','valid_to':'1814-04-13'},'geometry':mapping(g)}
  issues.append({'id':'CAT_OHM_SOVEREIGNTY','snapshot':'MAP_10','area':'Catalogna','problem':'OHM ingloba la Catalogna nella Francia; il checkpoint distingue amministrazione e sovranità.','solution':'Perimetro francese pre-1812 e superficie amministrativa separata.','status':'provisionally_resolved','certainty':'low','sources':['OHM_2696587','OHM_2914131','SRC_FN_CATALONIA_1812']})
 snapshots=[];compiled=[]
 for i,(dt,title,note) in enumerate(zip(DATES,TITLES,NOTES),1):
  sid=f'MAP_{i:02}';selected=[f for f in features if active(f,dt)]
  if sid=='MAP_10':selected=[f for f in selected if f['properties']['relation_id']!=2696587]+[byrid[2914131]]
  # Normative Vienna layer uses the French territorial settlement of Paris
  # 1814. The OHM 1815 monarchy start date must not replace the Hundred Days.
  if sid=='MAP_13':selected=[f for f in selected if f['properties']['name_en']!='Kingdom of France']+[byrid[2913635]]
  output=[];covered=set()
  for f in selected:
   p=f['properties'];t=p['source_tags'];name=p['name_en'];eid=p.get('checkpoint_entity_id') if sid=='MAP_10' else None
   level=t.get('admin_level','2')
   # Major independent states plus explicit subordinate special cases.
   if level!='2' and not eid and not any(x in name for x in ['Illyrian','Moldavia','Wallachia','Finland','Pomerania']):continue
   category='other';sov=None;controller=None;control_status='not_recorded';members=[]
   if eid:
    e=eb[eid];m=e['napoleonic_relation'];modes=m['integration_modes'];members=e['institutional_memberships']
    if 'system_center' in modes or 'direct_annexation' in modes:category='annexed'
    elif 'dynastic_client' in modes:category='dynastic'
    elif m['dependence_level'] not in ['none','not_applicable']:category='client'
    if m['war_status'] in ['at_war_with_france','prewar_adversary']:category='adversary'
    elif m['alignment']=='allied_with_france':category='ally'
    if eid in ('AUT_EMPIRE','PRU_KINGDOM','DEN_NOR'):category='ally'
    if eid in ('FRA_ILLYRIA','FRA_SIMPLON'):category='annexed'
    sov=' / '.join(e['sovereignty']['holder_ids']);controller=' / '.join(e['effective_control']['primary_controller_ids']);control_status=e['effective_control']['status']
    covered.add(eid)
   elif dt<'1814-04-01':
    if 'French' in name:category='annexed'
    elif t.get('empire')=='ffe':category='client'
   if name=='Holy Roman Empire':category='institution'
   state={'geometry_id':f['id'],'entity_id':eid or p['polity_id'],'snapshot_id':sid,'name':eb[eid]['names']['it'] if eid else p['name_it'],'category':category,'sovereignty':sov,'controller':controller,'control_status':control_status,'rhine':bool(eid and any('RHINE' in str(x) for x in members)),'certainty':'low','boundary_type':'approximate','source_ids':p['geometry_source_ids'],'notes':p['notes'],'level':level,'valid_from':dt,'valid_to':dt}
   if eid in ('ESP_CADIZ','ANDORRA','MALTA','MOLDAVIA','WALLACHIA'):state['disputed']=True
   output.append(state)
  if sid=='MAP_10' and cat:
   output.append({'geometry_id':cat['id'],'entity_id':'CAT_SPECIAL','snapshot_id':sid,'name':'Catalogna · amministrazione francese','category':'other','sovereignty':'ESP_CADIZ / ESP_JOSEPH','controller':'FRA_EMPIRE','control_status':'fragmented','rhine':False,'certainty':'low','boundary_type':'administrative_control','disputed':True,'source_ids':cat['properties']['geometry_source_ids'],'notes':cat['properties']['notes'],'level':'3','valid_from':dt,'valid_to':dt});covered.add('CAT_SPECIAL')
  if sid=='MAP_10':
   for e in entities:
    if e['spatial_mode']!='nonspatial' and e['id'] not in covered:
     issues.append({'id':'NO_GEOM_'+e['id'],'snapshot':sid,'area':e['names']['it'],'problem':'Geometria autonoma non ancora verificata','solution':'Scheda scientifica consultabile; nessun confine inventato. Eventuale appartenenza visibile nella scheda.','status':'open','certainty':'low','sources':[s['source_id'] for s in e['sources']]})
  snapshots.append({'id':sid,'date':dt,'title':title,'description':note,'nature':'diplomatic_normative' if sid=='MAP_13' else 'historical_reconstruction','geometry_count':len(output),'source_ids':['SRC_IEG_1812'] if sid=='MAP_10' else ['SRC_CHRONO'],'geometry_status':'provisional','data_url':f'data/{sid}/atlas.json'})
  write(ROOT/f'data/{sid}/atlas.json',{'snapshot_id':sid,'date':dt,'features':output})
  compiled.extend(output)
 # Shared generalized derivative; preserve tiny islands using topology.
 used={r['geometry_id'] for r in compiled};geom=[]
 for f in features+([cat] if cat else[]):
  if f['id'] not in used:continue
  g=shape(f['geometry']);simplified=g.simplify(0.008,preserve_topology=True)
  geom.append({'type':'Feature','id':f['id'],'properties':{'geometry_id':f['id'],'geometry_source_ids':f['properties']['geometry_source_ids'],'certainty':'low','boundary_type':f['properties']['boundary_type'],'notes':f['properties']['notes']},'geometry':mapping(simplified)})
 write(COMMON/'geometries.geojson',{'type':'FeatureCollection','features':geom})
 if cat:write(COMMON/'derived.geojson',{'type':'FeatureCollection','features':[cat]})
 write(COMMON/'snapshots.json',snapshots);write(COMMON/'polities.json',list(polities.values()));write(COMMON/'sources.json',sources);write(COMMON/'issues.json',issues)
 print('Snapshots',len(snapshots),'shared geometries',len(geom),'issues',len(issues))
 for s in snapshots:print(s['id'],s['geometry_count'])
if __name__=='__main__':main()
