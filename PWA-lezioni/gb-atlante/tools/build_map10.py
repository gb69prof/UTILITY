import json, re, os, sys, zipfile, subprocess
from pathlib import Path
from datetime import date

ROOT = Path(__file__).resolve().parents[1]
D = ROOT/'data'/'MAP_10'
S = D/'schemas'
SNAPSHOT_ID='MAP_10'
AS_OF='1812-06-01'
SCHEMA_VERSION='GBATLANTE_MAP10_1.0.1'
ACCESSED='2026-09-12'
D.mkdir(parents=True, exist_ok=True); S.mkdir(parents=True, exist_ok=True)

def dump(path, obj):
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2)+"\n", encoding='utf-8')

# -------------------------- controlled vocabularies --------------------------

def item(i, label, definition): return {'id':i,'label_it':label,'definition':definition}

vocabs = {
'entity_class': [
 item('state','Stato','Entità politica territoriale dotata o rivendicante personalità statale propria.'),
 item('confederation','Confederazione','Associazione istituzionale di entità politiche che non implica sovranità territoriale unitaria.'),
 item('claimant_government','Governo rivendicante','Governo organizzato che rivendica legittimità o sovranità senza controllare necessariamente tutto il territorio rivendicato.'),
 item('autonomous_polity','Entità autonoma','Entità dotata di autogoverno interno ma inserita in una sovranità superiore.'),
 item('de_facto_polity','Entità politica de facto','Potere territoriale organizzato con controllo effettivo ma status internazionale non pienamente stabilizzato.'),
 item('sovereign_institution','Istituzione sovrana','Istituzione che esercita o rivendica potestà sovrana senza coincidere con un normale Stato territoriale.'),
 item('territorial_unit','Unità territoriale','Territorio politicamente significativo privo di distinta personalità statale.'),
 item('administrative_unit','Unità amministrativa','Suddivisione amministrativa formale di un’entità superiore.')],
'constitutional_form': [
 item('empire','Impero','Monarchia imperiale.'), item('kingdom','Regno','Monarchia regia.'), item('grand_duchy','Granducato','Monarchia con titolo granducale.'),
 item('duchy','Ducato','Monarchia con titolo ducale.'), item('principality','Principato','Monarchia con titolo principesco.'), item('co_principality','Coprincipato','Entità sottoposta a due co-sovrani o co-signori.'),
 item('confederation','Confederazione','Forma confederale.'), item('republic','Repubblica','Forma repubblicana.'), item('free_city','Città libera','Entità statale cittadina con status di città libera.'),
 item('canton','Cantone','Entità cantonale confederata.'), item('not_applicable','Non applicabile','Forma costituzionale non pertinente al record.')],
'sovereignty_status': [
 item('full','Piena','Nessuna sovranità giuridicamente superiore registrata nel modello.'),
 item('shared','Condivisa','La sovranità è esercitata o rivendicata congiuntamente da più soggetti.'),
 item('under_suzerainty','Sotto suzeraineté','Autonomia interna sotto una sovranità o suzeraineté formalmente superiore.'),
 item('contested','Contestata','Due o più pretese di sovranità incompatibili sono politicamente operative.'),
 item('pending_transfer','Trasferimento pendente','Il trasferimento è stato concordato ma non è ancora considerato perfezionato o pienamente attuato nello snapshot.'),
 item('no_separate_sovereignty','Nessuna sovranità separata','Il territorio appartiene giuridicamente a un’altra entità e non possiede sovranità propria.'),
 item('indeterminate','Indeterminata','Le fonti non consentono di ridurre in modo affidabile lo status a una delle categorie più determinate.'),
 item('not_applicable','Non applicabile','L’entità non è portatrice di sovranità territoriale propria.')],
'effective_control_status': [
 item('full','Pieno','Un solo attore controlla stabilmente quasi tutto il territorio pertinente.'),
 item('predominant','Predominante','Un attore domina, con eccezioni territoriali significative.'),
 item('partial','Parziale','Controllo importante ma non dominante sull’intero territorio.'),
 item('fragmented','Frammentato','Più attori controllano aree diverse senza controllo unitario stabile.'),
 item('foreign_occupation','Occupazione straniera','Un soggetto esterno esercita controllo militare o amministrativo senza che ciò implichi automaticamente sovranità.'),
 item('handover_pending','Consegna pendente','Il precedente occupante mantiene controllo in attesa di evacuazione o trasferimento concordato.'),
 item('none','Nessuno','Nessun controllo territoriale diretto significativo.'),
 item('not_applicable','Non applicabile','Controllo territoriale non pertinente al record.')],
'integration_mode': [
 item('system_center','Centro del sistema','L’Impero francese come centro sovrano del sistema napoleonico.'),
 item('direct_annexation','Annessione diretta','Territorio legalmente incorporato nell’Impero francese.'),
 item('special_french_administration','Amministrazione francese speciale','Amministrazione diretta francese senza normale annessione giuridica.'),
 item('personal_union_napoleonic_crown','Unione personale napoleonica','Stato distinto la cui corona è detenuta personalmente da Napoleone.'),
 item('dynastic_client','Stato dinastico cliente','Stato distinto governato da un membro della famiglia/dinastia napoleonica e fortemente dipendente dalla Francia.'),
 item('confederated_client','Cliente confederato','Stato membro della Confederazione del Reno, sovrano ma strutturalmente legato al sistema francese.'),
 item('client_state','Stato cliente','Stato distinto strutturalmente dipendente o protetto dalla Francia senza rientrare in una categoria più specifica.'),
 item('imperial_fief','Feudo imperiale','Entità feudale o principesca concessa dal sistema imperiale napoleonico.'),
 item('imperial_domain','Dominio imperiale','Territorio direttamente riservato all’autorità di Napoleone senza essere un normale territorio dipartimentale francese.'),
 item('mediated_state','Stato mediato','Entità il cui assetto è stato garantito o imposto dalla mediazione napoleonica.'),
 item('treaty_ally','Alleato per trattato','Stato sovrano alleato della Francia mediante accordo internazionale.'),
 item('coerced_treaty_ally','Alleato per trattato sotto costrizione','Alleanza formalmente internazionale conclusa sotto forte pressione strategico-militare.'),
 item('military_occupation','Occupazione militare francese','Territorio controllato militarmente dalla Francia senza annessione.'),
 item('outside_system','Esterno al sistema','Nessuna integrazione strutturale nel sistema napoleonico.')],
'alignment': [
 item('napoleonic_system','Sistema napoleonico','Entità organicamente interna al sistema napoleonico.'),
 item('france_aligned','Allineata alla Francia','Entità politicamente o militarmente allineata alla Francia.'),
 item('coerced_france_aligned','Allineata sotto costrizione','Allineamento alla Francia prodotto in misura determinante da pressione o costrizione.'),
 item('neutral','Neutrale','Nessun allineamento bellico stabile con o contro la Francia nello snapshot.'),
 item('anti_french','Antifrancese','Entità schierata contro la Francia.'),
 item('internally_divided','Divisa internamente','Allineamento non riducibile a un’unica posizione per conflitto politico interno.'),
 item('not_applicable','Non applicabile','Allineamento non pertinente al record.')],
'dependence_level': [item('none','Nessuna','Nessuna dipendenza stabile dalla Francia.'),item('limited','Limitata','Obblighi specifici con ampia autonomia politica.'),item('substantial','Sostanziale','Politica estera o militare significativamente condizionata.'),item('high','Alta','Scelte strategiche largamente determinate dalla Francia pur restando istituzioni proprie.'),item('direct','Diretta','Autorità francesi o Napoleone esercitano direttamente governo o amministrazione.'),item('not_applicable','Non applicabile','Campo non pertinente.')],
'coercion_level': [item('none','Nessuna','Nessuna costrizione specifica registrata.'),item('diplomatic_pressure','Pressione diplomatica','Condizionamento principalmente diplomatico.'),item('structural_constraint','Vincolo strutturale','Dipendenza istituzionale o strategica che limita stabilmente l’autonomia.'),item('military_compulsion','Costrizione militare','Adesione o comportamento determinati da pressione militare diretta o minaccia credibile.'),item('occupation','Occupazione','Costrizione esercitata attraverso occupazione militare.'),item('not_applicable','Non applicabile','Campo non pertinente.')],
'war_status': [item('not_at_war_with_france','Non in guerra con la Francia','Nessuno stato di guerra con la Francia alla data dello snapshot.'),item('at_war_with_france','In guerra con la Francia','Stato di guerra con la Francia alla data dello snapshot.'),item('prewar_adversary','Avversario prebellico','Rapporto ostile e mobilitazione verso la guerra, senza ancora stato di guerra nel giorno dello snapshot.'),item('internal_conflict_with_french_forces','Conflitto interno con forze francesi','Conflitto territoriale nel quale forze francesi combattono entro il territorio senza semplice guerra interstatale binaria.'),item('occupied_not_belligerent','Occupato senza belligeranza autonoma','Territorio occupato il cui soggetto politico non è trattato come belligerante autonomo.'),item('not_applicable','Non applicabile','Campo non pertinente.')],
'certainty': [item('high','Alta','Fonte primaria diretta o convergenza di fonti autorevoli senza contraddizioni sostanziali.'),item('medium','Media','Fatto principale solido ma data, estensione o interpretazione presentano margini non risolti.'),item('low','Bassa','Ricostruzione plausibile con lacune o divergenze sostanziali.'),item('unknown','Sconosciuta','Il database dichiara di non poter stabilire il dato.')],
'display_level': [item('europe','Europa','Normalmente visibile alla scala europea.'),item('regional','Regionale','Visibile aumentando lo zoom o in una vista regionale.'),item('local','Locale','Microentità interrogabile ma normalmente nascosta alla scala europea.')],
'spatial_mode': [item('direct_area','Area diretta','L’entità riceverà una propria geometria territoriale.'),item('derived_area','Area derivata','L’area sarà derivata dall’unione di entità componenti e non implica possesso sovrano unitario.'),item('overlap_layer','Layer sovrapposto','L’entità o affermazione deve essere visualizzata come sovrapposizione ad altre geometrie.'),item('point_only','Solo punto','Entità rappresentabile normalmente come punto.'),item('nonspatial','Non spaziale','Entità priva di geometria propria nello snapshot.')],
'relation_type': [
 item('member_of','Membro di','Appartenenza istituzionale; non implica sovranità territoriale del contenitore.'),item('territorial_component_of','Componente territoriale di','Il territorio è parte giuridica o analitica dell’entità oggetto.'),item('administrative_subdivision_of','Suddivisione amministrativa di','Gerarchia amministrativa formale.'),item('autonomous_within','Autonomo entro','Autogoverno interno dentro una sovranità superiore.'),item('vassal_of','Vassallo di','Dipendenza formale da un suzerain.'),item('protected_by','Protetto da','Protezione politica o militare senza annessione.'),item('mediated_by','Mediato da','Assetto politico-costituzionale garantito o imposto dal soggetto oggetto.'),item('administered_by','Amministrato da','Amministrazione civile esercitata dall’altro soggetto.'),item('occupied_by','Occupato da','Occupazione militare straniera.'),item('claims_sovereignty_over','Rivendica sovranità su','Pretesa di sovranità sul territorio o entità oggetto.'),item('personal_union_with','In unione personale con','Due Stati distinti condividono il medesimo sovrano.'),item('dynastic_marriage_link_with','Legame matrimoniale dinastico con','Legame dinastico politicamente significativo mediante matrimonio.'),item('dynastic_link_with','Legame dinastico con','Legame dinastico significativo non ridotto a matrimonio o unione personale.'),item('military_alliance_with','Alleanza militare con','Alleanza militare formalizzata.'),item('military_obligation_to','Obbligo militare verso','Obbligo strutturato di contingenti, passaggi, rifornimenti o altri servizi militari.'),item('co_belligerent_with','Cobelligerante con','Combattimento effettivo contro il medesimo avversario.'),item('at_war_with','In guerra con','Stato di guerra tra due soggetti.'),item('transfer_agreed_to','Trasferimento concordato a','Trasferimento territoriale diplomaticamente concordato ma non necessariamente completato.'),item('transfer_completed_to','Trasferimento completato a','Trasferimento territoriale perfezionato.'),item('guaranteed_by','Garantito da','Status, territorio o costituzione garantiti dall’altro soggetto.'),item('succeeds','Succede a','Successione politico-istituzionale.')],
'spatial_layer_type': [item('sovereignty_claim','Pretesa di sovranità','Geometria futura di una pretesa giuridico-politica.'),item('civil_administration','Amministrazione civile','Geometria futura dell’amministrazione civile effettiva.'),item('military_control','Controllo militare','Geometria futura del controllo militare effettivo.'),item('military_occupation','Occupazione militare','Geometria futura di un’occupazione straniera senza automatica annessione.'),item('special_administration','Amministrazione speciale','Geometria futura di un regime amministrativo eccezionale.'),item('military_presence','Presenza militare','Presenza di forze senza implicare controllo stabile.'),item('treaty_transfer_pending','Trasferimento pendente da trattato','Area il cui trasferimento è concordato ma non ancora considerato completamente attuato.')],
'source_type': [item('primary_legal','Fonte primaria giuridica','Legge, costituzione, decreto o atto normativo coevo.'),item('primary_diplomatic','Fonte primaria diplomatica','Trattato, convenzione, protocollo o atto diplomatico coevo.'),item('primary_administrative','Fonte primaria amministrativa','Documento amministrativo o archivistico coevo.'),item('primary_narrative','Fonte primaria narrativa','Testimonianza o resoconto coevo direttamente pertinente, distinto da atto normativo o amministrativo.'),item('contemporary_cartography','Cartografia coeva','Carta prodotta nell’epoca rappresentata.'),item('contemporary_statistical','Statistica coeva','Repertorio, statistica o manuale contemporaneo agli eventi.'),item('academic_historiography','Storiografia accademica','Studio scientifico moderno.'),item('institutional_historiography','Storiografia istituzionale','Ricostruzione storica pubblicata da istituzione archivistica, museale o pubblica.'),item('modern_cartographic_reconstruction','Ricostruzione cartografica moderna','Carta storica moderna elaborata scientificamente.'),item('gis_dataset','Dataset GIS','Dataset geografico strutturato.'),item('archival_catalog','Catalogo archivistico','Descrizione archivistica o catalografica di documenti.')],
'date_precision': [item('day','Giorno','Data precisa al giorno.'),item('month','Mese','Data precisa al mese.'),item('year','Anno','Data precisa soltanto all’anno.'),item('range','Intervallo','La data rappresenta un intervallo documentario.'),item('unknown','Sconosciuta','Precisione non determinabile.')],
'record_nature': [item('contemporary_political_entity','Entità politica contemporanea','Record che rappresenta una entità politica effettivamente operante nello snapshot.'),item('historical_analytical_aggregation','Aggregazione storico-analitica','Aggregazione creata da GB-Atlante per conservare origine storica o regime territoriale; non pretende di essere un ente amministrativo coevo.'),item('administrative_subdivision','Suddivisione amministrativa','Record di una suddivisione amministrativa formalmente esistente.'),item('claimant_structure','Struttura rivendicante','Record di un governo o struttura politica concorrente.'),item('derived_grouping','Raggruppamento derivato','Raggruppamento analitico di unità componenti.'),item('historical_locality','Località storica','Record locale conservato per rilevanza storica senza attribuirgli automaticamente statualità.')],
'capital_role': [item('capital','Capitale','Capitale politica ordinaria.'),item('royal_capital','Capitale regia','Capitale della monarchia.'),item('government_seat','Sede del governo','Sede effettiva degli organi centrali.'),item('legal_capital','Capitale legale','Capitale designata giuridicamente, anche se il trasferimento amministrativo non è completo.'),item('de_facto_government_seat','Sede governativa de facto','Sede effettiva diversa dalla capitale legale.'),item('administrative_centre','Centro amministrativo','Centro principale di una unità territoriale o amministrativa.'),item('residence','Residenza','Residenza principesca o dinastica rilevante.'),item('not_applicable','Non applicabile','Ruolo non pertinente.')],
'office_role': [item('sovereign','Sovrano','Titolare della sovranità monarchica.'),item('co_sovereign','Co-sovrano','Uno dei titolari di una sovranità condivisa.'),item('regent','Reggente','Esercita il governo in nome di un sovrano minorenne o impedito.'),item('viceroy','Viceré','Esercita il governo vicereale.'),item('head_of_government','Capo del governo','Responsabile politico dell’esecutivo.'),item('governor','Governatore','Autorità territoriale o militare superiore.'),item('prince_regent','Principe reggente','Reggente con titolo principesco.'),item('not_applicable','Non applicabile','Ruolo non pertinente.')],
'source_reliability': [item('primary_direct','Primaria diretta','Fonte coeva direttamente pertinente all’affermazione.'),item('high','Alta','Fonte istituzionale o accademica autorevole e direttamente pertinente.'),item('medium','Media','Fonte utile e plausibile ma non sufficiente da sola per affermazioni critiche.'),item('low','Bassa','Fonte provvisoria o secondaria debole, da sostituire.')],
'resolution_status': [item('open','Aperto','Problema ancora irrisolto.'),item('provisionally_resolved','Risolto provvisoriamente','Soluzione operativa adottata ma soggetta a revisione.'),item('resolved','Risolto','Problema sufficientemente risolto per lo stato corrente del dataset.'),item('blocked','Bloccato','Problema che impedisce una fase successiva specifica.')],
'issue_type': [item('chronology','Cronologia','Incertezza o discordanza su date e sequenze.'),item('legal_status','Status giuridico','Incertezza sulla sovranità o qualificazione giuridica.'),item('effective_control','Controllo effettivo','Incertezza sulla distribuzione del controllo reale.'),item('membership','Appartenenza','Incertezza su appartenenza istituzionale o conteggio dei membri.'),item('source_quality','Qualità fonte','La fonte disponibile necessita rafforzamento o sostituzione.'),item('ontology','Ontologia','Problema nella definizione o granularità di entità e relazioni.'),item('administration','Amministrazione','Incertezza sul regime amministrativo.'),item('territorial_scope','Ambito territoriale','Incertezza sull’estensione spaziale futura.'),item('naming','Denominazione','Incertezza o varianti significative del nome.')],
'spatial_assertion_status': [item('active','Attiva','Affermazione valida nello snapshot.'),item('transitional','Transitoria','Affermazione relativa a una situazione in corso di trasferimento o evacuazione.'),item('contested','Contestata','Affermazione concorrente con altre pretese o controlli.'),item('planned_or_disputed','Pianificata o discussa','Provvedimento/intento documentato la cui piena implementazione è incerta.')]
}

vocab_file={'schema_version':SCHEMA_VERSION,'snapshot_id':SNAPSHOT_ID,'vocabularies':vocabs}
dump(D/'vocabularies.json', vocab_file)

enum = {k:[x['id'] for x in v] for k,v in vocabs.items()}

# -------------------------- sources --------------------------
def src(i,title,inst,d,typ,url,license='not_stated',rel='high',upgrade=False,notes=''):
    return {'source_id':i,'title':title,'author_or_institution':inst,'date':d,'source_type':typ,'url':url,'license':license,'accessed':ACCESSED,'reliability':rel,'needs_source_upgrade':upgrade,'notes':notes}

sources=[
src('SRC_IEG_1812','Europa 1812 – Das napoleonische Staatensystem (MAP 346)','Leibniz-Institut für Europäische Geschichte / Andreas Kunz','2004','modern_cartographic_reconstruction','https://www.ieg-maps.uni-mainz.de/mapsp/mappEu812Serie1_Napo.htm','CC BY-NC 4.0','high'),
src('SRC_IEG_1812_SERIE2','Europa 1812 – Das napoleonische Staatensystem (MAP 351)','Leibniz-Institut für Europäische Geschichte / Andreas Kunz','2004','modern_cartographic_reconstruction','https://www.ieg-maps.uni-mainz.de/mapsp/mappEu812Serie2_Napo.htm','CC BY-NC 4.0','high'),
src('SRC_FN_1812','Carte de l’Europe en 1812','Fondation Napoléon / Aurélie Boissière','2019','modern_cartographic_reconstruction','https://www.napoleon.org/histoire-des-2-empires/cartes/carte-de-leurope-en-1812/','restricted_reproduction','high'),
src('SRC_FN_DEPARTMENTS','Les départements réunis et les gouverneurs généraux sous le Consulat et l’Empire','Fondation Napoléon / Thierry Lentz','modern','academic_historiography','https://www.napoleon.org/histoire-des-2-empires/articles/institutions-les-departements-reunis-et-les-gouverneurs-generaux-sous-le-consulat-et-lempire/','restricted_reproduction','high'),
src('SRC_RH_ACT_1806','Rheinbundakte vom 12. Juli 1806','Landesarchiv Baden-Württemberg','1806-07-12','primary_diplomatic','https://www.leo-bw.de/fr/detail/-/Detail/details/DOKUMENT/labw_findmittel_06/labw-1-681424/Konf%C3%B6derationsvertrag%20Rheinbundakte%20vom%2012071806','archive_terms','primary_direct'),
src('SRC_RH_ACCESSIONS','Beitrittserklärungen zum Rheinbund nach dem 12. Juli 1806','Landesarchiv Baden-Württemberg','1806','archival_catalog','https://www.leo-bw.de/en/web/guest/detail/-/Detail/details/DOKUMENT/labw_findmittel_06/labw-1-654956/Beitrittserkl%C3%A4rungen%2Bzum%2BRheinbund%2Bnach%2Bdem%2B12%2BJuli%2B1806','archive_terms','high'),
src('SRC_RH_DEMIAN_V1','Statistik der Rheinbundstaaten, Band 1','Johann Andreas Demian','1812','contemporary_statistical','https://books.google.com/books/about/Statistik_der_Rheinbundstaaten.html?id=nOsrAQAAIAAJ','public_domain_original','primary_direct'),
src('SRC_RH_DEMIAN_V2','Statistik der Rheinbundstaaten, Band 2','Johann Andreas Demian','1812','contemporary_statistical','https://books.google.com/books/about/Statistik_der_Rheinbundstaaten.html?hl=de&id=6DwAAAAAcAAJ','public_domain_original','primary_direct'),
src('SRC_RH_LANCIZOLLE_1830','Uebersicht der deutschen Reichsstandschafts- und Territorial-Verhältnisse','Carl Wilhelm von Lancizolle','1830','academic_historiography','https://de.scribd.com/document/967306220/Ubersicht-Der-Deutschen-Reichsstandschafts-Und-Territorial-Verhaltnisse','digitization_terms_unknown','high',False,'Usato per il conteggio giuridico di 34 Rheinbundstaaten e la distinzione dei quattro principati Reuss; la piattaforma di digitalizzazione non è usata per riuso di immagini.'),
src('SRC_RH_MAP_1812_HALLE','Neueste Post- und Reisekarte durch die Staaten des Rheinbundes und die angränzenden Länder','Universitäts- und Landesbibliothek Sachsen-Anhalt / Homannsche Erben','1812','contemporary_cartography','https://opendata.uni-halle.de/handle/1981185920/103442','CC BY 4.0','primary_direct'),
src('SRC_DB_KOETHEN_REGENCY','Leopold III. Friedrich Franz – Deutsche Biographie','Deutsche Biographie','1875','academic_historiography','https://www.deutsche-biographie.de/sfz68642.html','not_stated','high'),
src('SRC_DDB_KOETHEN_AUGUST','August Christian Friedrich, Herzog von Anhalt-Köthen','Deutsche Digitale Bibliothek','modern','archival_catalog','https://www.deutsche-digitale-bibliothek.de/person/gnd/104232757','not_stated','high'),
src('SRC_DUSSELDORF_BERG','Die französischen Landesherren','Stadtarchiv Düsseldorf','modern','institutional_historiography','https://www.duesseldorf.de/stadtarchiv/stadtgeschichte/aufsaetze/berg-genealogie/die-franzoesischen-landesherren','not_stated','high'),
src('SRC_HGIS_WALDECK','Waldeck – HGIS Germany eKompendium','Leibniz-Institut für Europäische Geschichte','modern','academic_historiography','https://www.hgisg-ekompendium.ieg-mainz.de/Dokumentation_Datensaetze/Multimedia/Staaten/Waldeck.php','not_stated','high'),
src('SRC_RH_PYRMONT_ACCESSION','Akzessionsvertrag betreffend den Beitritt Sr. Durchlaucht des Fürsten Georg von Waldeck zum Rheinbund','documentArchiv.de, trascrizione di atto diplomatico','1807-04-18','primary_diplomatic','https://www.documentarchiv.de/nzjh/1807/rheinbund_akzessionsvertrag-waldeck.html','public_domain_original','high',False,'L’atto è intestato a Georg, che dal 1805 governava separatamente Pyrmont; è usato con HGIS e storiografia accademica per documentare l’adesione autonoma di Pyrmont.'),
src('SRC_RH_WALDECK_PYRMONT_LWL','Grundbedingungen politischer Herrschaft – Rheinbundzeit (J. Arndt)','Landschaftsverband Westfalen-Lippe','1992','academic_historiography','https://www.lwl.org/westfaelische-geschichte/txt/normal/txt261.pdf','not_stated','high',False,'Studio accademico che elenca Waldeck und Pyrmont tra le entità aderenti nel gruppo delle accessioni del 1807.'),
src('SRC_SWISS_ARCHIVES','Era of change: Switzerland between 1798 and 1848','Swiss Federal Archives','modern','institutional_historiography','https://www.bar.admin.ch/en/era-of-change-switzerland-between-1798-and-1848','not_stated','high'),
src('SRC_ACT_MEDIATION','Acte de Médiation – Acte fédéral','Confederazione svizzera / edizione digitale','1803','primary_legal','https://fr.wikisource.org/wiki/Acte_f%C3%A9d%C3%A9ral','public_domain_original','primary_direct'),
src('SRC_FINLAND_1812_HELSINKI','1812 – Capital City','City of Helsinki','modern','institutional_historiography','https://historia.hel.fi/en/kaannekohdat/1800-luku/1812-capital-city','not_stated','high'),
src('SRC_FINLAND_GOV','History of the Government and Senate','Finnish Government','modern','institutional_historiography','https://valtioneuvosto.fi/en/history-and-buildings','not_stated','high'),
src('SRC_HANOVER_NLA','Französische Okkupation 1803-1814 – Bestand Hann. 49','Niedersächsisches Landesarchiv','modern','archival_catalog','https://www.arcinsys.niedersachsen.de/arcinsys/showFondsDetails.action?fondsId=1173&request_locale=en','archive_terms','high',False,'La descrizione archivistica documenta il trasferimento del ministero hannoveriano prima a Lauenburg e poi a Londra durante l’occupazione francese.'),
src('SRC_FN_RUSSIA_1812','Napoleon’s Russian Campaign: the march to the Niemen','Fondation Napoléon','modern','institutional_historiography','https://www.napoleon.org/en/history-of-the-two-empires/timelines/napoleons-russian-campaign-the-march-to-the-niemen/','restricted_reproduction','high'),
src('SRC_FN_RUSSIA_CHRONO','1812: la campagne de Russie – de la diplomatie au passage du Niemen','Fondation Napoléon','modern','institutional_historiography','https://www.napoleon.org/histoire-des-2-empires/chronologies/1812-la-campagne-de-russie-1-de-la-diplomatie-au-passage-du-niemen/','restricted_reproduction','high'),
src('SRC_CONGRESO_1812','Constitución de 1812','Congreso de los Diputados (España)','1812-03-19','primary_legal','https://www.congreso.es/cem/const1812','public_document','primary_direct'),
src('SRC_FN_CATALONIA_1812','Départements réunis: Catalogne, décret du 26 janvier 1812','Fondation Napoléon / Thierry Lentz','modern','academic_historiography','https://www.napoleon.org/histoire-des-2-empires/articles/institutions-les-departements-reunis-et-les-gouverneurs-generaux-sous-le-consulat-et-lempire/','restricted_reproduction','high'),
src('SRC_ANDORRA_1806','Décret de Napoléon rétablissant le coprincipat','Arxiu Nacional d’Andorra','1806-03-27','primary_legal','https://www.arxiuenlinia.ad/fotoweb/archives/5004-Documents-textuals/Documents/ASC/ASC_03709.pdf.info','archive_terms','primary_direct'),
src('SRC_ANDORRA_1812_STUDY','Studio universitario sul progetto napoleonico del dipartimento del Sègre e Andorra','Universitat de Barcelona','modern','academic_historiography','https://diposit.ub.edu/server/api/core/bitstreams/ed11153f-40d3-41a0-977f-96f645b42812/content','not_stated','high'),
src('SRC_CATALONIA_ATLAS','La guerra del Francès, 1808-1814','Enciclopèdia Catalana','modern','institutional_historiography','https://www.enciclopedia.cat/atles-de-la-presencia-catalana-al-mon/la-guerra-del-frances.-1808-1814','not_stated','high'),
src('SRC_BUCHAREST_MWNF','The peace treaty of Bucharest','National Museum of Romanian History / Museum With No Frontiers','1812-05-28','institutional_historiography','https://sharinghistory.museumwnf.org/database_item.php?id=object%3BAWE%3Brm%3B38%3Ben','not_stated','high'),
src('SRC_BUCHAREST_TAKI','Russian Occupation of Moldavia and Wallachia in 1806–1812','Victor Taki / Central European University Press','2021','academic_historiography','https://www.degruyterbrill.com/_language/en?uri=%2Fdocument%2Fdoi%2F10.1515%2F9789633863831-006%2Fhtml','copyright','high'),
src('SRC_SERBIA_MFA','History of Serbian diplomacy and the Ministry of Foreign Affairs','Ministry of Foreign Affairs of Serbia','modern','institutional_historiography','https://www.msp.rs/en/ministry/history','not_stated','high'),
src('SRC_MONTENEGRO_PRINCETON','Montenegro – Historical Evolution','Princeton Encyclopedia of Self-Determination','modern','academic_historiography','https://pesd.princeton.edu/node/726','not_stated','high'),
src('SRC_MALTA_UM','Studio sullo status giuridico di Malta nel periodo britannico iniziale','University of Malta','modern','academic_historiography','https://www.um.edu.mt/library/oar/handle/123456789/100125','copyright','high'),
src('SRC_IONIAN_HOLLAND_1815','Travels in the Ionian Isles, Albania, Thessaly, Macedonia, &c. during the years 1812 and 1813','Sir Henry Holland','1815','primary_narrative','https://books.google.com/books/about/Travels_in_the_Ionian_Isles_Albania_Thes.html?id=tu0GAAAAQAAJ','public_domain_original','primary_direct',False,'Testimonianza coeva: distingue esplicitamente Corfù e Paxos rimaste in potere francese dalle cinque isole occupate dai britannici.'),
src('SRC_HELGOLAND_LASH','Landschaft und britische Kronkolonie Helgoland – Bestand Abt. 174','Landesarchiv Schleswig-Holstein','modern','archival_catalog','https://arcinsys.schleswig-holstein.de/arcinsys/showFondsDetails.action?fondsId=57&request_locale=en','archive_terms','high',False,'Il fondo archivistico documenta l’occupazione britannica del 1807 e la fase britannica; la cessione formale del 1814 resta distinta dal controllo de facto.'),
src('SRC_SWEDISH_POMERANIA_FN','Occupation de la Poméranie suédoise, janvier 1812','Fondation Napoléon','1812','institutional_historiography','https://www.napoleon.org/en/history-of-the-two-empires/timelines/napoleons-russian-campaign-the-march-to-the-niemen/','restricted_reproduction','high'),
src('SRC_SANMARINO_HISTORY','Storia della Repubblica di San Marino – Profili generali','Repubblica di San Marino / Governo','modern','institutional_historiography','https://www.gov.sm/pub2/GovSM/dam/jcr%3Af41d96d3-5286-46ef-9a9d-35060f0d16d3/STORIA%20DELLA%20REPUBBLICA%20DI%20SAN%20MARINO%20-%20Profili%20Generali.pdf','public_document','high',False,'Fonte istituzionale sammarinese usata per la continuità della Repubblica durante l’età napoleonica.'),
src('SRC_COSPAIA_ARCHIVE','Comunità di Cospaia – profilo istituzionale','Sistema Informativo Unificato per le Soprintendenze Archivistiche (MiC)','modern','archival_catalog','https://siusa-archivi.cultura.gov.it/cgi-bin/siusa/pagina.pl?Chiave=46518&TipoPag=prodente','not_stated','high'),
src('SRC_LUCCA_ARCHIVE','Principato Baciocchi, 1805-1814','Sistema Informativo degli Archivi di Stato / Ministero della Cultura','modern','archival_catalog','https://sias-archivi.cultura.gov.it/cgi-bin/pagina.pl?Chiave=62&TipoPag=contesto','public_document','high',False,'Record archivistico specifico sul Principato Baciocchi e sulla sua durata 1805-1814.'),
src('SRC_PONTECORVO_AN','Lucien Murat (1803-1878), prince de Ponte-Corvo','Archives nationales (France)','modern','archival_catalog','https://rdf.archives-nationales.culture.gouv.fr/garance/entities/agent/050569/?lang=en','not_stated','medium',True,'Conferma il titolo di Lucien Murat ma non basta da sola a fissare con precisione l’investitura al 1 giugno 1812.'),
src('SRC_ERFURT_ARCHIVE','Landratsamt Erfurt – storia del fondo','Archivportal Thüringen / Landesarchiv Thüringen','modern','archival_catalog','https://www.archive-in-thueringen.de/de/findbuch/view/bestand/21334/vorwort/1','archive_terms','high',False,'La descrizione archivistica qualifica Erfurt 1806-1813 come domaine réservée à l’empereur di Napoleone.'),
src('SRC_OHM_ELBE','Département des Bouches-de-l’Elbe (relation 2750735)','OpenHistoricalMap','modern','gis_dataset','https://www.openhistoricalmap.org/relation/2750735','CC0_default_with_item_exceptions','medium',True,'Il record OHM contiene un fixme che richiede fonti per alcune linee di confine; non viene usato per promuovere geometrie a certezza alta.'),
src('SRC_UK_CONTEXT','Europe 1812 general political configuration','IEG / Fondation Napoléon','1812','modern_cartographic_reconstruction','https://www.ieg-maps.uni-mainz.de/mapsp/mappEu812Serie1_Napo.htm','CC BY-NC 4.0','high')
]
source_ids={x['source_id'] for x in sources}
dump(D/'sources.json',{'schema_version':SCHEMA_VERSION,'snapshot_id':SNAPSHOT_ID,'sources':sources})

# -------------------------- persons --------------------------
def person(i,name,birth=None,death=None,aliases=None,sids=None):
    return {'id':i,'name':name,'birth':birth,'death':death,'aliases':aliases or [],'sources':[{'source_id':s,'supports':['identity']} for s in (sids or [])]}

persons=[]
def P(*args,**kwargs):
    p=person(*args,**kwargs); persons.append(p); return p['id']

P('P_NAPOLEON_I','Napoleone Bonaparte','1769-08-15','1821-05-05',['Napoleone I'],['SRC_DUSSELDORF_BERG'])
P('P_JOSEPH_BONAPARTE','Giuseppe Bonaparte','1768-01-07','1844-07-28',['Giuseppe I di Spagna'],['SRC_FN_1812'])
P('P_JEROME_BONAPARTE','Girolamo Bonaparte','1784-11-15','1860-06-24',['Jérôme Bonaparte'],['SRC_FN_1812'])
P('P_EUGENE_BEAUHARNAIS','Eugenio di Beauharnais','1781-09-03','1824-02-21',['Eugène de Beauharnais'],['SRC_FN_1812'])
P('P_MURAT','Gioacchino Murat','1767-03-25','1815-10-13',['Joachim Murat'],['SRC_DUSSELDORF_BERG'])
P('P_FRANCIS_I_AUSTRIA','Francesco I d’Austria','1768-02-12','1835-03-02',['Francesco II del Sacro Romano Impero'],['SRC_IEG_1812'])
P('P_MARIE_LOUISE','Maria Luisa d’Austria','1791-12-12','1847-12-17',['Marie-Louise'],['SRC_DUSSELDORF_BERG'])
P('P_FREDERICK_WILLIAM_III','Federico Guglielmo III di Prussia','1770-08-03','1840-06-07',[],['SRC_IEG_1812'])
P('P_ALEXANDER_I','Alessandro I di Russia','1777-12-23','1825-12-01',[],['SRC_FINLAND_GOV'])
P('P_FREDERICK_AUGUSTUS_I','Federico Augusto I di Sassonia','1750-12-23','1827-05-05',[],['SRC_RH_ACCESSIONS'])
P('P_MAXIMILIAN_I_JOSEPH','Massimiliano I Giuseppe di Baviera','1756-05-27','1825-10-13',[],['SRC_RH_ACT_1806'])
P('P_FERDINAND_VII','Ferdinando VII di Spagna','1784-10-14','1833-09-29',[],['SRC_CONGRESO_1812'])
P('P_CHARLES_XIII_SWEDEN','Carlo XIII di Svezia','1748-10-07','1818-02-05',[],['SRC_IEG_1812'])
P('P_BERNADOTTE','Jean-Baptiste Bernadotte','1763-01-26','1844-03-08',['Carlo Giovanni, principe ereditario di Svezia'],['SRC_FN_RUSSIA_1812'])
P('P_FREDERICK_VI_DENMARK','Federico VI di Danimarca','1768-01-28','1839-12-03',[],['SRC_IEG_1812'])
P('P_GEORGE_III','Giorgio III del Regno Unito','1738-06-04','1820-01-29',[],['SRC_IEG_1812'])
P('P_GEORGE_PRINCE_REGENT','Giorgio, Principe Reggente','1762-08-12','1830-06-26',['futuro Giorgio IV'],['SRC_IEG_1812'])
P('P_JOAO_PORTUGAL','Giovanni, Principe Reggente del Portogallo','1767-05-13','1826-03-10',['futuro Giovanni VI'],['SRC_IEG_1812'])
P('P_MARIA_I_PORTUGAL','Maria I del Portogallo','1734-12-17','1816-03-20',[],['SRC_IEG_1812'])
P('P_FERDINAND_SICILY','Ferdinando III di Sicilia','1751-01-12','1825-01-04',['Ferdinando IV di Napoli'],['SRC_IEG_1812'])
P('P_VICTOR_EMMANUEL_I','Vittorio Emanuele I di Sardegna','1759-07-24','1824-01-10',[],['SRC_IEG_1812'])
P('P_MAHMUD_II','Mahmud II','1785-07-20','1839-07-01',[],['SRC_BUCHAREST_MWNF'])
P('P_BERTHIER','Louis-Alexandre Berthier','1753-11-20','1815-06-01',[],['SRC_FN_1812'])
P('P_ELISA_BONAPARTE','Elisa Bonaparte','1777-01-03','1820-08-07',[],['SRC_LUCCA_ARCHIVE'])
P('P_FELICE_BACIOCCHI','Felice Baciocchi','1762-05-18','1841-04-27',[],['SRC_LUCCA_ARCHIVE'])
P('P_TALLEYRAND','Charles-Maurice de Talleyrand-Périgord','1754-02-02','1838-05-17',[],['SRC_FN_1812'])
P('P_PIUS_VII','Pio VII','1742-08-14','1823-08-20',[],['SRC_FN_DEPARTMENTS'])
P('P_DECAEN','Charles Mathieu Isidore Decaen','1769-04-13','1832-09-09',[],['SRC_FN_CATALONIA_1812'])
# Rheinbund rulers
rulers=[
('P_FREDERICK_I_WURT','Federico I di Württemberg',None,None),('P_CHARLES_BADEN','Carlo di Baden',None,None),('P_LOUIS_I_HESSE','Luigi I d’Assia-Darmstadt',None,None),
('P_FREDERICK_FRANCIS_I','Federico Francesco I di Meclemburgo-Schwerin',None,None),('P_CHARLES_II_MECK_STRELITZ','Carlo II di Meclemburgo-Strelitz','1741','1816'),
('P_KARL_AUGUST_WEIMAR','Carlo Augusto di Sassonia-Weimar-Eisenach','1757','1828'),('P_AUGUST_GOTHA','Augusto di Sassonia-Gotha-Altenburg','1772','1822'),
('P_FREDERICK_HILDBURG','Federico di Sassonia-Hildburghausen','1763','1834'),('P_BERNHARD_II_MEININGEN','Bernardo II di Sassonia-Meiningen',None,None),
('P_LUISE_ELEONORE_MEININGEN','Luisa Eleonora di Sassonia-Meiningen','1763','1837'),('P_ERNST_I_COBURG','Ernesto I di Sassonia-Coburgo-Saalfeld','1784','1844'),
('P_ALEXIUS_ANHALT_BERN','Alessio Federico Cristiano di Anhalt-Bernburg','1767','1834'),('P_LEOPOLD_III_DESSAU','Leopoldo III Federico Francesco di Anhalt-Dessau','1740','1817'),
('P_LUDWIG_AUGUST_KOTHEN','Luigi Augusto di Anhalt-Köthen',None,None),('P_FRIEDRICH_HOH_HECH','Federico Ermanno Ottone di Hohenzollern-Hechingen',None,None),
('P_ANTON_ALOYS_HOH_SIG','Antonio Aloisio di Hohenzollern-Sigmaringen',None,None),('P_FRED_AUG_NASSAU','Federico Augusto di Nassau-Usingen',None,None),
('P_FRED_WILL_NASSAU','Federico Guglielmo di Nassau-Weilburg',None,None),('P_JOHANN_I_LIECH','Giovanni I Giuseppe del Liechtenstein',None,None),
('P_GUNTHER_SOND','Günther Federico Carlo I di Schwarzburg-Sondershausen','1760','1837'),('P_FRIEDRICH_GUNTHER_RUD','Federico Günther di Schwarzburg-Rudolstadt',None,None),
('P_FRIEDRICH_WALDECK','Federico Carlo Augusto di Waldeck','1743','1812'),('P_CARL_ISENBURG','Carlo Federico di Isenburg',None,None),
('P_HEINRICH_XIII_GREIZ','Enrico XIII di Reuss-Greiz','1747','1817'),('P_HEINRICH_XLII_SCHLEIZ','Enrico XLII di Reuss-Schleiz','1752','1818'),
('P_HEINRICH_LIV_LOBENSTEIN','Enrico LIV di Reuss-Lobenstein','1767','1824'),('P_HEINRICH_LI_EBERSDORF','Enrico LI di Reuss-Ebersdorf','1761','1822'),
('P_PHILIPP_FRANZ_LEYEN','Filippo Francesco von der Leyen',None,None),('P_LEOPOLD_II_LIPPE','Leopoldo II di Lippe',None,None),('P_PAULINE_LIPPE','Paolina di Lippe','1769','1820'),
('P_GEORG_WILHELM_SCHAUM','Giorgio Guglielmo di Schaumburg-Lippe','1784','1860'),('P_DALBERG','Karl Theodor von Dalberg',None,None),
('P_NAPOLEON_LOUIS_BERG','Napoléon Louis Bonaparte','1804-12-18','1831-03-17'),('P_FERDINAND_WURZBURG','Ferdinando di Würzburg',None,None),
('P_GEORG_I_PYRMONT','Giorgio I di Pyrmont',None,'1813'),
]
for i,n,b,d in rulers: P(i,n,b,d,[],['SRC_RH_ACCESSIONS'] if i not in ('P_NAPOLEON_LOUIS_BERG',) else ['SRC_DUSSELDORF_BERG'])
P('P_BISHOP_URGELL_1812','Francesc Antoni de la Dueña y Cisneros',None,'1821-11-08',[],['SRC_ANDORRA_1806'])
P('P_PETER_BURCKHARDT','Peter Burckhardt',None,None,[],['SRC_SWISS_ARCHIVES'])
P('P_KARADORDE','Karađorđe Petrović','1768','1817',[],['SRC_SERBIA_MFA'])

person_ids={p['id'] for p in persons}
dump(D/'persons.json',{'schema_version':SCHEMA_VERSION,'snapshot_id':SNAPSHOT_ID,'persons':persons})

# -------------------------- entity helpers --------------------------
entities=[]
def slinks(*sids, supports=None):
    supports=supports or ['identity','status_at_snapshot']
    return [{'source_id':s,'supports':supports} for s in sids]

def ent(i,name,original=None,cls='state',form='not_applicable',vf=None,vt=None,precision='year',display='europe',spatial='direct_area',record_nature='contemporary_political_entity',capital=None,holders=None,sovereignty='full',sovereignty_holders=None,sovereignty_persons=None,suzerains=None,claimants=None,control='full',controllers=None,competing=None,integration=None,alignment='neutral',dependence='none',coercion='none',war='not_at_war_with_france',sources_=None,issues=None,notes='',aliases=None):
    holders=holders or []
    cap=[]
    for c in (capital or []):
        if isinstance(c,str): cap.append({'name':c,'role':'capital','valid_from':None,'valid_to':None})
        else: cap.append(c)
    e={
      'schema_version':SCHEMA_VERSION,'snapshot_id':SNAPSHOT_ID,'as_of':AS_OF,'id':i,
      'names':{'it':name,'original':original or name,'short':name,'aliases':aliases or []},
      'entity_class':cls,'constitutional_form':form,'record_nature':record_nature,
      'validity':{'from':vf,'to':vt,'date_precision':precision},'display_level':display,'spatial_mode':spatial,
      'capital':cap,
      'office_holders':[{'person_id':pid,'office':office,'role':role,'valid_from':fr,'valid_to':to} for pid,office,role,fr,to in holders],
      'sovereignty':{'status':sovereignty,'holder_ids':sovereignty_holders if sovereignty_holders is not None else ([i] if sovereignty=='full' else []),'holder_person_ids':sovereignty_persons or [],'suzerain_ids':suzerains or [],'competing_claimant_ids':claimants or [],'basis_relation_ids':[]},
      'effective_control':{'status':control,'primary_controller_ids':controllers if controllers is not None else ([i] if control in ('full','predominant') else []),'competing_controller_ids':competing or [],'spatial_assertion_ids':[]},
      'institutional_memberships':[],
      'napoleonic_relation':{'integration_modes':integration or ['outside_system'],'alignment':alignment,'dependence_level':dependence,'coercion_level':coercion,'war_status':war},
      'relations':[],'territorial_components':[],'issue_ids':issues or [],
      'certainty':{'overall':'high','fields':{}},'sources':sources_ or slinks('SRC_IEG_1812'),'notes':notes
    }
    entities.append(e); return e

def get_e(i): return next(e for e in entities if e['id']==i)

# Main European political entities
ent('FRA_EMPIRE','Impero francese','Empire français','state','empire','1804-05-18','1814-04','month','europe','direct_area',capital=['Parigi'],holders=[('P_NAPOLEON_I','Imperatore dei Francesi','sovereign','1804-05-18',None)],integration=['system_center'],alignment='napoleonic_system',sources_=slinks('SRC_IEG_1812','SRC_FN_1812','SRC_FN_DEPARTMENTS'))
ent('ITA_KINGDOM','Regno d’Italia','Regno d’Italia','state','kingdom','1805-03-17','1814','year','europe','direct_area',capital=['Milano'],holders=[('P_NAPOLEON_I','Re d’Italia','sovereign','1805-03-17',None),('P_EUGENE_BEAUHARNAIS','Viceré d’Italia','viceroy','1805',None)],integration=['personal_union_napoleonic_crown'],alignment='napoleonic_system',dependence='high',sources_=slinks('SRC_IEG_1812','SRC_FN_1812'))
ent('NAP_KINGDOM','Regno di Napoli','Regno di Napoli','state','kingdom','1806','1815','year','europe','direct_area',capital=['Napoli'],holders=[('P_MURAT','Re di Napoli','sovereign','1808',None)],integration=['dynastic_client'],alignment='napoleonic_system',dependence='high',sources_=slinks('SRC_IEG_1812','SRC_FN_1812'))
ent('ESP_JOSEPH','Monarchia spagnola di Giuseppe I','Reino de España','state','kingdom','1808','1813','year','europe','overlap_layer',record_nature='contemporary_political_entity',capital=[{'name':'Madrid','role':'royal_capital','valid_from':None,'valid_to':None}],holders=[('P_JOSEPH_BONAPARTE','Re Giuseppe I','sovereign','1808',None)],sovereignty='contested',sovereignty_holders=['ESP_JOSEPH'],claimants=['ESP_CADIZ'],control='fragmented',controllers=['ESP_JOSEPH'],competing=['FRA_EMPIRE','ESP_CADIZ','UK','POR_KINGDOM'],integration=['dynastic_client'],alignment='napoleonic_system',dependence='high',coercion='structural_constraint',war='internal_conflict_with_french_forces',sources_=slinks('SRC_IEG_1812','SRC_CONGRESO_1812','SRC_FN_CATALONIA_1812'),issues=['PRB_SPAIN_CONTROL'])
ent('ESP_CADIZ','Reggenza e Cortes della monarchia di Ferdinando VII','Monarquía española representada por la Regencia y las Cortes de Cádiz','claimant_government','kingdom','1810','1814','year','europe','overlap_layer','claimant_structure',capital=[{'name':'Cadice','role':'government_seat','valid_from':None,'valid_to':None}],holders=[('P_FERDINAND_VII','Re riconosciuto dalla Costituzione di Cadice','sovereign',None,None)],sovereignty='contested',sovereignty_holders=['ESP_CADIZ'],claimants=['ESP_JOSEPH'],control='fragmented',controllers=['ESP_CADIZ'],competing=['ESP_JOSEPH','FRA_EMPIRE'],integration=['outside_system'],alignment='anti_french',war='at_war_with_france',sources_=slinks('SRC_CONGRESO_1812'),issues=['PRB_SPAIN_CONTROL'])
ent('CONF_RHINE','Confederazione del Reno','Rheinbund','confederation','confederation','1806-07-12','1813','year','europe','derived_area',sovereignty='not_applicable',sovereignty_holders=[],control='not_applicable',controllers=[],integration=['client_state'],alignment='napoleonic_system',dependence='high',coercion='structural_constraint',sources_=slinks('SRC_RH_ACT_1806','SRC_RH_LANCIZOLLE_1830'),issues=['PRB_RHINE_COUNT'])
ent('WARSAW_GD','Granducato di Varsavia','Księstwo Warszawskie','state','grand_duchy','1807-07','1813','month','europe','direct_area',capital=['Varsavia'],holders=[('P_FREDERICK_AUGUSTUS_I','Duca di Varsavia','sovereign','1807',None)],integration=['client_state'],alignment='napoleonic_system',dependence='high',coercion='structural_constraint',sources_=slinks('SRC_IEG_1812','SRC_FN_1812'))
ent('DANZIG_FREE','Città libera di Danzica','Freie Stadt Danzig','state','free_city','1807','1814','year','regional','direct_area',capital=['Danzica'],integration=['client_state'],alignment='napoleonic_system',dependence='high',coercion='structural_constraint',sources_=slinks('SRC_IEG_1812','SRC_FN_1812'))
ent('SWISS_CONF','Confederazione svizzera dell’Atto di Mediazione','Schweizerische Eidgenossenschaft','confederation','confederation','1803','1813','year','europe','derived_area',sovereignty='not_applicable',sovereignty_holders=[],control='not_applicable',controllers=[],integration=['mediated_state'],alignment='france_aligned',dependence='substantial',coercion='structural_constraint',sources_=slinks('SRC_SWISS_ARCHIVES','SRC_ACT_MEDIATION'))
ent('AUT_EMPIRE','Impero austriaco','Kaisertum Österreich','state','empire','1804','1867','year','europe','direct_area',capital=['Vienna'],holders=[('P_FRANCIS_I_AUSTRIA','Imperatore d’Austria','sovereign','1804',None)],integration=['treaty_ally'],alignment='france_aligned',dependence='limited',coercion='structural_constraint',sources_=slinks('SRC_IEG_1812','SRC_FN_RUSSIA_1812'))
ent('PRU_KINGDOM','Regno di Prussia','Königreich Preußen','state','kingdom','1701',None,'year','europe','direct_area',capital=['Berlino'],holders=[('P_FREDERICK_WILLIAM_III','Re di Prussia','sovereign',None,None)],integration=['coerced_treaty_ally'],alignment='coerced_france_aligned',dependence='substantial',coercion='military_compulsion',sources_=slinks('SRC_IEG_1812','SRC_FN_RUSSIA_1812'))
ent('RUS_EMPIRE','Impero russo','Российская империя','state','empire','1721','1917','year','europe','direct_area',capital=['San Pietroburgo'],holders=[('P_ALEXANDER_I','Imperatore di Russia','sovereign',None,None)],integration=['outside_system'],alignment='anti_french',war='prewar_adversary',sources_=slinks('SRC_IEG_1812','SRC_FN_RUSSIA_1812','SRC_FN_RUSSIA_CHRONO'))
ent('UK','Regno Unito di Gran Bretagna e Irlanda','United Kingdom of Great Britain and Ireland','state','kingdom','1801',None,'year','europe','direct_area',capital=['Londra'],holders=[('P_GEORGE_III','Re','sovereign',None,None),('P_GEORGE_PRINCE_REGENT','Principe Reggente','prince_regent','1811',None)],integration=['outside_system'],alignment='anti_french',war='at_war_with_france',sources_=slinks('SRC_IEG_1812'))
ent('SWE_KINGDOM','Regno di Svezia','Konungariket Sverige','state','kingdom',None,None,'unknown','europe','direct_area',capital=['Stoccolma'],holders=[('P_CHARLES_XIII_SWEDEN','Re di Svezia','sovereign','1809',None),('P_BERNADOTTE','Principe ereditario e guida politica','head_of_government','1810',None)],integration=['outside_system'],alignment='anti_french',war='not_at_war_with_france',sources_=slinks('SRC_IEG_1812','SRC_FN_RUSSIA_1812'))
ent('DEN_NOR','Monarchia Danimarca-Norvegia','Danmark-Norge','state','kingdom',None,'1814','year','europe','derived_area',capital=['Copenaghen'],holders=[('P_FREDERICK_VI_DENMARK','Re','sovereign',None,None)],integration=['treaty_ally'],alignment='france_aligned',dependence='limited',coercion='diplomatic_pressure',sources_=slinks('SRC_IEG_1812'))
ent('POR_KINGDOM','Regno del Portogallo','Reino de Portugal','state','kingdom',None,None,'unknown','europe','direct_area',capital=[{'name':'Lisbona','role':'government_seat','valid_from':None,'valid_to':None}],holders=[('P_MARIA_I_PORTUGAL','Regina','sovereign',None,None),('P_JOAO_PORTUGAL','Principe Reggente','prince_regent',None,None)],control='predominant',controllers=['POR_KINGDOM'],competing=['UK'],integration=['outside_system'],alignment='anti_french',war='at_war_with_france',sources_=slinks('SRC_IEG_1812'))
ent('SIC_KINGDOM','Regno di Sicilia','Regno di Sicilia','state','kingdom',None,'1816','year','europe','direct_area',capital=['Palermo'],holders=[('P_FERDINAND_SICILY','Re di Sicilia','sovereign',None,None)],integration=['outside_system'],alignment='anti_french',war='at_war_with_france',sources_=slinks('SRC_IEG_1812'))
ent('SAR_KINGDOM','Regno di Sardegna','Regno di Sardegna','state','kingdom',None,None,'unknown','europe','direct_area',capital=['Cagliari'],holders=[('P_VICTOR_EMMANUEL_I','Re di Sardegna','sovereign',None,None)],integration=['outside_system'],alignment='anti_french',war='at_war_with_france',sources_=slinks('SRC_IEG_1812'))
ent('OTT_EMPIRE','Impero ottomano','Devlet-i ʿAlīye-i ʿOsmānīye','state','empire',None,None,'unknown','europe','direct_area',capital=['Costantinopoli'],holders=[('P_MAHMUD_II','Sultano','sovereign',None,None)],control='predominant',controllers=['OTT_EMPIRE'],integration=['outside_system'],alignment='neutral',war='not_at_war_with_france',sources_=slinks('SRC_IEG_1812','SRC_BUCHAREST_MWNF'))
ent('NEUCHATEL','Principato di Neuchâtel','Principauté de Neuchâtel','state','principality','1806','1814','year','regional','direct_area',capital=['Neuchâtel'],holders=[('P_BERTHIER','Principe di Neuchâtel','sovereign','1806',None)],integration=['client_state'],alignment='napoleonic_system',dependence='high',sources_=slinks('SRC_IEG_1812','SRC_FN_1812'))
ent('LUCCA_PIOMBINO','Principato di Lucca e Piombino','Principato di Lucca e Piombino','state','principality','1805','1814','year','regional','direct_area',capital=['Lucca'],holders=[('P_ELISA_BONAPARTE','Principessa','sovereign','1805',None),('P_FELICE_BACIOCCHI','Principe','co_sovereign','1805',None)],integration=['dynastic_client'],alignment='napoleonic_system',dependence='high',sources_=slinks('SRC_LUCCA_ARCHIVE'),issues=['PRB_LUCCA_SOURCE'])
ent('BENEVENTO','Principato di Benevento','Principauté de Bénévent','state','principality','1806','1814','year','local','direct_area',capital=['Benevento'],holders=[('P_TALLEYRAND','Principe di Benevento','sovereign','1806',None)],integration=['imperial_fief'],alignment='napoleonic_system',dependence='high',sources_=slinks('SRC_FN_1812'))
ent('PONTECORVO','Principato di Pontecorvo','Principauté de Pontecorvo','territorial_unit','principality','1806','1815','year','local','direct_area',sovereignty='indeterminate',sovereignty_holders=[],control='predominant',controllers=['NAP_KINGDOM'],integration=['imperial_fief'],alignment='napoleonic_system',dependence='high',sources_=slinks('SRC_PONTECORVO_AN'),issues=['PRB_PONTECORVO_RULER'])
ent('ANDORRA','Valli d’Andorra','Valls d’Andorra','state','co_principality',None,None,'unknown','local','overlap_layer',capital=[{'name':'Andorra la Vella','role':'government_seat','valid_from':None,'valid_to':None}],sovereignty='contested',sovereignty_holders=['ANDORRA'],sovereignty_persons=['P_NAPOLEON_I','P_BISHOP_URGELL_1812'],claimants=['FRA_EMPIRE'],control='predominant',controllers=['ANDORRA'],competing=['FRA_EMPIRE'],integration=['special_french_administration'],alignment='internally_divided',dependence='direct',coercion='occupation',war='occupied_not_belligerent',sources_=slinks('SRC_ANDORRA_1806','SRC_ANDORRA_1812_STUDY','SRC_CATALONIA_ATLAS'),issues=['PRB_ANDORRA_1812'],notes='La piena implementazione dell’inclusione nel Département du Sègre è controversa; il record conserva continuità locale e pretesa amministrativa francese separatamente.')
ent('SAN_MARINO','Repubblica di San Marino','Repubblica di San Marino','state','republic',None,None,'unknown','local','direct_area',capital=['San Marino'],integration=['outside_system'],alignment='neutral',sources_=slinks('SRC_SANMARINO_HISTORY'))
ent('COSPAIA_LOCAL','Cospaia','Cospaia','territorial_unit','not_applicable',None,None,'unknown','local','direct_area','historical_locality',sovereignty='no_separate_sovereignty',sovereignty_holders=['FRA_EMPIRE'],control='predominant',controllers=['FRA_EMPIRE'],integration=['direct_annexation'],alignment='napoleonic_system',dependence='direct',sources_=slinks('SRC_COSPAIA_ARCHIVE'),issues=['PRB_COSPAIA_1812'],notes='Conservata come località storicamente significativa; non modellata come repubblica indipendente nello snapshot 1812.')
ent('HOLY_SEE','Santa Sede – pretesa temporale','Sancta Sedes','sovereign_institution','not_applicable',None,None,'unknown','regional','nonspatial','claimant_structure',holders=[('P_PIUS_VII','Papa','sovereign',None,None)],sovereignty='not_applicable',sovereignty_holders=[],control='none',controllers=[],integration=['outside_system'],alignment='anti_french',war='occupied_not_belligerent',sources_=slinks('SRC_FN_DEPARTMENTS'),issues=['PRB_PAPAL_CLAIM'])
ent('HANOVER_CLAIM','Elettorato di Hannover – continuità dinastica in esilio','Kurfürstentum Hannover','claimant_government','not_applicable',None,None,'unknown','regional','nonspatial','claimant_structure',holders=[('P_GEORGE_III','Elettore di Hannover','sovereign',None,None)],sovereignty='contested',sovereignty_holders=['HANOVER_CLAIM'],control='none',controllers=[],integration=['outside_system'],alignment='anti_french',war='at_war_with_france',sources_=slinks('SRC_IEG_1812','SRC_HANOVER_NLA'),issues=['PRB_HANOVER_SOURCE'])

# 34 Rheinbund member states at snapshot (legal/political members)
rhein_specs=[
('BAV_KINGDOM','Regno di Baviera','Königreich Bayern','kingdom','Monaco','P_MAXIMILIAN_I_JOSEPH','Re','1806-07-12','europe'),
('WUR_KINGDOM','Regno di Württemberg','Königreich Württemberg','kingdom','Stoccarda','P_FREDERICK_I_WURT','Re','1806-07-12','europe'),
('SAX_KINGDOM','Regno di Sassonia','Königreich Sachsen','kingdom','Dresda','P_FREDERICK_AUGUSTUS_I','Re','1806-12-11','europe'),
('WEST_KINGDOM','Regno di Westfalia','Königreich Westphalen','kingdom','Kassel','P_JEROME_BONAPARTE','Re','1807-11-15','europe'),
('FRANKFURT_GD','Granducato di Francoforte','Großherzogtum Frankfurt','grand_duchy','Aschaffenburg','P_DALBERG','Granduca','1810','regional'),
('BAD_GD','Granducato di Baden','Großherzogtum Baden','grand_duchy','Karlsruhe','P_CHARLES_BADEN','Granduca','1806-07-12','europe'),
('HES_GD','Granducato d’Assia-Darmstadt','Großherzogtum Hessen','grand_duchy','Darmstadt','P_LOUIS_I_HESSE','Granduca','1806-07-12','europe'),
('BERG_GD','Granducato di Berg','Großherzogtum Berg','grand_duchy','Düsseldorf','P_NAPOLEON_LOUIS_BERG','Granduca nominale','1806-07-12','europe'),
('WURZBURG_GD','Granducato di Würzburg','Großherzogtum Würzburg','grand_duchy','Würzburg','P_FERDINAND_WURZBURG','Granduca','1806-09-23','regional'),
('NASSAU_DUCHY','Ducato di Nassau','Herzogtum Nassau','duchy','Wiesbaden','P_FRED_AUG_NASSAU','Duca/co-reggente','1806-07-12','regional'),
('ANH_BERN','Ducato di Anhalt-Bernburg','Herzogtum Anhalt-Bernburg','duchy','Bernburg','P_ALEXIUS_ANHALT_BERN','Duca','1807-04-18','regional'),
('ANH_KOTH','Ducato di Anhalt-Köthen','Herzogtum Anhalt-Köthen','duchy','Köthen','P_LUDWIG_AUGUST_KOTHEN','Duca minorenne','1807-04-18','regional'),
('ANH_DESS','Ducato di Anhalt-Dessau','Herzogtum Anhalt-Dessau','duchy','Dessau','P_LEOPOLD_III_DESSAU','Duca','1807-04-18','regional'),
('MECK_SCH','Ducato di Meclemburgo-Schwerin','Herzogtum Mecklenburg-Schwerin','duchy','Schwerin','P_FREDERICK_FRANCIS_I','Duca','1808-03-22','regional'),
('MECK_STR','Ducato di Meclemburgo-Strelitz','Herzogtum Mecklenburg-Strelitz','duchy','Neustrelitz','P_CHARLES_II_MECK_STRELITZ','Duca','1808-02-18','regional'),
('SAX_WEIMAR','Ducato di Sassonia-Weimar-Eisenach','Herzogtum Sachsen-Weimar-Eisenach','duchy','Weimar','P_KARL_AUGUST_WEIMAR','Duca','1806-12-15','regional'),
('SAX_GOTHA','Ducato di Sassonia-Gotha-Altenburg','Herzogtum Sachsen-Gotha-Altenburg','duchy','Gotha','P_AUGUST_GOTHA','Duca','1806-12-15','regional'),
('SAX_MEIN','Ducato di Sassonia-Meiningen','Herzogtum Sachsen-Meiningen','duchy','Meiningen','P_BERNHARD_II_MEININGEN','Duca minorenne','1806-12-15','regional'),
('SAX_COB','Ducato di Sassonia-Coburgo-Saalfeld','Herzogtum Sachsen-Coburg-Saalfeld','duchy','Coburgo','P_ERNST_I_COBURG','Duca','1806-12-15','regional'),
('SAX_HILD','Ducato di Sassonia-Hildburghausen','Herzogtum Sachsen-Hildburghausen','duchy','Hildburghausen','P_FREDERICK_HILDBURG','Duca','1806-12-15','regional'),
('HOH_HECH','Principato di Hohenzollern-Hechingen','Fürstentum Hohenzollern-Hechingen','principality','Hechingen','P_FRIEDRICH_HOH_HECH','Principe','1806-07-12','local'),
('HOH_SIG','Principato di Hohenzollern-Sigmaringen','Fürstentum Hohenzollern-Sigmaringen','principality','Sigmaringen','P_ANTON_ALOYS_HOH_SIG','Principe','1806-07-12','local'),
('ISENBURG','Principato di Isenburg','Fürstentum Isenburg','principality','Offenbach','P_CARL_ISENBURG','Principe','1806-07-12','local'),
('LIECHTENSTEIN','Principato del Liechtenstein','Fürstentum Liechtenstein','principality','Vaduz','P_JOHANN_I_LIECH','Principe','1806-07-12','local'),
('LEYEN','Principato von der Leyen','Fürstentum von der Leyen','principality','Seelbach','P_PHILIPP_FRANZ_LEYEN','Principe','1806-07-12','local'),
('LIPPE','Principato di Lippe-Detmold','Fürstentum Lippe','principality','Detmold','P_LEOPOLD_II_LIPPE','Principe minorenne','1807-04-18','local'),
('SCHAUM_LIPPE','Principato di Schaumburg-Lippe','Fürstentum Schaumburg-Lippe','principality','Bückeburg','P_GEORG_WILHELM_SCHAUM','Principe','1807-04-18','local'),
('REUSS_GREIZ','Principato di Reuss-Greiz','Fürstentum Reuß-Greiz','principality','Greiz','P_HEINRICH_XIII_GREIZ','Principe','1807-04-18','local'),
('REUSS_SCHLEIZ','Principato di Reuss-Schleiz','Fürstentum Reuß-Schleiz','principality','Schleiz','P_HEINRICH_XLII_SCHLEIZ','Principe','1807-04-18','local'),
('REUSS_LOBENSTEIN','Principato di Reuss-Lobenstein','Fürstentum Reuß-Lobenstein','principality','Lobenstein','P_HEINRICH_LIV_LOBENSTEIN','Principe','1807-04-18','local'),
('REUSS_EBERSDORF','Principato di Reuss-Ebersdorf','Fürstentum Reuß-Ebersdorf','principality','Ebersdorf','P_HEINRICH_LI_EBERSDORF','Principe','1807-04-18','local'),
('WALDECK','Principato di Waldeck','Fürstentum Waldeck','principality','Arolsen','P_FRIEDRICH_WALDECK','Principe','1807-04-18','local'),
('SCHW_RUD','Principato di Schwarzburg-Rudolstadt','Fürstentum Schwarzburg-Rudolstadt','principality','Rudolstadt','P_FRIEDRICH_GUNTHER_RUD','Principe minorenne','1807-04-18','local'),
('SCHW_SOND','Principato di Schwarzburg-Sondershausen','Fürstentum Schwarzburg-Sondershausen','principality','Sondershausen','P_GUNTHER_SOND','Principe','1807-04-18','local')]
for i,n,o,form,cap,pid,office,join,disp in rhein_specs:
    integration=['dynastic_client','confederated_client'] if i in ('WEST_KINGDOM','BERG_GD') else ['confederated_client']
    holders=[(pid,office,'sovereign',None,None)]
    if i=='BERG_GD': holders.append(('P_NAPOLEON_I','Reggente effettivo','regent','1809-03-03',None))
    if i=='NASSAU_DUCHY': holders.append(('P_FRED_WILL_NASSAU','Co-reggente','co_sovereign',None,None))
    if i=='SAX_MEIN': holders.append(('P_LUISE_ELEONORE_MEININGEN','Reggente','regent',None,None))
    if i=='LIPPE': holders.append(('P_PAULINE_LIPPE','Reggente','regent',None,None))
    if i=='ANH_KOTH': holders.append(('P_LEOPOLD_III_DESSAU','Tutore e reggente','regent','1812-05-05',None))
    e=ent(i,n,o,'state',form,None,'1813','year',disp,'direct_area',capital=[cap],holders=holders,integration=integration,alignment='napoleonic_system',dependence='high' if i in ('WEST_KINGDOM','BERG_GD') else 'substantial',coercion='structural_constraint',sources_=slinks('SRC_RH_LANCIZOLLE_1830','SRC_RH_DEMIAN_V1' if form=='kingdom' else 'SRC_RH_DEMIAN_V2','SRC_RH_ACCESSIONS'),issues=['PRB_RHINE_COUNT'] if i in ('REUSS_GREIZ','REUSS_SCHLEIZ','REUSS_LOBENSTEIN','REUSS_EBERSDORF','WALDECK') else [])

# Pyrmont separate from Waldeck at snapshot
ent('PYRMONT','Principato di Pyrmont','Fürstentum Pyrmont','state','principality','1807-04-18',None,'day','local','direct_area',capital=['Pyrmont'],holders=[('P_GEORG_I_PYRMONT','Principe','sovereign','1805',None)],integration=['confederated_client'],alignment='napoleonic_system',dependence='substantial',coercion='structural_constraint',sources_=slinks('SRC_HGIS_WALDECK','SRC_RH_PYRMONT_ACCESSION','SRC_RH_WALDECK_PYRMONT_LWL'),issues=['PRB_WALDECK_PYRMONT'],notes='Pyrmont era statualmente distinto da Waldeck al 1 giugno 1812 e governato da Georg; aderì autonomamente al Rheinbund il 18 aprile 1807. La personal union con Waldeck inizia dopo la morte di Friedrich nel settembre 1812.')

# Swiss 19 cantons
cantons=[('CH_ZURICH','Zurigo'),('CH_BERN','Berna'),('CH_LUCERNE','Lucerna'),('CH_URI','Uri'),('CH_SCHWYZ','Svitto'),('CH_UNTERWALDEN','Untervaldo'),('CH_GLARUS','Glarona'),('CH_ZUG','Zugo'),('CH_FRIBOURG','Friburgo'),('CH_SOLOTHURN','Soletta'),('CH_BASEL','Basilea'),('CH_SCHAFFHAUSEN','Sciaffusa'),('CH_APPENZELL','Appenzello'),('CH_ST_GALLEN','San Gallo'),('CH_GRAUBUNDEN','Grigioni'),('CH_AARGAU','Argovia'),('CH_THURGAU','Turgovia'),('CH_TICINO','Ticino'),('CH_VAUD','Vaud')]
for i,n in cantons:
    ent(i,n,n,'state','canton','1803','1813','year','regional' if i in ('CH_ZURICH','CH_BERN','CH_LUCERNE','CH_FRIBOURG','CH_BASEL','CH_ST_GALLEN','CH_GRAUBUNDEN','CH_AARGAU','CH_THURGAU','CH_TICINO','CH_VAUD') else 'local','direct_area',sovereignty='full',integration=['mediated_state'],alignment='france_aligned',dependence='limited',coercion='structural_constraint',sources_=slinks('SRC_SWISS_ARCHIVES','SRC_ACT_MEDIATION'))

# French historical-analytical territorial blocks
fblocks=[
('FRA_CORE','Nucleo francese pre-grandi annessioni',None,'historical_analytical_aggregation'),
('FRA_SAVOY_NICE','Savoia e Nizza','1792','historical_analytical_aggregation'),('FRA_BELGIUM','Ex Paesi Bassi austriaci / Belgio','1795','historical_analytical_aggregation'),
('FRA_LEFT_RHINE','Riva sinistra del Reno','1801-03-08','historical_analytical_aggregation'),('FRA_GENEVA','Ginevra / Léman','1798','historical_analytical_aggregation'),
('FRA_PIEDMONT','Piemonte','1802-09-11','historical_analytical_aggregation'),('FRA_LIGURIA','Liguria','1805-06-06','historical_analytical_aggregation'),
('FRA_TUSCANY','Ex Etruria / Toscana','1808','historical_analytical_aggregation'),('FRA_PARMA','Parma e Piacenza','1808','historical_analytical_aggregation'),
('FRA_PAPAL','Roma ed ex Stati pontifici','1809-05-17','historical_analytical_aggregation'),('FRA_HOLLAND','Ex Regno d’Olanda','1810-07-09','historical_analytical_aggregation'),
('FRA_SIMPLON','Vallese / dipartimento del Simplon','1810-11-12','historical_analytical_aggregation'),('FRA_NORTH_GERMANY','Territori anseatici e nord-tedeschi','1810-12-13','historical_analytical_aggregation'),
('FRA_ILLYRIA','Province Illiriche','1809','historical_analytical_aggregation')]
for i,n,vf,rn in fblocks:
    ent(i,n,n,'territorial_unit','not_applicable',vf,'1814','year','regional','direct_area',rn,sovereignty='no_separate_sovereignty',sovereignty_holders=['FRA_EMPIRE'],control='full',controllers=['FRA_EMPIRE'],integration=['direct_annexation'],alignment='napoleonic_system',dependence='direct',coercion='not_applicable',war='not_applicable',sources_=slinks('SRC_FN_DEPARTMENTS','SRC_IEG_1812'),notes='Aggregazione storico-analitica GB-Atlante; non implica che il blocco fosse un singolo ente amministrativo contemporaneo.' if i!='FRA_ILLYRIA' else 'Sovranità imperiale francese, ma regime speciale non dipartimentale.')

# Catalonia and four departments
ent('CAT_SPECIAL','Catalogna sotto amministrazione francese','Catalogne','territorial_unit','not_applicable','1812-01-26','1814','year','regional','overlap_layer','historical_analytical_aggregation',sovereignty='contested',sovereignty_holders=[],claimants=['ESP_JOSEPH','ESP_CADIZ'],control='fragmented',controllers=['FRA_EMPIRE'],competing=['ESP_CADIZ','UK','POR_KINGDOM'],integration=['special_french_administration'],alignment='internally_divided',dependence='direct',coercion='occupation',war='internal_conflict_with_french_forces',sources_=slinks('SRC_FN_CATALONIA_1812','SRC_CONGRESO_1812'),issues=['PRB_CATALONIA_STATUS','PRB_SPAIN_CONTROL'])
for i,n,cap in [('CAT_MONTSERRAT','Dipartimento di Montserrat','Barcellona'),('CAT_BOUCHES_EBRE','Dipartimento delle Bouches-de-l’Èbre','Lleida'),('CAT_TER','Dipartimento del Ter','Girona'),('CAT_SEGRE','Dipartimento del Sègre','Puigcerdà')]:
    ent(i,n,n,'administrative_unit','not_applicable','1812-01-26','1814','year','local','direct_area','administrative_subdivision',capital=[{'name':cap,'role':'administrative_centre','valid_from':'1812-01-26','valid_to':None}],sovereignty='no_separate_sovereignty',sovereignty_holders=[],control='fragmented',controllers=['FRA_EMPIRE'],competing=['ESP_CADIZ'],integration=['special_french_administration'],alignment='napoleonic_system',dependence='direct',coercion='occupation',war='internal_conflict_with_french_forces',sources_=slinks('SRC_FN_CATALONIA_1812'),issues=['PRB_CATALONIA_STATUS'])

# South-eastern Europe
ent('BESSARABIA_TRANSITION','Bessarabia / Moldavia orientale in trasferimento','Bessarabia','territorial_unit','not_applicable','1812-05-28',None,'day','regional','overlap_layer','historical_analytical_aggregation',sovereignty='pending_transfer',sovereignty_holders=['OTT_EMPIRE'],claimants=['RUS_EMPIRE'],control='handover_pending',controllers=['RUS_EMPIRE'],integration=['outside_system'],alignment='neutral',war='not_applicable',sources_=slinks('SRC_BUCHAREST_MWNF','SRC_BUCHAREST_TAKI'),issues=['PRB_BUCHAREST_TRANSITION'])
ent('MOLDAVIA','Principato di Moldavia','Principatul Moldovei','autonomous_polity','principality',None,None,'unknown','regional','direct_area',sovereignty='under_suzerainty',sovereignty_holders=['MOLDAVIA'],suzerains=['OTT_EMPIRE'],control='handover_pending',controllers=['RUS_EMPIRE'],integration=['outside_system'],alignment='neutral',war='not_applicable',sources_=slinks('SRC_BUCHAREST_MWNF','SRC_BUCHAREST_TAKI'),issues=['PRB_BUCHAREST_TRANSITION'])
ent('WALLACHIA','Principato di Valacchia','Țara Românească','autonomous_polity','principality',None,None,'unknown','regional','direct_area',sovereignty='under_suzerainty',sovereignty_holders=['WALLACHIA'],suzerains=['OTT_EMPIRE'],control='handover_pending',controllers=['RUS_EMPIRE'],integration=['outside_system'],alignment='neutral',war='not_applicable',sources_=slinks('SRC_BUCHAREST_MWNF','SRC_BUCHAREST_TAKI'),issues=['PRB_BUCHAREST_TRANSITION'])
ent('SERBIA_INSURGENT','Serbia insorta','Ustanička Srbija','de_facto_polity','principality','1804','1813','year','regional','direct_area',holders=[('P_KARADORDE','Gran Vožd','head_of_government','1804',None)],sovereignty='contested',sovereignty_holders=['SERBIA_INSURGENT'],claimants=['OTT_EMPIRE'],control='predominant',controllers=['SERBIA_INSURGENT'],integration=['outside_system'],alignment='neutral',war='not_applicable',sources_=slinks('SRC_SERBIA_MFA','SRC_BUCHAREST_MWNF'),issues=['PRB_SERBIA_1812'])
ent('MONTENEGRO','Montenegro','Crna Gora','de_facto_polity','principality',None,None,'unknown','regional','direct_area',sovereignty='contested',sovereignty_holders=['MONTENEGRO'],claimants=['OTT_EMPIRE'],control='predominant',controllers=['MONTENEGRO'],integration=['outside_system'],alignment='neutral',war='not_applicable',sources_=slinks('SRC_MONTENEGRO_PRINCETON'),issues=['PRB_MONTENEGRO_STATUS'])

# Mediterranean / Ionians / Malta / Gibraltar
ent('ION_CORFU','Corfù','Corfou','territorial_unit','not_applicable',None,'1814','year','regional','direct_area',sovereignty='indeterminate',sovereignty_holders=[],control='foreign_occupation',controllers=['FRA_EMPIRE'],integration=['military_occupation'],alignment='napoleonic_system',dependence='direct',coercion='occupation',war='occupied_not_belligerent',sources_=slinks('SRC_IONIAN_HOLLAND_1815'),issues=['PRB_IONIAN_SOVEREIGNTY'])
ent('ION_PAXOS','Paxos','Paxos','territorial_unit','not_applicable',None,'1814','year','local','direct_area',sovereignty='indeterminate',sovereignty_holders=[],control='foreign_occupation',controllers=['FRA_EMPIRE'],integration=['military_occupation'],alignment='napoleonic_system',dependence='direct',coercion='occupation',war='occupied_not_belligerent',sources_=slinks('SRC_IONIAN_HOLLAND_1815'),issues=['PRB_IONIAN_SOVEREIGNTY'])
ent('ION_BRIT_GROUP','Isole Ionie sotto controllo britannico','British-held Ionian Islands','territorial_unit','not_applicable','1809','1814','year','regional','derived_area','derived_grouping',sovereignty='indeterminate',sovereignty_holders=[],control='foreign_occupation',controllers=['UK'],integration=['outside_system'],alignment='anti_french',war='occupied_not_belligerent',sources_=slinks('SRC_IONIAN_HOLLAND_1815'),issues=['PRB_IONIAN_SOVEREIGNTY'])
for i,n in [('ION_ZANTE','Zante'),('ION_CEPHALONIA','Cefalonia'),('ION_ITHACA','Itaca'),('ION_SANTA_MAURA','Santa Maura / Leucade'),('ION_CERIGO','Cerigo / Citera')]:
    ent(i,n,n,'territorial_unit','not_applicable','1809' if i!='ION_SANTA_MAURA' else '1810','1814','year','local','direct_area',sovereignty='indeterminate',sovereignty_holders=[],control='foreign_occupation',controllers=['UK'],integration=['outside_system'],alignment='anti_french',war='occupied_not_belligerent',sources_=slinks('SRC_IONIAN_HOLLAND_1815'),issues=['PRB_IONIAN_SOVEREIGNTY'])
ent('MALTA','Malta e dipendenze','Malta','territorial_unit','not_applicable','1800',None,'year','regional','direct_area',sovereignty='indeterminate',sovereignty_holders=['SIC_KINGDOM'],claimants=['UK'],control='foreign_occupation',controllers=['UK'],integration=['outside_system'],alignment='anti_french',war='occupied_not_belligerent',sources_=slinks('SRC_MALTA_UM'),issues=['PRB_MALTA_STATUS'])
ent('GIBRALTAR','Gibilterra','Gibraltar','territorial_unit','not_applicable',None,None,'unknown','local','direct_area',sovereignty='no_separate_sovereignty',sovereignty_holders=['UK'],control='full',controllers=['UK'],integration=['outside_system'],alignment='anti_french',war='not_applicable',sources_=slinks('SRC_IEG_1812'))

# Nordic / peripheral / special units
ent('FIN_GD','Granducato di Finlandia','Suomen suuriruhtinaskunta','autonomous_polity','grand_duchy','1809',None,'year','regional','direct_area',capital=[{'name':'Helsinki','role':'legal_capital','valid_from':'1812','valid_to':None},{'name':'Turku','role':'de_facto_government_seat','valid_from':None,'valid_to':'1819'}],holders=[('P_ALEXANDER_I','Granduca di Finlandia','sovereign','1809',None)],sovereignty='no_separate_sovereignty',sovereignty_holders=['RUS_EMPIRE'],control='full',controllers=['FIN_GD'],integration=['outside_system'],alignment='anti_french',war='not_applicable',sources_=slinks('SRC_FINLAND_1812_HELSINKI','SRC_FINLAND_GOV'))
ent('SWEDISH_POMERANIA','Pomerania svedese','Svenska Pommern','territorial_unit','not_applicable',None,'1815','year','regional','direct_area',sovereignty='no_separate_sovereignty',sovereignty_holders=['SWE_KINGDOM'],control='foreign_occupation',controllers=['FRA_EMPIRE'],integration=['military_occupation'],alignment='anti_french',coercion='occupation',war='occupied_not_belligerent',sources_=slinks('SRC_SWEDISH_POMERANIA_FN','SRC_RH_LANCIZOLLE_1830'))
ent('HELIGOLAND','Helgoland','Helgoland','territorial_unit','not_applicable','1807',None,'year','local','direct_area',sovereignty='indeterminate',sovereignty_holders=['DEN_NOR'],claimants=['UK'],control='foreign_occupation',controllers=['UK'],integration=['outside_system'],alignment='anti_french',war='occupied_not_belligerent',sources_=slinks('SRC_HELGOLAND_LASH'),issues=['PRB_HELGOLAND_TITLE'])
ent('ERFURT_DOMAIN','Principato / dominio imperiale di Erfurt','Fürstentum Erfurt','territorial_unit','principality','1807','1813','year','local','direct_area',sovereignty='no_separate_sovereignty',sovereignty_holders=['FRA_EMPIRE'],sovereignty_persons=['P_NAPOLEON_I'],control='full',controllers=['FRA_EMPIRE'],integration=['imperial_domain'],alignment='napoleonic_system',dependence='direct',sources_=slinks('SRC_RH_LANCIZOLLE_1830','SRC_ERFURT_ARCHIVE'),issues=['PRB_ERFURT_LEGAL_FORM'])
for i,n in [('DENMARK_COMPONENT','Danimarca'),('NORWAY_COMPONENT','Norvegia'),('SCHLESWIG_DUCHY','Ducato di Schleswig'),('HOLSTEIN_DUCHY','Ducato di Holstein'),('ICELAND_COMPONENT','Islanda'),('FAROE_COMPONENT','Isole Fær Øer')]:
    form='duchy' if 'DUCHY' in i else 'not_applicable'
    ent(i,n,n,'territorial_unit',form,None,'1814' if i=='NORWAY_COMPONENT' else None,'unknown','regional' if i not in ('ICELAND_COMPONENT','FAROE_COMPONENT') else 'local','direct_area','historical_analytical_aggregation',sovereignty='no_separate_sovereignty',sovereignty_holders=['DEN_NOR'],control='full',controllers=['DEN_NOR'],integration=['treaty_ally'],alignment='france_aligned',dependence='limited',sources_=slinks('SRC_IEG_1812'))

entity_ids={e['id'] for e in entities}

# -------------------------- relations --------------------------
relations=[]
def rel(i,sub,typ,obj,vf=None,vt=None,prec='unknown',certainty='high',sids=None,qual=None,notes='',issue_ids=None):
    r={'id':i,'snapshot_id':SNAPSHOT_ID,'subject_id':sub,'type':typ,'object_id':obj,'valid_from':vf,'valid_to':vt,'date_precision':prec,'qualifiers':qual or {},'certainty':certainty,'sources':slinks(*(sids or ['SRC_IEG_1812']),supports=['relation']) if sids else slinks('SRC_IEG_1812',supports=['relation']),'issue_ids':issue_ids or [],'notes':notes}
    relations.append(r); return r
# Rhein memberships + obligations
for e in rhein_specs:
    i=e[0]; join=e[7]
    rel(f'REL_{i}_RHINE',i,'member_of','CONF_RHINE',join,None,'day' if re.match(r'^\d{4}-\d{2}-\d{2}$',join or '') else 'year','high',['SRC_RH_LANCIZOLLE_1830','SRC_RH_ACCESSIONS'],issue_ids=['PRB_RHINE_COUNT'] if i.startswith('REUSS_') else [])
    rel(f'REL_{i}_FR_MILOB',i,'military_obligation_to','FRA_EMPIRE',join,None,'year','high',['SRC_RH_ACT_1806','SRC_RH_DEMIAN_V1' if e[3]=='kingdom' else 'SRC_RH_DEMIAN_V2'])
# Swiss canton membership
for i,_ in cantons:
    rel(f'REL_{i}_SWISS',i,'member_of','SWISS_CONF','1803',None,'year','high',['SRC_ACT_MEDIATION','SRC_SWISS_ARCHIVES'])
# structural political relations
rel('REL_FR_ITALY_UNION','FRA_EMPIRE','personal_union_with','ITA_KINGDOM','1805-03-17',None,'day','high',['SRC_FN_1812'],{'ruler_person_id':'P_NAPOLEON_I'})
rel('REL_SAX_WARSAW_UNION','SAX_KINGDOM','personal_union_with','WARSAW_GD','1807',None,'year','high',['SRC_IEG_1812'],{'ruler_person_id':'P_FREDERICK_AUGUSTUS_I'})
rel('REL_FR_AUT_ALLIANCE','FRA_EMPIRE','military_alliance_with','AUT_EMPIRE','1812-03-14',None,'day','high',['SRC_FN_RUSSIA_1812'])
rel('REL_FR_PRU_ALLIANCE','FRA_EMPIRE','military_alliance_with','PRU_KINGDOM','1812-02-24',None,'day','high',['SRC_FN_RUSSIA_1812'])
rel('REL_FR_AUT_DYNASTIC','FRA_EMPIRE','dynastic_marriage_link_with','AUT_EMPIRE','1810-04-01',None,'day','high',['SRC_DUSSELDORF_BERG'],{'person_ids':['P_NAPOLEON_I','P_MARIE_LOUISE']})
rel('REL_FIN_RUS_AUTONOMY','FIN_GD','autonomous_within','RUS_EMPIRE','1809',None,'year','high',['SRC_FINLAND_GOV','SRC_FINLAND_1812_HELSINKI'])
rel('REL_MOLDAVIA_OTTOMAN','MOLDAVIA','vassal_of','OTT_EMPIRE',None,None,'unknown','high',['SRC_BUCHAREST_TAKI'])
rel('REL_WALLACHIA_OTTOMAN','WALLACHIA','vassal_of','OTT_EMPIRE',None,None,'unknown','high',['SRC_BUCHAREST_TAKI'])
rel('REL_MOLDAVIA_RUS_OCC','MOLDAVIA','occupied_by','RUS_EMPIRE','1806',None,'year','high',['SRC_BUCHAREST_TAKI'])
rel('REL_WALLACHIA_RUS_OCC','WALLACHIA','occupied_by','RUS_EMPIRE','1806',None,'year','high',['SRC_BUCHAREST_TAKI'])
rel('REL_BESSARABIA_TRANSFER','BESSARABIA_TRANSITION','transfer_agreed_to','RUS_EMPIRE','1812-05-28',None,'day','high',['SRC_BUCHAREST_MWNF'],issue_ids=['PRB_BUCHAREST_TRANSITION'])
rel('REL_OTT_SERBIA_CLAIM','OTT_EMPIRE','claims_sovereignty_over','SERBIA_INSURGENT',None,None,'unknown','high',['SRC_SERBIA_MFA'])
rel('REL_OTT_MONTENEGRO_CLAIM','OTT_EMPIRE','claims_sovereignty_over','MONTENEGRO',None,None,'unknown','medium',['SRC_MONTENEGRO_PRINCETON'],issue_ids=['PRB_MONTENEGRO_STATUS'])
rel('REL_SWISS_FR_MEDIATION','SWISS_CONF','mediated_by','FRA_EMPIRE','1803',None,'year','high',['SRC_SWISS_ARCHIVES'])
rel('REL_WARSAW_FR_PROT','WARSAW_GD','protected_by','FRA_EMPIRE','1807',None,'year','high',['SRC_FN_1812'])
rel('REL_DANZIG_FR_PROT','DANZIG_FREE','protected_by','FRA_EMPIRE','1807',None,'year','high',['SRC_IEG_1812'])
rel('REL_CAT_FR_ADMIN','CAT_SPECIAL','administered_by','FRA_EMPIRE','1812-01-26',None,'day','high',['SRC_FN_CATALONIA_1812'])
rel('REL_JOSEPH_CAT_CLAIM','ESP_JOSEPH','claims_sovereignty_over','CAT_SPECIAL','1808',None,'year','medium',['SRC_FN_CATALONIA_1812'],issue_ids=['PRB_CATALONIA_STATUS'])
rel('REL_CADIZ_CAT_CLAIM','ESP_CADIZ','claims_sovereignty_over','CAT_SPECIAL','1810',None,'year','high',['SRC_CONGRESO_1812'])
rel('REL_HOLYSEE_PAPAL_CLAIM','HOLY_SEE','claims_sovereignty_over','FRA_PAPAL','1809-05-17',None,'day','high',['SRC_FN_DEPARTMENTS'])
rel('REL_SWEPOM_FR_OCC','SWEDISH_POMERANIA','occupied_by','FRA_EMPIRE','1812-01-27',None,'day','high',['SRC_SWEDISH_POMERANIA_FN','SRC_RH_LANCIZOLLE_1830'])
rel('REL_HELGOLAND_UK_OCC','HELIGOLAND','occupied_by','UK','1807',None,'year','high',['SRC_HELGOLAND_LASH'],issue_ids=['PRB_HELGOLAND_TITLE'])
rel('REL_MALTA_UK_ADMIN','MALTA','administered_by','UK','1800',None,'year','high',['SRC_MALTA_UM'])
rel('REL_SIC_MALTA_CLAIM','SIC_KINGDOM','claims_sovereignty_over','MALTA','1800',None,'year','medium',['SRC_MALTA_UM'],issue_ids=['PRB_MALTA_STATUS'])
rel('REL_ERFURT_FR_ADMIN','ERFURT_DOMAIN','administered_by','FRA_EMPIRE','1807',None,'year','high',['SRC_RH_LANCIZOLLE_1830','SRC_ERFURT_ARCHIVE'])
rel('REL_ANDORRA_FR_ADMIN_CLAIM','ANDORRA','administered_by','FRA_EMPIRE','1812-01-26',None,'day','medium',['SRC_ANDORRA_1812_STUDY','SRC_CATALONIA_ATLAS'],issue_ids=['PRB_ANDORRA_1812'])
# French blocks territorial component of Empire
for i,_,_,_ in fblocks:
    rel(f'REL_{i}_FRA',i,'territorial_component_of','FRA_EMPIRE',get_e(i)['validity']['from'],None,get_e(i)['validity']['date_precision'],'high',['SRC_FN_DEPARTMENTS','SRC_IEG_1812'])
# Catalan depts admin subdivisions
for i in ('CAT_MONTSERRAT','CAT_BOUCHES_EBRE','CAT_TER','CAT_SEGRE'):
    rel(f'REL_{i}_CAT',i,'administrative_subdivision_of','CAT_SPECIAL','1812-01-26',None,'day','high',['SRC_FN_CATALONIA_1812'])
# Ionian grouped and occupation/admin relations
for i in ('ION_ZANTE','ION_CEPHALONIA','ION_ITHACA','ION_SANTA_MAURA','ION_CERIGO'):
    rel(f'REL_{i}_BRITGROUP',i,'territorial_component_of','ION_BRIT_GROUP',get_e(i)['validity']['from'],None,'year','high',['SRC_IONIAN_HOLLAND_1815'])
    rel(f'REL_{i}_UK_OCC',i,'occupied_by','UK',get_e(i)['validity']['from'],None,'year','high',['SRC_IONIAN_HOLLAND_1815'])
rel('REL_CORFU_FR_OCC','ION_CORFU','occupied_by','FRA_EMPIRE',None,None,'unknown','high',['SRC_IONIAN_HOLLAND_1815'])
rel('REL_PAXOS_FR_OCC','ION_PAXOS','occupied_by','FRA_EMPIRE',None,None,'unknown','high',['SRC_IONIAN_HOLLAND_1815'])
# Denmark-Norway components
for i in ('DENMARK_COMPONENT','NORWAY_COMPONENT','SCHLESWIG_DUCHY','HOLSTEIN_DUCHY','ICELAND_COMPONENT','FAROE_COMPONENT'):
    rel(f'REL_{i}_DENNOR',i,'territorial_component_of','DEN_NOR',None,None,'unknown','high',['SRC_IEG_1812'])
# Waldeck/Pyrmont: due entità distinte nello snapshot; entrambe aderenti autonomamente al Rheinbund.
rel('REL_PYRMONT_RHINE','PYRMONT','member_of','CONF_RHINE','1807-04-18',None,'day','high',['SRC_RH_PYRMONT_ACCESSION','SRC_RH_WALDECK_PYRMONT_LWL'],issue_ids=['PRB_WALDECK_PYRMONT','PRB_RHINE_COUNT'])
rel('REL_PYRMONT_FR_MILOB','PYRMONT','military_obligation_to','FRA_EMPIRE','1807-04-18',None,'day','high',['SRC_RH_PYRMONT_ACCESSION','SRC_RH_WALDECK_PYRMONT_LWL'],issue_ids=['PRB_WALDECK_PYRMONT'])
# Legame dinastico Waldeck/Pyrmont senza personal union al 1 giugno 1812.
rel('REL_WALDECK_PYRMONT_DYNASTIC','WALDECK','dynastic_link_with','PYRMONT',None,None,'unknown','high',['SRC_HGIS_WALDECK'],issue_ids=['PRB_WALDECK_PYRMONT'])
# Lucca etc dependence/protection
rel('REL_LUCCA_FR_PROT','LUCCA_PIOMBINO','protected_by','FRA_EMPIRE','1805',None,'year','medium',['SRC_LUCCA_ARCHIVE'],issue_ids=['PRB_LUCCA_SOURCE'])
rel('REL_NEUCHATEL_FR_PROT','NEUCHATEL','protected_by','FRA_EMPIRE','1806',None,'year','high',['SRC_FN_1812'])
rel('REL_BENEVENTO_FR_LINK','BENEVENTO','protected_by','FRA_EMPIRE','1806',None,'year','medium',['SRC_FN_1812'])

# Add relation IDs to entities and memberships/components
relation_ids={r['id'] for r in relations}
for r in relations:
    if r['subject_id'] in entity_ids:
        get_e(r['subject_id'])['relations'].append(r['id'])
        if r['type']=='member_of': get_e(r['subject_id'])['institutional_memberships'].append(r['id'])
        if r['type']=='territorial_component_of':
            obj=get_e(r['object_id']); obj['territorial_components'].append(r['subject_id'])
# basis relations for sovereignty
for e in entities:
    if e['id'] in ('MOLDAVIA','WALLACHIA'):
        e['sovereignty']['basis_relation_ids'].append('REL_'+('MOLDAVIA' if e['id']=='MOLDAVIA' else 'WALLACHIA')+'_OTTOMAN')
    if e['id']=='BESSARABIA_TRANSITION': e['sovereignty']['basis_relation_ids'].append('REL_BESSARABIA_TRANSFER')

# -------------------------- spatial assertions --------------------------
spatial=[]
def sa(i,layer,subject,actor,vf=None,vt=None,status='active',certainty='high',sids=None,notes='',issue_ids=None):
    a={'id':i,'snapshot_id':SNAPSHOT_ID,'layer_type':layer,'subject_entity_id':subject,'actor_entity_id':actor,'valid_from':vf,'valid_to':vt,'status':status,'geometry_id':None,'certainty':certainty,'sources':slinks(*(sids or ['SRC_IEG_1812']),supports=['spatial_assertion']),'issue_ids':issue_ids or [],'notes':notes}
    spatial.append(a); get_e(subject)['effective_control']['spatial_assertion_ids'].append(i); return a
# Spain
sa('SA_ESP_JOSEPH_CLAIM','sovereignty_claim','ESP_JOSEPH','ESP_JOSEPH','1808',None,'contested','high',['SRC_FN_1812'])
sa('SA_ESP_CADIZ_CLAIM','sovereignty_claim','ESP_CADIZ','ESP_CADIZ','1810',None,'contested','high',['SRC_CONGRESO_1812'])
sa('SA_ESP_JOSEPH_ADMIN','civil_administration','ESP_JOSEPH','ESP_JOSEPH','1808',None,'contested','medium',['SRC_IEG_1812'],issue_ids=['PRB_SPAIN_CONTROL'])
sa('SA_ESP_FR_MIL_CONTROL','military_control','ESP_JOSEPH','FRA_EMPIRE','1808',None,'contested','medium',['SRC_IEG_1812','SRC_FN_1812'],issue_ids=['PRB_SPAIN_CONTROL'])
sa('SA_ESP_ANTI_MIL_CONTROL','military_control','ESP_CADIZ','ESP_CADIZ','1808',None,'contested','medium',['SRC_CONGRESO_1812'],issue_ids=['PRB_SPAIN_CONTROL'])
sa('SA_ESP_UK_MIL_CONTROL','military_control','ESP_CADIZ','UK','1808',None,'contested','medium',['SRC_IEG_1812'],issue_ids=['PRB_SPAIN_CONTROL'])
sa('SA_ESP_POR_MIL_CONTROL','military_control','ESP_CADIZ','POR_KINGDOM','1808',None,'contested','medium',['SRC_IEG_1812'],issue_ids=['PRB_SPAIN_CONTROL'])
# Catalonia
sa('SA_CAT_FR_SPECIAL','special_administration','CAT_SPECIAL','FRA_EMPIRE','1812-01-26',None,'active','high',['SRC_FN_CATALONIA_1812'],issue_ids=['PRB_CATALONIA_STATUS'])
sa('SA_CAT_JOSEPH_CLAIM','sovereignty_claim','CAT_SPECIAL','ESP_JOSEPH','1808',None,'contested','medium',['SRC_FN_CATALONIA_1812'],issue_ids=['PRB_CATALONIA_STATUS'])
sa('SA_CAT_CADIZ_CLAIM','sovereignty_claim','CAT_SPECIAL','ESP_CADIZ','1810',None,'contested','high',['SRC_CONGRESO_1812'])
sa('SA_CAT_FR_MIL_CONTROL','military_control','CAT_SPECIAL','FRA_EMPIRE','1810',None,'contested','medium',['SRC_FN_CATALONIA_1812'],issue_ids=['PRB_SPAIN_CONTROL'])
sa('SA_CAT_ANTI_MIL_CONTROL','military_control','CAT_SPECIAL','ESP_CADIZ','1810',None,'contested','medium',['SRC_CATALONIA_ATLAS'],issue_ids=['PRB_SPAIN_CONTROL'])
for i in ('CAT_MONTSERRAT','CAT_BOUCHES_EBRE','CAT_TER','CAT_SEGRE'):
    sa(f'SA_{i}_FR_ADMIN','civil_administration',i,'FRA_EMPIRE','1812-01-26',None,'active','high',['SRC_FN_CATALONIA_1812'])
# Andorra disputed/incomplete admin intent
sa('SA_ANDORRA_FR_ADMIN','special_administration','ANDORRA','FRA_EMPIRE','1812-01-26',None,'planned_or_disputed','medium',['SRC_ANDORRA_1812_STUDY','SRC_CATALONIA_ATLAS'],issue_ids=['PRB_ANDORRA_1812'],notes='Inclusione nel dipartimento del Sègre attestata da varie ricostruzioni; uno studio universitario segnala che il progetto non fu pienamente implementato.')
# Bucharest
sa('SA_BESS_TRANSFER','treaty_transfer_pending','BESSARABIA_TRANSITION','RUS_EMPIRE','1812-05-28',None,'transitional','high',['SRC_BUCHAREST_MWNF'],issue_ids=['PRB_BUCHAREST_TRANSITION'])
sa('SA_BESS_RUS_CONTROL','military_control','BESSARABIA_TRANSITION','RUS_EMPIRE','1806',None,'transitional','high',['SRC_BUCHAREST_TAKI'])
sa('SA_MOLD_OTT_SUZ','sovereignty_claim','MOLDAVIA','OTT_EMPIRE',None,None,'active','high',['SRC_BUCHAREST_TAKI'])
sa('SA_MOLD_RUS_OCC','military_occupation','MOLDAVIA','RUS_EMPIRE','1806',None,'transitional','high',['SRC_BUCHAREST_TAKI'])
sa('SA_WALL_OTT_SUZ','sovereignty_claim','WALLACHIA','OTT_EMPIRE',None,None,'active','high',['SRC_BUCHAREST_TAKI'])
sa('SA_WALL_RUS_OCC','military_occupation','WALLACHIA','RUS_EMPIRE','1806',None,'transitional','high',['SRC_BUCHAREST_TAKI'])
# Ionian
sa('SA_CORFU_FR_CONTROL','military_control','ION_CORFU','FRA_EMPIRE',None,None,'active','high',['SRC_IONIAN_HOLLAND_1815'],issue_ids=['PRB_IONIAN_SOVEREIGNTY'])
sa('SA_PAXOS_FR_CONTROL','military_control','ION_PAXOS','FRA_EMPIRE',None,None,'active','high',['SRC_IONIAN_HOLLAND_1815'],issue_ids=['PRB_IONIAN_SOVEREIGNTY'])
for i in ('ION_ZANTE','ION_CEPHALONIA','ION_ITHACA','ION_SANTA_MAURA','ION_CERIGO'):
    sa(f'SA_{i}_UK_OCC','military_occupation',i,'UK',get_e(i)['validity']['from'],None,'active','high',['SRC_IONIAN_HOLLAND_1815'],issue_ids=['PRB_IONIAN_SOVEREIGNTY'])
# Malta
sa('SA_MALTA_UK_CONTROL','military_control','MALTA','UK','1800',None,'active','high',['SRC_MALTA_UM'],issue_ids=['PRB_MALTA_STATUS'])
sa('SA_MALTA_UK_ADMIN','civil_administration','MALTA','UK','1800',None,'active','high',['SRC_MALTA_UM'],issue_ids=['PRB_MALTA_STATUS'])
sa('SA_MALTA_SIC_CLAIM','sovereignty_claim','MALTA','SIC_KINGDOM','1800',None,'contested','medium',['SRC_MALTA_UM'],issue_ids=['PRB_MALTA_STATUS'])
# Pomerania, Heligoland, Erfurt
sa('SA_SWEPOM_FR_OCC','military_occupation','SWEDISH_POMERANIA','FRA_EMPIRE','1812-01-27',None,'active','high',['SRC_SWEDISH_POMERANIA_FN'])
sa('SA_SWEPOM_SWE_SOV','sovereignty_claim','SWEDISH_POMERANIA','SWE_KINGDOM',None,None,'active','high',['SRC_IEG_1812'])
sa('SA_HELGOLAND_UK_OCC','military_occupation','HELIGOLAND','UK','1807',None,'active','high',['SRC_HELGOLAND_LASH'],issue_ids=['PRB_HELGOLAND_TITLE'])
sa('SA_HELGOLAND_DAN_CLAIM','sovereignty_claim','HELIGOLAND','DEN_NOR','1807',None,'contested','medium',['SRC_HELGOLAND_LASH'],issue_ids=['PRB_HELGOLAND_TITLE'])
sa('SA_ERFURT_FR_ADMIN','special_administration','ERFURT_DOMAIN','FRA_EMPIRE','1807',None,'active','high',['SRC_RH_LANCIZOLLE_1830','SRC_ERFURT_ARCHIVE'])

# -------------------------- issues --------------------------
def issue(i,title,area,typ,desc,affected,status,solution,certainty,sids):
    return {'id':i,'title':title,'area':area,'issue_type':typ,'description':desc,'affected_entities':affected,'resolution_status':status,'adopted_solution':solution,'certainty':certainty,'sources':[{'source_id':s,'supports':['issue_assessment']} for s in sids]}
issues=[
issue('PRB_RHINE_COUNT','Conteggio giuridico degli Stati della Confederazione del Reno','Germania','membership','L’audit Fase 5.1 ha riesaminato Waldeck/Pyrmont. Gli atti distinguono l’adesione di Friedrich Karl August di Waldeck e un atto del 18 aprile 1807 intestato a Georg, governante separato di Pyrmont. Al 1 giugno 1812 il roster adottato comprende quindi 35 membri attivi, mantenendo distinti i quattro principati Reuss e Pyrmont.','CONF_RHINE WALDECK PYRMONT REUSS_GREIZ REUSS_SCHLEIZ REUSS_LOBENSTEIN REUSS_EBERSDORF'.split(),'resolved','Usare 35 relazioni member_of attive nello snapshot. Pyrmont è membro autonomo; Waldeck e Pyrmont restano entità statuali separate fino alla successione del settembre 1812.','high',['SRC_RH_ACCESSIONS','SRC_HGIS_WALDECK','SRC_RH_PYRMONT_ACCESSION','SRC_RH_WALDECK_PYRMONT_LWL']),
issue('PRB_WALDECK_PYRMONT','Waldeck e Pyrmont al 1 giugno 1812','Germania','ontology','Dal 1805 Friedrich governava Waldeck e Georg governava Pyrmont separatamente. HGIS conferma la separazione statuale; l’atto del 18 aprile 1807 intestato a Georg documenta la sua adesione al Rheinbund. La personal union con Waldeck inizia soltanto dopo la morte di Friedrich nel settembre 1812.','WALDECK PYRMONT'.split(),'resolved','Mantenere WALDECK e PYRMONT come due entità distinte e assegnare a entrambe una relazione member_of con CONF_RHINE; nessuna personal_union_with è attiva al 1 giugno 1812.','high',['SRC_HGIS_WALDECK','SRC_RH_PYRMONT_ACCESSION','SRC_RH_WALDECK_PYRMONT_LWL']),
issue('PRB_SPAIN_CONTROL','Controllo territoriale frammentato nella Penisola iberica','Spagna','effective_control','Sovranità rivendicata, amministrazione civile e controllo militare non coincidono. La futura geometria richiederà ricostruzione spaziale distinta per attori e date.','ESP_JOSEPH ESP_CADIZ CAT_SPECIAL'.split(),'provisionally_resolved','Usare spatial assertions separate per legal claim, civil administration e military control; geometry_id resta null.','medium',['SRC_CONGRESO_1812','SRC_FN_CATALONIA_1812','SRC_IEG_1812']),
issue('PRB_CATALONIA_STATUS','Status giuridico della Catalogna amministrata dalla Francia','Catalogna','legal_status','Il decreto del 26 gennaio 1812 crea quattro dipartimenti e amministrazione francese diretta, ma lo studio istituzionale Fondation Napoléon precisa la mancata annessione giuridica ordinaria alla Francia.','CAT_SPECIAL CAT_MONTSERRAT CAT_BOUCHES_EBRE CAT_TER CAT_SEGRE'.split(),'resolved','CAT_SPECIAL non è territorial_component_of FRA_EMPIRE; viene modellata come special_french_administration con pretese spagnole concorrenti.','high',['SRC_FN_CATALONIA_1812','SRC_CONGRESO_1812']),
issue('PRB_ANDORRA_1812','Andorra e il Département du Sègre','Pirenei','administration','Fonti catalane descrivono Andorra come inclusa nel Département du Sègre nel 1812; uno studio universitario qualifica tuttavia l’atto come progetto la cui piena implementazione sarebbe stata impedita dal declino militare napoleonico.','ANDORRA CAT_SEGRE'.split(),'provisionally_resolved','Conservare ANDORRA come entità locale con sovereignty contested e spatial assertion francese planned_or_disputed; non trattarla né come Francia pienamente incorporata né come microstato invariato.','medium',['SRC_ANDORRA_1806','SRC_ANDORRA_1812_STUDY','SRC_CATALONIA_ATLAS']),
issue('PRB_BUCHAREST_TRANSITION','Bucarest firmato quattro giorni prima dello snapshot','Moldavia-Valacchia-Bessarabia','chronology','Il trattato è firmato il 28 maggio 1812; l’evacuazione russa dei territori da restituire segue l’attuazione diplomatica. Il 1 giugno non va rappresentato come assetto materiale già concluso.','BESSARABIA_TRANSITION MOLDAVIA WALLACHIA RUS_EMPIRE OTT_EMPIRE'.split(),'provisionally_resolved','Usare pending_transfer per Bessarabia e handover_pending per Moldavia/Valacchia, con controllo russo ancora registrato.','high',['SRC_BUCHAREST_MWNF','SRC_BUCHAREST_TAKI']),
issue('PRB_MALTA_STATUS','Status internazionale di Malta','Mediterraneo','legal_status','Il controllo britannico è de facto; la formalizzazione della sovranità britannica è successiva. La letteratura segnala una persistente questione di titolo giuridico collegata alla corona siciliana.','MALTA UK SIC_KINGDOM'.split(),'provisionally_resolved','Sovereignty indeterminate, holder/claim siciliano registrato con certezza media; controllo e amministrazione britannici ad alta certezza.','medium',['SRC_MALTA_UM']),
issue('PRB_IONIAN_SOVEREIGNTY','Sovranità e controllo delle Isole Ionie','Isole Ionie','legal_status','La testimonianza coeva di Henry Holland conferma che nel 1812 Corfù e Paxos restavano in potere francese mentre Zante, Cefalonia, Itaca, Santa Maura e Cerigo erano sotto controllo britannico. Lo status internazionale resta distinto dal mero controllo militare.','ION_CORFU ION_PAXOS ION_BRIT_GROUP ION_ZANTE ION_CEPHALONIA ION_ITHACA ION_SANTA_MAURA ION_CERIGO'.split(),'provisionally_resolved','Registrare il controllo per singola isola ad alta certezza; mantenere sovereignty indeterminate finché non sarà consolidata l’intera catena diplomatica.','medium',['SRC_IONIAN_HOLLAND_1815']),
issue('PRB_HELGOLAND_TITLE','Titolo giuridico di Helgoland fra 1807 e 1814','Mare del Nord','legal_status','Il Landesarchiv Schleswig-Holstein documenta l’occupazione britannica del 1807 e la successiva fase britannica; la cessione formale danese viene distinta e resta successiva allo snapshot.','HELIGOLAND UK DEN_NOR'.split(),'provisionally_resolved','Sovereignty indeterminate con titolo danese conservato; occupazione e controllo britannici ad alta certezza.','medium',['SRC_HELGOLAND_LASH']),
issue('PRB_MONTENEGRO_STATUS','Status del Montenegro rispetto alla Porta','Balcani','legal_status','I governanti montenegrini sostenevano l’indipendenza, gli Ottomani lo consideravano parte dell’Impero; il controllo ottomano effettivo sulle montagne era molto debole.','MONTENEGRO OTT_EMPIRE'.split(),'provisionally_resolved','Modellare come de_facto_polity con sovereignty contested e controllo montenegrino predominant.','high',['SRC_MONTENEGRO_PRINCETON']),
issue('PRB_SERBIA_1812','Serbia insorta e articolo del trattato di Bucarest','Serbia','legal_status','Il movimento insurrezionale esercita un potere territoriale de facto; il trattato del 1812 prevede autogoverno ma resta nel quadro della sovranità ottomana e precede la riconquista del 1813.','SERBIA_INSURGENT OTT_EMPIRE'.split(),'provisionally_resolved','Usare de_facto_polity + sovranità contestata, senza anticipare lo status autonomo consolidato degli anni successivi.','high',['SRC_SERBIA_MFA','SRC_BUCHAREST_MWNF']),
issue('PRB_PONTECORVO_RULER','Titolare preciso di Pontecorvo al 1 giugno 1812','Italia','source_quality','La fonte archivistica conferma il titolo di Lucien Murat ma non stabilisce da sola con sufficiente precisione la decorrenza dell’investitura rispetto allo snapshot.','PONTECORVO'.split(),'open','Lasciare office_holders vuoto e certezza complessiva media finché non si verifica l’atto d’investitura.','medium',['SRC_PONTECORVO_AN']),
issue('PRB_LUCCA_SOURCE','Fonte archivistica specifica per Lucca e Piombino','Italia','source_quality','L’audit ha sostituito la home generica SIAS con il record archivistico specifico Principato Baciocchi, 1805-1814.','LUCCA_PIOMBINO'.split(),'resolved','Usare il permalink SIAS specifico come fonte archivistica principale, con IEG come controllo cartografico generale.','high',['SRC_LUCCA_ARCHIVE','SRC_IEG_1812']),
issue('PRB_PAPAL_CLAIM','Pretesa temporale pontificia dopo l’annessione','Italia','legal_status','L’Impero francese amministra gli ex Stati pontifici, mentre Pio VII non riconosce la perdita della potestà temporale.','HOLY_SEE FRA_PAPAL'.split(),'resolved','Conservare HOLY_SEE come sovereign_institution nonspatial che claims_sovereignty_over FRA_PAPAL; nessuna doppia geometria statale.','high',['SRC_FN_DEPARTMENTS']),
issue('PRB_HANOVER_SOURCE','Continuità hannoveriana in esilio','Germania','source_quality','Il Niedersächsisches Landesarchiv documenta che nel giugno 1803 il ministero hannoveriano si trasferì prima a Lauenburg e poi a Londra durante l’occupazione francese. La natura precisa delle strutture operative nel 1812 resta materia da trattare con prudenza.','HANOVER_CLAIM'.split(),'provisionally_resolved','Conservare HANOVER_CLAIM come record nonspatial a certezza media, ora sostenuto da una fonte archivistica dedicata; non trasformarlo in geometria territoriale autonoma.','medium',['SRC_HANOVER_NLA','SRC_IEG_1812']),
issue('PRB_ERFURT_LEGAL_FORM','Qualificazione del dominio di Erfurt','Germania','legal_status','La descrizione archivistica del Landesarchiv Thüringen qualifica Erfurt nel 1806-1813 come domaine réservée à l’empereur, confermando la separazione dai normali Rheinbundstaaten.','ERFURT_DOMAIN'.split(),'resolved','Mantenere integration_mode imperial_domain, sovranità francese e amministrazione diretta napoleonica; Erfurt non è membro del Rheinbund.','high',['SRC_ERFURT_ARCHIVE','SRC_RH_LANCIZOLLE_1830']),
issue('PRB_COSPAIA_1812','Cospaia non è repubblica indipendente nello snapshot 1812','Italia centrale','legal_status','Il checkpoint di Fase 4 la elencava come microrepubblica, ma il profilo archivistico italiano indica una reggenza imperiale francese 1809-1814.','COSPAIA_LOCAL FRA_PAPAL'.split(),'resolved','Correggere l’ontologia: COSPAIA_LOCAL resta località storica, non Stato; è ricompresa nel dominio francese dell’ex territorio pontificio.','high',['SRC_COSPAIA_ARCHIVE'])
]
issue_ids={i['id'] for i in issues}
# adjust entity certainty for issue-heavy records
for eid in ('PONTECORVO','ANDORRA','MALTA','HELIGOLAND','MONTENEGRO','HANOVER_CLAIM','ION_CORFU','ION_PAXOS','ION_BRIT_GROUP','ION_ZANTE','ION_CEPHALONIA','ION_ITHACA','ION_SANTA_MAURA','ION_CERIGO'):
    get_e(eid)['certainty']['overall']='medium'
get_e('COSPAIA_LOCAL')['certainty']['overall']='high'
# Add issue IDs where referenced in issue affected entities if entity exists and not already
for iss in issues:
    for eid in iss['affected_entities']:
        if eid in entity_ids and iss['id'] not in get_e(eid)['issue_ids']:
            get_e(eid)['issue_ids'].append(iss['id'])

dump(D/'relations.json',{'schema_version':SCHEMA_VERSION,'snapshot_id':SNAPSHOT_ID,'relations':relations})
dump(D/'spatial_assertions.json',{'schema_version':SCHEMA_VERSION,'snapshot_id':SNAPSHOT_ID,'spatial_assertions':spatial})
dump(D/'issues.json',{'schema_version':SCHEMA_VERSION,'snapshot_id':SNAPSHOT_ID,'issues':issues})
dump(D/'entities.json',{'schema_version':SCHEMA_VERSION,'snapshot_id':SNAPSHOT_ID,'entities':entities})

# -------------------------- snapshot --------------------------
snapshot={
'id':SNAPSHOT_ID,'title':'Europa all’apogeo del sistema napoleonico — 1 giugno 1812','date':AS_OF,
'description':'Snapshot politico-territoriale dell’Europa immediatamente precedente all’apertura formale della guerra franco-russa del giugno 1812. Separa sovranità, amministrazione, controllo, occupazione, appartenenze e rapporti politici.',
'snapshot_nature':'historical_reconstruction','geographic_scope':{'name':'Europa','notes':'Europa politica con periferie mediterranee e caucaso-balcaniche solo quando necessarie alla comprensione delle entità europee; nessuna geometria è ancora inclusa.'},
'schema_version':SCHEMA_VERSION,'validation_status':'validated_with_open_issues',
'general_cartographic_source_ids':['SRC_IEG_1812','SRC_IEG_1812_SERIE2','SRC_FN_1812','SRC_RH_MAP_1812_HALLE'],
'methodological_notes':['La mappa non assume territorio=Stato=colore.','geometry_id deve rimanere null in tutta la Fase 5.','Le aggregazioni FRA_* sono blocchi storico-analitici e non fingono di essere enti amministrativi contemporanei.','Le pretese e i controlli della Penisola iberica sono predisposti come layer separati.','La data 1812-06-01 precede il passaggio del Niemen e l’apertura della guerra franco-russa.']}
dump(D/'snapshot.json',snapshot)

# -------------------------- JSON schemas draft 2020-12 --------------------------
DRAFT='https://json-schema.org/draft/2020-12/schema'
idpat='^[A-Z][A-Z0-9_]*$'; datepat=r'^\d{4}(-\d{2}(-\d{2})?)?$'
def base_defs():
    return {
      'dateNullable':{'type':['string','null'],'pattern':datepat},
      'id':{'type':'string','minLength':1,'pattern':idpat},
      'sourceLink':{'type':'object','additionalProperties':False,'required':['source_id','supports'],'properties':{'source_id':{'type':'string','minLength':1,'pattern':'^SRC_[A-Z0-9_]+$'},'supports':{'type':'array','minItems':1,'uniqueItems':True,'items':{'type':'string','minLength':1}}}}
    }

def entity_schema():
  defs=base_defs();
  defs.update({
    'capital':{'type':'object','additionalProperties':False,'required':['name','role','valid_from','valid_to'],'properties':{'name':{'type':'string','minLength':1},'role':{'enum':enum['capital_role']},'valid_from':{'$ref':'#/$defs/dateNullable'},'valid_to':{'$ref':'#/$defs/dateNullable'}}},
    'officeHolder':{'type':'object','additionalProperties':False,'required':['person_id','office','role','valid_from','valid_to'],'properties':{'person_id':{'type':'string','pattern':'^P_[A-Z0-9_]+$'},'office':{'type':'string','minLength':1},'role':{'enum':enum['office_role']},'valid_from':{'$ref':'#/$defs/dateNullable'},'valid_to':{'$ref':'#/$defs/dateNullable'}}}
  })
  record={'type':'object','additionalProperties':False,'required':['schema_version','snapshot_id','as_of','id','names','entity_class','constitutional_form','record_nature','validity','display_level','spatial_mode','capital','office_holders','sovereignty','effective_control','institutional_memberships','napoleonic_relation','relations','territorial_components','issue_ids','certainty','sources','notes'],'properties':{
    'schema_version':{'const':SCHEMA_VERSION},'snapshot_id':{'const':SNAPSHOT_ID},'as_of':{'const':AS_OF},'id':{'$ref':'#/$defs/id'},
    'names':{'type':'object','additionalProperties':False,'required':['it','original','short','aliases'],'properties':{'it':{'type':'string','minLength':1},'original':{'type':'string','minLength':1},'short':{'type':'string','minLength':1},'aliases':{'type':'array','items':{'type':'string'}}}},
    'entity_class':{'enum':enum['entity_class']},'constitutional_form':{'enum':enum['constitutional_form']},'record_nature':{'enum':enum['record_nature']},
    'validity':{'type':'object','additionalProperties':False,'required':['from','to','date_precision'],'properties':{'from':{'$ref':'#/$defs/dateNullable'},'to':{'$ref':'#/$defs/dateNullable'},'date_precision':{'enum':enum['date_precision']}}},
    'display_level':{'enum':enum['display_level']},'spatial_mode':{'enum':enum['spatial_mode']},'capital':{'type':'array','items':{'$ref':'#/$defs/capital'}},'office_holders':{'type':'array','items':{'$ref':'#/$defs/officeHolder'}},
    'sovereignty':{'type':'object','additionalProperties':False,'required':['status','holder_ids','holder_person_ids','suzerain_ids','competing_claimant_ids','basis_relation_ids'],'properties':{'status':{'enum':enum['sovereignty_status']},'holder_ids':{'type':'array','uniqueItems':True,'items':{'$ref':'#/$defs/id'}},'holder_person_ids':{'type':'array','uniqueItems':True,'items':{'type':'string','pattern':'^P_[A-Z0-9_]+$'}},'suzerain_ids':{'type':'array','uniqueItems':True,'items':{'$ref':'#/$defs/id'}},'competing_claimant_ids':{'type':'array','uniqueItems':True,'items':{'$ref':'#/$defs/id'}},'basis_relation_ids':{'type':'array','uniqueItems':True,'items':{'type':'string','pattern':'^REL_[A-Z0-9_]+$'}}}},
    'effective_control':{'type':'object','additionalProperties':False,'required':['status','primary_controller_ids','competing_controller_ids','spatial_assertion_ids'],'properties':{'status':{'enum':enum['effective_control_status']},'primary_controller_ids':{'type':'array','uniqueItems':True,'items':{'$ref':'#/$defs/id'}},'competing_controller_ids':{'type':'array','uniqueItems':True,'items':{'$ref':'#/$defs/id'}},'spatial_assertion_ids':{'type':'array','uniqueItems':True,'items':{'type':'string','pattern':'^SA_[A-Z0-9_]+$'}}}},
    'institutional_memberships':{'type':'array','uniqueItems':True,'items':{'type':'string','pattern':'^REL_[A-Z0-9_]+$'}},
    'napoleonic_relation':{'type':'object','additionalProperties':False,'required':['integration_modes','alignment','dependence_level','coercion_level','war_status'],'properties':{'integration_modes':{'type':'array','minItems':1,'uniqueItems':True,'items':{'enum':enum['integration_mode']}},'alignment':{'enum':enum['alignment']},'dependence_level':{'enum':enum['dependence_level']},'coercion_level':{'enum':enum['coercion_level']},'war_status':{'enum':enum['war_status']}}},
    'relations':{'type':'array','uniqueItems':True,'items':{'type':'string','pattern':'^REL_[A-Z0-9_]+$'}},'territorial_components':{'type':'array','uniqueItems':True,'items':{'$ref':'#/$defs/id'}},'issue_ids':{'type':'array','uniqueItems':True,'items':{'type':'string','pattern':'^PRB_[A-Z0-9_]+$'}},
    'certainty':{'type':'object','additionalProperties':False,'required':['overall','fields'],'properties':{'overall':{'enum':enum['certainty']},'fields':{'type':'object','additionalProperties':{'enum':enum['certainty']}}}},
    'sources':{'type':'array','items':{'$ref':'#/$defs/sourceLink'}},'notes':{'type':'string'}}}
  return {'$schema':DRAFT,'$id':'entity.schema.json','title':'GB-Atlante MAP_10 entities','type':'object','additionalProperties':False,'required':['schema_version','snapshot_id','entities'],'properties':{'schema_version':{'const':SCHEMA_VERSION},'snapshot_id':{'const':SNAPSHOT_ID},'entities':{'type':'array','items':record}},'$defs':defs}

def simple_file_schema(kind, record):
    return {'$schema':DRAFT,'$id':f'{kind}.schema.json','type':'object','additionalProperties':False,'required':['schema_version','snapshot_id',kind],'properties':{'schema_version':{'const':SCHEMA_VERSION},'snapshot_id':{'const':SNAPSHOT_ID},kind:{'type':'array','items':record}},'$defs':base_defs()}

person_rec={'type':'object','additionalProperties':False,'required':['id','name','birth','death','aliases','sources'],'properties':{'id':{'type':'string','pattern':'^P_[A-Z0-9_]+$'},'name':{'type':'string','minLength':1},'birth':{'$ref':'#/$defs/dateNullable'},'death':{'$ref':'#/$defs/dateNullable'},'aliases':{'type':'array','items':{'type':'string'}},'sources':{'type':'array','items':{'$ref':'#/$defs/sourceLink'}}}}
relation_rec={'type':'object','additionalProperties':False,'required':['id','snapshot_id','subject_id','type','object_id','valid_from','valid_to','date_precision','qualifiers','certainty','sources','issue_ids','notes'],'properties':{'id':{'type':'string','pattern':'^REL_[A-Z0-9_]+$'},'snapshot_id':{'const':SNAPSHOT_ID},'subject_id':{'$ref':'#/$defs/id'},'type':{'enum':enum['relation_type']},'object_id':{'$ref':'#/$defs/id'},'valid_from':{'$ref':'#/$defs/dateNullable'},'valid_to':{'$ref':'#/$defs/dateNullable'},'date_precision':{'enum':enum['date_precision']},'qualifiers':{'type':'object'},'certainty':{'enum':enum['certainty']},'sources':{'type':'array','items':{'$ref':'#/$defs/sourceLink'}},'issue_ids':{'type':'array','items':{'type':'string','pattern':'^PRB_[A-Z0-9_]+$'}},'notes':{'type':'string'}}}
spatial_rec={'type':'object','additionalProperties':False,'required':['id','snapshot_id','layer_type','subject_entity_id','actor_entity_id','valid_from','valid_to','status','geometry_id','certainty','sources','issue_ids','notes'],'properties':{'id':{'type':'string','pattern':'^SA_[A-Z0-9_]+$'},'snapshot_id':{'const':SNAPSHOT_ID},'layer_type':{'enum':enum['spatial_layer_type']},'subject_entity_id':{'$ref':'#/$defs/id'},'actor_entity_id':{'$ref':'#/$defs/id'},'valid_from':{'$ref':'#/$defs/dateNullable'},'valid_to':{'$ref':'#/$defs/dateNullable'},'status':{'enum':enum['spatial_assertion_status']},'geometry_id':{'type':'null'},'certainty':{'enum':enum['certainty']},'sources':{'type':'array','items':{'$ref':'#/$defs/sourceLink'}},'issue_ids':{'type':'array','items':{'type':'string','pattern':'^PRB_[A-Z0-9_]+$'}},'notes':{'type':'string'}}}
source_rec={'type':'object','additionalProperties':False,'required':['source_id','title','author_or_institution','date','source_type','url','license','accessed','reliability','needs_source_upgrade','notes'],'properties':{'source_id':{'type':'string','pattern':'^SRC_[A-Z0-9_]+$'},'title':{'type':'string','minLength':1},'author_or_institution':{'type':'string','minLength':1},'date':{'type':'string','minLength':1},'source_type':{'enum':enum['source_type']},'url':{'type':'string','minLength':1},'license':{'type':'string','minLength':1},'accessed':{'type':'string','format':'date'},'reliability':{'enum':enum['source_reliability']},'needs_source_upgrade':{'type':'boolean'},'notes':{'type':'string'}}}
issue_rec={'type':'object','additionalProperties':False,'required':['id','title','area','issue_type','description','affected_entities','resolution_status','adopted_solution','certainty','sources'],'properties':{'id':{'type':'string','pattern':'^PRB_[A-Z0-9_]+$'},'title':{'type':'string','minLength':1},'area':{'type':'string','minLength':1},'issue_type':{'enum':enum['issue_type']},'description':{'type':'string','minLength':1},'affected_entities':{'type':'array','items':{'$ref':'#/$defs/id'}},'resolution_status':{'enum':enum['resolution_status']},'adopted_solution':{'type':'string','minLength':1},'certainty':{'enum':enum['certainty']},'sources':{'type':'array','items':{'$ref':'#/$defs/sourceLink'}}}}
snapshot_schema={'$schema':DRAFT,'$id':'snapshot.schema.json','type':'object','additionalProperties':False,'required':['id','title','date','description','snapshot_nature','geographic_scope','schema_version','validation_status','general_cartographic_source_ids','methodological_notes'],'properties':{'id':{'const':SNAPSHOT_ID},'title':{'type':'string','minLength':1},'date':{'const':AS_OF},'description':{'type':'string','minLength':1},'snapshot_nature':{'const':'historical_reconstruction'},'geographic_scope':{'type':'object','additionalProperties':False,'required':['name','notes'],'properties':{'name':{'type':'string'},'notes':{'type':'string'}}},'schema_version':{'const':SCHEMA_VERSION},'validation_status':{'enum':['draft','validated_with_open_issues','validated']},'general_cartographic_source_ids':{'type':'array','minItems':1,'items':{'type':'string','pattern':'^SRC_[A-Z0-9_]+$'}},'methodological_notes':{'type':'array','items':{'type':'string'}}}}

dump(S/'snapshot.schema.json',snapshot_schema)
dump(S/'entity.schema.json',entity_schema())
dump(S/'person.schema.json',simple_file_schema('persons',person_rec))
dump(S/'relation.schema.json',simple_file_schema('relations',relation_rec))
dump(S/'spatial_assertion.schema.json',simple_file_schema('spatial_assertions',spatial_rec))
dump(S/'source.schema.json',simple_file_schema('sources',source_rec))
dump(S/'issue.schema.json',simple_file_schema('issues',issue_rec))

# -------------------------- validation --------------------------
from jsonschema import Draft202012Validator, FormatChecker
schema_errors=[]
files_schemas=[('snapshot.json','snapshot.schema.json'),('entities.json','entity.schema.json'),('persons.json','person.schema.json'),('relations.json','relation.schema.json'),('spatial_assertions.json','spatial_assertion.schema.json'),('sources.json','source.schema.json'),('issues.json','issue.schema.json')]
for f,sch in files_schemas:
    data=json.loads((D/f).read_text(encoding='utf-8')); schema=json.loads((S/sch).read_text(encoding='utf-8'))
    v=Draft202012Validator(schema,format_checker=FormatChecker())
    for err in sorted(v.iter_errors(data), key=lambda e:list(e.path)):
        schema_errors.append({'file':f,'path':'/'.join(map(str,err.path)),'message':err.message})

# custom referential checks
missing=[]
# refresh IDs
entity_ids={e['id'] for e in entities}; person_ids={p['id'] for p in persons}; relation_ids={r['id'] for r in relations}; spatial_ids={a['id'] for a in spatial}; source_ids={s['source_id'] for s in sources}; issue_ids={i['id'] for i in issues}
# uniqueness
unique_errors=[]
def check_unique(name, vals):
    if len(vals)!=len(set(vals)): unique_errors.append(f'Duplicate IDs in {name}')
check_unique('entities',[e['id'] for e in entities]);check_unique('persons',[p['id'] for p in persons]);check_unique('relations',[r['id'] for r in relations]);check_unique('spatial_assertions',[a['id'] for a in spatial]);check_unique('sources',[s['source_id'] for s in sources]);check_unique('issues',[i['id'] for i in issues])

def miss(kind, owner, ref): missing.append({'kind':kind,'owner':owner,'missing_ref':ref})
for e in entities:
    for pid in [h['person_id'] for h in e['office_holders']]+e['sovereignty']['holder_person_ids']:
        if pid not in person_ids: miss('person',e['id'],pid)
    for rid in e['relations']+e['institutional_memberships']+e['sovereignty']['basis_relation_ids']:
        if rid not in relation_ids: miss('relation',e['id'],rid)
    for sid in e['effective_control']['spatial_assertion_ids']:
        if sid not in spatial_ids: miss('spatial_assertion',e['id'],sid)
    refs=e['sovereignty']['holder_ids']+e['sovereignty']['suzerain_ids']+e['sovereignty']['competing_claimant_ids']+e['effective_control']['primary_controller_ids']+e['effective_control']['competing_controller_ids']+e['territorial_components']
    for x in refs:
        if x not in entity_ids: miss('entity',e['id'],x)
    for x in e['issue_ids']:
        if x not in issue_ids: miss('issue',e['id'],x)
    for sl in e['sources']:
        if sl['source_id'] not in source_ids: miss('source',e['id'],sl['source_id'])
for p in persons:
    for sl in p['sources']:
        if sl['source_id'] not in source_ids: miss('source',p['id'],sl['source_id'])
for r in relations:
    if r['subject_id'] not in entity_ids: miss('entity',r['id'],r['subject_id'])
    if r['object_id'] not in entity_ids: miss('entity',r['id'],r['object_id'])
    if r['subject_id']==r['object_id']: missing.append({'kind':'self_relation','owner':r['id'],'missing_ref':r['subject_id']})
    for sl in r['sources']:
        if sl['source_id'] not in source_ids: miss('source',r['id'],sl['source_id'])
    for iid in r['issue_ids']:
        if iid not in issue_ids: miss('issue',r['id'],iid)
    for k,v in r['qualifiers'].items():
        if k.endswith('_person_id') and isinstance(v,str) and v not in person_ids: miss('person',r['id'],v)
        if k.endswith('_person_ids') and isinstance(v,list):
            for pid in v:
                if pid not in person_ids: miss('person',r['id'],pid)
for a in spatial:
    if a['subject_entity_id'] not in entity_ids: miss('entity',a['id'],a['subject_entity_id'])
    if a['actor_entity_id'] not in entity_ids: miss('entity',a['id'],a['actor_entity_id'])
    if a['geometry_id'] is not None: missing.append({'kind':'geometry_must_be_null','owner':a['id'],'missing_ref':str(a['geometry_id'])})
    for sl in a['sources']:
        if sl['source_id'] not in source_ids: miss('source',a['id'],sl['source_id'])
for iss in issues:
    for x in iss['affected_entities']:
        if x not in entity_ids: miss('entity',iss['id'],x)
    for sl in iss['sources']:
        if sl['source_id'] not in source_ids: miss('source',iss['id'],sl['source_id'])
# snapshot sources
for s in snapshot['general_cartographic_source_ids']:
    if s not in source_ids: miss('source',SNAPSHOT_ID,s)

# dates and active snapshot checks
from datetime import datetime
def normalize_date(s, end=False):
    if s is None: return None
    if re.match(r'^\d{4}$',s): return datetime.strptime(s+('-12-31' if end else '-01-01'),'%Y-%m-%d').date()
    if re.match(r'^\d{4}-\d{2}$',s):
        y,m=map(int,s.split('-')); import calendar; d=calendar.monthrange(y,m)[1] if end else 1; return date(y,m,d)
    return datetime.strptime(s,'%Y-%m-%d').date()
snap_date=normalize_date(AS_OF)
date_errors=[]
for e in entities:
    vf,vt=e['validity']['from'],e['validity']['to']
    try:
        a=normalize_date(vf); b=normalize_date(vt,True)
        if a and b and a>b: date_errors.append(f"{e['id']}: valid_from > valid_to")
        if a and a>snap_date: date_errors.append(f"{e['id']}: begins after snapshot")
        if b and b<snap_date: date_errors.append(f"{e['id']}: ended before snapshot")
    except Exception as ex: date_errors.append(f"{e['id']}: {ex}")
for r in relations:
    try:
        a=normalize_date(r['valid_from']); b=normalize_date(r['valid_to'],True)
        if a and b and a>b: date_errors.append(f"{r['id']}: valid_from > valid_to")
        if a and a>snap_date: date_errors.append(f"{r['id']}: relation begins after snapshot")
        if b and b<snap_date: date_errors.append(f"{r['id']}: relation ended before snapshot")
    except Exception as ex: date_errors.append(f"{r['id']}: {ex}")

# source adequacy: high certainty records must have source; all entities source or issue
source_errors=[]
for e in entities:
    if not e['sources'] and not e['issue_ids']: source_errors.append(f"{e['id']}: no source and no issue")
    if e['certainty']['overall']=='high' and not e['sources']: source_errors.append(f"{e['id']}: high certainty without source")
for r in relations:
    if r['certainty']=='high' and not r['sources']: source_errors.append(f"{r['id']}: high relation without source")
for a in spatial:
    if a['certainty']=='high' and not a['sources']: source_errors.append(f"{a['id']}: high spatial assertion without source")

# explicit historical tests
relset={(r['subject_id'],r['type'],r['object_id']):r for r in relations}
def test(name, cond, detail): return {'id':name,'passed':bool(cond),'detail':detail}
E={e['id']:e for e in entities}
tests=[]
tests.append(test('HT01_BAVARIA_NOT_FRANCE','FRA_EMPIRE' not in E['BAV_KINGDOM']['sovereignty']['holder_ids'],'Bavaria sovereignty holder is not France'))
tests.append(test('HT02_BAVARIA_MEMBER_RHINE',('BAV_KINGDOM','member_of','CONF_RHINE') in relset,'Bavaria member_of Rhine Confederation'))
tests.append(test('HT03_RHINE_NOT_OWNER_BAVARIA',('BAV_KINGDOM','territorial_component_of','CONF_RHINE') not in relset and 'BAV_KINGDOM' not in E['CONF_RHINE']['sovereignty']['holder_ids'],'Rhine Confederation does not own Bavaria'))
tests.append(test('HT04_CATALONIA_NOT_FRANCE_COMPONENT',('CAT_SPECIAL','territorial_component_of','FRA_EMPIRE') not in relset,'Catalonia is not a territorial_component_of France'))
tests.append(test('HT05_CATALONIA_ADMIN_FRANCE',('CAT_SPECIAL','administered_by','FRA_EMPIRE') in relset,'Catalonia administered_by France'))
tests.append(test('HT06_AUSTRIA_FR_ALLY',('FRA_EMPIRE','military_alliance_with','AUT_EMPIRE') in relset or ('AUT_EMPIRE','military_alliance_with','FRA_EMPIRE') in relset,'Austria has treaty alliance with France'))
tests.append(test('HT07_PRUSSIA_FR_ALLY',('FRA_EMPIRE','military_alliance_with','PRU_KINGDOM') in relset or ('PRU_KINGDOM','military_alliance_with','FRA_EMPIRE') in relset,'Prussia has treaty alliance with France'))
tests.append(test('HT08_AUSTRIA_NOT_DYNASTIC_CLIENT','dynastic_client' not in E['AUT_EMPIRE']['napoleonic_relation']['integration_modes'],'Austria is not dynastic_client'))
tests.append(test('HT09_PRUSSIA_NOT_DYNASTIC_CLIENT','dynastic_client' not in E['PRU_KINGDOM']['napoleonic_relation']['integration_modes'],'Prussia is not dynastic_client'))
tests.append(test('HT10_RUSSIA_PREWAR',E['RUS_EMPIRE']['napoleonic_relation']['war_status']=='prewar_adversary','Russia war_status is prewar_adversary'))
tests.append(test('HT11_FR_RUS_NOT_AT_WAR',('FRA_EMPIRE','at_war_with','RUS_EMPIRE') not in relset and ('RUS_EMPIRE','at_war_with','FRA_EMPIRE') not in relset,'No France-Russia at_war_with relation on 1812-06-01'))
tests.append(test('HT12_JOSEPH_NOT_FULL_CONTROL',E['ESP_JOSEPH']['effective_control']['status']!='full','Joseph Spain control is fragmented'))
tests.append(test('HT13_WARSAW_NOT_FRANCE',('WARSAW_GD','territorial_component_of','FRA_EMPIRE') not in relset,'Warsaw is not France'))
tests.append(test('HT14_ILLYRIA_FRENCH_SOV','FRA_EMPIRE' in E['FRA_ILLYRIA']['sovereignty']['holder_ids'] and ('FRA_ILLYRIA','territorial_component_of','FRA_EMPIRE') in relset,'Illyria belongs to French sovereignty'))
tests.append(test('HT15_ILLYRIA_NOT_NORMAL_DEPARTMENT',E['FRA_ILLYRIA']['entity_class']!='administrative_unit' and E['FRA_ILLYRIA']['record_nature']=='historical_analytical_aggregation','Illyria is not modeled as normal department'))
tests.append(test('HT16_MALTA_CONTROL_UK','UK' in E['MALTA']['effective_control']['primary_controller_ids'],'Malta controller is UK'))
tests.append(test('HT17_MALTA_SOV_NOT_UK',not (E['MALTA']['sovereignty']['status']=='full' and E['MALTA']['sovereignty']['holder_ids']==['UK']),'Malta sovereignty is not automatically UK'))
tests.append(test('HT18_POMERANIA_OCC_FR',('SWEDISH_POMERANIA','occupied_by','FRA_EMPIRE') in relset,'Swedish Pomerania occupied by France'))
tests.append(test('HT19_POMERANIA_SOV_SWE','SWE_KINGDOM' in E['SWEDISH_POMERANIA']['sovereignty']['holder_ids'],'Swedish Pomerania sovereignty remains Swedish'))
tests.append(test('HT20_RHINE_MEMBER_COUNT',sum(1 for r in relations if r['type']=='member_of' and r['object_id']=='CONF_RHINE')==35,'Exactly 35 Rhine Confederation member relations active in dataset'))

# update source upgrade list
upgrade_sources=[s['source_id'] for s in sources if s['needs_source_upgrade']]
open_issues=[i['id'] for i in issues if i['resolution_status'] in ('open','blocked')]
provisional_issues=[i['id'] for i in issues if i['resolution_status']=='provisionally_resolved']

report={
 'schema_version':SCHEMA_VERSION,'snapshot_id':SNAPSHOT_ID,'validated_at':ACCESSED,
 'summary':{'entities':len(entities),'persons':len(persons),'relations':len(relations),'spatial_assertions':len(spatial),'sources':len(sources),'issues':len(issues),'rheinbund_members':sum(1 for r in relations if r['type']=='member_of' and r['object_id']=='CONF_RHINE')},
 'schema_validation':{'draft':'2020-12','errors':schema_errors,'passed':len(schema_errors)==0},
 'referential_integrity':{'missing_references':missing,'duplicate_id_errors':unique_errors,'passed':not missing and not unique_errors},
 'date_validation':{'errors':date_errors,'passed':not date_errors,'snapshot_date':AS_OF},
 'source_validation':{'errors':source_errors,'needs_source_upgrade':upgrade_sources,'passed_core_checks':not source_errors},
 'historical_tests':{'passed':sum(1 for t in tests if t['passed']),'failed':sum(1 for t in tests if not t['passed']),'tests':tests},
 'open_issues':open_issues,'provisionally_resolved_issues':provisional_issues,
 'corrections_from_phase4':[
  {'id':'CORR_RHINE_COUNT','description':'L’audit Fase 5.1 conferma 35 membri al 1 giugno 1812: Pyrmont aderisce autonomamente il 18 aprile 1807 ed è distinto da Waldeck nello snapshot.'},
  {'id':'CORR_WALDECK_PYRMONT','description':'Pyrmont è separato da Waldeck al 1 giugno 1812 ed è membro autonomo del Rheinbund dal 18 aprile 1807; la personal union segue la successione del settembre 1812.'},
  {'id':'CORR_ANDORRA','description':'Andorra non è più modellata come microstato invariato: l’inclusione nel Département du Sègre è documentata ma la piena implementazione è controversa, quindi lo status è contestato/transitorio.'},
  {'id':'CORR_COSPAIA','description':'Cospaia non è modellata come repubblica indipendente nel 1812: il profilo archivistico indica reggenza imperiale francese 1809-1814; resta come località storica interna al blocco ex pontificio.'}
 ],
 'geometry_check':{'geometry_ids_non_null':sum(1 for a in spatial if a['geometry_id'] is not None),'passed':all(a['geometry_id'] is None for a in spatial)},
 'readiness':{'ready_for_geometry_planning':False,'reason':'La struttura e i test core sono validabili, ma prima della pianificazione geometrica devono essere migliorate le fonti contrassegnate needs_source_upgrade e vanno affrontati gli issue aperti che incidono su status/ambito territoriale (in particolare Hannover, Pontecorvo, Ionie, Andorra/Helgoland come casi da mantenere esplicitamente incerti).'}
}
# If all machine integrity tests pass, structure is ready, but historical source issues still prevent geometry readiness.
dump(D/'validation-report.json',report)

# README/support summary
readme=f'''# GB-Atlante — MAP_10 dataset

Snapshot: **1812-06-01**  \nSchema: **{SCHEMA_VERSION}**

Questo pacchetto contiene dati politici e territoriali senza geometrie. Tutti i `geometry_id` sono `null`.

Record generati dal build: {len(entities)} entità, {len(persons)} persone, {len(relations)} relazioni, {len(spatial)} spatial assertions, {len(sources)} fonti, {len(issues)} issues.

## FASE 5.1 — AUDIT CORRECTIONS

- Rheinbund: **35 membri attivi al 1 giugno 1812**. Waldeck e Pyrmont sono due entità statuali distinte nello snapshot ed entrambe aderenti; Pyrmont aderisce il 18 aprile 1807 sotto Georg.
- Validator: ricalcola JSON Schema, integrità referenziale, date, vocabolari, semantica delle relazioni, geometry_id, qualità fonti e test storici direttamente dai JSON correnti. Non legge il report precedente come fonte di verità.
- Mutation tests: cinque corruzioni temporanee (sovranità Baviera, entità mancante, geometry_id non nullo, enum invalido, relazione futura) devono essere tutte respinte.
- Build: percorso relativo a `tools/build_map10.py`; nessuna dipendenza da `/mnt/data`.
- Policy fonti/certainty: `high` richiede almeno una fonte `primary_direct`/`high` oppure due fonti `medium` indipendenti; le fonti `needs_source_upgrade` sono sempre segnalate.
- Fonti rafforzate: Isole Ionie (Henry Holland, 1815), Helgoland (Landesarchiv Schleswig-Holstein), Lucca-Piombino (SIAS specifico), San Marino (Governo), Hannover (Niedersächsisches Landesarchiv), Erfurt (Landesarchiv Thüringen).
- Problemi ancora aperti: titolare preciso di Pontecorvo al 1 giugno 1812; OpenHistoricalMap resta una pista geometrica da verificare e non una fonte sufficiente da sola. Hannover resta prudenzialmente `provisionally_resolved` e nonspatial.

Eseguire `python tools/validate_map10.py --mutation-tests --write-report` oppure rigenerare con `python tools/build_map10.py`.
'''
(ROOT/'README-MAP_10.md').write_text(readme,encoding='utf-8')

# Run the independent validator. It must recompute the report from the current dataset
# and prove itself against temporary corrupted fixtures.
validator_path=ROOT/'tools'/'validate_map10.py'
if not validator_path.exists():
    raise FileNotFoundError(f'Validator missing: {validator_path}')
subprocess.run([sys.executable,str(validator_path),'--root',str(ROOT),'--write-report','--mutation-tests'],check=True)

# zip full corrected package next to the project directory
zip_path=ROOT.parent/'GB-Atlante_MAP_10_Fase5.1.zip'
with zipfile.ZipFile(zip_path,'w',zipfile.ZIP_DEFLATED) as z:
    for fp in ROOT.rglob('*'):
        if fp.is_file() and '__pycache__' not in fp.parts and fp.suffix != '.pyc': z.write(fp, fp.relative_to(ROOT.parent))

final_report=json.loads((D/'validation-report.json').read_text(encoding='utf-8'))
print(json.dumps({
  'version':SCHEMA_VERSION,
  'entities':final_report['summary']['entities'],
  'persons':final_report['summary']['persons'],
  'relations':final_report['summary']['relations'],
  'spatial_assertions':final_report['summary']['spatial_assertions'],
  'sources':final_report['summary']['sources'],
  'issues':final_report['summary']['issues'],
  'rheinbund_members':final_report['summary']['rheinbund_members'],
  'historical_tests':final_report['historical_tests'],
  'mutation_tests':final_report['mutation_tests'],
  'valid':final_report['valid'],
  'zip':str(zip_path)
},ensure_ascii=False,indent=2))
