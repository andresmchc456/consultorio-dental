import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service'

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  private authService = inject(AuthService)
  private router = inject(Router)

  email: string = '';
  pass: string = '';
  errorMessage: string = '';


  onSubmit() {
    this.errorMessage = '';
    this.authService.login(this.email, this.pass)
      .then(() => {
        this.router.navigate(['/dashboard']);
      })
      .catch(err => {
        this.errorMessage = 'Credenciales incorrectas. Verifica tu correo y contraseña.';
        console.error(err);
      });
  }
}
