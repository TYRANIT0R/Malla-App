import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ViewEncapsulation,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

@Component({
  selector: 'app-visual',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './visual.component.html',
  styleUrls: ['./visual.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class VisualComponent implements OnInit, OnDestroy {
  careerName = '';
  semesters: { subjects: string[] }[] = [];
  loaded = false;

  // UI
  q = '';
  dense = false;

  // Tamaño (zoom real con CSS variables)
  zoomLevel = 1; // 0.8–1.4

  // Datos de malla / colores / fondo
  tachados: Set<string> = new Set();
  semesterColors: string[] = [];
  subjectColors: string[][] = []; // en memoria 2D (pero se guarda como mapa)
  semesterBorders: string[] = [];
  backgroundColor = '#ffffff';
  backgroundImageUrl = '';
  showColorPanel = false;
  showRequisitesPanel = false;
  prerequisites: { [key: string]: string } = {};
  editablePrerequisites: { [key: string]: string } = {};
  semesterBoxColors: string[] = [];

  creditsMap: Record<string, number> = {};

  private cachedUser: User | null = null;

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  /* =========================
     Helpers usuario/auth
  ========================= */
  private getUser(): Promise<User> {
    if (this.cachedUser) return Promise.resolve(this.cachedUser);
    return new Promise<User>((resolve, reject) => {
      const unsub = onAuthStateChanged(this.auth, (u) => {
        if (u) { this.cachedUser = u; unsub(); resolve(u); }
      }, reject);
    });
  }

  /* =========================
     Helpers colores (map <-> 2D)
  ========================= */
  private buildColorMap(): Record<string, string> {
    const map: Record<string, string> = {};
    for (let i = 0; i < this.subjectColors.length; i++) {
      const row = this.subjectColors[i] || [];
      for (let j = 0; j < row.length; j++) {
        const c = row[j];
        if (c && c !== '#ffffff') map[`${i}-${j}`] = c;
      }
    }
    return map;
  }

  private applyColorMap(colorMap?: Record<string, string>) {
    this.subjectColors = this.semesters.map((s, i) =>
      s.subjects.map((_, j) => (colorMap?.[`${i}-${j}`] || '#ffffff'))
    );
  }

  /* =========================
     Zoom (aplica a variable CSS)
  ========================= */
  private applyZoom(persist = false) {
    const z = Math.max(0.8, Math.min(1.4, Number(this.zoomLevel) || 1));
    this.zoomLevel = z;
    document.documentElement.style.setProperty('--zoom', String(z));
    if (persist) this.saveMalla();
  }
  updateZoom(persist: boolean = true) { this.applyZoom(persist); }

  /* =========================
     Ciclo vida
  ========================= */
  async ngOnInit() {
    try {
      const user = await this.getUser();
      const ref = doc(this.firestore, `users/${user.uid}/malla/data`);
      const snap = await getDoc(ref);
      const data = snap.data() as any;

      if (data) {
        this.careerName = data['careerName'] || '';

        const rawSemesters = (data['semesters'] || []) as { subjects: string[] }[];
        this.semesters = rawSemesters.map(s => ({
          subjects: (s?.subjects || []).filter(x => x && x.trim()),
        }));

        this.tachados = new Set(data['tachados'] || []);
        this.semesterColors = data['semesterColors'] || [];
        this.semesterBoxColors = data['semesterBoxColors'] || [];
        this.semesterBorders = data['semesterBorders'] || [];
        this.backgroundColor = data['backgroundColor'] || '#ffffff';
        this.backgroundImageUrl = data['backgroundImageUrl'] || '';
        this.prerequisites = data['prerequisites'] || {};
        this.editablePrerequisites = { ...this.prerequisites };

        const colorMap: Record<string, string> | undefined = data['subjectColorsMap'] || undefined;
        this.applyColorMap(colorMap);

        // Restaurar zoom (si existe)
        if (typeof data['zoomLevel'] === 'number') {
          // venía guardado como número (0.8–1.4) o porcentaje/float
          const z = Number(data['zoomLevel']);
          if (!Number.isNaN(z)) this.zoomLevel = z <= 1.4 ? z : (z / 100);
        }
        this.applyZoom(false);
      } else {
        // Sin doc: inicializa subjectColors acorde a semesters + zoom por defecto
        this.applyColorMap(undefined);
        this.applyZoom(false);
      }

      this.loaded = true;
      this.cdr.detectChanges();
      console.log('[Malla:init] OK');
    } catch (e) {
      console.error('[Malla:init] Error:', e);
    }
  }

  ngOnDestroy() {
    // best-effort
    this.saveMalla().catch(() => {});
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(_e: BeforeUnloadEvent) {
    // best-effort
  }

  /* =========================
     UI
  ========================= */
  async goBack() { await this.saveMalla(); this.router.navigate(['/app-dashboard']); }
  toggleDense(){ this.dense = !this.dense; }
  onSearchChange(){}
  toggleColorPanel(){ this.showColorPanel = !this.showColorPanel; }
  toggleRequisitesPanel(){ this.showRequisitesPanel = !this.showRequisitesPanel; }

  get progressPct(): number {
    const total = this.semesters.reduce((a, s) => a + s.subjects.length, 0);
    const done = this.tachados.size;
    return total ? Math.round(done * 100 / total) : 0;
  }
  totalIn(i: number){ return this.semesters[i]?.subjects.length || 0; }
  approvedIn(i: number){ return this.semesters[i]?.subjects.filter((_, j) => this.isTachado(i, j)).length || 0; }

  isTachado(i: number, j: number){ return this.tachados.has(`${i}-${j}`); }

  async toggleTachado(i: number, j: number) {
    const key = `${i}-${j}`;
    if (this.tachados.has(key)) this.tachados.delete(key);
    else this.tachados.add(key);
    await this.saveMalla();
  }

  canTachar(i: number, j: number): boolean {
    const key = `${i}-${j}`;
    const req = this.prerequisites[key];
    if (!req) return true;
    const parts = req.split(',').map(x => x.trim());
    return parts.every(part => {
      if (/^\d+-\d+$/.test(part)) {
        const [ri, rj] = part.split('-').map(Number);
        return this.tachados.has(`${ri}-${rj}`);
      } else {
        return this.semesters.some((sem, si) =>
          sem.subjects.some((subj, sj) =>
            subj.toLowerCase() === part.toLowerCase() && this.tachados.has(`${si}-${sj}`)
          )
        );
      }
    });
  }

  prereqText(i: number, j: number){
    return this.prerequisites[`${i}-${j}`] || 'Sin prerrequisitos';
  }

  visible(i: number, j: number){
    const name = this.semesters[i].subjects[j];
    if (this.q && !name.toLowerCase().includes(this.q.toLowerCase())) return false;
    return true;
  }

  async onSubjectColorChange(_i: number, _j: number){ await this.saveMalla(); }
  async onSemesterColorChange(_i: number){ await this.saveMalla(); }
  async onSemesterBoxColorChange(_i: number){ await this.saveMalla(); }
  async onBackgroundChange(){ await this.saveMalla(); }

  isValidPrerequisiteFormat(value: string): boolean {
    return (
      value === '' ||
      value.split(',').every(part =>
        /^\d+-\d+$/.test(part.trim()) || /^[a-zA-ZáéíóúÁÉÍÓÚüÜ0-9\s]+$/.test(part.trim())
      )
    );
  }

  async updateRequisites(i: number, j: number){
    const key = `${i}-${j}`;
    const value = this.editablePrerequisites[key];
    if (this.isValidPrerequisiteFormat(value)) {
      this.prerequisites[key] = value;
      await this.saveMalla();
    }
  }

  /* =========================
     Persistencia
  ========================= */
  async saveMalla() {
    let user: User;
    try { user = await this.getUser(); }
    catch { console.warn('[Malla:save] Sin usuario'); return; }

    const subjectColorsMap = this.buildColorMap();

    const payload: any = {
      careerName: this.careerName,
      semesters: this.semesters,
      tachados: Array.from(this.tachados),
      semesterColors: this.semesterColors,
      subjectColorsMap,
      semesterBoxColors: this.semesterBoxColors,
      semesterBorders: this.semesterBorders,
      backgroundColor: this.backgroundColor,
      backgroundImageUrl: this.backgroundImageUrl,
      prerequisites: this.prerequisites,
      zoomLevel: this.zoomLevel,         // guarda 0.8–1.4
      lastSavedAt: new Date().toISOString(),
    };

    try {
      const ref = doc(this.firestore, `users/${user.uid}/malla/data`);
      await setDoc(ref, payload, { merge: true });
      console.log('[Malla:save] OK');
    } catch (err) {
      console.error('[Malla:save] ERROR:', err);
    }
  }

  /* =========================
     ngFor trackBy
  ========================= */
  trackSem = (_: number, s: { subjects: string[] }) => s;
}
