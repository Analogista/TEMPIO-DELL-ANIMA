# Tempio dell'Anima

Applicazione React/Vite di Graziamaria per costellazioni familiari, fiori di Bach, rune e candidature ai percorsi.

## Progetto Firebase

Questa versione usa il nuovo progetto Firebase `app-utili-508807` e il database `ai-studio-remixrisolutrice-4e2bf75f-faba-438e-9632-9bbfc8819085`.

Prima del deploy verificare nella console Firebase:

- Google Authentication attiva;
- Firestore attivo sul database indicato;
- Storage attivo;
- dominio `tempiodellanima.ai.studio` autorizzato in Authentication;
- gli account admin verificati corrispondono a quelli presenti nelle regole.

## Sviluppo e verifica

```bash
npm ci
npm run lint
npm run build
npm run dev
```

## Deploy delle risorse Firebase

Dopo aver eseguito il login con un account autorizzato al progetto:

```bash
npx firebase-tools login
npx firebase-tools use app-utili-508807
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage
```

Le regole limitano le candidature ai dati dell'utente autenticato, l'area admin agli account autorizzati e le foto a immagini inferiori a 10 MB nel percorso personale dell'utente. Non attivare la modalità di test di Storage in produzione.

## Candidature

Una candidatura salva `status: "pending"`, `createdAt` e `photoUrls`. Profilo, copia globale e copia personale vengono scritti con un unico batch Firestore dopo il caricamento delle foto.

## Build applicativa

La build di produzione viene generata in `dist/` con:

```bash
npm run build
```

La pubblicazione su Google AI Studio/Cloud Run deve usare questa build. Dopo il deploy verificare login Google, una lettura, candidatura con due foto, apertura WhatsApp e area admin.
