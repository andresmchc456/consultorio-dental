import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, collectionData } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Cita {
  id?: string;
  telefono_paciente: string;
  nombre_paciente: string;
  fecha: string;
  hora: string;
  odontologo: string;

}

@Injectable({
  providedIn: 'root',
})

export class AgendaService {
  private firestore = inject(Firestore);
  private http = inject(HttpClient);

  // URL local de nuestro servidor FastAPI desarrollado en la Fase 2
  private apiBackendUrl = 'http://127.0.0.1:8000/api/v1/notificar-cita';

  // OBTENER CITAS: Escucha en tiempo real la colección de Firestore
  obtenerCitas(): Observable<Cita[]> {
    const citasRef = collection(this.firestore, 'citas');
    return collectionData(citasRef, { idField: 'id' }) as Observable<Cita[]>;

  }

  // CREAR CITA: Guarda en base de datos y dispara el WhatsApp invocando a Python
  async agendarCita(nuevaCita: Cita): Promise<void> {
    const citasRef = collection(this.firestore, 'citas');

    // 1. Guardar registro histórico en Firestore
    await addDoc(citasRef, nuevaCita);

    // 2. Notificar vía API de Python (FastAPI) de forma asíncrona
    this.http.post(this.apiBackendUrl, nuevaCita).subscribe({
      next: (res) => console.log('Notificación de WhatsApp enviada exitosamente:', res),
      error: (err) => console.error('Error al conectar con el backend de WhatsApp:', err)
    });
  }
}



