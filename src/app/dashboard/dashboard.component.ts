import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, signOut, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="container">
      <h2>Bienvenido al Dashboard</h2>

      <ng-container *ngIf="cargando; else opciones">
        <mat-spinner diameter="40" strokeWidth="4" color="primary"></mat-spinner>
        <p style="margin-top: 12px;">Verificando malla...</p>
      </ng-container>

      <ng-template #opciones>
        <div class="button-group">
          <button (click)="goToEditor()">Crear / Editar Malla</button>

          <button 
            [disabled]="!mallaDisponible" 
            (click)="goToVisual()" 
            [ngStyle]="{ opacity: mallaDisponible ? 1 : 0.5 }"
          >
            Ver y Tachar Ramos
          </button>

          <button class="logout" (click)="logout()">Cerrar Sesión</button>
        </div>

        <div *ngIf="!mallaDisponible" style="margin-top: 14px; color: gray;">
          ⚠️ Aún no tienes una malla guardada.
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .container {
      max-width: 400px;
      margin: 80px auto;
      padding: 30px;
      background: white;
      box-shadow: 0 0 12px rgba(0,0,0,0.1);
      border-radius: 10px;
      text-align: center;
      font-family: Arial, sans-serif;
    }
    h2 {
      color: #1976d2;
      margin-bottom: 30px;
    }
    .button-group {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    button {
      padding: 12px;
      font-size: 16px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      background-color: #1976d2;
      color: white;
      font-weight: bold;
      transition: background-color 0.3s ease;
    }
    button:hover {
      background-color: #155a9f;
    }
    button.logout {
      background-color: #d32f2f;
    }
    button.logout:hover {
      background-color: #a72828;
    }
  `]
})
export class DashboardComponent implements OnInit {
  mallaDisponible = false;
  cargando = true;

  constructor(private router: Router, private auth: Auth, private firestore: Firestore) {}

  ngOnInit() {
    setTimeout(() => this.verificarMallaGuardada(), 300); // Delay leve para mejor UX
  }

  async verificarMallaGuardada() {
    const user: User | null = this.auth.currentUser;
    if (!user) return;

    try {
      const ref = doc(this.firestore, `users/${user.uid}/malla/data`);
      const snap = await getDoc(ref);
      this.mallaDisponible = snap.exists();
    } catch (error) {
      console.error('Error al verificar malla:', error);
      this.mallaDisponible = false;
    } finally {
      this.cargando = false;
    }
  }

  goToEditor() {
    this.router.navigate(['/editor']);
  }

  goToVisual() {
    this.router.navigate(['/visual']);
  }

  async logout() {
    await signOut(this.auth);
    this.router.navigate(['/']);
  }
}