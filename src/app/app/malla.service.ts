import { Injectable } from '@angular/core';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class MallaService {
  constructor(private firestore: Firestore, private auth: Auth) {}

  async saveMalla(careerName: string, semesters: { subjects: string[] }[]) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    const docRef = doc(this.firestore, `mallas/${user.uid}`);
    await setDoc(docRef, { careerName, semesters });
  }

  async loadMalla() {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    const docRef = doc(this.firestore, `mallas/${user.uid}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as { careerName: string; semesters: { subjects: string[] }[] };
    } else {
      return null;
    }
  }
}
