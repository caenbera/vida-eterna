// Capa de acceso a datos centralizada: Firestore si está configurado, si no,
// un caché en localStorage sembrado desde /studies.json (modo "base de datos local").
// Reemplaza la lógica de fetch/Firestore que antes estaba duplicada en
// AdminDashboard.jsx, Library.jsx y StudyPlayer.jsx.

import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

function makeLocalStore(cacheKey, seedUrl) {
  function read() {
    try {
      const raw = localStorage.getItem(cacheKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function write(items) {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(items));
    } catch (err) {
      console.warn(`No se pudo escribir el caché local (${cacheKey}):`, err);
    }
  }

  async function seed() {
    if (!seedUrl) return [];
    try {
      const res = await fetch(seedUrl);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }

  async function all() {
    const cached = read();
    if (cached) return cached;
    const seeded = await seed();
    write(seeded);
    return seeded;
  }

  return { read, write, all };
}

function makeCollectionService(collectionName, { cacheKey, seedUrl, orderByField }) {
  const localStore = makeLocalStore(cacheKey, seedUrl);

  async function loadAll() {
    if (db) {
      try {
        const q = orderByField
          ? query(collection(db, collectionName), orderBy(orderByField))
          : collection(db, collectionName);
        const snap = await getDocs(q);
        const items = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
        return items;
      } catch (err) {
        console.error(`Firestore loadAll(${collectionName}) error:`, err);
      }
    }
    return localStore.all();
  }

  async function loadOne(id) {
    if (db) {
      try {
        const snap = await getDoc(doc(db, collectionName, id));
        if (snap.exists()) return { id, ...snap.data() };
        return null;
      } catch (err) {
        console.error(`Firestore loadOne(${collectionName}) error:`, err);
      }
    }
    const all = await loadAll();
    return all.find((item) => item.id === id) || null;
  }

  async function save(item) {
    const toSave = { ...item, updatedAt: Date.now() };
    if (db) {
      try {
        await setDoc(doc(db, collectionName, toSave.id), toSave);
        return toSave;
      } catch (err) {
        console.error(`Firestore save(${collectionName}) error:`, err);
      }
    }
    const all = await loadAll();
    const exists = all.some((i) => i.id === toSave.id);
    const updated = exists ? all.map((i) => (i.id === toSave.id ? toSave : i)) : [...all, toSave];
    localStore.write(updated);
    return toSave;
  }

  async function remove(id) {
    if (db) {
      try {
        await deleteDoc(doc(db, collectionName, id));
      } catch (err) {
        console.error(`Firestore remove(${collectionName}) error:`, err);
      }
    }
    const all = await loadAll();
    localStore.write(all.filter((i) => i.id !== id));
  }

  return { loadAll, loadOne, save, remove };
}

const studiesStore = makeCollectionService('studies', {
  cacheKey: 'vida_eterna_local_studies_v2',
  seedUrl: '/studies.json',
  orderByField: 'title',
});

const templatesStore = makeCollectionService('templates', {
  cacheKey: 'vida_eterna_local_templates_v1',
  seedUrl: null,
  orderByField: null,
});

export const loadAllStudies = studiesStore.loadAll;
export const loadStudy = studiesStore.loadOne;
export const saveStudy = studiesStore.save;
export const deleteStudy = studiesStore.remove;

export const loadAllTemplates = templatesStore.loadAll;
export const loadTemplate = templatesStore.loadOne;
export const saveTemplate = templatesStore.save;
export const deleteTemplate = templatesStore.remove;

export function isFirestoreEnabled() {
  return !!db;
}

export function downloadStudiesJson(studies) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(studies, null, 2));
  const anchor = document.createElement('a');
  anchor.setAttribute('href', dataStr);
  anchor.setAttribute('download', 'studies.json');
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
