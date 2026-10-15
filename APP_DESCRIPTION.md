# Progetto: Risolutrice dell'Invisibile - Architettura & Logica

## 1. Visione e Scopo
L'applicazione è il "Laboratorio Alchemico Digitale" di Graziamaria. Non è un semplice sito web, ma un ponte tra il contatto sporadico (WhatsApp) e un percorso di guarigione strutturato. Serve a qualificare i lead, raccogliere materiale visivo (i piedi) e fornire strumenti di auto-analisi immediata (Rune, Fiori, Costellazioni).

## 2. Architettura Tecnica
- **Frontend**: React 18 + Tailwind CSS (Design pulito, "Swiss/Modern" con tocchi dorati/beige).
- **Backend/Database**: Firebase (Authentication per i profili, Firestore per i dati, Storage per le foto dei piedi).
- **AI Engine**: Google Gemini API (utilizzata per "interpretazioni" e sintesi).

## 3. Flussi Principali (User Experience)

### A. Area Pubblica (Ingaggio)
- **Strumenti di Divinazione**: Rune, Fiori di Bach, Costellazioni Familiari. Sono "micro-app" interattive che l'utente può usare per avere un'indicazione immediata.
- **Anamnesi Alchemica**: Call-to-action principale per inviare la candidatura formale.

### B. Area Profilo (Diario Evolutivo)
- **Storico**: Ogni lettura effettuata viene salvata nel database e mostrata all'utente come un diario privato.
- **Portale Visivo**: Sezione dove l'utente vede le foto caricate e lo stato della propria analisi.

### C. Sistema di Candidatura (Anamnesi)
- Raccolta dati anagrafici + "Punto di Rottura" (stato emotivo).
- Caricamento di 2 foto delle piante dei piedi.
- Logica di pre-compilazione: l'app riconosce se l'utente ha già caricato foto o dati nel profilo e li suggerisce nel modulo.

## 4. Area Admin (Dashboard Graziamaria)
- **Gestione Clienti**: Lista di tutti gli iscritti.
- **Analisi Portali**: Visualizzazione delle foto caricate dai clienti con i relativi dati dell'anamnesi.
- **Smart View**: Integrazione dei risultati delle Rune/Fiori del cliente per avere un quadro completo prima della seduta.

## 5. Logica di Evoluzione (Prossime Feature)
1. **Semaforo dell'Anima**: Analisi semantica delle risposte del questionario tramite AI per evidenziare urgenze, lamentosità o manipolazioni (Anti-Stanchezza).
2. **Integrazione Pagamenti**: Blocco del modulo dietro pagamento Stripe/PayPal per automazione tariffe.
3. **Messaggio Alchemico (Audio)**: Possibilità per GM di rispondere alle analisi caricando un file audio direttamente in app.
