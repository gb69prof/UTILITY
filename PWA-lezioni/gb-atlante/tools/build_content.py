"""Compile original Italian teaching notes; coordinates only from cited datasets."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];C=ROOT/'data/common'
def write(name,obj):(C/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2),encoding='utf-8')
base='https://www.napoleon.org/'
S=[
 ('SRC_CHRONO','Fondation Napoléon','Cronologia del Consolato e dell’Impero','https://www.napoleon.org/jeunes-historiens/napodoc/chronologie-consulatempire/','2017','institutional_chronology','reference_only','high'),
 ('SRC_CHRONO_1797','Fondation Napoléon','Correspondance générale, tome 1 — Les apprentissages',base+'histoire-des-2-empires/chronologies/chronologie-de-la-correspondance-generale-de-napoleon-bonaparte-tome-premier-les-apprentissages-1784-1797/','2004','scholarly_chronology','reference_only','high'),
 ('SRC_CHRONO_1805','Fondation Napoléon','Correspondance générale, tome 5 — 1805',base+'histoire-des-2-empires/chronologies/chronologie-de-la-correspondance-generale-de-napoleon-bonaparte-tome-5-1805-boulogne-trafalgar-austerlitz/','2008','scholarly_chronology','reference_only','high'),
 ('SRC_CHRONO_1815','Fondation Napoléon','Correspondance générale, tome 15 — Les chutes, 1814–1821',base+'histoire-des-2-empires/chronologies/chronologie-de-la-correspondance-generale-de-napoleon-bonaparte-tome-15-les-chutes-1814-1821-supplement-1788-1813/','2018','scholarly_chronology','reference_only','high'),
 ('SRC_RUSSIA_ADVANCE','Fondation Napoléon','Napoleon’s Russian campaign: From the Niemen to Moscow',base+'en/history-of-the-two-empires/timelines/napoleons-russian-campaign-from-the-niemen-to-moscow/','modern','scholarly_chronology','reference_only','high'),
 ('SRC_RUSSIA_RETREAT','Fondation Napoléon','Napoleon’s Russian campaign: The retreat from Moscow',base+'en/history-of-the-two-empires/timelines/napoleons-russian-campaign-the-retreat/','modern','scholarly_chronology','reference_only','high'),
 ('SRC_NE','Natural Earth contributors','Natural Earth: land and populated places, 1:110m','https://www.naturalearthdata.com/about/terms-of-use/','5.1.2','physical_basemap','public_domain','high'),
 ('SRC_MINARD','Charles Joseph Minard / stdlib contributors','Russia 1812: trascrizione della carta statistica del 1869','https://github.com/stdlib-js/datasets-minard-napoleons-march','1869 / 0.2.3','retrospective_cartographic_reconstruction','PDDL-1.0 / CC0-1.0','medium'),
 ('SRC_STOCKDALE','John Stockdale / Library of Congress','Map of the seat of war in the northern part of Europe','https://www.loc.gov/item/2018588030/','1812-07-25','contemporary_map','public_domain; LoC free to use and reuse','primary_direct'),
 ('SRC_OHM_POLICY','OpenHistoricalMap','Copyright and Acknowledgements','https://www.openhistoricalmap.org/copyright','2026','license_statement','CC0 default; exceptions per feature','high'),
 ('SRC_VIENNA','Congress of Vienna / Wikisource','Acte du Congrès de Vienne du 9 juin 1815','https://fr.wikisource.org/wiki/Acte_du_Congr%C3%A8s_de_Vienne_du_9_juin_1815','1815-06-09','primary_diplomatic','public_domain_original; reference only','primary_direct'),
]
sources=[{'source_id':i,'author_or_institution':a,'title':t,'url':u,'date':d,'source_type':ty,'license':lic,'accessed':'2026-09-12','reliability':rel,'supports':[]} for i,a,t,u,d,ty,lic,rel in S]
write('editorial-sources.json',sources)
rows='''1796-04-12|battaglia|Montenotte|Montenotte|La vittoria apre la separazione degli eserciti austriaco e piemontese.|La campagna modifica i rapporti di forza nell’Italia settentrionale.|SRC_CHRONO_1797
1796-05-10|battaglia|Lodi|Lodi|Il passaggio dell’Adda apre la via verso Milano.|Avanza l’occupazione francese della Lombardia.|SRC_CHRONO_1797
1797-01-14|battaglia|Rivoli|Rivoli|La vittoria francese precede la capitolazione di Mantova.|Si rafforza il dominio militare francese nell’Italia settentrionale.|SRC_CHRONO_1797
1797-02-19|trattato|Trattato di Tolentino|Tolentino|La Santa Sede accetta cessioni e condizioni imposte dalla Francia.|Le Legazioni sono sottratte allo Stato pontificio.|SRC_CHRONO_1797
1797-05-12|scomparsa_di_stato|Fine della Repubblica di Venezia|Venice|Il Maggior Consiglio pone fine al governo aristocratico.|Si apre una transizione politica prima della sistemazione di Campoformio.|SRC_CHRONO_1797
1797-06-29|nascita_di_stato|Repubblica Cisalpina|Milan|La nuova repubblica riunisce territori dell’Italia settentrionale.|Nasce uno Stato dipendente dall’appoggio francese.|SRC_CHRONO_1797
1797-10-17|trattato|Trattato di Campoformio|Campoformio|Francia e Austria concordano una nuova sistemazione territoriale.|Venezia passa all’Austria; si consolida la Repubblica Cisalpina.|SRC_CHRONO_1797
1798-02-15|nascita_di_stato|Repubblica Romana|Rome|La repubblica è proclamata dopo l’intervento francese.|Il potere temporale pontificio è sospeso sul territorio occupato.|SRC_CHRONO
1798-04-12|cambio_di_regime|Repubblica Elvetica|Bern|La nuova repubblica sostituisce il precedente ordinamento confederale.|L’assetto svizzero è riorganizzato in senso unitario.|SRC_SWISS_ARCHIVES
1799-11-09|cambio_di_regime|Il 18 brumaio|Paris|Il colpo di Stato apre il Consolato.|Il cambiamento di governo prepara una nuova fase delle guerre europee.|SRC_CHRONO
1800-06-14|battaglia|Marengo|Marengo|La vittoria di Bonaparte ribalta l’esito della campagna d’Italia.|La Francia recupera la prevalenza nell’Italia settentrionale.|SRC_CHRONO
1801-02-09|trattato|Pace di Lunéville|Lunéville|Francia e Austria concludono la guerra della seconda coalizione.|Si riconoscono la riva sinistra del Reno alla Francia e i nuovi assetti italiani.|SRC_CHRONO
1802-03-27|trattato|Pace di Amiens|Amiens|Francia e Regno Unito concludono una pace di breve durata.|Le restituzioni previste non eliminano le rivalità coloniali e mediterranee.|SRC_CHRONO
1802-09-11|annessione|Annessione del Piemonte|Turin|Il Piemonte entra nel territorio della Repubblica francese.|Il dominio sabaudo resta sull’isola di Sardegna.|SRC_FN_DEPARTMENTS
1803-02-19|cambio_di_regime|Atto di Mediazione|Paris|Napoleone stabilisce un nuovo ordinamento confederale per la Svizzera.|I cantoni recuperano autonomia entro una confederazione legata alla Francia.|SRC_SWISS_ARCHIVES
1803-02-25|trasferimento_territoriale|Riorganizzazione degli Stati tedeschi|Regensburg|La deputazione imperiale approva secolarizzazioni e indennizzi territoriali.|Molti enti ecclesiastici e città imperiali perdono autonomia.|SRC_CHRONO
1804-05-18|cambio_di_regime|Proclamazione dell’Impero|Paris|Napoleone assume la dignità imperiale.|La forma di governo francese cambia; non coincide con una nuova annessione.|SRC_CHRONO
1805-03-17|nascita_di_stato|Regno d’Italia|Milan|La Repubblica Italiana diventa regno con Napoleone sovrano.|Unione personale con l’Impero francese, non fusione territoriale.|SRC_CHRONO_1805
1805-10-20|battaglia|Capitolazione di Ulm|Ulm|Un esercito austriaco capitola dopo l’accerchiamento francese.|La via verso Vienna è aperta.|SRC_CHRONO_1805
1805-10-21|battaglia|Trafalgar|Trafalgar|La flotta britannica sconfigge la flotta franco-spagnola.|La superiorità navale britannica limita le opzioni francesi.|SRC_CHRONO_1805
1805-12-02|battaglia|Austerlitz|Austerlitz|Napoleone sconfigge gli eserciti austro-russi.|La pace di Presburgo ridisegna l’Europa centrale.|SRC_CHRONO_1805
1805-12-26|trattato|Pace di Presburgo|Bratislava|L’Austria accetta perdite territoriali dopo Austerlitz.|Il Veneto passa al Regno d’Italia; crescono gli alleati tedeschi della Francia.|SRC_CHRONO_1805
1806-07-12|nascita_di_stato|Confederazione del Reno|Paris|Il trattato istituisce una confederazione di Stati sotto protezione napoleonica.|I membri conservano una propria sovranità; la confederazione non è proprietaria dei territori.|SRC_RH_ACT_1806
1806-08-06|scomparsa_di_stato|Scioglimento del Sacro Romano Impero|Vienna|Francesco II depone la corona imperiale romana.|Termina la compagine imperiale; continua l’Impero austriaco.|SRC_CHRONO
1806-10-14|battaglia|Jena e Auerstedt|Jena|Le vittorie francesi disgregano l’esercito prussiano.|La Prussia viene occupata e subirà le condizioni di Tilsit.|SRC_CHRONO
1806-11-21|cambio_di_regime|Decreto di Berlino|Berlin|Napoleone proclama il blocco contro le Isole britanniche.|La politica economica rafforza la pressione sugli Stati continentali.|SRC_CHRONO
1807-07-07|trattato|Tilsit: accordo franco-russo|Tilsit|Napoleone e Alessandro I concludono la pace e un’alleanza.|Si configura un nuovo equilibrio fra Francia e Russia.|SRC_CHRONO
1807-07-09|trattato|Tilsit: trattato con la Prussia|Tilsit|La Prussia perde una parte importante dei propri territori.|Nascono il Ducato di Varsavia e il Regno di Westfalia.|SRC_CHRONO
1808-05-02|rivoluzione|Insurrezione di Madrid|Madrid|La popolazione insorge contro la presenza francese.|La crisi dinastica diventa una guerra di occupazione e resistenza.|SRC_CHRONO
1808-06-06|cambio_di_regime|Giuseppe Bonaparte re di Spagna|Madrid|Giuseppe riceve la corona spagnola.|La pretesa dinastica non assicura il controllo dell’intera penisola.|SRC_CHRONO
1809-07-06|battaglia|Wagram|Vienna|La vittoria francese conclude la principale fase della guerra con l’Austria.|Segue il trattato di Schönbrunn.|SRC_CHRONO
1809-10-14|trattato|Trattato di Schönbrunn|Vienna|L’Austria cede territori alla Francia e ai suoi alleati.|Si formano le Province Illiriche e cresce il Ducato di Varsavia.|SRC_CHRONO
1810-07-09|annessione|Annessione dell’Olanda|Amsterdam|Il Regno d’Olanda è assorbito nell’Impero francese.|L’unione dinastica è sostituita dall’amministrazione diretta.|SRC_FN_DEPARTMENTS
1810-12-13|annessione|Annessioni nella Germania settentrionale|Hamburg|Il controllo della costa e dei porti è rafforzato mediante annessioni.|I territori incorporati entrano nel sistema dipartimentale francese.|SRC_FN_DEPARTMENTS
1812-01-26|occupazione|Amministrazione francese della Catalogna|Barcelona|La Catalogna è organizzata in quattro dipartimenti sotto amministrazione francese.|Il controllo resta diseguale; lo status giuridico non coincide con quello dei dipartimenti ordinari.|SRC_FN_CATALONIA_1812
1812-03-19|cambio_di_regime|Costituzione di Cadice|Cádiz|Le Cortes promulgano una costituzione della monarchia spagnola.|Continua la competizione politica con la monarchia di Giuseppe.|SRC_CONGRESO_1812
1812-05-28|trattato|Trattato di Bucarest|Bucharest|Russia e Impero ottomano concordano la pace.|La Bessarabia è in trasferimento: firma, ratifica e controllo non sono simultanei.|SRC_BUCHAREST_MWNF
1812-06-24|campagna|Attraversamento del Niemen|Kowno|La Grande Armée entra nell’Impero russo.|Comincia la campagna; questo evento è successivo a MAP_10.|SRC_RUSSIA_ADVANCE
1812-08-17|battaglia|Smolensk|Smolensk|La battaglia precede una nuova ritirata russa verso est.|L’avanzata francese allunga le linee di rifornimento.|SRC_RUSSIA_ADVANCE
1812-09-07|battaglia|Borodino|Borodino|La battaglia apre la strada verso Mosca senza distruggere l’esercito russo.|La conquista di una città non determina la resa dell’Impero.|SRC_RUSSIA_ADVANCE
1812-09-14|occupazione|Ingresso dell’esercito francese a Mosca|Moscow|Le truppe francesi raggiungono Mosca; Napoleone vi entra il giorno seguente.|L’occupazione non porta all’accordo politico sperato.|SRC_RUSSIA_ADVANCE
1812-10-19|campagna|Inizio della ritirata da Mosca|Moscow|L’esercito francese abbandona Mosca.|Il ritiro incontra eserciti avversari e una grave crisi logistica.|SRC_RUSSIA_RETREAT
1812-11-26|battaglia|Passaggio della Beresina|Studienska|Il passaggio del fiume consente a una parte dell’esercito di proseguire la ritirata.|La campagna termina con perdite catastrofiche.|SRC_RUSSIA_RETREAT
1813-10-19|battaglia|Lipsia, battaglia delle Nazioni|Leipzig|La sconfitta francese conclude quattro giorni di battaglia.|Accelera la disgregazione della Confederazione del Reno.|SRC_CHRONO
1814-04-06|abdicazione|Prima abdicazione di Napoleone|Fontainebleau|Napoleone rinuncia al trono.|Si apre il ritorno della dinastia borbonica in Francia.|SRC_CHRONO_1815
1814-05-30|trattato|Primo trattato di Parigi|Paris|La pace riconosce alla Francia un perimetro vicino a quello del 1792.|Resta da definire la sistemazione complessiva dell’Europa.|SRC_CHRONO_1815
1814-09-01|congresso|Congresso di Vienna|Vienna|I negoziati riuniscono le potenze per riorganizzare l’Europa.|Decisioni e trasferimenti effettivi seguono calendari differenti.|SRC_CHRONO_1815
1815-03-20|restaurazione|Ritorno di Napoleone a Parigi|Paris|Il ritorno dall’Elba apre i Cento Giorni.|L’assetto discusso a Vienna non descrive il governo effettivo della Francia.|SRC_CHRONO_1815
1815-06-09|congresso|Atto finale di Vienna|Vienna|L’atto riunisce le decisioni diplomatiche del congresso.|MAP_13 rappresenta questo assetto normativo, non una fotografia del controllo.|SRC_VIENNA
1815-06-18|battaglia|Waterloo|Waterloo|Le armate alleate sconfiggono Napoleone.|La sconfitta porta alla seconda abdicazione e alla Restaurazione.|SRC_CHRONO_1815
1815-06-22|abdicazione|Seconda abdicazione di Napoleone|Paris|Napoleone lascia nuovamente il potere.|Termina il governo dei Cento Giorni.|SRC_CHRONO_1815
1815-11-20|trattato|Secondo trattato di Parigi|Paris|La nuova pace impone condizioni più gravose alla Francia.|Seguono riduzioni territoriali, indennità e occupazione alleata.|SRC_CHRONO_1815
1816-12-08|nascita_di_stato|Regno delle Due Sicilie|Naples|Ferdinando riunisce formalmente i due regni.|L’unificazione istituzionale modifica l’ordinamento dell’Italia meridionale.|SRC_CHRONO_1815'''
from build_atlas import DATES
ne=json.loads((C/'places-source.geojson').read_text(encoding='utf-8'))['features'];minard=json.loads((C/'minard-source.json').read_text(encoding='utf-8'))
city={f['properties']['NAME']:f['geometry']['coordinates'] for f in ne};mini={f['city']:[f['lon'],f['lat']] for f in minard['cities']}
events=[]
for n,row in enumerate(rows.splitlines(),1):
 date,category,title,place,desc,consequences,source=row.split('|');coord=city.get(place) or mini.get(place)
 before=max([i for i,d in enumerate(DATES,1) if d<date] or [1]);after=min([i for i,d in enumerate(DATES,1) if d>=date] or [15])
 events.append({'id':f'EV_{n:03}','title':title,'date_start':date,'date_end':{'Lipsia, battaglia delle Nazioni':'1813-10-19','Passaggio della Beresina':'1812-11-29','Congresso di Vienna':'1815-06-09'}.get(title,date),'location':place,'coordinates':coord,'coordinate_note':'Località orientativa dal dataset citato, non posizione esatta della battaglia.' if coord else 'Coordinate non verificate: evento disponibile nell’elenco testuale.','coordinate_source_ids':['SRC_NE' if place in city else 'SRC_MINARD'] if coord else [],'category':category,'actors':['Francia e potenze coinvolte: vedi fonte'],'description_it':desc,'territorial_consequences':consequences,'entity_ids':[],'map_before':f'MAP_{before:02}','map_after':f'MAP_{after:02}','certainty':'medium','sources':[source]})
 # Separate the battle's beginning from its decisive outcome.
 if title.startswith('Lipsia'):events[-1]['date_start']='1813-10-16'
write('events.json',events)
campaigns=[]
spec=[('ITALY_1796','Prima campagna d’Italia','1796-04-12','1797-10-17',['Montenotte','Lodi','Rivoli','Trattato di Campoformio']),('ITALY_1800','Seconda campagna d’Italia','1800-05-01','1800-06-14',['Marengo']),('AUSTRIA_1805','Campagna del 1805','1805-09-01','1805-12-26',['Capitolazione di Ulm','Austerlitz','Pace di Presburgo']),('PRUSSIA_1806','Prussia e Polonia','1806-10-01','1807-07-09',['Jena e Auerstedt','Tilsit: accordo franco-russo','Tilsit: trattato con la Prussia']),('SPAIN','Guerra nella Penisola iberica','1808-05-02','1814-04-17',['Insurrezione di Madrid','Giuseppe Bonaparte re di Spagna','Costituzione di Cadice']),('RUSSIA_1812','Campagna di Russia','1812-06-24','1812-12-14',['Attraversamento del Niemen','Smolensk','Borodino','Ingresso dell’esercito francese a Mosca','Inizio della ritirata da Mosca','Passaggio della Beresina']),('GERMANY_1813','Campagna di Germania','1813-04-01','1813-10-19',['Lipsia, battaglia delle Nazioni']),('FRANCE_1814','Campagna di Francia','1814-01-01','1814-04-06',['Prima abdicazione di Napoleone']),('BELGIUM_1815','Campagna del Belgio','1815-06-15','1815-06-22',['Waterloo','Seconda abdicazione di Napoleone'])]
routes=[]
for id,title,start,end,titles in spec:
 selected=[e for e in events if e['title'] in titles]
 campaigns.append({'id':id,'title':title,'date_start':start,'date_end':end,'stages':[e['id'] for e in selected],'sources':sorted({s for e in selected for s in e['sources']}|({'SRC_MINARD'} if id=='RUSSIA_1812' else set())),'route_status':'documented_generalization' if id=='RUSSIA_1812' else 'stages_only','notes':'Percorso cartografico generalizzato da Minard (1869), non tracciato stradale. Le cifre rappresentano la fonte, non stime indipendenti.' if id=='RUSSIA_1812' else 'Tappe/eventi documentati; non sono disegnate linee fra località prive di un itinerario verificato.'})
for division in sorted({r['division'] for r in minard['army']}):
 for direction in ['A','R']:
  rows=[r for r in minard['army'] if r['division']==division and r['direction']==direction]
  if len(rows)<2:continue
  rid=f'RUSSIA_{division}_{direction}';routes.append({'type':'Feature','id':rid,'properties':{'geometry_id':rid,'campaign_id':'RUSSIA_1812','name':('Avanzata' if direction=='A' else 'Ritirata')+f' · gruppo {division}','direction':direction,'division':division,'army_sizes':[r['size'] for r in rows],'valid_from':'1812-06-24','valid_to':'1812-12-14','certainty':'medium','boundary_type':'approximate','geometry_source_ids':['SRC_MINARD'],'notes':'Coordinate della carta di Minard, generalizzate; non itinerario stradale.'},'geometry':{'type':'LineString','coordinates':[[r['lon'],r['lat']] for r in rows]}})
write('campaigns.json',campaigns);write('campaign-routes.geojson',{'type':'FeatureCollection','features':routes})
write('documents.json',[{'id':'DOC_1812_STOCKDALE','title':'L’Europa vista nel luglio 1812','author':'John Stockdale','date':'1812-07-25','collection':'Library of Congress, Geography and Map Division','url':'https://www.loc.gov/item/2018588030/','asset':'assets/stockdale-1812.jpg','source_ids':['SRC_STOCKDALE'],'license':'Public domain; free to use and reuse, Library of Congress','georeferencing':None,'notes':'Carta pubblicata dopo MAP_10. Non mostra le operazioni militari; le rappresentazioni territoriali riflettono conoscenze e scelte del cartografo. Documento originale distinto dall’atlante ricostruito.'}])
from enrich_content import enrich
enrich()
print('Events',len(events),'located',sum(bool(e['coordinates']) for e in events),'campaigns',len(campaigns),'routes',len(routes))
