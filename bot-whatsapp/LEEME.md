# Bot de WhatsApp – Citas de ultrasonido

Responde solo, 24/7: menú, precios, ubicación, preparación y toma de citas. Cada cita le llega al WhatsApp personal del doctor y se guarda en `citas.csv` (se abre con Excel).

## Editar precios, horario o dirección
Todo está en `config.js`.

## Puesta en marcha (una sola vez)
1. **Número dedicado**: un chip nuevo que NO esté usado en WhatsApp normal ni Business.
2. Entre a https://developers.facebook.com → *Crear app* → tipo *Empresa* → agregue *WhatsApp*.
3. En *WhatsApp → Configuración de la API*: registre su número y copie el **Token** (genere uno permanente con un *usuario del sistema*) y el **Phone number ID**.
4. Suba esta carpeta a un hosting con Node 18+ (Render.com o Railway.app; plan gratis o ~US$5/mes).
5. En el hosting cree las variables de `.env.example` con sus datos (`DOCTOR_WHATSAPP` = su número personal con 505, sin +).
6. Comando de inicio: `npm install && npm start`.
7. En Meta → *WhatsApp → Configuración → Webhook*: URL `https://SU-APP.onrender.com/webhook`, token de verificación = su `VERIFY_TOKEN`; suscríbase a **messages**.
8. Escriba "hola" al número del bot para probar.

Costo Meta: las respuestas a mensajes que el paciente inicia son gratuitas dentro de las 24 h.
