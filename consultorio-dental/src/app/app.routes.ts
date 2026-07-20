import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { Dashboard } from './components/dashboard/dashboard';
import { Agenda } from './components/agenda/agenda';
import { HistoriaClinica } from './components/historia-clinica/historia-clinica';
import { roleGuard } from './guards/role-guard';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },

    // Dashboard accesible por Administradores, Odontólogos y Pacientes
    {
        path: 'dashboard',
        component: Dashboard,
        canActivate: [roleGuard(['administrador', 'odontologo', 'paciente'])]
    },

    // Agenda clínica accesible solo por Administradores y Odontólogos
    {
        path: 'agenda',
        component: Agenda,
        canActivate: [roleGuard(['administrador', 'odontologo'])]
    },

    // Las Historias Clínicas son exclusivas de los Odontólogos
    {
        path: 'historia-clinica',
        component: HistoriaClinica,
        canActivate: [roleGuard(['odontologo'])]
    },

    // Comportamiento por defecto para rutas no existentes
    { path: '**', redirectTo: 'login' }
];
