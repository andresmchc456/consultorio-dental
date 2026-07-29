import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { AuthService } from './auth.service';

export interface ReporteCitas {
  citas_mes_actual: number;
  tasa_asistencia_porcentaje: number;
  mensajes_whatsapp_enviados: number;
  resumen_estados: { [key: string]: number };
}

@Injectable({
  providedIn: 'root',
})
export class ReportesService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'http://127.0.0.1:8000/api/v1/reportes/citas';

  private async asegurarToken(): Promise<string | null> {
    let token = localStorage.getItem('access_token');
    if (!token || token === 'null' || token === 'undefined') {
      const email = this.authService.auth.currentUser?.email || 'admin@dental.com';
      token = await this.authService.obtenerYGuardarTokenBackend(email, 'admin123');
    }
    return token;
  }

  obtenerReporteCitas(): Observable<ReporteCitas> {
    return from(this.asegurarToken()).pipe(
      switchMap((token) => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.http.get<ReporteCitas>(this.apiUrl, { headers });
      })
    );
  }
}

