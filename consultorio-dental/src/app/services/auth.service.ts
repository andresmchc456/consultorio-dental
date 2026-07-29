import { Injectable, inject } from "@angular/core";
import { Auth, signInWithEmailAndPassword, signOut, user } from '@angular/fire/auth';
import { Firestore, doc, docData, getDoc } from "@angular/fire/firestore";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, of, firstValueFrom } from "rxjs";
import { switchMap } from "rxjs/operators";

export interface UserProfile {
  uid: string;
  nombre: string;
  email: string;
  rol: 'administrador' | 'odontologo' | 'paciente';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public auth = inject(Auth);
  private firestore = inject(Firestore);
  private http = inject(HttpClient);

  private backendLoginUrl = 'http://127.0.0.1:8000/api/v1/auth/login';

  //Observable que emite el estado del usuario de Auth
  user$ = user(this.auth);

  // Obtiene el perfil completo (incluyendo el rol) guardado en Firestore
  get userProfile$(): Observable<UserProfile | null> {
    return this.user$.pipe(
      switchMap(firebaseUser => {
        if (!firebaseUser) return of(null);
        const userDocRef = doc(this.firestore, `usuarios/${firebaseUser.uid}`);
        return docData(userDocRef, { idField: 'uid' }) as Observable<UserProfile>;
      })
    );
  }

  // Iniciar sesión
  async login(email: string, pass: string) {
    const userCredential = await signInWithEmailAndPassword(this.auth, email, pass);
    await this.obtenerYGuardarTokenBackend(email, pass);
    return userCredential;
  }

  // Solicitar y guardar token JWT de FastAPI
  async obtenerYGuardarTokenBackend(email: string = 'admin@dental.com', pass: string = 'admin123'): Promise<string | null> {
    try {
      const body = new URLSearchParams();
      body.set('username', email);
      body.set('password', pass);

      const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
      const response = await firstValueFrom(
        this.http.post<{ access_token: string }>(this.backendLoginUrl, body.toString(), { headers })
      );

      if (response && response.access_token) {
        localStorage.setItem('access_token', response.access_token);
        return response.access_token;
      }
    } catch (err) {
      console.warn('Error al solicitar token de backend FastAPI:', err);
    }
    return null;
  }

  // Cerrar sesión
  logout() {
    localStorage.removeItem('access_token');
    return signOut(this.auth);
  }

  // Método auxiliar rápido para verificar el rol actual del usuario logueado
  async getRolActua(): Promise<string | null> {
    const firebaseUser = this.auth.currentUser;
    if (!firebaseUser) return null;

    const userDocRef = doc(this.firestore, `usuarios/${firebaseUser.uid}`);
    // Hacemos una lectura única usando getDoc (evita error de injection context de RxJS docData)
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const profile = docSnap.data() as UserProfile;
      return profile ? profile.rol : null;
    }
    return null;
  }

}



