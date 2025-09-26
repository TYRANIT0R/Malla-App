import { Routes } from '@angular/router';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { EditorComponent } from './editor/editor.component';
import { VisualComponent } from './visual/visual.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'editor', component: EditorComponent },
  { path: 'visual', component: VisualComponent },
  { path: '**', redirectTo: '' } 
];
