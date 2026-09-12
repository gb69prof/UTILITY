"""Editorial audit additions. Never infer a war relationship from a polygon."""
import json
from pathlib import Path
C=Path(__file__).resolve().parents[1]/'data/common'
def read(n):return json.loads((C/n).read_text(encoding='utf-8'))
def write(n,d):(C/n).write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
def enrich():
 sources=read('editorial-sources.json')
 for s in sources:
  if s['source_id']=='SRC_VIENNA':
   s.update(author_or_institution='Congresso di Vienna / Wienbibliothek im Rathaus',title='Acte du Congrès de Vienne du 9 Juin 1815, avec ses annexes. Edizione ufficiale',url='https://www.digital.wienbibliothek.at/wbrobv/content/titleinfo/2293309',license='Public Domain Mark 1.0; credit Wienbibliothek im Rathaus, C-1951')
 extra={
  'SRC_CHRONO_1799':('2 — La campagne d’Égypte et l’avènement, 1798–1799','chronologie-de-la-correspondance-generale-de-napoleon-bonaparte-tome-2-la-campagne-degypte-et-lavenement-1798-1799/'),
  'SRC_CHRONO_1802':('3 — Pacifications, 1800–1802','chronologie-de-la-correspondance-generale-de-napoleon-bonaparte-tome-3-pacifications-1800-1802/'),
  'SRC_CHRONO_1804':('4 — Ruptures et fondation, 1803–1804','chronologie-de-la-correspondance-generale-de-napoleon-bonaparte-tome-4-ruptures-et-fondation-1803-1804/'),
  'SRC_CHRONO_1806':('6 — Vers le Grand Empire, 1806','chronologie-de-la-correspondance-generale-de-napoleon-bonaparte-tome-6-1806-vers-le-grand-empire/'),
  'SRC_CHRONO_1807':('7 — Tilsit, l’apogée de l’Empire, 1807','chronologie-de-la-correspondance-generale-de-napoleon-bonaparte-tome-7-1807-tilsit-lapogee-de-lempire/'),
  'SRC_CHRONO_1811':('10 — Un Grand Empire, mars 1810–mars 1811','chronologie-de-la-correspondance-generale-de-napoleon-bonaparte-tome-10-un-grand-empire-mars-1810-mars-1811/')}
 for id,(title,slug) in extra.items():
  sources.append({'source_id':id,'author_or_institution':'Fondation Napoléon','title':'Correspondance générale de Napoléon, tome '+title,'url':'https://www.napoleon.org/histoire-des-2-empires/chronologies/'+slug,'date':'edizione moderna','source_type':'scholarly_chronology','license':'reference_only','accessed':'2026-09-12','reliability':'high','supports':[]})
 events=read('events.json')
 # Actors describe the historical event; checkpoint entity references are only
 # added where the entity existed at the event date. No anachronistic Empire in 1796.
 actors=[
 'Armata francese d’Italia;Esercito austriaco', 'Armata francese d’Italia;Esercito austriaco',
 'Armata francese d’Italia;Esercito austriaco', 'Repubblica francese;Papa Pio VI',
 'Maggior Consiglio della Repubblica di Venezia;Armata francese d’Italia',
 'Repubblica Cisalpina;Napoleone Bonaparte', 'Repubblica francese;Monarchia asburgica;Repubblica di Venezia',
 'Repubblica Romana;Repubblica francese;Papa Pio VI', 'Repubblica Elvetica;Repubblica francese',
 'Napoleone Bonaparte;Direttorio;Consiglio dei Cinquecento', 'Esercito francese;Esercito austriaco',
 'Repubblica francese;Francesco II', 'Repubblica francese;Regno Unito;Spagna;Repubblica Batava',
 'Repubblica francese;Casa di Savoia', 'Napoleone Bonaparte;Cantoni svizzeri',
 'Deputazione imperiale;Stati del Sacro Romano Impero', 'Napoleone Bonaparte;Senato francese',
 'Napoleone I;Repubblica Italiana', 'Esercito francese;Esercito austriaco',
 'Royal Navy;Flotta francese;Flotta spagnola', 'Napoleone I;Francesco II;Alessandro I',
 'Impero francese;Impero austriaco', 'Stati firmatari della Confederazione del Reno;Napoleone I',
 'Francesco II;Stati del Sacro Romano Impero', 'Esercito francese;Esercito prussiano',
 'Napoleone I;Regno Unito', 'Napoleone I;Alessandro I', 'Napoleone I;Federico Guglielmo III',
 'Insorti di Madrid;Truppe francesi', 'Giuseppe Bonaparte;Napoleone I;Monarchia spagnola',
 'Esercito francese;Esercito austriaco', 'Impero francese;Impero austriaco',
 'Napoleone I;Regno d’Olanda;Luigi Bonaparte', 'Impero francese;Territori della Germania settentrionale',
 'Amministrazione imperiale francese;Autorità spagnole concorrenti', 'Cortes di Cadice;Reggenza spagnola',
 'Impero russo;Impero ottomano', 'Grande Armée;Impero russo', 'Grande Armée;Esercito russo',
 'Grande Armée;Esercito russo', 'Grande Armée;Autorità e popolazione di Mosca', 'Grande Armée;Esercito russo',
 'Grande Armée;Eserciti russi', 'Francia e alleati;Russia;Prussia;Austria;Svezia',
 'Napoleone I;Potenze della coalizione', 'Luigi XVIII;Austria;Regno Unito;Prussia;Russia',
 'Austria;Russia;Prussia;Regno Unito;Francia;Altri Stati europei', 'Napoleone I;Luigi XVIII',
 'Stati firmatari dell’Atto di Vienna', 'Napoleone I;Duca di Wellington;Gebhard von Blücher',
 'Napoleone I;Camere francesi', 'Luigi XVIII;Austria;Prussia;Russia;Regno Unito',
 'Ferdinando di Borbone;Regno di Napoli;Regno di Sicilia']
 assert len(events)==len(actors)
 checkpoint={'Impero francese':'FRA_EMPIRE','Impero austriaco':'AUT_EMPIRE','Impero russo':'RUS_EMPIRE','Impero ottomano':'OTT_EMPIRE','Regno Unito':'UK','Regno di Sicilia':'SIC_KINGDOM'}
 for e,a in zip(events,actors):
  e['actors']=a.split(';');e['entity_ids']=[checkpoint[x] for x in e['actors'] if x in checkpoint and e['date_start']>='1804-08-11']
  e['date_precision']='day'
  year=int(e['date_start'][:4]);key=next((k for lo,hi,k in [(1798,1799,'SRC_CHRONO_1799'),(1800,1802,'SRC_CHRONO_1802'),(1803,1804,'SRC_CHRONO_1804'),(1806,1806,'SRC_CHRONO_1806'),(1807,1807,'SRC_CHRONO_1807'),(1810,1811,'SRC_CHRONO_1811')] if lo<=year<=hi),None)
  if key and e['sources']==['SRC_CHRONO']:e['sources']=[key]
  if e['title']=='Congresso di Vienna':e.update(date_precision='month',date_note='Settembre 1814 indica l’avvio dei negoziati. Il giorno 01 è solo il limite inferiore del mese per il filtro temporale.')
 for s in sources:s['supports']=[e['id'] for e in events if s['source_id'] in e['sources']] or s['supports']
 campaigns=read('campaigns.json')
 for c in campaigns:
  c['date_precision']='day' if c['id'] in ('ITALY_1796','SPAIN','RUSSIA_1812','BELGIUM_1815') else 'approximate_period'
  if c['date_precision']=='approximate_period':c['notes']+=' Gli estremi mensili indicano un periodo didattico orientativo, non la data esatta della prima operazione.'
 write('editorial-sources.json',sources);write('events.json',events);write('campaigns.json',campaigns)
if __name__=='__main__':enrich()
