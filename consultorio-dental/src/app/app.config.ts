import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { provideHttpClient } from '@angular/common/http';

const firebaseConfig = {
  apiKey: "AIzaSyA-txL-jpxNv17QzmEYLwXZ6-1_uWAXQBk",
  authDomain: "consultorio-inteligente-dental.firebaseapp.com",
  projectId: "consultorio-inteligente-dental",
  storageBucket: "consultorio-inteligente-dental.firebasestorage.app",
  messagingSenderId: "1045761507275",
  appId: "1:1045761507275:web:3fb94ccb5019a21ac5804e"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    provideHttpClient()
  ]
};
