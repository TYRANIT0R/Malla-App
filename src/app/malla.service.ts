import { Injectable } from '@angular/core';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class MallaService {
  constructor(private firestore: Firestore) {}

  async guardarMalla(uid: string, malla: any) {
    const ref = doc(this.firestore, `mallas/${uid}`);
    await setDoc(ref, malla);
  }

  async obtenerMalla(uid: string): Promise<any> {
    const ref = doc(this.firestore, `mallas/${uid}`);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  }
}