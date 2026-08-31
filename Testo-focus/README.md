# Testo-Focus

Testo-Focus è una PWA statica per l’analisi visuale e concettuale di testi letterari, storici, filosofici e documentari. Il motore dell’app è separato dai contenuti: ogni nuovo testo è un dataset JSON autonomo e l’indice viene generato da `data/catalog.json`.

## Struttura

```text
Testo-focus/
├── index.html
├── assets/
│   ├── css/styles.css
│   ├── js/app.js
│   └── icons/
├── data/
│   ├── catalog.json
│   └── texts/
│       └── dimostrazione-tecnica.json
├── manifest.webmanifest
├── service-worker.js
└── README.md
```

La home è generica. `dimostrazione-tecnica.json` contiene soltanto frasi neutre inventate e serve a collaudare il motore; non compare tra le opere della biblioteca.

## Aggiungere un nuovo testo

1. Copiare il modello seguente in `data/texts/` usando un nome breve, minuscolo e senza spazi, per esempio `leopardi-infinito.json`.
2. Suddividere il testo in unità logiche e assegnare a ciascuna un `id` univoco.
3. Definire i focus e collegarli alle unità tramite `segments`.
4. Aggiungere una voce a `data/catalog.json` con lo stesso `id` e il percorso del dataset.
5. Pubblicare le modifiche. Non occorre intervenire su `index.html` o su `app.js`.

## Modello del dataset

```json
{
  "schemaVersion": 1,
  "metadata": {
    "id": "id-univoco",
    "title": "Titolo del testo",
    "author": "Autore",
    "work": "Opera di appartenenza, se utile",
    "discipline": "Letteratura",
    "period": "Ottocento",
    "description": "Descrizione breve",
    "lessonUrl": "https://indirizzo-della-pwa-completa/"
  },
  "presentation": {
    "overviewTitle": "Titolo della visione generale",
    "overview": "Sintesi mostrata quando è attivo Testo intero."
  },
  "units": [
    { "id": "v01", "type": "line", "text": "Prima unità del testo" },
    { "id": "p02", "type": "paragraph", "text": "Seconda unità del testo." }
  ],
  "focuses": [
    {
      "id": "memoria",
      "label": "Memoria",
      "segments": [
        { "unitId": "v01", "note": "Spiegazione puntuale del primo passaggio." },
        { "unitId": "p02", "note": "Spiegazione puntuale del secondo passaggio." }
      ],
      "explanation": "Spiegazione sintetica del focus.",
      "connections": [
        { "category": "Immagine del mondo", "text": "Collegamento pertinente." },
        { "category": "Poetica", "text": "Altro collegamento pertinente." }
      ]
    }
  ]
}
```

### Tipi di unità

- `line`: verso, riga o battuta; viene mostrato come unità autonoma.
- `paragraph`: paragrafo o periodo; occupa tutta la larghezza disponibile.
- `label`: etichetta interna, numero di strofa o intestazione.

I focus non hanno categorie obbligatorie. `connections` può contenere Fratture, Poetica e Immagine del mondo, oppure categorie adatte a testi storici, filosofici o documentari. Le connessioni vuote vanno omesse.

## Voce nel catalogo

`data/catalog.json` contiene un array `texts`. Ogni voce usa questa forma:

```json
{
  "id": "id-univoco",
  "title": "Titolo del testo",
  "author": "Autore",
  "discipline": "Letteratura",
  "period": "Ottocento",
  "category": "Poesia",
  "description": "Descrizione breve per l’indice.",
  "dataPath": "./data/texts/nome-file.json",
  "lessonUrl": "https://indirizzo-della-pwa-completa/",
  "cover": "./assets/covers/immagine.webp"
}
```

`lessonUrl` e `cover` sono facoltativi. Il collegamento alla lezione completa viene attivato soltanto quando `lessonUrl` è presente. L’app accetta URL condivisibili nella forma `?text=id-univoco`.

## Cache e aggiornamenti

La shell dell’app viene conservata per l’uso offline. I dataset visitati vengono memorizzati e aggiornati in sottofondo. Il catalogo usa invece una strategia *network first*: quando la rete è disponibile viene sempre richiesta la versione più recente, evitando che i nuovi testi restino nascosti dietro una cache obsoleta.

Quando si modifica un file della shell (`index.html`, CSS, JavaScript, manifest o icone), incrementare `CACHE_VERSION` in `service-worker.js` e il parametro `?v=` dei file modificati in `index.html` e in `APP_SHELL`. Non è necessario farlo quando si aggiunge soltanto un nuovo dataset o si aggiorna `catalog.json`.
