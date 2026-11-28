/* ================= DATOS ================= */
const SKINS=["#F6D3B5","#E2B08A","#C4875A","#8C5A3A","#FBE3D0","#6B4430"];
const HAIRS=["#2B1B12","#5A3A1E","#B5762E","#E8C267","#D2452F","#7A4BD1","#1F7FD1","#FF7EB6","#5FD3B8","#E9EEF4"];
const STYLES_H=[{id:"corto",name:"Corto"},{id:"largo",name:"Largo"},{id:"coleta",name:"Coleta"},{id:"coletas",name:"Dos coletas"},{id:"mono",name:"Moño"},{id:"rizado",name:"Rizado"},{id:"trenzas",name:"Trenzas"},{id:"melena",name:"Melena"},{id:"punta",name:"Picudo"}];
const EYES=["#14212E","#5A3A1E","#2E7BEF","#19A858","#7B4BD1"];
const SHIRTS=[
 {id:"s1",name:"Azul",c:"#2E7BEF",p:0},{id:"s2",name:"Roja",c:"#E2465C",p:0},{id:"s3",name:"Verde",c:"#19A858",p:0},
 {id:"s4",name:"Amarilla",c:"#F5C518",p:200,cur:"$"},{id:"s5",name:"Naranja",c:"#F28C28",p:200,cur:"$"},{id:"s6",name:"Turquesa",c:"#14B8A6",p:350,cur:"$"},
 {id:"s7",name:"Rosa neón",c:"#FF4FA3",p:20,cur:"mc"},{id:"s8",name:"Morado galaxia",c:"#6D3FD6",p:30,cur:"mc"},{id:"s9",name:"Bata de doctor",c:"#F7FAFC",p:50,cur:"mc"},{id:"s10",name:"Dorada",c:"#E2A511",p:90,cur:"mc"}
];
const PANTS=[
 {id:"p1",name:"Mezclilla",c:"#2F4F7F",p:0},{id:"p2",name:"Negro",c:"#2A2E35",p:0},{id:"p3",name:"Café",c:"#7A5232",p:150,cur:"$"},
 {id:"p4",name:"Blanco",c:"#E8EEF2",p:150,cur:"$"},{id:"p5",name:"Rosa",c:"#F48FB8",p:15,cur:"mc"},{id:"p6",name:"Verde menta",c:"#7FD8B5",p:15,cur:"mc"}
];
const HATS=[
 {id:"none",name:"Sin sombrero",icon:"🚫",p:0},{id:"gorra",name:"Gorra",icon:"🧢",p:300,cur:"$"},{id:"fiesta",name:"Gorro de fiesta",icon:"🥳",p:20,cur:"mc"},
 {id:"gato",name:"Orejas de gato",icon:"🐱",p:40,cur:"mc"},{id:"vaquero",name:"Sombrero vaquero",icon:"🤠",p:60,cur:"mc"},
 {id:"bombero",name:"Casco de bombero",icon:"⛑️",p:60,cur:"mc"},{id:"corona",name:"Corona",icon:"👑",p:150,cur:"mc"}
];
const VEHICLES=[
 {id:"skate",name:"Patineta",icon:"🛹",speed:1.45,p:600,cur:"$"},
 {id:"bici",name:"Bicicleta",icon:"🚲",speed:1.75,p:60,cur:"mc"},
 {id:"moto",name:"Moto eléctrica",icon:"🛵",speed:2.1,p:120,cur:"mc"},
 {id:"carro",name:"Carro",icon:"🚗",speed:2.5,p:250,cur:"mc"},
 {id:"oro",name:"Deportivo dorado",icon:"🏎️",speed:3.1,p:500,cur:"mc"}
];
const PETS=[
 {id:"perro",name:"Perrito",icon:"🐶",p:40,cur:"mc"},{id:"gato",name:"Gatito",icon:"🐱",p:40,cur:"mc"},
 {id:"conejo",name:"Conejo",icon:"🐰",p:60,cur:"mc"},{id:"pinguino",name:"Pingüino",icon:"🐧",p:80,cur:"mc"},
 {id:"unicornio",name:"Unicornio",icon:"🦄",p:150,cur:"mc"},{id:"dragon",name:"Dragón bebé",icon:"🐲",p:300,cur:"mc"}
];
const POWERS=[
 {id:"x2",name:"Doble dinero para siempre",icon:"💰",desc:"Todos los trabajos pagan el doble.",p:200,perm:true},
 {id:"iman",name:"Imán de monedas",icon:"🧲",desc:"Atrae monedas desde más lejos.",p:100,perm:true},
 {id:"salto",name:"Súper salto",icon:"🦘",desc:"Salta el doble de alto.",p:50,perm:true},
 {id:"turbo",name:"Turbo x3 · 15 minutos",icon:"⚡",desc:"Triplica el dinero de los trabajos por 15 minutos.",p:30}
];
const FURN=[
 {id:"cama",name:"Cama",icon:"🛏️",p:150},{id:"planta",name:"Planta",icon:"🪴",p:100},{id:"sofa",name:"Sofá",icon:"🛋️",p:300},
 {id:"lampara",name:"Lámpara",icon:"💡",p:200},{id:"tele",name:"Televisor",icon:"📺",p:600},{id:"libros",name:"Librero",icon:"📚",p:400},
 {id:"cuadro",name:"Cuadro",icon:"🖼️",p:350},{id:"acuario",name:"Acuario",icon:"🐠",p:900},{id:"juegos",name:"Consola",icon:"🎮",p:1200},
 {id:"piano",name:"Piano",icon:"🎹",p:1500},{id:"tina",name:"Tina",icon:"🛁",p:1000},{id:"trofeo",name:"Trofeo dorado",icon:"🏆",p:60,cur:"mc"}
];
const PACKS=[
 {id:"mc150",mc:150,price:"C$ 50",ic:"🪙",name:"Mini"},
 {id:"mc350",mc:350,price:"C$ 100",ic:"💰",name:"Básico"},
 {id:"mc800",mc:800,price:"C$ 200",ic:"💰💰",tag:"Popular",name:"Popular"},
 {id:"mc1500",mc:1500,price:"C$ 350",ic:"🏦",tag:"+ Valor",name:"Grande"},
 {id:"mc3000",mc:3000,price:"C$ 600",ic:"💎",tag:"Mejor valor",name:"Súper"}
];
const DAILY=[10,15,20,25,30,40,60];

const BUILDINGS=[
 {id:"hospital",name:"Hospital",icon:"🏥",bx:-60,bz:-60,f:"s",w:32,d:22,h:15,col:"#F4F7FA",roof:"#2BB5A0",sign:"#E2465C",job:"Atender pacientes"},
 {id:"escuela",name:"Escuela",icon:"🏫",bx:0,bz:-60,f:"s",w:28,d:20,h:11,col:"#F7D774",roof:"#C2553A",sign:"#2E6FD8",job:"Responder preguntas"},
 {id:"bomberos",name:"Bomberos",icon:"🚒",bx:60,bz:-60,f:"s",w:26,d:20,h:12,col:"#D9483B",roof:"#7A2A22",sign:"#F5B21B",job:"Apagar incendios"},
 {id:"super",name:"Supermercado",icon:"🛒",bx:-60,bz:0,f:"e",w:30,d:22,h:10,col:"#7BCB6B",roof:"#2F7D3A",sign:"#F28C28",job:"Trabajar de cajero"},
 {id:"cine",name:"Cine",icon:"🎬",bx:60,bz:0,f:"w",w:28,d:22,h:14,col:"#5B3FA8",roof:"#2C1F5E",sign:"#E2A511",job:"Atrapar palomitas"},
 {id:"casa",name:"Mi Casa",icon:"🏠",bx:-60,bz:60,f:"n",w:18,d:16,h:8,col:"#F2E6CF",roof:"#C2553A",sign:"#2E6FD8",job:"Decorar y regalo diario"},
 {id:"helados",name:"Heladería",icon:"🍦",bx:0,bz:60,f:"n",w:20,d:16,h:8,col:"#FFC7DE",roof:"#E55B9A",sign:"#7A4BD1",job:"Preparar helados"},
 {id:"mall",name:"Centro Comercial",icon:"🛍️",bx:60,bz:60,f:"n",w:30,d:22,h:13,col:"#BFE3F7",roof:"#2E6FD8",sign:"#E2465C",job:"Tienda de MediCoins"}
];
const FACE={n:{x:0,z:-1},s:{x:0,z:1},e:{x:1,z:0},w:{x:-1,z:0}};

const CASES=[
 {p:"🤒",t:"Tengo mucha fiebre",ok:"💊 Medicina para la fiebre"},
 {p:"🧒",t:"Me caí y me duele el brazo",ok:"🩻 Radiografía del brazo"},
 {p:"🤧",t:"Tengo tos y mocos",ok:"🍯 Jarabe para la tos"},
 {p:"🦵",t:"Me raspé la rodilla",ok:"🩹 Limpiar y poner curita"},
 {p:"🤰",t:"Quiero ver a mi bebé",ok:"🖥️ Ultrasonido"},
 {p:"🦷",t:"Me duele una muela",ok:"🪥 Ir al dentista"},
 {p:"🥵",t:"Estuve mucho al sol y me mareé",ok:"💧 Agua y sombra"},
 {p:"🤢",t:"Me duele la panza",ok:"🩺 Revisar la panza"},
 {p:"👓",t:"No veo bien la pizarra",ok:"👁️ Examen de la vista"},
 {p:"🐝",t:"Me picó una abeja",ok:"🧊 Hielo y crema"},
 {p:"😮‍💨",t:"Me cuesta respirar",ok:"🌬️ Nebulización"},
 {p:"🦶",t:"Me torcí el tobillo",ok:"🧊 Hielo y vendaje"},
 {p:"💉",t:"Me toca mi vacuna",ok:"💉 Poner la vacuna"},
 {p:"👂",t:"Me duele el oído",ok:"🔦 Revisar el oído"}
];
const PRODUCTS=[["🍎","Manzana"],["🍌","Banano"],["🥛","Leche"],["🍞","Pan"],["🧀","Queso"],["🥚","Huevos"],["🍚","Arroz"],["🫘","Frijoles"],["🍅","Tomate"],["🥕","Zanahoria"],["🍗","Pollo"],["🧃","Jugo"]];
const FLAVORS=[{n:"Fresa",c:"#F48FB8"},{n:"Chocolate",c:"#7A4A2A"},{n:"Limón",c:"#E9F27A"},{n:"Mora",c:"#7B4BD1"},{n:"Mango",c:"#F6A623"}];
const QUIZ=[
 ["¿Cuántos huesos tiene un adulto?",["206","100","52","500"]],
 ["¿Qué órgano bombea la sangre?",["El corazón","El hígado","El estómago","Los riñones"]],
 ["¿Cuál es la capital de Nicaragua?",["Managua","León","Granada","Juigalpa"]],
 ["¿Cuál es la moneda de Nicaragua?",["El córdoba","El peso","El dólar","El euro"]],
 ["¿Cuánto es 7 × 8?",["56","54","64","48"]],
 ["¿Cuánto es 15 + 27?",["42","32","41","52"]],
 ["¿Qué planeta es el más grande?",["Júpiter","Marte","Tierra","Venus"]],
 ["¿Qué necesitan las plantas para hacer su comida?",["Luz del sol","Arena","Sal","Leche"]],
 ["¿Cuántas patas tiene una araña?",["8","6","4","10"]],
 ["¿Con qué órgano respiramos?",["Los pulmones","El corazón","El cerebro","La piel"]],
 ["¿Cuál es el lago más grande de Nicaragua?",["El Cocibolca","El Xolotlán","El Apoyo","El Masaya"]],
 ["¿Cuántos días tiene una semana?",["7","5","10","6"]],
 ["¿Qué animal es el más grande del mundo?",["La ballena azul","El elefante","La jirafa","El tiburón"]],
 ["¿Cuánto es 100 − 37?",["63","73","67","53"]],
 ["¿Qué vitamina nos da el sol?",["La vitamina D","La vitamina C","La vitamina A","Ninguna"]],
 ["¿Cuál de estos es un volcán de Nicaragua?",["Momotombo","Everest","Fuji","Etna"]],
 ["¿Cuántos minutos tiene una hora?",["60","100","30","24"]],
 ["¿Qué se debe hacer antes de comer?",["Lavarse las manos","Correr","Dormir","Nada"]],
 ["¿Cuánto es 9 × 9?",["81","72","99","89"]],
 ["¿De qué color es la sangre?",["Roja","Azul","Verde","Amarilla"]]
];

