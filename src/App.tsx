import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  X, 
  ChevronDown, 
  Share2, 
  Send,
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
  where,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage, handleFirestoreError } from './lib/firebase';

type BuildingSlotType = {
  floor: number; // 1 (pianoterra) .. 5 (ultimo piano)
  col: number;   // 0 .. 4 da sinistra dello schermo
};

type ConstellationLayoutType = 'stairs' | 'building';

// Types for our game
type CharacterType = {
  id: string;
  shape: 'conical-large' | 'conical-medium' | 'cylindrical-large' | 'cylindrical-medium' | 'cylindrical-small' | 'flat-large' | 'flat-medium' | 'block';
  color: string;
  label: string;
  x: number;
  y: number;
  stair?: 'upper' | 'lower';
  normalizedX?: number;
  slot?: BuildingSlotType;
  feeling?: 'piacevole' | 'spiacevole';
  memory?: string;
  snapSeq?: number;
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

const CHARACTER_PICKER_ORDER = [
  0, 1, 2, 24,
  3, 4, 5, 6, 25,
  7, 8, 9, 10, 26,
  11, 12, 13, 14, 27,
  15, 16, 17, 18, 28,
  19, 20, 21, 22, 29,
  23
] as const;

const CHARACTER_PICKER_SHAPES = CHARACTER_PICKER_ORDER.map(i => CHARACTER_SHAPES[i]);

const getCharacterShapeColorKey = (shape: string, color: string) => `${shape}::${color.toLowerCase()}`;

const PREDEFINED_LABELS = [
  "Io", "Mamma", "Papà", "Fratello", "Sorella", "Nonno", "Nonna", 
  "Partner", "Figlio", "Figlia", "Amico", "Lavoro", "Paura", "Sogno"
];

type PositionCharacter = Pick<CharacterType, 'id' | 'label' | 'x' | 'y'> & {
  stair?: 'upper' | 'lower';
  normalizedX?: number;
  slot?: BuildingSlotType;
  feeling?: 'piacevole' | 'spiacevole';
  memory?: string;
};

const STAGE_IMAGE_URL = '/assets/aistudio/gradini-frontali_8b28bf22.webp';
const STAGE_REF_WIDTH = 1600;
const STAGE_REF_HEIGHT = 900;

const BUILDING_IMAGE_URL = '/assets/aistudio/palazzo-liberty-5_4611a372.webp';
const BUILDING_HEADER_IMAGE_URL = '/assets/aistudio/palazzo-testata_dbc44ed0.webp';
const AKASHIC_CARD_IMAGE_URL = '/assets/aistudio/registri-card_20af54de.webp';
const AKASHIC_HEADER_IMAGE_URL = '/assets/aistudio/registri-testata_fcc679c8.webp';
const AKASHIC_AREAS = [
  'Amore e relazioni',
  "Missione dell'anima",
  'Blocchi interiori',
  'Evoluzione personale',
  'Relazioni familiari'
] as const;
const PRIVACY_AKASHIC_TEXT =
  "I dati personali inseriti in questo modulo (nome e cognome, eventuale data di nascita, indirizzo email, area di interesse e risposte alle domande) sono trattati esclusivamente da GraziaMaria Infantino per preparare e comunicare la lettura dei Registri Akashici richiesta. I dati non vengono ceduti a terzi né utilizzati per finalità promozionali. Puoi richiedere in qualsiasi momento l'accesso, la rettifica o la cancellazione dei tuoi dati contattando la titolare del trattamento.";
const AKASHIC_CHAPTERS = [
  {
    title: "CAPITOLO 1 – L'APERTURA",
    subtitle: 'Introduzione e intenzione della lettura'
  },
  {
    title: "CAPITOLO 2 – IL MESSAGGIO DELL'ANIMA",
    subtitle: 'Messaggio spirituale e simbolico dedicato alla persona'
  },
  {
    title: 'CAPITOLO 3 – LE DINAMICHE DELLA VITA',
    subtitle: 'Riflessioni su situazioni e relazioni ricorrenti'
  },
  {
    title: 'CAPITOLO 4 – LE FERITE INTERIORI',
    subtitle: 'Esplorazione di paure, insicurezze e convinzioni personali'
  },
  {
    title: "CAPITOLO 5 – I DONI DELL'ANIMA",
    subtitle: 'Qualità, talenti e risorse interiori'
  },
  {
    title: 'CAPITOLO 6 – IL CAMMINO EVOLUTIVO',
    subtitle: 'Possibili direzioni di crescita e consapevolezza'
  },
  {
    title: 'CAPITOLO 7 – IL MESSAGGIO CONCLUSIVO',
    subtitle: 'Riflessione finale, frase guida ed esercizio personale'
  }
] as const;

function countAkashicWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}
const BUILDING_REF_WIDTH = 1000;
const BUILDING_REF_HEIGHT = 1100;
const BUILDING_FLOORS = [5, 4, 3, 2, 1] as const;
const BUILDING_COLS = [0, 1, 2, 3, 4] as const;
const BUILDING_COL_X_PCTS = [14.8, 32.4, 50.0, 67.6, 85.2] as const;
const BUILDING_FLOOR_Y_PCTS = [82.7, 66.4, 50.0, 33.6, 17.3] as const;
const BUILDING_WINDOW_WIDTH_PCT = 12;
const BUILDING_WINDOW_HEIGHT_PCT = 10.9;
const MAX_BUILDING_FIGURES = 25;
const MAX_CONSTELLATION_FIGURES = 50;

function getBuildingSlotCenterPct(slot: BuildingSlotType): { xPct: number; yPct: number } {
  const floorIdx = Math.min(4, Math.max(0, Math.round(slot.floor) - 1));
  const colIdx = Math.min(4, Math.max(0, Math.round(slot.col)));
  return {
    xPct: BUILDING_COL_X_PCTS[colIdx],
    yPct: BUILDING_FLOOR_Y_PCTS[floorIdx]
  };
}

function getBuildingSlotRefCoords(slot: BuildingSlotType): { x: number; y: number } {
  const { xPct, yPct } = getBuildingSlotCenterPct(slot);
  return {
    x: Math.round((xPct / 100) * BUILDING_REF_WIDTH),
    y: Math.round((yPct / 100) * BUILDING_REF_HEIGHT)
  };
}

function isBuildingSlotOccupied(
  chars: Array<Pick<CharacterType, 'id' | 'slot'>>,
  slot: BuildingSlotType,
  ignoreCharId?: string
): boolean {
  return chars.some(
    c => c.id !== ignoreCharId && c.slot?.floor === slot.floor && c.slot?.col === slot.col
  );
}

function findNearestFreeBuildingSlot(
  xPct: number,
  yPct: number,
  chars: Array<Pick<CharacterType, 'id' | 'slot'>>,
  ignoreCharId?: string
): BuildingSlotType | null {
  let bestSlot: BuildingSlotType | null = null;
  let bestDist = Infinity;

  for (const floor of BUILDING_FLOORS) {
    for (const col of BUILDING_COLS) {
      const candidate = { floor, col };
      if (isBuildingSlotOccupied(chars, candidate, ignoreCharId)) continue;
      const center = getBuildingSlotCenterPct(candidate);
      const dx = xPct - center.xPct;
      const dy = (yPct - center.yPct) * (BUILDING_REF_HEIGHT / BUILDING_REF_WIDTH); // compensa rapporto 10:11 dell'immagine
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        bestSlot = candidate;
      }
    }
  }
  return bestSlot;
}

function getBuildingFigureScale(stageW: number): number {
  const safeW = stageW > 0 ? stageW : 520;
  const windowPx = safeW * (BUILDING_WINDOW_WIDTH_PCT / 100);
  // Il pupazzo più alto (large) misura 107px non scalato
  return Math.max(0.22, Math.min(0.55, (windowPx * 0.78) / 107));
}

const STAIR_GEOMETRY = {
  upper: { yRatio: 0.478, minXRatio: 0.2375, maxXRatio: 0.7625 },
  lower: { yRatio: 0.739, minXRatio: 0.0625, maxXRatio: 0.9375 }
} as const;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function getStairXRatio(stair: 'upper' | 'lower', normalizedX: number): number {
  const geom = STAIR_GEOMETRY[stair];
  return geom.minXRatio + clamp01(normalizedX) * (geom.maxXRatio - geom.minXRatio);
}

function snapStageRatioToStair(xRatio: number, yRatio: number): {
  stair: 'upper' | 'lower';
  normalizedX: number;
  x: number;
  y: number;
} {
  const distUpper = Math.abs(yRatio - STAIR_GEOMETRY.upper.yRatio);
  const distLower = Math.abs(yRatio - STAIR_GEOMETRY.lower.yRatio);
  const stair: 'upper' | 'lower' = distUpper <= distLower ? 'upper' : 'lower';
  const geom = STAIR_GEOMETRY[stair];
  const clampedXRatio = Math.min(geom.maxXRatio, Math.max(geom.minXRatio, xRatio));
  const rawNormalizedX = (clampedXRatio - geom.minXRatio) / (geom.maxXRatio - geom.minXRatio);
  const normalizedX = Math.round(clamp01(rawNormalizedX) * 1000) / 1000;
  const snappedXRatio = getStairXRatio(stair, normalizedX);
  return {
    stair,
    normalizedX,
    x: Math.round(snappedXRatio * STAGE_REF_WIDTH),
    y: Math.round(geom.yRatio * STAGE_REF_HEIGHT)
  };
}

function detectPendingDropStair(xRatio: number, yRatio: number): {
  stair: 'upper' | 'lower';
  normalizedX: number;
  x: number;
  y: number;
} | null {
  const upperMinX = STAIR_GEOMETRY.upper.minXRatio - 0.04;
  const upperMaxX = STAIR_GEOMETRY.upper.maxXRatio + 0.04;
  const lowerMinX = STAIR_GEOMETRY.lower.minXRatio - 0.04;
  const lowerMaxX = STAIR_GEOMETRY.lower.maxXRatio + 0.04;
  const midY = (STAIR_GEOMETRY.upper.yRatio + STAIR_GEOMETRY.lower.yRatio) / 2;

  let stair: 'upper' | 'lower' | null = null;
  if (yRatio >= 0.22 && yRatio <= midY && xRatio >= upperMinX && xRatio <= upperMaxX) {
    stair = 'upper';
  } else if (yRatio > midY && yRatio <= 0.96 && xRatio >= lowerMinX && xRatio <= lowerMaxX) {
    stair = 'lower';
  }
  if (!stair) return null;

  const geom = STAIR_GEOMETRY[stair];
  const clampedXRatio = Math.min(geom.maxXRatio, Math.max(geom.minXRatio, xRatio));
  const rawNormalizedX = (clampedXRatio - geom.minXRatio) / (geom.maxXRatio - geom.minXRatio);
  const normalizedX = Math.round(clamp01(rawNormalizedX) * 1000) / 1000;
  const snappedXRatio = getStairXRatio(stair, normalizedX);
  return {
    stair,
    normalizedX,
    x: Math.round(snappedXRatio * STAGE_REF_WIDTH),
    y: Math.round(geom.yRatio * STAGE_REF_HEIGHT)
  };
}

type ShapeDimensions = {
  bodyWidth: number;
  bodyHeight: number;
  headSize: number;
  isConical: boolean;
  isFlat: boolean;
  isBlock: boolean;
  totalHeight: number;
};

function getShapeBaseDimensions(shape: string): ShapeDimensions {
  let bodyWidth = 40;
  let bodyHeight = 64;
  let headSize = 32;
  const isConical = shape.includes('conical');
  const isFlat = shape.includes('flat');
  const isBlock = shape === 'block';

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

  const hasHead = !isBlock && !isFlat;
  const totalHeight = hasHead ? bodyHeight + headSize - headSize / 4 : bodyHeight;
  return { bodyWidth, bodyHeight, headSize, isConical, isFlat, isBlock, totalHeight };
}

function getFigureDensityScale(count: number): number {
  if (count > 20) return 0.65;
  if (count > 12) return 0.8;
  return 1;
}

function nudgeNormalizedXOnStair(
  stair: 'upper' | 'lower',
  candidateNormX: number,
  otherNormalizedXs: number[],
  densityScale: number
): number {
  if (otherNormalizedXs.length === 0) return candidateNormX;
  const stairSpan = STAIR_GEOMETRY[stair].maxXRatio - STAIR_GEOMETRY[stair].minXRatio;
  const overlapThresholdNorm = (0.020 * densityScale) / stairSpan;
  const stepNorm = (0.034 * densityScale) / stairSpan;

  const isTooClose = (nx: number) =>
    otherNormalizedXs.some(other => Math.abs(other - nx) < overlapThresholdNorm);

  if (!isTooClose(candidateNormX)) {
    return candidateNormX;
  }

  let nearest = otherNormalizedXs[0];
  let nearestDist = Infinity;
  for (const other of otherNormalizedXs) {
    const d = Math.abs(other - candidateNormX);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = other;
    }
  }
  const primaryDir = candidateNormX >= nearest ? 1 : -1;

  for (let k = 1; k <= 14; k += 1) {
    for (const dir of [primaryDir, -primaryDir]) {
      const candidate = clamp01(candidateNormX + dir * k * stepNorm);
      if (!isTooClose(candidate)) {
        return Math.round(candidate * 1000) / 1000;
      }
    }
  }

  return candidateNormX;
}

function getCharacterStairV2(character: PositionCharacter): 'upper' | 'lower' {
  if (character.stair === 'upper' || character.stair === 'lower') {
    return character.stair;
  }
  const distUpper = Math.abs(Number(character.y) - STAIR_GEOMETRY.upper.yRatio * STAGE_REF_HEIGHT);
  const distLower = Math.abs(Number(character.y) - STAIR_GEOMETRY.lower.yRatio * STAGE_REF_HEIGHT);
  return distUpper <= distLower ? 'upper' : 'lower';
}

function getCharacterNormalizedX(character: PositionCharacter): number {
  if (typeof character.normalizedX === 'number' && Number.isFinite(character.normalizedX)) {
    return clamp01(character.normalizedX);
  }
  const stair = getCharacterStairV2(character);
  const geom = STAIR_GEOMETRY[stair];
  const xRatio = Number(character.x) / STAGE_REF_WIDTH;
  return clamp01((xRatio - geom.minXRatio) / (geom.maxXRatio - geom.minXRatio));
}

function describeProximityBandByStageRatio(distanceStageRatio: number): 'vicino' | 'media' | 'lontano' {
  if (distanceStageRatio <= 0.14) return 'vicino';
  if (distanceStageRatio <= 0.30) return 'media';
  return 'lontano';
}

function describeCharacterPosition(
  characters: PositionCharacter[],
  targetId: string,
  layoutVersion?: number,
  layoutType?: ConstellationLayoutType | string
) {
  if (layoutVersion !== 2) {
    return {
      stair: '',
      summary: 'layout precedente: posizione non attendibile',
      isLegacy: true as const
    };
  }

  const target = characters.find(character => character.id === targetId);
  if (!target) return null;

  if (layoutType === 'building' || target.slot) {
    const slot = target.slot;
    if (!slot) {
      return {
        stair: 'Palazzo',
        summary: 'Palazzo · finestra non definita',
        isLegacy: false as const
      };
    }
    const parts = [`Piano ${slot.floor}`, `Finestra ${slot.col + 1} da sinistra`];
    const ioChar = characters.find(
      character => (character.label || '').trim().toLowerCase() === 'io'
    );
    if (!ioChar) {
      parts.push('riferimento a Io: non presente');
    } else if (ioChar.id !== target.id && ioChar.slot) {
      if (slot.floor > ioChar.slot.floor) parts.push('piano sopra Io');
      else if (slot.floor < ioChar.slot.floor) parts.push('piano sotto Io');
      else parts.push('stesso piano di Io');

      if (slot.col < ioChar.slot.col) parts.push('alla destra di Io');
      else if (slot.col > ioChar.slot.col) parts.push('alla sinistra di Io');
      else parts.push('in colonna con Io');
    }
    return {
      stair: `Piano ${slot.floor}`,
      summary: parts.join(' · '),
      isLegacy: false as const
    };
  }

  const targetStair = getCharacterStairV2(target);
  const targetNormX = getCharacterNormalizedX(target);
  const targetStageX = getStairXRatio(targetStair, targetNormX);
  const stairLabel = targetStair === 'upper' ? 'Gradino superiore' : 'Gradino inferiore';

  const ioChar = characters.find(
    character => (character.label || '').trim().toLowerCase() === 'io'
  );
  let ioRelation: string | null = null;
  if (!ioChar) {
    ioRelation = 'riferimento a Io: non presente';
  } else if (ioChar.id !== target.id) {
    const ioStageX = getStairXRatio(getCharacterStairV2(ioChar), getCharacterNormalizedX(ioChar));
    const diffStageX = targetStageX - ioStageX;
    if (Math.abs(diffStageX) < 0.04) {
      ioRelation = 'in linea con Io';
    } else if (diffStageX < 0) {
      // Prospettiva di Io (frontale allo schermo): sinistra sullo schermo = destra di Io
      ioRelation = 'alla destra di Io';
    } else {
      // Destra sullo schermo = sinistra di Io
      ioRelation = 'alla sinistra di Io';
    }
  }

  // Ordine da sinistra dalla prospettiva del pupazzo "Io" (normalizedX decrescente rispetto allo schermo)
  const sameStair = characters
    .filter(character => getCharacterStairV2(character) === targetStair)
    .sort((a, b) => {
      const diff = getCharacterNormalizedX(b) - getCharacterNormalizedX(a);
      if (Math.abs(diff) > 1e-6) return diff;
      return a.id.localeCompare(b.id);
    });

  const zeroBasedIndex = sameStair.findIndex(character => character.id === targetId);
  if (zeroBasedIndex < 0) return null;

  if (sameStair.length === 1) {
    const parts = [stairLabel, 'unica sul gradino'];
    if (ioRelation) parts.push(ioRelation);
    return {
      stair: stairLabel,
      summary: parts.join(' · '),
      isLegacy: false as const,
      normalizedX: targetNormX
    };
  }

  const orderText = `${zeroBasedIndex + 1}º da sinistra su ${sameStair.length}`;
  const others = sameStair.filter(character => character.id !== targetId);
  const overlapped = others.filter(other => {
    const otherStageX = getStairXRatio(targetStair, getCharacterNormalizedX(other));
    return Math.abs(otherStageX - targetStageX) < 0.035;
  });

  const leftNeighbor = zeroBasedIndex > 0 ? sameStair[zeroBasedIndex - 1] : null;
  const rightNeighbor = zeroBasedIndex < sameStair.length - 1 ? sameStair[zeroBasedIndex + 1] : null;
  const minDistanceStageRatio = Math.min(
    ...others.map(other => Math.abs(getStairXRatio(targetStair, getCharacterNormalizedX(other)) - targetStageX))
  );
  const proximity = describeProximityBandByStageRatio(minDistanceStageRatio);

  const parts: string[] = [stairLabel, orderText];

  if (overlapped.length > 0) {
    const names = overlapped.map(item => item.label || 'Senza nome').join(', ');
    parts.push(`sovrapposta a ${names}`);
  } else {
    const neighborParts: string[] = [];
    if (rightNeighbor) neighborParts.push(`${rightNeighbor.label || 'Senza nome'} alla sua destra`);
    if (leftNeighbor) neighborParts.push(`${leftNeighbor.label || 'Senza nome'} alla sua sinistra`);
    if (neighborParts.length === 1) {
      parts.push(`vicino: ${neighborParts[0]}`);
    } else if (neighborParts.length > 1) {
      parts.push(`vicini: ${neighborParts.join(', ')}`);
    }
    parts.push(`vicinanza: ${proximity}`);
  }

  if (ioRelation) {
    parts.push(ioRelation);
  }

  return {
    stair: stairLabel,
    summary: parts.join(' · '),
    isLegacy: false as const,
    normalizedX: targetNormX
  };
}

type PillPlacement = {
  char: CharacterType;
  stair: 'upper' | 'lower';
  lane: number;
  centerX: number;
  width: number;
  height: number;
  pillTopY: number;
  pillBottomY: number;
  wireStartY: number;
  figX: number;
  figAnchorY: number;
};

type PillLayoutResult = {
  stageW: number;
  stageH: number;
  topBandH: number;
  bottomBandH: number;
  totalH: number;
  pills: PillPlacement[];
};

function segmentsIntersect2D(
  ax: number, ay: number, bx: number, by: number,
  cx: number, cy: number, dx: number, dy: number
): boolean {
  const ccw = (p1x: number, p1y: number, p2x: number, p2y: number, p3x: number, p3y: number) =>
    (p3y - p1y) * (p2x - p1x) - (p2y - p1y) * (p3x - p1x);
  const d1 = ccw(cx, cy, dx, dy, ax, ay);
  const d2 = ccw(cx, cy, dx, dy, bx, by);
  const d3 = ccw(ax, ay, bx, by, cx, cy);
  const d4 = ccw(ax, ay, bx, by, dx, dy);
  return (
    ((d1 > 1e-3 && d2 < -1e-3) || (d1 < -1e-3 && d2 > 1e-3)) &&
    ((d3 > 1e-3 && d4 < -1e-3) || (d3 < -1e-3 && d4 > 1e-3))
  );
}

function computePillLayout(characters: CharacterType[], stageWidth: number): PillLayoutResult {
  const safeW = stageWidth > 0 ? stageWidth : 800;
  const stageH = (safeW * 9) / 16;
  const isMobileStage = safeW < 640;
  const densityScale = getFigureDensityScale(characters.length);
  const effectiveScale = (isMobileStage ? 0.75 : 1) * densityScale;

  const PILL_H = isMobileStage ? 26 : 28;
  const LANE_GAP = 8;
  const LANE_STEP = PILL_H + LANE_GAP;
  const MIN_H_GAP = 8;
  const TOP_STAGE_GAP = 16;
  const BOTTOM_STAGE_GAP = 10;
  const OUTER_PAD = 6;

  type RelPlacedPill = {
    char: CharacterType;
    stair: 'upper' | 'lower';
    lane: number;
    centerX: number;
    width: number;
    relTopY: number;
    relBottomY: number;
    relWireStartY: number;
    figX: number;
    figAnchorRelY: number;
  };

  const layoutStairPills = (stair: 'upper' | 'lower'): { placed: RelPlacedPill[]; maxLane: number } => {
    const items = characters
      .filter(c => getCharacterStairV2(c) === stair)
      .map(char => {
        const figX = getStairXRatio(stair, getCharacterNormalizedX(char)) * safeW;
        const labelText = (char.label || 'Senza nome').trim() || 'Senza nome';
        const maxPillW = Math.min(isMobileStage ? 160 : 210, safeW - 12);
        const width = Math.min(
          maxPillW,
          Math.max(50, Math.round(labelText.length * (isMobileStage ? 7.4 : 8.0) + 28 + (char.feeling ? 22 : 0)))
        );
        const dims = getShapeBaseDimensions(char.shape);
        const figAnchorRelY =
          stair === 'upper'
            ? STAIR_GEOMETRY.upper.yRatio * stageH - dims.totalHeight * effectiveScale
            : STAIR_GEOMETRY.lower.yRatio * stageH;
        return { char, figX, width, figAnchorRelY };
      })
      .sort((a, b) => a.figX - b.figX || a.char.id.localeCompare(b.char.id));

    if (items.length === 0) return { placed: [], maxLane: -1 };

    const laneBoxes: Array<Array<{ left: number; right: number }>> = [];
    const placed: RelPlacedPill[] = [];

    const getRelBoxY = (lane: number) => {
      if (stair === 'upper') {
        const relBottomY = -(TOP_STAGE_GAP + lane * LANE_STEP);
        return { relTopY: relBottomY - PILL_H, relBottomY, relWireStartY: relBottomY };
      }
      const relTopY = stageH + BOTTOM_STAGE_GAP + lane * LANE_STEP;
      return { relTopY, relBottomY: relTopY + PILL_H, relWireStartY: relTopY };
    };

    const fitsInLane = (lane: number, left: number, right: number) => {
      const boxes = laneBoxes[lane] || [];
      return !boxes.some(box => left < box.right + MIN_H_GAP && right > box.left - MIN_H_GAP);
    };

    const crossesAnyWire = (cx: number, wireStartY: number, figX: number, figAnchorRelY: number) =>
      placed.some(p =>
        segmentsIntersect2D(cx, wireStartY, figX, figAnchorRelY, p.centerX, p.relWireStartY, p.figX, p.figAnchorRelY)
      );

    for (const item of items) {
      const halfW = item.width / 2;
      const minCenterX = halfW + 4;
      const maxCenterX = Math.max(minCenterX, safeW - halfW - 4);
      const idealX = Math.min(maxCenterX, Math.max(minCenterX, item.figX));

      let chosenLane = -1;
      let chosenX = idealX;

      const maxSearchLane = laneBoxes.length + 1;
      for (let lane = 0; lane <= maxSearchLane; lane += 1) {
        const { relWireStartY } = getRelBoxY(lane);
        const laneItems = laneBoxes[lane] || [];
        const rightmost = laneItems.length > 0 ? laneItems[laneItems.length - 1].right : -Infinity;
        const earliestX = rightmost === -Infinity ? minCenterX : Math.max(minCenterX, rightmost + MIN_H_GAP + halfW);

        const candidateXs: number[] = [];
        if (idealX >= earliestX) {
          candidateXs.push(idealX);
        } else if (earliestX <= maxCenterX && earliestX - idealX <= (isMobileStage ? 24 : 38)) {
          candidateXs.push(earliestX);
        }
        if (candidateXs.length === 0 && fitsInLane(lane, idealX - halfW, idealX + halfW)) {
          candidateXs.push(idealX);
        }
        // Se idealX era bloccato sul bordo sinistro/destro, prova piccoli spostamenti laterali per evitare incroci dei fili
        if (idealX !== item.figX) {
          const shiftDir = idealX > item.figX ? 1 : -1;
          for (const delta of [16, 32, 48]) {
            const shifted = Math.min(maxCenterX, Math.max(minCenterX, idealX + shiftDir * delta));
            if (fitsInLane(lane, shifted - halfW, shifted + halfW)) {
              candidateXs.push(shifted);
            }
          }
        }

        let foundValid = false;
        for (const cx of candidateXs) {
          if (fitsInLane(lane, cx - halfW, cx + halfW) && !crossesAnyWire(cx, relWireStartY, item.figX, item.figAnchorRelY)) {
            chosenLane = lane;
            chosenX = cx;
            foundValid = true;
            break;
          }
        }
        if (foundValid) break;
      }

      if (chosenLane < 0) {
        chosenLane = laneBoxes.length;
        while (!fitsInLane(chosenLane, idealX - halfW, idealX + halfW)) {
          chosenLane += 1;
        }
        chosenX = idealX;
      }

      while (laneBoxes.length <= chosenLane) laneBoxes.push([]);
      laneBoxes[chosenLane].push({ left: chosenX - halfW, right: chosenX + halfW });

      const { relTopY, relBottomY, relWireStartY } = getRelBoxY(chosenLane);
      placed.push({
        char: item.char,
        stair,
        lane: chosenLane,
        centerX: chosenX,
        width: item.width,
        relTopY,
        relBottomY,
        relWireStartY,
        figX: item.figX,
        figAnchorRelY: item.figAnchorRelY
      });
    }

    const maxLane = placed.reduce((acc, p) => Math.max(acc, p.lane), -1);
    return { placed, maxLane };
  };

  const upperResult = layoutStairPills('upper');
  const lowerResult = layoutStairPills('lower');

  const topBandH =
    upperResult.maxLane < 0 ? 0 : TOP_STAGE_GAP + upperResult.maxLane * LANE_STEP + PILL_H + OUTER_PAD;
  const bottomBandH =
    lowerResult.maxLane < 0 ? 0 : BOTTOM_STAGE_GAP + lowerResult.maxLane * LANE_STEP + PILL_H + OUTER_PAD;

  const pills: PillPlacement[] = [...upperResult.placed, ...lowerResult.placed].map(p => ({
    char: p.char,
    stair: p.stair,
    lane: p.lane,
    centerX: p.centerX,
    width: p.width,
    height: PILL_H,
    pillTopY: topBandH + p.relTopY,
    pillBottomY: topBandH + p.relBottomY,
    wireStartY: topBandH + p.relWireStartY,
    figX: p.figX,
    figAnchorY: topBandH + p.figAnchorRelY
  }));

  return {
    stageW: safeW,
    stageH,
    topBandH,
    bottomBandH,
    totalH: topBandH + stageH + bottomBandH,
    pills
  };
}

function getReadingTimestampMillis(read: any): number {
  if (read?.timestamp?.toMillis) return read.timestamp.toMillis();
  if (read?.timestamp?.seconds) return read.timestamp.seconds * 1000;
  return 0;
}

function getConstellationPositionsSignature(read: any): string {
  const chars = Array.isArray(read?.characters) ? read.characters : [];
  const layoutType = read?.userData?.layoutType || 'stairs';
  const normalized = chars
    .map((c: any) => ({
      layoutType,
      shape: c.shape || '',
      color: c.color || '',
      label: c.label || '',
      stair: c.stair || '',
      normalizedX: typeof c.normalizedX === 'number' ? Math.round(c.normalizedX * 1000) : null,
      slot: c.slot ? `${c.slot.floor}-${c.slot.col}` : '',
      x: Math.round(Number(c.x) || 0),
      y: Math.round(Number(c.y) || 0)
    }))
    .sort((a: any, b: any) =>
      `${a.layoutType}|${a.label}|${a.shape}|${a.stair}|${a.normalizedX ?? ''}|${a.slot}|${a.x}|${a.y}`.localeCompare(
        `${b.layoutType}|${b.label}|${b.shape}|${b.stair}|${b.normalizedX ?? ''}|${b.slot}|${b.x}|${b.y}`
      )
    );
  return JSON.stringify(normalized);
}

function getDeduplicatedReadings(readings: any[]): any[] {
  const sorted = [...readings].sort((a, b) => getReadingTimestampMillis(b) - getReadingTimestampMillis(a));
  const kept: any[] = [];

  for (const read of sorted) {
    const ownerKey = read.userId || read.userEmail || 'unknown';
    const type = read.type;

    if (type === 'rune' || type === 'flower') {
      const ids: number[] = Array.isArray(type === 'rune' ? read.runeIds : read.flowerIds)
        ? (type === 'rune' ? read.runeIds : read.flowerIds)
        : [];
      const isSubsetOfNewer = kept.some(newer => {
        if ((newer.userId || newer.userEmail || 'unknown') !== ownerKey || newer.type !== type) {
          return false;
        }
        const newerIds: number[] = Array.isArray(type === 'rune' ? newer.runeIds : newer.flowerIds)
          ? (type === 'rune' ? newer.runeIds : newer.flowerIds)
          : [];
        if (ids.length === 0) return true;
        return ids.every(id => newerIds.includes(id));
      });
      if (!isSubsetOfNewer) {
        kept.push(read);
      }
    } else if (type === 'constellation') {
      const sig = getConstellationPositionsSignature(read);
      const isDuplicateNewer = kept.some(newer =>
        (newer.userId || newer.userEmail || 'unknown') === ownerKey &&
        newer.type === 'constellation' &&
        getConstellationPositionsSignature(newer) === sig
      );
      if (!isDuplicateNewer) {
        kept.push(read);
      }
    } else {
      kept.push(read);
    }
  }

  return kept;
}

function getReadingDeletionGroup(targetReading: any, allReadings: any[]): any[] {
  if (!targetReading) return [];
  const ownerKey = targetReading.userId || targetReading.userEmail || 'unknown';
  const type = targetReading.type;

  const matched = allReadings.filter(item => {
    if (!item) return false;
    if (item.id === targetReading.id) return true;
    if ((item.userId || item.userEmail || 'unknown') !== ownerKey || item.type !== type) {
      return false;
    }

    if (type === 'constellation') {
      return getConstellationPositionsSignature(item) === getConstellationPositionsSignature(targetReading);
    }

    if (type === 'rune' || type === 'flower') {
      const targetIds: number[] = Array.isArray(type === 'rune' ? targetReading.runeIds : targetReading.flowerIds)
        ? (type === 'rune' ? targetReading.runeIds : targetReading.flowerIds)
        : [];
      const itemIds: number[] = Array.isArray(type === 'rune' ? item.runeIds : item.flowerIds)
        ? (type === 'rune' ? item.runeIds : item.flowerIds)
        : [];
      if (itemIds.length === 0) return true;
      return itemIds.every(id => targetIds.includes(id));
    }

    return false;
  });

  return matched.length > 0 ? matched : [targetReading];
}

function replaceBalancedCssFunction(css: string, fnName: string, replacer: (fullMatch: string) => string): string {
  const needle = `${fnName}(`;
  const lower = css.toLowerCase();
  let result = '';
  let i = 0;

  while (i < css.length) {
    const idx = lower.indexOf(needle, i);
    if (idx === -1) {
      result += css.slice(i);
      break;
    }
    result += css.slice(i, idx);
    let depth = 1;
    let j = idx + needle.length;
    while (j < css.length && depth > 0) {
      if (css[j] === '(') depth += 1;
      else if (css[j] === ')') depth -= 1;
      j += 1;
    }
    const fullMatch = css.slice(idx, j);
    result += replacer(fullMatch);
    i = j;
  }

  return result;
}

function sanitizeCssText(cssText: string): string {
  let sanitized = cssText;
  sanitized = replaceBalancedCssFunction(sanitized, 'color-mix', match =>
    /white|#fff/i.test(match) ? 'rgba(255, 255, 255, 0.88)' : 'rgba(74, 63, 53, 0.2)'
  );
  for (const fn of ['oklab', 'oklch', 'lab', 'lch', 'light-dark']) {
    sanitized = replaceBalancedCssFunction(sanitized, fn, () => '#777777');
  }
  sanitized = sanitized.replace(/\bin\s+(?:oklab|oklch|lab|lch)(?:\s+(?:shorter|longer|increasing|decreasing)\s+hue)?\b/gi, '');
  return sanitized;
}

function sanitizeCanvasClone(clonedDoc: Document) {
  // Flatten same-origin stylesheets (including Vite-bundled <link rel="stylesheet">)
  // and strip unsupported CSS color functions (oklab, oklch, lab, lch, color-mix, gradient color-spaces).
  const collectedCss: string[] = [];
  Array.from(document.styleSheets).forEach(sheet => {
    try {
      const rules = sheet.cssRules;
      if (rules) {
        const text = Array.from(rules).map(rule => rule.cssText).join('\n');
        collectedCss.push(sanitizeCssText(text));
      }
    } catch {
      // Cross-origin stylesheet (e.g., Google Fonts) - leave untouched
    }
  });

  if (collectedCss.length > 0) {
    clonedDoc.querySelectorAll('style').forEach(styleElement => {
      styleElement.remove();
    });
    clonedDoc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      const href = link.getAttribute('href') || '';
      if (!href.startsWith('http') || href.startsWith(window.location.origin)) {
        link.remove();
      }
    });
    const combinedStyle = clonedDoc.createElement('style');
    combinedStyle.textContent = collectedCss.join('\n');
    clonedDoc.head.appendChild(combinedStyle);
  } else {
    clonedDoc.querySelectorAll('style').forEach(styleElement => {
      styleElement.textContent = sanitizeCssText(styleElement.textContent || '');
    });
  }

  const fallbackFor = (property: string, currentValue: string) => {
    if (property.includes('shadow')) return 'none';
    if (property === 'background-image') return sanitizeCssText(currentValue);
    if (property.includes('background')) return 'transparent';
    if (property.includes('border') || property.includes('outline')) return '#e5e0d8';
    if (property === 'color' || property.includes('text')) return '#4a3f35';
    if (property === 'fill' || property === 'stroke') return '#4a3f35';
    return 'transparent';
  };

  clonedDoc.querySelectorAll<HTMLElement>('*').forEach(element => {
    if (element.style) {
      element.style.backdropFilter = 'none';
      (element.style as any).webkitBackdropFilter = 'none';
    }
    const computed = clonedDoc.defaultView?.getComputedStyle(element);
    if (!computed) return;
    for (let index = 0; index < computed.length; index += 1) {
      const property = computed.item(index);
      const value = computed.getPropertyValue(property);
      if (/(?:oklab|oklch|color-mix|light-dark|\blab|\blch)\(|\bin\s+(?:oklab|oklch|lab|lch)\b/i.test(value)) {
        element.style?.setProperty(property, fallbackFor(property, value), 'important');
      }
    }
  });

  const safeStyle = clonedDoc.createElement('style');
  safeStyle.textContent = `*::before, *::after { border-color: #e5e0d8 !important; box-shadow: none !important; }`;
  clonedDoc.head.appendChild(safeStyle);
}

async function waitForBoardImages(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    images.map(async img => {
      if (!img.complete) {
        await new Promise<void>(resolve => {
          const done = () => resolve();
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
        });
      }
      if (typeof img.decode === 'function') {
        try {
          await img.decode();
        } catch {
          // Ignore decode warnings if image is already rasterized
        }
      }
    })
  );
}

const INITIAL_USER_DATA = {
  nome: '',
  eta: '',
  sesso: '',
  domandaRune: ''
};

const INITIAL_CANDIDACY_FORM = {
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
};

function clearBrowserCandidacyData() {
  if (typeof window === 'undefined') return;
  const clearMatchingKeys = (store: Storage | undefined) => {
    if (!store) return;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < store.length; i += 1) {
        const key = store.key(i);
        if (!key || key.startsWith('firebase:')) continue;
        if (/candidac|form|bozza|tempio|userData/i.test(key)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => store.removeItem(key));
    } catch {
      // Ignore storage access errors in restricted contexts
    }
  };
  clearMatchingKeys(window.localStorage);
  clearMatchingKeys(window.sessionStorage);
}

const CONSTELLATION_DRAFT_PREFIX = 'tempio_costellazione_bozza_';
const CONSTELLATION_DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type ConstellationDraftCharacter = {
  id: string;
  shape: CharacterType['shape'];
  color: string;
  label: string;
  feeling?: 'piacevole' | 'spiacevole';
  memory?: string;
  stair?: 'upper' | 'lower';
  normalizedX?: number;
  slot?: BuildingSlotType;
};

type ConstellationDraftPayload = {
  savedAt: number;
  layoutType?: ConstellationLayoutType;
  characters: ConstellationDraftCharacter[];
  userData: {
    nome: string;
    eta: string;
    sesso: string;
  };
  pendingCharacter: {
    id: string;
    shape: CharacterType['shape'];
    color: string;
    label: string;
  } | null;
};

function getConstellationDraftKey(uid?: string | null): string {
  return `${CONSTELLATION_DRAFT_PREFIX}${uid || 'anonimo'}`;
}

function clearConstellationDraft(uid?: string | null) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(getConstellationDraftKey(uid));
  } catch {
    // Ignore storage access errors
  }
}

function saveConstellationDraft(
  uid: string | null | undefined,
  data: {
    layoutType?: ConstellationLayoutType;
    characters: CharacterType[];
    userData: { nome: string; eta: string; sesso: string };
    pendingCharacter: PendingCharacterType | null;
  }
) {
  if (typeof window === 'undefined') return;
  try {
    const layoutType: ConstellationLayoutType = data.layoutType === 'building' ? 'building' : 'stairs';
    const payload: ConstellationDraftPayload = {
      savedAt: Date.now(),
      layoutType,
      characters: data.characters.map((c) => ({
        id: c.id,
        shape: c.shape,
        color: c.color,
        label: c.label,
        ...(c.feeling ? { feeling: c.feeling } : {}),
        ...(c.memory ? { memory: c.memory } : {}),
        ...(layoutType === 'building' && c.slot
          ? { slot: { floor: c.slot.floor, col: c.slot.col } }
          : { stair: getCharacterStairV2(c), normalizedX: getCharacterNormalizedX(c) })
      })),
      userData: {
        nome: data.userData.nome || '',
        eta: data.userData.eta || '',
        sesso: data.userData.sesso || ''
      },
      pendingCharacter: data.pendingCharacter
        ? {
            id: data.pendingCharacter.id,
            shape: data.pendingCharacter.shape,
            color: data.pendingCharacter.color,
            label: data.pendingCharacter.label
          }
        : null
    };
    window.localStorage.setItem(getConstellationDraftKey(uid), JSON.stringify(payload));
  } catch {
    // Ignore storage quota or restricted context errors
  }
}

function loadConstellationDraft(uid?: string | null): ConstellationDraftPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = getConstellationDraftKey(uid);
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConstellationDraftPayload | null;
    if (!parsed || typeof parsed.savedAt !== 'number') {
      window.localStorage.removeItem(key);
      return null;
    }
    if (Date.now() - parsed.savedAt > CONSTELLATION_DRAFT_TTL_MS) {
      window.localStorage.removeItem(key);
      return null;
    }
    const layoutType: ConstellationLayoutType = parsed.layoutType === 'building' ? 'building' : 'stairs';
    const rawChars = Array.isArray(parsed.characters) ? parsed.characters : [];
    const chars = layoutType === 'building'
      ? rawChars.filter((c) => {
          if (!c?.slot) return false;
          const floor = Math.round(Number(c.slot.floor));
          const col = Math.round(Number(c.slot.col));
          return Number.isFinite(floor) && Number.isFinite(col) && floor >= 1 && floor <= 5 && col >= 0 && col <= 4;
        })
      : rawChars;
    const hasPending = Boolean(parsed.pendingCharacter && parsed.pendingCharacter.shape);
    if (chars.length === 0 && !hasPending) {
      window.localStorage.removeItem(key);
      return null;
    }
    return {
      savedAt: parsed.savedAt,
      layoutType,
      characters: chars,
      userData: {
        nome: parsed.userData?.nome || '',
        eta: parsed.userData?.eta || '',
        sesso: parsed.userData?.sesso || ''
      },
      pendingCharacter: hasPending ? parsed.pendingCharacter : null
    };
  } catch {
    return null;
  }
}

type PendingCharacterType = {
  id: string;
  shape: CharacterType['shape'];
  color: string;
  label: string;
  snapSeq: number;
};

function AdminConstellationPreview({
  readId,
  characters,
  layoutType = 'stairs',
  renderFigure
}: {
  readId: string;
  characters: CharacterType[];
  layoutType?: ConstellationLayoutType | string;
  renderFigure: (
    shape: string,
    color: string,
    densityScale: number,
    badgeNumber: number | undefined,
    previewWidth: number,
    scaleOverride?: number
  ) => React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewW, setPreviewW] = useState<number>(320);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current?.clientWidth) {
        setPreviewW(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    let observer: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver((entries) => {
        const w = entries[0]?.contentRect?.width;
        if (w && w > 0) setPreviewW(w);
      });
      observer.observe(containerRef.current);
    }
    window.addEventListener('resize', updateWidth);
    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  if (layoutType === 'building') {
    const buildingScale = getBuildingFigureScale(Math.min(320, previewW));
    return (
      <div className="mb-4 p-3 rounded-2xl border border-[#e5e0d8] bg-[#f8f5f0] w-full">
        <div ref={containerRef} className="relative w-full max-w-[320px] mx-auto aspect-[10/11]">
          <img
            src={BUILDING_IMAGE_URL}
            alt="Palazzo Costellazione"
            className="relative z-10 w-full h-full object-contain pointer-events-none select-none"
          />
          {characters.map((character, idx) => {
            if (!character.slot) return null;
            const { xPct, yPct } = getBuildingSlotCenterPct(character.slot);
            return (
              <div
                key={`admin-bldg-${readId}-${idx}`}
                className="absolute z-30 pointer-events-none"
                style={{
                  left: `${xPct}%`,
                  top: `${yPct}%`,
                  width: `${BUILDING_WINDOW_WIDTH_PCT}%`,
                  height: `${BUILDING_WINDOW_HEIGHT_PCT}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div
                  className="absolute left-1/2 bottom-[14%] flex justify-center"
                  style={{ transform: 'translateX(-50%)' }}
                >
                  {renderFigure(character.shape, character.color, 1, undefined, previewW, buildingScale)}
                </div>
                <div
                  className="absolute left-1/2 -bottom-1 px-1 bg-white/95 rounded-full border text-[8px] font-bold text-[#4a3f35] whitespace-nowrap max-w-[125%] truncate"
                  style={{
                    transform: 'translateX(-50%)',
                    borderColor:
                      character.feeling === 'piacevole'
                        ? '#4ade80'
                        : character.feeling === 'spiacevole'
                          ? '#f87171'
                          : '#e5e0d8'
                  }}
                >
                  {character.label || 'Senza nome'}
                  {character.feeling ? (character.feeling === 'piacevole' ? ' ❤️' : ' 💔') : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const previewChars = characters.map((c) => ({
    ...c,
    stair: getCharacterStairV2(c),
    normalizedX: getCharacterNormalizedX(c)
  }));
  const previewLegendMode = previewChars.length > 12;
  const previewDensity = getFigureDensityScale(previewChars.length);
  const previewPills = !previewLegendMode ? computePillLayout(previewChars, previewW) : null;

  return (
    <div className="mb-4 p-3 rounded-2xl border border-[#e5e0d8] bg-[#f8f5f0] w-full">
      <div
        ref={containerRef}
        className="relative w-full flex flex-col"
        style={
          previewPills
            ? { paddingTop: `${previewPills.topBandH}px`, height: `${previewPills.totalH}px` }
            : undefined
        }
      >
        {previewPills && previewPills.pills.length > 0 && (
          <svg
            width={previewPills.stageW}
            height={previewPills.totalH}
            viewBox={`0 0 ${previewPills.stageW} ${previewPills.totalH}`}
            className="absolute top-0 left-0 pointer-events-none z-20"
            style={{ width: `${previewPills.stageW}px`, height: `${previewPills.totalH}px` }}
          >
            {previewPills.pills.map((pill) => (
              <g key={`admin-wire-${readId}-${pill.char.id}`}>
                <line
                  x1={pill.centerX}
                  y1={pill.wireStartY}
                  x2={pill.figX}
                  y2={pill.figAnchorY}
                  stroke="#8a7954"
                  strokeWidth={1}
                  strokeLinecap="round"
                />
                <circle cx={pill.figX} cy={pill.figAnchorY} r={2} fill="#8a7954" />
              </g>
            ))}
          </svg>
        )}
        <div className="relative w-full aspect-[16/9]">
          <img
            src={STAGE_IMAGE_URL}
            alt="Gradini Costellazione"
            className="relative z-10 w-full h-full object-contain pointer-events-none select-none"
          />
          {previewChars.map((character, idx) => {
            const xPct = getStairXRatio(character.stair, character.normalizedX) * 100;
            const yPct = STAIR_GEOMETRY[character.stair].yRatio * 100;
            return (
              <div
                key={`admin-fig-${readId}-${idx}`}
                className="absolute z-30"
                style={{ left: `${xPct}%`, top: `${yPct}%`, width: 0, height: 0 }}
              >
                <div
                  className="absolute bottom-0 left-0 flex justify-center"
                  style={{ transform: 'translateX(-50%)' }}
                >
                  {renderFigure(
                    character.shape,
                    character.color,
                    previewDensity,
                    previewLegendMode ? idx + 1 : undefined,
                    previewW
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {previewPills && previewPills.pills.map((pill) => {
          const feelingBorder =
            pill.char.feeling === 'piacevole'
              ? '#4ade80'
              : pill.char.feeling === 'spiacevole'
                ? '#f87171'
                : '#e5e0d8';
          return (
            <div
              key={`admin-pill-${readId}-${pill.char.id}`}
              className="absolute z-40 px-2.5 bg-white rounded-full shadow-sm border font-medium whitespace-nowrap flex items-center justify-center text-[#4a3f35]"
              style={{
                left: `${pill.centerX}px`,
                top: `${pill.pillTopY}px`,
                minHeight: `${pill.height}px`,
                height: 'auto',
                paddingTop: '3px',
                paddingBottom: '3px',
                lineHeight: 1.4,
                maxWidth: previewW < 640 ? '140px' : '190px',
                fontSize: previewW < 640 ? '10px' : '11px',
                borderColor: feelingBorder,
                transform: 'translateX(-50%)'
              }}
            >
              <span className="truncate">{pill.char.label}</span>
              {pill.char.feeling && (
                <span className="ml-1 shrink-0">{pill.char.feeling === 'piacevole' ? '❤️' : '💔'}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [constellationLayoutType, setConstellationLayoutType] = useState<ConstellationLayoutType>('stairs');
  const [characters, setCharacters] = useState<CharacterType[]>([]);
  const [pendingCharacter, setPendingCharacter] = useState<PendingCharacterType | null>(null);
  const [isDraggingPending, setIsDraggingPending] = useState(false);
  const [highlightedBuildingSlot, setHighlightedBuildingSlot] = useState<BuildingSlotType | null>(null);
  const [buildingNotice, setBuildingNotice] = useState<string | null>(null);
  const buildingNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [drawingCharacter, setDrawingCharacter] = useState<{ shape: string, color: string } | null>(null);
  const [tempLabel, setTempLabel] = useState('');
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const availablePickerShapes = React.useMemo(() => {
    const usedCounts = new Map<string, number>();
    for (const ch of characters) {
      const key = getCharacterShapeColorKey(ch.shape, ch.color);
      usedCounts.set(key, (usedCounts.get(key) || 0) + 1);
    }
    if (pendingCharacter) {
      const key = getCharacterShapeColorKey(pendingCharacter.shape, pendingCharacter.color);
      usedCounts.set(key, (usedCounts.get(key) || 0) + 1);
    }
    return CHARACTER_PICKER_SHAPES.filter((char) => {
      const key = getCharacterShapeColorKey(char.shape, char.color);
      const remaining = usedCounts.get(key) || 0;
      if (remaining > 0) {
        usedCounts.set(key, remaining - 1);
        return false;
      }
      return true;
    });
  }, [characters, pendingCharacter]);
  const [isSharing, setIsSharing] = useState(false);
  const [workflowStep, setWorkflowStep] = useState(0); // 0: Placement, 1: Analysis
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [analyzingCharacter, setAnalyzingCharacter] = useState<CharacterType | null>(null);
  const [tempLabelEdit, setTempLabelEdit] = useState('');
  const [tempMemory, setTempMemory] = useState('');
  const [tempFeeling, setTempFeeling] = useState<'piacevole' | 'spiacevole' | null>(null);
  const [userData, setUserData] = useState({ ...INITIAL_USER_DATA });
  const [currentPage, setCurrentPage] = useState<'home' | 'costellazioni' | 'fiori' | 'rune' | 'percorsi' | 'registri' | 'profile' | 'admin'>('home');
  const [showAkashicForm, setShowAkashicForm] = useState(false);
  const [showAkashicPrivacy, setShowAkashicPrivacy] = useState(false);
  const [akashicSubmitted, setAkashicSubmitted] = useState(false);
  const [isSubmittingAkashic, setIsSubmittingAkashic] = useState(false);
  const [akashicForm, setAkashicForm] = useState({
    name: '',
    birthDate: '',
    email: '',
    area: '' as (typeof AKASHIC_AREAS)[number] | '',
    question: '',
    hope: '',
    notes: '',
    consentAccepted: false
  });
  const pendingAkashicAfterLoginRef = useRef<boolean>(false);
  const [adminData, setAdminData] = useState<{ candidacies: any[], readings: any[] }>({ candidacies: [], readings: [] });
  const [adminReadMap, setAdminReadMap] = useState<Record<string, { readBy?: string; readAt?: any }>>({});
  const [expandedAdminReadingIds, setExpandedAdminReadingIds] = useState<Record<string, boolean>>({});
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [selectedCandidacies, setSelectedCandidacies] = useState<string[]>([]);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [adminSection, setAdminSection] = useState<'portali' | 'akashic'>('portali');
  const [akashicRequestsList, setAkashicRequestsList] = useState<any[]>([]);
  const [akashicReadingsMap, setAkashicReadingsMap] = useState<Record<string, any>>({});
  const [akashicAdminFilter, setAkashicAdminFilter] = useState<'tutte' | 'nuova' | 'in_lavorazione' | 'completata' | 'archivio'>('tutte');
  const [akashicAdminSearch, setAkashicAdminSearch] = useState('');
  const [selectedAkashicClientEmail, setSelectedAkashicClientEmail] = useState<string | null>(null);
  const [selectedAkashicRequestId, setSelectedAkashicRequestId] = useState<string | null>(null);
  const [akashicEditorChapters, setAkashicEditorChapters] = useState<string[]>(['', '', '', '', '', '', '']);
  const [akashicSavedChapters, setAkashicSavedChapters] = useState<string[]>(['', '', '', '', '', '', '']);
  const [isSavingAkashicDraft, setIsSavingAkashicDraft] = useState(false);
  const [isPublishingAkashic, setIsPublishingAkashic] = useState(false);
  const [isUpdatingAkashicStatus, setIsUpdatingAkashicStatus] = useState(false);
  const [akashicDraftSavedAt, setAkashicDraftSavedAt] = useState<Date | null>(null);
  const [isDeletingAkashicRequestId, setIsDeletingAkashicRequestId] = useState<string | null>(null);
  const [userAkashicRequests, setUserAkashicRequests] = useState<any[]>([]);
  const [userAkashicReadingsMap, setUserAkashicReadingsMap] = useState<Record<string, any>>({});
  const [seenAkashicReadingIds, setSeenAkashicReadingIds] = useState<string[]>([]);
  const [openedUserAkashicRequestId, setOpenedUserAkashicRequestId] = useState<string | null>(null);
  const [isLoadingUserAkashic, setIsLoadingUserAkashic] = useState(false);
  const [isRequestingAkashicDeletionId, setIsRequestingAkashicDeletionId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const isAdmin = user?.emailVerified === true && (user.email === 'analogistabrindisi@gmail.com' || user.email === 'infantinograziamaria@gmail.com');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showCandidacyModal, setShowCandidacyModal] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<'standard' | 'complex' | null>(null);
  const [candidacyForm, setCandidacyForm] = useState({ ...INITIAL_CANDIDACY_FORM });
  const [candidacyFiles, setCandidacyFiles] = useState<File[]>([]);
  const [isSubmittingCandidacy, setIsSubmittingCandidacy] = useState(false);
  const [userCandidacies, setUserCandidacies] = useState<any[]>([]);
  const [runeHistory, setRuneHistory] = useState<any[]>([]);
  const [flowerHistory, setFlowerHistory] = useState<any[]>([]);
  const [constellationHistory, setConstellationHistory] = useState<any[]>([]);
  const [appDialog, setAppDialog] = useState<{
    mode: 'alert' | 'confirm';
    title: string;
    message: string;
    danger?: boolean;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm?: () => void | Promise<void>;
    onCancel?: () => void | Promise<void>;
    onDismiss?: () => void | Promise<void>;
    onClose?: () => void | Promise<void>;
  } | null>(null);
  const [sentToGraziamariaModal, setSentToGraziamariaModal] = useState<{
    imageBlob: Blob | null;
  } | null>(null);
  const pendingShareAfterLoginRef = useRef<boolean>(false);
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null);

  const showAlert = (title: string, message: string, onClose?: () => void | Promise<void>) => {
    setAppDialog({ mode: 'alert', title, message, onClose });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    options?: {
      danger?: boolean;
      confirmLabel?: string;
      cancelLabel?: string;
      onCancel?: () => void | Promise<void>;
      onDismiss?: () => void | Promise<void>;
    }
  ) => {
    setAppDialog({
      mode: 'confirm',
      title,
      message,
      danger: options?.danger,
      confirmLabel: options?.confirmLabel,
      cancelLabel: options?.cancelLabel,
      onConfirm,
      onCancel: options?.onCancel,
      onDismiss: options?.onDismiss
    });
  };

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

  const getAkashicSeenStorageKey = (uid: string) => `tempio_akashic_seen_${uid}`;

  const loadSeenAkashicIds = (uid: string): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(getAkashicSeenStorageKey(uid));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
    } catch {
      return [];
    }
  };

  const markAkashicReadingSeen = (uid: string, requestId: string) => {
    setSeenAkashicReadingIds(prev => {
      const next = prev.includes(requestId) ? prev : [...prev, requestId];
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(getAkashicSeenStorageKey(uid), JSON.stringify(next));
        } catch {
          // ignore localStorage errors
        }
      }
      return next;
    });
  };

  const fetchUserAkashic = async (uid: string) => {
    setIsLoadingUserAkashic(true);
    setSeenAkashicReadingIds(loadSeenAkashicIds(uid));
    try {
      const reqSnap = await getDocs(query(collection(db, 'akashicRequests'), where('ownerUid', '==', uid)));
      const sortedReqs = reqSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => {
          const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tb - ta;
        });
      setUserAkashicRequests(sortedReqs);

      const nextReadingsMap: Record<string, any> = {};
      try {
        const readSnap = await getDocs(
          query(
            collection(db, 'akashicReadings'),
            where('ownerUid', '==', uid),
            where('published', '==', true)
          )
        );
        readSnap.docs.forEach(d => {
          nextReadingsMap[d.id] = { id: d.id, ...d.data() };
        });
      } catch {
        const completedReqs = sortedReqs.filter((r: any) => r.status === 'completata');
        const settled = await Promise.all(
          completedReqs.map(async (r: any) => {
            try {
              const snap = await getDoc(doc(db, 'akashicReadings', r.id));
              if (snap.exists() && snap.data()?.published === true) {
                return { id: snap.id, ...snap.data() };
              }
            } catch {
              // ignore unpublished or inaccessible docs
            }
            return null;
          })
        );
        settled.forEach(item => {
          if (item) nextReadingsMap[item.id] = item;
        });
      }
      setUserAkashicReadingsMap(nextReadingsMap);
    } catch (e) {
      console.error("Error fetching user Akashic requests:", e);
    } finally {
      setIsLoadingUserAkashic(false);
    }
  };

  useEffect(() => {
    if (currentPage === 'profile' && user?.uid) {
      void fetchUserAkashic(user.uid);
    }
  }, [currentPage, user?.uid]);

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

      try {
        const readStateSnap = await getDocs(collection(db, 'adminReadState'));
        const nextReadMap: Record<string, { readBy?: string; readAt?: any }> = {};
        readStateSnap.docs.forEach(d => {
          nextReadMap[d.id] = d.data() as { readBy?: string; readAt?: any };
        });
        setAdminReadMap(nextReadMap);
      } catch (readStateErr) {
        console.error("Admin read state fetch error:", readStateErr);
      }

      try {
        const [akReqSnap, akReadSnap] = await Promise.all([
          getDocs(query(collection(db, 'akashicRequests'), orderBy('createdAt', 'desc'))),
          getDocs(collection(db, 'akashicReadings'))
        ]);
        setAkashicRequestsList(akReqSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        const nextReadingsMap: Record<string, any> = {};
        akReadSnap.docs.forEach(d => {
          nextReadingsMap[d.id] = { id: d.id, ...d.data() };
        });
        setAkashicReadingsMap(nextReadingsMap);
      } catch (akErr) {
        console.error("Admin Akashic fetch error:", akErr);
      }
    } catch (e) {
      console.error("Admin Fetch Error:", e);
    } finally {
      setIsAdminLoading(false);
    }
  };

  const markReadingAsRead = async (readingId: string) => {
    if (!isAdmin || !user || adminReadMap[readingId]) return;
    const readerEmail = user.email || '';
    setAdminReadMap(prev => ({
      ...prev,
      [readingId]: { readBy: readerEmail, readAt: new Date() }
    }));
    try {
      await setDoc(doc(db, 'adminReadState', readingId), {
        readBy: readerEmail,
        readAt: serverTimestamp()
      });
    } catch (e) {
      console.error('Errore salvataggio stato lettura admin:', e);
      setAdminReadMap(prev => {
        const next = { ...prev };
        delete next[readingId];
        return next;
      });
    }
  };

  const markReadingAsUnread = async (readingId: string) => {
    if (!isAdmin || !user) return;
    const previousEntry = adminReadMap[readingId];
    setAdminReadMap(prev => {
      const next = { ...prev };
      delete next[readingId];
      return next;
    });
    setExpandedAdminReadingIds(prev => {
      if (!prev[readingId]) return prev;
      const next = { ...prev };
      delete next[readingId];
      return next;
    });
    try {
      await deleteDoc(doc(db, 'adminReadState', readingId));
    } catch (e) {
      console.error('Errore ripristino stato da vedere:', e);
      if (previousEntry) {
        setAdminReadMap(prev => ({ ...prev, [readingId]: previousEntry }));
      }
    }
  };

  const toggleAdminReadingExpanded = (readingId: string) => {
    const isCurrentlyExpanded = Boolean(expandedAdminReadingIds[readingId]);
    setExpandedAdminReadingIds(prev => ({
      ...prev,
      [readingId]: !isCurrentlyExpanded
    }));
    if (!isCurrentlyExpanded && !adminReadMap[readingId]) {
      void markReadingAsRead(readingId);
    }
  };

  useEffect(() => {
    if (currentPage === 'admin' && isAdmin) {
      fetchAdminData();
    }
  }, [currentPage, isAdmin]);

  const hasUnsavedAkashicChanges = React.useMemo(() => {
    if (!selectedAkashicRequestId) return false;
    return akashicEditorChapters.some((ch, idx) => ch !== (akashicSavedChapters[idx] ?? ''));
  }, [selectedAkashicRequestId, akashicEditorChapters, akashicSavedChapters]);

  const guardAkashicUnsaved = (onProceed: () => void) => {
    if (hasUnsavedAkashicChanges && selectedAkashicRequestId) {
      showConfirm(
        'Modifiche non salvate',
        'Hai modifiche non salvate nella lettura. Vuoi chiudere senza salvare?',
        () => {
          onProceed();
        },
        {
          danger: true,
          confirmLabel: 'Chiudi senza salvare',
          cancelLabel: 'Resta'
        }
      );
      return;
    }
    onProceed();
  };

  const openAkashicRequestDetail = (req: any) => {
    const existingReading = akashicReadingsMap[req.id];
    const initialChapters = Array.from({ length: 7 }, (_, i) =>
      Array.isArray(existingReading?.chapters) && typeof existingReading.chapters[i] === 'string'
        ? existingReading.chapters[i]
        : ''
    );
    setSelectedAkashicRequestId(req.id);
    setAkashicEditorChapters(initialChapters);
    setAkashicSavedChapters(initialChapters);
    setAkashicDraftSavedAt(
      existingReading?.updatedAt?.toDate ? existingReading.updatedAt.toDate() : null
    );
  };

  const saveAkashicDraft = async (req: any, chaptersToSave: string[]) => {
    if (!isAdmin || !req || isSavingAkashicDraft || isPublishingAkashic) return;
    const chaptersSnapshot = Array.from({ length: 7 }, (_, i) => (chaptersToSave[i] || '').slice(0, 20000));
    const existingReading = akashicReadingsMap[req.id];
    const isCurrentlyPublished = existingReading?.published === true;
    setIsSavingAkashicDraft(true);
    try {
      const readingRef = doc(db, 'akashicReadings', req.id);
      if (existingReading) {
        await updateDoc(readingRef, {
          ownerUid: req.ownerUid,
          chapters: chaptersSnapshot,
          published: isCurrentlyPublished,
          publishedAt: isCurrentlyPublished && existingReading.publishedAt ? existingReading.publishedAt : isCurrentlyPublished ? serverTimestamp() : null,
          updatedAt: serverTimestamp()
        });
      } else {
        await setDoc(readingRef, {
          ownerUid: req.ownerUid,
          chapters: chaptersSnapshot,
          published: false,
          publishedAt: null,
          updatedAt: serverTimestamp()
        });
      }
      const freshSnap = await getDoc(readingRef);
      const freshData = freshSnap.exists() ? freshSnap.data() : null;
      const now = new Date();
      setAkashicReadingsMap(prev => ({
        ...prev,
        [req.id]: freshData
          ? { id: req.id, ...freshData }
          : {
              id: req.id,
              ownerUid: req.ownerUid,
              chapters: chaptersSnapshot,
              published: isCurrentlyPublished,
              publishedAt: isCurrentlyPublished ? existingReading?.publishedAt || now : null,
              updatedAt: now
            }
      }));
      setAkashicSavedChapters(chaptersSnapshot);
      setAkashicDraftSavedAt(now);
    } catch (error) {
      console.error('Errore salvataggio bozza lettura akashica:', error);
      showAlert('Errore salvataggio', 'Impossibile salvare la bozza della lettura.');
    } finally {
      setIsSavingAkashicDraft(false);
    }
  };

  useEffect(() => {
    if (currentPage !== 'admin' || !isAdmin || adminSection !== 'akashic' || !selectedAkashicRequestId) return;
    if (!hasUnsavedAkashicChanges || isSavingAkashicDraft || isPublishingAkashic) return;
    const req = akashicRequestsList.find(r => r.id === selectedAkashicRequestId);
    if (!req) return;

    const timer = setTimeout(() => {
      void saveAkashicDraft(req, akashicEditorChapters);
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentPage, isAdmin, adminSection, selectedAkashicRequestId, akashicEditorChapters, hasUnsavedAkashicChanges, isSavingAkashicDraft, isPublishingAkashic]);

  const updateAkashicRequestStatus = async (reqId: string, nextStatus: 'nuova' | 'in_lavorazione') => {
    if (!isAdmin || isUpdatingAkashicStatus) return;
    setIsUpdatingAkashicStatus(true);
    try {
      await updateDoc(doc(db, 'akashicRequests', reqId), { status: nextStatus });
      setAkashicRequestsList(prev =>
        prev.map(item => (item.id === reqId ? { ...item, status: nextStatus } : item))
      );
    } catch (error) {
      console.error('Errore aggiornamento stato richiesta akashica:', error);
      showAlert('Errore aggiornamento', 'Impossibile aggiornare lo stato della richiesta.');
    } finally {
      setIsUpdatingAkashicStatus(false);
    }
  };

  const publishAkashicReading = (req: any) => {
    if (!isAdmin || !req || isPublishingAkashic) return;
    showConfirm(
      'Pubblica la lettura',
      'Il cliente potrà leggerla subito nella sua area.',
      async () => {
        setIsPublishingAkashic(true);
        try {
          const chaptersSnapshot = Array.from({ length: 7 }, (_, i) => (akashicEditorChapters[i] || '').slice(0, 20000));
          const readingRef = doc(db, 'akashicReadings', req.id);
          const requestRef = doc(db, 'akashicRequests', req.id);
          const batch = writeBatch(db);
          batch.set(readingRef, {
            ownerUid: req.ownerUid,
            chapters: chaptersSnapshot,
            published: true,
            publishedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          batch.update(requestRef, { status: 'completata' });
          await batch.commit();

          const freshSnap = await getDoc(readingRef);
          const freshData = freshSnap.exists() ? freshSnap.data() : null;
          const now = new Date();
          setAkashicReadingsMap(prev => ({
            ...prev,
            [req.id]: freshData
              ? { id: req.id, ...freshData }
              : {
                  id: req.id,
                  ownerUid: req.ownerUid,
                  chapters: chaptersSnapshot,
                  published: true,
                  publishedAt: now,
                  updatedAt: now
                }
          }));
          setAkashicRequestsList(prev =>
            prev.map(item => (item.id === req.id ? { ...item, status: 'completata' } : item))
          );
          setAkashicSavedChapters(chaptersSnapshot);
          setAkashicDraftSavedAt(now);

          const clientEmail = (req.email || '').trim();
          const mailSubject = "Il tuo Libro dell'Anima è pronto";
          const mailBody = "Il tuo Libro dell'Anima è pronto. GraziaMaria ha preparato personalmente la tua lettura. Puoi accedere alla tua area riservata e iniziare il tuo viaggio.";
          showConfirm(
            'Lettura pubblicata',
            'Lettura pubblicata. Vuoi avvisare il cliente?',
            () => {
              const mailtoHref = `mailto:${encodeURIComponent(clientEmail)}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
              const link = document.createElement('a');
              link.href = mailtoHref;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            },
            {
              confirmLabel: 'Scrivi email',
              cancelLabel: 'Chiudi'
            }
          );
        } catch (error) {
          console.error('Errore pubblicazione lettura akashica:', error);
          showAlert('Errore pubblicazione', 'Non è stato possibile pubblicare la lettura.');
        } finally {
          setIsPublishingAkashic(false);
        }
      },
      {
        confirmLabel: 'Pubblica',
        cancelLabel: 'Annulla'
      }
    );
  };

  const unpublishAkashicReading = async (req: any) => {
    if (!isAdmin || !req || isPublishingAkashic) return;
    setIsPublishingAkashic(true);
    try {
      const chaptersSnapshot = Array.from({ length: 7 }, (_, i) => (akashicEditorChapters[i] || '').slice(0, 20000));
      const readingRef = doc(db, 'akashicReadings', req.id);
      const requestRef = doc(db, 'akashicRequests', req.id);
      const batch = writeBatch(db);
      batch.set(readingRef, {
        ownerUid: req.ownerUid,
        chapters: chaptersSnapshot,
        published: false,
        publishedAt: null,
        updatedAt: serverTimestamp()
      });
      batch.update(requestRef, { status: 'in_lavorazione' });
      await batch.commit();

      const freshSnap = await getDoc(readingRef);
      const freshData = freshSnap.exists() ? freshSnap.data() : null;
      const now = new Date();
      setAkashicReadingsMap(prev => ({
        ...prev,
        [req.id]: freshData
          ? { id: req.id, ...freshData }
          : {
              id: req.id,
              ownerUid: req.ownerUid,
              chapters: chaptersSnapshot,
              published: false,
              publishedAt: null,
              updatedAt: now
            }
      }));
      setAkashicRequestsList(prev =>
        prev.map(item => (item.id === req.id ? { ...item, status: 'in_lavorazione' } : item))
      );
      setAkashicSavedChapters(chaptersSnapshot);
      setAkashicDraftSavedAt(now);
    } catch (error) {
      console.error('Errore ritiro pubblicazione lettura akashica:', error);
      showAlert('Errore ritiro', 'Non è stato possibile ritirare la pubblicazione.');
    } finally {
      setIsPublishingAkashic(false);
    }
  };

  const deleteAkashicRequest = (req: any) => {
    if (!isAdmin || !req || isDeletingAkashicRequestId) return;
    const clientName = req.name || 'questo cliente';
    showConfirm(
      'Elimina richiesta',
      `Eliminare definitivamente la richiesta di ${clientName} e l'eventuale lettura? L'operazione non si può annullare.`,
      async () => {
        setIsDeletingAkashicRequestId(req.id);
        try {
          const batch = writeBatch(db);
          batch.delete(doc(db, 'akashicRequests', req.id));
          batch.delete(doc(db, 'akashicReadings', req.id));
          await batch.commit();
          setAkashicRequestsList(prev => prev.filter(item => item.id !== req.id));
          setAkashicReadingsMap(prev => {
            const next = { ...prev };
            delete next[req.id];
            return next;
          });
          if (selectedAkashicRequestId === req.id) {
            setSelectedAkashicRequestId(null);
            setAkashicEditorChapters(['', '', '', '', '', '', '']);
            setAkashicSavedChapters(['', '', '', '', '', '', '']);
            setAkashicDraftSavedAt(null);
          }
        } catch (error) {
          console.error('Errore eliminazione richiesta akashica:', error);
          showAlert('Errore eliminazione', 'Non è stato possibile eliminare la richiesta.');
        } finally {
          setIsDeletingAkashicRequestId(null);
        }
      },
      {
        danger: true,
        confirmLabel: 'Elimina',
        cancelLabel: 'Annulla'
      }
    );
  };

  const requestAkashicDeletion = (req: any) => {
    if (!user || !req || req.deletionRequested === true || isRequestingAkashicDeletionId) return;
    showConfirm(
      'Richiedi cancellazione dati',
      'Vuoi richiedere a GraziaMaria la cancellazione definitiva dei dati relativi a questa richiesta?',
      async () => {
        setIsRequestingAkashicDeletionId(req.id);
        try {
          await updateDoc(doc(db, 'akashicRequests', req.id), { deletionRequested: true });
          setUserAkashicRequests(prev =>
            prev.map(item => (item.id === req.id ? { ...item, deletionRequested: true } : item))
          );
        } catch (error) {
          try {
            handleFirestoreError(error, 'update', `akashicRequests/${req.id}`);
          } catch (structuredErr) {
            console.error('Errore richiesta cancellazione dati akashici:', structuredErr);
          }
          showAlert('Errore richiesta', 'Non è stato possibile inviare la richiesta di cancellazione.');
        } finally {
          setIsRequestingAkashicDeletionId(null);
        }
      },
      {
        danger: true,
        confirmLabel: 'Conferma',
        cancelLabel: 'Annulla'
      }
    );
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
      showAlert('Errore salvataggio', 'Errore nel salvataggio della nota.');
    }
  };

  const deleteCandidacy = (id: string) => {
    showConfirm(
      'Elimina candidatura',
      'Sei sicuro di voler eliminare questa candidatura?',
      async () => {
        try {
          await deleteDoc(doc(db, 'candidacies', id));
          setAdminData(prev => ({
            ...prev,
            candidacies: prev.candidacies.filter(c => c.id !== id)
          }));
          setSelectedCandidacies(prev => prev.filter(sid => sid !== id));
        } catch (e) {
          console.error("Error deleting candidacy:", e);
          showAlert('Errore eliminazione', "Errore nell'eliminazione.");
        }
      },
      { danger: true }
    );
  };

  const deleteReading = (reading: any) => {
    const groupToDelete = getReadingDeletionGroup(reading, adminData.readings);
    const deleteCount = groupToDelete.length;
    const confirmMessage = deleteCount > 1
      ? `Verranno eliminate ${deleteCount} letture dall’area admin (inclusi i doppioni e i salvataggi parziali associati). L’operazione non può essere annullata.`
      : 'Verrà eliminata 1 lettura dall’area admin. L’operazione non può essere annullata.';

    showConfirm(
      'Elimina lettura',
      confirmMessage,
      async () => {
        try {
          const screenshotUrls = Array.from(
            new Set(
              groupToDelete
                .map(item => item.screenshotUrl)
                .filter((url): url is string => typeof url === 'string' && url.length > 0)
            )
          );

          for (const screenshotUrl of screenshotUrls) {
            try {
              await deleteObject(ref(storage, screenshotUrl));
            } catch (storageError) {
              console.warn('Screenshot già assente o non eliminabile:', storageError);
            }
          }

          for (let i = 0; i < groupToDelete.length; i += 450) {
            const chunk = groupToDelete.slice(i, i + 450);
            const batch = writeBatch(db);
            chunk.forEach(item => {
              batch.delete(doc(db, 'allReadings', item.id));
            });
            await batch.commit();
          }

          const deletedIds = new Set(groupToDelete.map(item => item.id));
          await Promise.allSettled(
            Array.from(deletedIds).map(id => deleteDoc(doc(db, 'adminReadState', id)))
          );
          setAdminData(prev => ({
            ...prev,
            readings: prev.readings.filter(item => !deletedIds.has(item.id))
          }));
          setAdminReadMap(prev => {
            const next = { ...prev };
            deletedIds.forEach(id => {
              delete next[id];
            });
            return next;
          });
          setExpandedAdminReadingIds(prev => {
            const next = { ...prev };
            deletedIds.forEach(id => {
              delete next[id];
            });
            return next;
          });
        } catch (error) {
          console.error('Errore eliminazione lettura:', error);
          showAlert('Errore eliminazione', 'Non è stato possibile eliminare la lettura dall’area admin.');
        }
      },
      { danger: true }
    );
  };

  const bulkDeleteCandidacies = () => {
    if (selectedCandidacies.length === 0) return;
    showConfirm(
      'Elimina candidature selezionate',
      `Sei sicuro di voler eliminare ${selectedCandidacies.length} candidature?`,
      async () => {
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
          showAlert('Errore eliminazione', "Errore nell'eliminazione multipla.");
        }
      },
      { danger: true }
    );
  };

  const previousUidRef = useRef<string | null>(null);
  const lastSavedRuneKeyRef = useRef<string | null>(null);
  const lastSavedFlowerKeyRef = useRef<string | null>(null);
  const lastSavedConstellationKeyRef = useRef<string | null>(null);
  const lastSavedConstellationHasScreenshotRef = useRef<boolean>(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  const resetSessionState = (options?: { navigateHome?: boolean }) => {
    setUserProfile(null);
    setUserCandidacies([]);
    setRuneHistory([]);
    setFlowerHistory([]);
    setConstellationHistory([]);
    setAdminData({ candidacies: [], readings: [] });
    setAdminReadMap({});
    setExpandedAdminReadingIds({});
    setAdminSearchQuery('');
    setSelectedCandidacies([]);
    setIsAdminLoading(false);
    setAdminSection('portali');
    setAkashicRequestsList([]);
    setAkashicReadingsMap({});
    setAkashicAdminFilter('tutte');
    setAkashicAdminSearch('');
    setSelectedAkashicClientEmail(null);
    setSelectedAkashicRequestId(null);
    setAkashicEditorChapters(['', '', '', '', '', '', '']);
    setAkashicSavedChapters(['', '', '', '', '', '', '']);
    setAkashicDraftSavedAt(null);
    setIsDeletingAkashicRequestId(null);
    setUserAkashicRequests([]);
    setUserAkashicReadingsMap({});
    setSeenAkashicReadingIds([]);
    setOpenedUserAkashicRequestId(null);
    setIsLoadingUserAkashic(false);
    setIsRequestingAkashicDeletionId(null);
    setSelectedRunesIds([]);
    setCurrentRune(null);
    setSelectedFlowersIds([]);
    setSelectedFlower(null);
    setFlowerSearch('');
    setConstellationLayoutType('stairs');
    setCharacters([]);
    setPendingCharacter(null);
    setIsDraggingPending(false);
    setHighlightedBuildingSlot(null);
    setBuildingNotice(null);
    setDrawingCharacter(null);
    setTempLabel('');
    setShowLabelInput(false);
    setShowPicker(false);
    setIsSharing(false);
    setWorkflowStep(0);
    setShowWorkflowModal(false);
    setAnalyzingCharacter(null);
    setTempLabelEdit('');
    setTempMemory('');
    setTempFeeling(null);
    setCandidacyForm({ ...INITIAL_CANDIDACY_FORM });
    setCandidacyFiles([]);
    setIsSubmittingCandidacy(false);
    setShowCandidacyModal(false);
    setSubmissionResult(null);
    setAppDialog(null);
    pendingShareAfterLoginRef.current = false;
    setSentToGraziamariaModal(null);
    setFullscreenImageUrl(null);
    setUserData({ ...INITIAL_USER_DATA });
    lastSavedRuneKeyRef.current = null;
    lastSavedFlowerKeyRef.current = null;
    lastSavedConstellationKeyRef.current = null;
    lastSavedConstellationHasScreenshotRef.current = false;
    isDraftPromptPendingRef.current = false;
    checkedDraftKeyRef.current = null;
    clearBrowserCandidacyData();
    if (options?.navigateHome) {
      setCurrentPage('home');
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0);
      }
    }
  };

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      const prevUid = previousUidRef.current;

      if (!u) {
        previousUidRef.current = null;
        setUser(null);
        if (prevUid !== null) {
          clearConstellationDraft(prevUid);
          clearConstellationDraft(null);
          resetSessionState({ navigateHome: true });
        } else {
          setUserCandidacies([]);
        }
        return;
      }

      if (prevUid !== null && prevUid !== u.uid) {
        clearConstellationDraft(prevUid);
        clearConstellationDraft(u.uid);
        clearConstellationDraft(null);
        resetSessionState({ navigateHome: true });
      }
      previousUidRef.current = u.uid;
      setUser(u);

      fetchHistory(u.uid);
      void fetchUserAkashic(u.uid);
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

  const logout = async () => {
    const activeUid = previousUidRef.current || user?.uid || null;
    try {
      await signOut(auth);
    } finally {
      clearConstellationDraft(activeUid);
      clearConstellationDraft(null);
      previousUidRef.current = null;
      setUser(null);
      resetSessionState({ navigateHome: true });
    }
  };

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
          if (profile.nome) {
            setCandidacyForm(prev => (
              !prev.nome
                ? {
                    ...prev,
                    nome: profile.nome,
                    email: profile.email || user.email || '',
                    telefono: profile.telefono || '',
                    eta: profile.eta || '',
                    citta: profile.citta || '',
                    puntoRottura: profile.puntoRottura || ''
                  }
                : prev
            ));
          }
        }
      } catch (e) {
        console.error("Error loading profile:", e);
      }
    };
    loadProfile();
  }, [user]);

  const getConstellationSaveKey = (chars: CharacterType[], uid: string) => {
    const normalized = chars.map(c => ({
      id: c.id,
      shape: c.shape,
      color: c.color,
      label: c.label,
      x: Math.round(c.x),
      y: Math.round(c.y),
      ...(constellationLayoutType === 'building' && c.slot
        ? { slot: { floor: c.slot.floor, col: c.slot.col } }
        : {
            stair: getCharacterStairV2(c),
            normalizedX: Math.round(getCharacterNormalizedX(c) * 1000) / 1000
          }),
      feeling: c.feeling || null,
      memory: c.memory || ''
    }));
    return JSON.stringify({ uid, layoutVersion: 2, layoutType: constellationLayoutType, chars: normalized });
  };

  const saveRuneReading = async (question: string, runeIds: number[]) => {
    if (!user) return;
    const key = JSON.stringify({
      uid: user.uid,
      question: (question || '').trim(),
      ids: [...runeIds].sort((a, b) => a - b)
    });
    if (lastSavedRuneKeyRef.current === key) return;

    try {
      const selectedRunesNames = RUNES.filter(r => runeIds.includes(r.id)).map(r => r.name);
      const dataToSave = {
        question,
        runeIds,
        runeNames: selectedRunesNames,
        userName: (userProfile?.nome || user.displayName || '').slice(0, 100),
        userEmail: user.email || '',
        timestamp: serverTimestamp()
      };
      await addDoc(collection(db, 'users', user.uid, 'runeReadings'), dataToSave);
      // Global collection for Admin
      await addDoc(collection(db, 'allReadings'), { ...dataToSave, type: 'rune', userId: user.uid });
      lastSavedRuneKeyRef.current = key;
    } catch (e) {
      handleFirestoreError(e, 'create', `users/${user.uid}/runeReadings`);
    }
  };

  const saveFlowerReading = async (flowerIds: number[]) => {
    if (!user) return;
    const key = JSON.stringify({
      uid: user.uid,
      ids: [...flowerIds].sort((a, b) => a - b)
    });
    if (lastSavedFlowerKeyRef.current === key) return;

    try {
      const selectedFlowerNames = BACH_FLOWERS.filter(f => flowerIds.includes(f.id)).map(f => f.name);
      const dataToSave = {
        flowerIds,
        flowerNames: selectedFlowerNames,
        userName: (userProfile?.nome || user.displayName || '').slice(0, 100),
        userEmail: user.email || '',
        timestamp: serverTimestamp()
      };
      await addDoc(collection(db, 'users', user.uid, 'flowerReadings'), dataToSave);
      await addDoc(collection(db, 'allReadings'), { ...dataToSave, type: 'flower', userId: user.uid });
      lastSavedFlowerKeyRef.current = key;
    } catch (e) {
      handleFirestoreError(e, 'create', `users/${user.uid}/flowerReadings`);
    }
  };

  const captureConstellationBlob = async () => {
    if (!boardRef.current) return null;
    try {
      await waitForBoardImages(boardRef.current);
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(boardRef.current, {
        backgroundColor: '#f8f5f0',
        scale: 2,
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          sanitizeCanvasClone(clonedDoc);
          const shareBtn = clonedDoc.querySelector('[title="Invia a Graziamaria"]');
          if (shareBtn) (shareBtn as HTMLElement).style.display = 'none';
          clonedDoc.querySelectorAll<HTMLElement>('[data-constellation-neutral="true"], [data-constellation-scene-switcher="true"], [data-building-notice="true"]').forEach((el) => {
            el.style.display = 'none';
          });
          const main = clonedDoc.querySelector('main');
          if (main) {
            main.style.overflow = 'visible';
          }

          // Evita qualsiasi taglio inferiore sulle scritte delle pillole
          const pillEls = clonedDoc.querySelectorAll<HTMLElement>('[data-constellation-pill="true"]');
          pillEls.forEach((pillEl) => {
            pillEl.classList.remove('leading-none', 'truncate');
            pillEl.style.lineHeight = '1.5';
            pillEl.style.paddingTop = '4px';
            pillEl.style.paddingBottom = '4px';
            pillEl.style.height = 'auto';
            pillEl.style.minHeight = '28px';
            pillEl.style.overflow = 'visible';
            pillEl.style.maxWidth = 'none';

            pillEl.querySelectorAll<HTMLElement>('span').forEach((spanEl) => {
              spanEl.classList.remove('truncate', 'leading-none');
              spanEl.style.lineHeight = '1.5';
              spanEl.style.overflow = 'visible';
              spanEl.style.textOverflow = 'clip';
              spanEl.style.height = 'auto';
              spanEl.style.paddingTop = '2px';
              spanEl.style.paddingBottom = '2px';
            });

            const centerXAttr = Number(pillEl.getAttribute('data-pill-center-x'));
            pillEl.style.transform = 'none';
            if (Number.isFinite(centerXAttr)) {
              const measuredW =
                pillEl.getBoundingClientRect().width ||
                pillEl.offsetWidth ||
                Number(pillEl.getAttribute('data-pill-width')) ||
                80;
              pillEl.style.left = `${centerXAttr}px`;
              pillEl.style.marginLeft = `${-Math.round(measuredW / 2)}px`;
            }
          });

          // Evita tagli sulle etichette delle finestre del Palazzo
          clonedDoc.querySelectorAll<HTMLElement>('[data-building-pill="true"]').forEach((bpEl) => {
            bpEl.classList.remove('truncate', 'leading-none');
            bpEl.style.lineHeight = '1.4';
            bpEl.style.paddingTop = '3px';
            bpEl.style.paddingBottom = '3px';
            bpEl.style.height = 'auto';
            bpEl.style.overflow = 'visible';
            bpEl.style.transform = 'none';
            const bw = bpEl.getBoundingClientRect().width || bpEl.offsetWidth || 48;
            bpEl.style.left = '50%';
            bpEl.style.marginLeft = `${-Math.round(bw / 2)}px`;
          });

          // Evita tagli sui badge numerici (oltre 12 figure)
          const badgeEls = clonedDoc.querySelectorAll<HTMLElement>('[data-constellation-badge="true"]');
          badgeEls.forEach((badgeEl) => {
            badgeEl.classList.remove('leading-none');
            badgeEl.style.lineHeight = '1.5';
            badgeEl.style.paddingTop = '4px';
            badgeEl.style.paddingBottom = '4px';
            badgeEl.style.height = 'auto';
            badgeEl.style.overflow = 'visible';
            badgeEl.style.transform = 'none';
            const bw = badgeEl.getBoundingClientRect().width || badgeEl.offsetWidth || 18;
            const bh = badgeEl.getBoundingClientRect().height || badgeEl.offsetHeight || 22;
            badgeEl.style.marginLeft = `${-Math.round(bw / 2)}px`;
            badgeEl.style.marginBottom = `${-Math.round(bh / 2)}px`;
          });

          // Evita tagli nella legenda multi-colonna
          const legendEls = clonedDoc.querySelectorAll<HTMLElement>(
            '[data-constellation-legend="true"], [data-constellation-legend="true"] *'
          );
          legendEls.forEach((legendEl) => {
            legendEl.classList.remove('truncate', 'leading-none');
            legendEl.style.lineHeight = '1.5';
            legendEl.style.overflow = 'visible';
            legendEl.style.height = 'auto';
            if (legendEl.hasAttribute('data-constellation-legend-item')) {
              legendEl.style.paddingTop = '4px';
              legendEl.style.paddingBottom = '4px';
            }
          });
        }
      });
      return await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png', 0.9));
    } catch (error: any) {
      console.error('[captureConstellationBlob] Errore completo:', error?.message || error, error);
      throw error;
    }
  };

  const uploadConstellationBlob = async (blob: Blob) => {
    if (!user) throw new Error('Utente non autenticato.');
    const screenshotRef = ref(storage, `constellations/${user.uid}/${crypto.randomUUID()}_costellazione.png`);
    await uploadBytes(screenshotRef, blob, { contentType: 'image/png' });
    return await getDownloadURL(screenshotRef);
  };

  const uploadConstellationScreenshot = async () => {
    if (!user) throw new Error('Utente non autenticato.');
    try {
      const blob = await captureConstellationBlob();
      if (!blob) throw new Error('Impossibile generare l’immagine della costellazione (blob nullo).');
      return await uploadConstellationBlob(blob);
    } catch (error: any) {
      console.error('[uploadConstellationScreenshot] Errore completo:', error?.message || error, error);
      throw error;
    }
  };

  const resolveCharsWithStair = (chars: CharacterType[]): CharacterType[] => {
    if (constellationLayoutType === 'building') {
      return chars.slice(0, MAX_BUILDING_FIGURES).map(char => {
        const slot = char.slot || { floor: 1, col: 0 };
        const coords = getBuildingSlotRefCoords(slot);
        return {
          ...char,
          slot: { floor: slot.floor, col: slot.col },
          x: coords.x,
          y: coords.y
        };
      });
    }
    const capped = chars.slice(0, MAX_CONSTELLATION_FIGURES);
    return capped.map(char => {
      const stair: 'upper' | 'lower' = char.stair === 'upper' || char.stair === 'lower'
        ? char.stair
        : getCharacterStairV2(char);
      const normalizedX = typeof char.normalizedX === 'number' && Number.isFinite(char.normalizedX)
        ? Math.round(clamp01(char.normalizedX) * 1000) / 1000
        : Math.round(getCharacterNormalizedX(char) * 1000) / 1000;
      const geom = STAIR_GEOMETRY[stair];
      const snappedX = Math.round(getStairXRatio(stair, normalizedX) * STAGE_REF_WIDTH);
      const snappedY = Math.round(geom.yRatio * STAGE_REF_HEIGHT);
      return {
        ...char,
        stair,
        normalizedX,
        x: snappedX,
        y: snappedY
      };
    });
  };

  const saveConstellation = async (chars: CharacterType[], screenshotUrl?: string) => {
    if (!user || chars.length === 0) return false;
    const resolvedChars = resolveCharsWithStair(chars);
    const key = getConstellationSaveKey(resolvedChars, user.uid);
    if (lastSavedConstellationKeyRef.current === key) {
      return true;
    }

    try {
      const savedCharacters = resolvedChars.map(({ id, shape, color, label, x, y, stair, normalizedX, slot, feeling, memory }) => ({
        id,
        shape,
        color,
        label,
        x,
        y,
        ...(constellationLayoutType === 'building' && slot
          ? { slot: { floor: slot.floor, col: slot.col } }
          : { stair, normalizedX }),
        ...(feeling ? { feeling } : {}),
        ...(memory ? { memory } : {})
      }));
      const characterLabels = savedCharacters.map(c => c.label).filter(Boolean);
      const dataToSave = {
        characters: savedCharacters,
        labels: characterLabels,
        userData: {
          nome: userData.nome || '',
          eta: userData.eta || '',
          sesso: userData.sesso || '',
          layoutVersion: 2,
          layoutType: constellationLayoutType
        },
        ...(screenshotUrl ? { screenshotUrl } : {}),
        userName: (userProfile?.nome || user.displayName || '').slice(0, 100),
        userEmail: user.email || '',
        timestamp: serverTimestamp()
      };
      const personalRef = doc(collection(db, 'users', user.uid, 'constellations'));
      const globalRef = doc(collection(db, 'allReadings'));
      const batch = writeBatch(db);
      batch.set(personalRef, dataToSave);
      batch.set(globalRef, { ...dataToSave, type: 'constellation', userId: user.uid });
      await batch.commit();
      lastSavedConstellationKeyRef.current = key;
      lastSavedConstellationHasScreenshotRef.current = Boolean(screenshotUrl);
      clearConstellationDraft(user.uid);
      clearConstellationDraft(null);
      return true;
    } catch (e) {
      handleFirestoreError(e, 'create', `users/${user.uid}/constellations`);
    }
  };

  const submitCandidacy = async () => {
    if (!user) {
      showAlert('Accesso richiesto', "Per favore, effettua l'accesso per candidarti.", login);
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
      showAlert('Campi obbligatori', 'Nome, Email, Telefono e Descrizione del fastidio sono obbligatori.');
      return;
    }

    if (!candidacyForm.pattoFiducia || !candidacyForm.rispettoSpazioSacro || !candidacyForm.portaleVisivo) {
      showAlert('Conferma richiesta', 'Per favore, accetta i patti di fiducia e conferma la disponibilità delle foto per procedere.');
      return;
    }

    if (profilePhotoUrls.length + candidacyFiles.length < 2) {
      showAlert('Foto richieste', 'Per favore, carica almeno 2 foto della pianta dei tuoi piedi (sinistro e destro) per procedere.');
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
      
      showAlert('Candidatura salvata', 'Candidatura salvata! Ora si aprirà WhatsApp per inviare la notifica a Graziamaria. Lei ti risponderà direttamente su WhatsApp.');
      
      // Reset form but keep modal open for result screen
      setCandidacyForm({ ...INITIAL_CANDIDACY_FORM });
      setCandidacyFiles([]);
    } catch (e: any) {
      console.error("Full Candidacy Submission Error:", e);
      showAlert('Errore candidatura', e.message || "Errore durante l'invio della candidatura. Assicurati che lo Storage sia attivo nella console Firebase.");
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
  const stageRef = useRef<HTMLDivElement>(null);
  const neutralAreaRef = useRef<HTMLDivElement>(null);
  const constellationWorkAreaRef = useRef<HTMLDivElement>(null);
  const isDraftPromptPendingRef = useRef<boolean>(false);
  const checkedDraftKeyRef = useRef<string | null>(null);
  const charPointerDownRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const activeDraggedCharRef = useRef<string | null>(null);
  const lastCharDragEndRef = useRef<{ id: string; at: number } | null>(null);
  const [draggingCharId, setDraggingCharId] = useState<string | null>(null);
  const [stageWidth, setStageWidth] = useState<number>(() =>
    typeof window !== 'undefined' && window.innerWidth < 640 ? 340 : 800
  );
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [showCostellazioniHelp, setShowCostellazioniHelp] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );

  // Ripristino bozza locale alla riapertura della pagina Costellazioni
  useEffect(() => {
    if (currentPage !== 'costellazioni') {
      checkedDraftKeyRef.current = null;
      isDraftPromptPendingRef.current = false;
      return;
    }
    const draftKey = getConstellationDraftKey(user?.uid);
    if (checkedDraftKeyRef.current === draftKey) return;
    checkedDraftKeyRef.current = draftKey;

    if (characters.length > 0 || pendingCharacter !== null) {
      return;
    }

    const draft = loadConstellationDraft(user?.uid);
    if (!draft) return;

    isDraftPromptPendingRef.current = true;
    showConfirm(
      'Riprendi costellazione',
      'Hai una costellazione non terminata. Vuoi riprenderla?',
      () => {
        const restoredLayout: ConstellationLayoutType = draft.layoutType === 'building' ? 'building' : 'stairs';
        const maxRestoredFigures = restoredLayout === 'building' ? MAX_BUILDING_FIGURES : MAX_CONSTELLATION_FIGURES;
        const filteredDraftChars = restoredLayout === 'building'
          ? draft.characters.filter((c) => {
              if (!c.slot) return false;
              const floor = Math.round(Number(c.slot.floor));
              const col = Math.round(Number(c.slot.col));
              return Number.isFinite(floor) && Number.isFinite(col) && floor >= 1 && floor <= 5 && col >= 0 && col <= 4;
            })
          : draft.characters;
        const restoredChars: CharacterType[] = filteredDraftChars.slice(0, maxRestoredFigures).map((c) => {
          if (restoredLayout === 'building' && c.slot) {
            const slot = {
              floor: Math.round(Number(c.slot.floor)),
              col: Math.round(Number(c.slot.col))
            };
            const coords = getBuildingSlotRefCoords(slot);
            return {
              id: c.id || Math.random().toString(36).substr(2, 9),
              shape: c.shape,
              color: c.color,
              label: c.label || 'Sconosciuto',
              x: coords.x,
              y: coords.y,
              slot,
              snapSeq: 0,
              ...(c.feeling ? { feeling: c.feeling } : {}),
              ...(c.memory ? { memory: c.memory } : {})
            };
          }
          const stair: 'upper' | 'lower' = c.stair === 'upper' || c.stair === 'lower' ? c.stair : 'lower';
          const normalizedX = clamp01(Number(c.normalizedX));
          return {
            id: c.id || Math.random().toString(36).substr(2, 9),
            shape: c.shape,
            color: c.color,
            label: c.label || 'Sconosciuto',
            x: Math.round(getStairXRatio(stair, normalizedX) * STAGE_REF_WIDTH),
            y: Math.round(STAIR_GEOMETRY[stair].yRatio * STAGE_REF_HEIGHT),
            stair,
            normalizedX,
            snapSeq: 0,
            ...(c.feeling ? { feeling: c.feeling } : {}),
            ...(c.memory ? { memory: c.memory } : {})
          };
        });
        setConstellationLayoutType(restoredLayout);
        setCharacters(restoredChars);
        setPendingCharacter(
          draft.pendingCharacter
            ? { ...draft.pendingCharacter, snapSeq: 0 }
            : null
        );
        setUserData(prev => ({
          ...prev,
          nome: draft.userData?.nome || '',
          eta: draft.userData?.eta || '',
          sesso: draft.userData?.sesso || ''
        }));
        setWorkflowStep(0);
        isDraftPromptPendingRef.current = false;
      },
      {
        confirmLabel: 'Riprendi',
        cancelLabel: 'Ricomincia',
        onCancel: () => {
          clearConstellationDraft(user?.uid);
          isDraftPromptPendingRef.current = false;
        },
        onDismiss: () => {
          isDraftPromptPendingRef.current = false;
        }
      }
    );
  }, [currentPage, user?.uid]);

  // Salvataggio automatico della bozza locale con ritardo di 500 ms
  useEffect(() => {
    if (currentPage !== 'costellazioni') return;
    if (isDraftPromptPendingRef.current) return;
    if (characters.length === 0 && !pendingCharacter) return;

    const timer = setTimeout(() => {
      if (isDraftPromptPendingRef.current) return;
      saveConstellationDraft(user?.uid, {
        layoutType: constellationLayoutType,
        characters,
        userData: {
          nome: userData.nome || '',
          eta: userData.eta || '',
          sesso: userData.sesso || ''
        },
        pendingCharacter
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [currentPage, constellationLayoutType, characters, pendingCharacter, userData.nome, userData.eta, userData.sesso, user?.uid]);

  useEffect(() => {
    let observer: ResizeObserver | null = null;
    let rafId = 0;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const updateStageSize = () => {
      if (typeof window !== 'undefined') {
        setIsMobileViewport(window.innerWidth < 768);
      }
      if (stageRef.current?.clientWidth) {
        setStageWidth(stageRef.current.clientWidth);
      } else if (typeof window !== 'undefined') {
        const fallbackMax = constellationLayoutType === 'building' ? 520 : 800;
        setStageWidth(Math.min(fallbackMax, Math.max(280, window.innerWidth - 32)));
      }
    };

    const attachObserver = () => {
      updateStageSize();
      if (stageRef.current && typeof ResizeObserver !== 'undefined' && !observer) {
        observer = new ResizeObserver((entries) => {
          const width = entries[0]?.contentRect?.width;
          if (width && width > 0) {
            setStageWidth(width);
          }
        });
        observer.observe(stageRef.current);
      }
    };

    attachObserver();
    rafId = requestAnimationFrame(attachObserver);
    timerId = setTimeout(attachObserver, 350);
    window.addEventListener('resize', updateStageSize);

    return () => {
      cancelAnimationFrame(rafId);
      if (timerId) clearTimeout(timerId);
      if (observer) observer.disconnect();
      window.removeEventListener('resize', updateStageSize);
    };
  }, [currentPage, constellationLayoutType]);

  const showBuildingNotice = (msg: string) => {
    setBuildingNotice(msg);
    if (buildingNoticeTimerRef.current) {
      clearTimeout(buildingNoticeTimerRef.current);
    }
    buildingNoticeTimerRef.current = setTimeout(() => {
      setBuildingNotice(null);
    }, 2200);
  };

  const handleChangeConstellationLayout = (nextLayout: ConstellationLayoutType) => {
    if (nextLayout === constellationLayoutType) return;
    if (characters.length > 0) {
      showConfirm(
        'Cambia scena',
        'Cambiando scena le figure posizionate verranno rimosse. Continuare?',
        () => {
          setCharacters([]);
          setWorkflowStep(0);
          setHighlightedBuildingSlot(null);
          setBuildingNotice(null);
          lastSavedConstellationKeyRef.current = null;
          setConstellationLayoutType(nextLayout);
        },
        { confirmLabel: 'Continua', cancelLabel: 'Annulla' }
      );
      return;
    }
    setConstellationLayoutType(nextLayout);
    setWorkflowStep(0);
    setHighlightedBuildingSlot(null);
    setBuildingNotice(null);
  };

  const maxFiguresForCurrentLayout = constellationLayoutType === 'building' ? MAX_BUILDING_FIGURES : MAX_CONSTELLATION_FIGURES;

  const handleDraw = () => {
    if (pendingCharacter || characters.length >= maxFiguresForCurrentLayout || availablePickerShapes.length === 0) return;
    const randomShape = availablePickerShapes[Math.floor(Math.random() * availablePickerShapes.length)];
    selectCharacter(randomShape);
  };

  const selectCharacter = (char: typeof CHARACTER_SHAPES[number]) => {
    if (pendingCharacter || characters.length >= maxFiguresForCurrentLayout || availablePickerShapes.length === 0) return;
    setPendingCharacter({
      id: Math.random().toString(36).substr(2, 9),
      shape: char.shape as CharacterType['shape'],
      color: char.color,
      label: '',
      snapSeq: 0
    });
    setDrawingCharacter(null);
    setShowLabelInput(false);
    setShowPicker(false);
    setTempLabel('');
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        (constellationWorkAreaRef.current || neutralAreaRef.current)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        neutralAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 80);
  };

  const drawRune = () => {
    const randomRune = RUNES[Math.floor(Math.random() * RUNES.length)];
    setCurrentRune(randomRune);
    setSelectedRunesIds(prev => [...new Set([...prev, randomRune.id])]);
  };

  const confirmCharacter = () => {
    if (!drawingCharacter) return;

    const newId = Math.random().toString(36).substr(2, 9);
    // Aggancia alla superficie del gradino più vicino al centro (y = 0.50 -> upper 0.478, x = 0.50)
    const initialPlacement = snapStageRatioToStair(0.5, 0.5);
    const newChar: CharacterType = {
      id: newId,
      shape: drawingCharacter.shape as any,
      color: drawingCharacter.color,
      label: tempLabel || "Sconosciuto",
      x: initialPlacement.x,
      y: initialPlacement.y,
      stair: initialPlacement.stair,
      normalizedX: initialPlacement.normalizedX,
      snapSeq: 0,
    };

    setCharacters(prev => [...prev, newChar]);
    setDrawingCharacter(null);
    setShowLabelInput(false);
  };

  const removeCharacter = (id: string) => {
    if (workflowStep !== 0) return;
    setCharacters(prev => {
      const next = prev.filter(c => c.id !== id);
      if (next.length === 0 && !pendingCharacter) {
        clearConstellationDraft(user?.uid);
      }
      return next;
    });
  };

  const handleCharacterClick = (char: CharacterType) => {
    setAnalyzingCharacter(char);
    setTempLabelEdit(char.label || '');
    setTempMemory(char.memory || '');
    setTempFeeling(char.feeling || null);
  };

  const saveAnalysis = () => {
    if (!analyzingCharacter) return;
    const nextLabel = tempLabelEdit.trim() || 'Sconosciuto';

    setCharacters(prev => prev.map(c => 
      c.id === analyzingCharacter.id 
        ? {
            ...c,
            label: nextLabel,
            feeling: tempFeeling || undefined,
            memory: tempMemory
          } 
        : c
    ));
    setAnalyzingCharacter(null);
  };

  const requestRemoveEditedCharacter = () => {
    if (!analyzingCharacter) return;
    const target = analyzingCharacter;
    showConfirm(
      'Rimuovi pupazzo',
      `Vuoi rimuovere "${target.label || 'Senza nome'}" dalla costellazione?`,
      () => {
        setCharacters(prev => {
          const next = prev.filter(c => c.id !== target.id);
          if (next.length === 0 && !pendingCharacter) {
            clearConstellationDraft(user?.uid);
          }
          return next;
        });
        setAnalyzingCharacter(null);
      },
      { danger: true, confirmLabel: 'Rimuovi', cancelLabel: 'Annulla' }
    );
  };

  const executeGeneratePDF = async () => {
    const { jsPDF } = await import('jspdf');
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
  };

  const promptPendingBeforeAction = (proceedAction: () => void | Promise<void>) => {
    if (!pendingCharacter) {
      void proceedAction();
      return;
    }
    showConfirm(
      'Pupazzo da posizionare',
      "C'è un pupazzo non ancora posizionato. Vuoi posizionarlo o salvare senza?",
      proceedAction,
      {
        cancelLabel: 'Posiziona',
        confirmLabel: 'Salva senza',
        onCancel: () => {
          neutralAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    );
  };

  const generatePDF = () => {
    promptPendingBeforeAction(executeGeneratePDF);
  };

  const executeSaveAndSendConstellation = async () => {
    if (!user) { showAlert('Accesso richiesto', 'Effettua il login per salvare.'); return; }
    try {
      const resolvedChars = resolveCharsWithStair(characters);
      const currentKey = getConstellationSaveKey(resolvedChars, user.uid);
      if (lastSavedConstellationKeyRef.current === currentKey) {
        showAlert(
          'Costellazione salvata',
          lastSavedConstellationHasScreenshotRef.current
            ? 'Costellazione salvata. L’immagine è stata inviata anche all’area admin.'
            : 'Costellazione già salvata nell’area admin.'
        );
        return;
      }

      let screenshotUrl: string | undefined;
      try {
        screenshotUrl = await uploadConstellationScreenshot();
      } catch (screenshotError: any) {
        console.error('Errore generazione screenshot:', screenshotError?.message || screenshotError, screenshotError);
      }
      const saved = await saveConstellation(resolvedChars, screenshotUrl);
      if (saved) {
        await fetchHistory(user.uid);
        showAlert(
          'Costellazione salvata',
          screenshotUrl
            ? 'Costellazione salvata. L’immagine è stata inviata anche all’area admin.'
            : 'Costellazione salvata nell’area admin, ma lo screenshot automatico non è stato generato. Fai ora uno screenshot manuale della tavola e invialo a Graziamaria insieme al report.'
        );
      }
    } catch (error: any) {
      console.error('Errore salvataggio costellazione:', error);
      showAlert('Errore salvataggio', `Impossibile salvare la costellazione. ${error?.message || 'Controlla il collegamento Firebase.'}`);
    }
  };

  const closeSentToGraziamariaModal = () => {
    setSentToGraziamariaModal(null);
  };

  const handleDownloadSentImage = () => {
    if (!sentToGraziamariaModal?.imageBlob) return;
    const downloadUrl = URL.createObjectURL(sentToGraziamariaModal.imageBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'costellazione.png';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    }, 500);
  };

  const executeShare = async () => {
    if (!boardRef.current || isSharing || !user) return;

    const resolvedChars = resolveCharsWithStair(characters);
    setIsSharing(true);

    const persistShareIfLoggedIn = async (capturedBlob: Blob | null) => {
      if (!user || resolvedChars.length === 0) return;
      const currentKey = getConstellationSaveKey(resolvedChars, user.uid);
      if (lastSavedConstellationKeyRef.current === currentKey) return;
      try {
        let screenshotUrl: string | undefined;
        if (capturedBlob) {
          screenshotUrl = await uploadConstellationBlob(capturedBlob);
        }
        const saved = await saveConstellation(resolvedChars, screenshotUrl);
        if (saved) {
          await fetchHistory(user.uid);
        }
      } catch (saveError) {
        console.error('Errore salvataggio costellazione da condivisione:', saveError);
      }
    };

    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      let blob: Blob | null = null;
      try {
        blob = await captureConstellationBlob();
      } catch (captureError) {
        console.error('Errore durante la generazione immagine:', captureError);
      }
      await persistShareIfLoggedIn(blob);
      setSentToGraziamariaModal({ imageBlob: blob });
    } finally {
      setIsSharing(false);
    }
  };

  const handleShare = () => {
    if (!user) {
      showConfirm(
        'Accesso richiesto',
        'Per inviare a Graziamaria devi accedere.',
        async () => {
          pendingShareAfterLoginRef.current = true;
          await login();
          if (!auth.currentUser) {
            pendingShareAfterLoginRef.current = false;
          }
        },
        {
          confirmLabel: 'Accedi con Google',
          cancelLabel: 'Annulla',
          onCancel: () => {
            pendingShareAfterLoginRef.current = false;
          },
          onDismiss: () => {
            pendingShareAfterLoginRef.current = false;
          }
        }
      );
      return;
    }
    promptPendingBeforeAction(executeShare);
  };

  useEffect(() => {
    if (user && pendingShareAfterLoginRef.current) {
      pendingShareAfterLoginRef.current = false;
      if (currentPage === 'costellazioni') {
        promptPendingBeforeAction(executeShare);
      }
    }
  }, [user, currentPage]);

  const openAkashicForm = (activeUser: User | null = user) => {
    if (!activeUser) {
      showConfirm(
        'Accesso richiesto',
        'Per richiedere la tua lettura dei Registri Akashici devi accedere.',
        async () => {
          pendingAkashicAfterLoginRef.current = true;
          await login();
          if (!auth.currentUser) {
            pendingAkashicAfterLoginRef.current = false;
          }
        },
        {
          confirmLabel: 'Accedi',
          cancelLabel: 'Annulla',
          onCancel: () => {
            pendingAkashicAfterLoginRef.current = false;
          },
          onDismiss: () => {
            pendingAkashicAfterLoginRef.current = false;
          }
        }
      );
      return;
    }
    setAkashicForm(prev => ({
      ...prev,
      email: prev.email || activeUser.email || ''
    }));
    setAkashicSubmitted(false);
    setShowAkashicForm(true);
  };

  useEffect(() => {
    if (user && pendingAkashicAfterLoginRef.current) {
      pendingAkashicAfterLoginRef.current = false;
      if (currentPage === 'registri') {
        setAkashicForm(prev => ({
          ...prev,
          email: prev.email || user.email || ''
        }));
        setAkashicSubmitted(false);
        setShowAkashicForm(true);
      }
    }
  }, [user, currentPage]);

  const isAkashicEmailValid = (emailValue: string) => {
    const trimmed = emailValue.trim();
    return trimmed.length > 0 && trimmed.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  };

  const isAkashicFormValid =
    akashicForm.name.trim().length > 0 &&
    akashicForm.name.trim().length <= 100 &&
    isAkashicEmailValid(akashicForm.email) &&
    AKASHIC_AREAS.includes(akashicForm.area as (typeof AKASHIC_AREAS)[number]) &&
    akashicForm.question.trim().length > 0 &&
    akashicForm.question.trim().length <= 2000 &&
    akashicForm.hope.trim().length > 0 &&
    akashicForm.hope.trim().length <= 2000 &&
    akashicForm.birthDate.trim().length <= 50 &&
    akashicForm.notes.trim().length <= 2000 &&
    akashicForm.consentAccepted === true;

  const handleSubmitAkashicRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingAkashic) return;
    if (!user) {
      openAkashicForm(null);
      return;
    }
    if (!isAkashicFormValid) return;

    setIsSubmittingAkashic(true);
    try {
      const trimmedBirthDate = akashicForm.birthDate.trim();
      const trimmedNotes = akashicForm.notes.trim();
      const payload: Record<string, any> = {
        ownerUid: user.uid,
        name: akashicForm.name.trim().slice(0, 100),
        ...(trimmedBirthDate ? { birthDate: trimmedBirthDate.slice(0, 50) } : {}),
        email: akashicForm.email.trim().slice(0, 200),
        area: akashicForm.area,
        question: akashicForm.question.trim().slice(0, 2000),
        hope: akashicForm.hope.trim().slice(0, 2000),
        ...(trimmedNotes ? { notes: trimmedNotes.slice(0, 2000) } : {}),
        consentAccepted: true,
        consentAt: serverTimestamp(),
        status: 'nuova',
        createdAt: serverTimestamp(),
        deletionRequested: false
      };
      await addDoc(collection(db, 'akashicRequests'), payload);
      void fetchUserAkashic(user.uid);
      setAkashicSubmitted(true);
      setShowAkashicForm(false);
      setShowAkashicPrivacy(false);
      setAkashicForm({
        name: '',
        birthDate: '',
        email: user.email || '',
        area: '',
        question: '',
        hope: '',
        notes: '',
        consentAccepted: false
      });
    } catch (error) {
      try {
        handleFirestoreError(error, 'create', 'akashicRequests');
      } catch (structuredErr) {
        console.error('Errore invio Registri Akashici:', structuredErr);
      }
      showAlert('Errore invio', 'Non è stato possibile inviare la richiesta. Riprova tra poco.');
    } finally {
      setIsSubmittingAkashic(false);
    }
  };

  const toggleFlowerSelection = (id: number) => {
    setSelectedFlowersIds(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const generateFlowerPDF = async () => {
    if (selectedFlowersIds.length === 0) return;

    const { jsPDF } = await import('jspdf');
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
  };

  const generateRunePDF = async () => {
    if (selectedRunesIds.length === 0) return;

    const { jsPDF } = await import('jspdf');
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
  };

  const renderShape = (
    shape: string,
    color: string,
    size: 'normal' | 'small' = 'normal',
    densityScale: number = 1,
    badgeNumber?: number,
    stageWidthOverride?: number,
    scaleOverride?: number
  ) => {
    const activeStageW = typeof stageWidthOverride === 'number' ? stageWidthOverride : stageWidth;
    const isMobile = activeStageW < 640;
    const baseScale = size === 'small' ? 0.6 : 1;
    const finalScale = typeof scaleOverride === 'number'
      ? scaleOverride
      : (isMobile && size === 'normal' ? 0.75 : baseScale) * (size === 'normal' ? densityScale : 1);
    const { bodyWidth, bodyHeight, headSize, isConical, isFlat, isBlock } = getShapeBaseDimensions(shape);

    return (
      <div className="relative flex flex-col items-center justify-end pointer-events-none">
        <div
          className="relative flex flex-col items-center justify-center pointer-events-none"
          style={{
            transform: `scale(${finalScale})`,
            transformOrigin: size === 'normal' ? 'bottom center' : 'center'
          }}
        >
          {/* Head */}
          {!isBlock && !isFlat && (
            <div 
              className="rounded-full border border-black/10 shadow-sm z-10"
              style={{ 
                backgroundColor: color, 
                width: headSize, 
                height: headSize,
                marginBottom: -headSize / 4
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

        {/* Piccolo numero leggibile sul corpo quando ci sono oltre 12 figure */}
        {typeof badgeNumber === 'number' && (
          <div
            data-constellation-badge="true"
            className="absolute left-1/2 z-20 flex items-center justify-center rounded-full bg-white text-[#4a3f35] border border-[#5a5a40] font-bold shadow-sm leading-none pointer-events-none"
            style={{
              bottom: `${Math.max(2, (bodyHeight * finalScale) * (isFlat ? 0.34 : 0.46))}px`,
              transform: 'translate(-50%, 50%)',
              minWidth: '16px',
              height: '16px',
              padding: '0 3px',
              fontSize: '9px'
            }}
          >
            {badgeNumber}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-[#f8f5f0] font-sans text-[#4a3f35] ${currentPage === 'costellazioni' ? 'overflow-x-clip' : 'overflow-hidden'} flex flex-col`} translate="no">
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
                    onClick={() => guardAkashicUnsaved(() => setCurrentPage('home'))}
                    className="p-3 bg-[#4a3f35] text-white rounded-full hover:bg-black transition-all shadow-lg"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {(() => {
                const akashicNewCount = akashicRequestsList.filter(r => r.status === 'nuova').length;
                const akashicDeletionCount = akashicRequestsList.filter(r => r.deletionRequested === true).length;
                const akashicInProgressCount = akashicRequestsList.filter(r => r.status === 'in_lavorazione').length;
                const akashicCompletedCount = akashicRequestsList.filter(r => r.status === 'completata').length;
                const normalizedAkashicSearch = akashicAdminSearch.trim().toLowerCase();
                const selectedAkashicRequest = selectedAkashicRequestId
                  ? akashicRequestsList.find(r => r.id === selectedAkashicRequestId) || null
                  : null;
                const currentAkashicReading = selectedAkashicRequest
                  ? akashicReadingsMap[selectedAkashicRequest.id] || null
                  : null;

                type AkashicArchiveEntry = { email: string; displayEmail: string; name: string; count: number; lastTimestampMs: number; lastDateLabel: string };
                const akashicArchiveByClient: Record<string, AkashicArchiveEntry> = {};
                for (const req of akashicRequestsList) {
                  const rawEmail = (req.email || '').trim();
                  const key = rawEmail.toLowerCase() || `uid:${req.ownerUid || req.id}`;
                  const tsMs = req.createdAt?.toDate ? req.createdAt.toDate().getTime() : 0;
                  const dateLabel = req.createdAt?.toDate ? req.createdAt.toDate().toLocaleDateString('it-IT') : 'Recente';
                  if (!akashicArchiveByClient[key]) {
                    akashicArchiveByClient[key] = {
                      email: rawEmail.toLowerCase(),
                      displayEmail: rawEmail || 'Email non disponibile',
                      name: req.name || 'Cliente senza nome',
                      count: 1,
                      lastTimestampMs: tsMs,
                      lastDateLabel: dateLabel
                    };
                  } else {
                    akashicArchiveByClient[key].count += 1;
                    if (tsMs > akashicArchiveByClient[key].lastTimestampMs) {
                      akashicArchiveByClient[key].lastTimestampMs = tsMs;
                      akashicArchiveByClient[key].lastDateLabel = dateLabel;
                      if (req.name) akashicArchiveByClient[key].name = req.name;
                    }
                  }
                }
                const akashicClientArchive: AkashicArchiveEntry[] = Object.values(akashicArchiveByClient).sort(
                  (a, b) => b.lastTimestampMs - a.lastTimestampMs
                );

                const filteredAkashicArchive = akashicClientArchive.filter(client => {
                  if (!normalizedAkashicSearch) return true;
                  return (
                    client.name.toLowerCase().includes(normalizedAkashicSearch) ||
                    client.displayEmail.toLowerCase().includes(normalizedAkashicSearch)
                  );
                });

                const filteredAkashicRequests = akashicRequestsList.filter(req => {
                  if (akashicAdminFilter !== 'tutte' && akashicAdminFilter !== 'archivio' && req.status !== akashicAdminFilter) {
                    return false;
                  }
                  if (selectedAkashicClientEmail && (req.email || '').trim().toLowerCase() !== selectedAkashicClientEmail) {
                    return false;
                  }
                  if (!normalizedAkashicSearch) return true;
                  const name = (req.name || '').toString().toLowerCase();
                  const email = (req.email || '').toString().toLowerCase();
                  return name.includes(normalizedAkashicSearch) || email.includes(normalizedAkashicSearch);
                });

                const totalAkashicWords = akashicEditorChapters.reduce((sum, ch) => sum + countAkashicWords(ch), 0);
                const statusLabelMap: Record<string, { label: string; cls: string }> = {
                  nuova: { label: 'Nuova', cls: 'bg-amber-100 text-amber-800 border border-amber-300' },
                  in_lavorazione: { label: 'In lavorazione', cls: 'bg-[#f8f5f0] text-[#5a5a40] border border-[#c2b280]' },
                  completata: { label: 'Completata', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }
                };

                return (
                  <>
                    <div className="flex flex-wrap items-center gap-3 mb-8">
                      <button
                        type="button"
                        onClick={() => guardAkashicUnsaved(() => setAdminSection('portali'))}
                        className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
                          adminSection === 'portali'
                            ? 'bg-[#4a3f35] text-white border-[#4a3f35] shadow-md'
                            : 'bg-[#f8f5f0] text-[#4a3f35] border-[#e5e0d8] hover:border-[#c2b280]'
                        }`}
                      >
                        Portali e Candidature
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminSection('akashic')}
                        className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border flex items-center gap-2.5 ${
                          adminSection === 'akashic'
                            ? 'bg-[#4a3f35] text-white border-[#4a3f35] shadow-md'
                            : 'bg-[#f8f5f0] text-[#4a3f35] border-[#e5e0d8] hover:border-[#c2b280]'
                        }`}
                      >
                        <BookOpen size={14} className="text-[#c2b280]" />
                        <span>Registri Akashici</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${akashicNewCount > 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-white text-[#4a3f35]/70 border border-[#e5e0d8]'}`}>
                          Nuove: {akashicNewCount}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${akashicDeletionCount > 0 ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-white text-[#4a3f35]/70 border border-[#e5e0d8]'}`}>
                          Cancellazioni: {akashicDeletionCount}
                        </span>
                      </button>
                    </div>

                    {adminSection === 'akashic' ? (
                      <div className="space-y-6">
                        {selectedAkashicRequest ? (
                          <div className="space-y-6">
                            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#fdfbf7] p-4 rounded-2xl border border-[#e5e0d8]">
                              <button
                                type="button"
                                onClick={() => guardAkashicUnsaved(() => setSelectedAkashicRequestId(null))}
                                className="px-4 py-2 rounded-full bg-white border border-[#e5e0d8] text-xs font-bold uppercase tracking-wider text-[#4a3f35] hover:bg-[#f8f5f0] transition-colors flex items-center gap-2"
                              >
                                <X size={14} /> Torna all&apos;elenco
                              </button>
                              <div className="flex flex-wrap items-center gap-2.5">
                                {selectedAkashicRequest.deletionRequested === true && (
                                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 border border-red-300">
                                    Cancellazione richiesta
                                  </span>
                                )}
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${(statusLabelMap[selectedAkashicRequest.status] || statusLabelMap.nuova).cls}`}>
                                  {(statusLabelMap[selectedAkashicRequest.status] || statusLabelMap.nuova).label}
                                </span>
                                <a
                                  href={`mailto:${encodeURIComponent(selectedAkashicRequest.email || '')}?subject=${encodeURIComponent("Il tuo Libro dell'Anima")}`}
                                  className="px-4 py-2 rounded-full bg-[#c2b280] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#b1a170] transition-all shadow-sm flex items-center gap-2"
                                >
                                  <Send size={13} /> Scrivi email al cliente
                                </a>
                                <button
                                  type="button"
                                  disabled={isDeletingAkashicRequestId === selectedAkashicRequest.id}
                                  onClick={() => deleteAkashicRequest(selectedAkashicRequest)}
                                  className="px-4 py-2 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-bold uppercase tracking-wider hover:bg-red-100 transition-all disabled:opacity-50 flex items-center gap-1.5"
                                >
                                  <Trash2 size={13} />
                                  <span>Elimina richiesta</span>
                                </button>
                              </div>
                            </div>

                            {/* Dettaglio richiesta cliente */}
                            <div className="bg-[#fdfbf7] p-6 sm:p-8 rounded-3xl border border-[#e5e0d8] shadow-sm space-y-6">
                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#e5e0d8] pb-5">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2.5">
                                    <h2 className="font-serif italic text-3xl text-[#4a3f35]">{selectedAkashicRequest.name || 'Cliente'}</h2>
                                    {selectedAkashicRequest.deletionRequested === true && (
                                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 border border-red-300">
                                        Cancellazione richiesta
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-[#5a5a40] font-medium mt-1">{selectedAkashicRequest.email}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  {selectedAkashicRequest.status === 'completata' && currentAkashicReading?.published ? (
                                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                                      Completata (Pubblicata)
                                    </span>
                                  ) : (
                                    <div className="inline-flex items-center gap-1.5 bg-white p-1 rounded-full border border-[#e5e0d8]">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#5a5a40] pl-2.5 pr-1">Stato:</span>
                                      <button
                                        type="button"
                                        disabled={isUpdatingAkashicStatus}
                                        onClick={() => void updateAkashicRequestStatus(selectedAkashicRequest.id, 'nuova')}
                                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                                          selectedAkashicRequest.status === 'nuova'
                                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                            : 'text-[#4a3f35]/70 hover:bg-[#f8f5f0]'
                                        }`}
                                      >
                                        Nuova
                                      </button>
                                      <button
                                        type="button"
                                        disabled={isUpdatingAkashicStatus}
                                        onClick={() => void updateAkashicRequestStatus(selectedAkashicRequest.id, 'in_lavorazione')}
                                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                                          selectedAkashicRequest.status === 'in_lavorazione'
                                            ? 'bg-[#c2b280] text-white'
                                            : 'text-[#4a3f35]/70 hover:bg-[#f8f5f0]'
                                        }`}
                                      >
                                        In lavorazione
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                                <div className="bg-white p-3.5 rounded-2xl border border-[#e5e0d8]">
                                  <p className="text-[9px] uppercase tracking-widest font-black text-[#c2b280] mb-1">Area da esplorare</p>
                                  <p className="font-bold text-[#4a3f35]">{selectedAkashicRequest.area || 'N/D'}</p>
                                </div>
                                {selectedAkashicRequest.birthDate && (
                                  <div className="bg-white p-3.5 rounded-2xl border border-[#e5e0d8]">
                                    <p className="text-[9px] uppercase tracking-widest font-black text-[#c2b280] mb-1">Data di nascita</p>
                                    <p className="font-bold text-[#4a3f35]">{selectedAkashicRequest.birthDate}</p>
                                  </div>
                                )}
                                <div className="bg-white p-3.5 rounded-2xl border border-[#e5e0d8]">
                                  <p className="text-[9px] uppercase tracking-widest font-black text-[#c2b280] mb-1">Data richiesta</p>
                                  <p className="font-bold text-[#4a3f35]">
                                    {selectedAkashicRequest.createdAt?.toDate
                                      ? selectedAkashicRequest.createdAt.toDate().toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' })
                                      : 'Recente'}
                                  </p>
                                </div>
                                <div className="bg-white p-3.5 rounded-2xl border border-[#e5e0d8]">
                                  <p className="text-[9px] uppercase tracking-widest font-black text-[#c2b280] mb-1">Consenso privacy</p>
                                  <p className="font-bold text-[#4a3f35]">
                                    {selectedAkashicRequest.consentAccepted ? 'Accettato' : 'Non accettato'}
                                    {selectedAkashicRequest.consentAt?.toDate
                                      ? ` · ${selectedAkashicRequest.consentAt.toDate().toLocaleDateString('it-IT')}`
                                      : ''}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white p-5 rounded-2xl border-2 border-[#c2b280] shadow-sm">
                                  <p className="text-[10px] uppercase tracking-widest font-black text-[#c2b280] mb-2">
                                    Domanda che porta dentro di sé
                                  </p>
                                  <p className="text-sm text-[#4a3f35] leading-relaxed whitespace-pre-wrap font-medium">
                                    {selectedAkashicRequest.question}
                                  </p>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border-2 border-[#c2b280] shadow-sm">
                                  <p className="text-[10px] uppercase tracking-widest font-black text-[#c2b280] mb-2">
                                    Cosa si augura di trovare
                                  </p>
                                  <p className="text-sm text-[#4a3f35] leading-relaxed whitespace-pre-wrap font-medium">
                                    {selectedAkashicRequest.hope}
                                  </p>
                                </div>
                              </div>

                              {selectedAkashicRequest.notes && (
                                <div className="bg-white p-4 rounded-2xl border border-[#e5e0d8]">
                                  <p className="text-[10px] uppercase tracking-widest font-black text-[#5a5a40] mb-1.5">
                                    Informazioni aggiuntive
                                  </p>
                                  <p className="text-xs text-[#4a3f35]/90 leading-relaxed whitespace-pre-wrap">
                                    {selectedAkashicRequest.notes}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Editor della lettura a 7 capitoli */}
                            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#e5e0d8] shadow-sm space-y-6">
                              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#e5e0d8] pb-5">
                                <div>
                                  <h3 className="font-serif italic text-2xl text-[#4a3f35]">Editor della Lettura</h3>
                                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[#5a5a40]">
                                    <span className="font-bold">Parole totali: {totalAkashicWords}</span>
                                    <span>·</span>
                                    <span>
                                      {isSavingAkashicDraft
                                        ? 'Salvataggio bozza in corso...'
                                        : hasUnsavedAkashicChanges
                                          ? 'Modifiche non ancora salvate (salvataggio automatico tra 2s)'
                                          : akashicDraftSavedAt
                                            ? `Bozza salvata alle ${akashicDraftSavedAt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`
                                            : 'Nessuna bozza salvata'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2.5">
                                  <button
                                    type="button"
                                    disabled={isSavingAkashicDraft || isPublishingAkashic}
                                    onClick={() => void saveAkashicDraft(selectedAkashicRequest, akashicEditorChapters)}
                                    className="px-5 py-2.5 rounded-full border border-[#e5e0d8] bg-[#fdfbf7] text-xs font-bold uppercase tracking-wider text-[#4a3f35] hover:bg-[#f8f5f0] transition-all disabled:opacity-50 flex items-center gap-2"
                                  >
                                    <Save size={14} className="text-[#c2b280]" />
                                    <span>Salva bozza</span>
                                  </button>
                                  {currentAkashicReading?.published ? (
                                    <button
                                      type="button"
                                      disabled={isPublishingAkashic || isSavingAkashicDraft}
                                      onClick={() => void unpublishAkashicReading(selectedAkashicRequest)}
                                      className="px-5 py-2.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold uppercase tracking-wider hover:bg-amber-100 transition-all disabled:opacity-50"
                                    >
                                      {isPublishingAkashic ? 'Attendere...' : 'Ritira la pubblicazione'}
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={isPublishingAkashic || isSavingAkashicDraft}
                                      onClick={() => publishAkashicReading(selectedAkashicRequest)}
                                      className="px-6 py-2.5 rounded-full bg-[#c2b280] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#b1a170] shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                      <CheckCircle2 size={14} />
                                      <span>{isPublishingAkashic ? 'Pubblicazione...' : 'Pubblica la lettura'}</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-6">
                                {AKASHIC_CHAPTERS.map((chapter, idx) => {
                                  const chapterText = akashicEditorChapters[idx] || '';
                                  return (
                                    <div key={chapter.title} className="p-5 rounded-2xl bg-[#fdfbf7] border border-[#e5e0d8] space-y-2.5">
                                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                                        <div>
                                          <h4 className="font-serif italic text-lg font-bold text-[#4a3f35]">
                                            {chapter.title}
                                          </h4>
                                          <p className="text-xs text-[#5a5a40]">({chapter.subtitle})</p>
                                        </div>
                                        <span className="text-[10px] font-bold text-[#5a5a40]/70">
                                          {countAkashicWords(chapterText)} parole · {chapterText.length}/20000
                                        </span>
                                      </div>
                                      <textarea
                                        rows={6}
                                        maxLength={20000}
                                        value={chapterText}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setAkashicEditorChapters(prev => prev.map((item, i) => (i === idx ? val : item)));
                                        }}
                                        placeholder={`Scrivi qui ${chapter.title.toLowerCase()}...`}
                                        className="w-full p-4 bg-white border border-[#e5e0d8] rounded-xl text-sm text-[#4a3f35] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#c2b280] resize-y min-h-[150px]"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="bg-[#fdfbf7] p-4 rounded-2xl border border-[#e5e0d8] flex flex-col gap-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#4a3f35]">
                                    Richieste Registri Akashici
                                  </span>
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${akashicNewCount > 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-[#f8f5f0] text-[#4a3f35]/60 border border-[#e5e0d8]'}`}>
                                    Nuove: {akashicNewCount}
                                  </span>
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${akashicDeletionCount > 0 ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-[#f8f5f0] text-[#4a3f35]/60 border border-[#e5e0d8]'}`}>
                                    Cancellazioni: {akashicDeletionCount}
                                  </span>
                                </div>
                                <div className="relative w-full sm:w-80">
                                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4a3f35]/40 pointer-events-none" />
                                  <input
                                    type="text"
                                    value={akashicAdminSearch}
                                    onChange={(e) => setAkashicAdminSearch(e.target.value)}
                                    placeholder="Cerca per nome o email utente..."
                                    className="w-full pl-9 pr-8 py-2 rounded-full bg-white border border-[#e5e0d8] text-xs text-[#4a3f35] focus:outline-none focus:ring-2 focus:ring-[#c2b280]"
                                  />
                                  {akashicAdminSearch && (
                                    <button
                                      type="button"
                                      onClick={() => setAkashicAdminSearch('')}
                                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#4a3f35]/40 hover:text-[#4a3f35]"
                                      title="Pulisci ricerca"
                                    >
                                      <X size={13} />
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                {[
                                  { id: 'tutte' as const, label: 'Tutte', count: akashicRequestsList.length },
                                  { id: 'nuova' as const, label: 'Nuove', count: akashicNewCount },
                                  { id: 'in_lavorazione' as const, label: 'In lavorazione', count: akashicInProgressCount },
                                  { id: 'completata' as const, label: 'Completate', count: akashicCompletedCount },
                                  { id: 'archivio' as const, label: 'Archivio clienti', count: akashicClientArchive.length }
                                ].map((tab) => (
                                  <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => {
                                      setAkashicAdminFilter(tab.id);
                                      if (tab.id === 'archivio') {
                                        setSelectedAkashicClientEmail(null);
                                      }
                                    }}
                                    className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
                                      akashicAdminFilter === tab.id
                                        ? 'bg-[#c2b280] text-white border-[#c2b280] shadow-sm'
                                        : 'bg-white text-[#4a3f35] border-[#e5e0d8] hover:border-[#c2b280]'
                                    }`}
                                  >
                                    {tab.label} ({tab.count})
                                  </button>
                                ))}
                              </div>

                              {selectedAkashicClientEmail && akashicAdminFilter !== 'archivio' && (
                                <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#c2b280]/50 text-xs">
                                  <span>
                                    Filtro cliente attivo: <strong>{selectedAkashicClientEmail}</strong>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedAkashicClientEmail(null)}
                                    className="text-[11px] font-bold text-[#c2b280] hover:underline"
                                  >
                                    Mostra tutte
                                  </button>
                                </div>
                              )}
                            </div>

                            {akashicAdminFilter === 'archivio' ? (
                              <div className="space-y-3">
                                {filteredAkashicArchive.map((client) => (
                                  <button
                                    key={client.email || client.displayEmail}
                                    type="button"
                                    onClick={() => {
                                      setSelectedAkashicClientEmail(client.email);
                                      setAkashicAdminFilter('tutte');
                                    }}
                                    className="w-full text-left p-5 rounded-2xl border border-[#e5e0d8] bg-white hover:border-[#c2b280] hover:bg-[#fdfbf7] transition-all shadow-sm flex flex-wrap items-center justify-between gap-3"
                                  >
                                    <div>
                                      <p className="font-bold text-[#4a3f35]">{client.name}</p>
                                      <p className="text-[11px] opacity-60">{client.displayEmail}</p>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs">
                                      <span className="px-3 py-1 rounded-full bg-[#f8f5f0] border border-[#e5e0d8] font-bold text-[#5a5a40]">
                                        {client.count} {client.count === 1 ? 'richiesta' : 'richieste'}
                                      </span>
                                      <span className="text-[11px] opacity-60">Ultima: {client.lastDateLabel}</span>
                                    </div>
                                  </button>
                                ))}
                                {filteredAkashicArchive.length === 0 && (
                                  <p className="text-xs opacity-50 italic text-center py-8">Nessun cliente trovato nell&apos;archivio.</p>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {filteredAkashicRequests.map((req) => {
                                  const badge = statusLabelMap[req.status] || statusLabelMap.nuova;
                                  const dateLabel = req.createdAt?.toDate
                                    ? req.createdAt.toDate().toLocaleDateString('it-IT')
                                    : 'Recente';
                                  return (
                                    <div
                                      key={req.id}
                                      className={`w-full p-5 rounded-2xl border shadow-sm transition-all flex items-center justify-between gap-3 ${
                                        req.status === 'nuova'
                                          ? 'bg-[#fdfbf7] border-[#c2b280] hover:bg-white'
                                          : 'bg-white border-[#e5e0d8] hover:border-[#c2b280]'
                                      }`}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => openAkashicRequestDetail(req)}
                                        className="flex-1 text-left flex flex-wrap items-center justify-between gap-3 min-w-0"
                                      >
                                        <div className="flex items-center gap-3 flex-wrap min-w-0">
                                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${badge.cls}`}>
                                            {badge.label}
                                          </span>
                                          {req.deletionRequested === true && (
                                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-700 border border-red-300">
                                              Cancellazione richiesta
                                            </span>
                                          )}
                                          <div className="min-w-0">
                                            <p className="font-bold text-[#4a3f35] truncate">{req.name || 'Cliente senza nome'}</p>
                                            <p className="text-[11px] opacity-60 truncate">{req.area} · {req.email}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <span className="text-[10px] opacity-60">{dateLabel}</span>
                                          <ChevronDown size={16} className="text-[#4a3f35]/50 -rotate-90" />
                                        </div>
                                      </button>
                                      <button
                                        type="button"
                                        disabled={isDeletingAkashicRequestId === req.id}
                                        onClick={() => deleteAkashicRequest(req)}
                                        title="Elimina richiesta"
                                        aria-label="Elimina richiesta"
                                        className="p-2.5 rounded-full text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all shrink-0 disabled:opacity-50"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  );
                                })}
                                {filteredAkashicRequests.length === 0 && (
                                  <p className="text-xs opacity-50 italic text-center py-8">Nessuna richiesta trovata.</p>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ) : null}
                  </>
                );
              })()}

              {adminSection === 'portali' && (() => {
                const deduplicatedReadings = getDeduplicatedReadings(adminData.readings);
                const normalizedSearch = adminSearchQuery.trim().toLowerCase();
                const isReadingUnread = (read: any) => !adminReadMap[read.id];
                const matchesAdminSearch = (read: any) => {
                  if (!normalizedSearch) return true;
                  const name = (read.userName || '').toString().toLowerCase();
                  const email = (read.userEmail || '').toString().toLowerCase();
                  return name.includes(normalizedSearch) || email.includes(normalizedSearch);
                };
                const sortInboxReadings = (list: any[]) =>
                  [...list].sort((a, b) => {
                    const aUnread = isReadingUnread(a) ? 1 : 0;
                    const bUnread = isReadingUnread(b) ? 1 : 0;
                    if (aUnread !== bUnread) return bUnread - aUnread;
                    return getReadingTimestampMillis(b) - getReadingTimestampMillis(a);
                  });

                const allConstellations = deduplicatedReadings.filter(read => read.type === 'constellation');
                const allFlowers = deduplicatedReadings.filter(read => read.type === 'flower');
                const allRunes = deduplicatedReadings.filter(read => read.type === 'rune');

                const unreadConstellationsCount = allConstellations.filter(isReadingUnread).length;
                const unreadFlowersCount = allFlowers.filter(isReadingUnread).length;
                const unreadRunesCount = allRunes.filter(isReadingUnread).length;
                const totalUnreadCount = unreadConstellationsCount + unreadFlowersCount + unreadRunesCount;

                const constellationReadings = sortInboxReadings(allConstellations.filter(matchesAdminSearch));
                const flowerReadings = sortInboxReadings(allFlowers.filter(matchesAdminSearch));
                const runeReadings = sortInboxReadings(allRunes.filter(matchesAdminSearch));

                return (
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
                    <p className="text-3xl font-serif italic text-[#c2b280]">{deduplicatedReadings.length}</p>
                  </div>
                  <div className="bg-[#f8f5f0] p-6 rounded-3xl border border-[#e5e0d8] text-center col-span-2 flex flex-col justify-center items-center gap-1">
                    <Info className="mx-auto mb-1 text-[#c2b280]" size={20} />
                    <p className="text-[10px] uppercase tracking-widest opacity-60 font-bold">Casella in arrivo</p>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${totalUnreadCount > 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-white text-[#4a3f35]/60 border border-[#e5e0d8]'}`}>
                      Nuove: {totalUnreadCount}
                    </span>
                    <p className="text-xs italic opacity-50 px-4">Utilizza la dashboard per gestire le prenotazioni e il contatto diretto via WhatsApp.</p>
                  </div>
                </div>

                {/* Search bar above received lists */}
                <div className="bg-[#fdfbf7] p-4 rounded-2xl border border-[#e5e0d8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#4a3f35]">Casella in arrivo</span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${totalUnreadCount > 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-[#f8f5f0] text-[#4a3f35]/60 border border-[#e5e0d8]'}`}>
                      Nuove: {totalUnreadCount}
                    </span>
                  </div>
                  <div className="relative w-full sm:w-80">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4a3f35]/40 pointer-events-none" />
                    <input
                      type="text"
                      value={adminSearchQuery}
                      onChange={(e) => setAdminSearchQuery(e.target.value)}
                      placeholder="Cerca per nome o email utente..."
                      className="w-full pl-9 pr-8 py-2 rounded-full bg-white border border-[#e5e0d8] text-xs text-[#4a3f35] focus:outline-none focus:ring-2 focus:ring-[#c2b280]"
                    />
                    {adminSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setAdminSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#4a3f35]/40 hover:text-[#4a3f35]"
                        title="Pulisci ricerca"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Constellations received */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-[#fdfbf7] p-4 rounded-2xl border border-[#e5e0d8]">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold uppercase tracking-[0.2em] text-[#c2b280] text-xs flex items-center gap-2">
                        <Share2 size={14} /> Costellazioni ricevute
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${unreadConstellationsCount > 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-[#f8f5f0] text-[#4a3f35]/60 border border-[#e5e0d8]'}`}>
                        Nuove: {unreadConstellationsCount}
                      </span>
                    </div>
                    <span className="text-[10px] opacity-50">{constellationReadings.length} {constellationReadings.length === 1 ? 'totale' : 'totali'}</span>
                  </div>
                  <div className="space-y-3">
                    {constellationReadings.map(read => {
                      const unread = isReadingUnread(read);
                      const isExpanded = Boolean(expandedAdminReadingIds[read.id]);
                      return (
                      <div key={`standalone-${read.id}`} className={`p-5 rounded-2xl border shadow-sm transition-colors ${unread ? 'bg-[#fdfbf7] border-[#c2b280]' : 'bg-white border-[#e5e0d8]'}`}>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => toggleAdminReadingExpanded(read.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              toggleAdminReadingExpanded(read.id);
                            }
                          }}
                          className="flex flex-wrap justify-between items-center gap-2 cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${unread ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-[#f8f5f0] text-[#4a3f35]/60 border border-[#e5e0d8]'}`}>
                              {unread ? 'Nuova' : 'Letta'}
                            </span>
                            <div>
                              <p className="font-bold text-[#4a3f35]">{read.userName || 'Utente senza nome'}</p>
                              <p className="text-[10px] opacity-50">{read.userEmail || 'Email non disponibile'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {!unread && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void markReadingAsUnread(read.id);
                                }}
                                className="px-3 py-1 rounded-full border border-[#e5e0d8] bg-white hover:bg-[#f8f5f0] text-[10px] font-bold text-[#4a3f35] transition-colors"
                              >
                                Segna come da vedere
                              </button>
                            )}
                            <span className="text-[9px] opacity-50">{read.timestamp?.toDate ? read.timestamp.toDate().toLocaleDateString('it-IT') : 'Recente'}</span>
                            <ChevronDown size={16} className={`text-[#4a3f35]/60 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            <button type="button" onClick={(e) => { e.stopPropagation(); deleteReading(read); }} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full" title="Elimina lettura">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-[#e5e0d8]/70">
                        <p className="text-[10px] italic text-[#8a7954] bg-[#fdfbf7] border border-[#e5e0d8] rounded-xl px-3 py-1.5 mb-3">
                          Lettura dal punto di vista di Io: destra e sinistra sono quelle del pupazzo, opposte a quelle dello schermo.
                        </p>
                        {read.screenshotUrl ? (
                          <button
                            type="button"
                            onClick={() => window.open(read.screenshotUrl, '_blank')}
                            className="block w-full mb-4 rounded-2xl overflow-hidden border border-[#e5e0d8] bg-[#f8f5f0]"
                            title="Apri immagine della costellazione"
                          >
                            <img src={read.screenshotUrl} alt="Costellazione del cliente" className="w-full max-h-[360px] object-contain" referrerPolicy="no-referrer" />
                          </button>
                        ) : read.userData?.layoutVersion === 2 && Array.isArray(read.characters) && read.characters.length > 0 && (
                          <AdminConstellationPreview
                            readId={read.id}
                            characters={read.characters as CharacterType[]}
                            layoutType={read.userData?.layoutType}
                            renderFigure={(shape, color, densityScale, badgeNumber, previewWidth, scaleOverride) =>
                              renderShape(shape, color, 'normal', densityScale, badgeNumber, previewWidth, scaleOverride)
                            }
                          />
                        )}
                        {Array.isArray(read.characters) && read.characters.length > 12 && (
                          <div className="mb-4 p-3 rounded-2xl bg-[#fdfbf7] border border-[#e5e0d8]">
                            <p className="text-[9px] uppercase tracking-[0.2em] font-black text-[#c2b280] mb-2">
                              Legenda ({read.characters.length} figure)
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-[11px] text-[#4a3f35]">
                              {read.characters.map((character: CharacterType, index: number) => (
                                <div key={`${read.id}-legend-${index}`} className="truncate">
                                  <span className="font-bold text-[#5a5a40] mr-1">{index + 1}</span>
                                  <span>{character.label || 'Senza nome'}</span>
                                  {character.feeling && (
                                    <span className="ml-1">{character.feeling === 'piacevole' ? '❤️' : '💔'}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {read.userData?.layoutVersion !== 2 && (
                            <div className="sm:col-span-2 lg:col-span-3 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                              layout precedente: posizione non attendibile
                            </div>
                          )}
                          {(read.characters || []).map((character: CharacterType, index: number) => {
                            const position = describeCharacterPosition(
                              read.characters as PositionCharacter[],
                              character.id,
                              read.userData?.layoutVersion,
                              read.userData?.layoutType
                            );
                            const isNumbered = Array.isArray(read.characters) && read.characters.length > 12;
                            return (
                              <div key={`${read.id}-standalone-${index}`} className="p-3 rounded-xl bg-[#fdfbf7] border border-[#e5e0d8] text-[10px]">
                                <p className="font-bold text-[#4a3f35]">
                                  {isNumbered ? `${index + 1}. ` : ''}{character.label || 'Senza nome'}
                                  {character.feeling && <span className="ml-1">{character.feeling === 'piacevole' ? '❤️' : '💔'}</span>}
                                </p>
                                <p className="opacity-70">{position ? position.summary : 'layout precedente: posizione non attendibile'}</p>
                                <p className="opacity-50">
                                  Coordinate tecniche: {Math.round(character.x)}, {Math.round(character.y)}
                                  {!position?.isLegacy && typeof position?.normalizedX === 'number' ? ` · xNorm ${position.normalizedX.toFixed(2)}` : ''}
                                </p>
                                {character.feeling && <p className="opacity-60">Emozione: {character.feeling}</p>}
                                {character.memory && <p className="opacity-60 italic">Memoria: {character.memory}</p>}
                              </div>
                            );
                          })}
                        </div>
                        </div>
                        )}
                      </div>
                      );
                    })}
                    {constellationReadings.length === 0 && (
                      <p className="text-[10px] opacity-40 italic text-center py-4">Nessuna costellazione ricevuta.</p>
                    )}
                  </div>
                </div>

                {/* Flowers received */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-[#fdfbf7] p-4 rounded-2xl border border-[#e5e0d8]">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold uppercase tracking-[0.2em] text-[#c2b280] text-xs flex items-center gap-2">
                        <Heart size={14} /> Fiori ricevuti
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${unreadFlowersCount > 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-[#f8f5f0] text-[#4a3f35]/60 border border-[#e5e0d8]'}`}>
                        Nuove: {unreadFlowersCount}
                      </span>
                    </div>
                    <span className="text-[10px] opacity-50">{flowerReadings.length} {flowerReadings.length === 1 ? 'totale' : 'totali'}</span>
                  </div>
                  <div className="space-y-3">
                    {flowerReadings.map(read => {
                      const unread = isReadingUnread(read);
                      const isExpanded = Boolean(expandedAdminReadingIds[read.id]);
                      const flowerList: string[] = Array.isArray(read.flowerNames) && read.flowerNames.length > 0
                        ? read.flowerNames
                        : Array.isArray(read.flowerIds)
                          ? read.flowerIds.map((id: number) => BACH_FLOWERS.find(f => f.id === id)?.name).filter(Boolean)
                          : [];
                      return (
                        <div key={`flower-${read.id}`} className={`p-5 rounded-2xl border shadow-sm transition-colors ${unread ? 'bg-[#fdfbf7] border-[#c2b280]' : 'bg-white border-[#e5e0d8]'}`}>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleAdminReadingExpanded(read.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                toggleAdminReadingExpanded(read.id);
                              }
                            }}
                            className="flex flex-wrap justify-between items-center gap-2 cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${unread ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-[#f8f5f0] text-[#4a3f35]/60 border border-[#e5e0d8]'}`}>
                                {unread ? 'Nuova' : 'Letta'}
                              </span>
                              <div>
                                <p className="font-bold text-[#4a3f35]">{read.userName || 'Utente senza nome'}</p>
                                <p className="text-[10px] opacity-50">{read.userEmail || 'Email non disponibile'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {!unread && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void markReadingAsUnread(read.id);
                                  }}
                                  className="px-3 py-1 rounded-full border border-[#e5e0d8] bg-white hover:bg-[#f8f5f0] text-[10px] font-bold text-[#4a3f35] transition-colors"
                                >
                                  Segna come da vedere
                                </button>
                              )}
                              <span className="text-[9px] opacity-50">{read.timestamp?.toDate ? read.timestamp.toDate().toLocaleDateString('it-IT') : 'Recente'}</span>
                              <ChevronDown size={16} className={`text-[#4a3f35]/60 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              <button type="button" onClick={(e) => { e.stopPropagation(); deleteReading(read); }} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full" title="Elimina lettura">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-[#e5e0d8]/70 space-y-2 text-xs text-[#4a3f35]">
                              <p className="text-[10px] uppercase tracking-widest font-bold text-[#c2b280]">
                                Fiori selezionati ({flowerList.length})
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {flowerList.map((name, idx) => (
                                  <span key={`${read.id}-flower-${idx}`} className="px-3 py-1 rounded-full bg-[#fdfbf7] border border-[#e5e0d8] text-xs font-medium">
                                    {name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {flowerReadings.length === 0 && (
                      <p className="text-[10px] opacity-40 italic text-center py-4">Nessun fiore ricevuto.</p>
                    )}
                  </div>
                </div>

                {/* Runes received */}
                <div className="space-y-4 mb-10">
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-[#fdfbf7] p-4 rounded-2xl border border-[#e5e0d8]">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold uppercase tracking-[0.2em] text-[#c2b280] text-xs flex items-center gap-2">
                        <Sparkles size={14} /> Rune ricevute
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${unreadRunesCount > 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-[#f8f5f0] text-[#4a3f35]/60 border border-[#e5e0d8]'}`}>
                        Nuove: {unreadRunesCount}
                      </span>
                    </div>
                    <span className="text-[10px] opacity-50">{runeReadings.length} {runeReadings.length === 1 ? 'totale' : 'totali'}</span>
                  </div>
                  <div className="space-y-3">
                    {runeReadings.map(read => {
                      const unread = isReadingUnread(read);
                      const isExpanded = Boolean(expandedAdminReadingIds[read.id]);
                      const runeItems = Array.isArray(read.runeIds) && read.runeIds.length > 0
                        ? read.runeIds.map((id: number, idx: number) => {
                            const found = RUNES.find(r => r.id === id);
                            const name = (Array.isArray(read.runeNames) && read.runeNames[idx]) || found?.name || `Runa ${id}`;
                            return { name, meaning: found?.meaning || '' };
                          })
                        : Array.isArray(read.runeNames)
                          ? read.runeNames.map((name: string) => {
                              const found = RUNES.find(r => r.name === name);
                              return { name, meaning: found?.meaning || '' };
                            })
                          : [];
                      return (
                        <div key={`rune-${read.id}`} className={`p-5 rounded-2xl border shadow-sm transition-colors ${unread ? 'bg-[#fdfbf7] border-[#c2b280]' : 'bg-white border-[#e5e0d8]'}`}>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleAdminReadingExpanded(read.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                toggleAdminReadingExpanded(read.id);
                              }
                            }}
                            className="flex flex-wrap justify-between items-center gap-2 cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${unread ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-[#f8f5f0] text-[#4a3f35]/60 border border-[#e5e0d8]'}`}>
                                {unread ? 'Nuova' : 'Letta'}
                              </span>
                              <div>
                                <p className="font-bold text-[#4a3f35]">{read.userName || 'Utente senza nome'}</p>
                                <p className="text-[10px] opacity-50">{read.userEmail || 'Email non disponibile'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {!unread && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void markReadingAsUnread(read.id);
                                  }}
                                  className="px-3 py-1 rounded-full border border-[#e5e0d8] bg-white hover:bg-[#f8f5f0] text-[10px] font-bold text-[#4a3f35] transition-colors"
                                >
                                  Segna come da vedere
                                </button>
                              )}
                              <span className="text-[9px] opacity-50">{read.timestamp?.toDate ? read.timestamp.toDate().toLocaleDateString('it-IT') : 'Recente'}</span>
                              <ChevronDown size={16} className={`text-[#4a3f35]/60 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              <button type="button" onClick={(e) => { e.stopPropagation(); deleteReading(read); }} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full" title="Elimina lettura">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-[#e5e0d8]/70 space-y-3 text-xs text-[#4a3f35]">
                              {read.question && (
                                <p className="italic bg-[#fdfbf7] border border-[#e5e0d8] rounded-xl px-3 py-2">
                                  <strong>Domanda:</strong> &ldquo;{read.question}&rdquo;
                                </p>
                              )}
                              <div className="flex flex-wrap gap-2">
                                {runeItems.map((item, idx) => (
                                  <div key={`${read.id}-rune-${idx}`} className="px-3 py-1.5 rounded-xl bg-[#fdfbf7] border border-[#e5e0d8]">
                                    <span className="font-bold text-[#4a3f35]">{item.name}</span>
                                    {item.meaning && <span className="opacity-65 ml-1.5">· {item.meaning}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {runeReadings.length === 0 && (
                      <p className="text-[10px] opacity-40 italic text-center py-4">Nessuna lettura rune ricevuta.</p>
                    )}
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
                      const userReadings = deduplicatedReadings.filter(r => r.userEmail === can.email || r.userId === can.userId);
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
                                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2 scrollbar-style">
                                  {userReadings.map(read => (
                                    <div key={read.id} className="p-4 bg-[#f8f5f0] rounded-2xl border border-[#e5e0d8] group/read">
                                      <div className="flex justify-between items-center mb-2">
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                          read.type === 'rune' ? 'bg-purple-100 text-purple-600' : 
                                          read.type === 'flower' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                          {read.type}
                                        </span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-[8px] opacity-40 font-bold">
                                            {read.timestamp?.toDate ? read.timestamp.toDate().toLocaleDateString('it-IT') : 'Recent'}
                                          </span>
                                          <button type="button" onClick={() => deleteReading(read)} className="p-1 text-red-400 hover:text-red-600" title="Elimina lettura">
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      </div>
                                      {read.question && <p className="text-[10px] italic opacity-80 mb-2">"{read.question}"</p>}
                                      {read.type === 'constellation' && Array.isArray(read.characters) ? (
                                        <div className="space-y-2 text-[10px] font-medium opacity-70 leading-relaxed">
                                          <p className="text-[10px] italic text-[#8a7954] bg-white border border-[#e5e0d8] rounded-lg px-2.5 py-1">
                                            Lettura dal punto di vista di Io: destra e sinistra sono quelle del pupazzo, opposte a quelle dello schermo.
                                          </p>
                                          {read.userData && (
                                            <p><strong>Dati sessione:</strong> {read.userData.nome || read.userName || 'N/D'}{read.userData.eta ? `, ${read.userData.eta} anni` : ''}{read.userData.sesso ? `, ${read.userData.sesso}` : ''}{read.userData.domandaRune ? ` — ${read.userData.domandaRune}` : ''}</p>
                                          )}
                                          {read.screenshotUrl && (
                                            <button
                                              type="button"
                                              onClick={() => window.open(read.screenshotUrl, '_blank')}
                                              className="block w-full rounded-xl overflow-hidden border border-[#e5e0d8] bg-white"
                                              title="Apri immagine della costellazione"
                                            >
                                              <img src={read.screenshotUrl} alt="Costellazione del cliente" className="w-full max-h-[220px] object-contain" referrerPolicy="no-referrer" />
                                            </button>
                                          )}
                                          <p><strong>Elementi posizionati:</strong> {read.characters.length}</p>
                                          {read.characters.length > 12 && (
                                            <div className="rounded-xl bg-white/80 border border-[#e5e0d8] p-2">
                                              <p className="text-[9px] uppercase tracking-widest font-black text-[#c2b280] mb-1">Legenda</p>
                                              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-[#4a3f35]">
                                                {read.characters.map((character: CharacterType, index: number) => (
                                                  <span key={`${read.id}-hist-legend-${index}`} className="truncate">
                                                    <strong className="text-[#5a5a40] mr-1">{index + 1}</strong>
                                                    {character.label || 'Senza nome'}
                                                    {character.feeling ? (character.feeling === 'piacevole' ? ' ❤️' : ' 💔') : ''}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                          <div className="space-y-1">
                                            {read.userData?.layoutVersion !== 2 && (
                                              <p className="px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                                                layout precedente: posizione non attendibile
                                              </p>
                                            )}
                                            {read.characters.map((character: CharacterType, index: number) => (
                                              <div key={`${read.id}-character-${index}`} className="rounded-xl bg-white/70 border border-[#e5e0d8] p-2">
                                                <span className="font-bold text-[#4a3f35]">
                                                  {read.characters.length > 12 ? `${index + 1}. ` : ''}{character.label || 'Senza nome'}
                                                </span>
                                                {character.feeling && <span> · Emozione: {character.feeling} {character.feeling === 'piacevole' ? '❤️' : '💔'}</span>}
                                                {character.memory && <span> · Memoria: {character.memory}</span>}
                                                {(() => {
                                                  const position = describeCharacterPosition(
                                                    read.characters as PositionCharacter[],
                                                    character.id,
                                                    read.userData?.layoutVersion,
                                                    read.userData?.layoutType
                                                  );
                                                  return position ? (
                                                    <>
                                                      <span className="block text-[#5a5a40]">{position.summary}</span>
                                                      <span className="block opacity-50">
                                                        Coordinate tecniche: {Math.round(character.x)}, {Math.round(character.y)}
                                                        {!position.isLegacy && typeof position.normalizedX === 'number' ? ` · xNorm ${position.normalizedX.toFixed(2)}` : ''}
                                                      </span>
                                                    </>
                                                  ) : null;
                                                })()}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-[10px] font-medium opacity-70 leading-relaxed">
                                          {Array.isArray(read.data) ? read.data.join(', ') :
                                           read.runeIds ? `Rune: ${(Array.isArray(read.runeNames) && read.runeNames.length > 0 ? read.runeNames : read.runeIds.map((id: number) => RUNES.find(r => r.id === id)?.name).filter(Boolean)).join(', ')}` :
                                           read.flowerIds || read.flowerNames ? `Fiori: ${(Array.isArray(read.flowerNames) && read.flowerNames.length > 0 ? read.flowerNames : read.flowerIds.map((id: number) => BACH_FLOWERS.find(f => f.id === id)?.name).filter(Boolean)).join(', ')}` : 'Analisi Complessa'}
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
                );
              })()}
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
                        showAlert('Accesso richiesto', "Per favore, effettua l'accesso per candidarti.", login);
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
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity flex items-center gap-2">
                  <img src="/fiori/00_Personaggi.webp" alt="" className="w-16 h-16 object-contain" />
                  <img src={BUILDING_HEADER_IMAGE_URL} alt="" className="w-16 h-16 object-contain" />
                </div>
                <div className="flex items-center justify-center gap-3 z-10">
                  <div className="w-16 h-16 bg-[#f8f5f0] rounded-2xl flex items-center justify-center overflow-hidden group-hover:bg-[#c2b280] transition-colors p-2">
                    <motion.img
                      src="/fiori/00_Personaggi.webp"
                      alt="Costellazioni Gradini"
                      className="w-full h-full object-contain"
                      animate={{ opacity: [1, 0.2, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </div>
                  <div className="w-16 h-16 bg-[#f8f5f0] rounded-2xl flex items-center justify-center overflow-hidden group-hover:bg-[#c2b280] transition-colors p-2">
                    <motion.img
                      src={BUILDING_HEADER_IMAGE_URL}
                      alt="Costellazioni Palazzo"
                      className="w-full h-full object-contain"
                      animate={{ opacity: [1, 0.2, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </div>
                </div>
                <div className="z-10">
                  <h3 className="font-serif italic text-2xl mb-2">Costellazioni</h3>
                  <p className="text-xs opacity-60 uppercase tracking-widest font-bold">Simulazione Interattiva per Diagnosi Olistica</p>
                  <p className="text-[11px] text-[#5a5a40] font-semibold mt-2">Posizionamento su &quot;Gradini&quot; o &quot;Palazzo&quot;</p>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentPage('fiori')}
                className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-[#e5e0d8] flex flex-col items-center text-center gap-4 hover:shadow-xl transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <img src="/fiori/0_Rescue_Remedy.webp" alt="" className="w-24 h-24 object-contain" />
                </div>
                <div className="w-16 h-16 bg-[#f8f5f0] rounded-2xl flex items-center justify-center overflow-hidden group-hover:bg-[#c2b280] transition-colors z-10 p-2">
                  <img src="/fiori/0_Rescue_Remedy.webp" alt="Fiori di Bach" className="w-full h-full object-contain" />
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

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowAkashicForm(false);
                  setShowAkashicPrivacy(false);
                  setAkashicSubmitted(false);
                  setCurrentPage('registri');
                }}
                className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-[#e5e0d8] flex flex-col items-center text-center gap-4 hover:shadow-xl transition-all group relative overflow-hidden sm:col-span-2"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <img src={AKASHIC_CARD_IMAGE_URL} alt="" className="w-24 h-24 object-cover rounded-2xl" />
                </div>
                <div className="w-16 h-16 bg-[#f8f5f0] rounded-2xl flex items-center justify-center overflow-hidden group-hover:bg-[#c2b280] transition-colors z-10 p-1">
                  <img src={AKASHIC_CARD_IMAGE_URL} alt="Il Libro della tua Anima" className="w-full h-full object-cover rounded-xl" />
                </div>
                <div className="z-10">
                  <h3 className="font-serif italic text-2xl mb-2">Il Libro della tua Anima</h3>
                  <p className="text-xs opacity-60 uppercase tracking-widest font-bold">Archivio dell&apos;Anima</p>
                </div>
              </motion.button>
            </div>

            {/* About Section Integrated */}
            <div className="w-full max-w-4xl bg-white/50 backdrop-blur-sm rounded-[3rem] p-8 sm:p-12 border border-[#e5e0d8] shadow-sm mb-12">
              <h2 className="font-serif italic text-3xl text-[#4a3f35] mb-12 text-center">Di cosa si occupa Graziamaria?</h2>
              
              <div className="flex flex-col md:flex-row gap-12 items-center md:items-start">
                <div className="w-full md:w-2/5 shrink-0">
                  <img 
                    src="/fiori/00_grazia.webp" 
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
                    src={constellationLayoutType === 'building' ? BUILDING_HEADER_IMAGE_URL : '/fiori/00_Personaggi.webp'} 
                    alt={constellationLayoutType === 'building' ? 'Palazzo Costellazione' : 'Personaggi'} 
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
                className="w-full max-w-3xl p-3 md:p-4 bg-[#fdfbf7] rounded-2xl border border-[#e5e0d8] shadow-sm text-center"
                style={{ color: '#4a3f35', fontSize: '10px', lineHeight: '1.5', fontWeight: '500' }}
              >
                <button
                  type="button"
                  onClick={() => setShowCostellazioniHelp(prev => !prev)}
                  aria-expanded={showCostellazioniHelp}
                  className="md:hidden w-full flex items-center justify-between font-bold text-[#5a5a40] tracking-widest uppercase"
                  style={{ fontSize: '9px' }}
                >
                  <span>COME FUNZIONA?</span>
                  <span className="flex items-center gap-1 text-[9px] text-[#8a7954]">
                    {showCostellazioniHelp ? 'Chiudi' : 'Leggi'}
                    <ChevronDown size={13} className={`transition-transform ${showCostellazioniHelp ? 'rotate-180' : ''}`} />
                  </span>
                </button>
                <div className="hidden md:block font-bold text-[#5a5a40] mb-1 tracking-widest uppercase" style={{ fontSize: '9px' }}>COME FUNZIONA?</div>
                <div className={`${showCostellazioniHelp ? 'block mt-2' : 'hidden'} md:block md:mt-0 opacity-90 text-justify space-y-1.5`} style={{ color: '#100b06' }}>
                  <p>
                    Scegli la scena: Gradini oppure Palazzo (10 piani sono troppi: il Palazzo ha 5 piani con 5 finestre ciascuno, una finestra per figura). Avrai a disposizione 30 personaggi di varie misure, colori e forme. Con il bottone “Scegli” li vedi tutti e scegli quelli che ti servono, uno per uno; con “Casuale” il sistema sceglie il personaggio per te. Ogni personaggio si usa una volta sola.
                  </p>
                  <p>
                    Nomina il personaggio, poi posizionalo: sui Gradini trascinalo dove vuoi; nel Palazzo toccalo e poi tocca una finestra libera, oppure trascinalo sulla finestra (una sola figura per finestra). Puoi spostare o modificare le figure già posizionate. Quando hai finito fai uno screenshot, poi premi “Termina posizionamento” e segui le istruzioni. Alla fine puoi salvare il tutto nel report, scaricarlo e inviarlo a Graziamaria con “Invia a Graziamaria”.
                  </p>
                  <p>
                    Quando descrivi dove si trova una figura (nelle memorie o nei messaggi), usa destra e sinistra dal punto di vista del pupazzo Io, non dello schermo. Nel Palazzo indica il piano contando dal basso.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full max-w-4xl justify-center flex-wrap mt-2">
                {/* Group: Creation */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowPicker(true)}
                    disabled={Boolean(pendingCharacter) || showLabelInput || showPicker || workflowStep === 1 || characters.length >= maxFiguresForCurrentLayout || availablePickerShapes.length === 0}
                    className="flex items-center justify-center gap-2 bg-[#c2b280] text-white transition-all shadow-md hover:bg-[#b1a170] disabled:opacity-30 disabled:cursor-not-allowed px-6 h-10 rounded-full text-xs font-bold uppercase tracking-wider"
                    translate="no"
                  >
                    <ChevronDown size={14} /> <span>Scegli</span>
                  </button>

                  <button 
                    onClick={handleDraw}
                    disabled={Boolean(pendingCharacter) || showLabelInput || showPicker || workflowStep === 1 || characters.length >= maxFiguresForCurrentLayout || availablePickerShapes.length === 0}
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
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-2 w-full sm:w-auto">
                  {workflowStep === 1 && (
                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-2 w-full sm:w-auto">
                      <button 
                        onClick={generatePDF}
                        className="flex items-center justify-center gap-2 bg-blue-600 text-white transition-all shadow-lg hover:bg-blue-700 w-full sm:w-auto px-4 sm:px-6 h-10 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider"
                        translate="no"
                      >
                        <FileText size={14} />
                        <span>Report</span>
                      </button>
                      <button 
                        onClick={() => promptPendingBeforeAction(executeSaveAndSendConstellation)}
                        className="flex items-center justify-center gap-2 bg-[#c2b280] text-white transition-all shadow-lg hover:bg-[#b1a170] w-full sm:w-auto px-4 sm:px-6 h-10 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider"
                        translate="no"
                      >
                        <Check size={14} />
                        <span>Salva e invia immagine</span>
                      </button>
                    </div>
                  )}

                  <button 
                    onClick={() => {
                      showConfirm(
                        'Svuota campo',
                        'Sei sicuro di voler svuotare il campo?',
                        () => {
                          setCharacters([]);
                          setPendingCharacter(null);
                          setIsDraggingPending(false);
                          setWorkflowStep(0);
                          clearConstellationDraft(user?.uid);
                          clearConstellationDraft(null);
                        },
                        { danger: true }
                      );
                    }}
                    className="flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 transition-colors border border-red-100 w-full sm:w-auto px-4 h-10 rounded-full"
                    title="Svuota Campo"
                    translate="no"
                  >
                    <Trash2 size={16} />
                    <span className="font-bold text-[10px] uppercase tracking-tighter">Pulisci</span>
                  </button>
                </div>
              </div>
              {!pendingCharacter && availablePickerShapes.length === 0 && (
                <div className="text-[11px] font-medium text-[#8c7a6b] bg-[#f8f5f0] border border-[#e5e0d8] px-3 py-1 rounded-full">
                  Hai già usato tutti i personaggi
                </div>
              )}
            </header>

            {/* Main Game Area */}
            <main className="flex-1 relative p-3 pt-4 md:p-8 pb-20 md:pb-24 flex flex-col items-center justify-center gap-2 md:gap-4" ref={boardRef}>
              {/* Invia a Graziamaria Button */}
              <button 
                onClick={handleShare}
                disabled={isSharing}
                className="absolute top-3 left-3 md:top-6 md:left-6 z-40 flex items-center gap-2 px-4 sm:px-5 h-10 bg-[#c2b280] text-white rounded-full shadow-md hover:bg-[#b1a170] transition-all active:scale-95 disabled:opacity-50"
                title="Invia a Graziamaria"
              >
                <Send size={15} className={isSharing ? 'animate-pulse' : ''} />
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                  {isSharing ? 'Invio...' : 'Invia a Graziamaria'}
                </span>
              </button>

              {(() => {
                const isBuilding = constellationLayoutType === 'building';
                const useLegendMode = !isBuilding && characters.length > 12;
                const densityScale = getFigureDensityScale(characters.length);
                const pillLayout = !isBuilding && !useLegendMode ? computePillLayout(characters, stageWidth) : null;
                const buildingFigureScale = isBuilding ? getBuildingFigureScale(stageWidth) : 1;

                const placePendingInBuildingSlot = (slot: BuildingSlotType) => {
                  if (!pendingCharacter || characters.length >= MAX_BUILDING_FIGURES) return;
                  if (isBuildingSlotOccupied(characters, slot)) {
                    showBuildingNotice('Finestra occupata');
                    return;
                  }
                  const coords = getBuildingSlotRefCoords(slot);
                  const newChar: CharacterType = {
                    id: pendingCharacter.id,
                    shape: pendingCharacter.shape,
                    color: pendingCharacter.color,
                    label: pendingCharacter.label.trim() || 'Sconosciuto',
                    x: coords.x,
                    y: coords.y,
                    slot: { floor: slot.floor, col: slot.col },
                    snapSeq: 0
                  };
                  setCharacters(prev => [...prev, newChar]);
                  setPendingCharacter(null);
                  setHighlightedBuildingSlot(null);
                  setBuildingNotice(null);
                };

                return (
                  <div
                    ref={constellationWorkAreaRef}
                    className={`w-full ${isBuilding ? 'max-w-[520px]' : 'max-w-[800px]'} mt-11 md:mt-10 scroll-mt-2 flex flex-col items-center select-none`}
                  >
                    {/* Scelta scena sopra la tavola */}
                    <div
                      data-constellation-scene-switcher="true"
                      className="mb-3 md:mb-4 inline-flex items-center p-1 rounded-full bg-white/90 border border-[#e5e0d8] shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => handleChangeConstellationLayout('stairs')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                          !isBuilding
                            ? 'bg-[#c2b280] text-white shadow-sm'
                            : 'text-[#5a5a40] hover:bg-[#f8f5f0]'
                        }`}
                        translate="no"
                      >
                        Gradini
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChangeConstellationLayout('building')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                          isBuilding
                            ? 'bg-[#c2b280] text-white shadow-sm'
                            : 'text-[#5a5a40] hover:bg-[#f8f5f0]'
                        }`}
                        translate="no"
                      >
                        Palazzo
                      </button>
                    </div>

                    {/* Avviso breve interno per Palazzo */}
                    {isBuilding && buildingNotice && (
                      <div
                        data-building-notice="true"
                        className="mb-2 px-4 py-1.5 rounded-full bg-[#4a3f35] text-white text-xs font-bold shadow-md"
                      >
                        {buildingNotice}
                      </div>
                    )}

                    {/* Area neutra per il pupazzo appena generato (fuori dalla tavola, esclusa da screenshot/salvataggio/conteggio) */}
                    {pendingCharacter && (
                      <div
                        ref={neutralAreaRef}
                        data-constellation-neutral="true"
                        className={`w-full max-w-xl mb-2 md:mb-6 p-2 md:p-4 rounded-xl md:rounded-2xl border-2 border-dashed border-[#c2b280] bg-[#fdfbf7]/95 backdrop-blur-sm md:bg-[#fdfbf7] shadow-sm sticky top-2 md:static max-h-[30vh] md:max-h-none ${
                          isDraggingPending ? 'z-[70]' : 'z-40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5 md:mb-3">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider md:tracking-widest text-[#8a7954]">
                              Pupazzo da posizionare
                            </span>
                            <span className="text-[10px] md:text-[11px] text-[#4a3f35]/70">
                              {isBuilding ? 'Tocca o trascinalo su una finestra libera' : 'Trascinalo sul gradino scelto'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPendingCharacter(null);
                              setIsDraggingPending(false);
                              setHighlightedBuildingSlot(null);
                            }}
                            className="shrink-0 p-1 md:p-1.5 rounded-full text-[#4a3f35]/70 hover:text-red-600 hover:bg-red-50 transition-colors"
                            aria-label="Rimuovi pupazzo da posizionare"
                            title="Rimuovi pupazzo"
                          >
                            <X size={15} className="md:w-4 md:h-4" />
                          </button>
                        </div>

                        <div className="flex flex-row items-center gap-2.5 md:gap-5">
                          <div className="relative shrink-0 flex items-center justify-center w-14 h-16 md:w-auto md:h-auto md:min-w-[96px] md:min-h-[112px] p-1 md:px-4 md:py-3 rounded-xl md:rounded-2xl bg-white ring-2 md:ring-4 ring-[#c2b280]/45 shadow-[0_0_16px_rgba(194,178,128,0.45)] md:shadow-[0_0_24px_rgba(194,178,128,0.55)]">
                            <motion.div
                              key={`pending-${pendingCharacter.id}-${pendingCharacter.snapSeq}`}
                              drag
                              dragMomentum={false}
                              onDragStart={() => setIsDraggingPending(true)}
                              onDrag={() => {
                                if (!isBuilding) return;
                                const figEl = boardRef.current?.querySelector(`[data-pending-figure-id="${pendingCharacter.id}"]`) as HTMLElement | null;
                                const stageEl = stageRef.current;
                                if (!figEl || !stageEl) return;
                                const figRect = figEl.getBoundingClientRect();
                                const stageRect = stageEl.getBoundingClientRect();
                                if (stageRect.width <= 0 || stageRect.height <= 0) return;

                                const centerX = (figRect.left + figRect.right) / 2;
                                const centerY = (figRect.top + figRect.bottom) / 2;
                                const xPct = ((centerX - stageRect.left) / stageRect.width) * 100;
                                const yPct = ((centerY - stageRect.top) / stageRect.height) * 100;

                                if (xPct < -5 || xPct > 105 || yPct < -3 || yPct > 103) {
                                  setHighlightedBuildingSlot(prev => (prev ? null : prev));
                                  return;
                                }

                                const nearest = findNearestFreeBuildingSlot(xPct, yPct, characters);
                                setHighlightedBuildingSlot(prev => {
                                  if (!nearest && !prev) return prev;
                                  if (nearest && prev && nearest.floor === prev.floor && nearest.col === prev.col) return prev;
                                  return nearest;
                                });
                              }}
                              onDragEnd={() => {
                                setIsDraggingPending(false);
                                setHighlightedBuildingSlot(null);
                                const figEl = boardRef.current?.querySelector(`[data-pending-figure-id="${pendingCharacter.id}"]`) as HTMLElement | null;
                                const stageEl = stageRef.current;
                                if (!figEl || !stageEl) return;
                                const figRect = figEl.getBoundingClientRect();
                                const stageRect = stageEl.getBoundingClientRect();
                                if (stageRect.width <= 0 || stageRect.height <= 0) return;

                                const centerX = (figRect.left + figRect.right) / 2;
                                if (isBuilding) {
                                  const centerY = (figRect.top + figRect.bottom) / 2;
                                  const xPct = ((centerX - stageRect.left) / stageRect.width) * 100;
                                  const yPct = ((centerY - stageRect.top) / stageRect.height) * 100;
                                  if (xPct < -5 || xPct > 105 || yPct < -3 || yPct > 103) {
                                    setPendingCharacter(prev => prev ? { ...prev, snapSeq: prev.snapSeq + 1 } : null);
                                    return;
                                  }
                                  const freeSlot = findNearestFreeBuildingSlot(xPct, yPct, characters);
                                  if (!freeSlot) {
                                    showBuildingNotice('Finestra occupata');
                                    setPendingCharacter(prev => prev ? { ...prev, snapSeq: prev.snapSeq + 1 } : null);
                                    return;
                                  }
                                  placePendingInBuildingSlot(freeSlot);
                                  return;
                                }

                                const baseBottomY = figRect.bottom;
                                const xRatio = (centerX - stageRect.left) / stageRect.width;
                                const yRatio = (baseBottomY - stageRect.top) / stageRect.height;

                                const dropPlacement = detectPendingDropStair(xRatio, yRatio);
                                if (!dropPlacement) {
                                  setPendingCharacter(prev => prev ? { ...prev, snapSeq: prev.snapSeq + 1 } : null);
                                  return;
                                }

                                const nextDensityScale = getFigureDensityScale(characters.length + 1);
                                const sameStairOthers = characters
                                  .filter(other => getCharacterStairV2(other) === dropPlacement.stair)
                                  .map(other => getCharacterNormalizedX(other));
                                const finalNormalizedX = nudgeNormalizedXOnStair(
                                  dropPlacement.stair,
                                  dropPlacement.normalizedX,
                                  sameStairOthers,
                                  nextDensityScale
                                );
                                const finalX = Math.round(getStairXRatio(dropPlacement.stair, finalNormalizedX) * STAGE_REF_WIDTH);

                                const newChar: CharacterType = {
                                  id: pendingCharacter.id,
                                  shape: pendingCharacter.shape,
                                  color: pendingCharacter.color,
                                  label: pendingCharacter.label.trim() || 'Sconosciuto',
                                  x: finalX,
                                  y: dropPlacement.y,
                                  stair: dropPlacement.stair,
                                  normalizedX: finalNormalizedX,
                                  snapSeq: 0
                                };
                                setCharacters(prev => [...prev, newChar]);
                                setPendingCharacter(null);
                              }}
                              className="cursor-grab active:cursor-grabbing relative flex items-end justify-center"
                              style={{
                                opacity: isDraggingPending ? 0.6 : 1,
                                zIndex: isDraggingPending ? 80 : 50,
                                touchAction: 'none',
                                transition: 'opacity 120ms ease'
                              }}
                            >
                              <div data-pending-figure-id={pendingCharacter.id} className="flex justify-center">
                                {renderShape(
                                  pendingCharacter.shape,
                                  pendingCharacter.color,
                                  isMobileViewport ? 'small' : 'normal',
                                  getFigureDensityScale(characters.length + 1)
                                )}
                              </div>
                            </motion.div>
                          </div>

                          <div className="flex-1 min-w-0 space-y-1 md:space-y-2 text-left">
                            <label
                              htmlFor="pending-character-label"
                              className="block text-[9px] md:text-[10px] font-bold uppercase tracking-wider md:tracking-widest text-[#5a5a40]"
                            >
                              Nome / ruolo
                            </label>
                            <input
                              id="pending-character-label"
                              type="text"
                              value={pendingCharacter.label}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPendingCharacter(prev => prev ? { ...prev, label: val } : null);
                              }}
                              placeholder="Chi rappresenta per te? (es. Mamma)"
                              className="w-full px-3 py-1.5 md:px-3.5 md:py-2.5 bg-white border border-[#e5e0d8] rounded-xl text-xs md:text-sm text-[#4a3f35] focus:outline-none focus:ring-2 focus:ring-[#c2b280]"
                            />
                            <div className="hidden md:flex flex-wrap gap-1.5 pt-0.5">
                              {PREDEFINED_LABELS.slice(0, 8).map(label => (
                                <button
                                  key={`pending-preset-${label}`}
                                  type="button"
                                  onClick={() => setPendingCharacter(prev => prev ? { ...prev, label } : null)}
                                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                                    pendingCharacter.label === label
                                      ? 'bg-[#c2b280] text-white border-[#c2b280]'
                                      : 'bg-white hover:bg-[#f2ede4] text-[#4a3f35] border-[#e5e0d8]'
                                  }`}
                                  translate="no"
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="md:hidden mt-1.5 flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-0.5">
                          {PREDEFINED_LABELS.slice(0, 8).map(label => (
                            <button
                              key={`pending-preset-mobile-${label}`}
                              type="button"
                              onClick={() => setPendingCharacter(prev => prev ? { ...prev, label } : null)}
                              className={`shrink-0 whitespace-nowrap px-2.5 py-0.5 text-[10px] rounded-full border transition-colors ${
                                pendingCharacter.label === label
                                  ? 'bg-[#c2b280] text-white border-[#c2b280]'
                                  : 'bg-white hover:bg-[#f2ede4] text-[#4a3f35] border-[#e5e0d8]'
                              }`}
                              translate="no"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {isBuilding ? (
                      <>
                        {/* Tavola Palazzo (10:11, max 520px desktop, 5 piani x 5 finestre) */}
                        <div
                          ref={stageRef}
                          data-constellation-stage="true"
                          className="relative w-full aspect-[10/11] select-none"
                        >
                          <img
                            src={BUILDING_IMAGE_URL}
                            alt="Palazzo Costellazione"
                            className="relative z-10 w-full h-full object-contain pointer-events-none select-none"
                          />

                          {/* 25 finestre interattive (piani 1..5, col 0..4) */}
                          {BUILDING_FLOORS.map(floor =>
                            BUILDING_COLS.map(col => {
                              const slot = { floor, col };
                              const { xPct, yPct } = getBuildingSlotCenterPct(slot);
                              const occupant = characters.find(
                                c => c.slot?.floor === floor && c.slot?.col === col
                              );
                              const isHighlighted =
                                highlightedBuildingSlot?.floor === floor &&
                                highlightedBuildingSlot?.col === col;

                              return (
                                <button
                                  key={`window-${floor}-${col}`}
                                  type="button"
                                  aria-label={`Piano ${floor}, finestra ${col + 1}${occupant ? ` (${occupant.label})` : ' libera'}`}
                                  onClick={() => {
                                    if (!pendingCharacter) return;
                                    if (occupant) {
                                      showBuildingNotice('Finestra occupata');
                                      return;
                                    }
                                    placePendingInBuildingSlot(slot);
                                  }}
                                  className={`absolute transition-all rounded-t-full rounded-b-sm ${
                                    pendingCharacter ? 'z-40 cursor-pointer' : 'z-20 pointer-events-none'
                                  } ${
                                    isHighlighted
                                      ? 'ring-2 ring-[#c2b280] bg-[#c2b280]/30 shadow-[0_0_16px_rgba(194,178,128,0.85)]'
                                      : pendingCharacter && !occupant
                                        ? 'hover:bg-[#c2b280]/20 hover:ring-1 hover:ring-[#c2b280]/70'
                                        : ''
                                  }`}
                                  style={{
                                    left: `${xPct}%`,
                                    top: `${yPct}%`,
                                    width: `${BUILDING_WINDOW_WIDTH_PCT}%`,
                                    height: `${BUILDING_WINDOW_HEIGHT_PCT}%`,
                                    transform: 'translate(-50%, -50%)'
                                  }}
                                />
                              );
                            })
                          )}

                          {/* Pupazzi posizionati nelle finestre */}
                          {characters.map((char) => {
                            if (!char.slot) return null;
                            const { xPct, yPct } = getBuildingSlotCenterPct(char.slot);
                            const isDragging = draggingCharId === char.id;
                            const feelingBorder =
                              char.feeling === 'piacevole'
                                ? '#4ade80'
                                : char.feeling === 'spiacevole'
                                  ? '#f87171'
                                  : '#e5e0d8';

                            return (
                              <div
                                key={char.id}
                                className={`absolute ${isDragging ? 'z-50' : 'z-30'}`}
                                style={{
                                  left: `${xPct}%`,
                                  top: `${yPct}%`,
                                  width: `${BUILDING_WINDOW_WIDTH_PCT}%`,
                                  height: `${BUILDING_WINDOW_HEIGHT_PCT}%`,
                                  transform: 'translate(-50%, -50%)'
                                }}
                              >
                                <motion.div
                                  key={`${char.id}-${char.snapSeq || 0}`}
                                  drag={workflowStep === 0 || char.label.toLowerCase() === 'io'}
                                  dragMomentum={false}
                                  initial={char.snapSeq ? false : { scale: 0.5, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  onPointerDown={(e) => {
                                    charPointerDownRef.current = { id: char.id, x: e.clientX, y: e.clientY };
                                    activeDraggedCharRef.current = null;
                                  }}
                                  onDragStart={() => {
                                    activeDraggedCharRef.current = char.id;
                                    setDraggingCharId(char.id);
                                  }}
                                  onDrag={() => {
                                    const figEl = boardRef.current?.querySelector(`[data-building-figure-id="${char.id}"]`) as HTMLElement | null;
                                    const stageEl = stageRef.current;
                                    if (!figEl || !stageEl) return;
                                    const figRect = figEl.getBoundingClientRect();
                                    const stageRect = stageEl.getBoundingClientRect();
                                    if (stageRect.width <= 0 || stageRect.height <= 0) return;

                                    const centerX = (figRect.left + figRect.right) / 2;
                                    const centerY = (figRect.top + figRect.bottom) / 2;
                                    const xPctNow = ((centerX - stageRect.left) / stageRect.width) * 100;
                                    const yPctNow = ((centerY - stageRect.top) / stageRect.height) * 100;
                                    if (xPctNow < -5 || xPctNow > 105 || yPctNow < -3 || yPctNow > 103) {
                                      setHighlightedBuildingSlot(prev => (prev ? null : prev));
                                      return;
                                    }
                                    const nearest = findNearestFreeBuildingSlot(xPctNow, yPctNow, characters, char.id);
                                    setHighlightedBuildingSlot(prev => {
                                      if (!nearest && !prev) return prev;
                                      if (nearest && prev && nearest.floor === prev.floor && nearest.col === prev.col) return prev;
                                      return nearest;
                                    });
                                  }}
                                  onDragEnd={() => {
                                    lastCharDragEndRef.current = { id: char.id, at: Date.now() };
                                    activeDraggedCharRef.current = null;
                                    setDraggingCharId(null);
                                    setHighlightedBuildingSlot(null);

                                    const figEl = boardRef.current?.querySelector(`[data-building-figure-id="${char.id}"]`) as HTMLElement | null;
                                    const stageEl = stageRef.current;
                                    if (!figEl || !stageEl) return;
                                    const figRect = figEl.getBoundingClientRect();
                                    const stageRect = stageEl.getBoundingClientRect();
                                    if (stageRect.width <= 0 || stageRect.height <= 0) return;

                                    const centerX = (figRect.left + figRect.right) / 2;
                                    const centerY = (figRect.top + figRect.bottom) / 2;
                                    const xPctNow = ((centerX - stageRect.left) / stageRect.width) * 100;
                                    const yPctNow = ((centerY - stageRect.top) / stageRect.height) * 100;

                                    if (xPctNow < -5 || xPctNow > 105 || yPctNow < -3 || yPctNow > 103) {
                                      setCharacters(prev => prev.map(c =>
                                        c.id === char.id ? { ...c, snapSeq: (c.snapSeq || 0) + 1 } : c
                                      ));
                                      return;
                                    }

                                    const nextSlot = findNearestFreeBuildingSlot(xPctNow, yPctNow, characters, char.id);
                                    if (!nextSlot) {
                                      showBuildingNotice('Finestra occupata');
                                      setCharacters(prev => prev.map(c =>
                                        c.id === char.id ? { ...c, snapSeq: (c.snapSeq || 0) + 1 } : c
                                      ));
                                      return;
                                    }

                                    const coords = getBuildingSlotRefCoords(nextSlot);
                                    setCharacters(prev => prev.map(c =>
                                      c.id === char.id
                                        ? {
                                            ...c,
                                            slot: { floor: nextSlot.floor, col: nextSlot.col },
                                            x: coords.x,
                                            y: coords.y,
                                            snapSeq: (c.snapSeq || 0) + 1
                                          }
                                        : c
                                    ));
                                  }}
                                  onClick={(e) => {
                                    if (pendingCharacter) return;
                                    if (activeDraggedCharRef.current === char.id) return;
                                    if (lastCharDragEndRef.current?.id === char.id && Date.now() - lastCharDragEndRef.current.at < 300) {
                                      return;
                                    }
                                    const start = charPointerDownRef.current;
                                    if (start && start.id === char.id && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) {
                                      return;
                                    }
                                    handleCharacterClick(char);
                                  }}
                                  className={`relative w-full h-full group ${
                                    (workflowStep === 0 || char.label.toLowerCase() === 'io')
                                      ? 'cursor-grab active:cursor-grabbing'
                                      : 'cursor-pointer'
                                  }`}
                                  style={{
                                    opacity: isDragging ? 0.55 : 1,
                                    touchAction: (workflowStep === 0 || char.label.toLowerCase() === 'io') ? 'none' : 'auto',
                                    transition: 'opacity 120ms ease'
                                  }}
                                >
                                  <div
                                    data-building-figure-id={char.id}
                                    className="absolute left-1/2 bottom-[14%] flex justify-center hover:ring-2 hover:ring-[#c2b280]/80 rounded-xl transition-all"
                                    style={{ transform: 'translateX(-50%)' }}
                                  >
                                    {renderShape(
                                      char.shape,
                                      char.color,
                                      'normal',
                                      1,
                                      undefined,
                                      undefined,
                                      buildingFigureScale
                                    )}
                                  </div>
                                  <div
                                    data-building-pill="true"
                                    className="absolute left-1/2 -bottom-1.5 z-20 px-1.5 py-0.5 bg-white/95 rounded-full border shadow-sm text-[8px] sm:text-[9px] font-bold text-[#4a3f35] whitespace-nowrap max-w-[130%] truncate pointer-events-none"
                                    style={{
                                      transform: 'translateX(-50%)',
                                      borderColor: feelingBorder,
                                      lineHeight: 1.3
                                    }}
                                    translate="no"
                                  >
                                    <span>{char.label}</span>
                                    {char.feeling && (
                                      <span className="ml-0.5">{char.feeling === 'piacevole' ? '❤️' : '💔'}</span>
                                    )}
                                  </div>
                                  {workflowStep === 0 && !pendingCharacter && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeCharacter(char.id);
                                      }}
                                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md pointer-events-auto z-30"
                                    >
                                      <X size={10} />
                                    </button>
                                  )}
                                </motion.div>
                              </div>
                            );
                          })}
                        </div>

                        {characters.length > 0 && (
                          <div
                            data-constellation-legend="true"
                            className="mt-4 w-full bg-[#fdfbf7] border border-[#e5e0d8] rounded-2xl px-4 py-3 shadow-sm text-[#4a3f35]"
                            translate="no"
                          >
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
                              {characters.map((char) => (
                                <button
                                  key={`building-legend-${char.id}`}
                                  type="button"
                                  data-constellation-legend-item="true"
                                  onClick={() => handleCharacterClick(char)}
                                  className="flex items-center gap-1.5 text-left truncate rounded-lg px-1.5 py-1 hover:bg-white cursor-pointer"
                                >
                                  <span className="font-bold text-[#5a5a40] shrink-0">
                                    {char.slot ? `P${char.slot.floor}` : ''}
                                  </span>
                                  <span className="truncate font-medium">{char.label}</span>
                                  {char.feeling && (
                                    <span className="shrink-0">
                                      {char.feeling === 'piacevole' ? '❤️' : '💔'}
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                    {/* Wrapper con bande pillole (<=12) + fili SVG 1px + stage 16:9 */}
                    <div
                      className="relative w-full flex flex-col"
                      style={
                        pillLayout
                          ? { height: `${pillLayout.totalH}px`, paddingTop: `${pillLayout.topBandH}px` }
                          : undefined
                      }
                    >
                      {/* Fili SVG 1px che collegano pillole <-> testa (gradino superiore) o base (gradino inferiore) */}
                      {pillLayout && pillLayout.pills.length > 0 && (
                        <svg
                          width={pillLayout.stageW}
                          height={pillLayout.totalH}
                          viewBox={`0 0 ${pillLayout.stageW} ${pillLayout.totalH}`}
                          className="absolute top-0 left-0 pointer-events-none z-20"
                          style={{ width: `${pillLayout.stageW}px`, height: `${pillLayout.totalH}px` }}
                        >
                          {pillLayout.pills.map((pill) => (
                            <g key={`wire-${pill.char.id}`}>
                              <line
                                x1={pill.centerX}
                                y1={pill.wireStartY}
                                x2={pill.figX}
                                y2={pill.figAnchorY}
                                stroke="#8a7954"
                                strokeWidth={1}
                                strokeLinecap="round"
                              />
                              <circle
                                cx={pill.figX}
                                cy={pill.figAnchorY}
                                r={2}
                                fill="#8a7954"
                              />
                            </g>
                          ))}
                        </svg>
                      )}

                      {/* Stage / Board (vista frontale 2D, proporzioni 16:9 senza trasformazioni 3D) */}
                      <div 
                        ref={stageRef}
                        data-constellation-stage="true"
                        className="relative w-full aspect-[16/9] select-none"
                      >
                        <img 
                          src={STAGE_IMAGE_URL} 
                          alt="Gradini Costellazione" 
                          className="relative z-10 w-full h-full object-contain pointer-events-none select-none"
                        />

                        {/* Draggable Characters */}
                        {characters.map((char, charIndex) => {
                          const charStair = getCharacterStairV2(char);
                          const charNormX = getCharacterNormalizedX(char);
                          const xPct = getStairXRatio(charStair, charNormX) * 100;
                          const yPct = STAIR_GEOMETRY[charStair].yRatio * 100;
                          const isDragging = draggingCharId === char.id;
                          return (
                            <div
                              key={char.id}
                              className={`absolute ${isDragging ? 'z-50' : 'z-30'}`}
                              style={{ left: `${xPct}%`, top: `${yPct}%`, width: 0, height: 0 }}
                            >
                              <motion.div
                                key={`${char.id}-${char.snapSeq || 0}`}
                                drag={workflowStep === 0 || char.label.toLowerCase() === 'io'}
                                dragMomentum={false}
                                initial={char.snapSeq ? false : { scale: 0 }}
                                animate={{ scale: 1 }}
                                onPointerDown={(e) => {
                                  charPointerDownRef.current = { id: char.id, x: e.clientX, y: e.clientY };
                                  activeDraggedCharRef.current = null;
                                }}
                                onDragStart={() => {
                                  activeDraggedCharRef.current = char.id;
                                  setDraggingCharId(char.id);
                                }}
                                onDragEnd={() => {
                                  lastCharDragEndRef.current = { id: char.id, at: Date.now() };
                                  activeDraggedCharRef.current = null;
                                  setDraggingCharId(null);
                                  const figEl = boardRef.current?.querySelector(`[data-char-figure-id="${char.id}"]`) as HTMLElement | null;
                                  const stageEl = stageRef.current;
                                  if (!figEl || !stageEl) return;
                                  const figRect = figEl.getBoundingClientRect();
                                  const stageRect = stageEl.getBoundingClientRect();
                                  if (stageRect.width <= 0 || stageRect.height <= 0) return;

                                  const centerX = (figRect.left + figRect.right) / 2;
                                  const baseBottomY = figRect.bottom;
                                  const xRatio = (centerX - stageRect.left) / stageRect.width;
                                  const yRatio = (baseBottomY - stageRect.top) / stageRect.height;

                                  const snapped = snapStageRatioToStair(xRatio, yRatio);
                                  const sameStairOthers = characters
                                    .filter(other => other.id !== char.id && getCharacterStairV2(other) === snapped.stair)
                                    .map(other => getCharacterNormalizedX(other));
                                  const finalNormalizedX = nudgeNormalizedXOnStair(
                                    snapped.stair,
                                    snapped.normalizedX,
                                    sameStairOthers,
                                    densityScale
                                  );
                                  const finalX = Math.round(getStairXRatio(snapped.stair, finalNormalizedX) * STAGE_REF_WIDTH);

                                  setCharacters(prev => prev.map(c =>
                                    c.id === char.id
                                      ? {
                                          ...c,
                                          stair: snapped.stair,
                                          normalizedX: finalNormalizedX,
                                          x: finalX,
                                          y: snapped.y,
                                          snapSeq: (c.snapSeq || 0) + 1
                                        }
                                      : c
                                  ));
                                }}
                                onClick={(e) => {
                                  if (activeDraggedCharRef.current === char.id) return;
                                  if (lastCharDragEndRef.current?.id === char.id && Date.now() - lastCharDragEndRef.current.at < 300) {
                                    return;
                                  }
                                  const start = charPointerDownRef.current;
                                  if (start && start.id === char.id && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) {
                                    return;
                                  }
                                  handleCharacterClick(char);
                                }}
                                className={`relative group ${
                                  (workflowStep === 0 || char.label.toLowerCase() === 'io') 
                                    ? 'cursor-grab active:cursor-grabbing' 
                                    : 'cursor-pointer'
                                }`}
                                style={{
                                  width: 0,
                                  height: 0,
                                  opacity: isDragging ? 0.55 : 1,
                                  touchAction: (workflowStep === 0 || char.label.toLowerCase() === 'io') ? 'none' : 'auto',
                                  transition: 'opacity 120ms ease'
                                }}
                              >
                                {/* Figura ancorata con la base sulla superficie del gradino (0, 0) */}
                                <div
                                  data-char-figure-id={char.id}
                                  className="absolute bottom-0 left-0 flex justify-center hover:ring-2 hover:ring-[#c2b280]/80 rounded-2xl transition-all"
                                  style={{ transform: 'translateX(-50%)' }}
                                >
                                  {renderShape(
                                    char.shape,
                                    char.color,
                                    'normal',
                                    densityScale,
                                    useLegendMode ? charIndex + 1 : undefined
                                  )}
                                  {workflowStep === 0 && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeCharacter(char.id);
                                      }}
                                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md pointer-events-auto"
                                    >
                                      <X size={12} />
                                    </button>
                                  )}
                                </div>
                              </motion.div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Pillole SOPRA (gradino superiore) e SOTTO (gradino inferiore) fino a 12 figure */}
                      {pillLayout && pillLayout.pills.map((pill) => {
                        const feelingBorder =
                          pill.char.feeling === 'piacevole'
                            ? '#4ade80'
                            : pill.char.feeling === 'spiacevole'
                              ? '#f87171'
                              : '#e5e0d8';
                        return (
                          <div
                            key={`pill-${pill.char.id}`}
                            role="button"
                            tabIndex={0}
                            data-constellation-pill="true"
                            data-pill-center-x={pill.centerX}
                            data-pill-width={pill.width}
                            onClick={() => handleCharacterClick(pill.char)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleCharacterClick(pill.char);
                              }
                            }}
                            className="absolute z-40 px-2.5 bg-white rounded-full shadow-sm border font-medium whitespace-nowrap flex items-center justify-center text-[#4a3f35] cursor-pointer hover:border-[#5a5a40]"
                            style={{
                              left: `${pill.centerX}px`,
                              top: `${pill.pillTopY}px`,
                              minHeight: `${pill.height}px`,
                              height: 'auto',
                              paddingTop: '4px',
                              paddingBottom: '4px',
                              lineHeight: 1.4,
                              maxWidth: stageWidth < 640 ? '160px' : '210px',
                              fontSize: stageWidth < 640 ? '11px' : '12px',
                              borderColor: feelingBorder,
                              transform: 'translateX(-50%)'
                            }}
                            translate="no"
                          >
                            <span className="truncate">{pill.char.label}</span>
                            {pill.char.feeling && (
                              <span className="ml-1 shrink-0">
                                {pill.char.feeling === 'piacevole' ? '❤️' : '💔'}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Legenda multi-colonna sotto il piano quando ci sono oltre 12 figure */}
                    {useLegendMode && (
                      <div
                        data-constellation-legend="true"
                        className="mt-4 w-full bg-[#fdfbf7] border border-[#e5e0d8] rounded-2xl px-4 py-3 shadow-sm text-[#4a3f35]"
                        translate="no"
                      >
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
                          {characters.map((char, index) => (
                            <button
                              key={`legend-${char.id}`}
                              type="button"
                              data-constellation-legend-item="true"
                              onClick={() => handleCharacterClick(char)}
                              className={`flex items-center gap-1.5 text-left truncate rounded-lg px-1.5 py-1 ${
                                workflowStep === 1 && char.label.toLowerCase() !== 'io'
                                  ? 'hover:bg-white cursor-pointer'
                                  : 'cursor-default'
                              }`}
                            >
                              <span className="font-bold text-[#5a5a40] shrink-0">{index + 1}</span>
                              <span className="truncate font-medium">{char.label}</span>
                              {char.feeling && (
                                <span className="shrink-0">
                                  {char.feeling === 'piacevole' ? '❤️' : '💔'}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                      </>
                    )}
                  </div>
                );
              })()}
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
                      if (!user) { showAlert('Accesso richiesto', 'Effettua il login per salvare.'); return; }
                      try {
                        await saveRuneReading(userData.domandaRune, selectedRunesIds);
                        showAlert('Salvataggio completato', 'Questionario Rune salvato in Area Personale!');
                        fetchHistory(user.uid);
                      } catch (error: any) {
                        console.error('Errore salvataggio rune:', error);
                        showAlert('Errore salvataggio', 'Impossibile salvare il questionario Rune.');
                      }
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
                      showAlert('Accesso richiesto', "Per favore, effettua l'accesso per candidarti.", login);
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
        ) : currentPage === 'registri' ? (
          <motion.div
            key="registri"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col p-4 sm:p-8 overflow-y-auto"
          >
            <div className="max-w-4xl mx-auto w-full pb-20">
              <div className="flex items-center justify-between mb-6">
                <button
                  type="button"
                  onClick={() => setCurrentPage('home')}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#5a5a40] hover:text-[#c2b280] transition-colors"
                >
                  <X size={16} /> Home
                </button>
              </div>

              <div className="w-full rounded-[2rem] overflow-hidden shadow-lg border border-[#e5e0d8] mb-8 bg-white">
                <img
                  src={AKASHIC_HEADER_IMAGE_URL}
                  alt="I Registri Akashici"
                  className="w-full h-auto object-cover block"
                />
              </div>

              <header className="text-center mb-10 px-2">
                <h1 className="font-serif italic text-3xl sm:text-5xl text-[#c2b280] mb-3 tracking-tight">
                  I REGISTRI AKASHICI
                </h1>
                <p className="font-serif italic text-lg sm:text-xl text-[#5a5a40] mb-6">
                  Un viaggio di ascolto, conoscenza e consapevolezza dell&apos;anima.
                </p>
                <div className="bg-white/80 backdrop-blur-sm p-6 sm:p-10 rounded-[2rem] border border-[#e5e0d8] shadow-sm text-left sm:text-center">
                  <p className="text-[#4a3f35] leading-relaxed text-sm sm:text-base opacity-90">
                    Secondo la tradizione spirituale, i Registri Akashici rappresentano un archivio simbolico della memoria dell&apos;anima. Attraverso questa esperienza di introspezione potrai dedicarti all&apos;ascolto interiore, esplorare le domande che porti dentro di te e aprirti a nuove prospettive di consapevolezza.
                  </p>
                  {!showAkashicForm && !akashicSubmitted && (
                    <div className="mt-8 flex justify-center">
                      <button
                        type="button"
                        onClick={() => openAkashicForm()}
                        className="px-8 py-4 bg-[#c2b280] text-white rounded-full font-bold uppercase tracking-widest text-xs hover:bg-[#b1a170] transition-all shadow-lg active:scale-95 flex items-center gap-2.5"
                      >
                        <BookOpen size={16} />
                        <span>RICHIEDI LA TUA LETTURA</span>
                      </button>
                    </div>
                  )}
                </div>
              </header>

              {akashicSubmitted && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#fdfbf7] border-2 border-[#c2b280]/50 rounded-[2rem] p-6 sm:p-10 shadow-md text-center space-y-6"
                >
                  <div className="w-14 h-14 mx-auto rounded-full bg-[#c2b280]/15 text-[#c2b280] flex items-center justify-center">
                    <Heart size={26} />
                  </div>
                  <p className="font-serif italic text-xl sm:text-2xl text-[#4a3f35] leading-relaxed max-w-2xl mx-auto">
                    La tua richiesta è stata ricevuta con amore. GraziaMaria si prenderà il tempo necessario per preparare personalmente la tua lettura. Riceverai una comunicazione quando sarà pronta.
                  </p>
                  <div>
                    <button
                      type="button"
                      onClick={() => setCurrentPage('home')}
                      className="px-8 py-3 bg-[#4a3f35] text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#3a2f25] transition-all shadow-md"
                    >
                      Home
                    </button>
                  </div>
                </motion.div>
              )}

              {showAkashicForm && user && !akashicSubmitted && (
                <motion.form
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleSubmitAkashicRequest}
                  className="bg-white rounded-[2rem] border border-[#e5e0d8] shadow-lg p-6 sm:p-10 space-y-6"
                >
                  <div className="border-b border-[#e5e0d8] pb-4">
                    <h2 className="font-serif italic text-2xl sm:text-3xl text-[#4a3f35]">
                      Modulo di Richiesta
                    </h2>
                    <p className="text-xs text-[#5a5a40] mt-1">
                      Compila i campi con calma e ascolto interiore. I campi contrassegnati con * sono obbligatori.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label htmlFor="akashic-name" className="block text-[11px] font-bold uppercase tracking-wider text-[#5a5a40]">
                        Nome e cognome *
                      </label>
                      <input
                        id="akashic-name"
                        type="text"
                        required
                        maxLength={100}
                        value={akashicForm.name}
                        onChange={(e) => setAkashicForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Il tuo nome e cognome"
                        className="w-full px-4 py-3 bg-[#fdfbf7] border border-[#e5e0d8] rounded-xl text-sm text-[#4a3f35] focus:outline-none focus:ring-2 focus:ring-[#c2b280]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="akashic-birth-date" className="block text-[11px] font-bold uppercase tracking-wider text-[#5a5a40]">
                        Data di nascita (facoltativa)
                      </label>
                      <input
                        id="akashic-birth-date"
                        type="date"
                        maxLength={50}
                        value={akashicForm.birthDate}
                        onChange={(e) => setAkashicForm(prev => ({ ...prev, birthDate: e.target.value }))}
                        className="w-full px-4 py-3 bg-[#fdfbf7] border border-[#e5e0d8] rounded-xl text-sm text-[#4a3f35] focus:outline-none focus:ring-2 focus:ring-[#c2b280]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="akashic-email" className="block text-[11px] font-bold uppercase tracking-wider text-[#5a5a40]">
                      Indirizzo email *
                    </label>
                    <input
                      id="akashic-email"
                      type="email"
                      required
                      maxLength={200}
                      value={akashicForm.email}
                      onChange={(e) => setAkashicForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="nome@esempio.it"
                      className="w-full px-4 py-3 bg-[#fdfbf7] border border-[#e5e0d8] rounded-xl text-sm text-[#4a3f35] focus:outline-none focus:ring-2 focus:ring-[#c2b280]"
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-[#5a5a40]">
                      Area che desidera esplorare *
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {AKASHIC_AREAS.map((areaOption) => {
                        const isSelected = akashicForm.area === areaOption;
                        return (
                          <button
                            key={areaOption}
                            type="button"
                            onClick={() => setAkashicForm(prev => ({ ...prev, area: areaOption }))}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm transition-all ${
                              isSelected
                                ? 'bg-[#c2b280]/15 border-[#c2b280] text-[#4a3f35] font-semibold shadow-sm'
                                : 'bg-[#fdfbf7] border-[#e5e0d8] text-[#4a3f35]/80 hover:border-[#c2b280]/60'
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected ? 'border-[#c2b280] bg-[#c2b280]' : 'border-[#c2b280]/60 bg-white'
                              }`}
                            >
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                            <span>{areaOption}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="akashic-question" className="block text-[11px] font-bold uppercase tracking-wider text-[#5a5a40]">
                      Qual è la domanda che porti dentro di te? *
                    </label>
                    <textarea
                      id="akashic-question"
                      required
                      maxLength={2000}
                      rows={4}
                      value={akashicForm.question}
                      onChange={(e) => setAkashicForm(prev => ({ ...prev, question: e.target.value }))}
                      placeholder="Scrivi qui la tua domanda..."
                      className="w-full px-4 py-3 bg-[#fdfbf7] border border-[#e5e0d8] rounded-xl text-sm text-[#4a3f35] focus:outline-none focus:ring-2 focus:ring-[#c2b280] resize-y"
                    />
                    <p className="text-[10px] text-[#5a5a40]/60 text-right">
                      {akashicForm.question.length}/2000
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="akashic-hope" className="block text-[11px] font-bold uppercase tracking-wider text-[#5a5a40]">
                      Cosa ti auguri di trovare attraverso questa esperienza? *
                    </label>
                    <textarea
                      id="akashic-hope"
                      required
                      maxLength={2000}
                      rows={4}
                      value={akashicForm.hope}
                      onChange={(e) => setAkashicForm(prev => ({ ...prev, hope: e.target.value }))}
                      placeholder="Racconta cosa desideri comprendere o accogliere..."
                      className="w-full px-4 py-3 bg-[#fdfbf7] border border-[#e5e0d8] rounded-xl text-sm text-[#4a3f35] focus:outline-none focus:ring-2 focus:ring-[#c2b280] resize-y"
                    />
                    <p className="text-[10px] text-[#5a5a40]/60 text-right">
                      {akashicForm.hope.length}/2000
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="akashic-notes" className="block text-[11px] font-bold uppercase tracking-wider text-[#5a5a40]">
                      Eventuali informazioni aggiuntive (facoltative)
                    </label>
                    <textarea
                      id="akashic-notes"
                      maxLength={2000}
                      rows={3}
                      value={akashicForm.notes}
                      onChange={(e) => setAkashicForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Aggiungi eventuali dettagli o contesto utile..."
                      className="w-full px-4 py-3 bg-[#fdfbf7] border border-[#e5e0d8] rounded-xl text-sm text-[#4a3f35] focus:outline-none focus:ring-2 focus:ring-[#c2b280] resize-y"
                    />
                    <p className="text-[10px] text-[#5a5a40]/60 text-right">
                      {akashicForm.notes.length}/2000
                    </p>
                  </div>

                  <div className="bg-[#fdfbf7] border border-[#e5e0d8] rounded-2xl p-4 space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={akashicForm.consentAccepted}
                        onChange={(e) => setAkashicForm(prev => ({ ...prev, consentAccepted: e.target.checked }))}
                        className="mt-1 w-4 h-4 accent-[#c2b280] shrink-0"
                      />
                      <span className="text-xs text-[#4a3f35] leading-relaxed">
                        Acconsento al trattamento dei dati personali secondo l&apos;
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setShowAkashicPrivacy(prev => !prev);
                          }}
                          className="underline font-bold text-[#c2b280] hover:text-[#b1a170]"
                        >
                          Informativa sulla privacy
                        </button>
                        . *
                      </span>
                    </label>

                    {showAkashicPrivacy && (
                      <div className="p-3.5 bg-white border border-[#e5e0d8] rounded-xl text-xs text-[#4a3f35]/90 leading-relaxed">
                        {PRIVACY_AKASHIC_TEXT}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAkashicForm(false)}
                      className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#e5e0d8] text-xs font-bold uppercase tracking-wider text-[#5a5a40] hover:bg-[#f8f5f0] transition-colors"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      disabled={!isAkashicFormValid || isSubmittingAkashic}
                      className="w-full sm:w-auto px-8 py-4 bg-[#c2b280] text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-[#b1a170] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Send size={15} />
                      <span>{isSubmittingAkashic ? 'Invio in corso...' : 'INVIA LA TUA RICHIESTA'}</span>
                    </button>
                  </div>
                </motion.form>
              )}
            </div>
          </motion.div>
        ) : currentPage === 'profile' && user ? (
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
                    <div className="flex-1 space-y-2 mt-4 text-left overflow-y-auto max-h-[260px] scrollbar-hide pr-1">
                      {constellationHistory.map(ch => (
                          <div key={ch.id} className="p-3 bg-white rounded-xl border border-[#e5e0d8] text-[10px] shadow-sm notranslate">
                            {ch.screenshotUrl && (
                              <button
                                type="button"
                                onClick={() => setFullscreenImageUrl(ch.screenshotUrl)}
                                className="block w-full mb-2 rounded-lg overflow-hidden border border-[#e5e0d8] bg-[#f8f5f0] hover:opacity-90 transition-opacity"
                                title="Apri costellazione a schermo intero"
                              >
                                <img
                                  src={ch.screenshotUrl}
                                  alt="Costellazione salvata"
                                  className="w-full h-24 object-contain"
                                  referrerPolicy="no-referrer"
                                />
                              </button>
                            )}
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

              {/* I miei Registri Akashici */}
              <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-[#e5e0d8]">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <BookOpen className="text-[#c2b280]" size={24} />
                    <h3 className="font-serif italic text-2xl text-[#4a3f35]">I miei Registri Akashici</h3>
                  </div>
                </div>
                <p className="text-sm opacity-70 mb-6 leading-relaxed">
                  Qui trovi lo stato delle tue richieste e le letture del tuo Libro dell&apos;Anima preparate da GraziaMaria.
                </p>

                {isLoadingUserAkashic ? (
                  <div className="text-center py-8 text-xs opacity-60 italic">Caricamento dei tuoi Registri Akashici...</div>
                ) : userAkashicRequests.length === 0 ? (
                  <div className="text-center py-10 bg-[#fdfbf7] rounded-3xl border border-dashed border-[#e5e0d8]">
                    <BookOpen className="mx-auto mb-3 text-[#c2b280] opacity-40" size={30} />
                    <p className="text-sm opacity-60 italic">Non hai ancora richiesto una lettura dei Registri Akashici.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAkashicForm(false);
                        setShowAkashicPrivacy(false);
                        setAkashicSubmitted(false);
                        setCurrentPage('registri');
                      }}
                      className="mt-4 text-[#c2b280] text-xs font-bold uppercase tracking-widest hover:underline"
                    >
                      Scopri i Registri Akashici
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {userAkashicRequests.map((req) => {
                      const clientStatusMap: Record<string, { label: string; cls: string }> = {
                        nuova: { label: 'Ricevuta', cls: 'bg-amber-50 text-amber-800 border border-amber-200' },
                        in_lavorazione: { label: 'In preparazione', cls: 'bg-[#f8f5f0] text-[#5a5a40] border border-[#c2b280]' },
                        completata: { label: 'Pronta', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }
                      };
                      const statusBadge = clientStatusMap[req.status] || clientStatusMap.nuova;
                      const dateLabel = req.createdAt?.toDate
                        ? req.createdAt.toDate().toLocaleDateString('it-IT')
                        : 'Recente';
                      const publishedReading =
                        req.status === 'completata' && userAkashicReadingsMap[req.id]?.published === true
                          ? userAkashicReadingsMap[req.id]
                          : null;
                      const isNewForDevice = Boolean(publishedReading && !seenAkashicReadingIds.includes(req.id));

                      return (
                        <div key={req.id} className="p-6 bg-[#fdfbf7] rounded-3xl border border-[#e5e0d8] shadow-sm space-y-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-[10px] font-bold text-[#c2b280] uppercase tracking-widest">{dateLabel}</p>
                              <h4 className="font-serif italic text-xl text-[#4a3f35] mt-0.5">{req.area}</h4>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {isNewForDevice && (
                                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#c2b280] text-white shadow-sm">
                                  Nuova
                                </span>
                              )}
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusBadge.cls}`}>
                                {statusBadge.label}
                              </span>
                            </div>
                          </div>

                          {publishedReading && (
                            <div className="p-5 bg-white rounded-2xl border border-[#c2b280]/60 shadow-sm space-y-4">
                              <p className="text-sm text-[#4a3f35] leading-relaxed font-serif italic">
                                Il tuo Libro dell&apos;Anima è pronto. GraziaMaria ha preparato personalmente la tua lettura. Puoi accedere alla tua area riservata e iniziare il tuo viaggio.
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  if (user?.uid) {
                                    markAkashicReadingSeen(user.uid, req.id);
                                  }
                                  setOpenedUserAkashicRequestId(req.id);
                                }}
                                className="px-6 py-3 rounded-full bg-[#c2b280] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#b1a170] shadow-md transition-all flex items-center gap-2"
                              >
                                <BookOpen size={15} />
                                <span>Apri il tuo Libro dell&apos;Anima</span>
                              </button>
                            </div>
                          )}

                          <div className="pt-2 border-t border-[#e5e0d8]/80 flex flex-wrap items-center justify-between gap-2">
                            {req.deletionRequested === true ? (
                              <span className="text-xs font-bold text-[#5a5a40] italic">
                                Richiesta inviata a GraziaMaria
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={isRequestingAkashicDeletionId === req.id}
                                onClick={() => requestAkashicDeletion(req)}
                                className="text-xs font-bold text-red-700 hover:text-red-800 hover:underline disabled:opacity-50 transition-colors"
                              >
                                {isRequestingAkashicDeletionId === req.id
                                  ? 'Invio richiesta...'
                                  : 'Richiedi la cancellazione dei miei dati'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                      if (!user) { showAlert('Accesso richiesto', 'Effettua il login per salvare.'); return; }
                      try {
                        await saveFlowerReading(selectedFlowersIds);
                        showAlert('Salvataggio completato', 'Fiori salvati in Area Personale!');
                        fetchHistory(user.uid);
                      } catch (error: any) {
                        console.error('Errore salvataggio fiori:', error);
                        showAlert('Errore salvataggio', 'Impossibile salvare i fiori selezionati.');
                      }
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
                {availablePickerShapes.length === 0 ? (
                  <p className="col-span-full text-center text-sm text-[#8c7a6b] py-6">
                    Hai già usato tutti i personaggi
                  </p>
                ) : (
                  availablePickerShapes.map((char, index) => (
                    <button
                      key={`${char.shape}-${char.color}-${index}`}
                      onClick={() => selectCharacter(char)}
                      className="flex flex-col items-center p-2 sm:p-4 rounded-xl sm:rounded-2xl hover:bg-[#f8f5f0] border border-transparent hover:border-[#e5e0d8] transition-all group"
                    >
                      <div className="transform group-hover:scale-110 transition-transform">
                        {renderShape(char.shape, char.color, 'small')}
                      </div>
                    </button>
                  ))
                )}
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

      {/* Quick Edit & Analysis Modal */}
      <AnimatePresence>
        {analyzingCharacter && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAnalyzingCharacter(null)}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-[#4a3f35]/60 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto flex flex-col border border-[#e5e0d8]"
            >
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-serif italic text-[#4a3f35]">
                  Modifica: {analyzingCharacter.label || 'Senza nome'}
                </h2>
                <button
                  type="button"
                  onClick={() => setAnalyzingCharacter(null)}
                  className="p-2 hover:bg-[#f8f5f0] rounded-full transition-colors"
                  aria-label="Chiudi"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label htmlFor="quick-edit-char-label" className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-2">
                    Nome / ruolo
                  </label>
                  <input
                    id="quick-edit-char-label"
                    type="text"
                    value={tempLabelEdit}
                    onChange={(e) => setTempLabelEdit(e.target.value)}
                    placeholder="Chi rappresenta per te? (es. Mamma)"
                    className="w-full px-4 py-2.5 bg-[#f8f5f0] border border-[#e5e0d8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a5a40] text-sm text-[#4a3f35]"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {PREDEFINED_LABELS.slice(0, 8).map(label => (
                      <button
                        key={`edit-preset-${label}`}
                        type="button"
                        onClick={() => setTempLabelEdit(label)}
                        className={`px-2.5 py-1 text-[10px] rounded-full border transition-colors ${
                          tempLabelEdit === label
                            ? 'bg-[#c2b280] text-white border-[#c2b280]'
                            : 'bg-[#f8f5f0] hover:bg-[#e5e0d8] text-[#4a3f35] border-[#e5e0d8]'
                        }`}
                        translate="no"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-2">Emozione</p>
                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setTempFeeling(prev => prev === 'piacevole' ? null : 'piacevole')}
                      className={`flex-1 py-2.5 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${tempFeeling === 'piacevole' ? 'bg-green-50 border-green-500 text-green-700 shadow-inner' : 'border-[#e5e0d8] hover:bg-gray-50'}`}
                    >
                      <Heart size={16} fill={tempFeeling === 'piacevole' ? 'currentColor' : 'none'} />
                      <span className="font-bold text-xs uppercase">PIACEVOLE</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setTempFeeling(prev => prev === 'spiacevole' ? null : 'spiacevole')}
                      className={`flex-1 py-2.5 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${tempFeeling === 'spiacevole' ? 'bg-red-50 border-red-500 text-red-700 shadow-inner' : 'border-[#e5e0d8] hover:bg-gray-50'}`}
                    >
                      <Frown size={16} fill={tempFeeling === 'spiacevole' ? 'currentColor' : 'none'} />
                      <span className="font-bold text-xs uppercase">SPIACEVOLE</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="quick-edit-char-memory" className="block text-xs font-bold uppercase tracking-widest text-[#5a5a40] mb-2">
                    Memoria / evento
                  </label>
                  <textarea 
                    id="quick-edit-char-memory"
                    value={tempMemory}
                    onChange={(e) => setTempMemory(e.target.value)}
                    placeholder="Scrivi qui il tuo ricordo..."
                    className="w-full p-3.5 bg-[#f8f5f0] border border-[#e5e0d8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5a5a40] min-h-[96px] text-sm text-[#4a3f35]"
                  />
                </div>

                <div className="flex flex-col gap-2.5 pt-1">
                  <button 
                    type="button"
                    onClick={saveAnalysis}
                    className="w-full py-3.5 bg-[#5a5a40] text-white rounded-xl font-bold hover:bg-[#4a4a35] transition-all shadow-lg active:scale-95 uppercase tracking-widest text-xs sm:text-sm"
                  >
                    Salva
                  </button>
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={requestRemoveEditedCharacter}
                      className="flex-1 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-100 transition-colors text-xs uppercase tracking-wider"
                    >
                      Rimuovi pupazzo
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnalyzingCharacter(null)}
                      className="flex-1 py-2.5 bg-[#f8f5f0] text-[#4a3f35] border border-[#e5e0d8] rounded-xl font-bold hover:bg-[#e5e0d8] transition-colors text-xs uppercase tracking-wider"
                    >
                      Annulla
                    </button>
                  </div>
                </div>
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

      {/* Sent to Graziamaria Confirmation Modal */}
      <AnimatePresence>
        {sentToGraziamariaModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSentToGraziamariaModal}
            className="fixed inset-0 z-[290] flex items-center justify-center bg-[#4a3f35]/40 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] shadow-2xl max-w-md w-full border border-[#e5e0d8]"
            >
              <div className="flex justify-between items-start gap-4 mb-4">
                <h3 className="text-xl sm:text-2xl font-serif italic text-[#4a3f35]">
                  Costellazione inviata
                </h3>
                <button
                  type="button"
                  onClick={closeSentToGraziamariaModal}
                  className="p-2 hover:bg-[#f8f5f0] rounded-full transition-colors text-[#4a3f35]"
                  aria-label="Chiudi"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-sm text-[#4a3f35]/85 leading-relaxed mb-6">
                Inviata a Graziamaria. La trovi anche nella tua area personale.
              </p>

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadSentImage}
                  disabled={!sentToGraziamariaModal.imageBlob}
                  className="w-full py-3 px-5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#c2b280] text-white hover:bg-[#b1a170] disabled:opacity-45 disabled:cursor-not-allowed shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  <span>Scarica immagine</span>
                </button>
                <button
                  type="button"
                  onClick={closeSentToGraziamariaModal}
                  className="w-full py-2.5 px-5 rounded-full text-xs font-bold uppercase tracking-wider border border-[#e5e0d8] text-[#4a3f35] hover:bg-[#f8f5f0] transition-all"
                >
                  Chiudi
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Image Lightbox Modal */}
      <AnimatePresence>
        {fullscreenImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFullscreenImageUrl(null)}
            className="fixed inset-0 z-[320] flex items-center justify-center bg-black/85 p-4"
          >
            <button
              type="button"
              onClick={() => setFullscreenImageUrl(null)}
              className="absolute top-4 right-4 p-3 rounded-full bg-white/90 text-[#4a3f35] hover:bg-white shadow-lg transition-all"
              aria-label="Chiudi immagine"
            >
              <X size={20} />
            </button>
            <img
              src={fullscreenImageUrl}
              alt="Costellazione a schermo intero"
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-[90vh] object-contain rounded-2xl bg-[#f8f5f0] shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Client Akashic 7-Chapter Reading Modal */}
      <AnimatePresence>
        {openedUserAkashicRequestId && userAkashicReadingsMap[openedUserAkashicRequestId]?.published === true && (() => {
          const openedReq = userAkashicRequests.find(r => r.id === openedUserAkashicRequestId);
          const openedReading = userAkashicReadingsMap[openedUserAkashicRequestId];
          const chapters: string[] = Array.isArray(openedReading?.chapters) ? openedReading.chapters : [];
          const openedDateLabel = openedReq?.createdAt?.toDate
            ? openedReq.createdAt.toDate().toLocaleDateString('it-IT')
            : '';

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenedUserAkashicRequestId(null)}
              className="fixed inset-0 z-[280] flex items-center justify-center bg-[#4a3f35]/55 backdrop-blur-sm p-3 sm:p-6"
            >
              <motion.div
                initial={{ scale: 0.96, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.96, y: 16 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#fdfbf7] w-full max-w-3xl max-h-[90vh] rounded-[28px] sm:rounded-[36px] border-2 border-[#c2b280]/70 shadow-2xl flex flex-col overflow-hidden"
              >
                <div className="px-6 sm:px-8 py-5 bg-white border-b border-[#e5e0d8] flex items-start justify-between gap-4 shrink-0">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] font-black text-[#c2b280]">
                      I Registri Akashici
                    </p>
                    <h3 className="font-serif italic text-2xl sm:text-3xl text-[#4a3f35] mt-0.5">
                      Il tuo Libro dell&apos;Anima
                    </h3>
                    {(openedReq?.area || openedDateLabel) && (
                      <p className="text-xs text-[#5a5a40] mt-1">
                        {openedReq?.area}{openedReq?.area && openedDateLabel ? ' · ' : ''}{openedDateLabel}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenedUserAkashicRequestId(null)}
                    className="p-2.5 rounded-full bg-[#f8f5f0] text-[#4a3f35] hover:bg-[#e5e0d8] transition-colors shrink-0"
                    aria-label="Chiudi lettura"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 space-y-6">
                  {AKASHIC_CHAPTERS.map((chapter, idx) => (
                    <section
                      key={chapter.title}
                      className="p-5 sm:p-7 rounded-3xl bg-white border border-[#c2b280]/45 shadow-sm space-y-3"
                    >
                      <div className="border-b border-[#e5e0d8] pb-3">
                        <h4 className="font-serif italic text-lg sm:text-xl font-bold text-[#c2b280]">
                          {chapter.title}
                        </h4>
                        <p className="text-xs text-[#5a5a40] mt-0.5">({chapter.subtitle})</p>
                      </div>
                      <p className="text-sm sm:text-base text-[#4a3f35] leading-relaxed whitespace-pre-wrap">
                        {(chapters[idx] || '').trim() || '—'}
                      </p>
                    </section>
                  ))}
                </div>

                <div className="px-6 sm:px-8 py-4 bg-white border-t border-[#e5e0d8] flex justify-end shrink-0">
                  <button
                    type="button"
                    onClick={() => setOpenedUserAkashicRequestId(null)}
                    className="px-6 py-2.5 rounded-full bg-[#c2b280] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#b1a170] shadow-md transition-all"
                  >
                    Chiudi
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* In-App Alert & Confirm Dialog Modal */}
      <AnimatePresence>
        {appDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={async () => {
              const closeAction = appDialog.mode === 'alert' ? appDialog.onClose : appDialog.onDismiss;
              setAppDialog(null);
              if (closeAction) await closeAction();
            }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-[#4a3f35]/40 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] shadow-2xl max-w-md w-full border border-[#e5e0d8]"
            >
              <div className="flex justify-between items-start gap-4 mb-4">
                <h3 className="text-xl sm:text-2xl font-serif italic text-[#4a3f35]">{appDialog.title}</h3>
                <button
                  type="button"
                  onClick={async () => {
                    const closeAction = appDialog.mode === 'alert' ? appDialog.onClose : appDialog.onDismiss;
                    setAppDialog(null);
                    if (closeAction) await closeAction();
                  }}
                  className="p-2 hover:bg-[#f8f5f0] rounded-full transition-colors text-[#4a3f35]"
                  aria-label="Chiudi"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm text-[#4a3f35]/80 leading-relaxed whitespace-pre-line mb-6">
                {appDialog.message}
              </p>
              <div className="flex justify-end gap-3">
                {appDialog.mode === 'confirm' ? (
                  <>
                    <button
                      type="button"
                      onClick={async () => {
                        const cancelAction = appDialog.onCancel;
                        setAppDialog(null);
                        if (cancelAction) await cancelAction();
                      }}
                      className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider border border-[#e5e0d8] text-[#4a3f35] hover:bg-[#f8f5f0] transition-all"
                    >
                      {appDialog.cancelLabel || 'Annulla'}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const action = appDialog.onConfirm;
                        setAppDialog(null);
                        if (action) await action();
                      }}
                      className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all ${
                        appDialog.danger
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-[#c2b280] hover:bg-[#b1a170]'
                      }`}
                    >
                      {appDialog.confirmLabel || 'Conferma'}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      const closeAction = appDialog.onClose;
                      setAppDialog(null);
                      if (closeAction) await closeAction();
                    }}
                    className="px-8 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#c2b280] text-white hover:bg-[#b1a170] shadow-lg transition-all"
                  >
                    OK
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
