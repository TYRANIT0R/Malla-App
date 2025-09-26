import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';

import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatCardModule
  ],
  template: `
    <mat-toolbar color="primary" class="toolbar">
      <span>Editar Malla</span>
    </mat-toolbar>

    <div class="container">
      <mat-card class="form-card">
        <mat-form-field appearance="fill" class="field">
          <mat-label>Carrera</mat-label>
          <input matInput [(ngModel)]="careerName" placeholder="Ej: Ingeniería en Sistemas" />
        </mat-form-field>

        <mat-form-field appearance="fill" class="field number-field">
          <mat-label>Semestres</mat-label>
          <input matInput type="number" [(ngModel)]="semesterCount" min="1" max="20" />
        </mat-form-field>

        <button mat-flat-button color="primary" (click)="generateSemesters()" class="generate-btn">
          Generar
        </button>
      </mat-card>

      <div *ngIf="semesters.length" class="semesters-container">
        <mat-card *ngFor="let semester of semesters; let i = index; trackBy: trackByIndex" class="semester-card">
          <mat-card-header>
            <mat-card-title>Semestre {{ i + 1 }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div *ngFor="let subject of semester.subjects; let j = index; trackBy: trackByIndex" class="subject-row">
              <mat-form-field appearance="outline" class="subject-input">
                <input matInput [(ngModel)]="semester.subjects[j]" placeholder="Ramo" />
              </mat-form-field>
              <button mat-icon-button color="warn" (click)="removeSubject(i, j)">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
            <button mat-stroked-button color="accent" class="add-btn" (click)="addSubject(i)">
              <mat-icon>add</mat-icon> Agregar ramo
            </button>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="buttons-footer">
        <button mat-flat-button color="primary" class="save-btn" (click)="saveMalla()">Guardar</button>
        <button mat-stroked-button color="warn" class="back-btn" (click)="volverDashboard()">Volver al Dashboard</button>
      </div>

      <div *ngIf="mallaGuardada" style="color: green; font-weight: 600; margin-top: 12px;">
        ✅ ¡Malla guardada con éxito!
      </div>

      <button *ngIf="mallaGuardada" mat-stroked-button color="accent" (click)="abrirMalla()" style="margin-top: 8px;">
        Abrir Malla
      </button>
    </div>
  `,
  styles: [`
    .toolbar {
      font-weight: 600;
      font-size: 1.25rem;
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .container {
      max-width: 640px;
      margin: 20px auto;
      padding: 0 12px 40px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .form-card {
      padding: 16px;
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
    }
    .field {
      flex-grow: 1;
      min-width: 180px;
    }
    .number-field {
      max-width: 100px;
    }
    .generate-btn {
      height: 40px;
      min-width: 90px;
      align-self: flex-end;
    }
    .semesters-container {
      max-height: 55vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-right: 6px;
    }
    .semester-card {
      padding: 12px 14px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      background: #fff;
    }
    mat-card-title {
      font-weight: 600;
      font-size: 1.1rem;
    }
    .subject-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .subject-input {
      flex-grow: 1;
    }
    .add-btn {
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 6px;
      height: 34px;
      padding: 0 12px;
      margin-top: 6px;
      min-width: 130px;
    }
    .buttons-footer {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-top: 18px;
    }
    .save-btn, .back-btn {
      width: 140px;
      font-weight: 600;
    }
  `]
})
export class EditorComponent implements OnInit {
  careerName = '';
  semesterCount = 0;
  semesters: { subjects: string[] }[] = [];
  mallaGuardada = false;

  constructor(private auth: Auth, private firestore: Firestore, private router: Router) {}

  ngOnInit() {
    this.loadMalla();
  }

  async loadMalla() {
    const user = this.auth.currentUser;
    if (!user) return;

    try {
      const ref = doc(this.firestore, `users/${user.uid}/malla/data`);
      const snap = await getDoc(ref);
        const data = snap.data();
        const local = localStorage.getItem('mallaBackup');
if (local) {
  this.semesters = JSON.parse(local);
  this.semesterCount = this.semesters.length;
  this.mallaGuardada = true;
  console.warn('⚠️ Se cargó la malla desde localStorage');
}
  if (data) {
    this.careerName = data['careerName'] || '';
    const rawSemesters = data['semesters'] || [];
    this.semesters = rawSemesters.map((sem: any) => ({
      subjects: sem.subjects.map((s: any) => {
        // Permite soportar ambos formatos: string plano o objeto
        return typeof s === 'string' ? s : s.name || '';
      })
  }));
  this.semesterCount = this.semesters.length;
  this.mallaGuardada = true;
}
    } catch (error) {
      console.error('Error cargando la malla:', error);
    }
  }

  generateSemesters() {
    if (this.semesterCount < 1) return;

    if (this.semesters.length > this.semesterCount) {
      this.semesters = this.semesters.slice(0, this.semesterCount);
    } else {
      for (let i = this.semesters.length; i < this.semesterCount; i++) {
        this.semesters.push({ subjects: [''] });
      }
    }
  }

  addSubject(i: number) {
    this.semesters[i].subjects.push('');
  }

  removeSubject(i: number, j: number) {
    this.semesters[i].subjects.splice(j, 1);
  }

async saveMalla() {
  const user = this.auth.currentUser;
  if (!user) {
    alert('Debes iniciar sesión para guardar la malla.');
    return;
  }

  try {
    const ref = doc(this.firestore, `users/${user.uid}/malla/data`);
    await setDoc(ref, {
      careerName: this.careerName,
      semesters: this.semesters
    });
    alert('✅ Malla guardada con éxito.');
    this.router.navigate(['/dashboard']); // ⬅️ redirección automática
  } catch (error) {
    console.error('Error guardando la malla:', error);
    alert('Error guardando la malla. Intenta de nuevo.');
  }
}

  abrirMalla() {
    alert('✅ La malla está cargada. Puedes visualizarla o continuar editando.');
    // Puedes redirigir así si ya tienes ruta visual definida:
    // this.router.navigate(['/visual']);
  }

  volverDashboard() {
    this.router.navigate(['/dashboard']);
  }

  trackByIndex(index: number, item: any) {
    return index;
  }
}