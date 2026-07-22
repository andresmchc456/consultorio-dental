import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgendaService, Cita } from '../../services/agenda.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './agenda.html',
  styleUrl: './agenda.scss'
})
export class AgendaComponent implements OnInit {
  private agendaService = inject(AgendaService);

  citas: Cita[] = [];
  
  nuevaCita: Cita = {
    nombre_paciente: '',
    telefono_paciente: '',
    fecha: '',
    hora: '',
    odontologo: ''
  };

  cargando: boolean = false;
  mensajeExito: boolean = false;

  ngOnInit(): void {
    this.agendaService.obtenerCitas().subscribe(data => {
      this.citas = data;
    });
  }

  async onSubmit() {
    this.cargando = true;
    this.mensajeExito = false;
    
    try {
      // 1. Formatear número de teléfono (Limpiar espacios/guiones y asegurar +57 para Colombia)
      let telefonoLimpio = this.nuevaCita.telefono_paciente.replace(/\D/g, '');
      if (!telefonoLimpio.startsWith('57') && telefonoLimpio.length === 10) {
        telefonoLimpio = '57' + telefonoLimpio;
      }

      // Guardar el teléfono formateado en el objeto
      this.nuevaCita.telefono_paciente = '+' + telefonoLimpio;

      // 2. Guardar la cita en Firestore a través de tu servicio
      await this.agendaService.agendarCita(this.nuevaCita);
      
      // 3. Construir la plantilla del mensaje
      const mensaje = `Hola ${this.nuevaCita.nombre_paciente}, tu cita médica ha sido agendada para el día ${this.nuevaCita.fecha} a las ${this.nuevaCita.hora} con el especialista ${this.nuevaCita.odontologo}.`;
      
      // Codificar el texto para URL
      const mensajeURLEncode = encodeURIComponent(mensaje);

      // 4. Crear el enlace directo de WhatsApp API
      const urlWhatsapp = `https://api.whatsapp.com/send?phone=${telefonoLimpio}&text=${mensajeURLEncode}`;

      // 5. Abrir WhatsApp en una nueva pestaña automáticamente
      window.open(urlWhatsapp, '_blank');

      this.mensajeExito = true;

      // 6. Limpiar el formulario
      this.nuevaCita = { 
        nombre_paciente: '', 
        telefono_paciente: '', 
        fecha: '', 
        hora: '', 
        odontologo: '' 
      };

    } catch (error) {
      console.error("Error al agendar la cita:", error);
    } finally {
      this.cargando = false;
    }
  }
}