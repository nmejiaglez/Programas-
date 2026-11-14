// ====== EDITE AQUÍ los datos del consultorio ======
module.exports = {
  doctor: 'Dr. Néstor José Mejía González',
  titulo: 'Especialista en Radiología e Imagen · Código MINSA 37294',
  direccion: 'Policlínica LABEX, Juigalpa, Chontales',
  mapa: '', // pegue aquí el link de Google Maps (opcional)
  horario: 'Lunes a sábado, de 8:00 AM a 12:00 PM',
  zonaHoraria: 'America/Managua',
  horaApertura: 8, horaCierre: 12, diasAtencion: [1, 2, 3, 4, 5, 6], // 0 = domingo

  // Precios: edite libremente. Mama sin precio -> "consultar".
  estudios: [
    { nombre: 'Ultrasonido general', precio: 'C$ 900' },
    { nombre: 'Ultrasonido obstétrico', precio: 'C$ 700' },
    { nombre: 'Ultrasonido transfontanelar', precio: 'C$ 700' },
    { nombre: 'Ultrasonido de cuello / tiroides', precio: 'C$ 700' },
    { nombre: 'Ultrasonido de mama', precio: 'Consultar' },
    { nombre: 'Ultrasonido musculoesquelético', precio: 'C$ 700' },
    { nombre: 'Doppler de un miembro', precio: 'US$ 40' },
    { nombre: 'Doppler de ambos miembros', precio: 'US$ 70' },
    { nombre: 'Doppler carotídeo', precio: 'US$ 50' },
  ],

  preparacion:
    '• *Abdominal / general:* ayuno de 6 a 8 horas.\n' +
    '• *Pélvico, renal, vejiga, próstata u obstétrico temprano:* tomar 4 a 6 vasos de agua 1 hora antes y no orinar.\n' +
    '• *Obstétrico (2.º y 3.er trimestre), mama, cuello, transfontanelar, musculoesquelético y Doppler:* no requieren preparación.\n' +
    '• Traiga su orden médica y estudios previos si los tiene.',
};
