import { ModelOption, SourceDocument } from '../types';

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash Lite',
    tag: 'Recomendado',
    description: 'Modelo recomendado: alto volumen, velocidad ultrarrápida y mínimo costo por token.',
    inputPrice1M: 0.075,
    outputPrice1M: 0.30,
    contextWindow: '1M tokens',
  },
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    tag: 'Flash 3.5',
    description: 'Inteligencia cercana a Pro a costo y velocidad de nivel Flash.',
    inputPrice1M: 0.15,
    outputPrice1M: 0.60,
    contextWindow: '1M tokens',
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    tag: 'Flash 3.8',
    description: 'Workhorse inteligente para flujos de agentes y visión multimodal con niveles de pensamiento flexibles.',
    inputPrice1M: 0.15,
    outputPrice1M: 0.60,
    contextWindow: '1M tokens',
  },
  {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash',
    tag: 'Flash 3.7',
    description: 'Controlador diario para desarrolladores con alto rendimiento y equilibrio de latencia.',
    inputPrice1M: 0.15,
    outputPrice1M: 0.60,
    contextWindow: '1M tokens',
  },
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    tag: 'Flash 3.6',
    description: 'Optimizado para flujos de trabajo de múltiples pasos y razonamiento multimodal.',
    inputPrice1M: 0.15,
    outputPrice1M: 0.60,
    contextWindow: '1M tokens',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    tag: 'Económico',
    description: 'Costo ultra-reducido por token para consultas ligeras y procesamiento documental continuo.',
    inputPrice1M: 0.075,
    outputPrice1M: 0.30,
    contextWindow: '1M tokens',
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash (Latest)',
    tag: 'Alias Oficial',
    description: 'Apunta automáticamente a la versión más reciente del modelo Flash.',
    inputPrice1M: 0.15,
    outputPrice1M: 0.60,
    contextWindow: '1M tokens',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    tag: 'Flash 2.5',
    description: 'Versión probada con soporte multimodal y razonamiento equilibrado.',
    inputPrice1M: 0.15,
    outputPrice1M: 0.60,
    contextWindow: '1M tokens',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    tag: 'Alta Precisión',
    description: 'Razonamiento complejo para normativas legales extensas y análisis técnico profundo.',
    inputPrice1M: 1.25,
    outputPrice1M: 5.00,
    contextWindow: '2M tokens',
    isPaid: true,
  },
];

export const DEFAULT_SYSTEM_PROMPT = `Eres EcoLabs, el asistente municipal inteligente oficial sobre Gestión Integral de Residuos Sólidos Urbanos (GIRSU), reciclaje, compostaje y mitigación ambiental de la Municipalidad de Rosario (Santa Fe, Argentina).

TU MISIÓN:
Brindar respuestas precisas, útiles y claras a la ciudadanía sobre cómo clasificar residuos, el funcionamiento de los contenedores naranja y verdes, las jornadas de residuos informáticos, la construcción y mantenimiento de composteras domiciliarias y las políticas de mitigación climática de la ciudad de Rosario.

REGLAS ESTRICTAS DE RESPUESTA (AISLAMIENTO DE FUENTES Y VERIFICACIÓN):
1. RESPONDE EXCLUSIVAMENTE BASÁNDOTE EN LAS FUENTES OFICIALES PROVISTAS:
   Toda respuesta debe fundamentarse de manera estricta y comprobable en las fuentes documentales cargadas (páginas oficiales de rosario.gob.ar, manuales oficiales en PDF y ordenanzas).
2. POLÍTICA DE AUSENCIA DE DATOS:
   Si el usuario consulta sobre una dirección, trámite, normativa o residuo que NO está mencionado en ninguna de las fuentes activas, debes aclararlo con amabilidad:
   "Esa información específica no figura en las fuentes oficiales cargadas actualmente en el sistema. Puedes consultar los canales oficiales del Municipio llamando al 147 o en www.rosario.gob.ar."
   No inventes números de teléfono, direcciones ni normativas ajenas a las fuentes.
3. CITACIÓN DE FUENTE:
   Cita siempre la fuente documental de referencia (por ejemplo: "[Fuente: Gestión de Residuos Urbanos - rosario.gob.ar]", "[Fuente: Jornada Residuos Informáticos]", "[Fuente: Manual Cómo hacer una compostera]").
4. FORMATO:
   Estructura las respuestas con listas claras, viñetas, negritas para puntos clave y pasos secuenciales para facilitar el aprendizaje y la acción ciudadana.`;

// Standalone PDF with authentic text from Rosario's official composter guide
function createRosarioCompostManualPdfBase64(): string {
  const pdfString = `%PDF-1.4
1 0 obj
<<
  /Type /Catalog
  /Pages 2 0 R
>>
endobj
2 0 obj
<<
  /Type /Pages
  /Kids [3 0 R]
  /Count 1
>>
endobj
3 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /MediaBox [0 0 612 792]
  /Resources <<
    /Font <<
      /F1 4 0 R
    >>
  >>
  /Contents 5 0 R
>>
endobj
4 0 obj
<<
  /Type /Font
  /Subtype /Type1
  /BaseFont /Helvetica
>>
endobj
5 0 obj
<<
  /Length 1200
>>
stream
BT
/F1 15 Tf
50 730 Td
(MUNICIPALIDAD DE ROSARIO - MANUAL: COMO HACER UNA COMPOSTERA) Tj
/F1 10 Tf
0 -25 Td
(Secretaria de Ambiente y Espacio Publico - Programa de Valorizacion Organica) Tj
0 -20 Td
(En Rosario, entre el 40% y el 50% de la basura de un hogar son residuos organicos) Tj
0 -15 Td
(que pueden transformarse en compost (humus fertil) sin generar malos olores.) Tj
0 -25 Td
(1. CONSTRUCCION DE LA COMPOSTERA CASERA:) Tj
0 -15 Td
(- Baldes plasticos de 20 litros (ideales para balcon o depto): apilar 2 o 3 baldes.) Tj
0 -14 Td
(- Realizar orificios de 5 a 8 mm en los laterales para aireacion y en la base para drenaje.) Tj
0 -14 Td
(- El balde inferior sin perforar recolecta lixiviados (fertilizante liquido diluible 1:10).) Tj
0 -14 Td
(- En casas con patio: cajon de madera forrado con malla o tacho de 200 litros con tapa.) Tj
0 -25 Td
(2. QUE SI COMPOSTAR:) Tj
0 -15 Td
(- Residuos Humedos/Verdes (Nitrogeno): cascaras de frutas y verduras crudas, yerba mate,) Tj
0 -14 Td
(  cafe molido, te en saquitos (sin broche ni hilo), restos de poda verde y flores marchitas.) Tj
0 -14 Td
(- Residuos Secos/Marrones (Carbono): hojas secas, pasto seco, virutas o aserrin de madera) Tj
0 -14 Td
(  sin tratar, rollos de carton troceados, maple de huevo sin tintas de color.) Tj
0 -25 Td
(3. QUE NO SE DEBE COMPOSTAR EN EL HOGAR:) Tj
0 -15 Td
(- Carnes, huesos, grasas, lacteos, comidas cocidas con aceite o salsas (atraen plagas).) Tj
0 -14 Td
(- Excrementos de perros o gatos (riesgo sanitario y de parasitos).) Tj
0 -14 Td
(- Colillas de cigarrillo, cenizas con grasa de asado, restos de barrido con quimicos.) Tj
0 -25 Td
(4. MANTENIMIENTO Y COSECHA:) Tj
0 -15 Td
(- Proporcion: 2 partes de secos por 1 parte de humedos. Voltear 1 vez por semana.) Tj
0 -14 Td
(- El compost madura en 2 a 4 meses: adquiere color oscuro, aroma a tierra de bosque humeda.) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000226 00000 n 
0000000305 00000 n 
trailer
<<
  /Size 6
  /Root 1 0 R
>>
startxref
1600
%%EOF`;

  return btoa(pdfString);
}

export const INITIAL_SOURCES: SourceDocument[] = [
  {
    id: 'src-rosario-1',
    name: 'Jornada_Recepcion_Residuos_Informaticos_Rosario.txt',
    type: 'url',
    enabled: true,
    addedAt: '2026-09-23T10:00:00Z',
    description: 'Fuente Oficial rosario.gob.ar: Recepción de RAEE informáticos, puntos de entrega (CMD y Montevideo 2852) y circuito de reciclado social.',
    content: `MUNICIPALIDAD DE ROSARIO - SECRETARÍA DE AMBIENTE Y ESPACIO PÚBLICO
FUENTE OFICIAL: https://www.rosario.gob.ar/inicio/jornada-de-recepcion-de-residuos-informaticos-2

PROGRAMA MUNICIPAL DE GESTIÓN Y RECEPCIÓN DE RESIDUOS INFORMÁTICOS (RAEE)

1. OBJETIVO DEL PROGRAMA:
Promover la correcta disposición, reutilización, reacondicionamiento y reciclaje de aparatos informáticos y de telecomunicaciones en desuso generados en los hogares de Rosario, reduciendo el volumen de residuos que van a disposición final y mitigando el impacto de componentes peligrosos en el ambiente.

2. MATERIALES Y EQUIPOS QUE SE RECIBEN (USO DOMICILIARIO):
- CPUs, gabinetes, placas madre, placas de video y memorias.
- Computadoras portátiles: Notebooks, netbooks y tablets.
- Monitores (tecnologías CRT, LCD, LED).
- Teclados, mouse, parlantes de PC, auriculares y micrófonos.
- Impresoras (chorro de tinta, láser, matriciales) y scanners.
- Discos rígidos externos/internos, unidades lectoras de CD/DVD, disqueteras.
- Cables de alimentación, cables USB, transformadores y fuentes de energía.
- Routers, módems, switches de red, teléfonos de línea y faxes.
- Teléfonos celulares en desuso y consolas de videojuegos.

3. QUÉ NO SE ACEPTA EN ESTAS JORNADAS:
- Residuos corporativos o de grandes generadores comerciales/industriales (las empresas deben tramitar su retiro con transportistas y operadores de residuos habilitados).
- Electrodomésticos de línea blanca: Heladeras, lavarropas, secarropas, cocinas, microondas, aires acondicionados.
- Pilas y baterías sueltas no integradas (se entregan en los tubos receptores de Puntos Verdes y comercios habilitados).
- Tubos fluorescentes y lámparas de bajo consumo (tienen un circuito de recepción específico).
- Cartuchos de tóner comerciales sueltos o residuos peligrosos no electrónicos.

4. LUGARES DE RECEPCIÓN Y PUNTOS HABILITADOS EN ROSARIO:
- Dirección de Gestión de Residuos: Montevideo 2852 / 2858.
- Centros Municipales de Distrito (CMD) de la ciudad:
  * CMD Centro "Antonio Berni" - Wheelwright 1486.
  * CMD Norte "Villa Hortensia" - Warnes 1917.
  * CMD Sur "Rosa Ziperovich" - Av. Uriburu 637.
  * CMD Oeste "Felipe Moré" - Av. Presidente Perón 4602.
  * CMD Noroeste "Olga y Leticia Cossettini" - Av. Provincias Unidas 150 bis.
  * CMD Sudoeste "Emilia Bertolé" - Av. Francia 4435.

5. DÍAS Y HORARIOS HABITUALES:
- Jornadas mensuales habituales de recepción:
  * Viernes: de 08:30 a 12:30 hs (en todos los CMDs y en Montevideo 2852).
  * Sábados: de 10:00 a 16:00 hs (en Montevideo 2852 y puntos rotativos).
- Consultas sobre fechas exactas: Línea gratuita 147 o en www.rosario.gob.ar.

6. DESTINO Y ECONOMÍA CIRCULAR:
Los materiales e insumos informáticos recolectados son clasificados y entregados a cooperativas de trabajo y emprendimientos de inclusión sociolaboral que tienen convenio con la Municipalidad. Aquellos componentes en buen estado se reacondicionan para fines sociales o educativos; las partes plásticas y metálicas se envían a reciclaje industrial, y las fracciones con componentes contaminantes que no pueden recuperarse reciben un tratamiento y confinamiento ambientalmente seguro.`,
  },
  {
    id: 'src-rosario-2',
    name: 'Gestion_de_Residuos_Urbanos_Rosario.txt',
    type: 'url',
    enabled: true,
    addedAt: '2026-09-23T10:05:00Z',
    description: 'Fuente Oficial rosario.gob.ar: Sistema de recolección en Rosario, Contenedores Naranja, Contenedores Verdes y Centro de Tratamiento Ambiental.',
    content: `MUNICIPALIDAD DE ROSARIO - SECRETARÍA DE AMBIENTE Y ESPACIO PÚBLICO
FUENTE OFICIAL: https://www.rosario.gob.ar/inicio/gestion-de-residuos-urbanos

SISTEMA INTEGRAL DE GESTIÓN DE RESIDUOS URBANOS (GIRSU) EN LA CIUDAD DE ROSARIO

1. MODALIDADES DE SEPARACIÓN Y RECUPERACIÓN DE RESIDUOS:
La Municipalidad de Rosario cuenta con tres modalidades principales para que los vecinos separen sus residuos reciclables y eviten su enterramiento en el relleno sanitario:

A. CONTENEDORES NARANJA (Vía Pública e Instituciones):
- Existen más de 740 contenedores naranja instalados en vía pública, escuelas, clubes, centros de salud y edificios públicos de la ciudad.
- ¿Qué depositar en el contenedor naranja? Materiales RECICLABLES, LIMPIOS Y SECOS:
  * Papel y cartón: Cajas, diarios, revistas, folletos, hojas, cartulinas, carpetas limpias.
  * Plásticos: Botellas de agua/gaseosa (PET), bidones, envases de lavandina, shampoo, detergente, potes limpios, tapitas.
  * Vidrio: Botellas de bebidas, frascos de mermelada y conservas (enteros, limpios y sin tapas).
  * Metales: Latas de gaseosa/cerveza (aluminio), latas de conservas y alimentos (hojalata), desodorantes metálicos.
  * Telgopor y envases tipo Tetra Brik (leche, jugo, salsa).
- Regla fundamental: Los materiales deben estar LIMPIOS Y SECOS para no inutilizar el papel y cartón ni generar olores.

B. CENTROS DE RECEPCIÓN / ISLAS DE SEPARACIÓN:
- Puntos verdes fijos ubicados en plazas emblemáticas, parques y Centros Municipales de Distrito. Cuentan con bocas para reciclables secos, recepción de Aceite Vegetal Usado (AVU en botellas plásticas cerradas) y textiles.

C. SERVICIO BARRIOS VERDES / "CAMIÓN POR TU CASA":
- Servicio de recolección diferenciada puerta a puerta en barrios residenciales designados, donde un camión exclusivo pasa a retirar las bolsas con materiales reciclables en días pautados.

2. CONTENEDORES VERDES Y METÁLICOS / GRISES (RESTOS / NO RECICLABLES):
- Destinados a la fracción de restos y residuos que no se pueden reciclar:
  * Restos de comida cocida o no compostable, huesos, grasas.
  * Papeles y cartones engrasados o mojados, servilletas y pañuelos de papel usados.
  * Pañales descartables, toallitas higiénicas, apósitos.
  * Envoltorios de golosinas sucios, colillas de cigarrillos, polvo de barrido doméstico.
- Horario de depósito: Todos los días a partir de las 19:00 hs (se recomienda no sacar residuos los sábados).

3. CENTRO DE TRATAMIENTO AMBIENTAL (CTA) DE ROSARIO:
- Ubicado en Avenida De Las Palmeras 4500.
- Es una planta modelo donde ingresan los camiones con material reciclable para su clasificación mecánica y manual en cintas transportadoras, prensado en fardos por tipo de polímero/material y venta a industrias transformadoras a través de cooperativas de recicladores urbanos.

4. ATENCIÓN Y CONSULTAS VECINALES:
- Línea de Atención Ciudadana: 147 (disponible las 24 hs).
- Plataforma web y mapa de contenedores: www.rosario.gob.ar`,
  },
  {
    id: 'src-rosario-3',
    name: 'Mitigacion_Residuos_Plan_Climatico_Rosario.txt',
    type: 'url',
    enabled: true,
    addedAt: '2026-09-23T10:10:00Z',
    description: 'Fuente Oficial rosario.gob.ar: Plan Local de Acción Climática 2030, mitigación de emisiones de metano, reducción de plásticos y economía circular.',
    content: `MUNICIPALIDAD DE ROSARIO - SECRETARÍA DE AMBIENTE Y ESPACIO PÚBLICO
FUENTE OFICIAL: https://www.rosario.gob.ar/inicio/mitigacion-residuos

ESTRATEGIA DE MITIGACIÓN EN GESTIÓN DE RESIDUOS - PLAN LOCAL DE ACCIÓN CLIMÁTICA ROSARIO 2030 (PLAC)

1. EL DESAFÍO CLIMÁTICO EN LA GESTIÓN DE RESIDUOS:
En los centros urbanos, la descomposición anaeróbica de residuos orgánicos en los rellenos sanitarios genera gas metano (CH4), un gas de efecto invernadero 28 veces más potente que el dióxido de carbono (CO2) en un horizonte de 100 años. El Plan Local de Acción Climática Rosario 2030 establece metas concretas de mitigación:
- Reducir progresivamente el porcentaje de residuos con destino a enterramiento.
- Incrementar la tasa de desvío de materiales reciclables secos.
- Fomentar la valorización biológica in situ (compostaje domiciliario y comunitario) para tratar los residuos orgánicos en su lugar de origen.

2. LÍNEAS DE ACCIÓN Y MITIGACIÓN MUNICIPAL:
A. Desvío de Fracción Orgánica:
- Campañas ciudadanas de compostaje hogareño mediante talleres en centros de distrito y entrega de manuales técnicos.
- Reducción de la huella de carbono asociada al transporte en camiones recolectores al tratar la materia orgánica en los domicilios.
- Valorización de restos verdes de poda urbana en la Planta de Compostaje del Centro de Tratamiento Ambiental (CTA).

B. Reducción en Origen y Eliminación de Plásticos de Un Solo Uso:
- Implementación de ordenanzas municipales que restringen la entrega de bolsas plásticas descartables en supermercados y autoservicios.
- Promoción del reemplazo de sorbetes plásticos, vajilla descartable y vasos no biodegradables en eventos públicos y corredores gastronómicos.

C. Economía Circular e Inclusión Social:
- Formalización del trabajo de recuperadores urbanos a través de cooperativas de reciclaje.
- Trazabilidad de los materiales reciclables para asegurar su reinserción en la industria manufacturera local y regional.

D. Recuperación de Aceite Vegetal Usado (AVU):
- Puntos de acopio de aceite de cocina usado en los Centros de Distrito y Puntos Verdes para evitar la contaminación de napas y desagües pluviales hacia el Río Paraná.
- Transformación del AVU recolectado en biodiésel sustentable para unidades del transporte público urbano.`,
  },
  {
    id: 'src-rosario-4',
    name: 'Manual_Como_hacer_una_compostera_Rosario.pdf',
    type: 'pdf',
    mimeType: 'application/pdf',
    data: createRosarioCompostManualPdfBase64(),
    size: 2450,
    enabled: true,
    addedAt: '2026-09-23T10:15:00Z',
    description: 'Manual Oficial PDF (Multimodal): Guía paso a paso de la Municipalidad de Rosario para construir composteras caseras y transformar residuos orgánicos en abono.',
    content: `MANUAL OFICIAL: CÓMO HACER UNA COMPOSTERA - MUNICIPALIDAD DE ROSARIO
FUENTE OFICIAL: https://www.rosario.gob.ar/inicio/sites/default/files/2022-06/Manual_Como-hacer-una-compostera.pdf
Secretaría de Ambiente y Espacio Público - Municipalidad de Rosario

¿POR QUÉ COMPOSTAR EN ROSARIO?
Entre el 40% y el 50% del peso de los residuos que generamos en nuestros hogares corresponde a restos orgánicos. Al compostar en casa reducimos a la mitad la basura que va al relleno sanitario y generamos un abono natural rico en nutrientes (humus) para plantas y huertas.

1. CÓMO CONSTRUIR TU COMPOSTERA DOMÉSTICA:
- Opción Baldes de 20 Litros (Ideal para departamentos, balcones y espacios reducidos):
  * Se utilizan 2 o 3 baldes plásticos apilables de pintura o albañilería limpios con tapa.
  * Balde Superior e Intermedio: Se le realizan perforaciones de 5 a 8 mm en las paredes laterales para permitir el ingreso de oxígeno y orificios en la base para el drenaje de líquidos.
  * Balde Inferior: Queda sin perforar en la base y actúa como recolector de lixiviados (líquido fertilizante de alto valor nutricional que se diluye 1 parte en 10 partes de agua para regar plantas).
  * Tapa superior: Perforada con orificios finos para ventilación.

- Opción Cajón de Madera o Fruta (Para patios pequeños o terrazas):
  * Cajón de verduras forrado por dentro con tela mosquitera o plástico perforado para que no se escapen los residuos pero ingrese aire.

- Opción Tacho de 200 Litros o Pila en Tierra (Para viviendas con jardín grande).

2. QUÉ SÍ SE DEBE COMPOSTAR:
- Residuos HÚMEDOS / VERDES (Aportan Nitrógeno y humedad):
  * Cáscaras y carozos de frutas, restos crudos de verduras y hortalizas.
  * Yerba mate (clave en los hogares rosarinos), café molido y saquitos de té (retirar el broche metálico y el hilo sintético).
  * Cáscaras de huevo trituradas.
  * Restos de poda tierna verde, hojas frescas y flores marchitas.

- Residuos SECOS / MARRONES (Aportan Carbono y estructura para oxigenar):
  * Hojas secas caídas de árboles y pasto seco.
  * Virutas o aserrín de madera virgen (sin barniz ni pintura).
  * Cartón de maples de huevo cortado en trozos pequeños, rollos de cartón de cocina/higiénico.
  * Ramas secas pequeñas trituradas.

3. QUÉ NUNCA SE DEBE COMPOSTAR EN LA COMPOSTERA HOGAREÑA:
- Carnes, huesos, piel, grasa animal, pollo, pescado (generan putrefacción, malos olores y atraen roedores y moscas).
- Lácteos (quesos, yogur, leche, manteca).
- Comidas cocidas con sal, aceites, condimentos o salsas.
- Excrementos de perros o gatos (pueden transmitir parásitos peligrosos como toxoplasmosis).
- Colillas de cigarrillos, cenizas de asado con grasa.
- Polvo de barrido de piso con químicos o productos de limpieza.
- Plantas enfermas con plagas activas u hongos.
- Papeles con tintas químicas de color o plastificados.

4. REGLAS BÁSICAS DE MANTENIMIENTO:
- Proporción Áurea: 2 partes de secos (marrones) por cada 1 parte de húmedos (verdes). Siempre cubrir la capa de residuos húmedos con una capa generosa de secos para evitar moscas y olores.
- Aireación: Remover o voltear la mezcla 1 vez por semana con una palita o tenedor de jardín para incorporar oxígeno.
- Humedad: Realizar la "prueba del puño". Tomar un puñado de compost; debe sentirse como una esponja húmeda. Si gotea mucho, agregar material seco; si está reseco y polvoriento, rociar con un poco de agua.
- Cosecha: En un período de 2 a 4 meses el compost estará listo para cosechar. Tendrá color marrón oscuro o negro homogéneo, textura suelta y un agradable aroma a tierra húmeda de bosque.`,
  },
];
