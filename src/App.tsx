import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  X, 
  ChevronDown, 
  Share2, 
  FileText, 
  Heart, 
  Frown,
  Info,
  Search,
  Filter,
  Download,
  Check,
  Sparkles,
  BookOpen,
  MessageCircle,
  Upload,
  Camera,
  Shield,
  User as UserIcon,
  Users,
  Clock,
  Eye,
  CheckCircle2,
  Circle,
  Save,
  ClipboardList
} from 'lucide-react';
import { BACH_FLOWERS, type BachFlower } from './constants/bachFlowers';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  type User
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  collection, 
  addDoc, 
  getDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage, handleFirestoreError } from './lib/firebase';

// Types for our game
type CharacterType = {
  id: string;
  shape: 'conical-large' | 'conical-medium' | 'cylindrical-large' | 'cylindrical-medium' | 'cylindrical-small' | 'flat-large' | 'flat-medium' | 'block';
  color: string;
  label: string;
  x: number;
  y: number;
  feeling?: 'piacevole' | 'spiacevole';
  memory?: string;
};

type RuneType = {
  id: number;
  name: string;
  meaning: string;
};

const RUNES: RuneType[] = [
  { id: 1, name: 'Fehu', meaning: 'Ricchezza, Abbondanza' },
  { id: 2, name: 'Uruz', meaning: 'Forza, Salute' },
  { id: 3, name: 'Thurisaz', meaning: 'Protezione, Conflitto' },
  { id: 4, name: 'Ansuz', meaning: 'Comunicazione, Saggezza' },
  { id: 5, name: 'Raido', meaning: 'Viaggio, Cambiamento' },
  { id: 6, name: 'Kaunaz', meaning: 'Conoscenza, Illuminazione' },
  { id: 7, name: 'Gebo', meaning: 'Dono, Relazione' },
  { id: 8, name: 'Wunjo', meaning: 'Gioia, Successo' },
  { id: 9, name: 'Hagalaz', meaning: 'Distruzione, Rinascita' },
  { id: 10, name: 'Nauthiz', meaning: 'Bisogno, Resistenza' },
  { id: 11, name: 'Isa', meaning: 'Ghiaccio, Stasi' },
  { id: 12, name: 'Jera', meaning: 'Raccolto, Ciclo' },
  { id: 13, name: 'Eihwaz', meaning: 'Resilienza, Trasformazione' },
  { id: 14, name: 'Perthro', meaning: 'Mistero, Destino' },
  { id: 15, name: 'Algiz', meaning: 'Protezione Divina' },
  { id: 16, name: 'Sowilo', meaning: 'Sole, Vittoria' },
  { id: 17, name: 'Tiwaz', meaning: 'Giustizia, Sacrificio' },
  { id: 18, name: 'Berkano', meaning: 'Crescita, Rinascita' },
  { id: 19, name: 'Ehwaz', meaning: 'Movimento, Fiducia' },
  { id: 20, name: 'Mannaz', meaning: 'Umanità, Sé' },
  { id: 21, name: 'Laguz', meaning: 'Acqua, Intuizione' },
  { id: 22, name: 'Ingwaz', meaning: 'Fertilità, Pace' },
  { id: 23, name: 'Dagaz', meaning: 'Giorno, Risveglio' },
  { id: 24, name: 'Othala', meaning: 'Eredità, Casa' }
];

const CHARACTER_SHAPES = [
  // Row 1
  { shape: 'cylindrical-medium', color: '#d2b48c' },
  { shape: 'cylindrical-medium', color: '#d2b48c' },
  { shape: 'cylindrical-medium', color: '#d2b48c' },
  { shape: 'conical-large', color: '#d2b48c' },
  { shape: 'conical-large', color: '#d2b48c' },
  { shape: 'conical-large', color: '#d2b48c' },
  { shape: 'conical-large', color: '#d2b48c' },
  { shape: 'cylindrical-small', color: '#d2b48c' },
  { shape: 'cylindrical-small', color: '#d2b48c' },
  // Row 2
  { shape: 'conical-medium', color: '#d2b48c' },
  { shape: 'conical-medium', color: '#d2b48c' },
  { shape: 'conical-medium', color: '#d2b48c' },
  { shape: 'cylindrical-large', color: '#d2b48c' },
  { shape: 'cylindrical-large', color: '#d2b48c' },
  { shape: 'cylindrical-large', color: '#d2b48c' },
  { shape: 'cylindrical-large', color: '#d2b48c' },
  { shape: 'block', color: '#d2b48c' },
  { shape: 'block', color: '#d2b48c' },
  { shape: 'block', color: '#d2b48c' },
  { shape: 'block', color: '#d2b48c' },
  // Row 3
  { shape: 'flat-large', color: '#d2b48c' },
  { shape: 'flat-large', color: '#d2b48c' },
  { shape: 'flat-medium', color: '#d2b48c' },
  { shape: 'flat-medium', color: '#d2b48c' },
  { shape: 'cylindrical-large', color: '#ef4444' }, // Red
  { shape: 'cylindrical-large', color: '#ffffff' }, // White
  { shape: 'cylindrical-large', color: '#22c55e' }, // Green
  { shape: 'cylindrical-large', color: '#000000' }, // Black
  { shape: 'cylindrical-large', color: '#3b82f6' }, // Blue
  { shape: 'cylindrical-large', color: '#f97316' }, // Orange
] as const;

const PREDEFINED_LABELS = [
  "Io", "Mamma", "Papà", "Fratello", "Sorella", "Nonno", "Nonna", 
  "Partner", "Figlio", "Figlia", "Amico", "Lavoro", "Paura", "Sogno"
];

export default function App() {
  const [characters, setCharacters] = useState<CharacterType[]>([]);
  const [drawingCharacter, setDrawingCharacter] = useState<{ shape: string, color: string } | null>(null);
  const [tempLabel, setTempLabel] = useState('');
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [workflowStep, setWorkflowStep] = useState(0); // 0: Placement, 1: Analysis
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [analyzingCharacter, setAnalyzingCharacter] = useState<CharacterType | null>(null);
  const [tempMemory, setTempMemory] = useState('');
  const [tempFeeling, setTempFeeling] = useState<'piacevole' | 'spiacevole' | null>(null);
  const [userData, setUserData] = useState({
    nome: '',
    eta: '',
    sesso: '',
    domandaRune: ''
  });
  const [currentPage, setCurrentPage] = useState<'home' | 'costellazioni' | 'fiori' | 'rune' | 'percorsi' | 'profile' | 'admin'>('home');
  const [adminData, setAdminData] = useState<{ candidacies: any[], readings: any[] }>({ candidacies: [], readings: [] });
  const [selectedCandidacies, setSelectedCandidacies] = useState<string[]>([]);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showCandidacyModal, setShowCandidacyModal] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<'standard' | 'complex' | null>(null);
  const [candidacyForm, setCandidacyForm] = useState({
    nome: '',
    email: '',
    telefono: '',
    eta: '',
    citta: '',
    puntoRottura: '',
    radiceTempo: 'meno_mese',
    termometroUrgenza: 5,
    obiettivoProfondo: 'sollievo',
    pattoFiducia: false,
    rispettoSpazioSacro: false,
    portaleVisivo: false,
    message: '',
  });
  const [candidacyFiles, setCandidacyFiles] = useState<File[]>([]);
  const [isSubmittingCandidacy, setIsSubmittingCandidacy] = useState(false);
  const [userCandidacies, setUserCandidacies] = useState<any[]>([]);
  const [runeHistory, setRuneHistory] = useState<any[]>([]);
  const [flowerHistory, setFlowerHistory] = useState<any[]>([]);
  const [constellationHistory, setConstellationHistory] = useState<any[]>([]);

  const openCandidacyModal = () => {
    const prefilled = {
      ...candidacyForm,
      nome: userProfile?.nome || candidacyForm.nome,
      email: userProfile?.email || user?.email || candidacyForm.email,
      citta: userProfile?.citta || candidacyForm.citta,
      eta: userProfile?.eta || candidacyForm.eta,
      telefono: userProfile?.telefono || candidacyForm.telefono,
      portaleVisivo: (userProfile?.photoUrls?.length || 0) > 0
    };
    setCandidacyForm(prefilled);
    setShowCandidacyModal(true);
  };

  const fetchHistory = async (uid: string) => {
    try {
      // Rune readings
      const rQuery = query(collection(db, 'users', uid, 'runeReadings'), orderBy('timestamp', 'desc'));
      const rSnap = await getDocs(rQuery);
      setRuneHistory(rSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // Flower readings
      const fQuery = query(collection(db, 'users', uid, 'flowerReadings'), orderBy('timestamp', 'desc'));
      const fSnap = await getDocs(fQuery);
      setFlowerHistory(fSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // Constellations
      const cQuery = query(collection(db, 'users', uid, 'constellations'), orderBy('timestamp', 'desc'));
      const cSnap = await getDocs(cQuery);
      setConstellationHistory(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Error fetching history:", e);
    }
  };

  const fetchAdminData = async () => {
    if (!isAdmin) return;
    setIsAdminLoading(true);
    try {
      const cSnap = await getDocs(query(collection(db, 'candidacies'), orderBy('createdAt', 'desc')));
      const rSnap = await getDocs(query(collection(db, 'allReadings'), orderBy('timestamp', 'desc')));
      setAdminData({
        candidacies: cSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        readings: rSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      });
    } catch (e) {
      console.error("Admin Fetch Error:", e);
    } finally {
      setIsAdminLoading(false);
    }
  };

  const updateCandidacyNote = async (id: string, note: string) => {
    try {
      await updateDoc(doc(db, 'candidacies', id), { adminNote: note });
      setAdminData(prev => ({
        ...prev,
        candidacies: prev.candidacies.map(c => c.id === id ? { ...c, adminNote: note } : c)
      }));
    } catch (e) {
      console.error("Error updating note:", e);
      alert("Errore nel salvataggio della nota.");
    }
  };

  const deleteCandidacy = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questa candidatura?")) return;
    try {
      await deleteDoc(doc(db, 'candidacies', id));
      setAdminData(prev => ({
        ...prev,
        candidacies: prev.candidacies.filter(c => c.id !== id)
      }));
      setSelectedCandidacies(prev => prev.filter(sid => sid !== id));
    } catch (e) {
      console.error("Error deleting candidacy:", e);
      alert("Errore nell'eliminazione.");
    }
  };

  const bulkDeleteCandidacies = async () => {
    if (selectedCandidacies.length === 0) return;
    if (!confirm(`Sei sicuro di voler eliminare ${selectedCandidacies.length} candidature?`)) return;
    
    try {
      const batch = writeBatch(db);
      selectedCandidacies.forEach(id => {
        batch.delete(doc(db, 'candidacies', id));
      });
      await batch.commit();
      
      setAdminData(prev => ({
        ...prev,
        candidacies: prev.candidacies.filter(c => !selectedCandidacies.includes(c.id))
      }));
      setSelectedCandidacies([]);
    } catch (e) {
      console.error("Error bulk deleting:", e);
      alert("Errore nell'eliminazione multipla.");
    }
  };

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        fetchHistory(u.uid);
        // Create/Update public profile
        const profileRef = doc(db, 'users', u.uid, 'profile', 'data');
        try {
          const profileDoc = await getDoc(profileRef);
          if (!profileDoc.exists()) {
            await setDoc(profileRef, {
              nome: u.displayName || 'Utente',
              email: u.email,
              updatedAt: serverTimestamp()
            });
          }
        } catch (error) {
          console.error("Error updating profile:", error);
        }

        // Fetch User Candidacies
        try {
          const q = query(
            collection(db, 'users', u.uid, 'candidacies'),
            orderBy('createdAt', 'desc')
          );
          const snapshot = await getDocs(q);
          const candidacies = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setUserCandidacies(candidacies);
        } catch (e) {
          console.error("Error fetching candidacies:", e);
        }
      } else {
        setUserCandidacies([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    setIsLoggingIn(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login Error:", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = () => signOut(auth);

  // Admin logic
  const isAdmin = user?.email === 'analogistabrindisi@gmail.com' || user?.email === 'infantinograziamaria@gmail.com';
  const [userProfile, setUserProfile] = useState<any>(null);

  // Load user profile
  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'users', user.uid, 'profile', 'data'));
        if (docSnap.exists()) {
          const profile = docSnap.data();
          setUserProfile(profile);
          // Sync userData state
          setUserData(prev => ({
            ...prev,
            nome: profile.nome || prev.nome,
            eta: profile.eta || prev.eta
          }));
          // Sync candidacy form with profile if form is empty
          if (!candidacyForm.nome && profile.nome) {
            setCandidacyForm(prev => ({
              ...prev,
              nome: profile.nome,
              email: profile.email || user.email,
              telefono: profile.telefono || '',
              eta: profile.eta,
              citta: profile.citta,
              puntoRottura: profile.puntoRottura
            }));
          }
        }
      } catch (e) {
        console.error("Error loading profile:", e);
      }
    };
    loadProfile();
  }, [user]);

  const saveRuneReading = async (question: string, runeIds: number[]) => {
    if (!user) return;
    try {
      const selectedRunesNames = RUNES.filter(r => runeIds.includes(r.id)).map(r => r.name);
      const dataToSave = {
        question,
        runeIds,
        runeNames: selectedRunesNames,
        userName: userProfile?.nome || user.displayName,
        userEmail: user.email,
        timestamp: serverTimestamp()
      };
      await addDoc(collection(db, 'users', user.uid, 'runeReadings'), dataToSave);
      // Global collection for Admin
      await addDoc(collection(db, 'allReadings'), { ...dataToSave, type: 'rune', userId: user.uid });
    } catch (e) {
      handleFirestoreError(e, 'create', `users/${user.uid}/runeReadings`);
    }
  };

  const saveFlowerReading = async (flowerIds: number[]) => {
    if (!user) return;
    try {
      const selectedFlowerNames = BACH_FLOWERS.filter(f => flowerIds.includes(f.id)).map(f => f.name);
      const dataToSave = {
        flowerIds,
        flowerNames: selectedFlowerNames,
        userName: userProfile?.nome || user.displayName,
        userEmail: user.email,
        timestamp: serverTimestamp()
      };
      await addDoc(collection(db, 'users', user.uid, 'flowerReadings'), dataToSave);
      await addDoc(collection(db, 'allReadings'), { ...dataToSave, type: 'flower', userId: user.uid });
    } catch (e) {
      handleFirestoreError(e, 'create', `users/${user.uid}/flowerReadings`);
    }
  };

  const saveConstellation = async (chars: CharacterType[]) => {
    if (!user) return;
    try {
      const characterLabels = chars.map(c => c.label).filter(Boolean);
      const dataToSave = {
        characters: chars,
        labels: characterLabels,
        userData,
        userName: userProfile?.nome || user.displayName,
        userEmail: user.email,
        timestamp: serverTimestamp()
      };
      await addDoc(collection(db, 'users', user.uid, 'constellations'), dataToSave);
      await addDoc(collection(db, 'allReadings'), { ...dataToSave, type: 'constellation', userId: user.uid });
    } catch (e) {
      handleFirestoreError(e, 'create', `users/${user.uid}/constellations`);
    }
  };

  const submitCandidacy = async () => {
    if (!user) {
      alert("Per favore, effettua l'accesso per candidarti.");
      login();
      return;
    }

    let profilePhotoUrls: string[] = Array.isArray(userProfile?.photoUrls)
      ? userProfile.photoUrls.filter((url: unknown): url is string => typeof url === 'string' && url.length > 0)
      : [];
    try {
      const freshProfile = await getDoc(doc(db, 'users', user.uid, 'profile', 'data'));
      if (freshProfile.exists()) {
        const freshPhotoUrls = freshProfile.data().photoUrls;
        if (Array.isArray(freshPhotoUrls)) {
          profilePhotoUrls = freshPhotoUrls.filter((url: unknown): url is string => typeof url === 'string' && url.length > 0);
        }
      }
    } catch (profileError) {
      console.error('Error refreshing profile before candidacy:', profileError);
    }

    if (!candidacyForm.nome || !candidacyForm.email || !candidacyForm.telefono || !candidacyForm.puntoRottura) {
      alert("Nome, Email, Telefono e Descrizione del fastidio sono obbligatori.");
      return;
    }

    if (!candidacyForm.pattoFiducia || !candidacyForm.rispettoSpazioSacro || !candidacyForm.portaleVisivo) {
      alert("Per favore, accetta i patti di fiducia e conferma la disponibilità delle foto per procedere.");
      return;
    }

    if (profilePhotoUrls.length + candidacyFiles.length < 2) {
      alert("Per favore, carica almeno 2 foto della pianta dei tuoi piedi (sinistro e destro) per procedere.");
      return;
    }

    setIsSubmittingCandidacy(true);
    try {
      const uploadedUrls: string[] = [...profilePhotoUrls];
      
      // Upload photos to storage
      for (const file of candidacyFiles) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileRef = ref(storage, `candidacies/${user.uid}/${crypto.randomUUID()}_${safeName}`);
        try {
          const snapshot = await uploadBytes(fileRef, file);
          const url = await getDownloadURL(snapshot.ref);
          uploadedUrls.push(url);
        } catch (uploadError: any) {
          console.error("Firebase Storage Upload Error:", uploadError);
          throw new Error(`Errore caricamento foto (${file.name}): ${uploadError.message}. Verifica che Firebase Storage sia attivo nel progetto app-utili-508807.`);
        }
      }

      if (uploadedUrls.length < 2) {
        throw new Error('Sono necessarie almeno 2 foto valide della pianta dei piedi.');
      }

      // Save profile and both candidature views atomically.
      const profileData = {
        nome: candidacyForm.nome,
        email: candidacyForm.email,
        telefono: candidacyForm.telefono,
        eta: candidacyForm.eta,
        citta: candidacyForm.citta,
        puntoRottura: candidacyForm.puntoRottura,
        photoUrls: uploadedUrls,
        updatedAt: serverTimestamp()
      };
      const candidacyData = {
        ...candidacyForm,
        userId: user.uid,
        photoUrls: uploadedUrls,
        status: 'pending',
        createdAt: serverTimestamp()
      };
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', user.uid, 'profile', 'data'), profileData);
      batch.set(doc(collection(db, 'candidacies')), candidacyData);
      batch.set(doc(collection(db, 'users', user.uid, 'candidacies')), candidacyData);
      await batch.commit();
      setUserProfile(profileData);

      // Determine result
      const isComplex = candidacyForm.termometroUrgenza >= 9 || candidacyForm.radiceTempo === 'cronico';
      setSubmissionResult(isComplex ? 'complex' : 'standard');

      // WhatsApp message
      const whatsappMsg = `Ciao Graziamaria, ho appena completato il Portale Visivo e inviato la mia Candidatura.\n\nNome: ${candidacyForm.nome}\nEmail: ${candidacyForm.email}\nFastidio: ${candidacyForm.puntoRottura}\nUrgenza: ${candidacyForm.termometroUrgenza || '5'}/10\n\nHo caricato le foto delle piante dei miei piedi nel mio profilo. Attendo una tua analisi Alchemica.`;
      const whatsappUrl = `https://wa.me/393497921890?text=${encodeURIComponent(whatsappMsg)}`;
      
      // Open WhatsApp
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
      }, 1500);
      
      alert("Candidatura salvata! Ora si aprirà WhatsApp per inviare la notifica a Graziamaria. Lei ti risponderà direttamente su WhatsApp.");
      
      // Reset form but keep modal open for result screen
      setCandidacyForm({ 
        nome: '', 
        email: '', 
        telefono: '',
        puntoRottura: '',
        radiceTempo: 'meno_mese',
        termometroUrgenza: 5,
        obiettivoProfondo: 'sollievo',
        pattoFiducia: false,
        rispettoSpazioSacro: false,
        portaleVisivo: false,
        message: '' 
      });
      setCandidacyFiles([]);
    } catch (e: any) {
      console.error("Full Candidacy Submission Error:", e);
      alert(e.message || "Errore durante l'invio della candidatura. Assicurati che lo Storage sia attivo nella console Firebase.");
    } finally {
      setIsSubmittingCandidacy(false);
    }
  };

  const [selectedFlower, setSelectedFlower] = useState<BachFlower | null>(null);
  const [selectedFlowersIds, setSelectedFlowersIds] = useState<number[]>([]);
  const [selectedRunesIds, setSelectedRunesIds] = useState<number[]>([]);
  const [currentRune, setCurrentRune] = useState<RuneType | null>(null);
  const [flowerSearch, setFlowerSearch] = useState('');

  const filteredFlowers = BACH_FLOWERS.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(flowerSearch.toLowerCase()) || 
                         f.scientificName.toLowerCase().includes(flowerSearch.toLowerCase());
    return matchesSearch;
  });
  const boardRef = useRef<HTMLDivElement>(null);

  const handleDraw = () => {
    const randomShape = CHARACTER_SHAPES[Math.floor(Math.random() * CHARACTER_SHAPES.length)];
    selectCharacter(randomShape);
  };

  const selectCharacter = (char: typeof CHARACTER_SHAPES[number]) => {
    setDrawingCharacter(char);
    setShowLabelInput(true);
    setShowPicker(false);
    setTempLabel('');
  };

  const drawRune = () => {
    const randomRune = RUNES[Math.floor(Math.random() * RUNES.length)];
    setCurrentRune(randomRune);
    setSelectedRunesIds(prev => [...new Set([...prev, randomRune.id])]);
  };

  const confirmCharacter = () => {
    if (!drawingCharacter) return;
    
    const newChar: CharacterType = {
      id: Math.random().toString(36).substr(2, 9),
      shape: drawingCharacter.shape as any,
      color: drawingCharacter.color,
      label: tempLabel || "Sconosciuto",
      x: 0,
      y: 0, // Appear at the center of the board, between the platforms
    };

    setCharacters([...characters, newChar]);
    setDrawingCharacter(null);
    setShowLabelInput(false);
  };

  const removeCharacter = (id: string) => {
    if (workflowStep !== 0) return;
    setCharacters(characters.filter(c => c.id !== id));
  };

  const handleCharacterClick = (char: CharacterType) => {
    if (workflowStep !== 1) return;
    if (char.label.toLowerCase() === 'io') return;
    
    setAnalyzingCharacter(char);
    setTempMemory(char.memory || '');
    setTempFeeling(char.feeling || null);
  };

  const saveAnalysis = () => {
    if (!analyzingCharacter) return;
    
    setCharacters(prev => prev.map(c => 
      c.id === analyzingCharacter.id 
        ? { ...c, feeling: tempFeeling || undefined, memory: tempMemory } 
        : c
    ));
    setAnalyzingCharacter(null);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const title = "Report Costellazione Sistemica";
    const date = new Date().toLocaleDateString('it-IT');
    
    doc.setFontSize(22);
    doc.text(title, 20, 20);
    doc.setFontSize(12);
    doc.text(`Data: ${date}`, 20, 30);
    if (userData.nome) doc.text(`Nome: ${userData.nome}`, 20, 37);
    if (userData.eta || userData.sesso) doc.text(`Età: ${userData.eta} | Sesso: ${userData.sesso}`, 20, 44);
    
    let yPos = 60;
    
    characters.forEach((char, index) => {
      if (char.label.toLowerCase() === 'io') return;
      
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`${index + 1}. Personaggio: ${char.label}`, 20, yPos);
      yPos += 10;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.text(`Sensazione: ${char.feeling ? char.feeling.toUpperCase() : 'Non definita'}`, 25, yPos);
      yPos += 10;
      
      if (char.memory) {
        doc.text("Ricordo/Evento:", 25, yPos);
        yPos += 7;
        const splitText = doc.splitTextToSize(char.memory, 160);
        doc.text(splitText, 30, yPos);
        yPos += (splitText.length * 7) + 5;
      } else {
        yPos += 5;
      }
      
      yPos += 10;
    });
    
    doc.save("report-costellazione.pdf");
    saveConstellation(characters);
  };

  const toggleFlowerSelection = (id: number) => {
    setSelectedFlowersIds(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const generateFlowerPDF = () => {
    if (selectedFlowersIds.length === 0) return;
    
    const doc = new jsPDF();
    const title = "Report Fiori di Bach Selezionati";
    const date = new Date().toLocaleDateString('it-IT');
    
    doc.setFontSize(22);
    doc.text(title, 20, 20);
    doc.setFontSize(12);
    doc.text(`Data: ${date}`, 20, 30);
    if (userData.nome) doc.text(`Nome: ${userData.nome}`, 20, 37);
    if (userData.eta || userData.sesso) doc.text(`Età: ${userData.eta} | Sesso: ${userData.sesso}`, 20, 44);
    
    let yPos = 60;
    
    const selectedFlowers = BACH_FLOWERS.filter(f => selectedFlowersIds.includes(f.id));
    
    selectedFlowers.forEach((flower, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`${index + 1}. ${flower.name}`, 20, yPos);
      yPos += 8;
      
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.text(flower.scientificName, 25, yPos);
      yPos += 12;
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    yPos += 10;
    const footerText = "Invia questo report a Graziamaria per ricevere la tua spiegazione personalizzata.";
    doc.text(footerText, 20, yPos);
    
    doc.save("report-fiori-bach.pdf");
    saveFlowerReading(selectedFlowersIds);
  };

  const generateRunePDF = () => {
    if (selectedRunesIds.length === 0) return;
    
    const doc = new jsPDF();
    const title = "Report Consultazione Rune";
    const date = new Date().toLocaleDateString('it-IT');
    
    doc.setFontSize(22);
    doc.text(title, 20, 20);
    doc.setFontSize(12);
    doc.text(`Data: ${date}`, 20, 30);
    if (userData.nome) doc.text(`Nome: ${userData.nome}`, 20, 37);
    if (userData.eta || userData.sesso) doc.text(`Età: ${userData.eta} | Sesso: ${userData.sesso}`, 20, 44);
    
    let yPos = 60;

    if (userData.domandaRune) {
      doc.setFont("helvetica", "bold");
      doc.text("Domanda:", 20, 55);
      doc.setFont("helvetica", "italic");
      const splitQuestion = doc.splitTextToSize(userData.domandaRune, 170);
      doc.text(splitQuestion, 20, 62);
      yPos = 62 + (splitQuestion.length * 7) + 10;
    }
    
    doc.setFont("helvetica", "bold");
    doc.text("Rune Selezionate:", 20, yPos);
    yPos += 10;
    
    const selectedRunes = RUNES.filter(r => selectedRunesIds.includes(r.id));
    
    selectedRunes.forEach((rune, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`${index + 1}. ${rune.name}`, 20, yPos);
      yPos += 8;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.text(`Significato: ${rune.meaning}`, 25, yPos);
      yPos += 12;
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    yPos += 10;
    const footerText = "Invia questo report a Graziamaria per ricevere la tua interpretazione personalizzata.";
    doc.text(footerText, 20, yPos);
    
    doc.save("report-rune.pdf");
    saveRuneReading(userData.domandaRune, selectedRunesIds);
  };

  const handleShare = async () => {
    if (!boardRef.current || isSharing) return;
    
    setIsSharing(true);
    
    // Pre-open the window to avoid popup blockers
    const whatsappUrl = `https://wa.me/393497921890?text=${encodeURIComponent('Ciao Graziamaria, ho generato una costellazione e ti invio lo screenshot ed il report. Grazie')}`;
    
    try {
      // Small delay to ensure UI is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(boardRef.current, {
        backgroundColor: '#f8f5f0',
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        // Ensure we capture the 3D transformed elements as best as possible
        onclone: (clonedDoc) => {
          const shareBtn = clonedDoc.querySelector('[title="Invia su WhatsApp"]');
          if (shareBtn) (shareBtn as HTMLElement).style.display = 'none';
          
          // Force some styles for better capture
          const main = clonedDoc.querySelector('main');
          if (main) {
            main.style.perspective = 'none';
            main.style.overflow = 'visible';
          }
        }
      });
      
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png', 0.9));
      
      if (blob) {
        const file = new File([blob], 'costellazione.png', { type: 'image/png' });
        
        // Try native share first (works best on mobile)
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'La mia Costellazione',
              text: 'Guarda la costellazione che ho creato!',
            });
            setIsSharing(false);
            return;
          } catch (shareError) {
            console.log('Native share failed, falling back to download', shareError);
          }
        }

        // Fallback: Download image
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'costellazione.png';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        // Short delay before opening WhatsApp to ensure download starts
        setTimeout(() => {
          window.open(whatsappUrl, '_blank');
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 500);
      } else {
        window.open(whatsappUrl, '_blank');
      }
    } catch (error) {
      console.error('Errore durante la condivisione:', error);
      window.open(whatsappUrl, '_blank');
    } finally {
      setIsSharing(false);
    }
  };

  const renderShape = (shape: string, color: string, size: 'normal' | 'small' = 'normal') => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const baseScale = size === 'small' ? 0.6 : 1;
    const finalScale = isMobile && size === 'normal' ? 0.75 : baseScale;
    
    // Determine dimensions based on shape string
    let bodyWidth = 40;
    let bodyHeight = 64;
    let headSize = 32;
    let isConical = shape.includes('conical');
    let isFlat = shape.includes('flat');
    let isBlock = shape === 'block';

    if (shape.includes('large')) {
      bodyWidth = 48;
      bodyHeight = 80;
      headSize = 36;
    } else if (shape.includes('medium')) {
      bodyWidth = 40;
      bodyHeight = 64;
      headSize = 32;
    } else if (shape.includes('small')) {
      bodyWidth = 32;
      bodyHeight = 48;
      headSize = 28;
    } else if (isBlock) {
      bodyWidth = 32;
      bodyHeight = 24;
      headSize = 0;
    }

    return (
      <div className="relative flex flex-col items-center justify-center pointer-events-none" style={{ transform: `scale(${finalScale})` }}>
        {/* Head */}
        {!isBlock && !isFlat && (
          <div 
            className="rounded-full border border-black/10 shadow-sm z-10"
            style={{ 
              backgroundColor: color, 
              width: headSize, 
              height: headSize,
              marginBottom: -headSize/4
            }}
          >
            <div className="flex justify-center gap-1.5" style={{ marginTop: headSize * 0.4 }}>
              <div className="w-1 h-1 bg-black/60 rounded-full"></div>
              <div className="w-1 h-1 bg-black/60 rounded-full"></div>
            </div>
          </div>
        )}
        
        {/* Body */}
        <div 
          className="border border-black/10 shadow-sm relative"
          style={{ 
            backgroundColor: color,
            width: bodyWidth,
            height: bodyHeight,
            borderRadius: isConical ? '4px 4px 12px 12px' : isFlat ? '4px 4px 8px 8px' : '6px 6px 12px 12px',
            clipPath: isConical ? 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' : 'none'
          }}
        >
          {/* Eyes for flat-top characters */}
          {isFlat && (
            <div className="flex justify-center gap-1.5 mt-3">
              <div className="w-1 h-1 bg-black/60 rounded-full"></div>
              <div className="w-1 h-1 bg-black/60 rounded-full"></div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f5f0] font-sans text-[#4a3f35] overflow-hidden flex flex-col" translate="no">
      {/* Auth Bar */}
      <div className="bg-[#4a3f35] text-white px-4 sm:px-6 py-3 flex flex-wrap justify-between items-center text-[10px] uppercase tracking-widest z-[100] shadow-md gap-y-2">
        <div className="flex items-center gap-2">
          {/* Heart and name removed at user's request */}
        </div>
        <div>
          {user ? (
            <div className="flex items-center gap-2 sm:gap-6">
              <span className="opacity-70 truncate max-w-[50px] sm:max-w-none notranslate">Hi, {user.displayName}</span>
              <button 
                onClick={() => setCurrentPage('profile')}
                className="inline-flex items-center gap-2 bg-[#c2b280] px-2 sm:px-4 py-1.5 rounded-full hover:bg-white hover:text-[#c2b280] transition-all text-[10px] font-black shadow-lg shrink-0"
                title="Il mio Profilo"
              >
                <UserIcon size={12} />
                <span className="hidden sm:inline">Area Personale</span>
                <span className="sm:hidden">Profilo</span>
              </button>
              {isAdmin && (
                <button 
                  onClick={() => setCurrentPage('admin')}
                  className="inline-flex items-center gap-2 bg-[#4a3f35] border border-white/20 px-2 sm:px-4 py-1.5 rounded-full hover:bg-white hover:text-[#4a3f35] transition-all text-[10px] font-black shadow-lg shrink-0"
                >
                  <Shield size={12} className="text-[#c2b280]" />
                  <span>Admin</span>
                </button>
              )}
              <button 
                onClick={logout}
                className="opacity-70 hover:opacity-100 hover:text-[#c2b280] transition-all font-bold border-l border-white/20 pl-2 sm:pl-6 shrink-0 notranslate"
              >
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={login}
              disabled={isLoggingIn}
              className="hover:text-[#c2b280] transition-colors font-bold disabled:opacity-50"
            >
              {isLoggingIn ? 'Accesso in corso...' : 'Accedi con Google'}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {currentPage === 'admin' && isAdmin ? (
          <motion.div 
            key="admin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col p-6 sm:p-12 overflow-y-auto bg-white"
          >
            <div className="max-w-6xl mx-auto w-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-[#e5e0d8] pb-6 gap-4">
                <div>
                  <h1 className="font-serif italic text-4xl text-[#4a3f35] mb-1">Dashboard Graziamaria</h1>
                  <p className="text-xs uppercase tracking-widest opacity-60 font-bold">Gestione Clienti e Analisi Portali</p>
                </div>
                <div className="flex items-center gap-4">
                  {selectedCandidacies.length > 0 && (
                    <button 
                      onClick={bulkDeleteCandidacies}
                      className="px-6 py-3 bg-red-50 text-red-600 rounded-full hover:bg-red-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm"
                    >
                      <Trash2 size={14} /> Elimina Selezionate ({selectedCandidacies.length})
                    </button>
                  )}
                  <button 
                    onClick={fetchAdminData}
                    className="p-3 bg-[#f8f5f0] rounded-full hover:bg-[#c2b280] hover:text-white transition-all shadow-sm"
                    title="Aggiorna dati"
                    disabled={isAdminLoading}
                  >
                    <Clock size={20} className={isAdminLoading ? 'animate-spin' : ''} />
                  </button>
                  <button 
                    onClick={() => setCurrentPage('home')}
                    className="p-3 bg-[#4a3f35] text-white rounded-full hover:bg-black transition-all shadow-lg"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
                  <div className="bg-[#f8f5f0] p-6 rounded-3xl border border-[#e5e0d8] text-center">
                    <Users className="mx-auto mb-2 text-[#c2b280]" size={20} />
                    <p className="text-[10px] uppercase tracking-widest opacity-60 font-bold mb-1">Candidature Totali</p>
                    <p className="text-3xl font-serif italic text-[#c2b280]">{adminData.candidacies.length}</p>
                  </div>
                  <div className="bg-[#f8f5f0] p-6 rounded-3xl border border-[#e5e0d8] text-center">
                    <Sparkles className="mx-auto mb-2 text-[#c2b280]" size={20} />
                    <p className="text-[10px] uppercase tracking-widest opacity-60 font-bold mb-1">Analisi Effettuate</p>
                    <p className="text-3xl font-serif italic text-[#c2b280]">{adminData.readings.length}</p>
                  </div>
                  <div className="bg-[#f8f5f0] p-6 rounded-3xl border border-[#e5e0d8] text-center col-span-2 flex flex-col justify-center">
                    <Info className="mx-auto mb-2 text-[#c2b280]" size={20} />
                    <p className="text-[10px] uppercase tracking-widest opacity-60 font-bold mb-1">Nota</p>
                    <p className="text-xs italic opacity-50 px-4">Utilizza la dashboard per gestire le prenotazioni e il contatto diretto via WhatsApp.</p>
                  </div>
                </div>

                {/* Candidacies List */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-[#fdfbf7] p-4 rounded-2xl border border-[#e5e0d8]">
                    <h3 className="font-bold uppercase tracking-[0.2em] text-[#c2b280] text-xs flex items-center gap-2">
                      <Camera size={14} /> Candidature e Portali Visivi
                    </h3>
                    <div className="flex items-center gap-4">
                       <button 
                         onClick={() => {
                           if (selectedCandidacies.length === adminData.candidacies.length) {
                             setSelectedCandidacies([]);
                           } else {
                             setSelectedCandidacies(adminData.candidacies.map(c => c.id));
                           }
                         }}
                         className="text-[10px] font-bold uppercase tracking-widest text-[#4a3f35] hover:text-[#c2b280] transition-colors"
                       >
                         {selectedCandidacies.length === adminData.candidacies.length ? 'Deseleziona Tutto' : 'Seleziona Tutto'}
                       </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {adminData.candidacies.map(can => {
                      const userReadings = adminData.readings.filter(r => r.userEmail === can.email || r.userId === can.userId);
                      const isSelected = selectedCandidacies.includes(can.id);

                      return (
                        <div key={can.id} className={`bg-white border ${isSelected ? 'border-[#c2b280] bg-[#fdfbf7]' : 'border-[#e5e0d8]'} rounded-[2.5rem] p-8 shadow-sm hover:shadow-md transition-all relative group`}>
                          {/* Selection Checkbox */}
                          <button 
                            onClick={() => {
                              setSelectedCandidacies(prev => 
                                prev.includes(can.id) ? prev.filter(id => id !== can.id) : [...prev, can.id]
                              );
                            }}
                            className="absolute -left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-[#e5e0d8] shadow-sm flex items-center justify-center text-[#c2b280] hover:scale-110 transition-transform z-10"
                          >
                            {isSelected ? <CheckCircle2 size={16} fill="currentColor" className="text-[#c2b280] text-white" /> : <Circle size={16} />}
                          </button>

                          <div className="flex flex-col lg:flex-row justify-between gap-8 mb-8 pt-6">
                            {/* Semaforo dell'Anima (Anti-Stanchezza) */}
                            {(() => {
                              const analyzeEnergy = (text: string) => {
                                const lowEnergyWords = ['urgente', 'subito', 'subitissimo', 'disperata', 'nessuno mi aiuta', 'fretta', 'aiutami tu', 'perché non rispondi', 'pretesa', 'voglio sapere', 'urgentemente'];
                                const warningWords = ['stanca', 'problema', 'difficile', 'triste', 'paura', 'ansia', 'aiuto'];
                                
                                const lowerText = (text || '').toLowerCase();
                                const hasLowEnergy = lowEnergyWords.some(w => lowerText.includes(w));
                                const hasWarning = warningWords.some(w => lowerText.includes(w));

                                if (hasLowEnergy) return { label: 'Vampiro Energetico / Urgenza', color: 'bg-red-500 text-white border-red-600' };
                                if (hasWarning) return { label: 'Energia Pesante / Lamento', color: 'bg-orange-400 text-white border-orange-500' };
                                return { label: 'Energia Neutra / Aperta', color: 'bg-green-500 text-white border-green-600' };
                              };
                              const energy = analyzeEnergy(can.puntoRottura || can.message || '');
                              return (
                                <div className={`absolute top-0 right-0 px-6 py-2 text-[8px] font-black uppercase tracking-[0.2em] shadow-sm flex items-center gap-2 ${energy.color}`}>
                                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                                  {energy.label}
                                </div>
                              );
                            })()}
                            <div className="flex items-start gap-6">
                              <div className="w-16 h-16 bg-[#f8f5f0] rounded-full flex items-center justify-center text-[#c2b280] font-black shrink-0 text-xl shadow-inner uppercase">
                                {can.nome?.charAt(0) || '?'}
                              </div>
                              <div>
                                <h4 className="font-serif italic text-2xl text-[#4a3f35] notranslate">{can.nome}</h4>
                                <p className="text-sm opacity-60 notranslate font-medium">{can.email}</p>
                                <p className="text-sm opacity-60 notranslate font-medium">{can.telefono}</p>
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {can.eta && <span className="text-[10px] bg-[#4a3f35] text-white px-3 py-1 rounded-full uppercase font-bold tracking-widest">{can.eta} anni</span>}
                                  {can.citta && <span className="text-[10px] bg-[#f8f5f0] text-[#4a3f35] border border-[#e5e0d8] px-3 py-1 rounded-full uppercase font-bold tracking-widest">{can.citta}</span>}
                                  {can.createdAt && <span className="text-[10px] opacity-40 uppercase font-black tracking-widest flex items-center gap-1"><Clock size={10} /> {can.createdAt.toDate().toLocaleDateString('it-IT')}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                              <a 
                                href={`https://wa.me/${can.telefono?.replace(/\s+/g, '') || '393497921890'}?text=${encodeURIComponent(`Ciao ${can.nome}, ho analizzato il tuo portale visivo...`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto px-8 py-3 bg-[#25D366] text-white rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-lg hover:bg-[#128C7E] transition-all flex items-center justify-center gap-2"
                              >
                                <MessageCircle size={16} /> Contatta WhatsApp
                              </a>
                              <button 
                                onClick={() => deleteCandidacy(can.id)}
                                className="w-full sm:w-auto p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                                title="Elimina Candidatura"
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                            {/* Form Details */}
                            <div className="space-y-4">
                              <h5 className="text-[10px] uppercase tracking-[0.3em] font-black text-[#c2b280]">Dettagli Analisi</h5>
                              <div className="p-6 bg-[#fdfbf7] rounded-[2rem] border border-[#e5e0d8] text-sm space-y-4 shadow-inner">
                                <div>
                                  <label className="text-[9px] uppercase font-black opacity-30 block mb-1">Punto di Rottura</label>
                                  <p className="font-medium text-[#4a3f35] leading-relaxed">{can.puntoRottura}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-[9px] uppercase font-black opacity-30 block mb-1">Radice Tempo</label>
                                    <p className="font-bold text-[#c2b280]">{can.radiceTempo?.replace('_', ' ')}</p>
                                  </div>
                                  <div>
                                    <label className="text-[9px] uppercase font-black opacity-30 block mb-1">Urgenza</label>
                                    <div className="flex items-center gap-2">
                                      <div className="h-1.5 flex-1 bg-white rounded-full overflow-hidden border border-[#e5e0d8]">
                                        <div className="h-full bg-red-400" style={{ width: `${(can.termometroUrgenza || 5) * 10}%` }}></div>
                                      </div>
                                      <span className="font-bold text-[10px]">{can.termometroUrgenza || '5'}/10</span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[9px] uppercase font-black opacity-30 block mb-1">Messaggio per te</label>
                                  <p className="italic opacity-70">"{can.message || 'Nessun messaggio'}"</p>
                                </div>
                              </div>
                            </div>

                            {/* Photos */}
                            <div className="space-y-4">
                              <h5 className="text-[10px] uppercase tracking-[0.3em] font-black text-[#c2b280]">Portali Visivi (Foto)</h5>
                              <div className="grid grid-cols-2 gap-3">
                                {can.photoUrls?.map((url: string, idx: number) => (
                                  <div key={idx} className="aspect-square relative group/img overflow-hidden rounded-2xl border border-[#e5e0d8] shadow-sm">
                                    <img 
                                      src={url} 
                                      alt={`Piedi ${can.nome}`} 
                                      className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110"
                                      referrerPolicy="no-referrer"
                                    />
                                    <button 
                                      onClick={() => window.open(url, '_blank')}
                                      className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold uppercase tracking-widest"
                                    >
                                      Ingrandisci
                                    </button>
                                  </div>
                                ))}
                                {(!can.photoUrls || can.photoUrls.length === 0) && (
                                  <div className="col-span-2 h-32 bg-[#f8f5f0] rounded-2xl flex items-center justify-center text-[10px] opacity-40 italic border border-dashed border-[#e5e0d8]">
                                    Nessuna foto caricata
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Readings & Notes */}
                            <div className="space-y-6">
                              {/* Inline Histroy */}
                              <div className="space-y-4">
                                <h5 className="text-[10px] uppercase tracking-[0.3em] font-black text-[#c2b280]">Cronologia Letture Cliente</h5>
                                <div className="space-y-3 max-h-[160px] overflow-y-auto pr-2 scrollbar-style">
                                  {userReadings.map(read => (
                                    <div key={read.id} className="p-4 bg-[#f8f5f0] rounded-2xl border border-[#e5e0d8] group/read">
                                      <div className="flex justify-between items-center mb-2">
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                          read.type === 'rune' ? 'bg-purple-100 text-purple-600' : 
                                          read.type === 'flower' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                          {read.type}
                                        </span>
                                        <span className="text-[8px] opacity-40 font-bold">
                                          {read.timestamp?.toDate ? read.timestamp.toDate().toLocaleDateString('it-IT') : 'Recent'}
                                        </span>
                                      </div>
                                      {read.question && <p className="text-[10px] italic opacity-80 mb-2">"{read.question}"</p>}
                                      {read.type === 'constellation' && Array.isArray(read.characters) ? (
                                        <div className="space-y-2 text-[10px] font-medium opacity-70 leading-relaxed">
                                          {read.userData && (
                                            <p><strong>Dati sessione:</strong> {read.userData.nome || read.userName || 'N/D'}{read.userData.eta ? `, ${read.userData.eta} anni` : ''}{read.userData.sesso ? `, ${read.userData.sesso}` : ''}{read.userData.domandaRune ? ` — ${read.userData.domandaRune}` : ''}</p>
                                          )}
                                          <p><strong>Elementi posizionati:</strong> {read.characters.length}</p>
                                          <div className="space-y-1">
                                            {read.characters.map((character: CharacterType, index: number) => (
                                              <div key={`${read.id}-character-${index}`} className="rounded-xl bg-white/70 border border-[#e5e0d8] p-2">
                                                <span className="font-bold text-[#4a3f35]">{character.label || 'Senza nome'}</span>
                                                {character.feeling && <span> · Emozione: {character.feeling}</span>}
                                                {character.memory && <span> · Memoria: {character.memory}</span>}
                                                <span className="block opacity-50">Posizione: {Math.round(character.x)}, {Math.round(character.y)}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-[10px] font-medium opacity-70 leading-relaxed">
                                          {Array.isArray(read.data) ? read.data.join(', ') :
                                           read.runeIds ? `Rune: ${read.runeIds.map((id: number) => RUNES.find(r => r.id === id)?.name).filter(Boolean).join(', ')}` :
                                           read.flowerIds ? `Fiori: ${read.flowerIds.map((id: number) => BACH_FLOWERS.find(f => f.id === id)?.name).filter(Boolean).join(', ')}` : 'Analisi Complessa'}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  {userReadings.length === 0 && (
                                    <p className="text-[10px] opacity-40 italic text-center py-4">Nessuna lettura ancora effettuata dal cliente.</p>
                                  )}
                                </div>
                              </div>

                              {/* Admin Notes */}
                              <div className="space-y-3">
                                <h5 className="text-[10px] uppercase tracking-[0.3em] font-black text-[#c2b280] flex items-center gap-2">
                                  <ClipboardList size={12} /> Note Administrative
                                </h5>
                                <div className="relative group/note">
                                  <textarea 
                                    className="w-full p-4 bg-[#fdfbf7] border border-[#e5e0d8] rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-[#c2b280] min-h-[100px] resize-none shadow-inner"
                                    placeholder="Scrivi qui i tuoi appunti privati su questo cliente..."
                                    defaultValue={can.adminNote || ''}
                                    onBlur={(e) => updateCandidacyNote(can.id, e.target.value)}
                                  />
                                  <div className="absolute bottom-3 right-3 opacity-30 group-focus-within/note:opacity-100 transition-opacity">
                                    <Save size={14} className="text-[#c2b280]" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {adminData.candidacies.length === 0 && (
                      <div className="text-center py-20 bg-[#f8f5f0] rounded-[3rem] border border-dashed border-[#e5e0d8]">
                        <Camera className="mx-auto mb-4 text-[#c2b280] opacity-30" size={48} />
                        <h4 className="font-serif italic text-2xl text-[#4a3f35] opacity-50">Nessuna candidatura</h4>
                        <p className="text-sm opacity-40">Le nuove richieste e i portali visivi appariranno qui.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : currentPage === 'home' ? (
          <motion.div 
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center p-6 sm:p-12 overflow-y-auto"
          >
            {/* Home Header */}
            <div className="text-center mb-16 w-full max-w-4xl flex flex-col items-center">
              <h1 className="font-serif italic tracking-tight text-[#4a3f35] mb-2" style={{ fontSize: '42px', lineHeight: '1.1', fontWeight: 'bold' }}>
                Risolutrice dell'Invisibile
              </h1>
              <h2 className="font-serif italic text-xl sm:text-2xl text-[#5a5a40] mb-2">
                Trattamento Olistico di Precisione
              </h2>
              <p className="uppercase tracking-[0.4em] text-[#c2b280] font-black text-[10px] mb-8">
                di Graziamaria Infantino
              </p>
              
              <img 
                src="https://files.manuscdn.com/user_upload_by_module/session_file/92323165/cnrwUQwBkASOlPnZ.webp" 
                alt="Graziamaria" 
                className="w-full max-w-lg aspect-[16/9] object-cover rounded-2xl shadow-lg"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Hero Section */}
            <div className="w-full max-w-4xl bg-[#4a3f35] text-white rounded-[3rem] p-8 sm:p-12 mb-12 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#c2b280] opacity-10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <div className="relative z-10 flex flex-col items-center text-center">
                <h3 className="font-serif italic text-2xl sm:text-3xl mb-6 leading-tight">
                  Hai un blocco che non riesci a spiegare? La risposta è scritta dove non guardi mai.
                </h3>
                <p className="text-sm sm:text-base opacity-90 mb-8 max-w-2xl leading-relaxed text-center">
                  Graziamaria, la Risolutrice dell'Invisibile, analizza la tua storia attraverso i tuoi Portali Visivi. 
                  <span className="block mt-4 font-bold text-[#c2b280]">Solo 5 posti disponibili per questa settimana per ricevere la tua mappatura personalizzata.</span>
                  Scopri cosa dice il tuo corpo. Inizia il percorso caricando le foto dei tuoi piedi, Graziamaria ti risponderà su WhatsApp.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full justify-center">
                  <button 
                    onClick={() => {
                      if (!user) {
                        alert("Per favore, effettua l'accesso per candidarti.");
                        login();
                      } else {
                        openCandidacyModal();
                      }
                    }}
                    className="inline-flex items-center justify-center gap-3 bg-[#c2b280] hover:bg-[#b1a170] text-white px-12 py-5 rounded-full font-bold uppercase tracking-widest transition-all shadow-xl hover:shadow-2xl active:scale-95 text-sm"
                  >
                    <Camera size={24} /> Inizia l'Analisi Alchemica
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-4xl mb-16">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentPage('percorsi')}
                className="bg-[#c2b280] p-8 rounded-[2.5rem] shadow-lg border border-[#b1a170] flex flex-col items-center text-center gap-4 hover:shadow-xl transition-all group relative overflow-hidden sm:col-span-2 text-white"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Sparkles size={100} />
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white group-hover:bg-white group-hover:text-[#c2b280] transition-colors z-10">
                  <Sparkles size={32} />
                </div>
                <div className="z-10">
                  <h3 className="font-serif italic text-2xl mb-2">Percorsi di Guarigione</h3>
                  <p className="text-xs opacity-80 uppercase tracking-widest font-bold">Dall'Invisibile alla Libertà</p>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentPage('costellazioni')}
                className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-[#e5e0d8] flex flex-col items-center text-center gap-4 hover:shadow-xl transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <img src="/fiori/00_Personaggi.png" alt="" className="w-24 h-24 object-contain" />
                </div>
                <div className="w-16 h-16 bg-[#f8f5f0] rounded-2xl flex items-center justify-center overflow-hidden group-hover:bg-[#c2b280] transition-colors z-10 p-2">
                  <img src="/fiori/00_Personaggi.png" alt="Costellazioni" className="w-full h-full object-contain" />
                </div>
                <div className="z-10">
                  <h3 className="font-serif italic text-2xl mb-2">Costellazioni</h3>
                  <p className="text-xs opacity-60 uppercase tracking-widest font-bold">Simulazione Interattiva per Diagnosi Olistica</p>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentPage('fiori')}
                className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-[#e5e0d8] flex flex-col items-center text-center gap-4 hover:shadow-xl transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <img src="/fiori/0_Rescue_Remedy.png" alt="" className="w-24 h-24 object-contain" />
                </div>
                <div className="w-16 h-16 bg-[#f8f5f0] rounded-2xl flex items-center justify-center overflow-hidden group-hover:bg-[#c2b280] transition-colors z-10 p-2">
                  <img src="/fiori/0_Rescue_Remedy.png" alt="Fiori di Bach" className="w-full h-full object-contain" />
                </div>
                <div className="z-10">
                  <h3 className="font-serif italic text-2xl mb-2">Fiori di Bach</h3>
                  <p className="text-xs opacity-60 uppercase tracking-widest font-bold">Simulazione Interattiva per Diagnosi Olistica</p>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentPage('rune')}
                className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-[#e5e0d8] flex flex-col items-center text-center gap-4 hover:shadow-xl transition-all group relative overflow-hidden sm:col-span-2"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <img src="/fiori/0_RUNE.webp" alt="" className="w-24 h-24 object-contain" />
                </div>
                <div className="w-16 h-16 bg-[#f8f5f0] rounded-2xl flex items-center justify-center overflow-hidden group-hover:bg-[#c2b280] transition-colors z-10 p-2">
                  <img src="/fiori/0_RUNE.webp" alt="Rune" className="w-full h-full object-contain" />
                </div>
                <div className="z-10">
                  <h3 className="font-serif italic text-2xl mb-2">Rune</h3>
                  <p className="text-xs opacity-60 uppercase tracking-widest font-bold">Antica Saggezza Simbolica</p>
                </div>
              </motion.button>
            </div>

            {/* About Section Integrated */}
            <div className="w-full max-w-4xl bg-white/50 backdrop-blur-sm rounded-[3rem] p-8 sm:p-12 border border-[#e5e0d8] shadow-sm mb-12">
              <h2 className="font-serif italic text-3xl text-[#4a3f35] mb-12 text-center">Di cosa si occupa Graziamaria?</h2>
              
              <div className="flex flex-col md:flex-row gap-12 items-center md:items-start">
                <div className="w-full md:w-2/5 shrink-0">
                  <img 
                    src="/fiori/00_grazia.png" 
                    alt="Graziamaria" 
                    className="w-full object-contain rounded-2xl"
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                <div className="flex-1 space-y-8 text-[#4a3f35] leading-relaxed">
                  <p className="font-medium italic text-lg text-center md:text-left">
                    Graziamaria si definisce la <span className="text-[#c2b280]">"Risolutrice dell'Invisibile"</span> ed è una specialista in guarigione olistica "High-Ticket". 
                  </p>
                  <p className="text-sm opacity-90">
                    La sua attività non si limita alla semplice esecuzione di trattamenti, ma si configura come un percorso di guida intuitiva che utilizza il corpo fisico, e in particolare i piedi, come un portale per accedere all'anima del cliente e sciogliere traumi profondi.
                  </p>
                  <p className="text-sm opacity-90">
                    Partendo dalla lettura dei piedi, con l'ausilio delle: Costellazioni, Fiori di Back, Rune, Cristalloterapia e Reiki a distanza, ti assicuro che già dal primo incontro on-line capirai cosa posso donarti perché ti sentirai subito molto meglio. Poi, deciderai se proseguire. <span className="font-bold text-[#c2b280]">IMPORTANTE:</span> seguo solo pochissime persone e selezionate, candidati e ti farò sapere subito.
                  </p>
                  <p className="text-sm opacity-90">
                    Partendo dalla lettura dei piedi, con l'ausilio delle: Costellazioni, Fiori di Back, Rune, Cristalloterapia e Reiki a distanza, ti assicuro che già dal primo incontro on-line capirai cosa posso donarti perché ti sentirai subito molto meglio. Poi, deciderai se proseguire. <span className="font-bold text-[#c2b280]">IMPORTANTE:</span> seguo solo pochissime persone e selezionate, candidati e ti farò sapere subito.
                  </p>
  
                  <div className="grid grid-cols-1 gap-12 pt-8 border-t border-[#e5e0d8]">
                    {/* Pilastro 1 */}
                    <div className="space-y-4">
                      <h3 className="font-bold uppercase tracking-widest text-[#5a5a40] text-xs flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-[#5a5a40] text-white flex items-center justify-center text-xs font-black shrink-0">1</span>
                        Diagnostica Intuitiva e "Anamnesi Alchemica"
                      </h3>
                      <div className="text-sm opacity-80 pl-11 space-y-2">
                        <p>Il cuore del suo metodo è la capacità di effettuare analisi di precisione millimetrica attraverso l'osservazione della pianta del piede, un processo che può svolgere anche a distanza tramite fotografie. Questa tecnica le permette di:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>Individuare traumi passati, blocchi emotivi e patologie fisiche senza che il cliente debba parlare.</li>
                          <li>Mappare lo stato degli organi vitali (come cuore, polmoni, fegato e stomaco) e del sistema nervoso proiettati sui piedi.</li>
                          <li>Fornire risposte profonde ("la verità su se stessi") che spesso i clienti non trovano nella medicina tradizionale.</li>
                        </ul>
                      </div>
                    </div>
  
                    {/* Pilastro 2 */}
                    <div className="space-y-4">
                      <h3 className="font-bold uppercase tracking-widest text-[#5a5a40] text-xs flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-[#5a5a40] text-white flex items-center justify-center text-xs font-black shrink-0">2</span>
                        Tecniche di Guarigione Energetica e Vibrazionale
                      </h3>
                      <div className="text-sm opacity-80 pl-11 space-y-2">
                        <p>Graziamaria integra numerose discipline per riportare equilibrio e leggerezza:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li><strong>Cristalloterapia:</strong> È specializzata in cristallopratica (con una formazione di 250 ore) e utilizza le pietre per sblocchi energetici e riequilibri a distanza.</li>
                          <li><strong>Reiki e Lavaggio Energetico:</strong> Agisce come un canale per trasferire energia e liberare i nodi energetici del corpo.</li>
                          <li><strong>Radioestesia e Lettura dell'Aura:</strong> Strumenti utilizzati per completare la diagnosi energetica.</li>
                          <li><strong>Rimedi Personalizzati:</strong> Prepara "acque informate" con sinergie di Fiori di Bach per sostenere il processo di autoguarigione.</li>
                        </ul>
                      </div>
                    </div>
  
                    {/* Pilastro 3 */}
                    <div className="space-y-4">
                      <h3 className="font-bold uppercase tracking-widest text-[#5a5a40] text-xs flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-[#5a5a40] text-white flex items-center justify-center text-xs font-black shrink-0">3</span>
                        Lavoro Sistemico e Trattamenti Manuali (in studio)
                      </h3>
                      <div className="text-sm opacity-80 pl-11 space-y-2">
                        <p>Oltre alla parte energetica, si occupa di aspetti strutturali e relazionali:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li><strong>Costellazioni Familiari:</strong> Utilizza il metodo sistemico per risolvere dinamiche familiari profonde.</li>
                          <li><strong>Trattamenti Olistici Manuali:</strong> La sua offerta include massaggi Ayurvedici, linfodrenaggio Vodder, Shirodhara, Hot Stone e massaggi decontratturanti.</li>
                          <li><strong>Estetica Curativa:</strong> Applica il suo approccio olistico anche a pedicure curativi e massaggi al viso con l'ausilio di cristalli.</li>
                        </ul>
                      </div>
                    </div>
  
                    {/* Pilastro 4 */}
                    <div className="space-y-4">
                      <h3 className="font-bold uppercase tracking-widest text-[#5a5a40] text-xs flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-[#5a5a40] text-white flex items-center justify-center text-xs font-black shrink-0">4</span>
                        Strategia Online e Percorsi di Sblocco
                      </h3>
                      <div className="text-sm opacity-80 pl-11 space-y-2">
                        <p>Graziamaria ha strutturato la sua attività online per risolvere casi definiti "impossibili" attraverso una "Scala del Valore":</p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li><strong>Fase d'ingresso:</strong> L'analisi del piede tramite foto che ti genererà un "effetto Wow" immediato.</li>
                          <li><strong>Sessioni di Sblocco:</strong> Incontri intensivi in videochiamata per agire sulla radice del malessere.</li>
                          <li><strong>Inner Light Circle:</strong> Un abbonamento esclusivo per un gruppo ristretto di persone che desiderano un supporto energetico continuo, check-up mensili e consigli personalizzati via WhatsApp.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-[#e5e0d8] space-y-6 text-center">
                <p className="text-[#4a3f35] leading-relaxed font-medium italic">
                  In sintesi, l'obiettivo di Graziamaria è trasformare il malessere in libertà e serenità, vendendo non singole ore di lavoro, ma una reale trasformazione profonda e la risoluzione di blocchi cronici.
                </p>
                <p className="font-serif text-2xl text-[#c2b280] italic">
                  Mettila alla prova subito!
                </p>
              </div>
            </div>

            <footer className="mt-8 text-[10px] uppercase tracking-[0.3em] opacity-40 font-black text-center pb-12">
              © 2026 Graziamaria • Risolutrice dell'Invisibile
            </footer>
          </motion.div>
        ) : currentPage === 'costellazioni' ? (
          <motion.div 
            key="costellazioni"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* Header */}
            <header className="p-4 sm:p-6 flex flex-col items-center gap-4 bg-white/60 backdrop-blur-md border-b border-[#e5e0d8] z-50">
              <div className="w-full max-w-6xl flex justify-between items-center mb-2">
                <button 
                  onClick={() => setCurrentPage('home')}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#5a5a40] hover:text-[#c2b280] transition-colors"
                >
                  <X size={16} /> Home
                </button>
                <div className="text-center flex-1">
                  <h1 className="font-serif italic tracking-tight" style={{ color: '#090909', fontSize: '28px', lineHeight: '26px', fontWeight: 'bold' }}>Costellazioni</h1>
                  <p className="uppercase tracking-[0.2em]" style={{ color: '#5a5a40', fontSize: '10px', fontWeight: 'bold' }}>Simulazione Interattiva per Diagnosi Olistica</p>
                  <img 
                    src="/fiori/00_Personaggi.png" 
                    alt="Personaggi" 
                    className="mt-4 object-contain mx-auto"
                    style={{ width: '186.45px', height: '102px' }}
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="w-20" /> {/* Spacer */}
              </div>

              {/* User Data Section */}
              <div className="flex flex-wrap gap-3 justify-center w-full max-w-2xl mb-2">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Nome" 
                    value={userData.nome}
                    onChange={(e) => setUserData({...userData, nome: e.target.value})}
                    className="px-4 py-2 bg-white/80 border border-[#e5e0d8] rounded-full text-xs focus:ring-2 focus:ring-[#c2b280] outline-none w-40 transition-all"
                  />
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    placeholder="Età" 
                    value={userData.eta}
                    onChange={(e) => setUserData({...userData, eta: e.target.value})}
                    className="px-4 py-2 bg-white/80 border border-[#e5e0d8] rounded-full text-xs focus:ring-2 focus:ring-[#c2b280] outline-none w-20 transition-all"
                  />
                </div>
                <div className="relative">
                  <select 
                    value={userData.sesso}
                    onChange={(e) => setUserData({...userData, sesso: e.target.value})}
                    className="px-4 py-2 bg-white/80 border border-[#e5e0d8] rounded-full text-xs focus:ring-2 focus:ring-[#c2b280] outline-none transition-all appearance-none pr-8"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%235a5a40\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '12px' }}
                  >
                    <option value="">Sesso</option>
                    <option value="M">M</option>
                    <option value="F">F</option>
                  </select>
                </div>
              </div>

              {/* Instructions Box */}
              <div 
                className="w-full max-w-3xl p-4 bg-[#fdfbf7] rounded-2xl border border-[#e5e0d8] shadow-sm text-center"
                style={{ color: '#4a3f35', fontSize: '10px', lineHeight: '1.5', fontWeight: '500' }}
              >
                <div className="font-bold text-[#5a5a40] mb-1 tracking-widest uppercase" style={{ fontSize: '9px' }}>COME FUNZIONA?</div>
                <p className="opacity-90 text-justify" style={{ color: '#100b06' }}>
                  Avrai a disposizione 30 "personaggi" di varie misure, colori e forme. Cliccando sul bottone "Scegli" potrai visualizzarli tutti e sceglierli per poi posizionarne quanti ne vuoi, uno per uno. Cliccando su "Casuale" il sistema sceglierà il personaggio che dovrai, poi, nominare e posizionare.<br />
                  Clicca il "bottone" che hai deciso (Scegli o Casuale), nomina il personaggio, trascina il personaggio e posizionalo dove vuoi, puoi sceglierne quanti ne vuoi. Quando hai finito fai uno screenshot. Poi clicca sul bottone "Termina Posizionamento" e segui le istruzioni successive. Quando avrai terminato, potrai salvare il tutto nel report, scaricarlo e inviarlo a Graziamaria.
                </p>
              </div>
              
              <div className="flex items-center gap-3 w-full max-w-4xl justify-center flex-wrap mt-2">
                {/* Group: Creation */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowPicker(true)}
                    disabled={showLabelInput || showPicker || workflowStep === 1}
                    className="flex items-center justify-center gap-2 bg-[#c2b280] text-white transition-all shadow-md hover:bg-[#b1a170] disabled:opacity-30 disabled:cursor-not-allowed px-6 h-10 rounded-full text-xs font-bold uppercase tracking-wider"
                    translate="no"
                  >
                    <ChevronDown size={14} /> <span>Scegli</span>
                  </button>

                  <button 
                    onClick={handleDraw}
                    disabled={showLabelInput || showPicker || workflowStep === 1}
                    className="flex items-center justify-center gap-2 bg-[#e5e0d8] text-[#5a5a40] transition-all shadow-md hover:bg-[#d5d0c8] disabled:opacity-30 disabled:cursor-not-allowed px-6 h-10 rounded-full text-xs font-bold uppercase tracking-wider"
                    translate="no"
                  >
                    <Plus size={14} /> <span>Casuale</span>
                  </button>
                </div>

                {/* Group: Progress */}
                <button 
                  onClick={() => {
                    if (characters.length > 0) {
                      setShowWorkflowModal(true);
                    }
                  }}
                  disabled={characters.length === 0 || showLabelInput || showPicker}
                  className="flex items-center justify-center gap-2 bg-[#4c513c] text-white transition-all shadow-lg hover:bg-[#3c412c] disabled:opacity-30 disabled:cursor-not-allowed px-8 h-10 rounded-full text-xs font-bold uppercase tracking-widest"
                  translate="no"
                >
                  <span className="flex items-center gap-2">
                    {workflowStep === 0 ? "Termina Posizionamento" : "Gestisci Sessione"}
                  </span>
                </button>

                {/* Group: Actions */}
                <div className="flex gap-2">
                  {workflowStep === 1 && (
                    <div className="flex gap-2">
                      <button 
                        onClick={generatePDF}
                        className="flex items-center justify-center gap-2 bg-blue-600 text-white transition-all shadow-lg hover:bg-blue-700 px-6 h-10 rounded-full text-xs font-bold uppercase tracking-wider"
                        translate="no"
                      >
                        <FileText size={14} />
                        <span>Report</span>
                      </button>
                      <button 
                        onClick={async () => {
                          if (!user) { alert("Effettua il login per salvare."); return; }
                          await saveConstellation(characters);
                          alert("Costellazione salvata in Area Personale!");
                          if (user) fetchHistory(user.uid);
                        }}
                        className="flex items-center justify-center gap-2 bg-[#c2b280] text-white transition-all shadow-lg hover:bg-[#b1a170] px-6 h-10 rounded-full text-xs font-bold uppercase tracking-wider"
                        translate="no"
                      >
                        <Check size={14} />
                        <span>Salva</span>
                      </button>
                    </div>
                  )}

                  <button 
                    onClick={() => {
                      if(window.confirm("Sei sicuro di voler svuotare il campo?")) {
                        setCharacters([]);
                        setWorkflowStep(0);
                      }
                    }}
                    className="flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 transition-colors border border-red-100 px-4 h-10 rounded-full"
                    title="Svuota Campo"
                    translate="no"
                  >
                    <Trash2 size={16} />
                    <span className="font-bold text-[10px] uppercase tracking-tighter">Pulisci</span>
                  </button>
                </div>
              </div>
            </header>

            {/* Main Game Area */}
            <main className="flex-1 relative p-4 sm:p-8 flex flex-col items-center justify-center gap-2 sm:gap-4 overflow-hidden" ref={boardRef} style={{ perspective: '1200px' }}>
              {/* Share Button */}
              <button 
                onClick={handleShare}
                disabled={isSharing}
                className="absolute top-6 left-6 z-40 flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm border border-[#e5e0d8] rounded-xl shadow-sm hover:bg-white transition-all text-[#25D366] active:scale-95 disabled:opacity-50"
                title="Invia a Graziamaria"
              >
                <Share2 size={18} className={isSharing ? 'animate-spin' : ''} />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {isSharing ? 'Generazione...' : 'Invia a Graziamaria'}
                </span>
              </button>

              {/* Stage / Board */}
              <div 
                className="relative w-[329px] h-[184px] sm:w-[658px] sm:h-[368px] transition-transform duration-700 mt-12 sm:mt-0"
                style={{ 
                  transform: 'rotateX(25deg)',
                  transformStyle: 'preserve-3d'
                }}
              >
                <img 
                  src="/fiori/000gradini.png" 
                  alt="Stage" 
                  className="w-full h-full object-cover rounded-[2rem] sm:rounded-[3rem] shadow-2xl border-4 sm:border-8 border-white/10"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-[2rem] sm:rounded-[3rem] pointer-events-none" />
              </div>

              {/* Floor Reflection Effect */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/80 to-transparent pointer-events-none z-0" />

              {/* Draggable Characters */}
              {characters.map((char) => (
                <motion.div
                  key={char.id}
                  drag={workflowStep === 0 || char.label.toLowerCase() === 'io'}
                  dragMomentum={false}
                  initial={{ x: char.x, y: char.y, scale: 0 }}
                  animate={{ scale: 1 }}
                  onDragEnd={(_, info) => {
                    setCharacters(prev => prev.map(c => 
                      c.id === char.id ? { ...c, x: c.x + info.offset.x, y: c.y + info.offset.y } : c
                    ));
                  }}
                  onClick={() => handleCharacterClick(char)}
                  className={`absolute z-40 group ${
                    (workflowStep === 0 || char.label.toLowerCase() === 'io') 
                      ? 'cursor-grab active:cursor-grabbing' 
                      : workflowStep === 1 
                        ? 'cursor-pointer hover:ring-2 hover:ring-[#5a5a40] rounded-full transition-all' 
                        : ''
                  }`}
                  style={{ left: '50%', top: '50%' }}
                >
                  <div className="flex flex-col items-center">
                    {renderShape(char.shape, char.color)}
                    <div className={`mt-2 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-[#e5e0d8] text-xs font-medium whitespace-nowrap ${char.feeling === 'piacevole' ? 'border-green-400' : char.feeling === 'spiacevole' ? 'border-red-400' : ''}`} translate="no">
                      {char.label}
                      {char.feeling && (
                        <span className="ml-1">
                          {char.feeling === 'piacevole' ? '❤️' : '💔'}
                        </span>
                      )}
                    </div>
                    {workflowStep === 0 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCharacter(char.id);
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </main>
          </motion.div>
        ) : currentPage === 'rune' ? (
          <motion.div 
            key="rune"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col p-4 sm:p-8 overflow-y-auto"
          >
            <header className="mb-6 sm:mb-12 text-center relative">
              <button 
                onClick={() => setCurrentPage('home')}
                className="absolute left-0 top-0 p-2 text-[#5a5a40] hover:bg-white rounded-full transition-colors"
              >
                <X size={20} className="sm:size-6" />
              </button>
              
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full text-[#c2b280] mb-2 sm:mb-4 shadow-md border border-[#e5e0d8] overflow-hidden">
                <img src="/fiori/0_RUNE.webp" alt="Rune" className="w-full h-full object-cover" />
              </div>
              <h2 className="font-serif italic text-3xl sm:text-4xl mb-1 sm:mb-2 text-[#4a3f35]">Rune</h2>
              <p className="text-[#c2b280] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[8px] sm:text-[10px] font-black mb-6">Antica Saggezza Simbolica</p>
              
              {/* Description Box */}
              <div 
                className="w-full max-w-3xl mx-auto p-6 bg-[#fdfbf7] rounded-3xl border border-[#e5e0d8] shadow-sm text-center mb-8"
                style={{ color: '#4a3f35', fontSize: '12px', lineHeight: '1.6' }}
              >
                <div className="mb-6">
                  <h3 className="font-bold text-[#5a5a40] mb-3 tracking-widest uppercase text-xs">Cosa sono le Rune</h3>
                  <p className="text-justify opacity-90" style={{ color: '#100b06' }}>
                    Le Rune antiche sono simboli di saggezza e guida, utilizzati per la divinazione e la comunicazione con gli dei. Ogni runa ha un significato specifico legato alla mitologia norrena e alle forze della natura. Le rune sono state utilizzate per scrivere iscrizioni, invocare poteri magici e proteggere dagli spiriti maligni. Oggi, le rune continuano ad affascinare e sono utilizzate come strumenti di interpretazione e consapevolezza, mantenendo viva la connessione con l'antica saggezza nordica.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-bold text-[#5a5a40] mb-3 tracking-widest uppercase text-xs">Come funziona?</h3>
                  <p className="text-justify opacity-90" style={{ color: '#100b06' }}>
                    Poni la domanda alla quale vorresti una risposta, e scrivila. Scegli 1 - 3 oppure 5 Rune premendo il bottone "Estrai una Runa" tante volte quante Rune vuoi. Quando hai finito, scarica il "Report" e invialo a Graziamaria per la lettura.
                  </p>
                </div>
              </div>

              {/* User Data Section */}
              <div className="flex flex-wrap gap-3 justify-center w-full max-w-2xl mx-auto mb-6">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Nome" 
                    value={userData.nome}
                    onChange={(e) => setUserData({...userData, nome: e.target.value})}
                    className="px-4 py-2 bg-white/80 border border-[#e5e0d8] rounded-full text-xs focus:ring-2 focus:ring-[#c2b280] outline-none w-40 transition-all"
                  />
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    placeholder="Età" 
                    value={userData.eta}
                    onChange={(e) => setUserData({...userData, eta: e.target.value})}
                    className="px-4 py-2 bg-white/80 border border-[#e5e0d8] rounded-full text-xs focus:ring-2 focus:ring-[#c2b280] outline-none w-20 transition-all"
                  />
                </div>
                <div className="relative">
                  <select 
                    value={userData.sesso}
                    onChange={(e) => setUserData({...userData, sesso: e.target.value})}
                    className="px-4 py-2 bg-white/80 border border-[#e5e0d8] rounded-full text-xs focus:ring-2 focus:ring-[#c2b280] outline-none transition-all appearance-none pr-8"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%235a5a40\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '12px' }}
                  >
                    <option value="">Sesso</option>
                    <option value="M">M</option>
                    <option value="F">F</option>
                  </select>
                </div>
              </div>

              {/* Question Field */}
              <div className="max-w-2xl mx-auto mb-8">
                <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5a5a40] mb-2">Scrivi qui la tua domanda:</label>
                <textarea 
                  placeholder="(esempio: cosa devo fare per...?)" 
                  value={userData.domandaRune}
                  onChange={(e) => setUserData({...userData, domandaRune: e.target.value})}
                  className="w-full px-6 py-4 bg-white/80 border border-[#e5e0d8] rounded-3xl text-sm focus:ring-2 focus:ring-[#c2b280] outline-none transition-all min-h-[100px] resize-none shadow-sm"
                />
              </div>

              {/* Draw Button and Display */}
              <div className="flex flex-col items-center gap-8 mb-12">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={drawRune}
                  className="text-white px-10 py-4 rounded-full text-sm font-bold uppercase tracking-widest shadow-xl transition-all flex items-center gap-3"
                  style={{ backgroundColor: '#ba8b02' }}
                >
                  <Sparkles size={18} /> Estrai una Runa
                </motion.button>

                <AnimatePresence mode="wait">
                  {currentRune && (
                    <motion.div
                      key={currentRune.id}
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: -20 }}
                      className="bg-white p-8 rounded-[3rem] border-2 border-[#c2b280] shadow-2xl max-w-sm w-full flex flex-col items-center gap-4"
                    >
                      <div className="w-24 h-24 bg-[#f8f5f0] rounded-full flex items-center justify-center text-5xl font-bold font-mono text-[#c2b280] shadow-inner">
                        {currentRune.name.charAt(0)}
                      </div>
                      <div className="text-center">
                        <h3 className="text-2xl font-serif italic text-[#4a3f35] mb-1">{currentRune.name}</h3>
                        <p className="text-[#c2b280] uppercase tracking-widest text-[10px] font-black mb-3">Significato</p>
                        <p className="text-sm text-[#4a3f35] font-medium leading-relaxed px-4">
                          {currentRune.meaning}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {selectedRunesIds.length > 0 && (
                <div className="flex flex-col items-center gap-4 pb-20">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-[#5a5a40]">Rune estratte per il report: {selectedRunesIds.length}</p>
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={generateRunePDF}
                    className="inline-flex items-center gap-2 bg-[#c2b280] text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-[#b1a170] transition-all"
                  >
                    <Download size={16} /> Scarica Report Rune
                  </motion.button>
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={async () => {
                      if (!user) { alert("Effettua il login per salvare."); return; }
                      await saveRuneReading(userData.domandaRune, selectedRunesIds);
                      alert("Questionario Rune salvato in Area Personale!");
                      fetchHistory(user.uid);
                    }}
                    className="inline-flex items-center gap-2 bg-[#4a3f35] text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-black transition-all"
                  >
                    <Check size={16} /> Salva nel Profilo
                  </motion.button>
                </div>
              )}
            </header>
          </motion.div>
        ) : currentPage === 'percorsi' ? (
          <motion.div 
            key="percorsi"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col p-4 sm:p-8 overflow-y-auto"
          >
            <header className="mb-12 text-center relative">
              <button 
                onClick={() => setCurrentPage('home')}
                className="absolute left-0 top-0 p-2 text-[#5a5a40] hover:bg-white rounded-full transition-colors"
              >
                <X size={20} className="sm:size-6" />
              </button>
              
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#c2b280] rounded-full text-white mb-4 shadow-lg border border-[#b1a170]">
                <Sparkles size={32} />
              </div>
              <h2 className="font-serif italic text-4xl mb-2 text-[#4a3f35]">Guida ai Percorsi di Guarigione Alchemica</h2>
              <p className="text-[#c2b280] uppercase tracking-[0.3em] text-[10px] font-black">Dall’Invisibile alla Libertà: Il Metodo Graziamaria</p>
            </header>

            <main className="max-w-4xl mx-auto space-y-12 pb-20">
              {/* Intro */}
              <section className="bg-white p-8 sm:p-12 rounded-[3rem] shadow-sm border border-[#e5e0d8] text-center">
                <p className="text-[#4a3f35] leading-relaxed opacity-90 text-lg italic">
                  Benvenuto in un percorso di trasformazione profonda. Se sei qui, è perché senti che il tuo malessere ha radici che la medicina tradizionale o i trattamenti classici non sono riusciti a scogliere. Graziamaria, la <span className="text-[#c2b280] font-bold">Risolutrice dell’Invisibile</span>, utilizza il corpo come portale per accedere alla tua verità interiore.
                </p>
              </section>

              {/* Step 1 */}
              <section className="bg-[#fdfbf7] p-8 sm:p-12 rounded-[3rem] border border-[#e5e0d8] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <span className="text-9xl font-serif italic">1</span>
                </div>
                <h3 className="font-serif italic text-2xl text-[#4a3f35] mb-6 flex items-center gap-4">
                  <span className="w-10 h-10 rounded-full bg-[#c2b280] text-white flex items-center justify-center text-sm font-black shrink-0">1</span>
                  IL PRIMO PASSO: L'ANAMNESI ALCHEMICA (Gratuita)
                </h3>
                <div className="space-y-6 text-[#4a3f35]">
                  <p className="opacity-90">Il viaggio inizia sempre dai tuoi piedi. Non sono solo estremità, ma una mappa millimetrica della tua anima e della tua storia.</p>
                  <ul className="space-y-4">
                    <li className="flex gap-3">
                      <span className="font-bold text-[#c2b280] shrink-0">• Come funziona:</span>
                      <span className="opacity-80">Carica tramite il modulo qui sotto le foto delle piante dei tuoi piedi (pianta sinistra e pianta destra) per iniziare la tua Anamnesi Gratuita. Verranno salvate nella tua area personale e potrai inviarle anche su WhatsApp per un contatto diretto.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-[#c2b280] shrink-0">• Cosa riceverai:</span>
                      <span className="opacity-80">Graziamaria analizzerà i segni, le tensioni e le proiezioni dei tuoi organi vitali. Riceverai un resoconto scritto personalizzato che individuerà i tuoi blocchi emotivi e fisici attuali.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-[#c2b280] shrink-0">• Costo:</span>
                      <span className="opacity-80">€ 0,00 (Offerta limitata a 5 utenti a settimana).</span>
                    </li>
                  </ul>
                  <div className="pt-6">
                    <button 
                      onClick={openCandidacyModal}
                      className="bg-[#c2b280] text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-[#b1a170] transition-all shadow-lg flex items-center gap-3 group"
                    >
                      <Camera size={16} className="group-hover:scale-110 transition-transform" /> Carica foto dei piedi
                    </button>
                    <p className="text-[10px] opacity-40 mt-3 italic leading-relaxed">
                      Le foto devono riguardare esclusivamente la pianta del piede (sia sinistro che destro). Verranno archiviate nel tuo profilo per permettere a Graziamaria di visionarle.
                    </p>
                  </div>
                </div>
              </section>

              {/* Step 2 */}
              <section className="space-y-8">
                <h3 className="font-serif italic text-3xl text-[#4a3f35] text-center">2. I PERCORSI DI TRASFORMAZIONE</h3>
                <p className="text-center text-sm opacity-70 max-w-2xl mx-auto">Una volta individuata la radice del blocco, puoi scegliere come procedere per ripristinare il tuo equilibrio energetico e fisico.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Option A */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-[#e5e0d8] shadow-sm flex flex-col">
                    <h4 className="font-serif italic text-xl text-[#4a3f35] mb-2">A. SESSIONE DI SBLOCCO INDIVIDUALE</h4>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-[#c2b280] mb-6">Premium</p>
                    <div className="space-y-4 text-sm opacity-90 flex-1">
                      <p>Una sessione intensiva per agire direttamente sulla causa primaria emersa dall'anamnesi.</p>
                      <ul className="space-y-2">
                        <li><span className="font-bold">Durata:</span> 50 minuti (Zoom o WhatsApp)</li>
                        <li><span className="font-bold">Cosa include:</span> Trattamento energetico (Reiki/Cristalli), lavaggio emozionale e indicazioni pratiche.</li>
                        <li><span className="font-bold">Ideale per:</span> Problemi specifici e cronici.</li>
                      </ul>
                    </div>
                    <div className="mt-8 pt-6 border-t border-[#f0f0f0] text-center">
                      <span className="text-2xl font-serif italic text-[#4a3f35]">€ 180,00</span>
                    </div>
                  </div>

                  {/* Option B */}
                  <div className="bg-[#4a3f35] p-8 rounded-[2.5rem] border border-[#3a2f25] shadow-lg flex flex-col text-white">
                    <h4 className="font-serif italic text-xl mb-2">B. PERCORSO "INNER LIGHT CIRCLE"</h4>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-[#c2b280] mb-6">Abbonamento Esclusivo</p>
                    <div className="space-y-4 text-sm opacity-90 flex-1">
                      <p>Il supporto continuo per chi desidera una trasformazione totale e duratura.</p>
                      <ul className="space-y-2 list-disc pl-4">
                        <li>1 Check-up energetico mensile.</li>
                        <li>Supporto "SOS Energia" via WhatsApp.</li>
                        <li>Consigli personalizzati Fiori e Cristalli.</li>
                        <li>Accesso prioritario allo studio.</li>
                      </ul>
                      <p className="italic text-xs opacity-70 pt-2">Ideale per chi vuole un supporto costante.</p>
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/10 text-center">
                      <span className="text-2xl font-serif italic">€ 250,00 <span className="text-xs opacity-60">/ mese</span></span>
                      <p className="text-[10px] opacity-50 mt-1 uppercase tracking-tighter">Minimo 3 mesi</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Step 3 */}
              <section className="bg-white p-8 sm:p-12 rounded-[3rem] shadow-sm border border-[#e5e0d8]">
                <h3 className="font-serif italic text-2xl text-[#4a3f35] mb-8 text-center">3. PERCHÉ SCEGLIERE IL METODO GRAZIAMARIA?</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center mb-10">
                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-[#fdfbf7] rounded-full flex items-center justify-center mx-auto text-[#c2b280]">
                      <Sparkles size={20} />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest">Cristalloterapia & Reiki</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-[#fdfbf7] rounded-full flex items-center justify-center mx-auto text-[#c2b280]">
                      <Heart size={20} />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest">Fiori di Bach</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-[#fdfbf7] rounded-full flex items-center justify-center mx-auto text-[#c2b280]">
                      <Share2 size={20} />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest">Costellazioni Familiari</p>
                  </div>
                </div>
                <blockquote className="text-center border-t border-b border-[#f0f0f0] py-8 px-4">
                  <p className="font-serif italic text-xl text-[#4a3f35]">"Non vendo trattamenti, vendo la fine di un conflitto invisibile."</p>
                </blockquote>
              </section>

              {/* CTA */}
              <section className="bg-[#c2b280] p-8 sm:p-12 rounded-[3rem] text-white text-center shadow-xl">
                <h3 className="font-serif italic text-3xl mb-8">COME PROCEDERE?</h3>
                <div className="max-w-md mx-auto space-y-6 text-left mb-10">
                  <div className="flex gap-4 items-start">
                    <span className="w-6 h-6 rounded-full bg-white text-[#c2b280] flex items-center justify-center text-xs font-black shrink-0 mt-1">1</span>
                    <p className="text-sm font-medium">Prenota la tua Anamnesi Gratuita inviando le foto su WhatsApp.</p>
                  </div>
                  <div className="flex gap-4 items-start">
                    <span className="w-6 h-6 rounded-full bg-white text-[#c2b280] flex items-center justify-center text-xs font-black shrink-0 mt-1">2</span>
                    <p className="text-sm font-medium">Leggi il Resoconto che Graziamaria scriverà per te.</p>
                  </div>
                  <div className="flex gap-4 items-start">
                    <span className="w-6 h-6 rounded-full bg-white text-[#c2b280] flex items-center justify-center text-xs font-black shrink-0 mt-1">3</span>
                    <p className="text-sm font-medium">Candidati per un Percorso: Graziamaria seleziona solo clienti realmente pronti al cambiamento profondo.</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (!user) {
                      alert("Per favore, effettua l'accesso per candidarti.");
                      login();
                    } else {
                      openCandidacyModal();
                    }
                  }}
                  className="inline-flex items-center gap-3 bg-white text-[#c2b280] px-10 py-4 rounded-full font-bold uppercase tracking-widest transition-all shadow-lg hover:shadow-xl active:scale-95"
                >
                  <Camera size={20} /> Carica Foto e Candidati
                </button>
              </section>
            </main>
          </motion.div>
        ) : currentPage === 'profile' ? (
          <motion.div 
            key="profile"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col p-4 sm:p-8 overflow-y-auto"
          >
            <header className="mb-12 text-center relative">
              <button 
                onClick={() => setCurrentPage('home')}
                className="absolute left-0 top-0 p-2 text-[#5a5a40] hover:bg-white rounded-full transition-colors"
              >
                <X size={20} className="sm:size-6" />
              </button>
              
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#4a3f35] rounded-full text-[#c2b280] mb-4 shadow-lg border border-[#3a2f25] overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <FileText size={32} />
                )}
              </div>
              <h2 className="font-serif italic text-4xl mb-2 text-[#4a3f35]">Area Personale</h2>
              <p className="text-[#c2b280] uppercase tracking-[0.3em] text-[10px] font-black">La tua storia con Graziamaria</p>
            </header>

            <main className="max-w-4xl mx-auto w-full space-y-12 pb-20">
              <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-[#e5e0d8]">
                <h3 className="font-serif italic text-2xl text-[#4a3f35] mb-6">Il tuo Percorso</h3>
                <p className="text-sm opacity-70 mb-8 leading-relaxed">
                  Qui troverai lo storico delle tue consultazioni e le mappature che hai effettuato con i nostri strumenti digitali. Utilizza queste informazioni come diario per la tua evoluzione interiore.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                  {/* Nuova Sezione Portale Visivo in Profilo */}
                  <div className="p-6 bg-[#fdfbf7] rounded-3xl border border-[#e5e0d8] text-center flex flex-col min-h-[300px]">
                    <Camera className="mx-auto mb-4 text-[#c2b280]" size={24} />
                    <h4 className="font-bold text-xs uppercase tracking-widest mb-1">Portale Visivo</h4>
                    <p className="text-[10px] opacity-50 mb-4">Le tue ultime foto caricate</p>
                    <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[220px] scrollbar-hide">
                      {(() => {
                        const profilePhotos = userProfile?.photoUrls || [];
                        const candidacyPhotos = userCandidacies.length > 0 ? userCandidacies[0].photoUrls : [];
                        const displayPhotos = profilePhotos.length > 0 ? profilePhotos : candidacyPhotos;

                        return displayPhotos && displayPhotos.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {displayPhotos.map((url: string, idx: number) => (
                              <img 
                                key={idx} 
                                src={url} 
                                alt="Piedi" 
                                className="w-full aspect-square object-cover rounded-xl border border-white shadow-sm cursor-pointer" 
                                onClick={() => window.open(url, '_blank')}
                                referrerPolicy="no-referrer"
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-[#e5e0d8] rounded-2xl opacity-40 italic text-[10px] p-4">
                            Nessuna foto nel profilo. Caricale dai "Percorsi".
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="p-6 bg-[#fdfbf7] rounded-3xl border border-[#e5e0d8] text-center flex flex-col min-h-[300px]">
                    <Sparkles className="mx-auto mb-4 text-[#c2b280]" size={24} />
                    <h4 className="font-bold text-xs uppercase tracking-widest mb-1">Rune</h4>
                    <div className="flex-1 space-y-2 mt-4 text-left overflow-y-auto max-h-[220px] scrollbar-hide pr-1">
                      {runeHistory.map(rh => (
                        <div key={rh.id} className="p-3 bg-white rounded-xl border border-[#e5e0d8] text-[10px] shadow-sm">
                          <p className="font-bold text-[#c2b280]">{rh.timestamp?.toDate ? rh.timestamp.toDate().toLocaleDateString('it-IT') : 'Recente'}</p>
                          <p className="opacity-70 italic line-clamp-2">"{rh.question || 'Senza domanda'}"</p>
                          {(rh.runeNames || rh.runeIds) && (
                            <p className="mt-1 opacity-60 font-medium" translate="no">
                              Rune: {rh.runeNames ? rh.runeNames.join(', ') : rh.runeIds?.map((id: number) => RUNES.find(r => r.id === id)?.name).filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                      {runeHistory.length === 0 && <p className="text-[10px] opacity-40 text-center italic mt-10">Nessuna lettura salvata.</p>}
                    </div>
                  </div>
                  <div className="p-6 bg-[#fdfbf7] rounded-3xl border border-[#e5e0d8] text-center flex flex-col min-h-[300px]">
                    <Heart className="mx-auto mb-4 text-[#c2b280]" size={24} />
                    <h4 className="font-bold text-xs uppercase tracking-widest mb-1">Fiori</h4>
                    <div className="flex-1 space-y-2 mt-4 text-left overflow-y-auto max-h-[220px] scrollbar-hide pr-1">
                      {flowerHistory.map(fh => (
                        <div key={fh.id} className="p-3 bg-white rounded-xl border border-[#e5e0d8] text-[10px] shadow-sm">
                          <p className="font-bold text-[#c2b280]">{fh.timestamp?.toDate ? fh.timestamp.toDate().toLocaleDateString('it-IT') : 'Recente'}</p>
                          <p className="opacity-70">{fh.flowerIds?.length || 0} Fiori selezionati</p>
                          {(fh.flowerNames || fh.flowerIds) && (
                            <p className="mt-1 opacity-60 font-medium" translate="no">
                              Fiori: {fh.flowerNames ? fh.flowerNames.join(', ') : fh.flowerIds?.map((id: number) => BACH_FLOWERS.find(f => f.id === id)?.name).filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                      {flowerHistory.length === 0 && <p className="text-[10px] opacity-40 text-center italic mt-10">Nessuna selezione salvata.</p>}
                    </div>
                  </div>
                  <div className="p-6 bg-[#fdfbf7] rounded-3xl border border-[#e5e0d8] text-center flex flex-col min-h-[300px]">
                    <Share2 className="mx-auto mb-4 text-[#c2b280]" size={24} />
                    <h4 className="font-bold text-xs uppercase tracking-widest mb-1">Costellazioni</h4>
                    <div className="flex-1 space-y-2 mt-4 text-left overflow-y-auto max-h-[220px] scrollbar-hide pr-1">
                      {constellationHistory.map(ch => (
                          <div key={ch.id} className="p-3 bg-white rounded-xl border border-[#e5e0d8] text-[10px] shadow-sm notranslate">
                            <p className="font-bold text-[#c2b280]">{ch.timestamp?.toDate ? ch.timestamp.toDate().toLocaleDateString('it-IT') : 'Recente'}</p>
                            <p className="opacity-70">{ch.characters?.length || 0} Elementi posizionati</p>
                            {ch.characters && ch.characters.length > 0 && (
                              <p className="mt-1 opacity-60 font-medium italic">
                                "{ch.characters.map((c: any) => c.label).filter(Boolean).join(', ')}"
                              </p>
                            )}
                          </div>
                      ))}
                      {constellationHistory.length === 0 && <p className="text-[10px] opacity-40 text-center italic mt-10">Nessuna costellazione salvata.</p>}
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#f0f0f0] pt-10">
                  <h3 className="font-serif italic text-2xl text-[#4a3f35] mb-6">Le tue Candidature</h3>
                  {(userCandidacies.length > 0 || (userProfile?.photoUrls && userProfile.photoUrls.length > 0)) ? (
                    <div className="space-y-6">
                      {userProfile?.photoUrls && userProfile.photoUrls.length > 0 && userCandidacies.length === 0 && (
                        <div className="p-6 bg-white rounded-3xl border border-[#e5e0d8] shadow-sm">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="text-[10px] font-bold text-[#c2b280] uppercase tracking-widest">Stato Portale</p>
                              <p className="text-sm font-serif italic">Foto caricate nel profilo</p>
                            </div>
                            <span className="px-3 py-1 bg-green-50 border border-green-200 rounded-full text-[8px] font-black uppercase tracking-tighter text-green-600">
                              Foto Salvate
                            </span>
                          </div>
                          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {userProfile.photoUrls.map((url: string, idx: number) => (
                              <img key={idx} src={url} alt="Piedi" className="w-20 h-20 object-cover rounded-xl shadow-sm border border-white" />
                            ))}
                          </div>
                          <p className="text-[10px] mt-4 opacity-50 italic">Hai caricato le foto ma non hai ancora inviato il questionario formale.</p>
                          <button 
                            onClick={openCandidacyModal}
                            className="mt-4 w-full py-4 bg-[#c2b280] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                          >
                            COMPLETA ANALISI ALCHEMICA (Inizia Ora)
                          </button>
                        </div>
                      )}
                      {userCandidacies.map((cand) => (
                        <div key={cand.id} className="p-6 bg-white rounded-3xl border border-[#e5e0d8] shadow-sm">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="text-[10px] font-bold text-[#c2b280] uppercase tracking-widest">Inviata il</p>
                              <p className="text-sm font-serif italic">{cand.createdAt?.toDate ? cand.createdAt.toDate().toLocaleDateString('it-IT') : 'Recentemente'}</p>
                            </div>
                            <span className="px-3 py-1 bg-[#fdfbf7] border border-[#e5e0d8] rounded-full text-[8px] font-black uppercase tracking-tighter text-[#c2b280]">
                              In Fase di Analisi
                            </span>
                          </div>
                          <p className="text-sm opacity-80 mb-4 italic leading-relaxed">"{cand.message || 'Nel messaggio hai scritto: il cliente non ha aggiunto note'}"</p>
                          {cand.photoUrls && cand.photoUrls.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                              {cand.photoUrls.map((url: string, idx: number) => (
                                <img key={idx} src={url} alt="Piedi" className="w-20 h-20 object-cover rounded-xl shadow-sm border border-white" />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-[#fdfbf7] rounded-3xl border border-dashed border-[#e5e0d8]">
                      <Camera className="mx-auto mb-4 text-[#c2b280] opacity-30" size={32} />
                      <p className="text-sm opacity-50 italic">Non hai ancora inviato candidature con foto.</p>
                      <button 
                        onClick={() => setCurrentPage('percorsi')}
                        className="mt-4 text-[#c2b280] text-xs font-bold uppercase tracking-widest hover:underline"
                      >
                        Inizia Ora
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center italic opacity-60 text-sm">
                "Ogni passo salvato è una verità ritrovata."
              </div>
            </main>
          </motion.div>
        ) : currentPage === 'accademia' ? (
          <motion.div 
            key="accademia"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col p-4 sm:p-8 overflow-y-auto"
          >
            <header className="mb-12 text-center relative">
              <button 
                onClick={() => setCurrentPage('home')}
                className="absolute left-0 top-0 p-2 text-[#5a5a40] hover:bg-white rounded-full transition-colors"
              >
                <X size={20} className="sm:size-6" />
              </button>
              
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#4a3f35] rounded-full text-[#c2b280] mb-4 shadow-lg border border-[#3a2f25]">
                <BookOpen size={32} />
              </div>
              <h2 className="font-serif italic text-4xl mb-2 text-[#4a3f35]">Accademia di Graziamaria</h2>
              <p className="text-[#c2b280] uppercase tracking-[0.3em] text-[10px] font-black">Percorso di Apprendimento Olistico</p>
            </header>

            <main className="max-w-4xl mx-auto space-y-12 pb-20">
              {/* Introduction */}
              <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-[#e5e0d8]">
                <h3 className="font-serif italic text-2xl text-[#4a3f35] mb-6">Benvenuto nell'Accademia</h3>
                <p className="text-[#4a3f35] leading-relaxed opacity-90">
                  L'Accademia è lo spazio dedicato a chi desidera approfondire la conoscenza delle discipline olistiche utilizzate da Graziamaria. Qui potrai apprendere le basi teoriche e pratiche per comprendere meglio te stesso e il mondo invisibile che ci circonda.
                </p>
              </section>

              {/* Modules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[#fdfbf7] p-8 rounded-[2.5rem] border border-[#e5e0d8] space-y-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#c2b280] shadow-sm">
                    <Share2 size={24} />
                  </div>
                  <h4 className="font-serif italic text-xl text-[#4a3f35]">Costellazioni Familiari</h4>
                  <p className="text-sm text-[#4a3f35] opacity-80 leading-relaxed">
                    Apprendi come i legami familiari invisibili influenzano la tua vita presente. Scopri come sciogliere i nodi del passato per vivere con maggiore libertà e consapevolezza.
                  </p>
                </div>

                <div className="bg-[#fdfbf7] p-8 rounded-[2.5rem] border border-[#e5e0d8] space-y-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#c2b280] shadow-sm">
                    <Heart size={24} />
                  </div>
                  <h4 className="font-serif italic text-xl text-[#4a3f35]">Fiori di Bach</h4>
                  <p className="text-sm text-[#4a3f35] opacity-80 leading-relaxed">
                    Studia il potere vibrazionale dei fiori. Impara a riconoscere le emozioni e a selezionare i rimedi naturali più adatti per riportare l'equilibrio interiore.
                  </p>
                </div>

                <div className="bg-[#fdfbf7] p-8 rounded-[2.5rem] border border-[#e5e0d8] space-y-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#c2b280] shadow-sm">
                    <Sparkles size={24} />
                  </div>
                  <h4 className="font-serif italic text-xl text-[#4a3f35]">Saggezza delle Rune</h4>
                  <p className="text-sm text-[#4a3f35] opacity-80 leading-relaxed">
                    Esplora l'antico alfabeto norreno non solo come scrittura, ma come sistema di simboli archetipici per la guida spirituale e la divinazione.
                  </p>
                </div>

                <div className="bg-[#4a3f35] p-8 rounded-[2.5rem] border border-[#3a2f25] space-y-4 text-white">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-[#c2b280] shadow-sm">
                    <Check size={24} />
                  </div>
                  <h4 className="font-serif italic text-xl">Il Metodo Integrato</h4>
                  <p className="text-sm opacity-80 leading-relaxed">
                    Scopri come Graziamaria unisce queste potenti discipline in un unico metodo diagnostico e curativo di precisione millimetrica.
                  </p>
                </div>
              </div>

              {/* Call to Action */}
              <div className="text-center pt-8">
                <p className="font-serif italic text-lg text-[#4a3f35] mb-6">
                  "La conoscenza è il primo passo verso la guarigione."
                </p>
                <button 
                  onClick={() => setCurrentPage('home')}
                  className="bg-[#c2b280] text-white px-10 py-4 rounded-full text-sm font-bold uppercase tracking-widest shadow-xl hover:bg-[#b1a170] transition-all"
                >
                  Torna alla Home
                </button>
              </div>
            </main>
          </motion.div>
        ) : (
          <motion.div 
            key="fiori"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col p-4 sm:p-8 overflow-y-auto"
          >
            {/* Fiori Header */}
            <header className="mb-6 sm:mb-12 text-center relative">
              <button 
                onClick={() => setCurrentPage('home')}
                className="absolute left-0 top-0 p-2 text-[#5a5a40] hover:bg-white rounded-full transition-colors"
              >
                <X size={20} className="sm:size-6" />
              </button>
              
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full text-[#c2b280] mb-2 sm:mb-4 shadow-md border border-[#e5e0d8]">
                <Heart size={24} className="sm:size-8" fill="currentColor" />
              </div>
              <h2 className="font-serif italic text-3xl sm:text-4xl mb-1 sm:mb-2 text-[#4a3f35]">Fiori di Bach</h2>
              <p className="text-[#c2b280] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[8px] sm:text-[10px] font-black mb-6">Simulazione Interattiva per Diagnosi Olistica</p>
              
              {/* User Data Section */}
              <div className="flex flex-wrap gap-3 justify-center w-full max-w-2xl mx-auto mb-8">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Nome" 
                    value={userData.nome}
                    onChange={(e) => setUserData({...userData, nome: e.target.value})}
                    className="px-4 py-2 bg-white/80 border border-[#e5e0d8] rounded-full text-xs focus:ring-2 focus:ring-[#c2b280] outline-none w-40 transition-all"
                  />
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    placeholder="Età" 
                    value={userData.eta}
                    onChange={(e) => setUserData({...userData, eta: e.target.value})}
                    className="px-4 py-2 bg-white/80 border border-[#e5e0d8] rounded-full text-xs focus:ring-2 focus:ring-[#c2b280] outline-none w-20 transition-all"
                  />
                </div>
                <div className="relative">
                  <select 
                    value={userData.sesso}
                    onChange={(e) => setUserData({...userData, sesso: e.target.value})}
                    className="px-4 py-2 bg-white/80 border border-[#e5e0d8] rounded-full text-xs focus:ring-2 focus:ring-[#c2b280] outline-none transition-all appearance-none pr-8"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%235a5a40\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '12px' }}
                  >
                    <option value="">Sesso</option>
                    <option value="M">M</option>
                    <option value="F">F</option>
                  </select>
                </div>
              </div>
              
              <div className="max-w-2xl mx-auto bg-white/40 backdrop-blur-sm p-4 sm:p-6 rounded-2xl border border-[#e5e0d8] shadow-sm mb-8">
                <p className="text-[#4a3f35] text-xs sm:text-sm italic leading-relaxed">
                  "Visualizza e scegli i tuoi fiori. La tua scelta verrà salvata nel report che potrai inviare a Graziamaria per la spiegazione che ti sbalordirà"
                </p>
              </div>
            </header>

            {/* Search & Download */}
            <div className="max-w-4xl mx-auto w-full mb-8 sm:mb-12 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c2b280] size-4 sm:size-[18px]" />
                <input 
                  type="text" 
                  placeholder="Cerca un fiore..." 
                  value={flowerSearch}
                  onChange={(e) => setFlowerSearch(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-white border border-[#e5e0d8] rounded-xl sm:rounded-2xl shadow-sm focus:ring-2 focus:ring-[#c2b280] outline-none transition-all text-xs sm:text-sm"
                />
              </div>
              
              {selectedFlowersIds.length > 0 && (
                <>
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={generateFlowerPDF}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 bg-[#c2b280] text-white rounded-xl sm:rounded-2xl shadow-md hover:bg-[#b0a070] transition-all font-bold text-xs sm:text-sm whitespace-nowrap"
                  >
                    <Download size={16} className="sm:size-5" />
                    Scarica Report ({selectedFlowersIds.length})
                  </motion.button>
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={async () => {
                      if (!user) { alert("Effettua il login per salvare."); return; }
                      await saveFlowerReading(selectedFlowersIds);
                      alert("Fiori salvati in Area Personale!");
                      fetchHistory(user.uid);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 bg-[#4a3f35] text-white rounded-xl sm:rounded-2xl shadow-md hover:bg-black transition-all font-bold text-xs sm:text-sm whitespace-nowrap border border-white/20"
                  >
                    <Check size={16} className="sm:size-5" />
                    Salva nel Profilo
                  </motion.button>
                </>
              )}
            </div>

            {/* Flowers Grid */}
            <motion.div 
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05
                  }
                }
              }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 max-w-6xl mx-auto w-full pb-20"
            >
              {filteredFlowers.map((flower) => (
                <motion.button
                  key={flower.id}
                  layoutId={`flower-${flower.id}`}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0 }
                  }}
                  onClick={() => setSelectedFlower(flower)}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-sm border border-[#e5e0d8] group hover:shadow-xl transition-all text-left flex flex-col"
                >
                  <div className="aspect-square relative overflow-hidden bg-[#f8f5f0]/50">
                    <img 
                      src={flower.image} 
                      alt={flower.name}
                      className="w-full h-full object-contain p-2 transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 w-6 h-6 sm:w-8 sm:h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-[8px] sm:text-[10px] font-black text-[#c2b280] shadow-sm">
                      {flower.id}
                    </div>
                    {selectedFlowersIds.includes(flower.id) && (
                      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-6 h-6 sm:w-8 sm:h-8 bg-[#c2b280] text-white rounded-full flex items-center justify-center shadow-md">
                        <Check size={12} className="sm:size-5" strokeWidth={4} />
                      </div>
                    )}
                  </div>
                  <div className="p-3 sm:p-4 flex-1 flex flex-col">
                    <h4 className="font-serif italic text-base sm:text-lg text-[#4a3f35] group-hover:text-[#c2b280] transition-colors truncate">{flower.name}</h4>
                    <p className="text-[8px] sm:text-[9px] uppercase tracking-widest text-[#5a5a40] opacity-60 font-bold mb-1 sm:mb-2 truncate">{flower.scientificName}</p>
                    <div className="mt-auto pt-1 sm:pt-2 border-t border-[#f8f5f0] flex items-center justify-end">
                      <Info size={12} className="text-[#e5e0d8] sm:size-[14px] group-hover:text-[#c2b280] transition-colors" />
                    </div>
                  </div>
                </motion.button>
              ))}
            </motion.div>

            {/* Flower Detail Modal */}
            <AnimatePresence>
              {selectedFlower && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedFlower(null)}
                    className="absolute inset-0 bg-[#4a3f35]/60 backdrop-blur-md"
                  />
                  <motion.div 
                    layoutId={`flower-${selectedFlower.id}`}
                    className="bg-[#fdfbf7] w-full max-w-2xl rounded-3xl sm:rounded-[3rem] overflow-hidden shadow-2xl border border-[#e5e0d8] relative z-10 flex flex-col md:flex-row max-h-[90vh] overflow-y-auto md:overflow-visible"
                  >
                    <button 
                      onClick={() => setSelectedFlower(null)}
                      className="absolute right-3 top-3 sm:right-4 sm:top-4 z-20 p-2 bg-white/80 backdrop-blur-sm rounded-full text-[#4a3f35] hover:bg-white transition-colors shadow-sm"
                    >
                      <X size={18} className="sm:size-5" />
                    </button>

                    <div className="w-full md:w-1/2 aspect-square md:aspect-auto relative shrink-0 bg-[#f8f5f0]/50">
                      <img 
                        src={selectedFlower.image} 
                        alt={selectedFlower.name}
                        className="w-full h-full object-contain p-4"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 bg-white/90 backdrop-blur-sm px-3 py-1 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl shadow-lg">
                        <span className="text-xl sm:text-2xl font-serif italic text-[#c2b280]">#{selectedFlower.id}</span>
                      </div>
                    </div>

                    <div className="p-6 sm:p-8 md:p-12 flex-1 flex flex-col justify-center">
                      <div className="mb-4 sm:mb-6">
                        <h3 className="font-serif italic text-3xl sm:text-4xl text-[#4a3f35] mb-1">{selectedFlower.name}</h3>
                        <p className="text-[10px] sm:text-xs italic text-[#5a5a40] opacity-60">{selectedFlower.scientificName}</p>
                      </div>
                      
                      <div className="space-y-4 sm:space-y-6">
                        <div className="flex flex-col gap-3">
                          <button 
                            onClick={() => toggleFlowerSelection(selectedFlower.id)}
                            className={`w-full py-3 sm:py-4 rounded-full font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-all shadow-md flex items-center justify-center gap-2 ${
                              selectedFlowersIds.includes(selectedFlower.id)
                                ? 'bg-white border-2 border-[#c2b280] text-[#c2b280]'
                                : 'bg-[#c2b280] text-white hover:bg-[#b0a070]'
                            }`}
                          >
                            {selectedFlowersIds.includes(selectedFlower.id) ? (
                              <>
                                <Check size={16} strokeWidth={3} />
                                Rimuovi dalla Scelta
                              </>
                            ) : (
                              <>
                                <Heart size={16} />
                                Scegli questo Fiore
                              </>
                            )}
                          </button>
                          
                          <button 
                            onClick={() => setSelectedFlower(null)}
                            className="w-full py-3 sm:py-4 bg-[#5a5a40] text-white rounded-full font-bold uppercase tracking-widest text-[10px] sm:text-xs hover:bg-[#4a4a35] transition-all shadow-md"
                          >
                            Chiudi Galleria
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Character Picker Modal */}
      <AnimatePresence>
        {showPicker && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#4a3f35]/40 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white p-4 sm:p-8 rounded-[24px] sm:rounded-[32px] shadow-2xl max-w-2xl w-full flex flex-col border border-[#e5e0d8]"
            >
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-serif italic">Scegli un Personaggio</h2>
                <button onClick={() => setShowPicker(false)} className="p-2 hover:bg-[#f8f5f0] rounded-full transition-colors">
                  <X size={20} className="sm:size-6" />
                </button>
              </div>

              <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 sm:gap-4 max-h-[60vh] overflow-y-auto p-1 sm:p-2">
                {CHARACTER_SHAPES.map((char, index) => (
                  <button
                    key={index}
                    onClick={() => selectCharacter(char)}
                    className="flex flex-col items-center p-2 sm:p-4 rounded-xl sm:rounded-2xl hover:bg-[#f8f5f0] border border-transparent hover:border-[#e5e0d8] transition-all group"
                  >
                    <div className="transform group-hover:scale-110 transition-transform">
                      {renderShape(char.shape, char.color, 'small')}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Draw Modal */}
      <AnimatePresence>
        {showLabelInput && drawingCharacter && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#4a3f35]/40 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] shadow-2xl max-w-md w-full flex flex-col items-center text-center border border-[#e5e0d8]"
            >
              <div className="mb-4 sm:mb-6 p-4 sm:p-8 bg-[#f8f5f0] rounded-2xl border border-[#e5e0d8] shadow-inner">
                {renderShape(drawingCharacter.shape, drawingCharacter.color)}
              </div>
              
              <h2 className="text-xl sm:text-2xl font-serif italic mb-1 sm:mb-2">Chi rappresenta per te?</h2>
              <p className="text-xs sm:text-sm opacity-60 mb-4 sm:mb-8">Dai un nome o un ruolo a questo personaggio</p>
              
              <div className="w-full space-y-3 sm:space-y-4">
                <div className="relative">
                  <input 
                    type="text"
                    value={tempLabel}
                    onChange={(e) => setTempLabel(e.target.value)}
                    placeholder="Scrivi qui..."
                    className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-[#f8f5f0] border border-[#e5e0d8] rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#5a5a40] transition-all text-base sm:text-lg"
                    autoFocus
                  />
                </div>

                <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                  {PREDEFINED_LABELS.slice(0, 8).map(label => (
                    <button 
                      key={label}
                      onClick={() => setTempLabel(label)}
                      className="px-2.5 py-1 text-[10px] sm:text-xs bg-[#f8f5f0] hover:bg-[#e5e0d8] rounded-full border border-[#e5e0d8] transition-colors"
                      translate="no"
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={confirmCharacter}
                  className="w-full py-3 sm:py-4 bg-[#5a5a40] text-white rounded-xl sm:rounded-2xl font-bold hover:bg-[#4a4a35] transition-all shadow-lg active:scale-95 mt-2 sm:mt-4 text-sm sm:text-base"
                >
                  Conferma e Posiziona
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Workflow Modal */}
      <AnimatePresence>
        {showWorkflowModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-[#4a3f35]/60 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white p-6 sm:p-10 rounded-[24px] sm:rounded-[32px] shadow-2xl max-w-lg w-full flex flex-col items-center text-center border border-[#e5e0d8]"
            >
              {workflowStep === 0 ? (
                <>
                  <h2 className="text-xl sm:text-2xl font-serif italic mb-4 leading-relaxed">
                    Adesso che hai posizionato tutti i personaggi e hai definito chi sono, desideri spostare qualcuno di essi, anche da un PIANO all'altro?
                  </h2>
                  <p className="text-sm text-red-600 font-bold mb-6 uppercase tracking-wider">
                    IMPORTANTE: fai uno screenshot di questa situazione prima di procedere.
                  </p>
                  <div className="flex flex-col gap-3 w-full">
                    <button 
                      onClick={() => setShowWorkflowModal(false)}
                      className="w-full py-4 bg-[#5a5a40] text-white rounded-2xl font-bold hover:bg-[#4a4a35] transition-all shadow-lg active:scale-95 uppercase tracking-widest text-sm"
                    >
                      SI (Sposta ancora)
                    </button>
                    <button 
                      onClick={() => {
                        setWorkflowStep(1);
                        // We stay in the modal to show the instructions
                      }}
                      className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95 uppercase tracking-widest text-sm"
                    >
                      INIZIA ANALISI
                    </button>
                    <button 
                      onClick={() => setShowWorkflowModal(false)}
                      className="w-full py-3 text-[#4a4a4a] font-medium hover:underline text-xs"
                    >
                      Annulla
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-xl sm:text-2xl font-serif italic mb-4 leading-relaxed">
                    Sei nella fase di Analisi.
                  </h2>
                  <p className="text-sm opacity-70 mb-8">
                    Adesso sposta il personaggio che ti rappresenta affianco ad ogni personaggio. Clicca su quel personaggio vicino al quale ti sei avvicinato e scrivi un ricordo ad esso legato.
                  </p>
                  <div className="flex flex-col gap-3 w-full">
                    <button 
                      onClick={() => setShowWorkflowModal(false)}
                      className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95 uppercase tracking-widest text-sm"
                    >
                      HO CAPITO, INIZIA
                    </button>
                    <button 
                      onClick={() => {
                        setWorkflowStep(0);
                        setShowWorkflowModal(false);
                      }}
                      className="w-full py-4 bg-[#dcdcdc] text-[#4a4a4a] rounded-2xl font-bold hover:bg-[#cecece] transition-all shadow-md active:scale-95 uppercase tracking-widest text-sm"
                    >
                      Torna al Posizionamento Libero
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analysis Modal */}
      <AnimatePresence>
        {analyzingCharacter && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-[#4a3f35]/60 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] shadow-2xl max-w-md w-full flex flex-col border border-[#e5e0d8]"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl sm:text-2xl font-serif italic">Analisi: {analyzingCharacter.label}</h2>
                <button onClick={() => setAnalyzingCharacter(null)} className="p-2 hover:bg-[#f8f5f0] rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium mb-3">Con {analyzingCharacter.label} provi una sensazione/ricordo:</p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setTempFeeling('piacevole')}
                      className={`flex-1 py-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${tempFeeling === 'piacevole' ? 'bg-green-50 border-green-500 text-green-700 shadow-inner' : 'border-[#e5e0d8] hover:bg-gray-50'}`}
                    >
                      <Heart size={18} fill={tempFeeling === 'piacevole' ? 'currentColor' : 'none'} />
                      <span className="font-bold text-xs uppercase">PIACEVOLE</span>
                    </button>
                    <button 
                      onClick={() => setTempFeeling('spiacevole')}
                      className={`flex-1 py-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${tempFeeling === 'spiacevole' ? 'bg-red-50 border-red-500 text-red-700 shadow-inner' : 'border-[#e5e0d8] hover:bg-gray-50'}`}
                    >
                      <Frown size={18} fill={tempFeeling === 'spiacevole' ? 'currentColor' : 'none'} />
                      <span className="font-bold text-xs uppercase">SPIACEVOLE</span>
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-3">Se ricordi un evento scrivilo qui sotto:</p>
                  <textarea 
                    value={tempMemory}
                    onChange={(e) => setTempMemory(e.target.value)}
                    placeholder="Scrivi qui il tuo ricordo..."
                    className="w-full p-4 bg-[#f8f5f0] border border-[#e5e0d8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a5a40] min-h-[120px] text-sm"
                  />
                </div>

                <button 
                  onClick={saveAnalysis}
                  className="w-full py-4 bg-[#5a5a40] text-white rounded-xl font-bold hover:bg-[#4a4a35] transition-all shadow-lg active:scale-95 uppercase tracking-widest text-sm"
                >
                  Salva Analisi
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Candidacy Modal */}
      <AnimatePresence>
        {showCandidacyModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-white/20"
            >
              <div className="flex-1 overflow-y-auto p-8 sm:p-12 scrollbar-thin scrollbar-thumb-[#c2b280]/20">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="font-serif italic text-3xl text-[#4a3f35]">Questionario Alchemico</h3>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-[#c2b280] font-black mt-1">Il Portale verso la tua Verità</p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowCandidacyModal(false);
                      setSubmissionResult(null);
                    }}
                    className="p-3 hover:bg-[#fdfbf7] rounded-full text-[#4a3f35] transition-all hover:rotate-90"
                  >
                    <X size={24} />
                  </button>
                </div>

                {submissionResult ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-8 text-center py-10"
                  >
                    <div className="w-20 h-20 bg-[#c2b280] rounded-full flex items-center justify-center mx-auto text-white shadow-xl mb-6">
                      <Check size={40} />
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-serif italic text-2xl text-[#4a3f35]">Messaggio Ricevuto</h4>
                      <div className="bg-[#fdfbf7] p-8 rounded-[2rem] border border-[#e5e0d8] text-[#4a3f35] leading-relaxed italic text-sm">
                        {submissionResult === 'complex' ? (
                          <>
                            "La tua situazione richiede la massima cura e un'energia purissima. Graziamaria ha deciso di dedicarti uno dei suoi slot speciali delle <strong>09:00 del mattino</strong>, il momento in cui la sua connessione è più profonda."
                          </>
                        ) : (
                          <>
                            "La tua richiesta è stata presa in carico. Graziamaria ti ha inserito nella sua lista d’attesa prioritaria e ti risponderà personalmente. Sei già nel suo cuore."
                          </>
                        )}
                      </div>
                      <p className="text-xs opacity-60">Abbiamo aperto WhatsApp per te, invia il messaggio generato per accelerare il processo.</p>
                    </div>

                    <button 
                      onClick={() => {
                        setShowCandidacyModal(false);
                        setSubmissionResult(null);
                      }}
                      className="px-10 py-4 bg-[#4a3f35] text-white rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-md"
                    >
                      Ho Capito
                    </button>
                  </motion.div>
                ) : (
                  <div className="space-y-10">
                    <div className="space-y-8">
                      {/* Step info */}
                      <div className="bg-[#fdfbf7] p-6 rounded-3xl border border-[#e5e0d8] text-sm italic opacity-80 leading-relaxed">
                        "Benvenuto. Rispondi con onestà. Queste domande servono a Graziamaria per preparare lo spazio energetico necessario al tuo sblocco."
                      </div>

                      {/* Question 1 */}
                      <div className="space-y-4">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-[#4a3f35] flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#c2b280] text-white flex items-center justify-center text-[10px]">1</span>
                          Il Punto di Rottura
                        </label>
                        <p className="text-[10px] opacity-50 italic">Descrivi il fastidio fisico o emotivo che oggi ti impedisce di sentirti leggera/o.</p>
                        <textarea 
                          value={candidacyForm.puntoRottura}
                          onChange={(e) => setCandidacyForm({...candidacyForm, puntoRottura: e.target.value})}
                          className="w-full p-5 bg-[#fdfbf7] border border-[#e5e0d8] rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-[#c2b280] min-h-[120px] text-sm"
                          placeholder="Mi sento bloccata nel..."
                        />
                      </div>

                      {/* Question 2 */}
                      <div className="space-y-4">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-[#4a3f35] flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#c2b280] text-white flex items-center justify-center text-[10px]">2</span>
                          La Radice del Tempo
                        </label>
                        <p className="text-[10px] opacity-50 italic">Da quanto convivi con questo blocco?</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[
                            { id: 'meno_mese', label: 'Meno di un mese' },
                            { id: 'qualche_mese', label: 'Qualche mese' },
                            { id: 'cronico', label: 'Problema cronico' }
                          ].map(opt => (
                            <button
                              key={opt.id}
                              onClick={() => setCandidacyForm({...candidacyForm, radiceTempo: opt.id as any})}
                              className={`p-4 rounded-2xl text-[10px] font-bold border transition-all ${
                                candidacyForm.radiceTempo === opt.id 
                                ? 'bg-[#c2b280] text-white border-[#c2b280] shadow-md scale-105' 
                                : 'bg-white text-[#4a3f35] border-[#e5e0d8] hover:border-[#c2b280]'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Question 3 */}
                      <div className="space-y-4">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-[#4a3f35] flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#c2b280] text-white flex items-center justify-center text-[10px]">3</span>
                          Il Termometro dell'Urgenza
                        </label>
                        <p className="text-[10px] opacity-50 italic">In una scala da 1 a 10, quanto è vitale per te risolvere questo problema proprio ora?</p>
                        <div className="space-y-2">
                          <input 
                            type="range"
                            min="1"
                            max="10"
                            step="1"
                            value={candidacyForm.termometroUrgenza}
                            onChange={(e) => setCandidacyForm({...candidacyForm, termometroUrgenza: parseInt(e.target.value)})}
                            className="w-full h-2 bg-[#f0f0f0] rounded-lg appearance-none cursor-pointer accent-[#c2b280]"
                          />
                          <div className="flex justify-between text-[10px] font-black text-[#c2b280]">
                            <span>1 - Calma</span>
                            <span className="text-xl italic">{candidacyForm.termometroUrgenza}</span>
                            <span>10 - Fuoco</span>
                          </div>
                        </div>
                      </div>

                      {/* Question 4 */}
                      <div className="space-y-4">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-[#4a3f35] flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#c2b280] text-white flex items-center justify-center text-[10px]">4</span>
                          L'Obiettivo Profondo
                        </label>
                        <p className="text-[10px] opacity-50 italic">Cosa cerchi veramente?</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {[
                            { id: 'sollievo', label: 'Sollievo momentaneo' },
                            { id: 'percorso', label: 'Percorso di sblocco totale' }
                          ].map(opt => (
                            <button
                              key={opt.id}
                              onClick={() => setCandidacyForm({...candidacyForm, obiettivoProfondo: opt.id as any})}
                              className={`p-4 rounded-2xl text-[10px] font-bold border transition-all ${
                                candidacyForm.obiettivoProfondo === opt.id 
                                ? 'bg-[#c2b280] text-white border-[#c2b280] shadow-md scale-105' 
                                : 'bg-white text-[#4a3f35] border-[#e5e0d8] hover:border-[#c2b280]'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Identity Section */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 block">Il tuo Nome</label>
                          <input 
                            type="text"
                            value={candidacyForm.nome}
                            onChange={(e) => setCandidacyForm({...candidacyForm, nome: e.target.value})}
                            className="w-full p-4 bg-[#fdfbf7] border border-[#e5e0d8] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c2b280] text-sm"
                            placeholder="Nome Completo"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 block">La tua Email</label>
                          <input 
                            type="email"
                            value={candidacyForm.email}
                            onChange={(e) => setCandidacyForm({...candidacyForm, email: e.target.value})}
                            className="w-full p-4 bg-[#fdfbf7] border border-[#e5e0d8] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c2b280] text-sm"
                            placeholder="Email per il report"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 block">Cellulare</label>
                          <input 
                            type="tel"
                            value={candidacyForm.telefono}
                            onChange={(e) => setCandidacyForm({...candidacyForm, telefono: e.target.value})}
                            className="w-full p-4 bg-[#fdfbf7] border border-[#e5e0d8] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c2b280] text-sm"
                            placeholder="Il tuo numero per WhatsApp"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 block">Età</label>
                          <input 
                            type="number"
                            value={candidacyForm.eta}
                            onChange={(e) => setCandidacyForm({...candidacyForm, eta: e.target.value})}
                            className="w-full p-4 bg-[#fdfbf7] border border-[#e5e0d8] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c2b280] text-sm"
                            placeholder="Anni"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 block">Città</label>
                          <input 
                            type="text"
                            value={candidacyForm.citta}
                            onChange={(e) => setCandidacyForm({...candidacyForm, citta: e.target.value})}
                            className="w-full p-4 bg-[#fdfbf7] border border-[#e5e0d8] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c2b280] text-sm"
                            placeholder="La tua città"
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-[#f8f5f0] rounded-2xl border border-[#e5e0d8] relative overflow-hidden group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-[#c2b280] rounded-full flex items-center justify-center text-white">
                            <Info size={16} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#c2b280]">Nota Importante</p>
                            <p className="text-[11px] opacity-70">Graziamaria ti risponderà direttamente su WhatsApp entro 48 ore.</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-[#4a3f35]">Patti di Guarigione</label>
                        <div className="space-y-3">
                          {[
                            { 
                              id: 'pattoFiducia', 
                              q: '5', 
                              text: 'Sei disposta/o ad affidarti totalmente al metodo della "Risolutrice dell\'Invisibile", accettando che la guarigione richieda la tua partecipazione attiva?' 
                            },
                            { 
                              id: 'rispettoSpazioSacro', 
                              q: '6', 
                              text: 'Sei consapevole che gli appuntamenti non possono essere spostati all\'ultimo momento per onorare l\'energia del lavoro?' 
                            },
                            { 
                              id: 'portaleVisivo', 
                              q: '7', 
                              text: 'Confermi di avere a disposizione le foto delle piante dei tuoi piedi (sinistro e destro) necessarie per l\'analisi?' 
                            }
                          ].map(patto => (
                            <button
                              key={patto.id}
                              onClick={() => setCandidacyForm(prev => ({...prev, [patto.id]: !prev[patto.id as keyof typeof prev]}))}
                              className={`w-full p-4 rounded-2xl text-[10px] text-left border transition-all flex items-start gap-3 ${
                                candidacyForm[patto.id as keyof typeof candidacyForm] 
                                ? 'bg-[#fdfbf7] border-[#c2b280] shadow-sm' 
                                : 'bg-white border-[#e5e0d8] opacity-60'
                              }`}
                            >
                              <div className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                candidacyForm[patto.id as keyof typeof candidacyForm]
                                ? 'bg-[#c2b280] border-[#c2b280] text-white'
                                : 'bg-white border-[#e5e0d8]'
                              }`}>
                                {candidacyForm[patto.id as keyof typeof candidacyForm] && <Check size={10} strokeWidth={4} />}
                              </div>
                              <span className="leading-relaxed"><strong className="text-[#c2b280]">{patto.q}.</strong> {patto.text}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Photo Upload Section */}
                      <div className="space-y-4 border-t border-[#f0f0f0] pt-8">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-[#4a3f35] flex items-center justify-between">
                          <span>Il Portale Visivo (Piante dei Piedi)</span>
                          <span className="text-[10px] opacity-40 font-normal">{(userProfile?.photoUrls?.length || 0) + candidacyFiles.length}/2 caricate</span>
                        </label>
                        <div className="flex flex-wrap gap-4">
                          {/* Existing Photos from Profile */}
                          {userProfile?.photoUrls?.map((url: string, idx: number) => (
                            <div key={`existing-${idx}`} className="w-20 h-20 rounded-2xl bg-[#fdfbf7] border border-[#c2b280] overflow-hidden relative group shadow-sm transition-transform hover:scale-105">
                              <img src={url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-[#c2b280]/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <CheckCircle2 size={24} className="text-[#c2b280]" />
                              </div>
                            </div>
                          ))}

                          {/* New Files */}
                          {candidacyFiles.map((file: File, idx) => (
                            <div key={`new-${idx}`} className="w-20 h-20 rounded-2xl bg-[#fdfbf7] border border-[#c2b280] overflow-hidden relative group shadow-sm transition-transform hover:scale-105">
                              <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                              <button 
                                onClick={() => setCandidacyFiles(prev => prev.filter((_, i) => i !== idx))}
                                className="absolute inset-0 bg-red-500/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                          ))}

                          {((userProfile?.photoUrls?.length || 0) + candidacyFiles.length) < 2 && (
                            <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-[#e5e0d8] flex flex-col items-center justify-center text-[#c2b280] cursor-pointer hover:border-[#c2b280] hover:bg-[#fdfbf7] transition-all group active:scale-95">
                              <input 
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files) {
                                    const slotsLeft = 2 - ((userProfile?.photoUrls?.length || 0) + candidacyFiles.length);
                                    const newFiles = Array.from(e.target.files).slice(0, slotsLeft);
                                    setCandidacyFiles(prev => [...prev, ...newFiles]);
                                  }
                                }}
                                className="hidden"
                              />
                              <Upload size={24} className="mb-1 group-hover:block hidden" />
                              <Plus size={24} className="group-hover:hidden" />
                              <span className="text-[10px] font-black">SOLO PIANTA</span>
                            </label>
                          )}
                        </div>
                        <p className="text-[10px] opacity-40 italic">Le foto della pianta (sinistra e destra) sono obbligatorie. Devono essere nitide per permettere una mappatura millimetrica.</p>
                      </div>

                      <button 
                        onClick={submitCandidacy}
                        disabled={isSubmittingCandidacy}
                        className="w-full py-6 bg-[#c2b280] text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs shadow-xl hover:bg-[#b1a170] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                      >
                        {isSubmittingCandidacy ? (
                          <>Sigillando il Portale...</>
                        ) : (
                          <>
                            <Sparkles size={20} /> Invia Candidatura Alchemica
                          </>
                        )}
                      </button>
                      <p className="text-[10px] text-center opacity-40 leading-relaxed px-4">Premendo il tasto sopra, accetti che i tuoi dati sensibili vengano trattati per fini di consulenza energetica da Graziamaria.</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
