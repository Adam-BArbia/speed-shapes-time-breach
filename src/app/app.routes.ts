import { Routes } from '@angular/router';
import { ControlPanel } from './pages/control-panel/control-panel';
import { DisplayScreen } from './pages/display-screen/display-screen';

export const routes: Routes = [
	{ path: '', redirectTo: 'display', pathMatch: 'full' },
	{ path: 'display', component: DisplayScreen },
	{ path: 'control', component: ControlPanel },
	{ path: '**', redirectTo: 'display' },
];
