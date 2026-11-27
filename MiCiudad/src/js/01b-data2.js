/* ---------- Catálogo ampliado ---------- */
PANTS.push(
 {id:"f1",name:"Falda rosa",c:"#F48FB8",p:0,skirt:true},
 {id:"f2",name:"Falda azul",c:"#5B8DEF",p:120,cur:"$",skirt:true},
 {id:"f3",name:"Falda de cuadros",c:"#C23B4E",p:180,cur:"$",skirt:true},
 {id:"f4",name:"Vestido de gala",c:"#B5179E",p:60,cur:"mc",skirt:true,gala:true},
 {id:"f5",name:"Vestido dorado",c:"#E2A511",p:120,cur:"mc",skirt:true,gala:true}
);
SHIRTS.push(
 {id:"s11",name:"Uniforme azul",c:"#2A4C8F",p:300,cur:"$"},
 {id:"s12",name:"Camisa de rayas",c:"#F4F1E8",p:250,cur:"$"},
 {id:"s13",name:"Negra elegante",c:"#1E2329",p:25,cur:"mc"},
 {id:"s14",name:"Arcoíris",c:"#FF7A59",p:70,cur:"mc"}
);
HATS.push(
 {id:"chef",name:"Gorro de chef",icon:"👨‍🍳",p:200,cur:"$"},
 {id:"policia",name:"Gorra de policía",icon:"👮",p:200,cur:"$"},
 {id:"flores",name:"Corona de flores",icon:"🌸",p:25,cur:"mc"},
 {id:"tiara",name:"Tiara de cristal",icon:"💎",p:80,cur:"mc"},
 {id:"astronauta",name:"Casco de astronauta",icon:"🧑‍🚀",p:120,cur:"mc"}
);
const ACCS=[
 {id:"none",name:"Nada",icon:"🚫",p:0},
 {id:"mochila",name:"Mochila",icon:"🎒",p:250,cur:"$"},
 {id:"capa_roja",name:"Capa de héroe",icon:"🦸",p:40,cur:"mc"},
 {id:"capa_morada",name:"Capa de mago",icon:"🧙",p:40,cur:"mc"},
 {id:"alas_mariposa",name:"Alas de mariposa",icon:"🦋",p:120,cur:"mc",wings:true},
 {id:"alas_angel",name:"Alas de ángel",icon:"🪽",p:150,cur:"mc",wings:true},
 {id:"alas_dragon",name:"Alas de dragón",icon:"🐉",p:250,cur:"mc",wings:true},
 {id:"jetpack",name:"Mochila cohete",icon:"🚀",p:300,cur:"mc",wings:true}
];
const FACES=[
 {id:"none",name:"Nada",icon:"🚫",p:0},
 {id:"lentes",name:"Lentes de sol",icon:"🕶️",p:200,cur:"$"},
 {id:"mascarilla",name:"Mascarilla",icon:"😷",p:100,cur:"$"},
 {id:"corazon",name:"Lentes de corazón",icon:"😍",p:25,cur:"mc"},
 {id:"estrella",name:"Lentes de estrella",icon:"🤩",p:30,cur:"mc"},
 {id:"antifaz",name:"Antifaz",icon:"🎭",p:35,cur:"mc"}
];
const NECKS=[
 {id:"none",name:"Nada",icon:"🚫",p:0},
 {id:"corbatin",name:"Corbatín",icon:"🎀",p:100,cur:"$"},
 {id:"bufanda",name:"Bufanda",icon:"🧣",p:150,cur:"$"},
 {id:"perlas",name:"Collar de perlas",icon:"📿",p:30,cur:"mc"},
 {id:"medalla",name:"Medalla de oro",icon:"🥇",p:60,cur:"mc"}
];
const ROLES=[
 {id:"doctor",name:"Doctor o doctora",icon:"🩺",jobs:["hospital"],gift:{shirt:"s9"},desc:"Gana 50 % más en el hospital"},
 {id:"bombero",name:"Bombero o bombera",icon:"🚒",jobs:["bomberos"],gift:{hat:"bombero"},desc:"Gana 50 % más apagando incendios"},
 {id:"policia",name:"Policía",icon:"👮",jobs:["policia"],gift:{hat:"policia",shirt:"s11"},desc:"Gana 50 % más atrapando ladrones"},
 {id:"chef",name:"Chef",icon:"👨‍🍳",jobs:["helados","super"],gift:{hat:"chef"},desc:"Gana 50 % más en la heladería y el súper"},
 {id:"granjero",name:"Granjero o granjera",icon:"🧑‍🌾",jobs:["granja","pesca"],gift:{hat:"vaquero"},desc:"Gana 50 % más en la granja y la pesca"},
 {id:"estudiante",name:"Estudiante",icon:"🎓",jobs:["escuela","misterio"],gift:{acc:"mochila"},desc:"Gana 50 % más en la escuela y resolviendo misterios"},
 {id:"aventurero",name:"Aventurero o aventurera",icon:"🗡️",jobs:["aventura","sobrevivir"],gift:{acc:"capa_roja"},desc:"Gana 50 % más en las islas"},
 {id:"artista",name:"Artista",icon:"🎨",jobs:["moda","cine"],gift:{face:"lentes"},desc:"Gana 50 % más en la pasarela y el cine"}
];
const SLOT_LISTS={shirt:SHIRTS,pants:PANTS,hat:HATS,acc:ACCS,face:FACES,neck:NECKS};
