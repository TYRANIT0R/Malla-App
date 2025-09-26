import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container">
      <h2>Registro</h2>
      <input [(ngModel)]="email" type="email" placeholder="Correo electrónico" />
      <input [(ngModel)]="password" type="password" placeholder="Contraseña" />
      <button (click)="register()">Registrarse</button>
      <p>¿Ya tienes cuenta? <a routerLink="/">Inicia sesión aquí</a></p>
    </div>
  `,
  styles: [`
    .container {
      max-width: 320px;
      margin: 60px auto;
      padding: 30px;
      box-shadow: 0 0 10px rgba(0,0,0,0.15);
      border-radius: 8px;
      font-family: Arial, sans-serif;
      background-color: #fff;
      text-align: center;
    }
    h2 {
      margin-bottom: 20px;
      color: #1976d2;
    }
    input {
      display: block;
      width: 100%;
      margin-bottom: 15px;
      padding: 10px;
      border: 1px solid #bbb;
      border-radius: 5px;
      font-size: 14px;
      box-sizing: border-box;
      transition: border-color 0.3s ease;
    }
    input:focus {
      border-color: #1976d2;
      outline: none;
    }
    button {
      width: 100%;
      padding: 10px;
      background-color: #1976d2;
      color: white;
      font-weight: bold;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
      transition: background-color 0.3s ease;
    }
    button:hover {
      background-color: #155a9f;
    }
    p {
      margin-top: 20px;
      font-size: 14px;
      color: #555;
    }
    a {
      color: #1976d2;
      text-decoration: none;
      font-weight: bold;
    }
    a:hover {
      text-decoration: underline;
    }
  `]
})
export class RegisterComponent {
  email = '';
  password = '';

  constructor(private auth: Auth, private router: Router) {}

  async register() {
    try {
      await createUserWithEmailAndPassword(this.auth, this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (error) {
      alert('No se pudo registrar. Revisa el correo o la contraseña.');
      console.error('Error al registrar usuario:', error);
    }
  }
}
