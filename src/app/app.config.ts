import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { enableIndexedDbPersistence } from '@firebase/firestore';
import { environment } from '../environments/environment';



export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    provideFirebaseApp(() => initializeApp(environment.firebase)),

    provideFirestore(() => {
      const firestore = getFirestore();
      enableIndexedDbPersistence(firestore); // 🧠 Activa persistencia local
      return firestore;
    })
  ]
};