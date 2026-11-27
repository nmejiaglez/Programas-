const $=id=>document.getElementById(id);
if(!window.THREE){$("loadmsg").textContent="No se pudo cargar el motor 3D. Revise su conexión a internet y vuelva a abrir.";return;}
const T=window.THREE;
const SAVE="miCiudad.v1";
const SALT="mc-ciudad-7f3a-hosp-2026";

