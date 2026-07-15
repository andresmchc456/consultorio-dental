import { Injectable, inject } from "@angular/core";
import { Auth, signInWithEmailAndPassword, signOut, user } from '@angular/fire/auth';
import { Firestore, doc, docData, } from "@angular/fire/firestore";
import { Observable, of } from "rxjs";
import { switchMap, take } from "rxjs/operators";

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
  private auth = inject(Auth);
  private firestore = inject(Firestore);

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
  login(email: string, pass: string) {
    return signInWithEmailAndPassword(this.auth, email, pass);
  }

  // Cerrar sesión
  logout() {
    return signOut(this.auth);
  }


  // Método auxiliar rápido para verificar el rol actual del usuario logueado
  async getRolActua(): Promise<string | null> {
    const firebaseUser = this.auth.currentUser;
    if (!firebaseUser) return null;

    const userDocRef = doc(this.firestore, `usuarios/${firebaseUser.uid}`);
    // Hacemos una lectura única
    const profile = await docData(userDocRef).pipe(take(1)).toPromise() as UserProfile;
    return profile ? profile.rol : null;
  }

}

