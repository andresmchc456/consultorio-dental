import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EvolucionService, AnalisisEvolucion } from '../../services/evolucion.service';

@Component({
  selector: 'app-evolucion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './evolucion.component.html',
  styleUrl: './evolucion.component.scss',
})
export class EvolucionComponent implements OnInit {
  pacienteId: number = 1;
  analisis: AnalisisEvolucion | null = null;
  cargando: boolean = false;
  errorMsg: string = '';

  constructor(private evolucionService: EvolucionService) { }

  ngOnInit(): void { }

  generarAnalisis() {
    if (!this.pacienteId) return;

    this.cargando = true;
    this.errorMsg = '';
    this.analisis = null;

    this.evolucionService.obtenerAnalisisEvolucion(this.pacienteId).subscribe({
      next: (data) => {
        this.analisis = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al analizar evolución:', err);
        this.errorMsg = 'Ocurrió un error al procesar el análisis de evolución.';
        this.cargando = false;
      }
    });
  }
}

