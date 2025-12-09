// Firestore repository wrapper
// Centralize Firestore primitives and db access

import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  runTransaction,
  collectionGroup,
  Timestamp
} from 'firebase/firestore';

export {
  db,
  collection,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  runTransaction,
  collectionGroup,
  Timestamp,
};
