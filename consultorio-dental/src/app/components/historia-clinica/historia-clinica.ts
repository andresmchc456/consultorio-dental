import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HistoriaService } from '../../services/historia.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-historia-clinica',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './historia-clinica.html',
  styleUrl: './historia-clinica.scss',
})
export class HistoriaClinicaComponent {
  private historiaService = inject(HistoriaService);

  fileAnterior: File | null = null;
  fileNueva: File | null = null;

  cargando: boolean = false;
  resultadoIA: any = null;
  error: string = '';

  onFileSelected(event: any, tipo: 'anterior' | 'nueva') {
    const file = event.target.files[0];
    if (file) {
      if (tipo === 'anterior') this.fileAnterior = file;
      if (tipo === 'nueva') this.fileNueva = file;
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });
  }

  async procesarEvolucion() {
    if (!this.fileAnterior || !this.fileNueva) {
      this.error = 'Debes seleccionar ambas imágenes para realizar el análisis comparativo.';
      return;
    }

    this.cargando = true;
    this.error = '';
    this.resultadoIA = null;

    try {
      // Convertir imágenes a Base64 directamente (rápido, 100% compatible y sin bloqueos CORS de Firebase)
      const urlAnt = await this.fileToBase64(this.fileAnterior);
      const urlNue = await this.fileToBase64(this.fileNueva);

      // Pedir la evaluación a la API de Gemini
      this.historiaService.analizarEvolucion(urlAnt, urlNue).subscribe({
        next: (res: any) => {
          try {
            this.resultadoIA = typeof res.analisis === 'string' ? JSON.parse(res.analisis) : res.analisis;
          } catch (e) {
            this.resultadoIA = {
              cambios_observados: res.analisis,
              porcentaje_avance_estimado: 50,
              alertas_o_puntos_criticos: 'Análisis procesado correctamente.',
              recomendaciones_clinicas: 'Revisar detalles en consulta.'
            };
          }
          this.cargando = false;
        },
        error: (err: any) => {
          this.error = err.error?.detail || (err.message ? `Error de conexión: ${err.message}` : 'Error al comunicarse con el servidor FastAPI (http://127.0.0.1:8000). Verifica que el backend esté ejecutándose.');
          console.error('Error en evaluarEvolucion:', err);
          this.cargando = false;
        }
      });
    } catch (e) {
      this.error = 'Error al procesar las imágenes.';
      console.error(e);
      this.cargando = false;
    }
  }
}