import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReportesService, ReporteCitas } from '../../services/reportes.service';

@Component({
  selector: 'app-reportes',
  imports: [CommonModule, RouterLink],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss',
})
export class ReportesComponent implements OnInit {
  reporte: ReporteCitas | null = null;
  cargando: boolean = true;
  errorMsg: string = '';

  constructor(private reportesService: ReportesService) { }

  ngOnInit(): void {
    this.cargarReportes();
  }

  cargarReportes(): void {
    this.cargando = true;
    this.errorMsg = '';
    this.reportesService.obtenerReporteCitas().subscribe({
      next: (data) => {
        this.reporte = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al obtener reportes:', err);
        if (err.status === 0) {
          this.errorMsg = 'Error de conexión: No se pudo conectar con el servidor backend FastAPI (http://127.0.0.1:8000). Asegúrate de tener ejecutando el backend.';
        } else if (err.status === 401) {
          this.errorMsg = 'No autorizado: Por favor inicia sesión nuevamente para consultar los reportes.';
        } else {
          this.errorMsg = 'No se pudieron cargar las métricas de reportes.';
        }
        this.cargando = false;
      }
    });
  }

}
