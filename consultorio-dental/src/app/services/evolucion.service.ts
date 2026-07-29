import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AnalisisEvolucion {
  paciente_id: number;
  resumen_evolucion: string;
  puntos_clave: string[];
  recomendaciones: string[];
  fecha_analisis: string;
}

@Injectable({
  providedIn: 'root',
})
export class EvolucionService {
  private apiUrl = 'http://127.0.0.1:8000/api/v1/evolucion';

  constructor(private http: HttpClient) { }

  obtenerAnalisisEvolucion(paciente_id: number): Observable<AnalisisEvolucion> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<AnalisisEvolucion>(`${this.apiUrl}/${paciente_id}`, { headers })

  }

}
