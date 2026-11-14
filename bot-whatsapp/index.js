// Bot de WhatsApp para citas – WhatsApp Cloud API (Meta)
require('dotenv').config();
const express = require('express');
const fs = require('fs');
const C = require('./config');

const { WHATSAPP_TOKEN, PHONE_NUMBER_ID, VERIFY_TOKEN, DOCTOR_WHATSAPP, PORT = 3000 } = process.env;
const app = express();
app.use(express.json());

// Estado de cada conversación (se guarda en disco para no perderlo al reiniciar)
const ARCHIVO = __dirname + '/conversaciones.json';
let estados = fs.existsSync(ARCHIVO) ? JSON.parse(fs.readFileSync(ARCHIVO, 'utf8')) : {};
const guardar = () => fs.writeFileSync(ARCHIVO, JSON.stringify(estados, null, 2));

async function enviar(to, texto) {
  try {
  const r = await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: texto } }),
  });
  if (!r.ok) console.error('Error al enviar:', await r.text());
  } catch (e) { console.error('Sin conexión con WhatsApp:', e.message); }
}

function abierto() {
  const ahora = new Date(new Date().toLocaleString('en-US', { timeZone: C.zonaHoraria }));
  return C.diasAtencion.includes(ahora.getDay()) && ahora.getHours() >= C.horaApertura && ahora.getHours() < C.horaCierre;
}

const MENU =
  `👋 ¡Hola! Gracias por comunicarse con el consultorio del *${C.doctor}*, ${C.titulo}.\n\n` +
  'Responda con un número:\n' +
  '1️⃣ Agendar cita\n2️⃣ Estudios y precios\n3️⃣ Ubicación y horario\n4️⃣ Preparación para su estudio\n5️⃣ Hablar con el doctor\n\n' +
  '_Escriba *menu* en cualquier momento para volver aquí._';

const listaEstudios = () => C.estudios.map((e, i) => `${i + 1}. ${e.nombre} — *${e.precio}*`).join('\n');

async function responder(tel, nombrePerfil, texto) {
  const t = texto.trim();
  const tl = t.toLowerCase();
  let s = estados[tel] || (estados[tel] = { paso: 'nuevo' });

  if (s.paso === 'nuevo' || ['menu', 'menú', 'hola', 'inicio', '0'].includes(tl)) {
    s.paso = 'menu';
    let msg = MENU;
    if (!abierto()) msg = `🕐 En este momento estamos fuera de horario (${C.horario}). Puede dejar su solicitud de cita y le confirmaremos al abrir.\n\n` + msg;
    return enviar(tel, msg);
  }

  // ---- Flujo de cita ----
  if (s.paso === 'cita_nombre') { s.nombre = t; s.paso = 'cita_edad'; return enviar(tel, '¿Qué *edad* tiene el paciente?'); }
  if (s.paso === 'cita_edad') { s.edad = t; s.paso = 'cita_estudio'; return enviar(tel, '¿Qué estudio necesita? Responda con el número:\n\n' + listaEstudios()); }
  if (s.paso === 'cita_estudio') {
    const e = C.estudios[parseInt(t, 10) - 1];
    s.estudio = e ? `${e.nombre} (${e.precio})` : t;
    s.paso = 'cita_dia';
    return enviar(tel, `¿Qué *día* prefiere? Atendemos ${C.horario}.`);
  }
  if (s.paso === 'cita_dia') {
    s.dia = t; s.paso = 'menu';
    await enviar(tel,
      `✅ *Solicitud recibida*\n\nPaciente: ${s.nombre}\nEdad: ${s.edad}\nEstudio: ${s.estudio}\nDía preferido: ${s.dia}\n\n` +
      'Le confirmaremos la hora en breve. Recuerde traer su orden médica.\n\n*Preparación:*\n' + C.preparacion);
    if (DOCTOR_WHATSAPP) await enviar(DOCTOR_WHATSAPP,
      `📅 *Nueva solicitud de cita*\nPaciente: ${s.nombre}\nEdad: ${s.edad}\nEstudio: ${s.estudio}\nDía: ${s.dia}\nWhatsApp: +${tel} (${nombrePerfil})`);
    fs.appendFileSync(__dirname + '/citas.csv',
      [new Date().toLocaleString('es-NI', { timeZone: C.zonaHoraria }), s.nombre, s.edad, s.estudio, s.dia, tel].map(x => `"${String(x).replace(/"/g, "'")}"`).join(',') + '\n');
    return;
  }

  // ---- Menú principal ----
  switch (tl) {
    case '1': s.paso = 'cita_nombre'; return enviar(tel, '📝 Con gusto. Escriba el *nombre completo* del paciente:');
    case '2': return enviar(tel, '🩺 *Estudios y precios*\n\n' + listaEstudios() + '\n\nEscriba *1* para agendar o *menu* para volver.');
    case '3': return enviar(tel, `📍 *${C.direccion}*\n🕐 ${C.horario}` + (C.mapa ? `\n🗺️ ${C.mapa}` : ''));
    case '4': return enviar(tel, '📋 *Preparación*\n\n' + C.preparacion);
    case '5':
      s.paso = 'humano';
      if (DOCTOR_WHATSAPP) await enviar(DOCTOR_WHATSAPP, `🔔 +${tel} (${nombrePerfil}) quiere hablar con usted.`);
      return enviar(tel, '👨‍⚕️ Le hemos avisado al doctor; le responderá personalmente lo antes posible. Escriba *menu* para volver al menú.');
  }
  if (s.paso === 'humano') return; // el doctor contesta en persona
  return enviar(tel, 'No entendí su respuesta 🙏. Escriba *menu* para ver las opciones.');
}

// Verificación del webhook (Meta)
app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VERIFY_TOKEN) return res.send(req.query['hub.challenge']);
  res.sendStatus(403);
});

// Mensajes entrantes
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    const v = req.body?.entry?.[0]?.changes?.[0]?.value;
    const m = v?.messages?.[0];
    if (!m) return;
    const nombre = v.contacts?.[0]?.profile?.name || '';
    const texto = m.type === 'text' ? m.text.body : m.interactive?.button_reply?.title || 'menu';
    await responder(m.from, nombre, texto);
    guardar();
  } catch (e) { console.error(e); }
});

app.listen(PORT, () => console.log(`Bot activo en el puerto ${PORT}`));
