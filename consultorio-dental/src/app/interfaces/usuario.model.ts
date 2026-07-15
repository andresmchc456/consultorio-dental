export interface Usuario {
    uid: string;
    nombre: string;
    email: string;
    rol: 'administrador' | 'odontologo' | 'paciente';
}
