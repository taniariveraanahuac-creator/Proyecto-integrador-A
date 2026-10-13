/* Proyecto Integrador ADM1401 · aplicación (React 18 sin compilación) */
const {useState,useEffect,useRef}=React,h=React.createElement;
const M=v=>"$"+Math.round(v||0).toLocaleString("es-MX"),P=v=>((v||0)*100).toFixed(1)+"%",N=v=>(+v||0).toLocaleString("es-MX",{maximumFractionDigits:1});
const fm=l=>/MXN/.test(l)?M:/%/.test(l)?P:N;
const str=v=>typeof v==="string"?v:(v==null?"":String(v));
const setIn=(o,p,v)=>{if(!p.length)return v;const c=(o&&typeof o==="object"&&!Array.isArray(o))?o:{};return {...c,[p[0]]:setIn(c[p[0]],p.slice(1),v)};};
const nest=(p,v)=>p.reduceRight((a,k)=>({[k]:a}),v);
const norm=x=>String(x||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ").trim();
function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
const fmt=t=>{try{return new Date(t).toLocaleString("es-MX",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}catch(e){return ""}};
const dt=s=>{const[a,b,c]=s.split("-");return new Date(+a,b-1,+c,23,59,59);};
const hoyISO=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");};
const fdl=s=>dt(s).toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long"});

/* ---------- Roles directivos ---------- */
/* Cada rol tiene su sigla (a), su descripción (d) y la pregunta desde la que aporta a cada entrega (p). */
const ROLES=[
 {k:"dg",a:"CEO",n:"Director General (CEO)",d:"Líder del consejo. Define la dirección, confirma la organización elegida, coordina y marca las entregas.",p:"¿Qué decisión estratégica toma el consejo con esta entrega y cómo se alinea con el propósito de la organización?"},
 {k:"op",a:"COO",n:"Director de Operaciones (COO)",d:"Procesos, servicio, recursos y calidad de la organización.",p:"¿Qué procesos, tiempos o recursos explican lo que analizaron y qué cambiaría en la operación?"},
 {k:"fi",a:"CFO",n:"Director de Finanzas (CFO)",d:"Cifras, costos, márgenes, inversión y retorno de la mejora.",p:"¿Qué cifras sustentan esta entrega, cuánto cuesta o cuánto deja, y qué riesgo financiero ve?"},
 {k:"mk",a:"CMO",n:"Director de Marketing (CMO)",d:"Clientes, mercado, competencia y comunicación.",p:"¿Qué significa este análisis para los clientes, el mercado y la competencia?"},
 {k:"rh",a:"CHRO",n:"Director de Capital Humano (CHRO)",d:"Estructura, puestos, talento, cultura y capacitación.",p:"¿Qué implica para las personas, los puestos, la cultura y la capacitación?"},
 {k:"in",a:"CIO",n:"Director de Innovación (CIO)",d:"Diseño de la propuesta de mejora, tecnología y pitch.",p:"¿Qué oportunidad de innovación o tecnología abre este análisis para la propuesta de mejora?"}];
const rolesAOf=(tm,id)=>id?ROLES.filter(r=>tm&&tm.roles&&tm.roles[r.k]===id).map(r=>r.a):[];
/* Roles asumidos por alguien del equipo: [rol, id, nombre]. */
const rolesAsumidos=tm=>ROLES.map(r=>{const id=str(tm&&tm.roles&&tm.roles[r.k]);return [r,id,id?nameOf(tm,id):""];}).filter(x=>x[2]);

const GUIA=[["Historia y propósito","¿Cómo y cuándo empezó el negocio? ¿Quién lo fundó?","¿Qué los distingue de otros negocios parecidos?","¿Tienen misión, visión o valores, aunque no estén escritos?"],
 ["Clientes y mercado","¿Quiénes son sus clientes principales?","¿Quiénes son su competencia directa?","¿Cómo atraen y conservan a sus clientes?"],
 ["Operación","¿Cómo es un día normal de trabajo?","¿Qué proceso les causa más problemas o retrasos?","¿Qué proveedores son clave para ustedes?"],
 ["Personas y organización","¿Cuántas personas trabajan y en qué puestos?","¿Quién toma las decisiones?","¿Cómo contratan y capacitan a su personal?"],
 ["Números (lo que quieran compartir)","¿Cuál es el precio o ticket promedio?","¿Cuáles son sus costos principales?","¿Cómo han cambiado sus ventas en el último año?"],
 ["Retos y mejora","¿Cuál es su mayor problema hoy?","Si pudieran mejorar una sola cosa, ¿cuál sería?","¿Qué han intentado antes y qué resultado tuvo?"],
 ["Cierre","¿Podemos volver para una segunda visita?","¿Con quién podemos resolver dudas?","¿Nos autoriza a usar esta información con fines académicos?"]];
const guiaTxt=()=>GUIA.map(([t,...q])=>t+"\n"+q.map(x=>"• "+x).join("\n")).join("\n\n");
/* ---------- Opciones de organizaciones (sugerencias; el equipo siempre puede proponer otras) ---------- */
const CAT=[
 {k:"fam",n:"Empresas familiares y negocios de su colonia",tipo:"Empresa familiar",d:"Carta abierta: cualquier negocio familiar o local cuyo dueño acepte colaborar. Es la opción con mejor acceso a información, porque pueden entrevistar directamente a quien la dirige.",items:[],ej:["El restaurante, la papelería, la farmacia o el taller de la familia de un integrante","Una tienda, estética, gimnasio, panadería, lavandería o tortillería de su colonia","Un consultorio, despacho contable, agencia de viajes o escuela particular pequeña","Un emprendimiento de amigos o conocidos con al menos un año de operación","Un puesto o local de algún mercado de la ciudad"]},
 {k:"ali",n:"Alimentos, bebidas y restaurantes",tipo:"Negocio o empresa local",d:"Restaurantes, cafeterías y productores locales. Buenas para propuestas de servicio, costos, menú, delivery o franquicias.",items:[
  {n:"La Habichuela",s:"Restaurante en el centro de Cancún desde 1977",links:[["Sitio oficial","https://www.lahabichuela.com/"],["Opiniones en Tripadvisor","https://www.tripadvisor.com/Restaurant_Review-g150807-d911379-Reviews-La_Habichuela_Restaurante-Cancun_Yucatan_Peninsula.html"]]},
  {n:"Los de Pescado",s:"Taquería local con modelo de franquicia",links:[["Sitio oficial","https://losdepescado.com/"],["Información de franquicias","https://losdepescado.com/franquicias/"]]},
  {n:"Ah Cacao Chocolate Café",s:"Cafetería y chocolate, Playa del Carmen y Cancún",links:[["Ah Cacao en Wikipedia","https://en.wikipedia.org/wiki/Ah_Cacao_Real_Chocolate"],["Reseña en PlayaDelCarmen.com","https://www.playadelcarmen.com/blog/ah-cacao-chocolate-cafe/"]]},
  {n:"Cerveza Cancún",s:"Cervecería artesanal",links:[["Sitio oficial","https://cervezacancun.com/"],["La Jornada Maya: ruta de la cerveza artesanal","https://www.lajornadamaya.mx/quintanaroo/93414/sabores-exoticos-en-la-ruta-de-la-cerveza-artesanal-de-quintana-roo"]]}]},
 {k:"tur",n:"Turismo, buceo y recreación",tipo:"Negocio o empresa local",d:"Operadores turísticos y centros de buceo. Buenas para propuestas de experiencia del cliente, ventas en línea o sostenibilidad.",items:[
  {n:"Scuba Cancún",s:"Centro de buceo",links:[["Sitio oficial","https://scubacancun.com.mx/"],["Ficha PADI","https://www.padi.com/dive-center/mexico/scuba-cancun/"]]},
  {n:"Scuba Total",s:"Centro de buceo en Cancún",links:[["Sitio oficial","https://www.scubatotal.com/"],["Equipo de trabajo","https://www.scubatotal.com/team"]]},
  {n:"Xyaat Ecoturismo Comunitario",s:"Cooperativa de turismo maya",links:[["Ficha de la cooperativa","https://www.viajaturismocomunitario.com/en/xyaat-ecoturismo-comunitario-maya"]]},
  {n:"Ultramar",s:"Transporte marítimo a Isla Mujeres y Cozumel",links:[["Quiénes somos","https://www.ultramarferry.com/en/about"]]}]},
 {k:"com",n:"Comercio local, mercados y cooperativas",tipo:"Negocio o empresa local",d:"Mercados tradicionales, tiendas especializadas y cooperativas. Ideales para propuestas de comercialización, digitalización o atención al cliente.",items:[
  {n:"Mercado 28 (locatarios y artesanos)",s:"Artesanías y comida",links:[["Sitio del Mercado 28","https://mercadoveintiocho.com/"],["México Desconocido","https://escapadas.mexicodesconocido.com.mx/atractivos/mercado-28/"]]},
  {n:"Mercado 23 (locatarios)",s:"Mercado tradicional de abasto",links:[["Meganews: el Mercado 23, donde todo comenzó","https://meganews.mx/especiales/el-mercado-23-cancun-donde-todo-comenzo/"],["Hoteles Cancún: el corazón popular","https://www.hotelescancun.mx/mercado-23-en-cancun-el-corazon-popular-donde-todo-empezo/"]]},
  {n:"Organic Market Cancún",s:"Tienda de productos orgánicos",links:[["Página en Facebook","https://www.facebook.com/OrganicMarkets/"],["Opiniones en Yelp","https://www.yelp.com/biz/organic-market-canc%C3%BAn"]]},
  {n:"Cooperativas comunitarias de Quintana Roo",gen:1,s:"Economía social",links:[["Heraldo de México (2026)","https://quintanaroo.heraldodemexico.com.mx/local/2026/3/30/sigue-consolidandose-figura-de-cooperativas-cominitarias-13961.html"]]}]},
 {k:"inn",n:"Sostenibilidad e innovación local",tipo:"Negocio o empresa local",d:"Emprendimientos que convierten un problema regional, como el sargazo, en productos. Buenos para propuestas de crecimiento, financiamiento o mercado.",items:[
  {n:"Sargánico",s:"Productos sustentables a base de sargazo",links:[["Quinta Fuerza: qué hace Sargánico","https://quintafuerza.mx/quintana-roo/sarganico-empresa-mexicana-elabora-productos-sustentables-sargazo/"]]},
  {n:"Emprendimientos con sargazo",gen:1,s:"Calzado, cosméticos, tabiques y fertilizantes",links:[["CNN: la otra cara del sargazo (2026)","https://cnnespanol.cnn.com/2026/08/28/mexico/sargazo-problema-oportunidad-mexico-quintana-roo-orix"],["Heraldo: sandalias de sargazo en Playa del Carmen","https://quintanaroo.heraldodemexico.com.mx/local/2026/7/14/del-sargazo-al-calzado-emprendedor-de-playa-del-carmen-crea-sandalias-biodegradables-15711.html"]]}]},
 {k:"soc",n:"Instituciones sociales y de asistencia",tipo:"Institución social (A.C. o fundación)",d:"Asociaciones civiles, fundaciones e instituciones de asistencia. Suelen recibir a estudiantes y tienen retos claros de gestión, procuración de fondos y voluntariado.",items:[
  {n:"Banco de Alimentos de Quintana Roo",s:"Asistencia alimentaria",links:[["Ficha en Fundación Bepensa","https://regalove.fundacionbepensa.org/asociaci%C3%B3n/banco-de-alimentos-de-q-roo/"],["Heraldo de México (2025)","https://quintanaroo.heraldodemexico.com.mx/local/2025/7/29/banco-de-alimentos-en-apoyo-de-comunidades-vulnerables-9648.html"]]},
  {n:"Amigos de Sian Ka'an A.C.",s:"Conservación ambiental",links:[["Contacto","https://www.amigosdesiankaan.org/contacto/"],["LinkedIn","https://mx.linkedin.com/company/amigossiankaan"]]},
  {n:"Cruz Roja Mexicana, Delegación Cancún",s:"Atención de emergencias",links:[["LinkedIn","https://mx.linkedin.com/company/cruzrojacancun"],["Colecta Nacional 2026 (Ayuntamiento)","https://cancun.gob.mx/cancun/noticias/leer/3567"]]},
  {n:"CRIT Teletón Quintana Roo",s:"Rehabilitación e inclusión",links:[["Heraldo de México: Teletón 2026","https://quintanaroo.heraldodemexico.com.mx/local/2026/10/1/crit-quintana-roo-alista-participacion-del-teleton-2026-17132.html"]]},
  {n:"Fundación Ciudad de la Alegría A.C.",s:"Asistencia a niñas, niños y familias",links:[["Sitio oficial","https://www.ciudadalegria.org.mx/"]]},
  {n:"Cáritas (banco de alimentos)",s:"Asistencia social",links:[["Cancún Mío: banco de alimentos de Cáritas","https://www.cancunmio.com/2976793-juan-carrillo-visita-el-banco-de-alimentos-de-la-asociacion-civil-caritas/"]]},
  {n:"DIF Benito Juárez",s:"Asistencia social municipal",links:[["Ayuntamiento: programas del DIF","https://cancun.gob.mx/cancun/noticias/leer/3366"]]},
  {n:"Fundación Dolphin Discovery",s:"Educación y conservación",links:[["Alianzas de la fundación","https://www.fundaciondolphindiscovery.org/alianzas/"]]}]},
 {k:"reg",n:"Empresas grandes de la región",tipo:"Negocio o empresa local",d:"Empresas con mucha información pública. Necesitarán a una persona de contacto dentro de la empresa; elijan un área o sucursal concreta.",items:[
  {n:"Grupo Xcaret",s:"Turismo y parques",links:[["Informes de sostenibilidad","https://www.grupoxcaret.com/en/sustainability-reports/"]]},
  {n:"Royal Resorts",s:"Hotelería y tiempo compartido",links:[["Acerca de Royal Resorts","https://www.royalresorts.com/es/acerca-de-royal-resorts"]]},
  {n:"Súper Akí",s:"Supermercados",links:[["Sucursales","https://corporativo.superaki.mx/tiendas"]]},
  {n:"Hospital Galenia",s:"Salud privada",links:[["20 años del Hospital Galenia (Ayuntamiento)","https://cancun.gob.mx/cancun/noticias/leer/3587"]]}]}];
const CATALL=CAT.flatMap(c=>c.items.map(x=>({...x,tipo:c.tipo,cat:c.k,catn:c.n})));
const slug=n=>norm(n).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const GEN=[["Catálogo de instituciones de servicio social, Anáhuac Cancún","https://www.anahuac.mx/cancun/recursos/Catalogo-Instituciones-SS-periodo-201460.pdf"],["Guía: dónde hacer acción social en Cancún","https://asiescancun.mx/ciudad/accion-social-activismo/fundacion-cancun/"],["INEGI: Directorio Estadístico Nacional de Unidades Económicas (DENUE)","https://www.inegi.org.mx/app/mapa/denue/"],["Data México (Secretaría de Economía)","https://www.economia.gob.mx/datamexico/"],["DATATUR: estadísticas de turismo","https://www.datatur.sectur.gob.mx/"]];
const POOL=CATALL.filter(x=>!x.gen);
const byslug=sl=>CATALL.find(x=>slug(x.n)===sl);
const takenBy=(sorteo,x)=>{const v=sorteo&&sorteo[slug(x.n)];return v&&v.t?v:null;};
const mergeDeep=(a,b)=>{const o={...(a||{})};for(const k in b){const v=b[k];o[k]=(v&&typeof v==="object"&&!Array.isArray(v))?mergeDeep(o[k],v):v;}return o;};
const CR=[["acc","Acceso a información",25,"¿Podrán obtener datos reales: ventas, costos, procesos, personal?"],
 ["disp","Disposición del dueño o responsable",25,"¿Aceptó reunirse, responde rápido y le interesa la mejora?"],
 ["prob","Problema u oportunidad clara",20,"¿Hay un problema concreto y visible que se pueda mejorar?"],
 ["imp","Impacto social o económico",15,"¿Cuánto beneficiaría la mejora a la organización, sus clientes o la comunidad?"],
 ["via","Viabilidad en el semestre",15,"¿Pueden diseñar la propuesta completa antes de la entrega final (S8)?"]];
const QL=[["fort","Fortalezas para el proyecto","Qué la hace buena opción: información disponible, problema claro, apertura del dueño…"],
 ["ries","Riesgos o limitaciones","Qué podría salir mal: poca información, horarios difíciles, dueño ocupado…"],
 ["hall","Hallazgo clave del contacto","Lo más importante que aprendieron al hablar con el dueño o responsable"]];
const ESC=["","1 · Muy bajo","2 · Bajo","3 · Medio","4 · Alto","5 · Muy alto"];
const altPond=a=>Math.round(CR.reduce((s,[k,,w])=>s+(parseInt(a&&a[k])||0)/5*w,0)*10)/10;
const altTot=altPond;
const altInfo=a=>!!(a&&str(a.n).trim()&&str(a.tipo)&&str(a.que).trim().length>=20&&str(a.prob_t).trim().length>=20);
const altContact=a=>!!(a&&str(a.contacto).trim()&&str(a.medio)&&str(a.fecha)&&str(a.acepta));
const altScored=a=>!!(a&&CR.every(([k])=>parseInt(a[k])>=1));
const altQual=a=>!!(a&&QL.every(([k])=>str(a[k]).trim().length>=20));
const altOk=a=>altInfo(a)&&altContact(a)&&altScored(a)&&altQual(a);
const ranking=al=>SLOTS.map(([k])=>[k,(al&&al[k])||{}]).filter(([,a])=>altScored(a)).sort((x,y)=>altPond(y[1])-altPond(x[1]));
const altsOf=tm=>Object.entries((tm&&tm.alts)||{}).filter(([,a])=>a&&!a.del).sort((x,y)=>x[0].localeCompare(y[0]));
const TIPOS=["Empresa familiar","Negocio o empresa local","Institución social (A.C. o fundación)","Cooperativa"];
const MEDIOS=["Visita presencial","Entrevista en línea","Llamada","Correo o mensaje"];
const GUION="Buenos días, mi nombre es ___ y estudio en la Universidad Anáhuac Cancún. En la materia Introducción a la Empresa analizamos una organización real de la ciudad y le proponemos una mejora sin costo. ¿Nos permitiría una entrevista de 30 minutos con usted o con la persona responsable? La información se usará solo con fines académicos y, si lo prefiere, de forma confidencial. Al final le compartimos nuestra propuesta.";
function cartaTxt(t,tm){const ms=members(tm).map(([,x])=>x.n);
 return ["Cancún, Quintana Roo, a ___ de ____________ de 2026.","","[Nombre de la persona responsable]","[Cargo] · [Nombre de la organización]","Presente.","",
 "Por medio de la presente me permito presentar a "+(ms.length?ms.join(", "):"[nombres de los integrantes]")+", estudiantes del grupo de "+grpOf(t).n+" de la Universidad Anáhuac Cancún, que cursan la materia ADM1401 Introducción a la Empresa.","",
 "Como parte de su Proyecto Integrador, los estudiantes analizarán una organización real de la región y elaborarán, sin costo, una propuesta de mejora para ella. Para ello le solicitamos amablemente:",
 "• Una entrevista inicial de 30 minutos y, si es posible, una segunda visita.","• Información general de la organización: historia, servicios, clientes y estructura.","",
 "La información se usará únicamente con fines académicos y, si usted lo prefiere, de forma confidencial. Al terminar el semestre le compartiremos la propuesta de mejora.","","Agradecemos de antemano su apoyo.","","Atentamente,","","Mtra. Tania Rivera Lozano","Docente de ADM1401 Introducción a la Empresa","Escuela Internacional de Negocios, Universidad Anáhuac Cancún","coordadmin.uac@anahuac.mx","",
 "Acepto colaborar con el proyecto:","Nombre y firma: ______________________   Fecha: ____________"].join("\n");}

/* ---------- Calendario de entregas ----------
   Del 12 de octubre al 24 de noviembre de 2026; cada entrega cierra a las 23:59 de su fecha límite.
   S1 a S3 cada domingo; S4 a S7 cada 4 o 5 días; S8 = PROYECTO FINAL, martes 24 de noviembre.
   En la versión con Hoja de Google, las fechas vienen de LIMITES en Code.gs (una sola fuente) y reemplazan a estas. */
const CALENDARIO=["2026-10-18","2026-10-25","2026-11-01","2026-11-05","2026-11-10","2026-11-15","2026-11-19","2026-11-24"];
const aplicarCalendario=lista=>{if(Array.isArray(lista))lista.forEach((d,i)=>{if(W[i]&&/^\d{4}-\d{2}-\d{2}$/.test(d))W[i].d=d;});};

/* ---------- Entregas semanales aplicadas a la empresa asignada ---------- */
const W=[
 {t:"Equipo, roles y selección de la organización",u:1,d:CALENDARIO[0],v:.05,
  q:"Registren al equipo, asuman los 6 roles y capturen los datos de la organización en «Mi equipo». Aquí expliquen qué alternativas analizaron, por qué eligieron esta organización y qué problema u oportunidad de mejora detectan.",
  tx:["Alternativas analizadas y por qué eligieron esta organización","Organización elegida: giro, historia, tamaño y persona de contacto","Problema u oportunidad de mejora detectada"],nu:[],
  c:[["Integrantes registrados",(n,k)=>k],["Validación (3 a 6)",(n,k)=>k>=3&&k<=6?"Cumple":"Revisar"]],
  et:["Matriz ponderada: A, A.C. de apoyo a niños (72/100); B, hotel de la zona hotelera (86/100); C, panadería de la familia de un integrante (78/100). Cualitativamente, el hotel tiene un problema medible (quejas por espera) y el gerente aceptó dos entrevistas. Elegimos el hotel: coinciden los números y los argumentos.","Hotel de 4 estrellas en la zona hotelera de Cancún, 180 habitaciones, fundado en 1998, con 220 colaboradores. Contacto: gerente de Alimentos y Bebidas.","Alta rotación del personal de cocina y quejas frecuentes por los tiempos de espera en el restaurante."],en:[],ek:5,
  s:"Entrevista con el dueño o responsable (comunicación personal); sitio web y redes; INEGI DENUE."},
 {t:"Investigación del entorno: PESTEL, mercado y competidores",u:2,d:CALENDARIO[1],v:.05,
  q:"Analicen los 6 factores PESTEL que afectan a la empresa, describan su mercado objetivo y a sus competidores, y estimen el tamaño de su mercado.",
  tx:["PESTEL (6 factores) que afectan a la empresa","Mercado objetivo actual","Competidores directos e indirectos"],nu:["Clientes potenciales (No.)","Gasto promedio por cliente (MXN)"],
  c:[["Mercado total TAM (MXN)",n=>n[0]*n[1]],["Mercado alcanzable 10% (MXN)",(n,k,c)=>c[0]*.1]],
  et:["Político: nuevas rutas aéreas y el Tren Maya. Económico: tipo de cambio. Social: más turismo nacional. Tecnológico: reservas en línea. Ecológico: sargazo. Legal: normas de manejo de residuos.","Parejas y familias nacionales y de Estados Unidos de ingreso medio.","Directos: hoteles de 4 estrellas de la zona hotelera. Indirectos: rentas vacacionales en plataformas digitales."],en:[60000,9500],
  s:"INEGI; DATATUR; BANXICO; Data México. TAM = clientes × gasto promedio."},
 {t:"5 Fuerzas de Porter y ventaja competitiva",u:2,d:CALENDARIO[2],v:.05,
  q:"Califiquen del 1 al 5 cada fuerza que enfrenta la empresa, expliquen por qué y describan su ventaja competitiva actual y cómo la fortalecería su mejora.",
  tx:["Explicación de las 5 Fuerzas aplicadas a la empresa","Ventaja competitiva actual y cómo la fortalece la mejora"],nu:["Rivalidad (1-5)","Nuevos entrantes (1-5)","Sustitutos (1-5)","Poder de clientes (1-5)","Poder de proveedores (1-5)"],
  c:[["Intensidad competitiva (promedio)",n=>n.reduce((a,b)=>a+b,0)/5],["Nivel",(n,k,c)=>c[0]>=4?"Alta":c[0]>=2.5?"Media":"Baja"]],
  et:["Rivalidad alta por la oferta hotelera; entrantes medios; sustitutos altos (rentas vacacionales); clientes con poder alto porque comparan precios en línea.","Hoy compite por ubicación. Reducir los tiempos de espera mejora las reseñas y la diferencia frente a sus competidores."],en:[5,3,4,4,2],
  s:"Porter (Harvard Business Review); INEGI Censos Económicos; reseñas en línea."},
 {t:"Planeación estratégica: misión, visión, SMART y FODA",u:3,d:CALENDARIO[3],v:.1,
  q:"Revisen la misión, visión y valores de la empresa, propongan ajustes si hacen falta, planteen objetivos SMART para la mejora y elaboren su FODA.",
  tx:["Misión, visión y valores (actuales y ajustes propuestos)","Objetivos SMART de la propuesta de mejora","FODA de la empresa"],nu:["Meta (unidades)","Plazo (meses)","Avance actual (unidades)"],
  c:[["Ritmo requerido (unidades/mes)",n=>n[1]?n[0]/n[1]:0],["Avance de la meta %",n=>n[0]?n[2]/n[0]:0]],
  et:["Misión actual centrada en el descanso familiar; proponen agregar el compromiso con su comunidad.","Reducir de 25 a 12 minutos el tiempo promedio de servicio del restaurante en 6 meses.","F: ubicación. O: turismo nacional. D: rotación de personal. A: sargazo y nuevos competidores."],en:[13,6,3],
  s:"Planeación estratégica (Robbins y Coulter); SMART (Drucker)."},
 {t:"Modelo de negocio Canvas: actual y con la mejora",u:3,d:CALENDARIO[4],v:.1,
  q:"Describan los 9 bloques del Canvas actual de la empresa y qué bloques cambian con su propuesta de mejora. Calculen el margen con datos estimados.",
  tx:["Canvas actual: segmentos, propuesta de valor, canales y relación con clientes","Fuentes de ingreso, estructura de costos, recursos, actividades y socios","Bloques que cambian con la propuesta de mejora"],nu:["Precio unitario (MXN)","Costo unitario (MXN)","Unidades por año"],
  c:[["Margen unitario (MXN)",n=>n[0]-n[1]],["Margen %",(n,k,c)=>n[0]?c[0]/n[0]:0],["Utilidad bruta anual (MXN)",(n,k,c)=>c[0]*n[2]]],
  et:["Segmento: familias. Canales: agencias en línea y venta directa. Relación: programa de lealtad.","Ingresos: hospedaje y alimentos. Costos: nómina, energía, insumos.","Cambian actividades clave (nuevo sistema de comandas) y recursos clave (capacitación)."],en:[2800,1700,48000],
  s:"Osterwalder y Pigneur; estados financieros o estimaciones con fuente."},
 {t:"Diseño organizacional: actual y propuesto",u:4,d:CALENDARIO[5],v:.1,
  q:"Presenten el organigrama actual (o el que deduzcan) y los cambios de puestos o áreas que requiere su propuesta.",
  tx:["Organigrama actual y departamentalización","Cambios organizacionales que propone la mejora (puestos nuevos o ajustados)"],nu:["Total de empleados","No. de jefes o gerentes"],
  c:[["Tramo de control (empleados por jefe)",n=>n[1]?(n[0]-n[1])/n[1]:0],["Evaluación",(n,k,c)=>c[0]>=3&&c[0]<=8?"Adecuado":"Revisar tramo"]],
  et:["Dirección General con 5 áreas: Habitaciones, Alimentos y Bebidas, Ventas, Finanzas y Capital Humano.","Crear el puesto de Coordinador de Servicio en Restaurante, que reporta a Alimentos y Bebidas."],en:[220,28],
  s:"Robbins y Coulter; STPS; INEGI ENOE."},
 {t:"Gestión del talento para la mejora",u:5,d:CALENDARIO[6],v:.1,
  q:"Definan cómo reclutarían, seleccionarían, capacitarían y evaluarían al personal que hará posible la mejora, con su presupuesto.",
  tx:["Reclutamiento y selección","Capacitación y evaluación del desempeño"],nu:["Personas a capacitar","Costo por persona (MXN)","Horas por persona"],
  c:[["Presupuesto de capacitación (MXN)",n=>n[0]*n[1]],["Horas totales",n=>n[0]*n[2]]],
  et:["Convenios con escuelas de gastronomía de Cancún; entrevista por competencias y prueba práctica.","Curso de servicio de 20 horas y evaluación trimestral con indicadores de tiempo y satisfacción."],en:[35,3500,20],
  s:"STPS; Ley Federal del Trabajo; CONOCER."},
 {t:"PROYECTO FINAL: propuesta de mejora integrada y pitch",u:"6 y 7",d:CALENDARIO[7],v:.15,fin:true,
  q:"Entrega del proyecto final. Integren en un solo entregable la propuesta de mejora definitiva, sustentada en lo trabajado de la S1 a la S7 (ya corregido con la retroalimentación), y preparen el pitch de 15 minutos para la dirección de la organización.",
  tx:["Resumen ejecutivo del proyecto (organización, problema, propuesta, inversión y retorno)","Propuesta de mejora: problema, solución y beneficios","Plan de implementación: acciones, responsables y plazos","Balanced Scorecard: un KPI por perspectiva (financiera, clientes, procesos, aprendizaje)","Guion del pitch (15 minutos)"],nu:["Inversión requerida (MXN)","Beneficio anual esperado (MXN)"],
  c:[["Retorno de la inversión %",n=>n[0]?(n[1]-n[0])/n[0]:0],["Recuperación (meses)",n=>n[1]?n[0]/(n[1]/12):0],["Viabilidad",(n,k,c)=>c[0]>=.5?"Alta":c[0]>=0?"Media":"Baja"]],
  et:["Hotel Arrecife Cancún, 220 colaboradores. El tiempo de espera en el restaurante (25 min) baja las reseñas; proponemos comandas digitales y un coordinador de servicio, con inversión de $450,000 y retorno de 118% el primer año.","Problema: 25 minutos de espera. Solución: comandas digitales y nuevo coordinador. Beneficio: más consumo y mejores reseñas.","Mes 1: compra del sistema (Finanzas). Mes 2: capacitación (Capital Humano). Mes 3: arranque y medición (Operaciones).","Financiera: +8% en ventas de alimentos. Clientes: calificación ≥ 4.5. Procesos: espera ≤ 12 min. Aprendizaje: 20 h por persona.","Apertura con el problema, datos del diagnóstico, propuesta, números y cierre con la petición a la dirección."],en:[450000,980000],
  s:"Kaplan y Norton (HBR). Retorno = (beneficio − inversión) / inversión."}];
const PITCHW=.1;

const GRUPOS=[{k:"L",n:"Liderazgo",off:0,lista:[]},
 {k:"A",n:"Administración",off:5,lista:[]}];
const NT=10;
const grpOf=t=>GRUPOS[t>5?1:0],loc=t=>(t-1)%5+1,tLab=t=>grpOf(t).n+" · Equipo "+loc(t);
const fullName=([ap,no])=>((no||"")+" "+(ap||"")).trim();
const rosterOf=g=>g.lista.slice().sort((a,b)=>a[0].localeCompare(b[0],"es"));
const members=m=>Object.entries((m&&m.mem)||{}).filter(([,x])=>x&&!x.del&&str(x.n).trim()).sort((a,b)=>(a[1].t||0)-(b[1].t||0));
const regMap=(g,teams)=>{const o={};for(let i=1;i<=5;i++){const t=g.off+i;members(teams[t]).forEach(([id,x])=>{const k=norm(x.n);if(!o[k])o[k]={t,id,n:x.n};});}return o;};
const nameOf=(tm,id)=>((members(tm).find(([k])=>k===id)||[,{}])[1].n)||"";
const rolesOf=(tm,id)=>id?ROLES.filter(r=>tm&&tm.roles&&tm.roles[r.k]===id).map(r=>r.n):[];
const leaderOf=tm=>{const id=tm&&tm.roles&&tm.roles.dg;return id&&nameOf(tm,id)?id:"";};
const calcW=(wi,nums,k)=>{const c=[];W[wi].c.forEach(f=>c.push(f[1](nums,k,c)));return c;};
const showC=(wi,i,v)=>typeof v==="string"?v:fm(W[wi].c[i][0])(v);
/* Plazo de cada semana: su fecha límite a las 23:59, o la prórroga que dé la docente (wd.ext). */
const limite=(wi,wd)=>Math.max(dt(W[wi].d).getTime(),wd&&wd.ext?dt(wd.ext).getTime():0);
const abierta=(wi,wd)=>Date.now()<=limite(wi,wd);
const fcorta=ms=>new Date(ms).toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long"});
function estado(wd,wi){const lim=dt(W[wi].d).getTime(),lx=limite(wi,wd),pr=lx>lim;
 if(wd&&wd.est==="Entregado"){if(wd.at&&wd.at>lim){if(pr&&wd.at<=lx)return {k:"ok",l:"Entregado con prórroga",c:"ok",s:"✓"};const late=Math.ceil((wd.at-lim)/864e5);return {k:"tarde",l:"Entregado con "+late+" día"+(late>1?"s":"")+" de retraso",c:"wa",s:"Tarde"};}return {k:"ok",l:"Entregado",c:"ok",s:"✓"};}
 if(Date.now()>lx)return {k:"no",l:"No entregado",c:"ko",s:"✗"};
 return {k:"pend",l:pr&&Date.now()>lim?"Pendiente · prórroga al "+fcorta(lx):"Pendiente",c:pr&&Date.now()>lim?"wa":"",s:"·"};}
function score(gr){let p=0;W.forEach((w,i)=>{const c=parseFloat(gr&&gr.c&&gr.c[i]);if(!isNaN(c))p+=c*w.v;});const pi=parseFloat(gr&&gr.pitch);if(!isNaN(pi))p+=pi*PITCHW;return p;}
const csvq=v=>{v=String(v==null?"":v);return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;};

const empOfTeam=tm=>{const id=tm&&tm.elegida,a=id&&tm.alts&&tm.alts[id];if(a&&!a.del&&str(a.n).trim())return a;const o=tm&&tm.org;return o&&str(o.n).trim()?o:null;};
/* Semana en curso: la primera cuya fecha límite no ha pasado (o la última). */
const semanaActual=()=>{const i=W.findIndex(w=>dt(w.d).getTime()>=Date.now());return i<0?W.length-1:i;};
const proxima=wdocs=>{const i=W.findIndex((w,k)=>!(wdocs&&wdocs[k]&&wdocs[k].est==="Entregado"));return i;};
const cuenta=(wi,wd,tm)=>{const c=checklist(wi,wd,tm);return [c.filter(x=>x[1]).length,c.length];};

/* ---------- Política de acceso en la página ----------
   Docente: ve todo de los dos grupos. Alumno: solo su equipo; la página no muestra nada de otros equipos
   (en la versión con Hoja de Google el servidor ni siquiera lo envía). */
const MSG_PRIVACIDAD="Acceso restringido: esa información pertenece a otro equipo. Solo puedes consultar y modificar la de tu equipo.";
function Restringido(){return h("div",{className:"card",role:"alert",style:{borderColor:"var(--kot)"}},h("h2",null,"🔒 Acceso restringido"),h("p",null,MSG_PRIVACIDAD));}

/* ---------- Integrantes: configuración, avatar y selector ----------
   La configuración vive al inicio del archivo del artefacto (window.PI_CONFIG_EQUIPO) o en config.js
   (PI_CONFIG.equipo) en la versión de GitHub: máximo y mínimo por equipo, fotos y preselección. */
const CFG_EQ=(()=>{const c=window.PI_CONFIG_EQUIPO||(window.PI_CONFIG&&window.PI_CONFIG.equipo)||{},fotos={},pre=new Set(),det={};
 const L=c.integrantes||{};Object.keys(L).forEach(g=>(L[g]||[]).forEach(p=>{if(!p||!p.nombre)return;const k=norm(p.nombre);if(p.foto)fotos[k]=p.foto;if(p.seleccionado)pre.add(k);if(p.detalle)det[k]=p.detalle;}));
 Object.keys(c.fotos||{}).forEach(n=>{fotos[norm(n)]=c.fotos[n];});
 return {max:+c.maximo||6,min:+c.minimo||3,fotos,pre,det};})();
const AV_COL=["#c9561a","#8a4b2d","#2f6f73","#5b5f97","#7a6b1f","#9c3d54","#3f6f3a","#6b4fa0"];
const avColor=n=>{let x=0;for(const c of String(n))x=(x*31+c.charCodeAt(0))>>>0;return AV_COL[x%AV_COL.length];};
const avInic=n=>{const p=String(n).trim().split(/\s+/);return (((p[0]||"")[0]||"")+(((p.length>2?p[p.length-2]:p[1])||"")[0]||"")).toUpperCase();};
function Avatar({n,size}){const sz=size||40,f=CFG_EQ.fotos[norm(n)],[err,setErr]=useState(false);
 return h("span",{className:"avatar","aria-hidden":"true",style:{width:sz,height:sz,flex:"0 0 "+sz+"px",background:avColor(n),fontSize:Math.round(sz*.36)}},f&&!err?h("img",{src:f,alt:"",onError:()=>setErr(true)}):avInic(n));}
/* Selector de integrantes: tarjetas que se marcan con clic, casilla o teclado, y contador «x de N seleccionados».
   items: [{n, detalle, bloq (no se puede elegir), fijo (seleccionado y no se puede quitar)}] · sel: nombres elegidos. */
function Selector({id,items,sel,setSel,max,min}){
 const [q,setQ]=useState(""),[aviso,setAviso]=useState("");
 const total=items.length,n=sel.length,lim=max>0?max:total,lleno=max>0&&n>=max;
 const has=x=>sel.includes(x),vis=items.filter(x=>!q.trim()||norm(x.n+" "+(x.detalle||"")).includes(norm(q)));
 const toggle=it=>{if(it.bloq||it.fijo)return;if(has(it.n)){setSel(sel.filter(x=>x!==it.n));setAviso("");return;}
  if(lleno){setAviso("Llegaron al máximo de "+max+" integrantes. Quiten a alguien para agregar a otra persona.");return;}setSel(sel.concat(it.n));setAviso("");};
 const todos=()=>{const out=sel.slice();for(const it of vis){if(max>0&&out.length>=max)break;if(!it.bloq&&!out.includes(it.n))out.push(it.n);}setSel(out);if(max>0&&out.length>=max&&vis.some(it=>!it.bloq&&!out.includes(it.n)))setAviso("Se seleccionaron hasta el máximo de "+max+".");};
 const ninguno=()=>{setSel(sel.filter(x=>items.some(it=>it.n===x&&it.fijo)));setAviso("");};
 const msg=aviso||(lleno?"Máximo alcanzado: "+max+" integrantes.":min>0&&n>0&&n<min?"Faltan "+(min-n)+" para el mínimo recomendado de "+min+".":"");
 return h("div",{className:"selector"},
  h("div",{className:"sel-count"},h("b",null,n),h("span",{id:id+"-txt"},"de "+total+" seleccionado"+(total===1?"":"s")),max>0?h("span",{className:"sm mut"},"· máximo "+max):null),
  h("div",{className:"sel-bar",role:"progressbar","aria-labelledby":id+"-txt","aria-valuemin":0,"aria-valuemax":lim,"aria-valuenow":n},h("i",{style:{width:(lim?Math.min(100,n/lim*100):0)+"%"}})),
  msg?h("p",{className:"pill wa",role:"status",style:{whiteSpace:"normal",display:"block",padding:"6px 10px",margin:"6px 0 0"}},msg):null,
  h("div",{className:"row",style:{margin:"10px 0"}},total>8?h("input",{type:"search","aria-label":"Buscar integrante",placeholder:"Buscar por nombre…",value:q,onChange:e=>setQ(e.target.value),style:{flex:"1 1 200px",minWidth:0}}):null,
   h("button",{type:"button",className:"btn alt sm",disabled:lleno||vis.every(it=>it.bloq||has(it.n)),onClick:todos},"Seleccionar todos"),
   h("button",{type:"button",className:"btn alt sm",disabled:!sel.some(x=>!items.some(it=>it.n===x&&it.fijo)),onClick:ninguno},"Quitar selección")),
  vis.length?h("div",{className:"sel-grid",role:"group","aria-label":"Integrantes disponibles"},vis.map(it=>{const on=has(it.n),dis=it.bloq||it.fijo||(!on&&lleno),cid=id+"-"+norm(it.n).replace(/[^a-z0-9]+/g,"-");
   return h("label",{key:it.n,htmlFor:cid,className:"tarjeta"+(on?" sel":"")+(dis&&!on?" bloq":"")+(it.fijo?" fijo":"")},
    h("input",{type:"checkbox",id:cid,checked:on,disabled:dis,onChange:()=>toggle(it)}),
    h(Avatar,{n:it.n,size:40}),
    h("span",{className:"nom"},h("b",null,it.n),it.detalle||CFG_EQ.det[norm(it.n)]?h("small",null,it.detalle||CFG_EQ.det[norm(it.n)]):null),
    h("span",{className:"check","aria-hidden":"true"},on?"✓":""));})):h("p",{className:"mut"},q.trim()?"Nadie coincide con «"+q+"».":"No hay integrantes disponibles."));
}

/* ---------- Auto-guardado ----------
   Cada campo se guarda solo: al dejar de escribir (0.8 s), al salir del campo o al cambiar de pestaña.
   AG lleva la cuenta de lo pendiente y la hora del último guardado para el indicador. */
const AG={n:0,at:0,err:false,L:new Set(),set(o){Object.assign(this,o);const v={n:this.n,at:this.at,err:this.err};this.L.forEach(f=>f(v));}};
const hora=t=>new Date(t).toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"});
function AutoGuardado(){
 const [s,setS]=useState({n:AG.n,at:AG.at,err:AG.err});
 useEffect(()=>{AG.L.add(setS);return()=>{AG.L.delete(setS);};},[]);
 return h("span",{className:"pill "+(s.err?"ko":s.n?"wa":s.at?"ok":""),role:"status","aria-live":"polite",style:{whiteSpace:"normal"}},
  s.err?"No se pudo guardar; se reintentará solo":s.n?"Guardando…":s.at?"✓ Guardado automáticamente a las "+hora(s.at):"Se guarda solo mientras escriben");
}

/* ---------- Piezas comunes ---------- */
function Field({id,l,v,on,area,ph,type,ro}){
 return h("div",null,h("label",{className:"l",htmlFor:id},l),
  area?h("textarea",{id,value:str(v),placeholder:ph,readOnly:ro,onChange:e=>on(e.target.value)}):h("input",{id,type:type||"text",value:str(v),placeholder:ph,readOnly:ro,onChange:e=>on(e.target.value)}));
}
function Links({list}){return h("ul",{style:{margin:".3em 0",paddingLeft:"1.2em"}},list.map(([t,u])=>h("li",{key:u},h("a",{href:u,target:"_blank",rel:"noopener"},t))));}
function QueSePide(){
 const F=[["Equipo y organización","S1","Registrar al equipo, asumir los 6 roles directivos y elegir una organización real de Quintana Roo cuyo dueño o responsable acepte colaborar."],
  ["Diagnóstico","S2 a S4","Entorno PESTEL y mercado, 5 Fuerzas de Porter, misión, visión, FODA y objetivos SMART de la mejora."],
  ["Diseño de la mejora","S5 a S7","Canvas actual y con la mejora, cambios en la organización y plan de talento."],
  ["Proyecto final","S8 · 24 nov","Entregable final: documento integrado S1 a S8, propuesta de mejora completa (problema, solución, implementación, inversión, retorno, Balanced Scorecard), presentación del pitch y evidencia ante la organización."]];
 return h("div",{className:"card"},h("h2",null,"¿Qué se pide en el Proyecto Integrador?"),
  h("p",null,"Su equipo actúa como el ",h("b",null,"consejo directivo de una organización real de Quintana Roo"),". Cada semana entregan una parte del análisis y al final una ",h("b",null,"propuesta de mejora"),", que comparten con el dueño o responsable y presentan en el pitch."),
  h("div",{className:"grid",style:{gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))"}},F.map(([t,s2,d])=>h("div",{key:t,className:"ex"},h("span",{className:"pill"},s2),h("h3",{style:{marginTop:6}},t),h("p",{className:"sm"},d)))),
  h("h3",{style:{marginTop:10}},"Cómo se trabaja en esta página"),
  h("ol",{style:{paddingLeft:"1.2em"}},
   h("li",null,h("b",null,"Mi equipo:")," roles, datos de la organización y herramientas para contactarla."),
   h("li",null,h("b",null,"S1 a S8:")," cada semana capturan las 5 secciones del formato estándar. Hay un ejemplo de referencia."),
   h("li",null,h("b",null,"Entregar:")," cuando la lista de verificación está completa, el Director General marca la semana como entregada."),
   h("li",null,h("b",null,"PDF:")," cada integrante descarga el PDF de la semana y lo sube a Brightspace. «Reporte» reúne las 8 entregas.")),
  h("p",{className:"sm mut"},"🔒 Cada equipo ve solo su propio trabajo. La docente revisa a todos los equipos."),
  h("h3",{style:{marginTop:10}},"Qué se evalúa"),
  h("ul",{style:{paddingLeft:"1.2em"}},
   h("li",null,"Información real obtenida del dueño o responsable, más fuentes citadas en APA 7."),
   h("li",null,"Que la propuesta responda al problema detectado y se sostenga en el diagnóstico."),
   h("li",null,"Cifras congruentes: inversión, beneficio y retorno."),
   h("li",null,"Entregas a tiempo y participación de todos los roles.")));
}

/* ---------- Mi equipo: avance, roles y organización ---------- */
function Avance({wdocs,setView}){
 const n=W.filter((w,i)=>{const s=estado(wdocs[i]||{},i);return s.k==="ok"||s.k==="tarde";}).length,nx=proxima(wdocs);
 return h("div",null,
  h("div",{style:{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:4,marginTop:8}},W.map((w,i)=>{const s=estado(wdocs[i]||{},i);
   return h("button",{key:i,className:"pill "+s.c,title:"S"+(i+1)+": "+s.l,onClick:setView?()=>{setView("s"+i);window.scrollTo(0,0);}:undefined,style:{cursor:setView?"pointer":"default",textAlign:"center",padding:"6px 0",font:"700 .78rem var(--sans)"}},"S"+(i+1));})),
  h("p",{className:"sm",style:{marginTop:8}},h("b",null,n+" de 8 entregas")," marcadas.",nx>=0?[" Próxima: ",h("b",{key:1},"S"+(nx+1)+" · "+fdl(W[nx].d)),"."]:" ¡Todas entregadas!"));
}
function FichaOrg({o}){
 const r=(l,v)=>h("tr",null,h("th",{className:"g",style:{textAlign:"left",width:"34%"}},l),h("td",null,str(v)||"—"));
 return h("div",{className:"w"},h("table",null,h("tbody",null,r("Organización",o.n),r("Tipo",o.tipo),r("Giro y ubicación",[o.giro,o.ubi].filter(Boolean).join(" · ")),
  r("Persona de contacto",[o.contacto,o.cargo].filter(Boolean).join(", ")),r("Medio y fecha del contacto",[o.medio,o.fecha].filter(Boolean).join(" · ")),r("¿Aceptó colaborar?",o.acepta),r("Evidencia del acuerdo",o.evid))));
}
function Equipo(p){const {t,tm,me,isAdmin,wdocs,setView,wm}=p,e=empOfTeam(tm),al=tm.alts||{},canEdit=!!me||isAdmin;
 const alts=["A","B","C"].map(k=>al[k]&&str(al[k].n).trim()?k+": "+al[k].n:"").filter(Boolean);
 return h("div",{className:"stack"},
  h("div",{className:"card"},h("div",{className:"bar"},h("h2",{style:{margin:0}},tLab(t)+(str(tm.nombre).trim()?" · "+tm.nombre:"")),canEdit?h(AutoGuardado):null),
   h("div",{className:"co",style:{marginTop:8}},h("span",{className:"sm mut"},"Organización asignada"),h("div",{className:"big",style:{fontSize:"1.25rem"}},e?e.n:"Por elegir"),
    h("p",{className:"sm mut",style:{margin:0}},e?[e.tipo,e.giro].filter(Boolean).join(" · "):tm.sorteoAt?"Sorteo hecho. Completen la ruta y elijan en el paso 5.":"Primero el Director General hace el sorteo (paso 2)."),
    alts.length?h("p",{className:"sm",style:{margin:"4px 0 0"}},"Alternativas: "+alts.join(" · ")):null),
   h("div",{className:"g2",style:{marginTop:8}},h(Field,{id:"tnom",l:"Nombre del equipo (opcional)",v:tm.nombre,ro:!canEdit,on:v=>wm(["nombre"],v),ph:"Ej.: Consejo Delta"}),
    h(Field,{id:"tcan",l:"Canal de comunicación del equipo (opcional)",v:tm.canal,ro:!canEdit,on:v=>wm(["canal"],v),ph:"Ej.: grupo de WhatsApp «PI Delta»"})),
   h(Avance,{wdocs,setView})),
  h(Ruta,p),
  h(Integrantes,p));
}
/* ---------- Integrantes del equipo: lista con foto o iniciales y edición con el selector ---------- */
function Integrantes({t,tm,me,isAdmin,teams,addMem,wm,libresSrv}){
 const B=window.PI_BACKEND,sheets=B.mode==="sheets",ms=members(tm),g=grpOf(t),MAX=CFG_EQ.max,lead=!!me&&leaderOf(tm)===me;
 const puede=isAdmin||!!me;
 const [edit,setEdit]=useState(false),[sel,setSel]=useState([]),[ed,setEd]=useState(""),[nom,setNom]=useState(""),[nw,setNw]=useState(""),[busy,setBusy]=useState(false),[msg,setMsg]=useState("");
 const reg=regMap(g,teams),libres=sheets&&!isAdmin?(libresSrv||[]).slice():rosterOf(g).map(fullName).filter(n=>!reg[norm(n)]);
 const actuales=ms.map(([,x])=>x.n),yoN=nameOf(tm,me);
 /* Pool del selector: integrantes actuales + alumnos del grupo sin equipo (+ los de otros equipos, bloqueados, en el artefacto) */
 const otros=sheets||!isAdmin?[]:rosterOf(g).map(fullName).filter(n=>reg[norm(n)]&&reg[norm(n)].t!==t&&!actuales.some(a=>norm(a)===norm(n)));
 const extras=sel.filter(n=>!actuales.includes(n)&&!libres.includes(n));
 const items=actuales.map(n=>({n,detalle:(rolesOf(tm,(ms.find(([,x])=>x.n===n)||[])[0]).join(", ")||"Integrante actual")+(n===yoN?" · tú":""),fijo:n===yoN&&!isAdmin}))
  .concat(libres.filter(n=>!actuales.some(a=>norm(a)===norm(n))).map(n=>({n,detalle:"Sin equipo"})))
  .concat(extras.map(n=>({n,detalle:"Agregado a mano"})))
  .concat(otros.map(n=>({n,detalle:"En el Equipo "+loc(reg[norm(n)].t),bloq:true})));
 const abrir=()=>{setSel(actuales.slice());setEdit(true);setMsg("");};
 const altas=sel.filter(n=>!actuales.includes(n)),bajas=ms.filter(([,x])=>!sel.includes(x.n));
 const guardar=async()=>{if(busy)return;setBusy(true);setMsg("");const errs=[];
  try{
   for(const [id,x] of bajas){if(sheets){const r=await B.asignar({id,eq:0});if(!r.ok)errs.push(r.msg);}
    else{wm(["mem",id,"del"],true,0);ROLES.forEach(r=>{if(tm.roles&&tm.roles[r.k]===id)wm(["roles",r.k],"",0);});}}
   if(altas.length){if(sheets){for(const n of altas){const r=await B.asignar({nombre:n,eq:t});if(!r.ok)errs.push(r.msg);}}else await addMem(t,altas);}
  }catch(e){errs.push("No se pudo guardar. Revisa tu conexión.");}
  setBusy(false);
  if(errs.length)setMsg(errs.join(" "));else{setMsg("Cambios guardados: "+(altas.length?altas.length+" agregado"+(altas.length>1?"s":""):"")+(altas.length&&bajas.length?" y ":"")+(bajas.length?bajas.length+" quitado"+(bajas.length>1?"s":""):"")+(altas.length||bajas.length?".":"sin cambios."));setEdit(false);}};
 const renombrar=id=>{if(nom.trim().length>=3)wm(["mem",id,"n"],nom.trim(),0);setEd("");};
 return h("div",{className:"card"},
  h("div",{className:"bar"},h("h2",{style:{margin:0}},"Integrantes del equipo"),h("span",{className:"pill "+(ms.length>=CFG_EQ.min&&ms.length<=MAX?"ok":"wa")},ms.length+" de "+MAX)),
  h("p",{className:"sm mut"},false?""+".":"Los equipos son de "+CFG_EQ.min+" a "+MAX+" personas. Quien deje el equipo también deja su rol."),
  !edit?h("div",null,
   ms.length?h("div",{className:"sel-grid",style:{marginTop:6}},ms.map(([id,x])=>{const rs=rolesOf(tm,id);
    return h("div",{key:id,className:"tarjeta",style:{cursor:"default"}},h(Avatar,{n:x.n,size:40}),
     ed===id?h("span",{className:"nom",style:{display:"grid",gap:6,flex:1}},h("input",{type:"text","aria-label":"Nombre de "+x.n,value:nom,onChange:e=>setNom(e.target.value)}),h("span",{className:"row"},h("button",{className:"btn sm",disabled:nom.trim().length<3,onClick:()=>renombrar(id)},"Guardar"),h("button",{className:"btn alt sm",onClick:()=>setEd("")},"Cancelar")))
      :h("span",{className:"nom"},h("b",null,x.n+(id===me?" (tú)":"")),h("small",null,rs.length?rs.join(", "):"Sin rol"),puede&&!sheets?h("button",{className:"linklike sm",onClick:()=>{setEd(id);setNom(x.n);}},"Corregir nombre"):null));})):h("p",{className:"mut"},"Aún no hay integrantes."),
   puede?h("button",{className:"btn",style:{marginTop:10},onClick:abrir},"Editar integrantes"):null)
  :h("div",{style:{marginTop:6}},
   h("p",{className:"sm"},"Marquen a quienes forman el equipo y desmarquen a quien sale. Los cambios se aplican al presionar «Guardar cambios»."),
   h(Selector,{id:"eq"+t,items,sel,setSel,max:MAX,min:CFG_EQ.min}),
   !sheets?h("div",{className:"row",style:{alignItems:"flex-end",marginTop:6}},h("div",{style:{flex:"1 1 240px"}},h(Field,{id:"addnew",l:"¿No está en la lista? Escribe su nombre completo",v:nw,on:setNw,ph:"Nombre y apellidos"})),
    h("button",{className:"btn alt sm",disabled:nw.trim().length<3||items.some(it=>norm(it.n)===norm(nw))||sel.length>=MAX,onClick:()=>{setSel(sel.concat(nw.trim()));setNw("");}},"Agregar a la selección")):null,
   h("div",{className:"row",style:{marginTop:10}},h("button",{className:"btn",disabled:busy||(!altas.length&&!bajas.length),onClick:guardar},busy?"Guardando…":"Guardar cambios"+(altas.length||bajas.length?" (+"+altas.length+" / −"+bajas.length+")":"")),h("button",{className:"btn alt",disabled:busy,onClick:()=>{setEdit(false);setMsg("");}},"Cancelar"))),
  msg?h("p",{className:"sm",role:"status",style:{marginTop:8,fontWeight:600}},msg):null);
}

/* ---------- Mi equipo: ruta de selección en 5 pasos ---------- */
const SLOTS=[["A","Alternativa A · por sorteo","Organización del catálogo asignada por sorteo. Ningún otro equipo de los dos grupos tiene la misma."],["B","Alternativa B · por sorteo","Segunda organización del sorteo, de un giro distinto a la A."],["C","Alternativa C · propuesta del equipo","Obligatoria: una organización que ustedes conozcan y propongan, por ejemplo la empresa familiar de un integrante o un negocio de su colonia."]];
/* ---------- Análisis comparativo ---------- */
function CompCuant({al,edit,onSet}){
 const rk=ranking(al),place=k=>{const i=rk.findIndex(([x])=>x===k);return i<0?"—":(i+1)+"°";},top=rk.length?rk[0][0]:"";
 return h("div",null,
  h("div",{className:"w"},h("table",null,
   h("thead",null,h("tr",null,h("th",null,"Criterio"),h("th",null,"Peso"),SLOTS.map(([k])=>h("th",{key:k},k+". "+(str(al[k]&&al[k].n)||"—"))))),
   h("tbody",null,CR.map(([c,l,w,dsc])=>h("tr",{key:c},h("td",null,h("b",null,l),h("div",{className:"sm mut"},dsc)),h("td",{className:"c"},w+"%"),
     SLOTS.map(([k])=>{const v=str(al[k]&&al[k][c]);return h("td",{key:k,className:"c",style:{minWidth:120}},edit?h("select",{"aria-label":l+" · "+k,value:v,onChange:e=>onSet(k,c,e.target.value)},h("option",{value:""},"—"),[1,2,3,4,5].map(n=>h("option",{key:n,value:String(n)},ESC[n]))):(v||"—"));}))),
    h("tr",null,h("td",{colSpan:2},h("b",null,"Puntaje ponderado (0 a 100)")),SLOTS.map(([k])=>h("td",{key:k,className:"c "+(k===top?"ok":"")},h("b",{style:{fontSize:"1.1rem"}},altScored(al[k])?altPond(al[k]):"—")))),
    h("tr",null,h("td",{colSpan:2},"Lugar"),SLOTS.map(([k])=>h("td",{key:k,className:"c"},place(k)))),
    h("tr",null,h("td",{colSpan:2},"¿Aceptó colaborar?"),SLOTS.map(([k])=>{const v=str(al[k]&&al[k].acepta);return h("td",{key:k,className:"c "+(v==="Sí"?"ok":v==="No"?"ko":"")},v||"—");}))))),
  rk.length?h("div",{style:{marginTop:10,display:"grid",gap:6}},rk.map(([k,a])=>h("div",{key:k,style:{display:"grid",gridTemplateColumns:"minmax(90px,30%) 1fr 48px",gap:8,alignItems:"center"}},
   h("span",{className:"sm",style:{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},k+". "+a.n),
   h("div",{style:{background:"var(--line)",borderRadius:99,height:14}},h("div",{style:{width:altPond(a)+"%",height:14,borderRadius:99,background:k===top?"var(--or)":"var(--mut)"}})),
   h("b",{className:"sm",style:{textAlign:"right"}},altPond(a))))):null,
  h("p",{className:"sm mut",style:{marginTop:6}},"Puntaje ponderado = suma de (calificación ÷ 5 × peso). Escala: 1 muy bajo · 2 bajo · 3 medio · 4 alto · 5 muy alto."));
}
function CompCual({al}){
 return h("div",{className:"w"},h("table",null,h("thead",null,h("tr",null,h("th",null,"Aspecto"),SLOTS.map(([k])=>h("th",{key:k},k+". "+(str(al[k]&&al[k].n)||"—"))))),
  h("tbody",null,QL.map(([c,l])=>h("tr",{key:c},h("td",null,h("b",null,l)),SLOTS.map(([k])=>h("td",{key:k,style:{whiteSpace:"pre-wrap"}},str(al[k]&&al[k][c])||"—")))))));
}
function Decision({tm}){
 const al=tm.alts||{},rk=ranking(al),top=rk.length?rk[0]:null,el=tm.elegida,ela=el&&al[el];
 return h("div",{className:"ex"},
  h("p",null,h("b",null,"Recomendación cuantitativa: "),top?top[0]+". "+top[1].n+" ("+altPond(top[1])+"/100)":"—"),
  h("p",null,h("b",null,"Organización elegida: "),ela?el+". "+ela.n+" ("+altPond(ela)+"/100)":"—",ela&&top&&el!==top[0]?h("span",{className:"pill wa",style:{marginLeft:6}},"No es la de mayor puntaje: pesaron razones cualitativas"):ela?h("span",{className:"pill ok",style:{marginLeft:6}},"Coincide con el mayor puntaje"):null),
  h("p",{style:{whiteSpace:"pre-wrap"}},h("b",null,"Justificación integrada: "),str(tm.just)||"—"));
}

function Step({n,t,done,children,open}){
 return h("details",{className:"card",open:open,style:done?{borderColor:"var(--okt)"}:null},
  h("summary",{style:{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}},h("span",{className:"pill "+(done?"ok":"wa")},done?"✓ Paso "+n:"Paso "+n),h("span",{style:{fontSize:"1.05rem"}},t)),
  h("div",{style:{marginTop:10}},children));
}
function Ruta({t,tm,me,teams,wm,isAdmin,myName,sorteo,drawAB,tomadas}){
 const ms=members(tm),lid=leaderOf(tm),iAmLead=!!me&&lid===me,canEdit=!!me||isAdmin,g=grpOf(t);
 const A=k=>(tm.alts&&tm.alts[k])||{},el=empOfTeam(tm);
 const [pick,setPick]=useState(""),[conf,setConf]=useState(false),[chg,setChg]=useState(false),[cp,setCp]=useState("");
 const taken=[1,2,3,4,5].map(i=>g.off+i).filter(n=>n!==t).map(n=>({n,e:empOfTeam(teams[n])})).filter(x=>x.e);
 const dup=k=>{const a=A(k);if(!str(a.n).trim())return null;const sl=slug(a.n);if(k==="C"&&tomadas&&(sl in tomadas))return {n:tomadas[sl]};return taken.find(x=>norm(x.e.n)===norm(a.n))||null;};
 const p=(k,f,v,d)=>wm(["alts",k,f],v,d==null?450:d);
 const s1=!!lid&&ms.length>0&&ms.every(([id])=>rolesOf(tm,id).length);
 const drawn=!!tm.sorteoAt;
 const s2=drawn&&SLOTS.every(([k])=>altInfo(A(k)));
 const [spin,setSpin]=useState(""),[dBusy,setDBusy]=useState(false),[dMsg,setDMsg]=useState("");
 const free=POOL.filter(x=>!takenBy(sorteo,x)).length;
 const runDraw=async()=>{if(dBusy)return;setDBusy(true);setDMsg("");let i=0;const iv=setInterval(()=>{setSpin(POOL[i%POOL.length].n);i++;},90);
  try{const r=await drawAB(t);await new Promise(x=>setTimeout(x,1400));clearInterval(iv);setSpin("");setDMsg(r.ok?"¡Listo! A: "+r.a+" · B: "+r.b:r.msg);}
  catch(e){clearInterval(iv);setSpin("");setDMsg("No se pudo completar el sorteo. Inténtenlo de nuevo.");}
  setDBusy(false);};
 const s3=SLOTS.every(([k])=>altContact(A(k)));
 const s4=SLOTS.every(([k])=>altScored(A(k))&&altQual(A(k)));
 const s5=!!el;
 const accepted=SLOTS.filter(([k])=>altOk(A(k))&&A(k).acepta==="Sí");
 const just=str(tm.just),ev=str(tm.evid),evOk=/^https?:\/\/\S+\.\S+/.test(ev.trim());
 const copy=(txt,k)=>{try{navigator.clipboard.writeText(txt).then(()=>setCp(k),()=>{});}catch(e){}};
 const done=[s1,s2,s3,s4,s5].filter(Boolean).length,next=[s1,s2,s3,s4,s5].findIndex(x=>!x)+1;
 const fromCat=(k,name)=>{const it=CATALL.find(x=>x.n===name);if(!it)return;p(k,"n",it.n,0);p(k,"tipo",it.tipo,0);p(k,"giro",it.s,0);p(k,"orig","Catálogo",0);};
 return h("div",{className:"stack"},
  h("div",{className:"card",style:{borderColor:"var(--or)"}},h("h2",null,"Ruta para elegir su organización"),
   h("p",null,"Investiguen ",h("b",null,"tres organizaciones diferentes"),", contacten a sus dueños o responsables, compárenlas y elijan la que usarán en todo el proyecto. ",h("b",null,"Al menos una debe ser propuesta por ustedes"),", por ejemplo una empresa familiar."),
   h("div",{style:{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginTop:10}},["Roles","Tres alternativas","Contacto","Comparar","Decidir"].map((x,i)=>{const ok=[s1,s2,s3,s4,s5][i];return h("div",{key:i,style:{textAlign:"center"}},h("div",{style:{height:8,borderRadius:99,background:ok?"var(--okt)":i+1===next?"var(--or)":"var(--line)"}}),h("div",{className:"sm",style:{marginTop:4,fontWeight:i+1===next?800:600}},(i+1)+". "+x));})),
   h("p",{className:"sm mut",style:{marginTop:8}},done===5?"¡Listo! Ya tienen organización. Continúen con la semana 1.":"Van "+done+" de 5 pasos. Sigue: paso "+next+".")),

  el&&!chg?h("div",{className:"card",style:{borderColor:"var(--or)"}},h("h2",null,"Organización elegida"),
   h("div",{className:"co"},h("div",{className:"big"},el.n),h("p",{className:"mut"},[el.tipo,el.giro].filter(Boolean).join(" · ")),
    h("p",null,h("b",null,"Contacto: "),[el.contacto,el.cargo].filter(Boolean).join(", ")||"—"),h("p",null,h("b",null,"Por qué la eligieron: "),just||"—"),
    evOk?h("p",null,h("b",null,"Evidencia: "),h("a",{href:ev.trim(),target:"_blank",rel:"noopener"},"abrir carta o evidencia")):null),
   h("p",{className:"sm mut",style:{marginTop:8}},"Elegida"+(tm.elegAt?" el "+fmt(tm.elegAt):"")+(tm.elegBy?" por "+tm.elegBy:"")+"."),
   iAmLead||isAdmin?h("button",{className:"btn alt sm",style:{marginTop:6},onClick:()=>setChg(true)},"Cambiar la elección"):null):null,

  h(Step,{n:1,t:"Asuman sus roles directivos",done:s1,open:next===1},
   h("p",{className:"mut sm"},"Cada integrante asume al menos un rol. El Director General confirma la elección en el paso 5 y marca las entregas."),
   !me&&!isAdmin?h("p",{className:"pill wa",style:{whiteSpace:"normal"}},"Entra con tu nombre para asumir un rol."):null,
   ROLES.map(r=>{const hid=str(tm&&tm.roles&&tm.roles[r.k]),hn=hid?nameOf(tm,hid):"",mine=!!hn&&hid===me;
    return h("div",{key:r.k,className:"bar",style:{padding:"8px 0",borderBottom:"1px solid var(--line)"}},
     h("div",{style:{minWidth:0,flex:"1 1 260px"}},h("b",null,r.n),h("div",{className:"mut sm"},r.d)),
     h("div",{className:"row"},hn?h("span",{className:"pill ok"},hn+(mine?" (tú)":"")):h("span",{className:"pill wa"},"Libre"),
      mine?h("button",{className:"btn alt sm",onClick:()=>wm(["roles",r.k],"",0)},"Soltar"):!hn&&me?h("button",{className:"btn sm",onClick:()=>wm(["roles",r.k],me,0)},"Asumir"):null));}),
   (()=>{const sin=ms.filter(([id])=>!rolesOf(tm,id).length).map(([,x])=>x.n);return sin.length?h("p",{className:"sm mut",style:{marginTop:8}},"Sin rol todavía: "+sin.join(", ")+"."):null;})()),

  h(Step,{n:2,t:"Investiguen tres organizaciones diferentes",done:s2,open:next===2},
   h("div",{className:"co",style:{marginBottom:10}},h("h3",null,"🎲 Sorteo de las alternativas A y B"),
    drawn?h("div",null,h("p",null,"Les tocaron: ",h("b",null,"A: "+str(A("A").n)),"  ·  ",h("b",null,"B: "+str(A("B").n))),
      h("p",{className:"sm mut"},"Sorteo realizado"+(tm.sorteoAt?" el "+fmt(tm.sorteoAt):"")+(tm.sorteoBy?" por "+tm.sorteoBy:"")+". El tablero completo está en la pestaña «Sorteo»."),
      [A("A").n,A("B").n].map(n=>{const it=CATALL.find(x=>x.n===n);return it?h("div",{key:n,className:"sm"},h("b",null,it.n+": "),it.links.map(([lt,u],j)=>h("span",{key:u},j?" · ":"",h("a",{href:u,target:"_blank",rel:"noopener"},lt)))):null;}))
    :h("div",null,h("p",{className:"sm"},"El Director General presiona el botón y la página asigna dos organizaciones del catálogo que ",h("b",null,"ningún otro equipo de Liderazgo ni de Administración tiene"),". La B sale de un giro distinto a la A."),
     spin?h("div",{className:"drum","aria-live":"polite"},"🎲 "+spin):null,
     iAmLead?h("button",{className:"btn",disabled:dBusy,onClick:runDraw},dBusy?"Sorteando…":"🎲 Sortear nuestras alternativas A y B")
      :h("p",{className:"pill wa",style:{whiteSpace:"normal"}},lid?"Solo "+nameOf(tm,lid)+" (Director General) puede hacer el sorteo.":"Primero alguien debe asumir el rol de Director General (paso 1)."),
     dMsg?h("p",{role:"status",style:{fontWeight:700}},dMsg):null)),
   h("p",{className:"mut sm"},"Para cada una, una investigación rápida: qué hace y qué problema u oportunidad observan. La C la proponen ustedes."),
   SLOTS.map(([k,l,d])=>{const a=A(k),isC=k==="C",du=dup(k);
    return h("div",{key:k,className:"ex",style:{marginTop:10,background:isC?"var(--soft)":"var(--ex)"}},
     h("div",{className:"bar"},h("h3",{style:{margin:0}},l),altInfo(a)?h("span",{className:"pill ok"},"Completa"):h("span",{className:"pill wa"},"Por completar")),
     h("p",{className:"sm mut"},d),
     du?h("p",{className:"pill wa",style:{whiteSpace:"normal"}},isAdmin&&du.n>0?"El Equipo "+loc(du.n)+" ya tiene esta organización: propongan otra.":"Esa organización no está disponible: propongan otra."):null,
     !isC&&!drawn?h("p",{className:"pill wa",style:{whiteSpace:"normal"}},"Se llena sola después del sorteo."):null,
     h("div",{className:"g2"},
      h(Field,{id:k+"n",l:"Nombre de la organización",v:a.n,ro:!canEdit||!isC,on:v=>{p(k,"n",v);if(isC)p(k,"orig","Propuesta del equipo",0);},ph:isC?"Ej.: Taller mecánico Hermanos López":""}),
      h("div",null,h("label",{className:"l",htmlFor:k+"tp"},"Tipo"),h("select",{id:k+"tp",value:str(a.tipo),disabled:!canEdit||!isC,onChange:e=>p(k,"tipo",e.target.value,0)},h("option",{value:""},"Elegir…"),TIPOS.map(x=>h("option",{key:x},x)))),
      h(Field,{id:k+"g",l:"Giro o actividad",v:a.giro,ro:!canEdit,on:v=>p(k,"giro",v)}),
      h(Field,{id:k+"u",l:"Ubicación",v:a.ubi,ro:!canEdit,on:v=>p(k,"ubi",v),ph:"Colonia o zona de Cancún"})),
     h(Field,{id:k+"q",l:"¿Qué hace y a quién atiende? (2 o 3 líneas)",area:true,v:a.que,ro:!canEdit,on:v=>p(k,"que",v)}),
     h(Field,{id:k+"pb",l:"Problema u oportunidad de mejora que observan",area:true,v:a.prob_t,ro:!canEdit,on:v=>p(k,"prob_t",v)}));})),

  h(Step,{n:3,t:"Contacten a los dueños o responsables",done:s3,open:next===3},
   h("p",{className:"mut sm"},"Preséntense con la carta o el mensaje de abajo, pidan una entrevista de 30 minutos y registren el resultado."),
   h("div",{className:"row",style:{marginBottom:8}},h("button",{className:"btn alt sm",onClick:()=>copy(cartaTxt(t,tm),"c")},cp==="c"?"Carta copiada":"Copiar carta de presentación"),h("button",{className:"btn alt sm",onClick:()=>copy(GUION,"m")},cp==="m"?"Mensaje copiado":"Copiar mensaje breve"),h("button",{className:"btn alt sm",onClick:()=>copy(guiaTxt(),"g")},cp==="g"?"Guía copiada":"Copiar guía de entrevista")),
   h("details",{style:{margin:"6px 0 10px"}},h("summary",{className:"sm"},"Ver guía de entrevista"),h("div",{style:{marginTop:8}},h(Guia))),
   SLOTS.map(([k,l])=>{const a=A(k);return h("div",{key:k,className:"ex",style:{marginTop:10}},
    h("div",{className:"bar"},h("h3",{style:{margin:0}},l+": "+(str(a.n)||"sin nombre")),altContact(a)?h("span",{className:"pill ok"},"Contactada"):h("span",{className:"pill wa"},"Pendiente")),
    h("div",{className:"g2"},
     h(Field,{id:k+"c",l:"Persona contactada",v:a.contacto,ro:!canEdit,on:v=>p(k,"contacto",v),ph:"Nombre completo"}),
     h(Field,{id:k+"cg",l:"Cargo",v:a.cargo,ro:!canEdit,on:v=>p(k,"cargo",v),ph:"Dueña, gerente, directora…"}),
     h("div",null,h("label",{className:"l",htmlFor:k+"m"},"Medio"),h("select",{id:k+"m",value:str(a.medio),disabled:!canEdit,onChange:e=>p(k,"medio",e.target.value,0)},h("option",{value:""},"Elegir…"),MEDIOS.map(x=>h("option",{key:x},x)))),
     h(Field,{id:k+"f",l:"Fecha del contacto",type:"date",v:a.fecha,ro:!canEdit,on:v=>p(k,"fecha",v,0)}),
     h("div",null,h("label",{className:"l",htmlFor:k+"ac"},"¿Aceptó colaborar con el proyecto?"),h("select",{id:k+"ac",value:str(a.acepta),disabled:!canEdit,onChange:e=>p(k,"acepta",e.target.value,0)},h("option",{value:""},"Elegir…"),["Sí","En espera de respuesta","No"].map(x=>h("option",{key:x},x)))),
     h(Field,{id:k+"ev",l:"Liga a evidencia (opcional)",type:"url",v:a.evid,ro:!canEdit,on:v=>p(k,"evid",v),ph:"https://…"})),
    h(Field,{id:k+"no",l:"Notas de la conversación",area:true,v:a.notas,ro:!canEdit,on:v=>p(k,"notas",v),ph:"Qué les contaron, qué información pueden compartir, horarios para volver"}));})),

  h(Step,{n:4,t:"Análisis comparativo: cuantitativo y cualitativo",done:s4,open:next===4},
   h("p",null,"Comparen las tres alternativas con dos miradas que se complementan. ",h("b",null,"Los números")," ordenan las opciones con criterios iguales para todas; ",h("b",null,"los argumentos")," explican lo que los números no muestran. La decisión del paso 5 debe considerar ambas."),
   h("h3",{style:{marginTop:12}},"4A · Análisis cuantitativo: matriz ponderada"),
   h("p",{className:"sm mut"},"Califiquen cada criterio del 1 al 5. Los pesos son iguales para todos los equipos y suman 100%."),
   h(CompCuant,{al:tm.alts||{},edit:canEdit,onSet:(k,c,v)=>p(k,c,v,0)}),
   h("h3",{style:{marginTop:16}},"4B · Análisis cualitativo"),
   h("p",{className:"sm mut"},"Para cada alternativa, escriban al menos una línea (20 caracteres) en cada aspecto."),
   h("div",{className:"grid",style:{gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))"}},SLOTS.map(([k])=>{const a=A(k);
    return h("div",{key:k,className:"ex"},h("div",{className:"bar"},h("b",null,k+". "+(str(a.n)||"sin nombre")),altQual(a)?h("span",{className:"pill ok"},"Completo"):h("span",{className:"pill wa"},"Por completar")),
     QL.map(([c,l,ph])=>h(Field,{key:c,id:k+c,l,area:true,v:a[c],ro:!canEdit,on:v=>p(k,c,v),ph})));}))),

  !el||chg?h(Step,{n:5,t:"Decisión: elijan con base en el análisis",done:s5,open:next===5||chg||(s2&&s3&&s4)},
   !(s2&&s3&&s4)?h("p",{className:"pill wa",style:{whiteSpace:"normal"}},"Completen los pasos 2, 3 y 4 para poder elegir."):
   !accepted.length?h("p",{className:"pill wa",style:{whiteSpace:"normal"}},"Ninguna alternativa aceptó colaborar todavía. Esperen respuesta o busquen otra opción para la casilla que respondió «No»."):
   !iAmLead&&!isAdmin?h("p",{className:"pill wa",style:{whiteSpace:"normal"}},lid?"Cuando estén de acuerdo, "+nameOf(tm,lid)+" (Director General) confirma la elección.":"Primero alguien debe asumir el rol de Director General."):
   h("div",null,
    (()=>{const rk=ranking(tm.alts||{}),top=rk[0],pk=pick||tm.elegida;return h("div",{className:"ex",style:{marginBottom:8}},
      h("p",null,h("b",null,"Resultado cuantitativo: "),rk.map(([k,a],i)=>(i+1)+"° "+k+". "+a.n+" ("+altPond(a)+")").join(" · ")),
      top&&top[1].acepta!=="Sí"?h("p",{className:"sm"},"La de mayor puntaje no aceptó colaborar, así que no se puede elegir."):null,
      pk&&top&&pk!==top[0]?h("p",{className:"pill wa",style:{whiteSpace:"normal"}},"Eligieron una organización que no es la de mayor puntaje. En la justificación expliquen qué razones cualitativas pesaron más."):null);})(),
    h("p",{className:"sm mut"},"Solo pueden elegir una organización que haya aceptado colaborar."),
    h("div",{className:"grid"},accepted.map(([k])=>h("button",{key:k,className:"opt","aria-pressed":(pick||tm.elegida)===k,onClick:()=>setPick(k)},h("b",null,A(k).n),h("span",{className:"mut sm"},altPond(A(k))+"/100"+(dup(k)?" · ya elegida por otro equipo":""))))),
    h(Field,{id:"just",l:"Justificación integrada: ¿qué dicen los números y qué dicen los argumentos cualitativos? ¿Por qué esta y no las otras? (mínimo 120 caracteres)",area:true,v:tm.just,on:v=>wm(["just"],v),ph:"Ej.: Obtuvo 86/100, el mayor puntaje, sobre todo por acceso a información y disposición del dueño. Además, en la entrevista nos compartió… Descartamos la B porque…"}),
    h(Field,{id:"evid",l:"Liga a la carta de aceptación o evidencia del acuerdo",type:"url",v:tm.evid,on:v=>wm(["evid"],v),ph:"https://drive.google.com/…"}),
    conf?h("div",{className:"row",style:{marginTop:10}},h("button",{className:"btn",onClick:()=>{wm(["elegida"],pick||tm.elegida,0);wm(["elegAt"],Date.now(),0);wm(["elegBy"],myName||"Docente",0);setConf(false);setChg(false);setPick("");}},"Sí, confirmar"),h("button",{className:"btn alt",onClick:()=>setConf(false)},"Cancelar"))
     :h("div",{className:"row",style:{marginTop:10}},h("button",{className:"btn",disabled:!(pick||(chg&&tm.elegida))||just.trim().length<120,onClick:()=>setConf(true)},"Confirmar la elección"),chg?h("button",{className:"btn alt",onClick:()=>{setChg(false);setPick("");}},"Cancelar cambio"):null),
    just.trim().length<120?h("p",{className:"sm mut"},"La justificación lleva "+just.trim().length+" de 120 caracteres."):null)):null);
}

/* ---------- Documento de una entrega (formato estándar) ---------- */
function Ficha({k,a,el}){
 const r=(l,v)=>h("tr",null,h("th",{className:"g",style:{textAlign:"left",width:"34%"}},l),h("td",null,str(v)||"—"));
 return h("div",{className:"sec",style:{marginTop:8}},h("h4",null,"Ficha "+k+": "+(str(a.n)||"sin nombre")+(el?" ✓ elegida":"")),
  h("div",{className:"w"},h("table",null,h("tbody",null,r("Tipo",a.tipo),r("Giro y ubicación",[a.giro,a.ubi].filter(Boolean).join(" · ")),r("Qué hace y a quién atiende",a.que),r("Problema u oportunidad observada",a.prob_t),
   r("Persona contactada",[a.contacto,a.cargo].filter(Boolean).join(", ")),r("Medio y fecha",[a.medio,a.fecha].filter(Boolean).join(" · ")),r("¿Aceptó colaborar?",a.acepta),r("Puntaje ponderado",altScored(a)?altPond(a)+" / 100":""),r("Fortalezas",a.fort),r("Riesgos o limitaciones",a.ries),r("Hallazgo clave",a.hall),r("Notas",a.notas)))));
}
function DocEntrega({wi,t,tm,wd,cover}){
 const w=W[wi],d=wd||{},ms=members(tm),e=empOfTeam(tm),nums=w.nu.map((_,i)=>parseFloat(d.n&&d.n[i])||0),cs=calcW(wi,nums,ms.length);
 const H=txt=>h("h3",{className:"sec",style:{marginTop:14,color:"var(--ord)"}},txt);
 return h("div",{className:"doc"},
  cover!==false?h("div",{className:"sec",style:{borderBottom:"3px solid var(--or)",paddingBottom:10,marginBottom:6}},
   h("p",{className:"sm mut"},"Proyecto Integrador · ADM1401 Introducción a la Empresa · Escuela Internacional de Negocios · Universidad Anáhuac Cancún"),
   h("h2",{style:{fontSize:"1.4rem",margin:"6px 0"}},"Entrega S"+(wi+1)+": "+w.t),
   h("p",null,h("b",null,"Organización: "),e?e.n:"por registrar",h("br"),h("b",null,"Grupo y equipo: "),tLab(t),h("br"),
    h("b",null,"Integrantes y roles: "),ms.map(([id,x])=>x.n+(rolesOf(tm,id).length?" ("+rolesOf(tm,id).join(", ")+")":"")).join("; ")||"—",h("br"),
    h("b",null,"Fecha de entrega: "),d.est==="Entregado"&&d.at?fmt(d.at):"sin entregar"," · ",h("b",null,"Docente: "),"Mtra. Tania Rivera Lozano")):
   h("h3",{className:"sec",style:{fontSize:"1.15rem",borderBottom:"2px solid var(--or)",paddingBottom:4}},"S"+(wi+1)+" · "+w.t),
  H("1. Objetivo de la entrega"),h("p",null,w.q),
  H("2. Desarrollo"),
  w.tx.map((x,i)=>h("div",{key:i,className:"sec"},h("h4",{style:{margin:"8px 0 2px"}},"2."+(i+1)+" "+x),h("p",{style:{whiteSpace:"pre-wrap"}},str(d.t&&d.t[i])||"Sin capturar"))),
  wi===0?(altsOf(tm).length?h("div",{className:"sec"},h("h4",{style:{margin:"10px 0 2px"}},"2."+(w.tx.length+1)+" Análisis comparativo de las tres alternativas"),
   h("h4",{style:{margin:"8px 0 4px"}},"a) Análisis cuantitativo: matriz ponderada"),h(CompCuant,{al:tm.alts||{},edit:false}),
   h("h4",{style:{margin:"12px 0 4px"}},"b) Análisis cualitativo"),h(CompCual,{al:tm.alts||{}}),
   h("h4",{style:{margin:"12px 0 4px"}},"c) Decisión"),h(Decision,{tm}),
   h("h4",{style:{margin:"12px 0 4px"}},"d) Fichas de las alternativas"),
   SLOTS.map(([k])=>h(Ficha,{key:k,k,a:(tm.alts&&tm.alts[k])||{},el:tm.elegida===k})),
   str(tm.evid)?h("p",{className:"sm",style:{overflowWrap:"anywhere"}},h("b",null,"Evidencia del acuerdo con la organización: "),tm.evid):null)
   :h("div",{className:"sec"},h("h4",{style:{margin:"10px 0 4px"}},"2."+(w.tx.length+1)+" Ficha de la organización"),h(FichaOrg,{o:e||{}}))):null,
  H("3. Datos y cálculos"),
  w.nu.length||w.c.length?h("div",{className:"w"},h("table",null,h("tbody",null,
   w.nu.map((x,i)=>h("tr",{key:"n"+i},h("td",null,x),h("td",{className:"c"},fm(x)(nums[i])))),
   w.c.map((c,i)=>h("tr",{key:"c"+i},h("td",null,h("b",null,c[0])),h("td",{className:"c"},h("b",null,showC(wi,i,cs[i])))))))):h("p",{className:"mut"},"Esta entrega no lleva cálculos."),
  H("4. Conclusión para la propuesta de mejora"),h("p",{style:{whiteSpace:"pre-wrap"}},str(d.concl)||"Sin capturar"),
  rolesAsumidos(tm).length?h("div",{className:"sec"},h("h4",{style:{margin:"10px 0 4px"}},"4.1 Perspectiva de cada rol directivo"),
   rolesAsumidos(tm).map(([r,,nm])=>h("p",{key:r.k,style:{whiteSpace:"pre-wrap",margin:"4px 0"}},h("b",null,r.a+" · "+nm+": "),str(d.rol&&d.rol[r.k])||"Sin aporte"))):null,
  H("5. Fuentes (APA 7) y anexos"),h("p",{style:{whiteSpace:"pre-wrap"}},str(d.src)||"Sin fuentes"),
  str(d.link)?h("p",{className:"sm",style:{overflowWrap:"anywhere"}},h("b",null,"Anexos: "),d.link):null,
  w.fin?h("div",{className:"sec"},h("h4",{style:{margin:"10px 0 2px"}},"Entregables del proyecto final"),
   h("p",{className:"sm",style:{overflowWrap:"anywhere"}},h("b",null,"Presentación del pitch: "),str(d.pres)||"pendiente",h("br"),h("b",null,"Evidencia ante la organización: "),str(d.evorg)||"pendiente",str(d.video)?[h("br",{key:1}),h("b",{key:2},"Video del pitch: "),d.video]:null)):null);
}

/* =====================================================================
   ACCESO POR ROL · PROFESOR (clave maestra) o EQUIPO (clave del equipo)
   ---------------------------------------------------------------------
   · Cada equipo de los dos grupos tiene una CLAVE ÚNICA (XXX-XXX-XXX).
     Sin ella no se entra, no se consulta y no se guarda nada.
   · La clave solo abre SU equipo: con una clave equivocada, o al intentar
     abrir otro equipo, el acceso se niega de inmediato.
   · Antes de ver o guardar avances, el equipo confirma a sus integrantes
     con su rol directivo y quién está capturando.
   · La docente entra con su clave maestra y ve los dos grupos, todos los
     equipos y sus claves.
   En la versión con Hoja de Google las claves las genera y verifica el
   servidor. En el artefacto y en la demostración se guardan cifradas:
   «llaves» solo tiene una huella (PBKDF2) y «claves» solo la lee la docente.
   ===================================================================== */
const SS={m:{},get(k){try{const v=sessionStorage.getItem(k);if(v!=null)return JSON.parse(v);}catch(e){}return SS.m[k]==null?null:SS.m[k];},
 set(k,v){SS.m[k]=v;try{if(v==null)sessionStorage.removeItem(k);else sessionStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
const ABC="ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const nuevaClave=()=>{const a=new Uint32Array(9);crypto.getRandomValues(a);let s="";a.forEach(x=>{s+=ABC[x%ABC.length];});return s.slice(0,3)+"-"+s.slice(3,6)+"-"+s.slice(6);};
const normClave=c=>String(c||"").toUpperCase().replace(/[^A-Z0-9]/g,"");
const nuevaSal=()=>{const a=new Uint8Array(16);crypto.getRandomValues(a);return Array.from(a,x=>x.toString(16).padStart(2,"0")).join("");};
async function huella(txt,sal){const en=new TextEncoder(),k=await crypto.subtle.importKey("raw",en.encode(txt),"PBKDF2",false,["deriveBits"]);
 const b=await crypto.subtle.deriveBits({name:"PBKDF2",salt:en.encode(sal),iterations:60000,hash:"SHA-256"},k,256);return btoa(String.fromCharCode(...new Uint8Array(b)));}
const MSG_CLAVE="Clave incorrecta. Acceso denegado.";
/* Freno a intentos repetidos: después de 5 errores, espera de 60 segundos. */
const intentos={get(){const v=SS.get("pi-int")||{n:0,h:0};return v;},fallo(){const v=intentos.get();v.n++;if(v.n>=5){v.h=Date.now()+60000;v.n=0;}SS.set("pi-int",v);return v;},ok(){SS.set("pi-int",null);},
 espera(){const v=intentos.get();return Math.max(0,Math.ceil((v.h-Date.now())/1000));}};

function Acceso({db,editor,llaves,onSes}){
 const B=window.PI_BACKEND,[modo,setModo]=useState(""),[k1,setK1]=useState(""),[k2,setK2]=useState(""),[msg,setMsg]=useState(""),[busy,setBusy]=useState(false),[maestra,setMaestra]=useState(undefined);
 const art=B.mode==="artifact",puedeDoc=!art||editor;
 useEffect(()=>{if(modo!=="profesor"||!db||!puedeDoc)return;let ok=true;db.doc("claves/maestra").get().then(sn=>{if(ok)setMaestra(sn.exists?sn.data():null);}).catch(()=>{if(ok)setMaestra(null);});return()=>{ok=false};},[modo,db,puedeDoc]);
 const cambiar=m=>{setModo(m);setK1("");setK2("");setMsg("");};
 const negar=()=>{const v=intentos.fallo();setMsg(MSG_CLAVE+(v.h>Date.now()?" Demasiados intentos: espera 60 segundos.":""));};
 const docente=async e=>{e.preventDefault();if(busy)return;const w=intentos.espera();if(w){setMsg("Espera "+w+" s antes de intentarlo de nuevo.");return;}setBusy(true);setMsg("");
  try{if(maestra===null){if(k1.trim().length<6){setMsg("La clave maestra debe tener al menos 6 caracteres.");}else if(k1!==k2){setMsg("Las dos claves no coinciden.");}
    else{const s=nuevaSal();await db.doc("claves/maestra").set({s,h:await huella(k1.trim(),s),at:Date.now()});intentos.ok();onSes({rol:"docente"});}}
   else if(maestra&&await huella(k1.trim(),maestra.s)===maestra.h){intentos.ok();onSes({rol:"docente"});}
   else negar();}catch(x){setMsg("No se pudo verificar. Revisa tu conexión.");}setBusy(false);};
 const equipo=async e=>{e.preventDefault();if(busy)return;const w=intentos.espera();if(w){setMsg("Espera "+w+" s antes de intentarlo de nuevo.");return;}
  const c=normClave(k1);if(c.length!==9){negar();return;}
  setBusy(true);setMsg("");
  let L=Object.entries(llaves||{}).filter(([,v])=>v&&v.s&&v.h);
  if(!L.length&&db){for(let n=1;n<=NT;n++){try{const sn=await db.doc("llaves/"+n).get();if(sn.exists)L.push([String(n),sn.data()||{}]);}catch(e){}}L=L.filter(([,v])=>v.s&&v.h);}
  if(!L.length){setMsg("La docente aún no activa las claves de equipo. Pídesela en clase.");setBusy(false);return;}
  try{let t=0,hh="";for(const [n,v] of L){const x=await huella(c,v.s);if(x===v.h){t=+n;hh=x;break;}}
   if(t>=1&&t<=NT){intentos.ok();onSes({rol:"equipo",t,h:hh});}else negar();}catch(x){setMsg("No se pudo verificar. Revisa tu conexión.");}setBusy(false);};
 const tarjeta=(m,ic,tit,sub)=>h("button",{className:"opt","aria-pressed":modo===m,onClick:()=>cambiar(m),style:{minHeight:96}},h("b",{style:{fontSize:"1.1rem"}},ic+" "+tit),h("span",{className:"mut sm"},sub));
 return h("div",{className:"stack"},
  h("div",{className:"card",style:{borderColor:"var(--or)",maxWidth:620}},
   h("h2",null,"¿Cómo ingresas?"),
   h("p",{className:"mut sm"},"Elige tu tipo de acceso. Cada equipo trabaja solo en su espacio, protegido con su clave."),
   h("div",{className:"grid"},tarjeta("profesor","🎓","PROFESOR","Clave maestra · ve los dos grupos, todos los equipos y sus claves"),tarjeta("equipo","👥","EQUIPO","Clave de tu equipo · solo tu equipo")),
   modo==="profesor"?(!puedeDoc?h("p",{className:"pill ko",role:"alert",style:{whiteSpace:"normal",display:"block",padding:"8px 12px",marginTop:12}},"🔒 Acceso denegado. Solo la docente puede entrar como profesor.")
    :maestra===undefined?h("p",{className:"mut",style:{marginTop:12}},"Verificando…")
    :h("form",{onSubmit:docente,style:{marginTop:12}},
      maestra===null?h("p",{className:"sm"},h("b",null,"Primera vez: crea tu clave maestra."),"Con ella entras como profesor y ves las claves de los 10 equipos. Guárdala en un lugar seguro: no se puede recuperar."):null,
      h("label",{className:"l",htmlFor:"k-m"},maestra===null?"Nueva clave maestra (mínimo 6 caracteres)":"Clave maestra"),h("input",{id:"k-m",type:"password",autoComplete:maestra===null?"new-password":"current-password",value:k1,onChange:e=>setK1(e.target.value),required:true}),
      maestra===null?h("div",null,h("label",{className:"l",htmlFor:"k-m2"},"Repite la clave maestra"),h("input",{id:"k-m2",type:"password",autoComplete:"new-password",value:k2,onChange:e=>setK2(e.target.value),required:true})):null,
      h("button",{className:"btn",style:{marginTop:10},disabled:busy||!k1},busy?"Verificando…":maestra===null?"Crear clave maestra y entrar":"Entrar como profesor"))):null,
   modo==="equipo"?h("form",{onSubmit:equipo,style:{marginTop:12}},
     h("label",{className:"l",htmlFor:"k-e"},"Clave de seguridad del equipo"),
     h("input",{id:"k-e",type:"text",autoComplete:"off",autoCapitalize:"characters",spellCheck:false,placeholder:"XXX-XXX-XXX",value:k1,onChange:e=>setK1(e.target.value),required:true,style:{letterSpacing:".12em",fontWeight:700}}),
     h("p",{className:"sm mut"},"La docente entrega una clave distinta a cada equipo. No la compartan con otros equipos."),
     h("button",{className:"btn",disabled:busy||!k1},busy?"Verificando…":"Entrar a mi equipo")):null,
   msg?h("p",{className:"pill ko",role:"alert",style:{whiteSpace:"normal",display:"block",padding:"8px 12px",marginTop:10}},"🔒 "+msg):null,
   h("p",{className:"mut sm",style:{marginTop:12}},B.mode!=="local"?"🟢 En vivo: lo que capturen se guarda solo y lo ven solo su equipo y la docente.":"⚪ Modo de demostración: lo capturado se guarda solo en este navegador.")),
  h("details",{className:"card"},h("summary",null,h("b",null,"📋 Instrucciones paso a paso para los equipos")),h(ListaPasos,{pasos:PASOS_EQUIPO})),
  h("details",{className:"card"},h("summary",null,h("b",null,"🎓 Instrucciones paso a paso para el profesor")),h(ListaPasos,{pasos:pasosDocente()})),
  h(QueSePide));
}

/* Confirmación obligatoria al entrar con la clave: integrantes, rol directivo de cada uno y quién captura. */
function Confirmar({t,tm,teams,addMem,wm,libresSrv,onOk,salir}){
 const B=window.PI_BACKEND,sheets=B.mode==="sheets",g=grpOf(t),ms=members(tm),MAX=CFG_EQ.max;
 const [yo,setYo]=useState(()=>{const c=SS.get("pi-conf-"+t)||str(B.session().me);return ms.some(([id])=>id===c)?c:"";});
 const [pick,setPick]=useState([]),[busy,setBusy]=useState(false),[msg,setMsg]=useState(""),[nw,setNw]=useState("");
 const reg=regMap(g,teams),cands=sheets?(libresSrv||[]):rosterOf(g).map(fullName).filter(n=>!reg[norm(n)]);
 const cap=Math.max(0,MAX-ms.length);
 const agregar=async names=>{if(!names.length||busy)return;setBusy(true);setMsg("");const errs=[];
  try{if(sheets){for(const n of names){const r=await B.asignar({nombre:n,eq:t});if(!r.ok)errs.push(r.msg);}}else await addMem(t,names);}catch(e){errs.push("No se pudo guardar. Revisa tu conexión.");}
  setBusy(false);setPick([]);setNw("");setMsg(errs.join(" "));};
 const quitar=async id=>{if(busy)return;setBusy(true);setMsg("");
  try{if(sheets){const r=await B.asignar({id,eq:0});if(!r.ok)setMsg(r.msg);}else{wm(["mem",id,"del"],true,0);ROLES.forEach(r=>{if(tm.roles&&tm.roles[r.k]===id)wm(["roles",r.k],"",0);});}}catch(e){setMsg("No se pudo guardar. Revisa tu conexión.");}
  if(id===yo)setYo("");setBusy(false);};
 const sinRol=ms.filter(([id])=>!rolesOf(tm,id).length).map(([,x])=>x.n),dg=leaderOf(tm);
 const faltan=[!ms.length&&"Registren al menos a un integrante.",ms.length&&sinRol.length&&"Falta rol para: "+sinRol.join(", ")+".",ms.length&&!dg&&"Asignen al Director General (CEO).",!yo&&"Indica quién eres tú."].filter(Boolean);
 const confirmar=()=>{if(faltan.length)return;SS.set("pi-conf-"+t,yo);onOk(yo);};
 return h("div",{className:"stack"},
  h("div",{className:"card",style:{borderColor:"var(--or)"}},
   h("div",{className:"bar"},h("div",null,h("span",{className:"pill ok"},"✓ Clave válida"),h("h2",{style:{margin:"6px 0 0"}},tLab(t)+(str(tm.nombre).trim()?" · "+tm.nombre:""))),h("button",{className:"btn alt sm",onClick:salir},"Salir")),
   h("p",null,"Antes de ver o guardar cualquier avance, ",h("b",null,"confirmen a los integrantes del equipo y el rol directivo de cada uno"),". Cada quien responderá en las entregas desde la perspectiva de su rol."),
   h("p",{className:"sm mut"},"Paso 3 de las instrucciones: 1) agreguen integrantes · 2) asignen roles · 3) elige quién eres · Confirmar."),
   h(AutoGuardado)),
  h("div",{className:"card"},h("div",{className:"bar"},h("h2",{style:{margin:0}},"1. Integrantes"),h("span",{className:"pill "+(ms.length>=CFG_EQ.min&&ms.length<=MAX?"ok":"wa")},ms.length+" de "+MAX)),
   ms.length?h("div",{className:"sel-grid",style:{marginTop:8}},ms.map(([id,x])=>h("div",{key:id,className:"tarjeta",style:{cursor:"default"}},h(Avatar,{n:x.n}),
    h("div",{style:{minWidth:0,flex:1}},h("b",null,x.n),h("div",{className:"sm mut"},rolesOf(tm,id).join(", ")||"Sin rol")),
    h("button",{className:"btn alt sm",disabled:busy,"aria-label":"Quitar a "+x.n,onClick:()=>quitar(id)},"Quitar")))):h("p",{className:"mut"},"Aún no hay integrantes registrados."),
   cap?h("div",{style:{marginTop:12}},h("h3",null,"Agregar integrantes"),
    cands.length?h("div",null,h(Selector,{id:"cf"+t,items:cands.map(n=>({n,detalle:"Sin equipo"})),sel:pick,setSel:setPick,max:cap,min:0}),
     h("button",{className:"btn",style:{marginTop:8},disabled:!pick.length||busy,onClick:()=>agregar(pick)},busy?"Guardando…":"Agregar "+(pick.length||"")+" al equipo")):h("p",{className:"sm mut"},"No hay más alumnos del grupo sin equipo."),
    sheets?h("p",{className:"sm mut"},"¿Falta alguien en la lista? Pídanle a la docente que lo agregue en la hoja «Alumnos»."):
    h("details",{style:{marginTop:8}},h("summary",{className:"sm mut"},"¿Alguien no está en la lista?"),h("div",{className:"row",style:{alignItems:"flex-end"}},h("div",{style:{flex:"1 1 240px"}},h(Field,{id:"cfn",l:"Nombre completo",v:nw,on:setNw,ph:"Nombre y apellidos"})),
     h("button",{className:"btn alt",disabled:nw.trim().length<3||busy,onClick:()=>agregar([nw.trim()])},"Agregar")))):h("p",{className:"sm mut",style:{marginTop:8}},"El equipo está completo ("+MAX+")."),
   msg?h("p",{className:"sm",role:"alert",style:{color:"var(--kot)"}},msg):null),
  h("div",{className:"card"},h("h2",null,"2. Roles directivos"),
   h("p",{className:"sm mut"},"Cada integrante asume al menos un rol. En equipos pequeños, una persona puede tener dos."),
   ROLES.map(r=>{const v=str(tm.roles&&tm.roles[r.k]);return h("div",{key:r.k,className:"bar",style:{padding:"8px 0",borderTop:"1px solid var(--line)"}},
    h("div",{style:{minWidth:0,flex:"1 1 260px"}},h("b",null,r.n),h("div",{className:"sm mut"},r.d)),
    h("select",{"aria-label":r.n,value:ms.some(([id])=>id===v)?v:"",disabled:!ms.length,onChange:e=>wm(["roles",r.k],e.target.value,0),style:{maxWidth:240}},h("option",{value:""},"Sin asignar"),ms.map(([id,x])=>h("option",{key:id,value:id},x.n))));})),
  h("div",{className:"card"},h("h2",null,"3. ¿Quién eres tú?"),
   h("p",{className:"sm mut"},"Lo que captures quedará firmado con tu nombre y tu rol."),
   h("select",{id:"cf-yo","aria-label":"¿Quién eres tú?",value:yo,onChange:e=>setYo(e.target.value)},h("option",{value:""},"Elegir mi nombre…"),ms.map(([id,x])=>h("option",{key:id,value:id},x.n+(rolesAOf(tm,id).length?" · "+rolesAOf(tm,id).join("/"):"")))),
   faltan.length?h("ul",{className:"sm",style:{color:"var(--kot)",margin:"10px 0 0"}},faltan.map(f=>h("li",{key:f},f))):null,
   h("button",{className:"btn",style:{marginTop:10},disabled:!!faltan.length,onClick:confirmar},"Confirmar integrantes y roles · entrar")));
}

/* Panel docente: claves de seguridad de los 10 equipos. */
function ClavesEquipo({claves,regen,teams}){
 const [conf,setConf]=useState(0),[ver,setVer]=useState(false),[msg,setMsg]=useState("");
 const copiar=async(n,c)=>{try{await navigator.clipboard.writeText(c);setMsg("Clave del "+tLab(n)+" copiada.");}catch(e){setMsg("Selecciona la clave y cópiala a mano.");}};
 const csv=async()=>{const rows=[["Grupo","Equipo","Clave","Integrantes"]].concat(Array.from({length:NT},(_,i)=>i+1).map(n=>[grpOf(n).n,loc(n),claves[n]||"",members(teams[n]).map(([,x])=>x.n).join("; ")]));
  const data="﻿"+rows.map(r=>r.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(",")).join("\r\n");
  try{await window.PI_BACKEND.download({filename:"Claves_equipos_PI_ADM1401.csv",data});setMsg("Archivo descargado.");}catch(e){setMsg("Descarga cancelada.");}};
 return h("div",{className:"card",style:{borderColor:"var(--or)"}},
  h("div",{className:"bar"},h("h2",{style:{margin:0}},"🔑 Claves de seguridad por equipo"),h("div",{className:"row"},h("button",{className:"btn alt sm",onClick:()=>setVer(!ver)},ver?"Ocultar claves":"Mostrar claves"),h("button",{className:"btn alt sm",onClick:csv},"Descargar (CSV)"))),
  h("p",{className:"sm mut"},"Entrega a cada equipo solo su clave (en clase o por mensaje privado al CEO). Con ella entran, consultan y guardan; no abre ningún otro equipo. Si una clave se filtró, genera una nueva: la anterior deja de funcionar y el trabajo se conserva."),
  h("div",{className:"w"},h("table",null,h("thead",null,h("tr",null,h("th",null,"Grupo"),h("th",null,"Equipo"),h("th",null,"Clave"),h("th",null,"Integrantes"),h("th",null,""))),
   h("tbody",null,Array.from({length:NT},(_,i)=>i+1).map(n=>{const c=claves[n]||"";return h("tr",{key:n},h("td",null,grpOf(n).n),h("td",{className:"c"},loc(n)),
    h("td",null,c?h("code",{style:{fontSize:"1.05rem",fontWeight:700,letterSpacing:".08em"}},ver?c:"•••-•••-•••"):h("span",{className:"pill wa"},"Generando…")),
    h("td",{className:"c"},members(teams[n]).length),
    h("td",null,h("span",{className:"row"},c?h("button",{className:"btn alt sm",onClick:()=>copiar(n,c)},"Copiar"):null,
     conf===n?h("span",{className:"row"},h("button",{className:"btn sm",onClick:async()=>{setConf(0);const r=await regen(n);setMsg(r&&r.ok?"Nueva clave para el "+tLab(n)+". La anterior ya no funciona.":(r&&r.msg)||"No se pudo generar.");}},"Sí, cambiarla"),h("button",{className:"btn alt sm",onClick:()=>setConf(0)},"No"))
      :h("button",{className:"btn alt sm",onClick:()=>setConf(n)},"Nueva clave"))));})))),
  msg?h("p",{className:"sm",role:"status"},msg):null);
}

/* Panel docente: evaluación por rol directivo (aportes y nivel por semana). */
function EvalRoles({G,teams,allW,grades}){
 const TT=[1,2,3,4,5].map(i=>G.off+i);
 return h("div",{className:"card"},h("h2",null,"🎯 Evaluación por rol directivo · "+G.n),
  h("p",{className:"sm mut"},"Por equipo y rol: quién lo tiene, en cuántas semanas aportó desde su perspectiva y su nivel promedio. El nivel de cada aporte se marca dentro de cada semana del equipo («Abrir»)."),
  h("div",{className:"w"},h("table",null,h("thead",null,h("tr",null,h("th",null,"Equipo"),ROLES.map(r=>h("th",{key:r.k},r.a)))),
   h("tbody",null,TT.map(n=>{const tm=teams[n]||{},gr=grades[n]||{};
    return h("tr",{key:n},h("td",{className:"c"},h("b",null,loc(n))),ROLES.map(r=>{const id=str(tm.roles&&tm.roles[r.k]),nm=id?nameOf(tm,id):"";
     if(!nm)return h("td",{key:r.k,className:"c"},h("span",{className:"pill wa"},"Libre"));
     const ap=W.filter((w,i)=>str(((allW[n]||{})[i]||{}).rol&&((allW[n]||{})[i]||{}).rol[r.k]).trim().length>=40).length;
     const lv=W.map((w,i)=>gr.rl&&gr.rl[i]&&gr.rl[i][r.k]).filter(x=>typeof x==="number");
     const pr=lv.length?lv.reduce((s,x)=>s+NIV[x][1],0)/lv.length:null,lab=pr==null?"Sin evaluar":pr>=.95?"Excelente":pr>=.75?"Satisfactorio":pr>=.55?"En desarrollo":"Insuficiente";
     return h("td",{key:r.k},h("b",{className:"sm"},nm.split(" ")[0]),h("div",{className:"sm mut"},ap+"/8 aportes"),h("span",{className:"pill "+(pr==null?"":pr>=.75?"ok":pr>=.55?"wa":"ko"),style:{fontSize:".75rem"}},lab));}));})))));
}

/* ---------- Instrucciones paso a paso: para los equipos y para el profesor ---------- */
const PASOS_EQUIPO=[
 ["Recibe la clave de tu equipo","La docente entrega una clave de seguridad distinta a cada equipo (en clase, al CEO o por correo). Es solo de su equipo: no la compartan con nadie más."],
 ["Entra como EQUIPO","Abre la liga del proyecto, elige «👥 EQUIPO» y escribe la clave tal como la recibieron. Si la clave no coincide, el acceso se niega; después de 5 intentos fallidos hay que esperar 60 segundos."],
 ["Confirma integrantes y roles","Antes de ver o guardar avances: 1) agreguen a los integrantes que falten (de 3 a 6), 2) asignen un rol directivo a cada uno (CEO obligatorio; en equipos pequeños alguien puede tener dos) y 3) elige quién eres tú. Presiona «Confirmar integrantes y roles · entrar»."],
 ["Sigan la ruta de «Mi equipo»","Cinco pasos para elegir la organización: asumir roles; el CEO hace el sorteo de las alternativas A y B y el equipo propone la C; contactar a las tres; compararlas con la matriz ponderada y el análisis cualitativo; elegir una y justificarla."],
 ["Capturen cada semana (S1 a S8)","Abran la pestaña de la semana, lean el objetivo y el ejemplo, y llenen las 5 secciones del formato estándar. Todo se guarda solo mientras escriben y lo ve el resto del equipo en segundos."],
 ["Escribe desde tu rol directivo","En «Perspectiva de cada rol directivo», cada integrante responde la pregunta de su rol (CEO, COO, CFO, CMO, CHRO o CIO). Solo tú puedes escribir en tu recuadro; aparece en el PDF y la docente lo evalúa."],
 ["Entreguen antes de cada fecha límite (23:59)","Cuando la lista de verificación esté completa, el CEO presiona «Marcar como entregada». Después de la fecha límite la semana se cierra y ya no se puede modificar (solo la docente da prórroga)."],
 ["Descarguen el PDF y súbanlo a Brightspace","En «Documento de entrega», cada integrante descarga el PDF de la semana y lo sube a Brightspace. «Reporte» reúne las 8 entregas."],
 ["Entreguen el PROYECTO FINAL (S8)","El "+"martes 24 de noviembre a las 23:59: documento final integrado (PDF de «Reporte» con S1 a S8), presentación del pitch y evidencia de que compartieron la propuesta con la organización. Las ligas se pegan en la S8."],
 ["Revisen la retroalimentación y salgan","En cada semana verán la rúbrica, el nivel de su rol y el comentario de la docente. Si usan una computadora compartida, presionen «Salir» al terminar."]];
function pasosDocente(){const B=window.PI_BACKEND,art=B.mode==="artifact",sh=B.mode==="sheets";return [
 ["Entra como PROFESOR",art?"Abre el artefacto, elige «🎓 PROFESOR». La primera vez crea tu clave maestra (mínimo 6 caracteres); después la escribes al iniciar cada sesión.":sh?"Abre la liga (o la liga con ?docente al final), elige «🎓 PROFESOR» y escribe tu clave maestra: es el PIN de la línea 17 de Code.gs.":"En la demostración, elige «🎓 PROFESOR» y crea una clave maestra de prueba."],
 ["Entrega las claves de los equipos","Panel docente → «Claves de seguridad por equipo» → «Mostrar claves». Copia o descarga el CSV y entrega a cada equipo solo la suya: en clase al CEO"+(sh?", o con el menú de la Hoja «Enviar la clave de su equipo por correo».":".")],
 ["Comparte la liga",sh?"Panel docente → «Compartir con los alumnos»: código QR para proyectar en clase y botón para enviar la liga por WhatsApp.":art?"Comparte el artefacto con tus alumnos desde el menú «Compartir» de la página (con permiso para usarlo). Sin la clave de su equipo no pueden entrar a nada.":"Publica la página en GitHub para tener una liga que compartir."],
 ["Verifica que cada equipo se registre","En «Inicio» (vista docente) ves cuántos integrantes tiene cada equipo; en el Panel, la lista «Sin equipo» del grupo. Puedes abrir un equipo y agregar o quitar integrantes."],
 ["Supervisa el avance semanal","Panel docente → «Tablero de entregas»: estado S1 a S8 de cada equipo, semana en curso, sorteo de organizaciones y organizaciones elegidas (con «Reabrir selección» o «Liberar para resortear» si hace falta)."],
 ["Revisa y califica cada entrega","En el tablero, «Abrir» el equipo → pestaña de la semana. Marca el nivel de cada criterio de la rúbrica, el desempeño de cada rol directivo y escribe tu comentario. Si se justifica, da «Prórroga para este equipo»."],
 ["Evalúa por rol directivo","Panel docente → «Evaluación por rol directivo»: quién tiene cada rol, cuántas semanas aportó y su nivel promedio. Úsalo para la retroalimentación individual y cruzada."],
 ["Genera reportes","Pestaña «Reportes»: por semana (lo que se pidió y lo que entregó cada equipo), del grupo o por equipo, en PDF o CSV. Captura la calificación del pitch en «Calificaciones y nota final»."],
 ["Cuida la seguridad y respalda","Si una clave se filtra o la olvidan, usa «Nueva clave»: la anterior deja de funcionar y el trabajo se conserva. Descarga un respaldo en «Respaldo de datos» y presiona «Cerrar sesión» al terminar."]];}
function ListaPasos({pasos}){return h("ol",{className:"pasos",style:{listStyle:"none",padding:0,margin:"8px 0 0",display:"grid",gap:10}},pasos.map(([t,d],i)=>h("li",{key:i,style:{display:"flex",gap:12,alignItems:"flex-start"}},
 h("span",{"aria-hidden":"true",style:{flex:"0 0 32px",height:32,borderRadius:"50%",background:"var(--or)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800}},i+1),
 h("div",{style:{minWidth:0}},h("b",null,"Paso "+(i+1)+". "+t),h("p",{className:"sm",style:{margin:"2px 0 0"}},d)))));}
function Instrucciones({isAdmin,inicial}){
 const [q,setQ]=useState(inicial||(isAdmin?"docente":"equipo")),doc=useRef(null);
 const quien=isAdmin?q:"equipo";
 return h("div",{className:"stack"},
  isAdmin?h("div",{className:"row",role:"group","aria-label":"Instrucciones para"},h("button",{className:"btn "+(q==="docente"?"":"alt"),onClick:()=>setQ("docente")},"🎓 Para el profesor"),h("button",{className:"btn "+(q==="equipo"?"":"alt"),onClick:()=>setQ("equipo")},"👥 Para los equipos")):null,
  h("div",{className:"card"},
   h("div",{className:"bar"},h("h2",{style:{margin:0}},quien==="docente"?"🎓 Instrucciones para el profesor":"👥 Instrucciones para cada equipo"),h(PdfBtn,{target:doc,fname:quien==="docente"?"Instrucciones_profesor_PI_ADM1401":"Instrucciones_equipos_PI_ADM1401",label:"⬇️ Descargar en PDF"})),
   h("div",{ref:doc,style:{marginTop:8}},
    h("p",{className:"sm mut"},"Proyecto Integrador · ADM1401 Introducción a la Empresa · Universidad Anáhuac Cancún"),
    quien==="docente"?h("p",null,"Tienes acceso total a los dos grupos, a todos los equipos y a sus claves. Así se administra la actividad de principio a fin:"):h("p",null,"Su equipo actúa como el consejo directivo de una organización real. Cada quien asume un rol directivo y responde desde esa perspectiva. Así se trabaja:"),
    h(ListaPasos,{pasos:quien==="docente"?pasosDocente():PASOS_EQUIPO}),
    quien==="equipo"?h("p",{className:"sm",style:{marginTop:12,background:"var(--soft)",padding:"8px 12px",borderRadius:8}},"🔒 Privacidad: con su clave solo ven y editan su equipo. Ningún equipo puede consultar el trabajo de otro, y la docente revisa a todos."):
     h("p",{className:"sm",style:{marginTop:12,background:"var(--soft)",padding:"8px 12px",borderRadius:8}},"Calendario: cada entrega cierra a las 23:59 (hora de Cancún) de su fecha límite: "+W.map((w,i)=>"S"+(i+1)+" "+dt(w.d).toLocaleDateString("es-MX",{weekday:"short",day:"numeric",month:"short"})).join(" · ")+". La S8 es el PROYECTO FINAL."))));
}

/* ---------- Guía de entrevista ---------- */
function Guia(){return h("div",{className:"grid",style:{gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))"}},GUIA.map(([t,...q])=>h("div",{key:t,className:"ex"},h("b",null,t),h("ul",{style:{paddingLeft:"1.1em",margin:"6px 0 0"}},q.map(x=>h("li",{key:x,className:"sm"},x))))));}

/* ---------- Formato estándar de entrega ---------- */
/* Rúbrica general S1 a S8 · 100 puntos · 5 criterios por competencias, 4 niveles cada uno.
   Cada criterio: [clave, nombre, puntos máximos, qué se espera, competencia, [Excelente, Satisfactorio, En desarrollo, Insuficiente]]. */
const NIV=[["Excelente",1],["Satisfactorio",.8],["En desarrollo",.6],["Insuficiente",.3]];
const RUB=[
 ["conc","Dominio de los conceptos administrativos",30,"Aplica la herramienta de la semana a la organización real, con todos los apartados completos y relacionados.","Pensamiento administrativo",
  ["Aplica con precisión las herramientas de la semana a la organización real; todos los apartados están completos y relacionados entre sí.","Aplica las herramientas correctamente con algunas imprecisiones; apartados completos pero poco relacionados.","Define las herramientas pero las aplica de forma general, sin aterrizarlas a la organización; falta algún apartado.","Usa los conceptos de forma incorrecta o copia definiciones sin aplicarlas; faltan varios apartados."]],
 ["evid","Análisis con datos reales y evidencia",25,"Información del dueño o responsable y fuentes verificables; cifras con origen y cálculos congruentes.","Pensamiento crítico",
  ["Sustenta cada afirmación con información del dueño o responsable y con fuentes verificables; cifras con origen y cálculos congruentes.","Usa información real y fuentes en la mayoría de los apartados; alguna cifra sin origen.","Predominan supuestos; pocas fuentes o cifras sin explicar de dónde salen.","Sin evidencia de contacto con la organización ni fuentes; cifras inventadas o incoherentes."]],
 ["deci","Toma de decisiones para la propuesta de mejora",20,"La conclusión explica qué significa el análisis para la mejora y qué decide el consejo directivo.","Visión estratégica",
  ["Explica qué significa el análisis para la mejora y qué decisión toma el consejo directivo, con argumentos.","Relaciona el análisis con la mejora, pero la decisión queda poco argumentada.","Menciona la mejora de forma genérica, sin conectarla con lo analizado.","No hay conclusión o no se relaciona con la propuesta de mejora."]],
 ["lide","Liderazgo y trabajo colaborativo",15,"Roles asumidos, aporte de cada rol visible y entrega a tiempo.","Liderazgo y responsabilidad",
  ["Todos los roles están asumidos y su aporte se nota en la entrega; se entrega a tiempo.","Roles asumidos; entrega a tiempo con aportes desiguales entre roles.","Faltan roles por asumir o la entrega llega con retraso.","Sin roles definidos o entrega con retraso mayor a 3 días."]],
 ["comu","Comunicación profesional",10,"Formato estándar de 5 secciones, redacción ejecutiva y APA 7.","Comunicación ejecutiva",
  ["Sigue el formato estándar; redacción clara, ejecutiva y sin errores; APA 7 correcto.","Formato completo con errores menores de redacción o de APA 7.","Formato incompleto o redacción poco clara; APA 7 con errores frecuentes.","No sigue el formato; redacción confusa; sin citas."]]];
const ptsNivel=(mx,f)=>Math.floor(mx*f+1e-9);
const nivelDe=(mx,v)=>{const n=parseFloat(v);if(isNaN(n)||v==="")return -1;return NIV.findIndex(([,f])=>ptsNivel(mx,f)===n);};
/* Qué se busca cada semana en los criterios 1 (herramienta) y 2 (evidencia). */
const FOCO=[["Roles directivos; alternativas analizadas y razones de la elección; problema u oportunidad.","Contacto con el dueño o responsable; carta de aceptación."],
 ["PESTEL de 6 factores; mercado objetivo; competidores; TAM.","INEGI, DATATUR, BANXICO o Data México; cálculo del mercado."],
 ["Las 5 fuerzas calificadas y explicadas; ventaja competitiva.","Reseñas, precios de competidores, datos del sector."],
 ["Misión, visión y valores; objetivos SMART; FODA.","Misión o valores reales de la organización; meta medible."],
 ["9 bloques actuales y bloques que cambian con la mejora.","Precio, costo y volumen con su origen; margen calculado."],
 ["Organigrama actual y propuesto; tramo de control.","Puestos y número de empleados confirmados con la organización."],
 ["Reclutamiento, selección, capacitación y evaluación.","Presupuesto de capacitación sustentado; marco legal (LFT, STPS)."],
 ["Propuesta completa, plan de implementación, Balanced Scorecard y guion.","Inversión, beneficio y retorno congruentes con las semanas anteriores."]];
const SECC=["Portada","1. Objetivo de la entrega","2. Desarrollo","3. Datos y cálculos","4. Conclusión para la propuesta de mejora","5. Fuentes (APA 7) y anexos"];
const fileOf=(t,wi,tm)=>("PI_ADM1401_"+grpOf(t).n.slice(0,4)+"_E"+loc(t)+"_S"+(wi+1)+"_"+((empOfTeam(tm)||{}).n||"organizacion")).normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^A-Za-z0-9]+/g,"_").replace(/_+$/,"");
function checklist(wi,wd,tm){const w=W[wi],d=wd||{};const it=[
 ["Apartados de desarrollo completos (mínimo 40 caracteres cada uno)",w.tx.every((_,i)=>str(d.t&&d.t[i]).trim().length>=40)]];
 if(w.nu.length)it.push(["Datos numéricos capturados",w.nu.every((_,i)=>str(d.n&&d.n[i]).trim()!=="")]);
 it.push(["Conclusión para la propuesta de mejora (mínimo 60 caracteres)",str(d.concl).trim().length>=60]);
 it.push(["Al menos una fuente en APA 7",str(d.src).trim().length>=25]);
 const ra=rolesAsumidos(tm);if(ra.length)it.push(["Aporte de cada rol directivo asumido (mínimo 40 caracteres cada uno)",ra.every(([r])=>str(d.rol&&d.rol[r.k]).trim().length>=40)]);
 if(wi===0)it.push(["Organización elegida en «Mi equipo» tras analizar las tres alternativas (paso 5)",!!(tm&&tm.elegida&&empOfTeam(tm))]);
 if(w.fin){const u=x=>/^https?:\/\/\S+\.\S+/.test(str(x).trim());
  it.push(["Presentación del pitch (liga a las diapositivas)",u(d.pres)]);
  it.push(["Evidencia de que la propuesta se compartió con la organización (liga)",u(d.evorg)]);}
 return it;}
async function nodeToPdf(node){
 if(!window.html2canvas||!window.jspdf)throw {code:"x"};
 const root=document.documentElement,prev=root.getAttribute("data-theme");root.setAttribute("data-theme","light");node.classList.add("capturing");await new Promise(r=>setTimeout(r,150));
 try{const bt=node.getBoundingClientRect().top,bh=node.offsetHeight;
  const cuts=[...node.querySelectorAll(".card,p,h2,h3,h4,tr,.sec")].map(el=>{const r=el.getBoundingClientRect();return [r.top-bt-4,r.bottom-bt+4];}).flat();
  const cv=await window.html2canvas(node,{scale:2,backgroundColor:"#ffffff"});
  const pdf=new window.jspdf.jsPDF({unit:"mm",format:"letter"});const pw=pdf.internal.pageSize.getWidth(),ph=pdf.internal.pageSize.getHeight(),m=12,iw=pw-2*m,ih=ph-2*m;
  const per=Math.floor(cv.width*ih/iw),kk=cv.height/bh,cp=cuts.map(v=>Math.round(v*kk)).sort((a,b)=>a-b);let y=0,pg=0;
  while(y<cv.height){let hg=Math.min(per,cv.height-y);if(y+hg<cv.height){const b=cp.filter(v=>v>y+per*.55&&v<=y+per).pop();if(b)hg=b-y;}
   const s=document.createElement("canvas");s.width=cv.width;s.height=hg;const cx=s.getContext("2d");cx.fillStyle="#fff";cx.fillRect(0,0,s.width,hg);cx.drawImage(cv,0,y,cv.width,hg,0,0,cv.width,hg);
   if(pg)pdf.addPage();pdf.addImage(s.toDataURL("image/jpeg",.9),"JPEG",m,m,iw,hg*iw/cv.width);
   pdf.setFontSize(8);pdf.setTextColor(120);pdf.text("Proyecto Integrador ADM1401 · página "+(pg+1),pw-m,ph-5,{align:"right"});y+=hg;pg++;}
  return pdf.output("arraybuffer");}
 finally{node.classList.remove("capturing");if(prev===null)root.removeAttribute("data-theme");else root.setAttribute("data-theme",prev);}}
function PdfBtn({target,fname,label}){
 const [dl,setDl]=useState(undefined),[msg,setMsg]=useState(""),[busy,setBusy]=useState(false);
 useEffect(()=>{let ok=true;const c=window.claude;if(!c||!c.use){setDl(null);return;}c.use("downloads").then(d=>{if(ok)setDl(d||null)}).catch(()=>{if(ok)setDl(null)});return()=>{ok=false};},[]);
 const go=async()=>{if(!dl||busy||!target.current)return;setBusy(true);setMsg("Preparando el PDF…");
  try{const buf=await nodeToPdf(target.current);await dl.save({filename:fname+".pdf",data:buf});setMsg("PDF descargado.");}
  catch(e){setMsg(e&&e.code==="x"?"No se cargó el generador de PDF. Recarga la página.":e&&e.code==="declined"?"Descarga cancelada.":"No se pudo descargar. Inténtalo de nuevo.");}
  setBusy(false);};
 return h("div",{className:"row noprint"},dl?h("button",{className:"btn",disabled:busy,onClick:go},busy?"Generando…":(label||"⬇️ Descargar PDF")):h("span",{className:"sm mut"},"La descarga no está disponible en esta vista."),msg?h("span",{className:"sm",role:"status"},msg):null,
  h("span",{className:"sm mut",style:{flexBasis:"100%"}},"Archivo: ",h("code",{style:{overflowWrap:"anywhere"}},fname+".pdf")));
}
function FormatoCard(){
 return h("div",{className:"card"},h("h2",null,"📐 Formato estándar de entrega"),
  h("p",null,"Las 8 entregas siguen la misma estructura. La página arma el documento por ustedes con lo que capturan; solo descárguenlo en PDF."),
  h("ol",{style:{paddingLeft:"1.2em"}},
   h("li",null,h("b",null,"Portada:")," organización, grupo y equipo, integrantes con su rol, fecha y docente."),
   h("li",null,h("b",null,"Objetivo de la entrega:")," ya viene escrito para cada semana."),
   h("li",null,h("b",null,"Desarrollo:")," los apartados numerados de la semana (2.1, 2.2, 2.3)."),
   h("li",null,h("b",null,"Datos y cálculos:")," cifras capturadas y resultados automáticos."),
   h("li",null,h("b",null,"Conclusión para la propuesta de mejora:")," qué significa el análisis para su mejora (mínimo 60 caracteres)."),
   h("li",null,h("b",null,"Fuentes (APA 7) y anexos:")," incluida la entrevista con el dueño como comunicación personal; ligas a sus archivos.")),
  h("p",{className:"sm"},h("b",null,"Nombre del archivo: "),h("code",null,"PI_ADM1401_[Grupo]_E[equipo]_S[semana]_[Organización].pdf"),". La página lo pone sola."),
  h("p",{className:"sm"},h("b",null,"Rúbrica igual para todas las entregas: "),RUB.map(r=>r[1]+" ("+r[2]+")").join(" · ")+"."));
}
/* ---------- Entregas: apartado único ---------- */
function Entregas({t,tm,wdocs,me,isAdmin,setView,wl}){
 const lead=leaderOf(tm)===me,canEdit=!!me||isAdmin;
 let ent=0;W.forEach((w,i)=>{const s=estado(wdocs[i]||{},i);if(s.k==="ok"||s.k==="tarde")ent++;});
 return h("div",{className:"stack"},
  h("div",{className:"card",style:{borderColor:"var(--or)"}},h("h2",null,"📤 Entregas del equipo"),
   h("p",null,"Todas las entregas en un solo lugar. Para cada semana: 1) capturen las 5 secciones en su pestaña (S1 a S8); 2) si tienen anexos, súbanlos a Drive, OneDrive o Canva con acceso «cualquier persona con el enlace» y peguen la liga aquí; 3) el Director General marca la entrega cuando la lista de verificación esté completa; 4) cada integrante descarga el PDF de la semana y lo sube a Brightspace."),
   h("div",{className:"kpi",style:{marginTop:8}},h("div",null,h("b",null,ent+" / 8"),"Entregas marcadas"),h("div",null,h("b",null,empOfTeam(tm)?empOfTeam(tm).n:"—"),"Organización"))),
  h(FormatoCard),
  h("div",{className:"w"},h("table",null,h("thead",null,h("tr",null,h("th",null,"Semana"),h("th",null,"Fecha límite"),h("th",null,"Estado"),h("th",null,"Liga a anexos"),h("th",null,""))),
   h("tbody",null,W.map((w,i)=>{const wd=wdocs[i]||{},st=estado(wd,i),lk=str(wd.link),okL=/^https?:\/\/\S+\.\S+/.test(lk.trim());
    return h("tr",{key:i},h("td",null,h("b",null,"S"+(i+1)),h("div",{className:"sm"},w.t)),h("td",{style:{whiteSpace:"nowrap"}},dt(w.d).toLocaleDateString("es-MX",{day:"2-digit",month:"short"})),
     h("td",null,h("span",{className:"pill "+st.c},st.l)),
     h("td",{style:{minWidth:220}},h("input",{type:"url","aria-label":"Liga de la semana "+(i+1),value:lk,readOnly:!(isAdmin||(!!me&&abierta(i,wd)&&wd.est!=="Entregado")),placeholder:"https://…",onChange:e=>wl(i,["link"],e.target.value)}),okL?h("a",{className:"sm",href:lk.trim(),target:"_blank",rel:"noopener"},"Abrir"):lk?h("span",{className:"sm",style:{color:"var(--kot)"}}," Debe empezar con https://"):null),
     h("td",null,h("button",{className:"btn alt sm",onClick:()=>{setView("s"+i);window.scrollTo(0,0);}},lead&&st.k!=="ok"&&st.k!=="tarde"?"Ir a entregar":"Abrir y descargar PDF")));})))),
  h("div",{className:"card"},h("h2",null,"Reporte completo"),h("p",null,"Reúne las 8 entregas en el mismo formato, incluida la selección de la organización con sus tres fichas. Úsenlo para la entrega final."),
   h("button",{className:"btn",onClick:()=>{setView("reporte");window.scrollTo(0,0);}},"📄 Ir al reporte")));
}

/* ---------- Semana ---------- */
function Semana({wi,t,tm,wd,ww,me,myName,isAdmin,gr,wg,setView}){
 const w=W[wi],k=members(tm).length,nums=w.nu.map((_,i)=>parseFloat(wd&&wd.n&&wd.n[i])||0),cs=calcW(wi,nums,k),st=estado(wd,wi);
 const exC=calcW(wi,w.en,w.ek||0).map((v,i)=>showC(wi,i,v));
 const [,tick]=useState(0);useEffect(()=>{const i=setInterval(()=>tick(x=>x+1),60000);return()=>clearInterval(i);},[]);
 const ab=abierta(wi,wd),entregada=!!(wd&&wd.est==="Entregado"),lx=limite(wi,wd);
 const canEdit=isAdmin||(!!me&&ab&&!entregada),lead=leaderOf(tm)===me,doc=useRef(null);
 const [conf,setConf]=useState(false),[ext,setExt]=useState(str(wd&&wd.ext));
 const link=str(wd&&wd.link),linkOk=/^https?:\/\/\S+\.\S+/.test(link.trim());
 const ck=checklist(wi,wd,tm),ready=ck.every(x=>x[1]);
 const rb=(gr&&gr.r&&gr.r[wi])||{},setR=(key,v)=>{const nr={...rb,[key]:v};wg(["r",String(wi),key],v);const tot=RUB.reduce((s,[kk])=>s+(parseFloat(nr[kk])||0),0);wg(["c",String(wi)],String(tot));};
 return h("div",{className:"stack"},
  h("div",{className:"card"},
   h("div",{className:"bar"},h("div",{style:{minWidth:0}},h("span",{className:"mut sm"},"Semana "+(wi+1)+" · Unidad "+w.u),h("h2",{style:{margin:"2px 0"}},w.t)),h("span",{className:"pill "+st.c},st.l)),
   h("p",null,h("b",null,"Objetivo: "),w.q),
   h("p",{className:"sm mut"},"Fecha límite: ",h("b",null,fdl(w.d)+", 23:59")," · Valor: ",h("b",null,Math.round(w.v*100)+"%")," · Fuentes sugeridas: "+w.s),
   h("div",{className:"chips",style:{marginTop:8}},ck.map(([l,ok],i)=>h("span",{key:i,className:ok?"ok":""},(ok?"✓ ":"○ ")+l))),
   h("p",{className:"pill "+(!ab?"ko":entregada?"ok":lx>dt(w.d).getTime()?"wa":""),style:{whiteSpace:"normal",display:"block",marginTop:8,padding:"8px 12px"},role:"status"},
    !ab?"🔒 El plazo cerró el "+fcorta(lx)+" a las 23:59. La entrega quedó como está; solo la docente puede reabrirla o dar prórroga."
    :entregada?"✅ Entregada. Para corregirla, el Director General la reabre antes del "+fcorta(lx)+" a las 23:59."
    :"✏️ Pueden editar hasta el "+fcorta(lx)+" a las 23:59"+(lx>dt(w.d).getTime()?" (prórroga de la docente)":"")+". Después ya no se podrá modificar.")),
  h("details",{className:"card"},h("summary",null,"Ver ejemplo (organización ficticia: Hotel Arrecife Cancún)"),
   h("div",{className:"ex",style:{marginTop:10}},w.tx.map((x,i)=>h("p",{key:i},h("b",null,"2."+(i+1)+" "+x+": "),w.et[i])),
    w.nu.length?h("p",{className:"sm"},h("b",null,"3. Datos: "),w.nu.map((x,i)=>x+": "+fm(x)(w.en[i])).join(" · ")):null,
    h("p",{className:"sm"},h("b",null,"Cálculos: "),w.c.map((c,i)=>c[0]+" = "+exC[i]).join(" · ")),
    h("p",{className:"sm"},h("b",null,"4. Conclusión: "),"Con este análisis confirmamos que el tiempo de espera es el problema que más afecta a los clientes; la propuesta debe atacarlo primero."))),
  h("div",{className:"card"},h("div",{className:"bar"},h("h2",{style:{margin:0}},"Captura de la entrega"),canEdit?h(AutoGuardado):null),
   wd&&wd._at?h("p",{className:"sm mut"},"Última edición: "+fmt(wd._at)+(wd._by?" por "+wd._by:"")):null,
   h("p",{className:"sm mut"},"Cada campo corresponde a una sección del formato estándar. Lo que escriban aquí se acomoda solo en el documento de entrega."),
   !canEdit?h("p",{className:"pill wa",style:{whiteSpace:"normal"}},"Entra con tu nombre para capturar."):null,
   h("h3",{style:{marginTop:10}},"2. Desarrollo"),
   w.tx.map((x,i)=>h(Field,{key:i,id:"s"+wi+"t"+i,l:"2."+(i+1)+" "+x,area:true,ro:!canEdit,v:wd&&wd.t&&wd.t[i],on:v=>ww(["t",String(i)],v),ph:w.et[i]})),
   wi===0?h("p",{className:"sm mut"},"El análisis comparativo (matriz ponderada, análisis cualitativo, decisión y fichas) se agrega solo desde «Mi equipo»."):null,
   h("h3",{style:{marginTop:14}},"3. Datos y cálculos"),
   w.nu.length?h("div",{className:"g2"},w.nu.map((x,i)=>h(Field,{key:i,id:"s"+wi+"n"+i,l:x,type:"number",ro:!canEdit,v:wd&&wd.n&&wd.n[i],on:v=>ww(["n",String(i)],v),ph:String(w.en[i])}))):null,
   h("div",{className:"calc",style:{marginTop:10}},w.c.map((c,i)=>h("div",{key:i},h("span",{className:"sm mut"},c[0]),h("b",null,showC(wi,i,cs[i]))))),
   h("h3",{style:{marginTop:14}},"4. Conclusión"),
   h(Field,{id:"s"+wi+"cc",l:"¿Qué significa este análisis para su propuesta de mejora? (mínimo 60 caracteres)",area:true,ro:!canEdit,v:wd&&wd.concl,on:v=>ww(["concl"],v)}),
   h("h3",{style:{marginTop:14}},"5. Fuentes y anexos"),
   h(Field,{id:"s"+wi+"src",l:"Fuentes en APA 7 (una por línea)",area:true,ro:!canEdit,v:wd&&wd.src,on:v=>ww(["src"],v),ph:"Pérez, A. (2026, 8 de octubre). Comunicación personal [entrevista].\nINEGI. (2026). DENUE. https://www.inegi.org.mx/app/mapa/denue/"}),
   h(Field,{id:"s"+wi+"link",l:"Liga a anexos (opcional): presentación, organigrama, Canvas, fotos o video",type:"url",ro:!canEdit,v:link,on:v=>ww(["link"],v),ph:"https://drive.google.com/…"}),
   link&&!linkOk?h("p",{className:"sm",style:{color:"var(--kot)"}},"La liga debe empezar con https://"):linkOk?h("p",{className:"sm"},h("a",{href:link.trim(),target:"_blank",rel:"noopener"},"Abrir anexos")):null),
  w.fin?h(EntregableFinal,{wd,ww,canEdit,setView}):null,
  h(AportesRol,{wi,tm,wd,me,isAdmin,canEdit,ww,gr,wg}),
  h("div",{className:"card",style:{borderColor:"var(--or)"}},h("h2",null,"📤 Entregar la semana "+(wi+1)),
   h("ul",{style:{listStyle:"none",paddingLeft:0,margin:"6px 0"}},ck.map(([l,ok],i)=>h("li",{key:i,style:{color:ok?"var(--okt)":"var(--mut)",fontWeight:600}},(ok?"✓ ":"○ ")+l))),
   wd&&wd.est==="Entregado"?h("div",null,h("p",{className:"pill "+st.c,style:{whiteSpace:"normal"}},"✅ Entregado el "+fmt(wd.at)+(wd.by?" por "+wd.by:"")),
     (lead&&ab)||isAdmin?h("div",null,h("button",{className:"btn alt sm",style:{marginTop:8},onClick:()=>ww(["est"],"Pendiente",0)},"Reabrir la entrega para corregir")):null)
    :!ab&&!isAdmin?h("p",{className:"sm",style:{color:"var(--kot)",fontWeight:600}},"El plazo cerró sin que la entrega se marcara. Si hubo una causa justificada, hablen con la docente.")
    :lead||isAdmin?(conf?h("div",{className:"row",style:{marginTop:8}},h("button",{className:"btn",onClick:()=>{ww(["at"],Date.now(),0);ww(["by"],myName,0);ww(["est"],"Entregado",0);setConf(false);}},"Sí, entregar ahora"),h("button",{className:"btn alt",onClick:()=>setConf(false)},"Cancelar"))
     :h("button",{className:"btn",style:{marginTop:8},disabled:!ready,onClick:()=>setConf(true)},ready?"Marcar como entregada":"Completen la lista para entregar"))
    :h("p",{className:"sm mut"},"El Director General marca la entrega cuando la lista esté completa."),
   h("p",{className:"sm"},"Después, ",h("b",null,"cada integrante descarga el PDF")," de abajo y lo sube a Brightspace."),
   isAdmin?h("div",{className:"ex",style:{marginTop:10}},h("b",{className:"sm"},"Prórroga para este equipo"),
    h("div",{className:"row",style:{marginTop:6,alignItems:"flex-end"}},h("div",null,h("label",{className:"l sm",htmlFor:"ext"+wi,style:{marginTop:0}},"Nueva fecha límite (23:59)"),h("input",{id:"ext"+wi,type:"date",value:ext,min:W[wi].d,onChange:e=>setExt(e.target.value)})),
     h("button",{className:"btn sm",disabled:!ext||ext===str(wd&&wd.ext),onClick:()=>ww(["ext"],ext,0)},"Guardar prórroga"),
     str(wd&&wd.ext)?h("button",{className:"btn alt sm",onClick:()=>{ww(["ext"],"",0);setExt("");}},"Quitar prórroga"):null),
    h("p",{className:"sm mut",style:{marginTop:6}},"Con prórroga el equipo puede volver a editar y entregar hasta esa fecha. «Reabrir la entrega» también deja editar mientras el plazo siga abierto.")):null),
  h("div",{className:"card"},h("div",{className:"bar"},h("h2",{style:{margin:0}},"Documento de entrega"),h(PdfBtn,{target:doc,fname:fileOf(t,wi,tm)+(myName?"_"+myName.normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^A-Za-z0-9]+/g,"_"):""),label:"⬇️ Descargar PDF de la S"+(wi+1)})),
   h("p",{className:"sm mut"},"Vista previa del formato estándar con lo que han capturado."),
   h("div",{ref:doc,style:{marginTop:10,border:"1px solid var(--line)",borderRadius:8,padding:16,background:"var(--card)"}},h(DocEntrega,{wi,t,tm,wd}))),
  h("div",{className:"card"},h("div",{className:"bar"},h("h2",{style:{margin:0}},"Rúbrica y retroalimentación"),h("span",{className:"pill "+(str(gr&&gr.c&&gr.c[wi])?"ok":"")},(str(gr&&gr.c&&gr.c[wi])||"·")+" / 100")),
   h("div",{className:"ex",style:{margin:"8px 0"}},h("p",{className:"sm"},h("b",null,"Esta semana se busca · herramienta: "),FOCO[wi][0]),h("p",{className:"sm"},h("b",null,"Evidencia: "),FOCO[wi][1])),
   isAdmin?h("p",{className:"sm mut"},"Elige el nivel de cada criterio; los puntos se calculan solos. Si el trabajo queda entre dos niveles, ajusta los puntos a mano."):h("p",{className:"sm mut"},"Así se evalúa cada entrega. El nivel marcado es el que asignó la docente."),
   RUB.map(([key,l,mx,dsc,comp,lv])=>{const v=str(rb[key]),ni=nivelDe(mx,v);
    return h("div",{key,style:{borderTop:"1px solid var(--line)",padding:"10px 0"}},
     h("div",{className:"bar"},h("div",{style:{minWidth:0,flex:"1 1 240px"}},h("b",null,l),h("div",{className:"sm mut"},comp+" · "+dsc)),
      h("div",{className:"row"},isAdmin?h("input",{type:"number",min:0,max:mx,"aria-label":l,value:v,style:{width:80},onChange:e=>setR(key,e.target.value)}):h("b",null,v||"·")," / "+mx)),
     h("div",{className:"grid",style:{gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",margin:"8px 0 0",gap:6}},NIV.map(([nl,f],i)=>{const pts=ptsNivel(mx,f),on=ni===i;
      return h(isAdmin?"button":"div",{key:nl,className:"opt sm","aria-pressed":isAdmin?on:undefined,onClick:isAdmin?()=>setR(key,String(pts)):undefined,style:{minHeight:0,padding:"8px 10px",borderColor:on?"var(--or)":"var(--line)",background:on?"var(--soft)":"var(--card)",cursor:isAdmin?"pointer":"default"}},
       h("b",null,nl+" · "+pts),h("span",{className:"sm",style:{display:"block",color:"var(--mut)"}},lv[i]));})));}),
   isAdmin?h(Field,{id:"com"+wi,l:"Comentario para el equipo",area:true,v:gr&&gr.m&&gr.m[wi],on:v=>wg(["m",String(wi)],v)}):(str(gr&&gr.m&&gr.m[wi])?h("p",{style:{marginTop:8}},h("b",null,"Comentario: "),gr.m[wi]):h("p",{className:"mut",style:{marginTop:8}},str(gr&&gr.c&&gr.c[wi])?"":"Pendiente de revisión."))));
}

/* ---------- Entregable del proyecto final (S8) ---------- */
function EntregableFinal({wd,ww,canEdit,setView}){
 const L=[["pres","Presentación del pitch (Canva, PowerPoint o Google Slides con acceso «cualquier persona con el enlace»)",true],["evorg","Evidencia de que compartieron la propuesta con el dueño o responsable (correo, carta firmada o foto)",true],["video","Video del pitch (opcional)",false]];
 return h("div",{className:"card",style:{borderColor:"var(--or)",borderWidth:2}},
  h("div",{className:"bar"},h("h2",{style:{margin:0}},"📦 Entregable del proyecto final"),canEdit?h(AutoGuardado):null),
  h("p",null,"El proyecto final se entrega completo en esta semana. Incluye:"),
  h("ol",{style:{paddingLeft:"1.2em"}},
   h("li",null,h("b",null,"Documento final integrado (PDF):")," la pestaña ",h("b",null,"«Reporte»")," arma la portada y las 8 entregas, de la S1 a esta S8. Corrijan antes las semanas anteriores con la retroalimentación (la docente puede reabrirlas o darles prórroga)."),
   h("li",null,h("b",null,"Esta S8:")," resumen ejecutivo, propuesta, plan de implementación, Balanced Scorecard, guion del pitch e inversión y retorno, con la perspectiva de cada rol directivo."),
   h("li",null,h("b",null,"Presentación del pitch")," de 15 minutos."),
   h("li",null,h("b",null,"Evidencia")," de que la propuesta se compartió con la organización.")),
  L.map(([k,l,req])=>{const v=str(wd&&wd[k]),ok=/^https?:\/\/\S+\.\S+/.test(v.trim());return h("div",{key:k},h(Field,{id:"fin"+k,l:l+(req?" *":""),type:"url",ro:!canEdit,v,on:x=>ww([k],x),ph:"https://…"}),
   v&&!ok?h("p",{className:"sm",style:{color:"var(--kot)"}},"La liga debe empezar con https://"):ok?h("p",{className:"sm"},h("a",{href:v.trim(),target:"_blank",rel:"noopener"},"Abrir")):null);}),
  h("div",{className:"row",style:{marginTop:10}},h("button",{className:"btn alt",onClick:()=>setView&&setView("reporte")},"📄 Ver y descargar el documento final (Reporte)")),
  h("p",{className:"sm mut",style:{marginTop:8}},"Suban a Brightspace el PDF del Reporte completo y el PDF de esta S8. Fecha límite: "+fdl(W[W.length-1].d)+" a las 23:59."));
}

/* ---------- Aportes por rol directivo (cada integrante escribe desde su rol) ---------- */
function AportesRol({wi,tm,wd,me,isAdmin,canEdit,ww,gr,wg}){
 const ra=rolesAsumidos(tm),ev=(gr&&gr.rl&&gr.rl[wi])||{};
 return h("div",{className:"card"},h("div",{className:"bar"},h("h2",{style:{margin:0}},"🎯 Perspectiva de cada rol directivo"),canEdit?h(AutoGuardado):null),
  h("p",{className:"sm mut"},"Cada integrante responde desde su dirección: qué ve, qué propone y qué decide su área en esta entrega. Solo quien tiene el rol escribe en su recuadro; los demás lo leen. Aparece en el PDF (sección 4.1)."),
  !ra.length?h("p",{className:"pill wa",style:{whiteSpace:"normal"}},"Aún no hay roles asumidos. Asígnenlos en «Mi equipo» → paso 1."):null,
  ra.map(([r,id,nm])=>{const mio=id===me,v=str(wd&&wd.rol&&wd.rol[r.k]),lv=ev[r.k];
   return h("div",{key:r.k,style:{borderTop:"1px solid var(--line)",padding:"10px 0"}},
    h("div",{className:"bar"},h("b",null,r.a+" · "+r.n.replace(/ \(.*\)$/,"")),h("span",{className:"pill "+(v.trim().length>=40?"ok":"wa")},nm+(mio?" (tú)":""))),
    h(Field,{id:"rol"+wi+r.k,l:r.p,area:true,ro:!(isAdmin||(canEdit&&mio)),v,on:x=>ww(["rol",r.k],x),ph:mio?"Escribe como "+r.a+": tu análisis, tu propuesta y tu decisión para esta entrega.":"Lo escribe "+nm+"."}),
    isAdmin?h("div",{className:"row",role:"group","aria-label":"Nivel del aporte "+r.a,style:{marginTop:6}},h("span",{className:"sm mut"},"Desempeño del rol:"),
     NIV.map(([nl],i)=>h("button",{key:nl,className:"btn sm "+(lv===i?"":"alt"),"aria-pressed":lv===i,onClick:()=>wg(["rl",String(wi),r.k],lv===i?"":i)},nl)))
    :typeof lv==="number"?h("p",{className:"sm",style:{marginTop:6}},h("b",null,"Desempeño del rol según la docente: "),NIV[lv][0]):null);}));
}

/* ---------- Reporte del proyecto ---------- */
function Reporte({t,tm,wdocs,myName}){
 const e=empOfTeam(tm),ms=members(tm),box=useRef(null);
 const fname=("PI_ADM1401_"+grpOf(t).n.slice(0,4)+"_E"+loc(t)+"_Reporte_"+(e?e.n:"organizacion")+(myName?"_"+myName:"")).normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^A-Za-z0-9]+/g,"_");
 return h("div",{className:"stack"},
  h("div",{className:"card noprint",style:{borderColor:"var(--or)"}},h("h2",null,"📄 Reporte completo del proyecto"),
   h("p",null,"Reúne las 8 entregas en el formato estándar, una tras otra. Úsenlo para la entrega final y el pitch; cada semana se sube su propio PDF desde la pestaña de esa semana."),
   h(PdfBtn,{target:box,fname,label:"⬇️ Descargar reporte completo"})),
  h("div",{ref:box,className:"card"},
   h("div",{className:"sec",style:{borderBottom:"3px solid var(--or)",paddingBottom:10}},
    h("p",{className:"sm mut"},"Proyecto Integrador · ADM1401 Introducción a la Empresa · Escuela Internacional de Negocios · Universidad Anáhuac Cancún"),
    h("h2",{style:{fontSize:"1.5rem",margin:"6px 0"}},"Propuesta de mejora: "+(e?e.n:"organización por elegir")),
    h("p",null,h("b",null,"Grupo y equipo: "),tLab(t),myName?[h("br",{key:1}),h("b",{key:2},"Descargado por: "),myName]:null,h("br"),h("b",null,"Docente: "),"Mtra. Tania Rivera Lozano · ",new Date().toLocaleDateString("es-MX")),
    h("div",{className:"w",style:{marginTop:8}},h("table",null,h("thead",null,h("tr",null,h("th",null,"Integrante"),h("th",null,"Rol directivo"))),
     h("tbody",null,ms.map(([id,x])=>h("tr",{key:id},h("td",null,x.n),h("td",null,rolesOf(tm,id).join(", ")||"Sin rol"))))))),
   W.map((w,i)=>h("div",{key:i,style:{marginTop:18}},h(DocEntrega,{wi:i,t,tm,wd:wdocs[i]||{},cover:false})))));
}

/* ---------- Reportes por grupo y por equipo (docente) ---------- */
function Portada({tit,sub}){return h("div",{className:"sec",style:{borderBottom:"3px solid var(--or)",paddingBottom:10,marginBottom:10}},
 h("p",{className:"sm mut"},"Proyecto Integrador · ADM1401 Introducción a la Empresa · Escuela Internacional de Negocios · Universidad Anáhuac Cancún"),
 h("h2",{style:{fontSize:"1.45rem",margin:"6px 0"}},tit),h("p",null,sub,h("br"),h("b",null,"Docente: "),"Mtra. Tania Rivera Lozano · ",h("b",null,"Fecha del reporte: "),fmt(Date.now())));}
const Hs=(t)=>h("h3",{className:"sec",style:{marginTop:16,color:"var(--ord)"}},t);
function delivered(wd){return wd&&wd.est==="Entregado";}
/* ---------- Reajuste de un equipo (docente) ---------- */
function Ajuste({t,tm,sorteo,reassign,attend,onClose}){
 const a=tm.alts||{},[sel,setSel]=useState({A:"",B:""}),[mot,setMot]=useState(""),[busy,setBusy]=useState(""),[msg,setMsg]=useState("");
 const free=POOL.filter(x=>!takenBy(sorteo,x));
 const hist=Object.entries(tm.ajustes||{}).sort((x,y)=>(y[1].at||0)-(x[1].at||0));
 const sol=tm.solicitud&&tm.solicitud.estado==="pendiente"?tm.solicitud:null;
 const go=async(slot,name)=>{if(busy)return;setBusy(slot);setMsg("");const r=await reassign(t,slot,name,mot.trim());setBusy("");
  if(r.ok){setMsg("Alternativa "+slot+" cambiada a: "+r.n+".");setSel(p=>({...p,[slot]:""}));}else setMsg(r.msg);};
 return h("div",{className:"ex",style:{margin:"6px 0"}},
  h("div",{className:"bar"},h("h3",{style:{margin:0}},"✏️ Reajuste · "+tLab(t)),h("button",{className:"btn alt sm",onClick:onClose},"Cerrar")),
  sol?h("div",{className:"pill wa",style:{whiteSpace:"normal",display:"block",margin:"8px 0",padding:"8px 12px"}},h("b",null,"Solicitud del equipo: "),sol.txt+" ("+(sol.by||"")+", "+fmt(sol.at)+") ",h("button",{className:"btn sm",style:{marginLeft:6},onClick:()=>attend(t)},"Marcar como atendida")):null,
  h(Field,{id:"mot"+t,l:"Motivo del reajuste (queda en el historial)",v:mot,on:setMot,ph:"Ej.: la organización no respondió en dos semanas"}),
  ["A","B"].map(k=>{const cur=str(a[k]&&a[k].n),opts=free.filter(x=>x.n!==cur);
   return h("div",{key:k,style:{marginTop:10,paddingTop:8,borderTop:"1px solid var(--line)"}},
    h("p",null,h("b",null,"Alternativa "+k+": "),cur||h("span",{className:"mut"},"sin asignar"),tm.elegida===k?h("span",{className:"pill wa",style:{marginLeft:6}},"Es la organización elegida: si la cambian, el equipo deberá volver a elegir"):null),
    h("div",{className:"row",style:{alignItems:"flex-end"}},
     h("div",{style:{flex:"1 1 260px"}},h("label",{className:"l",htmlFor:"aj"+t+k},"Cambiar por una organización libre"),
      h("select",{id:"aj"+t+k,value:sel[k],onChange:e=>setSel(p=>({...p,[k]:e.target.value}))},h("option",{value:""},"Elegir…"),
       CAT.filter(c=>opts.some(x=>x.cat===c.k)).map(c=>h("optgroup",{key:c.k,label:c.n},opts.filter(x=>x.cat===c.k).map(x=>h("option",{key:x.n,value:x.n},x.n)))))),
     h("button",{className:"btn sm",disabled:!sel[k]||!!busy,onClick:()=>go(k,sel[k])},busy===k?"Guardando…":"Guardar cambio"),
     h("button",{className:"btn alt sm",disabled:!!busy||!free.length,onClick:()=>go(k,null)},"🎲 Resortear solo la "+k)));}),
  msg?h("p",{role:"status",style:{fontWeight:700,marginTop:8}},msg):null,
  h("p",{className:"sm mut",style:{marginTop:8}},"Al cambiar una alternativa, la anterior vuelve a quedar libre y se borra lo que el equipo había capturado de ella (investigación, contacto y puntajes)."),
  hist.length?h("div",{style:{marginTop:8}},h("b",{className:"sm"},"Historial de reajustes"),h("ul",{className:"sm",style:{paddingLeft:"1.2em",margin:"4px 0"}},hist.map(([id,x])=>h("li",{key:id},fmt(x.at)+" · "+x.slot+": "+(x.de||"—")+" → "+x.a+(x.motivo?" · "+x.motivo:""))))):null);
}
function Solicitar({t,tm,request}){
 const [open,setOpen]=useState(false),[txt,setTxt]=useState("");const sol=tm.solicitud;
 if(sol&&sol.estado==="pendiente")return h("span",{className:"pill wa",style:{whiteSpace:"normal"}},"Solicitud enviada; la docente la revisará");
 return open?h("div",null,h(Field,{id:"sol"+t,l:"¿Qué necesitan cambiar y por qué?",area:true,v:txt,on:setTxt,ph:"Ej.: la alternativa B no contestó después de tres intentos"}),
   h("div",{className:"row",style:{marginTop:6}},h("button",{className:"btn sm",disabled:txt.trim().length<15,onClick:()=>{request(t,txt.trim());setOpen(false);setTxt("");}},"Enviar solicitud"),h("button",{className:"btn alt sm",onClick:()=>setOpen(false)},"Cancelar")))
  :h("div",null,sol&&sol.estado==="atendida"?h("div",{className:"sm mut"},"Última solicitud atendida"):null,h("button",{className:"btn alt sm",onClick:()=>setOpen(true)},"Solicitar reajuste"));
}

/* ---------- Tarjeta de equipo en el tablero del sorteo ---------- */
function Bar({a,win}){const ok=altScored(a),v=ok?altPond(a):0;
 return h("div",{style:{display:"grid",gridTemplateColumns:"1fr 54px",gap:8,alignItems:"center"}},
  h("div",{style:{background:"var(--line)",borderRadius:99,height:12}},h("div",{style:{width:v+"%",height:12,borderRadius:99,background:win?"var(--or)":"var(--mut)"}})),
  h("b",{className:"sm",style:{textAlign:"right"}},ok?v+"%":"—"));}
function TeamCard({t,tm,teams,isAdmin,me,team,busy,run,canDraw,request,setEd,ed,conf,setConf,releaseDraw,wC}){
 const a=tm.alts||{},dn=!!tm.sorteoAt,lid=nameOf(tm,leaderOf(tm)),nm=members(tm).length,key="x"+t;
 const canC=isAdmin||(team===t&&!!me),C=a.C||{};
 const rk=ranking(a),top=rk.length?rk[0][0]:"",el=tm.elegida;
 const dupC=str(C.n).trim()&&(POOL.some(x=>norm(x.n)===norm(C.n))||Array.from({length:NT},(_,i)=>i+1).some(n=>n!==t&&teams[n]&&teams[n].alts&&teams[n].alts.C&&norm(teams[n].alts.C.n)===norm(C.n)));
 const box=(k,lab,body)=>h("div",{className:"ex",style:{minWidth:0,borderLeft:"4px solid "+(el===k?"var(--or)":"var(--line)")}},h("div",{className:"bar"},h("b",{className:"sm"},lab),el===k?h("span",{className:"pill ok"},"✓ Elegida"):null),body);
 return h("div",{className:"card",style:{marginTop:10,borderColor:t===team?"var(--or)":"var(--line)"}},
  h("div",{className:"bar"},h("div",null,h("h3",{style:{margin:0}},"Equipo "+loc(t)),h("div",{className:"sm mut"},nm?(lid?"Director General: "+lid:"Sin Director General")+" · "+nm+" integrantes":"Sin integrantes")),
   h("div",{className:"row"},
    !dn&&canDraw(t)?h("button",{className:"btn sm",disabled:!!busy,onClick:()=>run(t)},busy===t?"Sorteando…":"🎲 Sortear A y B"):null,
    isAdmin?h("button",{className:"btn alt sm",onClick:()=>setEd(ed===t?0:t)},(tm.solicitud&&tm.solicitud.estado==="pendiente"?"⚠️ ":"")+"✏️ Reajustar"):null,
    isAdmin&&dn?(conf===key?h("span",{className:"row"},h("button",{className:"btn sm",onClick:()=>{releaseDraw(t);setConf("");}},"Sí, liberar"),h("button",{className:"btn alt sm",onClick:()=>setConf("")},"No")):h("button",{className:"btn alt sm",onClick:()=>setConf(key)},"Liberar")):null,
    !isAdmin&&dn&&canDraw(t)?h(Solicitar,{t,tm,request}):null)),
  h("div",{className:"grid",style:{gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",margin:"10px 0 6px"}},
   box("A","A · por sorteo",dn?h("div",null,h("div",{style:{fontWeight:700}},str(a.A&&a.A.n)),h("div",{className:"sm mut"},str(a.A&&a.A.giro))):h("span",{className:"pill wa"},"Pendiente de sorteo")),
   box("B","B · por sorteo",dn?h("div",null,h("div",{style:{fontWeight:700}},str(a.B&&a.B.n)),h("div",{className:"sm mut"},str(a.B&&a.B.giro))):h("span",{className:"pill wa"},"Pendiente de sorteo")),
   box("C","C · propuesta del equipo",canC?h("div",null,
     h("label",{className:"l sm",htmlFor:"tc"+t+"n",style:{marginTop:2}},"Nombre de la empresa familiar o local"),
     h("input",{id:"tc"+t+"n",type:"text",value:str(C.n),placeholder:"Ej.: Panadería La Espiga",onChange:e=>{wC(t,"n",e.target.value);if(!C.tipo)wC(t,"tipo","Empresa familiar",0);wC(t,"orig","Propuesta del equipo",0);}}),
     h("label",{className:"l sm",htmlFor:"tc"+t+"tp"},"Tipo"),
     h("select",{id:"tc"+t+"tp",value:str(C.tipo),onChange:e=>wC(t,"tipo",e.target.value,0)},h("option",{value:""},"Elegir…"),TIPOS.map(x=>h("option",{key:x},x))),
     h("label",{className:"l sm",htmlFor:"tc"+t+"g"},"Giro"),
     h("input",{id:"tc"+t+"g",type:"text",value:str(C.giro),placeholder:"Ej.: panadería y repostería",onChange:e=>wC(t,"giro",e.target.value)}),
     h("label",{className:"l sm",htmlFor:"tc"+t+"c"},"Dueño o responsable"),
     h("input",{id:"tc"+t+"c",type:"text",value:str(C.contacto),placeholder:"Nombre y parentesco o relación",onChange:e=>wC(t,"contacto",e.target.value)}),
     dupC?h("p",{className:"sm",style:{color:"var(--kot)"}},"Esa organización no está disponible. Elijan otra."):null)
    :str(C.n)?h("div",null,h("div",{style:{fontWeight:700}},C.n),h("div",{className:"sm mut"},[C.tipo,C.giro].filter(Boolean).join(" · "))):h("span",{className:"pill wa"},"Por definir"))),
  h("div",{style:{marginTop:6}},h("b",{className:"sm"},"Análisis final por porcentaje (matriz ponderada)"),
   h("div",{style:{display:"grid",gap:4,marginTop:6}},SLOTS.map(([k])=>{const x=a[k]||{};return h("div",{key:k,style:{display:"grid",gridTemplateColumns:"minmax(80px,38%) 1fr",gap:8,alignItems:"center"}},
    h("span",{className:"sm",style:{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},k+". "+(str(x.n)||"—")+(x.acepta==="Sí"?" ✓":x.acepta==="No"?" ✗":"")),h(Bar,{a:x,win:k===top}));})),
   h("p",{className:"sm",style:{marginTop:6}},rk.length<3?h("span",{className:"mut"},"El porcentaje aparece cuando califican las tres en «Mi equipo», paso 4."):
    el?[h("b",{key:1},"Final: "+el+". "+str(a[el]&&a[el].n)+" ("+altPond(a[el])+"%)"),el===top?h("span",{key:2,className:"pill ok",style:{marginLeft:6}},"Coincide con el mayor porcentaje"):h("span",{key:2,className:"pill wa",style:{marginLeft:6}},"Por razones cualitativas")]
    :h("span",null,"Mayor porcentaje: ",h("b",null,top+". "+str(a[top]&&a[top].n)+" ("+altPond(a[top])+"%)")," · falta la decisión del paso 5"))));
}

/* ---------- Tablero del sorteo ---------- */
function Sorteo({teams,sorteo,isAdmin,me,team,drawAB,releaseDraw,reassign,request,attend,wC}){
 const [spin,setSpin]=useState(""),[last,setLast]=useState(null),[busy,setBusy]=useState(0),[conf,setConf]=useState(""),[ed,setEd]=useState(0);
 const solic=Array.from({length:NT},(_,i)=>i+1).filter(n=>teams[n]&&teams[n].solicitud&&teams[n].solicitud.estado==="pendiente");
 const libres=POOL.filter(x=>!takenBy(sorteo,x)),hechos=Array.from({length:NT},(_,i)=>i+1).filter(n=>teams[n]&&teams[n].sorteoAt).length;
 const canDraw=t=>isAdmin||(team===t&&!!me&&leaderOf(teams[t])===me);
 const run=async t=>{setBusy(t);setLast(null);let i=0;const iv=setInterval(()=>{setSpin(POOL[i%POOL.length].n);i++;},85);
  let r;try{r=await drawAB(t);}catch(e){r={ok:false,msg:"No se pudo completar el sorteo. Inténtalo de nuevo."};}
  await new Promise(x=>setTimeout(x,1500));clearInterval(iv);setSpin("");setLast({t,...r});setBusy(0);return r;};
 const runAll=async g=>{for(let i=1;i<=5;i++){const t=g.off+i;if(teams[t]&&teams[t].sorteoAt)continue;const r=await run(t);if(!r.ok)break;await new Promise(x=>setTimeout(x,700));}};
 return h("div",{className:"stack"},
  h("div",{className:"card",style:{borderColor:"var(--or)"}},h("h2",null,"🎲 Sorteo de organizaciones"),
   h("ol",{style:{paddingLeft:"1.2em"}},
    h("li",null,"Cada equipo recibe por sorteo ",h("b",null,"dos organizaciones del catálogo"),": la alternativa A y la alternativa B."),
    h("li",null,h("b",null,"Ninguna organización se repite"),", ni dentro de un grupo ni entre Liderazgo y Administración."),
    h("li",null,"La B siempre es de ",h("b",null,"un giro distinto")," a la A, para que comparen organizaciones diferentes."),
    h("li",null,"Sortea el ",h("b",null,"Director General")," de cada equipo (entrando con su nombre) o la docente. El resultado queda registrado con fecha y nombre, y no se puede volver a sortear sin que la docente lo libere."),
    h("li",null,"La ",h("b",null,"alternativa C")," no se sortea: la propone el equipo, por ejemplo una empresa familiar, y la escriben en su tarjeta de este tablero o en «Mi equipo»."),
    h("li",null,"Cuando califican las tres en «Mi equipo», cada tarjeta muestra el ",h("b",null,"análisis final por porcentaje")," y la organización elegida.")),
   h("div",{className:"kpi",style:{marginTop:8}},isAdmin?h("div",null,h("b",null,libres.length+" / "+POOL.length),"Organizaciones libres"):h("div",null,h("b",null,POOL.length),"Organizaciones en el sorteo"),isAdmin?h("div",null,h("b",null,hechos+" / "+NT),"Equipos sorteados"):null,isAdmin?h("div",{className:solic.length?"wa":""},h("b",null,solic.length),"Solicitudes de reajuste"):null),
   isAdmin?h("p",{className:"sm mut",style:{marginTop:8}},"Para cambiar la alternativa A o B de un equipo, presiona «✏️ Reajustar» en su fila. Puedes elegir una organización libre o volver a sortear solo esa casilla."):h("p",{className:"sm mut",style:{marginTop:8}},"Si una organización asignada no responde o no puede colaborar, el Director General presiona «Solicitar reajuste» en la fila de su equipo.")),
  h("div",{className:"card",style:{textAlign:"center",background:"var(--soft)",borderColor:"var(--or)"}},
   spin?h("div",null,h("p",{className:"mut"},"Sorteando para "+tLab(busy)+"…"),h("div",{className:"drum",style:{justifyContent:"center",fontSize:"1.8rem"},"aria-live":"polite"},"🎲 "+spin))
   :last?(last.ok?h("div",{"aria-live":"polite"},h("p",{className:"mut"},tLab(last.t)+(last.prev?" ya tenía su sorteo":"")),h("div",{style:{fontSize:"1.5rem",fontWeight:800,lineHeight:1.3}},"A: "+last.a,h("br"),"B: "+last.b))
     :h("p",{role:"alert",style:{fontWeight:700,color:"var(--kot)"}},last.msg))
   :h("p",{className:"mut"},isAdmin?"Aquí aparece el resultado de cada sorteo. Pueden proyectar esta pantalla en clase.":"Aquí aparece el resultado del sorteo de su equipo.")),
  h("div",{className:isAdmin?"g2":""},GRUPOS.filter(g=>isAdmin||(team&&grpOf(team)===g)).map(g=>{const pend=[1,2,3,4,5].map(i=>g.off+i).filter(t=>!(teams[t]&&teams[t].sorteoAt)).length;
   return h("div",{key:g.k,style:{minWidth:0}},h("div",{className:"card",style:{background:"var(--soft)"}},h("div",{className:"bar"},h("h2",{style:{margin:0}},g.n),
     isAdmin&&pend?h("button",{className:"btn sm",disabled:!!busy,onClick:()=>runAll(g)},"Sortear los "+pend+" pendientes"):isAdmin?h("span",{className:"sm mut"},(5-pend)+" de 5 equipos sorteados"):null)),
    [1,2,3,4,5].filter(i=>isAdmin||g.off+i===team).map(i=>{const t=g.off+i;return h("div",{key:t},h(TeamCard,{t,tm:teams[t]||{},teams,isAdmin,me,team,busy,run,canDraw,request,setEd,ed,conf,setConf,releaseDraw,wC}),
     isAdmin&&ed===t?h(Ajuste,{key:"aj"+t,t,tm:teams[t]||{},sorteo,reassign,attend,onClose:()=>setEd(0)}):null);}));})),
  h("div",{className:"card"},h("h2",null,"Organizaciones del sorteo"),
   h("div",{className:"chips"},POOL.map(x=>{const v0=takenBy(sorteo,x),v=v0&&(isAdmin||v0.t===team)?v0:null;return h("span",{key:x.n,className:v?"wa":"",title:x.catn},(v?"● ":"○ ")+x.n+(v?(isAdmin?" → "+grpOf(v.t).n.slice(0,4)+". E"+loc(v.t):" → su equipo")+" ("+v.slot+")":""));})),
   h("p",{className:"sm mut"},isAdmin?"○ libre · ● asignada. Las fuentes de cada organización están en «Organizaciones».":"● asignada a su equipo. Las fuentes de cada organización están en «Organizaciones».")));
}

/* ---------- Reportes (docente) ---------- */
const nota=gr=>{const p=score(gr||{});return p?(p/.8).toFixed(1):"—";};
function RepGrupo({G,teams,allW,grades}){
 const TT=[1,2,3,4,5].map(i=>G.off+i),reg=regMap(G,teams),sin=rosterOf(G).map(fullName).filter(n=>!reg[norm(n)]);
 let ent=0;TT.forEach(n=>W.forEach((w,i)=>{if(delivered((allW[n]||{})[i]))ent++;}));
 const notas=TT.map(n=>score(grades[n]||{})/.8).filter(q=>q>0),prom=notas.length?(notas.reduce((a,b)=>a+b,0)/notas.length).toFixed(1):"—";
 return h("div",null,h(Portada,{tit:"Reporte del grupo "+G.n,sub:"Cinco equipos · "+G.lista.length+" alumnos en la lista"}),
  Hs("1. Resumen"),
  h("div",{className:"kpi"},h("div",null,h("b",null,Object.keys(reg).length+" / "+G.lista.length),"Alumnos registrados"),h("div",null,h("b",null,TT.filter(n=>empOfTeam(teams[n])).length+" / 5"),"Equipos con organización"),h("div",null,h("b",null,Math.round(ent/40*100)+"%"),"Entregas marcadas"),h("div",null,h("b",null,prom),"Promedio sobre 100")),
  Hs("2. Equipos y organizaciones"),
  h("div",{className:"w"},h("table",null,h("thead",null,h("tr",null,h("th",null,"Equipo"),h("th",null,"Director General"),h("th",null,"Integrantes"),h("th",null,"Organización"),h("th",null,"Entregas"),h("th",null,"Nota /100"))),
   h("tbody",null,TT.map(n=>{const tm=teams[n]||{},e=empOfTeam(tm),d=W.filter((w,i)=>delivered((allW[n]||{})[i])).length;
    return h("tr",{key:n},h("td",{className:"c"},loc(n)),h("td",null,nameOf(tm,leaderOf(tm))||"—"),h("td",{className:"c"},members(tm).length),h("td",null,e?h("div",null,h("b",null,e.n),h("div",{className:"sm mut"},[e.tipo,e.acepta?"aceptó: "+e.acepta:""].filter(Boolean).join(" · "))):"—"),h("td",{className:"c"},d+"/8"),h("td",{className:"c"},nota(grades[n])));})))),
  Hs("3. Estado de entregas por semana"),
  h("div",{className:"w"},h("table",null,h("thead",null,h("tr",null,h("th",null,"Equipo"),W.map((w,i)=>h("th",{key:i},"S"+(i+1))))),
   h("tbody",null,TT.map(n=>h("tr",{key:n},h("td",{className:"c"},loc(n)),W.map((w,i)=>{const s2=estado((allW[n]||{})[i],i);return h("td",{key:i,className:"c "+s2.c,title:s2.l},s2.s);})))))),
  h("p",{className:"sm mut"},"✓ entregado · Tarde: después de la fecha · ✗ no entregado con plazo vencido · · pendiente."),
  Hs("4. Calificaciones"),
  h("div",{className:"w"},h("table",null,h("thead",null,h("tr",null,h("th",null,"Equipo"),W.map((w,i)=>h("th",{key:i},"E"+(i+1))),h("th",null,"Pitch"),h("th",null,"Puntos /80"),h("th",null,"Sobre 100"))),
   h("tbody",null,TT.map(n=>{const gr=grades[n]||{},p=score(gr);return h("tr",{key:n},h("td",{className:"c"},loc(n)),W.map((w,i)=>h("td",{key:i,className:"c"},str(gr.c&&gr.c[i])||"·")),h("td",{className:"c"},str(gr.pitch)||"·"),h("td",{className:"c"},p.toFixed(1)),h("td",{className:"c"},h("b",null,(p/.8).toFixed(1))));})))),
  Hs("5. Integrantes y roles"),
  TT.map(n=>{const tm=teams[n]||{},ms=members(tm);return h("p",{key:n},h("b",null,"Equipo "+loc(n)+": "),ms.length?ms.map(([id,x])=>x.n+(rolesOf(tm,id).length?" ("+rolesOf(tm,id).join(", ")+")":"")).join("; "):"sin integrantes");}),
  Hs("6. Alumnos sin equipo"),h("p",null,sin.length?sin.join(", "):"Todos los alumnos tienen equipo."));
}
function RepEquipo({t,teams,allW,grades}){
 const tm=teams[t]||{},ms=members(tm),e=empOfTeam(tm),gr=grades[t]||{},wd=allW[t]||{},p=score(gr);
 return h("div",null,h(Portada,{tit:tLab(t)+(e?" · "+e.n:""),sub:"Reporte del equipo"}),
  Hs("1. Integrantes y roles"),
  h("div",{className:"w"},h("table",null,h("thead",null,h("tr",null,h("th",null,"Integrante"),h("th",null,"Rol directivo"))),h("tbody",null,ms.length?ms.map(([id,x])=>h("tr",{key:id},h("td",null,x.n),h("td",null,rolesOf(tm,id).join(", ")||"Sin rol"))):h("tr",null,h("td",{colSpan:2},"Sin integrantes"))))),
  Hs("2. Selección de la organización"),
  h("p",{className:"sm"},"Sorteo: "+(tm.sorteoAt?fmt(tm.sorteoAt)+(tm.sorteoBy?" por "+tm.sorteoBy:""):"pendiente")),
  altsOf(tm).length?[h("h4",{key:"a"},"a) Análisis cuantitativo"),h(CompCuant,{key:"b",al:tm.alts||{},edit:false}),h("h4",{key:"c",style:{marginTop:10}},"b) Análisis cualitativo"),h(CompCual,{key:"d",al:tm.alts||{}}),h("h4",{key:"e",style:{marginTop:10}},"c) Decisión"),h(Decision,{key:"f",tm})]:null,
  h("h4",{style:{marginTop:10}},"Ficha de la organización elegida"),h(FichaOrg,{o:e||{}}),
  Hs("3. Entregas"),
  h("div",{className:"w"},h("table",null,h("thead",null,h("tr",null,h("th",null,"Semana"),h("th",null,"Fecha límite"),h("th",null,"Estado"),h("th",null,"Entregó"),h("th",null,"Lista"),h("th",null,"Calificación"))),
   h("tbody",null,W.map((w,i)=>{const d=wd[i]||{},s2=estado(d,i),[a,b]=cuenta(i,d,tm);return h("tr",{key:i},h("td",null,h("b",null,"S"+(i+1)),h("div",{className:"sm"},w.t)),h("td",{style:{whiteSpace:"nowrap"}},dt(w.d).toLocaleDateString("es-MX",{day:"2-digit",month:"short"})),
    h("td",{className:s2.c},s2.l),h("td",{className:"sm"},delivered(d)?fmt(d.at)+(d.by?" · "+d.by:""):"—"),h("td",{className:"c"},a+"/"+b),h("td",{className:"c"},(str(gr.c&&gr.c[i])||"·")+" /100"));})))),
  Hs("4. Rúbrica y retroalimentación"),
  h("div",{className:"w"},h("table",null,h("thead",null,h("tr",null,h("th",null,"Semana"),RUB.map(([k,l,mx])=>h("th",{key:k},l+" ("+mx+")")),h("th",null,"Comentario"))),
   h("tbody",null,W.map((w,i)=>{const rb=(gr.r&&gr.r[i])||{};return h("tr",{key:i},h("td",{className:"c"},"S"+(i+1)),RUB.map(([k])=>h("td",{key:k,className:"c"},str(rb[k])||"·")),h("td",{className:"sm"},str(gr.m&&gr.m[i])||"—"));})))),
  Hs("5. Nota final ponderada"),
  h("div",{className:"kpi"},h("div",null,h("b",null,p.toFixed(1)+" / 80"),"Puntos acumulados (entregas y pitch)"),h("div",null,h("b",null,(p/.8).toFixed(1)),"Equivalente sobre 100"),h("div",null,h("b",null,str(gr.pitch)||"—"),"Pitch")),
  h("p",{className:"sm mut"},"Pesos: E1 a E3 5% · E4 a E7 10% · E8 15% · Pitch 10%."));
}
/* Reporte de una semana: qué se pidió y qué entregó cada equipo del grupo. */
function RepSemana({G,wi,teams,allW,grades,full}){
 const w=W[wi],TT=[1,2,3,4,5].map(i=>G.off+i);
 const ent=TT.filter(n=>delivered((allW[n]||{})[wi])).length;
 return h("div",null,h(Portada,{tit:"Semana "+(wi+1)+": "+w.t,sub:"Grupo "+G.n+" · Fecha límite: "+fdl(w.d)+", 23:59 · Valor: "+Math.round(w.v*100)+"%"}),
  Hs("1. Lo que se pide esta semana"),
  h("p",null,w.q),
  h("ul",{style:{paddingLeft:"1.2em"}},w.tx.map((x,i)=>h("li",{key:i},"2."+(i+1)+" "+x)),w.nu.length?h("li",null,"Datos: "+w.nu.join(", ")+"."):null,h("li",null,"Conclusión para la propuesta de mejora y fuentes en APA 7.")),
  h("p",{className:"sm mut"},"Fuentes sugeridas: "+w.s),
  Hs("2. Resumen de entregas"),
  h("div",{className:"kpi"},h("div",null,h("b",null,ent+" / 5"),"Equipos que entregaron"),h("div",null,h("b",null,TT.filter(n=>estado((allW[n]||{})[wi],wi).k==="tarde").length),"Con retraso"),h("div",null,h("b",null,TT.filter(n=>estado((allW[n]||{})[wi],wi).k==="no").length),"Sin entregar (vencido)")),
  h("div",{className:"w",style:{marginTop:8}},h("table",null,h("thead",null,h("tr",null,h("th",null,"Equipo"),h("th",null,"Organización"),h("th",null,"Estado"),h("th",null,"Entregó"),h("th",null,"Lista de verificación"),h("th",null,"Calificación"))),
   h("tbody",null,TT.map(n=>{const tm=teams[n]||{},d=(allW[n]||{})[wi]||{},s2=estado(d,wi),[a,b]=cuenta(wi,d,tm),gr=grades[n]||{};
    return h("tr",{key:n},h("td",{className:"c"},loc(n)),h("td",null,(empOfTeam(tm)||{}).n||"—"),h("td",{className:s2.c},s2.l),h("td",{className:"sm"},delivered(d)?fmt(d.at)+(d.by?" · "+d.by:""):"—"),h("td",{className:"c "+(a===b?"ok":"")},a+" de "+b),h("td",{className:"c"},(str(gr.c&&gr.c[wi])||"·")+" /100"));})))),
  full?[Hs("3. Contenido entregado por cada equipo"),
   TT.map(n=>{const tm=teams[n]||{};return h("div",{key:n,style:{marginTop:16}},h("h3",{className:"sec",style:{background:"var(--soft)",padding:"6px 10px",borderRadius:6}},"Equipo "+loc(n)+" · "+((empOfTeam(tm)||{}).n||"organización por registrar")+" · "+estado((allW[n]||{})[wi],wi).l),
    h(DocEntrega,{wi,t:n,tm,wd:(allW[n]||{})[wi]||{},cover:false}));})]:null);
}
function Reportes({teams,allW,grades}){
 const [pg,setPg]=useState(()=>lsGet("pi-pg")||"L"),[sc,setSc]=useState("s"),[wi,setWi]=useState(semanaActual),[full,setFull]=useState(true),box=useRef(null),[msg,setMsg]=useState("");
 const B=window.PI_BACKEND;
 const G=GRUPOS.find(x=>x.k===pg)||GRUPOS[0],t=/^\d$/.test(sc)?G.off+(+sc):0;
 const fname=("PI_ADM1401_"+G.n+(sc==="s"?"_Semana"+(wi+1):t?"_Equipo"+loc(t)+"_"+((empOfTeam(teams[t])||{}).n||""):"_grupo")+"_"+hoyISO()).normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^A-Za-z0-9]+/g,"_");
 const TT=[1,2,3,4,5].map(i=>G.off+i);
 const csv=()=>sc==="s"?"Grupo,Semana,Equipo,Organización,Estado,Fecha de entrega,Entregó,Lista de verificación,Calificación,Comentario\n"+TT.map(n=>{const tm=teams[n]||{},d=(allW[n]||{})[wi]||{},[a,b]=cuenta(wi,d,tm),gr=grades[n]||{};
   return [G.n,"S"+(wi+1),loc(n),(empOfTeam(tm)||{}).n||"",estado(d,wi).l,delivered(d)?fmt(d.at):"",str(d.by),a+"/"+b,str(gr.c&&gr.c[wi]),str(gr.m&&gr.m[wi])].map(csvq).join(",");}).join("\n")
  :"Grupo,Equipo,Director General,Integrantes,Organización,Entregas,"+W.map((w,i)=>"E"+(i+1)).join(",")+",Pitch,Sobre 100\n"+TT.map(n=>{const tm=teams[n]||{},gr=grades[n]||{};
   return [G.n,loc(n),nameOf(tm,leaderOf(tm)),members(tm).map(([,x])=>x.n).join("; "),(empOfTeam(tm)||{}).n||"",W.filter((w,k)=>delivered((allW[n]||{})[k])).length+"/8",...W.map((w,k)=>str(gr.c&&gr.c[k])),str(gr.pitch),(score(gr)/.8).toFixed(1)].map(csvq).join(",");}).join("\n");
 const dlCsv=async()=>{try{await B.download({filename:fname+".csv",data:"﻿"+csv()});setMsg("Resumen descargado.");}catch(e){setMsg("No se pudo descargar.");}};
 return h("div",{className:"stack"},
  h("div",{className:"card noprint",style:{borderColor:"var(--or)"}},h("h2",null,"📊 Reportes"),
   h("p",{className:"sm"},"Elige el grupo y el tipo de reporte. Todos se descargan en PDF con el mismo formato, o como resumen en CSV para Excel."),
   h("div",{className:"row",role:"group","aria-label":"Grupo"},GRUPOS.map(x=>h("button",{key:x.k,className:"btn "+(pg===x.k?"":"alt"),onClick:()=>{setPg(x.k);lsSet("pi-pg",x.k);}},x.n))),
   h("div",{className:"row",role:"group","aria-label":"Tipo de reporte",style:{marginTop:8}},[["s","Por semana"],["g","Del grupo"]].concat([1,2,3,4,5].map(i=>[String(i),"Equipo "+i])).map(([k,l])=>h("button",{key:k,className:"btn sm "+(sc===k?"s":"alt"),onClick:()=>setSc(k)},l))),
   sc==="s"?h("div",null,h("div",{className:"row",role:"group","aria-label":"Semana",style:{marginTop:8}},W.map((w,i)=>h("button",{key:i,className:"btn sm "+(wi===i?"":"alt"),title:w.t,onClick:()=>setWi(i)},"S"+(i+1)))),
    h("label",{className:"sm row",style:{marginTop:8,gap:6}},h("input",{type:"checkbox",checked:full,onChange:e=>setFull(e.target.checked)}),"Incluir el contenido completo que entregó cada equipo")):null,
   h("div",{style:{marginTop:10}},h(PdfBtn,{target:box,fname,label:"⬇️ Descargar este reporte en PDF"})),
   sc==="s"||sc==="g"?h("div",{className:"row",style:{marginTop:6}},h("button",{className:"btn alt sm",onClick:dlCsv},"Descargar resumen (CSV)"),msg?h("span",{className:"sm",role:"status"},msg):null):null),
  h("div",{ref:box,className:"card"},sc==="s"?h(RepSemana,{G,wi,teams,allW,grades,full}):t?h(RepEquipo,{t,teams,allW,grades}):h(RepGrupo,{G,teams,allW,grades})));
}

/* ---------- Compartir la liga (docente) ---------- */
function Compartir(){
 const url=location.origin+location.pathname,box=useRef(null),[cp,setCp]=useState(false);
 useEffect(()=>{let ok=true;const draw=()=>{if(!ok||!box.current||!window.QRCode)return;box.current.innerHTML="";new window.QRCode(box.current,{text:url,width:168,height:168,correctLevel:window.QRCode.CorrectLevel.M});};
  if(window.QRCode)draw();else{const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";s.onload=draw;document.head.appendChild(s);}return()=>{ok=false};},[]);
 const share=()=>{if(navigator.share)navigator.share({title:"Proyecto Integrador ADM1401",text:"Entra con tu código personal:",url}).catch(()=>{});else{try{navigator.clipboard.writeText(url).then(()=>setCp(true));}catch(e){}}};
 return h("div",{className:"card"},h("h2",null,"📱 Compartir con los alumnos"),
  h("div",{className:"row",style:{alignItems:"flex-start",gap:16}},
   h("div",{ref:box,style:{background:"#fff",padding:8,borderRadius:8,minWidth:184,minHeight:184},"aria-label":"Código QR de la página"}),
   h("div",{style:{flex:"1 1 240px",minWidth:0}},h("p",{className:"sm"},"Proyecta este código QR en clase o comparte la liga por WhatsApp o Brightspace. Cada alumno entra con su código personal; también puedes enviarles su liga directa desde el menú «Proyecto Integrador» de tu Hoja de Google."),
    h("p",null,h("code",{style:{overflowWrap:"anywhere"}},url)),
    h("button",{className:"btn sm",onClick:share},navigator.share?"Compartir liga":cp?"Liga copiada":"Copiar liga"))));
}

/* ---------- Panel docente ---------- */
function Docente({teams,allW,grades,wg2,openTeam,sorteo,releaseDraw,reopen,claves,regen}){
 const [conf,setConf]=useState("");
 const [pg,setPg]=useState(()=>lsGet("pi-pg")||"L");
 const G=GRUPOS.find(x=>x.k===pg)||GRUPOS[0],TT=[1,2,3,4,5].map(i=>G.off+i),reg=regMap(G,teams),sin=rosterOf(G).map(fullName).filter(n=>!reg[norm(n)]);
 const sa=semanaActual();let ent=0,tot=0,rojo=0;TT.forEach(n=>W.forEach((w,i)=>{const s=estado((allW[n]||{})[i],i);tot++;if(s.k==="ok"||s.k==="tarde")ent++;if(s.k==="no")rojo++;}));
 const entSa=TT.filter(n=>delivered((allW[n]||{})[sa])).length;
 return h("div",{className:"stack"},
  h("div",{className:"row",role:"group","aria-label":"Grupo"},GRUPOS.map(x=>h("button",{key:x.k,className:"btn "+(pg===x.k?"":"alt"),onClick:()=>{setPg(x.k);lsSet("pi-pg",x.k);}},x.n+" · "+Object.keys(regMap(x,teams)).length+"/"+x.lista.length))),
  h(ClavesEquipo,{claves:claves||{},regen,teams}),
  h("div",{className:"kpi"},h("div",null,h("b",null,"S"+(sa+1)+": "+entSa+"/5"),"Entregaron la semana en curso"),h("div",null,h("b",null,tot?Math.round(ent/tot*100)+"%":"0%"),"Entregas del semestre"),h("div",{className:rojo?"ko":""},h("b",null,rojo),"Entregas vencidas"),h("div",null,h("b",null,sin.length),"Alumnos sin equipo")),
  h("div",null,h("h2",null,"Tablero de entregas · "+G.n),
   h("div",{className:"w"},h("table",null,h("thead",null,h("tr",null,h("th",null,"Equipo"),h("th",null,"Organización"),W.map((w,i)=>h("th",{key:i,style:i===sa?{outline:"3px solid #fff",outlineOffset:-4}:null},"S"+(i+1),h("br"),h("small",null,dt(w.d).toLocaleDateString("es-MX",{day:"2-digit",month:"2-digit"})))),h("th",null,"%"),h("th",null,""))),
    h("tbody",null,TT.map(n=>{const tm=teams[n]||{},e=empOfTeam(tm),ss=W.map((w,i)=>estado((allW[n]||{})[i],i)),done=ss.filter(s=>s.k==="ok"||s.k==="tarde").length;
     return h("tr",{key:n},h("td",{className:"c"},h("b",null,loc(n)),h("div",{className:"sm mut"},members(tm).length+" int.")),h("td",null,e?h("div",null,h("b",null,e.n),str(tm.nombre).trim()?h("div",{className:"sm mut"},tm.nombre):null):tm.sorteoAt&&tm.alts?h("div",{className:"sm"},"Sorteo: "+[tm.alts.A&&tm.alts.A.n,tm.alts.B&&tm.alts.B.n].filter(Boolean).join(" · "),h("br"),h("span",{className:"pill wa"},"Por elegir")):h("span",{className:"pill wa"},"Sin sorteo")),
      ss.map((s,i)=>h("td",{key:i,className:"c "+s.c,title:s.l},s.s)),h("td",{className:"c"},Math.round(done/8*100)+"%"),
      h("td",null,h("button",{className:"btn alt sm",onClick:()=>openTeam(n)},"Abrir")));})))),
   h("p",{className:"sm mut"},"✓ Entregado · Tarde = después de la fecha · ✗ No entregado con el plazo vencido · · Pendiente. «Abrir» muestra el trabajo del equipo para revisar y calificar en cada semana.")),
  h("div",{className:"card"},h("h2",null,"Sorteo de alternativas A y B · ambos grupos"),
   h("p",{className:"sm mut"},"Libres: "+POOL.filter(x=>!takenBy(sorteo,x)).length+" de "+POOL.length+" organizaciones. Ninguna se repite entre equipos de Liderazgo y Administración."),
   h("div",{className:"w"},h("table",null,h("thead",null,h("tr",null,h("th",null,"Equipo"),h("th",null,"Alternativa A"),h("th",null,"Alternativa B"),h("th",null,"Fecha"),h("th",null,""))),
    h("tbody",null,Array.from({length:NT},(_,i)=>i+1).map(n=>{const tm=teams[n]||{},a=tm.alts||{},dn=!!tm.sorteoAt,key="r"+n;
     return h("tr",{key:n},h("td",null,tLab(n)),h("td",null,dn?str(a.A&&a.A.n):"—"),h("td",null,dn?str(a.B&&a.B.n):"—"),h("td",null,dn?fmt(tm.sorteoAt):h("span",{className:"pill wa"},"Sin sortear")),
      h("td",null,dn?(conf===key?h("span",{className:"row"},h("button",{className:"btn sm",onClick:()=>{releaseDraw(n);setConf("");}},"Sí, liberar"),h("button",{className:"btn alt sm",onClick:()=>setConf("")},"No")):h("button",{className:"btn alt sm",onClick:()=>setConf(key)},"Liberar para resortear")):null));})))),
   h("p",{className:"sm mut"},"«Liberar para resortear» devuelve sus dos organizaciones al sorteo y borra las casillas A y B del equipo; la C y la elección se conservan.")),
  h("div",{className:"card"},h("h2",null,"Organizaciones elegidas · "+G.n),
   h("div",{className:"w"},h("table",null,h("thead",null,h("tr",null,h("th",null,"Equipo"),h("th",null,"Alternativas completas"),h("th",null,"Elegida"),h("th",null,"Contacto"),h("th",null,"Evidencia"),h("th",null,""))),
    h("tbody",null,TT.map(n=>{const tm=teams[n],e=empOfTeam(tm),okc=altsOf(tm).filter(([,a])=>altOk(a)).length,ev=str(tm&&tm.evid);
     return h("tr",{key:n},h("td",{className:"c"},loc(n)),h("td",{className:"c "+(okc>=3?"ok":okc?"wa":"")},okc),h("td",null,e?h("div",null,h("b",null,e.n),h("div",{className:"sm mut"},str(e.tipo))):"—"),h("td",null,e?str(e.contacto):"—"),
      h("td",null,/^https?:\/\//.test(ev)?h("a",{href:ev,target:"_blank",rel:"noopener"},"Abrir"):"—"),
      h("td",null,e?(conf===String(n)?h("span",{className:"row"},h("button",{className:"btn sm",onClick:()=>{reopen(n);setConf("");}},"Sí, reabrir"),h("button",{className:"btn alt sm",onClick:()=>setConf("")},"No")):h("button",{className:"btn alt sm",onClick:()=>setConf(String(n))},"Reabrir selección")):null));})))),
   h("p",{className:"sm mut"},"«Reabrir selección» permite al equipo elegir otra organización; sus alternativas se conservan.")),
  h("div",null,h("h2",null,"Calificaciones y nota final ponderada"),
   h("div",{className:"w",style:{marginTop:8}},h("table",null,h("thead",null,h("tr",null,h("th",null,"Equipo"),W.map((w,i)=>h("th",{key:i},"E"+(i+1),h("br"),h("small",null,Math.round(w.v*100)+"%"))),h("th",null,"Pitch",h("br"),h("small",null,"10%")),h("th",{className:"g"},"Puntos (máx. 80)"),h("th",{className:"g"},"Sobre 100"))),
    h("tbody",null,TT.map(n=>{const gr=grades[n]||{},p=score(gr),q=p/.8;return h("tr",{key:n},h("td",{className:"c"},loc(n)),W.map((w,i)=>h("td",{key:i,className:"c"},str(gr.c&&gr.c[i])||"·")),
     h("td",{style:{minWidth:90}},h("input",{type:"number",min:0,max:100,"aria-label":"Pitch equipo "+loc(n),value:str(gr.pitch),onChange:e=>wg2(n,["pitch"],e.target.value)})),
     h("td",{className:"c"},p.toFixed(1)),h("td",{className:"c "+(q>=90?"ok":q>=70?"wa":p?"ko":"")},q.toFixed(1)));})))),
   h("p",{className:"sm mut"},"La calificación de cada entrega se captura con la rúbrica dentro de la semana del equipo (botón «Abrir»). Los pesos suman 80% con el pitch; «Sobre 100» reescala el avance.")),
  h(EvalRoles,{G,teams,allW,grades}),
  h("div",{className:"card"},h("h2",null,"Sin equipo · "+G.n+" ("+sin.length+")"),sin.length?h("div",{className:"chips"},sin.map(n=>h("span",{key:n},n))):h("p",{className:"mut"},"Todos los alumnos ya tienen equipo.")),
  window.PI_BACKEND.mode==="artifact"?null:h(Compartir),
  h(Respaldo));
}

/* ---------- Catálogo de organizaciones y cómo contactar ---------- */
function Opciones({sorteo,teams,team,isAdmin}){
 const [cp,setCp]=useState(""),[f,setF]=useState("todas"),[q,setQ]=useState("");
 const copy=(txt,k)=>{try{navigator.clipboard.writeText(txt).then(()=>setCp(k),()=>{});}catch(e){}};
 const carta=cartaTxt(1,{}),total=CAT.reduce((s,c)=>s+c.items.length,0);
 const match=x=>!q.trim()||norm(x.n+" "+x.s).includes(norm(q));
 const vis=CAT.filter(c=>f==="todas"||f===c.k).map(c=>({...c,items:c.items.filter(match)})).filter(c=>c.k==="fam"?(f==="todas"||f==="fam")&&!q.trim():c.items.length);
 return h("div",{className:"stack"},
  h("div",{className:"card",style:{borderColor:"var(--or)"}},h("h2",null,"¿Con qué organización trabajar?"),
   h("p",null,"Cada equipo investiga ",h("b",null,"tres organizaciones diferentes"),", contacta a sus dueños o responsables y elige una para todo el proyecto."),
   h("ul",{style:{paddingLeft:"1.2em"}},
    h("li",null,h("b",null,"Alternativas A y B:")," se asignan por ",h("b",null,"sorteo")," entre las organizaciones de este catálogo ("+POOL.length+" participan). No se repiten entre ningún equipo de Liderazgo y Administración, y la B es de un giro distinto a la A. Lo hace el Director General en «Mi equipo», paso 2."),
    h("li",null,h("b",null,"Alternativa C:")," ",h("b",null,"siempre la proponen ustedes"),". La empresa familiar tiene carta abierta: cualquier negocio cuyo dueño acepte colaborar es válido."),
    h("li",null,"Al final pueden elegir cualquiera de las tres, siempre que su dueño o responsable haya aceptado colaborar."))),
  h("div",{className:"card"},h("div",{className:"bar"},h("h2",{style:{margin:0}},"Catálogo"),h("div",{style:{flex:"1 1 220px",maxWidth:320}},h("input",{type:"text","aria-label":"Buscar en el catálogo",placeholder:"Buscar: café, buceo, mercado…",value:q,onChange:e=>setQ(e.target.value)}))),
   h("div",{className:"row",role:"group","aria-label":"Filtrar por giro",style:{marginTop:10}},[["todas","Todas"]].concat(CAT.map(c=>[c.k,c.n])).map(([k,l])=>h("button",{key:k,className:"btn sm "+(f===k?"":"alt"),onClick:()=>setF(k)},l)))),
  vis.length?vis.map(c=>h("div",{key:c.k,className:"card"},h("h2",null,c.n),h("p",{className:"mut"},c.d),
   c.items.length?h("div",{className:"grid",style:{gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))"}},c.items.map(x=>{const sd=takenBy(sorteo,x);return h("div",{key:x.n,className:"co"},h("b",null,x.n),h("p",{className:"mut sm"},x.s),
    x.gen?h("span",{className:"pill"},"Idea general · no entra al sorteo"):sd&&isAdmin?h("span",{className:"pill wa"},"Sorteada: "+tLab(sd.t)+" ("+sd.slot+")"):sd&&sd.t===team?h("span",{className:"pill ok"},"Asignada a su equipo ("+sd.slot+")"):h("span",{className:"pill"},"Participa en el sorteo"),
    h(Links,{list:x.links}));})):
   h("ul",{style:{paddingLeft:"1.2em"}},c.ej.map(x=>h("li",{key:x},x))))):h("div",{className:"card"},h("p",{className:"mut"},"No hay opciones que coincidan. Recuerden que también pueden proponer su propia organización.")),
  h("div",{className:"card"},h("h2",null,"Cómo hacer el contacto"),
   h("ol",{style:{paddingLeft:"1.2em"}},
    h("li",null,"Ubiquen a quien dirige: dueño, gerente, director o coordinador."),
    h("li",null,"Preséntense con la carta (formal) o el mensaje breve (por teléfono o WhatsApp)."),
    h("li",null,"Pidan una entrevista de 30 minutos y autorización para usar la información con fines académicos."),
    h("li",null,"Usen la guía de entrevista de abajo; sus respuestas alimentan las 8 entregas."),
    h("li",null,"Si aceptan, pidan que firmen la parte final de la carta, súbanla a su nube y registren todo en «Mi equipo», paso 3.")),
   h("div",{className:"g2",style:{marginTop:8}},
    h("div",{className:"ex"},h("b",null,"Carta de presentación"),h("pre",{style:{whiteSpace:"pre-wrap",font:"inherit",fontSize:".85rem",margin:"8px 0"}},carta),h("button",{className:"btn alt sm",onClick:()=>copy(carta,"c")},cp==="c"?"Copiada":"Copiar carta"),h("p",{className:"sm mut"},"Desde «Mi equipo» se copia con los nombres de su equipo ya escritos.")),
    h("div",{className:"ex"},h("b",null,"Mensaje breve"),h("p",null,GUION),h("button",{className:"btn alt sm",onClick:()=>copy(GUION,"m")},cp==="m"?"Copiado":"Copiar mensaje")))),
  h("div",{className:"card"},h("div",{className:"bar"},h("h2",{style:{margin:0}},"Guía de entrevista con el dueño"),h("button",{className:"btn alt sm",onClick:()=>copy(guiaTxt(),"g")},cp==="g"?"Guía copiada":"Copiar guía")),
   h("p",{className:"mut sm"},"Siete bloques que cubren lo que necesitarán en todo el proyecto: historia y misión (S1 y S4), clientes y competencia (S2 y S3), operación y números (S5), personas (S6 y S7) y retos para la propuesta de mejora (S8)."),
   h(Guia)),
  h("div",{className:"card"},h("h2",null,"Fuentes generales"),h(Links,{list:GEN}),h("p",{className:"sm mut"},"Citen todas sus fuentes en APA 7 dentro de cada entrega. La entrevista con el dueño se cita como comunicación personal.")));
}

/* ---------- App ---------- */
function App(){
 const [db,setDb]=useState(null),[editor,setEditor]=useState(false);
 const B0=window.PI_BACKEND,sheets=B0.mode==="sheets",ses=B0.session();
 /* Sesión del artefacto y la demostración: {rol:"docente"} o {rol:"equipo",t,h} (solo dura mientras la pestaña esté abierta). */
 const [cs,setCs]=useState(()=>sheets?null:SS.get("pi-ses")),[aviso,setAviso]=useState("");
 const isAdmin=sheets?editor:!!(cs&&cs.rol==="docente"&&(B0.mode!=="artifact"||editor));
 const eqSes=sheets?(ses.rol==="alumno"?(ses.equipo||0):0):(cs&&cs.rol==="equipo"?cs.t:0);
 const [meSes,setMeSes]=useState(()=>eqSes?(sheets?str(ses.me):str(SS.get("pi-conf-"+eqSes))):"");
 const [llaves,setLlaves]=useState({}),[claves,setClaves]=useState(()=>sheets?(ses.claves||{}):{}),[cargado,setCargado]=useState(sheets);
 const [view,setView]=useState("inicio"),[team,setTeam]=useState(0),[me,setMe]=useState("");
 const [teams,setTeams]=useState({}),[sorteo,setSorteo]=useState({}),[grades,setGrades]=useState({}),[wdocs,setW]=useState({}),[allW,setAllW]=useState({}),[pub,setPub]=useState({});
 const pend=useRef(new Map()),timers=useRef({}),fns=useRef({}),sched=useRef(new Set()),navRef=useRef(null),nameRef=useRef("");
 const applyPend=(path,d)=>{let x=d||{};pend.current.forEach(v=>{if(v.path===path)x=setIn(x,v.p,v.v)});return x;};
 useEffect(()=>{let ok=true;const c=window.claude;if(!c||!c.use)return;
  c.use("db").then(d=>{if(ok&&d)setDb(d)}).catch(()=>{});
  c.use("user").then(u=>{if(!ok||!u)return;u.canEdit&&u.canEdit().then(v=>{if(ok)setEditor(!!v)}).catch(()=>{});}).catch(()=>{});
  return()=>{ok=false}},[]);
 useEffect(()=>{if(!db)return;const un=[];
  try{un.push(db.collection("teams").onSnapshot(sn=>{const o={};sn.docs.forEach(d=>{o[d.id]=applyPend("teams/"+d.id,d.data())});setTeams(o);setCargado(true);},()=>{}));}catch(e){}
  if(!sheets){try{un.push(db.collection("llaves").onSnapshot(sn=>{const o={};sn.docs.forEach(d=>{o[d.id]=d.data()||{}});setLlaves(o);},()=>{}));}catch(e){}}
  try{un.push(db.collection("grades").onSnapshot(sn=>{const o={};sn.docs.forEach(d=>{o[d.id]=applyPend("grades/"+d.id,d.data())});setGrades(o);},()=>{}));}catch(e){}
  try{un.push(db.collection("sorteo").onSnapshot(sn=>{const o={};sn.docs.forEach(d=>{const v=d.data()||{};if(v.t)o[d.id]=v;});setSorteo(o);},()=>{}));}catch(e){}
  try{un.push(db.collection("pub").onSnapshot(sn=>{const o={};sn.docs.forEach(d=>{o[d.id]=d.data()||{};});setPub(o);},()=>{}));}catch(e){}
  return()=>un.forEach(f=>{try{f()}catch(e){}});},[db]);
 useEffect(()=>{if(!db||!team)return;let u;try{u=db.collection("teams/"+team+"/w").onSnapshot(sn=>{const o={};sn.docs.forEach(d=>{o[d.id]=applyPend("teams/"+team+"/w/"+d.id,d.data())});setW(o);},()=>{});}catch(e){}return()=>{try{u&&u()}catch(e){}};},[db,team]);
 useEffect(()=>{if(!db||!isAdmin)return;const un=[];for(let n=1;n<=NT;n++){try{un.push(db.collection("teams/"+n+"/w").onSnapshot(sn=>{const o={};sn.docs.forEach(d=>{o[d.id]=d.data()||{}});setAllW(prev=>({...prev,[n]:o}));},()=>{}));}catch(e){}}
  return()=>un.forEach(f=>{try{f()}catch(e){}});},[db,isAdmin]);
 const local=(path,p,v)=>{const s=path.split("/");
  if(s[0]==="teams"&&s.length===2)setTeams(prev=>({...prev,[s[1]]:setIn(prev[s[1]]||{},p,v)}));
  else if(s[0]==="grades")setGrades(prev=>({...prev,[s[1]]:setIn(prev[s[1]]||{},p,v)}));
  else if(s[0]==="teams"&&s.length===4)setW(prev=>({...prev,[s[3]]:setIn(prev[s[3]]||{},p,v)}));};
 const write=(path,p,v,delay)=>{local(path,p,v);if(!db)return;
  const key=path+"|"+p.join(".");pend.current.set(key,{path,p,v});clearTimeout(timers.current[key]);
  if(!sched.current.has(key)){sched.current.add(key);AG.set({n:AG.n+1});}
  const run=async()=>{delete timers.current[key];delete fns.current[key];
   const data=nest(p,v);if(/\/w\/\d+$/.test(path)){data._at=Date.now();data._by=nameRef.current||"Docente";}
   const r=db.doc(path);let ok=true;
   try{await r.update(data);}catch(e){try{const sn=await r.get();if(sn.exists)await r.update(data);else await r.set(data);}catch(e2){ok=false;}}
   sched.current.delete(key);AG.set(ok?{n:Math.max(0,AG.n-1),at:Date.now(),err:false}:{n:Math.max(0,AG.n-1),err:true});
   setTimeout(()=>{const c=pend.current.get(key);if(c&&c.v===v)pend.current.delete(key)},1500);};
  fns.current[key]=run;timers.current[key]=setTimeout(run,delay==null?800:delay);};
 /* Guarda de inmediato lo pendiente al salir de un campo, al ocultar la pestaña o al cerrar la página. */
 const flushAll=()=>{Object.keys(fns.current).forEach(k=>{clearTimeout(timers.current[k]);const f=fns.current[k];f&&f();});};
 useEffect(()=>{const vis=()=>{if(document.hidden)flushAll();};
  document.addEventListener("focusout",flushAll);document.addEventListener("visibilitychange",vis);window.addEventListener("pagehide",flushAll);
  return()=>{document.removeEventListener("focusout",flushAll);document.removeEventListener("visibilitychange",vis);window.removeEventListener("pagehide",flushAll);};},[db]);
 const addMem=async(t,names)=>{const add={},t0=Date.now();names.forEach((n,i)=>{add["m"+t0.toString(36)+i+Math.random().toString(36).slice(2,5)]={n,t:t0+i};});
  setTeams(prev=>({...prev,[t]:{...(prev[t]||{}),mem:{...((prev[t]||{}).mem||{}),...add}}}));
  if(db){const r=db.doc("teams/"+t),sn=await r.get();if(sn.exists)await r.update({mem:add});else await r.set({mem:add});}
  const ids={};Object.keys(add).forEach(id=>{ids[add[id].n]=id;});return ids;};
 const [uid,setUid]=useState(null);
 useEffect(()=>{const B=window.PI_BACKEND;if(B.uid)B.uid().then(v=>setUid(v||null)).catch(()=>{});},[]);
 const marcar=(t,id,u)=>write("teams/"+t,["mem",id,"uid"],u,0);
 const nav=v=>{setView(v);window.scrollTo(0,0);};
 const go=(t,id)=>{setTeam(t);setMe(id);nav("equipo");};
 /* Claves de equipo (artefacto y demostración): la docente las ve; si falta alguna, se genera sola. */
 useEffect(()=>{if(!db||sheets||!isAdmin)return;let u;try{u=db.collection("claves").onSnapshot(sn=>{const o={};sn.docs.forEach(d=>{if(d.id!=="maestra")o[d.id]=str((d.data()||{}).k);});setClaves(o);},()=>{});}catch(e){}return()=>{try{u&&u()}catch(e){}};},[db,isAdmin]);
 const regen=async n=>{if(sheets){const r=await B0.nuevaClave(n);if(r&&r.ok)setClaves(p=>({...p,[n]:r.clave}));return r;}
  const k=nuevaClave(),s=nuevaSal(),hh=await huella(normClave(k),s);await db.doc("claves/"+n).set({k,at:Date.now()});await db.doc("llaves/"+n).set({s,h:hh,at:Date.now()});setClaves(p=>({...p,[n]:k}));return {ok:true};};
 const genRef=useRef(false);
 useEffect(()=>{if(!db||sheets||!isAdmin||genRef.current)return;genRef.current=true;(async()=>{for(let n=1;n<=NT;n++){try{const sn=await db.doc("claves/"+n).get(),ll=await db.doc("llaves/"+n).get();if(!sn.exists||!ll.exists)await regen(n);}catch(e){}}})();},[db,isAdmin]);
 /* Si la docente cambió la clave del equipo, la sesión abierta con la anterior se cierra. */
 useEffect(()=>{if(sheets||!cs||cs.rol!=="equipo")return;const v=llaves[cs.t];if(v&&v.h&&v.h!==cs.h)salirSes("La clave de tu equipo cambió. Pide la nueva a tu docente.");},[llaves]);
 function salirSes(m){if(sheets){B0.salir();return;}Object.keys(SS.m).concat((()=>{try{return Object.keys(sessionStorage)}catch(e){return []}})()).forEach(k=>{if(/^pi-(ses|conf-)/.test(k))SS.set(k,null);});
  setCs(null);setTeam(0);setMe("");setMeSes("");setAviso(m||"");setView("inicio");window.scrollTo(0,0);}
 const meOk=!!eqSes&&!!meSes&&members(teams[eqSes]).some(([id])=>id===meSes);
 const confirmado=id=>{if(sheets&&B0.setYo)B0.setYo(id);setMeSes(id);go(eqSes,id);};
 useEffect(()=>{if(isAdmin&&view==="inicio")setView("docente");},[isAdmin]);
 useEffect(()=>{if(eqSes&&meOk&&team!==eqSes)go(eqSes,meSes);},[eqSes,meOk]);
 useEffect(()=>{const b=navRef.current&&navRef.current.querySelector("[aria-current=page]");if(b&&b.scrollIntoView)b.scrollIntoView({block:"nearest",inline:"center"});},[view]);
 const tm=teams[team]||{},myName=nameOf(tm,me),inTeam=!!team;nameRef.current=myName?myName+(rolesAOf(tm,me).length?" · "+rolesAOf(tm,me).join("/"):""):"";
 /* Organizaciones ya elegidas por otros equipos (slug → número de equipo, o -1 si el servidor no dice cuál). */
 const tomadas={};Object.keys(teams).forEach(n=>{if(+n===team)return;const tx=teams[n]||{},al=tx.alts||{};["A","B","C"].forEach(k=>{if(al[k]&&str(al[k].n).trim())tomadas[slug(al[k].n)]=+n;});const e=empOfTeam(tx);if(e)tomadas[slug(e.n)]=+n;});
 Object.keys(sorteo).forEach(sl=>{const v=sorteo[sl];if(v&&v.t!==team&&!(sl in tomadas))tomadas[sl]=typeof v.t==="number"?v.t:-1;});
 Object.keys((pub.orgs&&pub.orgs.n)||{}).forEach(sl=>{if(!(sl in tomadas))tomadas[sl]=-1;});
 const reopen=n=>{write("teams/"+n,["elegida"],"",0);};
 const writeObj=async(path,obj)=>{const sp=path.split("/");if(sp[0]==="teams"&&sp.length===2)setTeams(prev=>({...prev,[sp[1]]:mergeDeep(prev[sp[1]],obj)}));
  if(!db)return;const r=db.doc(path);try{await r.update(obj);}catch(e){const sn=await r.get();if(sn.exists)await r.update(obj);else await r.set(obj);}};
 const holder="h"+Math.random().toString(36).slice(2,9);
 const claim=async(x,t,slot)=>{const id=slug(x.n),rec={t,slot,at:Date.now(),by:myName||"Docente"};
  if(db){const r=db.doc("sorteo/"+id);let acq={acquired:true};try{acq=await r.acquire({holder,ttlMs:4000});}catch(e){}
   if(!acq||!acq.acquired)return false;const sn=await r.get();const d=sn.exists?sn.data():null;if(d&&d.t)return false;await r.set(rec);}
  setSorteo(prev=>({...prev,[id]:rec}));return true;};
 const drawAB=async t=>{if(window.PI_BACKEND.draw)return window.PI_BACKEND.draw(t,POOL.map(x=>({n:x.n,cat:x.cat,tipo:x.tipo,s:x.s})));const tmx=teams[t]||{},nm=tmx.alts||{};
  if(tmx.sorteoAt)return {ok:true,prev:true,a:str(nm.A&&nm.A.n),b:str(nm.B&&nm.B.n)};
  if(db){let acq={acquired:true};try{acq=await db.doc("locks/t"+t).acquire({holder,ttlMs:12000});}catch(e){}
   if(!acq||!acq.acquired)return {ok:false,msg:"Otra persona está sorteando para este equipo en este momento. Esperen unos segundos y revisen el tablero."};
   const sn=await db.doc("teams/"+t).get();const d=sn.exists?sn.data():null;
   if(d&&d.sorteoAt)return {ok:true,prev:true,a:str(d.alts&&d.alts.A&&d.alts.A.n),b:str(d.alts&&d.alts.B&&d.alts.B.n)};}
  const tk=new Set(Object.keys(sorteo));const rnd=a=>a[Math.floor(Math.random()*a.length)];
  const pick=async(slot,avoidCat)=>{let c=POOL.filter(x=>!tk.has(slug(x.n))&&x.cat!==avoidCat);if(!c.length)c=POOL.filter(x=>!tk.has(slug(x.n)));
   while(c.length){const x=rnd(c);if(await claim(x,t,slot))return x;tk.add(slug(x.n));c=c.filter(y=>y!==x);}return null;};
  const a=await pick("A",null);if(!a)return {ok:false,msg:"Ya no quedan organizaciones libres en el sorteo. La docente puede liberar alguna desde su panel."};
  tk.add(slug(a.n));const b=await pick("B",a.cat);
  if(!b){if(db){try{await db.doc("sorteo/"+slug(a.n)).delete();}catch(e){}}setSorteo(prev=>{const o={...prev};delete o[slug(a.n)];return o;});return {ok:false,msg:"Solo quedaba una organización libre. La docente puede liberar alguna desde su panel."};}
  const f=x=>({n:x.n,tipo:x.tipo,giro:x.s,orig:"Sorteo"});
  await writeObj("teams/"+t,{alts:{A:f(a),B:f(b)},sorteoAt:Date.now(),sorteoBy:myName||"Docente"});
  return {ok:true,a:a.n,b:b.n};};
 const CLR={que:"",prob_t:"",contacto:"",cargo:"",medio:"",fecha:"",acepta:"",evid:"",notas:"",acc:"",disp:"",prob:"",imp:"",via:"",ubi:"",fort:"",ries:"",hall:""};
 const reassign=async(t,slot,name,motivo)=>{const tmx=teams[t]||{},al=tmx.alts||{},cur=str(al[slot]&&al[slot].n),oth=str(al[slot==="A"?"B":"A"]&&al[slot==="A"?"B":"A"].n);
  const othCat=(CATALL.find(x=>x.n===oth)||{}).cat;let x=null;
  if(name){x=CATALL.find(y=>y.n===name);if(!x)return {ok:false,msg:"No se encontró esa organización."};
   if(!(await claim(x,t,slot)))return {ok:false,msg:"Esa organización acaba de asignarse a otro equipo. Elige otra."};}
  else{const tk=new Set(Object.keys(sorteo));let c=POOL.filter(y=>!tk.has(slug(y.n))&&y.cat!==othCat&&y.n!==cur);if(!c.length)c=POOL.filter(y=>!tk.has(slug(y.n))&&y.n!==cur);
   while(c.length&&!x){const y=c[Math.floor(Math.random()*c.length)];if(await claim(y,t,slot))x=y;else c=c.filter(z=>z!==y);}
   if(!x)return {ok:false,msg:"No quedan organizaciones libres para resortear."};}
  if(cur&&slug(cur)!==slug(x.n)){if(db){try{await db.doc("sorteo/"+slug(cur)).delete();}catch(e){}}setSorteo(prev=>{const o={...prev};delete o[slug(cur)];return o;});}
  const both=!!oth;const patch={alts:{[slot]:{...CLR,n:x.n,tipo:x.tipo,giro:x.s,orig:"Reajuste"}},ajustes:{["a"+Date.now().toString(36)]:{slot,de:cur,a:x.n,motivo:motivo||"",at:Date.now()}}};
  if(both&&!tmx.sorteoAt){patch.sorteoAt=Date.now();patch.sorteoBy="Docente";}
  if(tmx.elegida===slot)patch.elegida="";
  await writeObj("teams/"+t,patch);return {ok:true,n:x.n};};
 const request=(t,txt)=>writeObj("teams/"+t,{solicitud:{txt,at:Date.now(),by:myName||"",estado:"pendiente"}});
 const attend=t=>writeObj("teams/"+t,{solicitud:{estado:"atendida",atAt:Date.now()}});
 const releaseDraw=async n=>{const ids=Object.entries(sorteo).filter(([,v])=>v&&v.t===n).map(([id])=>id);
  for(const id of ids){if(db){try{await db.doc("sorteo/"+id).delete();}catch(e){}}}
  setSorteo(prev=>{const o={...prev};ids.forEach(id=>delete o[id]);return o;});
  const e={n:"",tipo:"",giro:"",orig:""};await writeObj("teams/"+n,{alts:{A:e,B:e},sorteoAt:""});};
 const sinSes=!isAdmin&&!eqSes,porConfirmar=!isAdmin&&!!eqSes&&!meOk;
 const tabs=sinSes||porConfirmar?[]:[["inicio","Inicio"],["instr","Instrucciones"],["sorteo","Sorteo"],["opciones","Organizaciones"]].concat(inTeam?[["equipo","Mi equipo"],["entregas","Entregas"],...W.map((w,i)=>["s"+i,w.fin?"S"+(i+1)+" · Final":"S"+(i+1)]),["reporte","Reporte"]]:[]).concat(isAdmin?[["docente","Panel docente"],["reportes","Reportes"]]:[]);
 let body;
 /* Bloqueo: la clave abre solo su equipo; cualquier otro equipo queda restringido. */
 const ajeno=!isAdmin&&!!team&&team!==eqSes;
 if(sinSes)body=sheets?h("div",{className:"card"},h("h2",null,"Sin equipo asignado"),h("p",null,"Entra con la clave de tu equipo. Si no la tienes, pídesela a tu docente."),h("button",{className:"btn",onClick:()=>B0.salir()},"Volver al inicio"))
  :h("div",null,aviso?h("p",{className:"pill wa",role:"alert",style:{whiteSpace:"normal",display:"block",padding:"8px 12px",marginBottom:12}},aviso):null,
   h(Acceso,{db,editor,llaves,onSes:x=>{SS.set("pi-ses",x);setAviso("");setCs(x);setMeSes(x.rol==="equipo"?str(SS.get("pi-conf-"+x.t)):"");setView(x.rol==="docente"?"docente":"inicio");}}));
 else if(porConfirmar)body=cargado?h(Confirmar,{t:eqSes,tm:teams[eqSes]||{},teams,addMem,wm:(p,v,d)=>write("teams/"+eqSes,p,v,d),libresSrv:(pub.libres&&pub.libres.n)||[],onOk:confirmado,salir:()=>salirSes("")}):h("p",{className:"mut"},"Cargando tu equipo…");
 else if(ajeno)body=h(Restringido);
 else if(view==="instr")body=h(Instrucciones,{isAdmin});
 else if(view==="opciones")body=h(Opciones,{sorteo,teams,team,isAdmin});
 else if(view==="sorteo")body=h(Sorteo,{teams,sorteo,isAdmin,me,team,drawAB,releaseDraw,reassign,request,attend,wC:(t,f,v,d)=>write("teams/"+t,["alts","C",f],v,d)});
 else if(view==="inicio"||(!inTeam&&!/^(docente|reportes|sorteo|opciones|instr)$/.test(view)))body=h(Start,{teams,go,isAdmin,eqSes,meSes,nav});
 else if(view==="docente"&&isAdmin)body=h(Docente,{teams,allW,grades,sorteo,releaseDraw,reopen,claves,regen,wg2:(n,p,v)=>write("grades/"+n,p,v),openTeam:n=>{setTeam(n);setMe("");nav("entregas");}});
 else if(view==="reportes"&&isAdmin)body=h(Reportes,{teams,allW,grades});
 else if(view==="equipo")body=h(Equipo,{t:team,tm,me,teams,isAdmin,myName,sorteo,drawAB,tomadas,wdocs,addMem,libresSrv:(pub.libres&&pub.libres.n)||[],setView:nav,wm:(p,v,d)=>write("teams/"+team,p,v,d)});
 else if(view==="entregas")body=h(Entregas,{t:team,tm,wdocs,me,isAdmin,setView,wl:(i,p,v)=>write("teams/"+team+"/w/"+i,p,v)});
 else if(view==="reporte")body=h(Reporte,{t:team,tm,wdocs,myName});
 else if(/^s\d$/.test(view)){const wi=+view.slice(1);body=h(Semana,{key:wi,wi,t:team,tm,wd:wdocs[wi]||{},me,myName,isAdmin,setView:nav,gr:grades[team]||{},ww:(p,v,d)=>write("teams/"+team+"/w/"+wi,p,v,d),wg:(p,v)=>write("grades/"+team,p,v)});}
 else body=h(Start,{teams,go,isAdmin,eqSes,meSes,nav});
 return h("div",null,
  h("header",{className:"top"},h("h1",null,"Proyecto Integrador: propuesta de mejora para una organización local"),
   h("p",null,"ADM1401 Introducción a la Empresa · Universidad Anáhuac Cancún · Mtra. Tania Rivera Lozano · Proyecto final (S8): "+fdl(W[W.length-1].d)+" de 2026"),
   inTeam?h("p",{style:{fontWeight:700,marginTop:6}},tLab(team)+(empOfTeam(tm)?" · "+empOfTeam(tm).n:" · organización por registrar")+(myName?" · "+myName+(rolesAOf(tm,me).length?" ("+rolesAOf(tm,me).join("/")+")":""):isAdmin?" · revisión docente":"")):null),
  tabs.length?h("nav",{className:"nv","aria-label":"Secciones",ref:navRef},tabs.map(([k,l])=>h("button",{key:k,"aria-current":view===k?"page":undefined,onClick:()=>nav(k)},l))):null,
  h("main",null,body),
  h(Pie,{isAdmin,eqSes,quien:eqSes&&meOk?nameRef.current:"",salir:()=>salirSes("")}));
}

/* ---------- Pie: estado de guardado y acceso docente ---------- */
function Pie({isAdmin,eqSes,quien,salir}){
 const B=window.PI_BACKEND,[st,setSt]=useState(B.status());
 useEffect(()=>B.onStatus(setSt),[]);
 const L={ok:["ok","✓ Todo guardado"],idle:["","Conectando…"],saving:["wa","Guardando…"],offline:["ko","Sin conexión: se guardará al volver internet"],error:["ko",st.msg||"Revisa la conexión"],local:["","Modo de demostración: se guarda solo en este navegador"]}[st.state]||["",""];
 return h("footer",{className:"pie noprint"},
  h("div",{className:"bar"},
   h("span",{className:"pill "+L[0],role:"status","aria-live":"polite"},L[1]),
   isAdmin?h("span",{className:"row"},h("span",{className:"sm mut"},"🎓 Sesión de PROFESOR"),B.hoja()?h("a",{className:"sm",href:B.hoja(),target:"_blank",rel:"noopener"},"Abrir Hoja de Google"):null,h("button",{className:"btn alt sm",onClick:salir},"Cerrar sesión"))
   :eqSes?h("span",{className:"row"},h("span",{className:"sm mut"},"👥 "+tLab(eqSes)+(quien?" · "+quien:"")),h("button",{className:"btn alt sm",onClick:salir},"Salir")):null),
  eqSes&&!isAdmin?h("p",{className:"sm mut",style:{marginTop:8}},"🔒 Esta sesión solo abre tu equipo. Si usas una computadora compartida, presiona «Salir» al terminar."):null,
  h("p",{className:"sm mut",style:{marginTop:8}},"Proyecto Integrador · ADM1401 Introducción a la Empresa · Escuela Internacional de Negocios · Universidad Anáhuac Cancún"));
}

/* ---------- Respaldo de datos (panel docente) ---------- */
function Respaldo(){
 const B=window.PI_BACKEND,[msg,setMsg]=useState(""),file=useRef(null);
 const exp=async()=>{const o=await B.exportAll();await B.download({filename:"Respaldo_PI_ADM1401_"+hoyISO()+".json",data:JSON.stringify(o,null,1)});setMsg("Respaldo descargado ("+Object.keys(o.docs).length+" registros).");};
 const imp=e=>{const f=e.target.files&&e.target.files[0];if(!f)return;const rd=new FileReader();
  rd.onload=async()=>{try{const o=JSON.parse(rd.result);if(!confirm("Se cargarán "+Object.keys(o.docs||{}).length+" registros y reemplazarán los actuales con el mismo nombre. ¿Continuar?"))return;const n=await B.importAll(o);setMsg(n+" registros restaurados. Recargando…");setTimeout(()=>location.reload(),900);}catch(x){setMsg("El archivo no es un respaldo válido.");}};
  rd.readAsText(f);e.target.value="";};
 return h("div",{className:"card"},h("h2",null,"💾 Respaldo de datos"),
  h("p",{className:"sm"},B.mode==="sheets"?"Todo se guarda en tu Hoja de Google; la hoja «Resumen» se actualiza sola cada hora y hay un respaldo diario. Aquí puedes descargar además una copia completa en tu computadora.":B.mode==="artifact"?"Todo se guarda en la base de datos de este artefacto. Descarga una copia completa en tu computadora cuando quieras.":"Estás en modo de demostración: los datos viven solo en este navegador. Descarga un respaldo antes de borrar el historial."),
  h("div",{className:"row",style:{marginTop:6}},h("button",{className:"btn s sm",onClick:exp},"Descargar respaldo (JSON)"),
   B.mode==="artifact"?null:h("button",{className:"btn alt sm",onClick:()=>file.current&&file.current.click()},"Restaurar desde un respaldo"),
   h("input",{ref:file,type:"file",accept:".json,application/json",hidden:true,onChange:imp})),
  msg?h("p",{className:"sm",role:"status",style:{marginTop:6}},msg):null);
}


/* ---------- Inicio: vista docente (todos los equipos) o tarjeta del equipo ---------- */
function Start({teams,go,isAdmin,eqSes,meSes,nav}){
 if(isAdmin)return h("div",{className:"stack"},
  h("div",{className:"card",style:{borderColor:"var(--or)"}},h("div",{className:"bar"},h("h2",{style:{margin:0}},"Vista docente"),h("button",{className:"btn alt sm",onClick:()=>nav("instr")},"📋 Instrucciones paso a paso")),h("p",{className:"mut"},"Abre cualquier equipo de los dos grupos para revisar su avance, capturar en su nombre o calificar. Cada equipo solo ve el suyo."),
   GRUPOS.map(g=>h("div",{key:g.k},h("h3",{style:{marginTop:10}},g.n),h("div",{className:"grid"},[1,2,3,4,5].map(i=>{const n=g.off+i,tm=teams[n]||{},e=empOfTeam(tm),c=members(tm).length;
    return h("button",{key:n,className:"opt",onClick:()=>go(n,"")},h("b",null,"Equipo "+i),h("span",{className:"mut sm"},(c?c+" integrantes":"Sin integrantes")+(e?" · "+e.n:"")));}))))),
  h(QueSePide));
 const tm=teams[eqSes]||{},e=empOfTeam(tm);
 return h("div",{className:"stack"},
  h("div",{className:"card",style:{borderColor:"var(--or)"}},h("h2",null,"Hola, "+(nameOf(tm,meSes)||"equipo")),
   h("p",{className:"mut"},tLab(eqSes)+(e?" · "+e.n:" · organización por elegir")),
   h("div",{className:"chips"},members(tm).map(([id,x])=>h("span",{key:id},x.n+(rolesAOf(tm,id).length?" · "+rolesAOf(tm,id).join("/"):"")+(id===meSes?" (tú)":"")))),
   h("div",{className:"row",style:{marginTop:8}},h("button",{className:"btn",onClick:()=>go(eqSes,meSes)},"Ir a mi equipo"),h("button",{className:"btn alt",onClick:()=>nav("instr")},"📋 Instrucciones paso a paso")),
   h("p",{className:"sm mut",style:{marginTop:8}},"🔒 Solo tu equipo y la docente ven y editan esta información. Lo que capturen se guarda solo y se actualiza para todo el equipo en unos segundos.")),
  h(QueSePide));
}
/* ---------- Arranque ---------- */
window.PI_BACKEND.init().then(info=>{
 const r=info&&info.roster;
 aplicarCalendario(info&&info.limites);
 if(r)GRUPOS.forEach(g=>{if(Array.isArray(r[g.k]))g.lista=r[g.k].filter(x=>Array.isArray(x)&&(x[0]||x[1]));});
 ReactDOM.createRoot(document.getElementById("root")).render(h(App));
});
