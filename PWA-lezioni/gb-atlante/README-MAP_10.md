# GB-Atlante — MAP_10 dataset

Snapshot: **1812-06-01**  
Schema: **GBATLANTE_MAP10_1.0.1**

Questo pacchetto contiene dati politici e territoriali senza geometrie. Tutti i `geometry_id` sono `null`.

Record generati dal build: 126 entità, 66 persone, 155 relazioni, 38 spatial assertions, 43 fonti, 17 issues.

## FASE 5.1 — AUDIT CORRECTIONS

- Rheinbund: **35 membri attivi al 1 giugno 1812**. Waldeck e Pyrmont sono due entità statuali distinte nello snapshot ed entrambe aderenti; Pyrmont aderisce il 18 aprile 1807 sotto Georg.
- Validator: ricalcola JSON Schema, integrità referenziale, date, vocabolari, semantica delle relazioni, geometry_id, qualità fonti e test storici direttamente dai JSON correnti. Non legge il report precedente come fonte di verità.
- Mutation tests: cinque corruzioni temporanee (sovranità Baviera, entità mancante, geometry_id non nullo, enum invalido, relazione futura) devono essere tutte respinte.
- Build: percorso relativo a `tools/build_map10.py`; nessuna dipendenza da `/mnt/data`.
- Policy fonti/certainty: `high` richiede almeno una fonte `primary_direct`/`high` oppure due fonti `medium` indipendenti; le fonti `needs_source_upgrade` sono sempre segnalate.
- Fonti rafforzate: Isole Ionie (Henry Holland, 1815), Helgoland (Landesarchiv Schleswig-Holstein), Lucca-Piombino (SIAS specifico), San Marino (Governo), Hannover (Niedersächsisches Landesarchiv), Erfurt (Landesarchiv Thüringen).
- Problemi ancora aperti: titolare preciso di Pontecorvo al 1 giugno 1812; OpenHistoricalMap resta una pista geometrica da verificare e non una fonte sufficiente da sola. Hannover resta prudenzialmente `provisionally_resolved` e nonspatial.

Eseguire `python tools/validate_map10.py --mutation-tests --write-report` oppure rigenerare con `python tools/build_map10.py`.
