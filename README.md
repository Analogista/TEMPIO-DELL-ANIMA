# Tempio dell'Anima

Applicazione React/Vite di Graziamaria per costellazioni familiari, fiori di Bach, rune e candidature ai percorsi.

## Progetto Firebase

Questa versione usa il nuovo progetto Firebase `app-utili-508807` e il database `ai-studio-remixrisolutrice-4e2bf75f-faba-438e-9632-9bbfc8819085`.

URL pubblico attuale dell'app: `https://tempio.ai.studio` (il dominio `tempiodellanima.ai.studio` resta autorizzato per il servizio esistente).

> **Attenzione: risorse condivise e regole da riconciliare.** Il bucket Storage `app-utili-508807.firebasestorage.app` è condiviso con altre app. Le regole Storage presenti in questo repository non corrispondono a quelle attualmente pubblicate: in particolare, qui manca il percorso `/photos`, usato da un'altra app, mentre qui è definito `/constellations`. Non distribuire le regole di questo repository finché le dipendenze dell'altra app non sono state verificate e le regole repo e live non sono state riconciliate e testate. La distribuzione potrebbe interrompere caricamenti o accessi di altre app.

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

Il comando seguente distribuisce regole e indici Firestore e regole Storage al progetto selezionato. Eseguirlo solo dopo aver verificato le risorse condivise e confrontato le regole locali con quelle live; non usarlo come deploy generico di Tempio.

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
