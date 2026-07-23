import { inject, Injectable } from "@angular/core";
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AnalisisResponse {
  analisis: string; // Respuesta entregada por Gemini en FastAPI
}

@Injectable({
  providedIn: 'root'
})
export class HistoriaService {
  private storage = inject(Storage);
  private http = inject(HttpClient);

  // URL local de tu API en FastAPI para análisis con Gemini
  private apiBackendUrl = 'http://127.0.0.1:8000/api/v1/analizar-progreso';

  // 1. Subir imagen a Firebase Storage y obtener su URL pública
  async subirImagen(file: File, pacienteId: string): Promise<string> {
    const filePath = `historias/${pacienteId}/${Date.now()}_${file.name}`;
    const storageRef = ref(this.storage, filePath);

    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  }

  // 2. Enviar las URLs al backend en Python para procesar con Gemini
  analizarEvolucion(urlAnterior: string, urlNueva: string): Observable<AnalisisResponse> {
    return this.http.post<AnalisisResponse>(this.apiBackendUrl, {
      url_imagen_anterior: urlAnterior,
      url_imagen_nueva: urlNueva
    });
  }
}
