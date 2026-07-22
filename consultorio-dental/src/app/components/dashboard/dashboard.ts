import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService, UserProfile } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  usuario: UserProfile | null = null;
  ngOnInit(): void {
    // Escuchar la información del usuario autenticado
    this.authService.userProfile$.subscribe(profile => {
      this.usuario = profile;
    });
  }

  cerrarSesion() {
    this.authService.logout().then(() => {
      this.router.navigate(['/login'])
    });
  }



}
