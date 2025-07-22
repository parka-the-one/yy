










// Archivo de script

//---------------------------------------------------//
// 1. Variables de estado global y datos:
//---------------------------------------------------//

// Inicializar con estructura por defecto
// Utilizar la función getDefaultAppState para asegurar la estructura
let appState = getDefaultAppState();



// Declarar la variable para almacenar el ID del evento que se está editando, con alcance global
let editingEventId = null;

// Variable para almacenar el ancho medido de referencia de la pantalla disponible en la cabecera.
// Este valor representa el ancho máximo que los gráficos ajustados pueden ocupar.
let anchoPantallaReferencia = 0;

// Objeto para almacenar la configuración, estado y dimensiones calculadas para cada gráfico.
// La clave es el ID del canvas ('chart1', 'chart2', 'chart3').
// Integra las constantes de altura fija y espacio X contributivo para cada gráfico.
let chartsConfig = {
    'chart1': {
        chartType: '7days', // Tipo de gráfico asociado (usado en lógica de cálculo ideal)
        fixedHeightPx: 500, // Constante: Altura visual fija deseada para el gráfico de 7 días.
        minSpaceX: 30, // Constante: Espacio base por 'día' para el cálculo ideal (Scatter).
        idealWidthPx: 0, // Variable: Ancho ideal calculado (se determinará dinámicamente).
        isIdealScaleActive: false // Variable Booleana: true si se muestra en escala ideal, false en ajustada.
    },
    'chart2': {
        chartType: '30days',
        fixedHeightPx: 500, // Constante: Altura visual fija deseada para el gráfico de 30 días.
        minSpaceX: 15, // Constante: Espacio base por 'barra' para el cálculo ideal (Barras Mensuales).
        idealWidthPx: 0,
        isIdealScaleActive: false
    },
    'chart3': {
        chartType: 'yearly', // Usado en lógica de cálculo ideal
        fixedHeightPx: 500, // Constante: Altura visual fija deseada para el gráfico anual.
        minSpaceX: 10, // Constante: Espacio base por 'barra' para el cálculo ideal (Barras Semanales).
        idealWidthPx: 0,
        isIdealScaleActive: false
    }
};

// Variable global para almacenar las instancias de Chart.js creadas.
// La clave es el ID del canvas ('chart1', 'chart2', 'chart3'). Se limpia al destruir gráficos.
let chartInstances = {};

// Variable global para almacenar temporalmente los resultados de prepare...Datasets.
// Permite acceder a los datos (datasets y labels) fuera del handler inicial. Se limpia al destruir gráficos.
let chartDataResults = {
    'chart1': { datasets: [], labels: [] },
    'chart2': { datasets: [], labels: [] },
    'chart3': { datasets: [], labels: [] }
};


// --- Gestión Centralizada de Event Listeners ---
// Objeto para almacenar los listeners por pantalla/componente
const appEventListeners = {

    // Estructura: 'nombrePantalla': [ { selector: '', eventType: '', handler: function() {} }, ... ]
    'personalization-screen': [
        
    // Listener para el botón "Respaldo de datos" en la pantalla de Personalización
        {
            selector: '#personalization-screen #backup-button', 
            eventType: 'click'
            , handler: function () {
                console.log('Botón Respaldo de datos presionado en personalization-screen.');
                // 1. Generar los datos formateados para respaldo
                const backupData = generateBackupData(appState);
                // 2. Descargar los datos generados como un archivo TSV
                // Obtener la fecha actual y formatearla
                const today = new Date();
                const dateString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
                const filename = `respaldo_eventos_contados_${dateString}.tsv`;
                downloadData(backupData, filename); // Llamar a downloadData
            }
        },
        
        
        
    // Listener para el botón "BORRON"
        {
            selector: '#personalization-screen #BORRON', // Selector más específico
            eventType: 'click'
            , handler: function () {
                console.log('Botón BORRON presionado.');
                // Ocultar BORRON y mostrar confirmar-BORRON y cancelar-BORRON
                document.getElementById('BORRON')
                    .style.display = 'none';
                document.getElementById('confirmar-BORRON')
                    .style.display = 'block';
                document.getElementById('cancelar-BORRON')
                    .style.display = 'block'; // Hacer visible cancelar-BORRON
                console.log('Botones de confirmación de borrado ahora visibles.');
            }
        },



    // Listener para el botón "confirmar-BORRON"
        {
            selector: '#personalization-screen #confirmar-BORRON', // Selector más específico
            eventType: 'click'
            , handler: function () {
                console.log('Botón confirmar-BORRON presionado.');
                // Ocultar confirmar-BORRON y cancelar-BORRON, mostrar BORRON
                document.getElementById('confirmar-BORRON')
                    .style.display = 'none';
                document.getElementById('cancelar-BORRON')
                    .style.display = 'none'; // Ocultar cancelar-BORRON
                document.getElementById('BORRON')
                    .style.display = 'block'; // Mostrar BORRON
                console.log('Botones de borrado restablecidos.');
                // Ejecutar la función de borrado y recarga (esta función ya existía)
                resetAppStateAndClearStorage();
                console.log('Función resetAppStateAndClearStorage ejecutada.');
            }
        },



    // Listener para el botón "cancelar-BORRON" (Nuevo handler para este listener)
        {
            selector: '#personalization-screen #cancelar-BORRON', // Selector más específico
            eventType: 'click'
            , handler: function () {
                console.log('Botón cancelar-BORRON presionado.');
                // Ocultar confirmar-BORRON y cancelar-BORRON, mostrar BORRON
                document.getElementById('confirmar-BORRON')
                    .style.display = 'none';
                document.getElementById('cancelar-BORRON')
                    .style.display = 'none';
                document.getElementById('BORRON')
                    .style.display = 'block';
                console.log('Botones de borrado restablecidos.');
                // No se ejecuta resetAppStateAndClearStorage aquí
            }
        },



    // Listener para el botón "save-preferences-button"
        {
            selector: '#personalization-screen #save-preferences-button', // Selector más específico
            eventType: 'click'
            , handler: savePreferences 
        },



    // Listener para el botón "back-button" en la pantalla de personalización
        {
            selector: '#personalization-screen #back-button', // Selector más específico
            eventType: 'click'
            , handler: function () {
                console.log('Botón back-button en Personalización presionado.');
                // Restablecer la visibilidad de los botones de borrado al salir
                const borronButton = document.getElementById('BORRON');
                const confirmarBorronButton = document.getElementById('confirmar-BORRON');
                const cancelarBorronButton = document.getElementById('cancelar-BORRON');
                if (borronButton) borronButton.style.display = 'block';
                if (confirmarBorronButton) confirmarBorronButton.style.display = 'none';
                if (cancelarBorronButton) cancelarBorronButton.style.display = 'none';
                console.log('Estado de botones de borrado restablecido al salir de Personalización.');
               
               
               
                // Remover los listeners de personalization-screen ANTES de navegar.
                eventManager.removeScreenListeners('personalization-screen');
                console.log('Listeners de personalization-screen removidos al salir.');

                // Navegar de vuelta a la pantalla principal
                mostrarPantalla('main-screen');
            }
        }

    ],





    'main-screen': [

    // Listener para el botón "Crear"
        {
            selector: '#main-screen #create-button', // Selector más específico
            eventType: 'click'
            , handler: function () {
                console.log('Botón Crear presionado en main-screen.'); // Log para verificar
                // Limpiar los campos de entrada al crear un nuevo evento
                const eventNameInput = document.getElementById('event-name-input');
                const eventColorInput = document.getElementById('event-color-input');
                if (eventNameInput) eventNameInput.value = '';
 //               if (eventColorInput) eventColorInput.value = '#cbbbef'; // Establecer color por defecto
                mostrarPantalla('edit-screen', 'crear'); // Navegar a la pantalla de edición en modo 'crear'
            }
        },
        


    // Listener para el botón "Editar"
        {
            selector: '#main-screen #edit-button', // Selector más específico
            eventType: 'click'
            , handler: function () {
                console.log('Botón Editar presionado en main-screen.'); // Log para verificar
                // Encontrar el evento seleccionado
                const selectedEvent = appState.events.find(event => event.seleccionado);
                if (selectedEvent) {
                    editingEventId = selectedEvent.id; // Almacenar el ID del evento que se está editando
                    // Cargar los datos del evento en los inputs de la pantalla de edición
                    const eventNameInput = document.getElementById('event-name-input');
                    const eventColorInput = document.getElementById('event-color-input');
                    if (eventNameInput) eventNameInput.value = selectedEvent.nombre;
                    if (eventColorInput) eventColorInput.value = selectedEvent.color;
                    mostrarPantalla('edit-screen', 'editar'); // Navegar a la pantalla de edición en modo 'editar'
                } else {
                    console.warn('Botón Editar presionado pero ningún evento seleccionado.');
                    // Opcional: Mostrar un mensaje al usuario
                }
            }
        },
        

























// Listener para el botón "Gráficos"
{
            selector: '#main-screen #charts-button', // Selector específico del botón de Gráficos
            eventType: 'click',
           

handler: async function () { // Mantener como async para el uso de awaits
    console.log('Botón Gráficos presionado en main-screen. Iniciando handler con cascada rAF solapada.');

    const selectedEvents = appState.events.filter(event => event.seleccionado);
    const chartsScreen = document.getElementById('charts-screen'); // Obtener referencia a la pantalla de gráficos
    const loadingPopup = document.getElementById('loading-popup'); // Obtener referencia al popup de carga
    const chartsContainer = document.getElementById('charts-container'); // Contenedor principal de gráficos/mensajes

    // --- Manejo del caso SIN eventos seleccionados ---
    if (selectedEvents.length === 0) {
        console.log('No hay eventos seleccionados. Mostrando mensajes UX.');
        // Asegurar que el popup de carga esté oculto (por si acaso)
        if (loadingPopup) loadingPopup.style.display = 'none';

        // Mostrar la pantalla de gráficos principal
        await mostrarPantalla('charts-screen'); // AWAIT restituido muy util
        console.log('Llamada a mostrarPantalla(\'charts-screen\') completada (caso sin eventos).');

        // Lógica que estaba dentro del rAF, ahora justo después de mostrarPantalla
        console.log('Configurando charts-screen para mostrar mensajes UX (directamente después de mostrarPantalla).');
        if (chartsContainer) {
            chartsContainer.querySelectorAll('.canvas-wrapper').forEach(el => el.style.display = 'none');
            chartsContainer.querySelectorAll('.chart-message-container').forEach(el => el.style.display = 'flex'); // Usar flex para centrado
            console.log('Contenedores de canvas ocultos, mensajes mostrados (directamente después de mostrarPantalla).');
        } else {
             console.warn('Contenedor charts-container no encontrado (directamente después de mostrarPantalla).');
        }
        eventManager.loadScreenListeners('charts-screen', null);
        console.log('Listeners de charts-screen cargados (directamente después de mostrarPantalla).');

        console.log('Handler del botón Gráficos finalizado (caso sin eventos).');
        return; // Salir del handler
    }

    // --- Solo si hay eventos seleccionados (flujo principal) ---

    console.log(`Eventos seleccionados: ${selectedEvents.length}. Iniciando flujo principal.`);

    // 1. Mostrar el popup de carga inmediatamente
    if (loadingPopup) {
        loadingPopup.style.display = 'flex'; // Usar flex para centrado
        loadingPopup.dataset.startTime = Date.now(); // Guardar tiempo de inicio
        console.log('Popup de carga visible.');
    }

    // 2. Medición del ancho de referencia en la PANTALLA PRINCIPAL
    const mainScreenTopSection = document.querySelector('#main-screen .top-section');
    if (mainScreenTopSection) {
        anchoPantallaReferencia = Math.floor(mainScreenTopSection.clientWidth);
        console.log(`Medición del ancho de referencia en main-screen: ${anchoPantallaReferencia}px`);
    } else {
        console.warn('Contenedor top-section en main-screen no encontrado. Usando ancho de ventana como fallback.');
        anchoPantallaReferencia = Math.floor(window.innerWidth); // Fallback
        console.log(`Usando ancho de ventana como fallback: ${anchoPantallaReferencia}px`);
    }

    // 3. Calcular propiedades de tamaño (ideal/ajustado) y estado para cada gráfico
    console.log(`Calculando propiedades de tamaño para ${selectedEvents.length} eventos seleccionados.`);
    const chartIds = ['chart1', 'chart2', 'chart3'];
    const chartElements = chartIds.map(id => ({
        id: id,
        canvas: document.getElementById(id),
        wrapper: document.getElementById(id) ? document.getElementById(id).closest('.canvas-wrapper') : null,
        config: chartsConfig[id]
    })).filter(item => item.canvas && item.wrapper && item.config && typeof item.config.fixedHeightPx === 'number' && typeof item.config.minSpaceX === 'number'); // Filtrar elementos válidos


    chartElements.forEach(item => {
         preparadorCanvas(item.id, item.config.chartType, selectedEvents.length); // Esta función actualiza chartsConfig[item.id]
         console.log(`Propiedades calculadas para ${item.id}: Ideal=${chartsConfig[item.id].idealWidthPx}, Ajustado=${anchoPantallaReferencia}, isIdealScaleActive=${chartsConfig[item.id].isIdealScaleActive}`);
    });
    console.log('Cálculo de propiedades de tamaño completado.');

    // 4. Preparar los datasets para los gráficos seleccionados
    chartDataResults['chart1'] = prepareSevenDaysDatasets(selectedEvents);
    chartDataResults['chart2'] = prepareThirtyDaysDatasets(selectedEvents);
    chartDataResults['chart3'] = prepareYearlyDatasets(selectedEvents);
    console.log('Datasets preparados para los 3 gráficos.');

    // 5. Llamar a mostrarPantalla para la transición visual básica
    await mostrarPantalla('charts-screen');
    console.log('Llamada a mostrarPantalla(\'charts-screen\') completada.');

    // 6. Iniciar la cascada de requestAnimationFrame con solapamiento
    console.log('Iniciando cascada de requestAnimationFrame con solapamiento.');

    // Frame 1: Ocultar mensajes, mostrar contenedores de canvas
    requestAnimationFrame(() => {
        console.log('rAF Frame 1: Ocultando mensajes, mostrando contenedores de canvas.');
        if (chartsContainer) {
            chartsContainer.querySelectorAll('.chart-message-container').forEach(el => el.style.display = 'none');
            chartsContainer.querySelectorAll('.canvas-wrapper').forEach(el => el.style.display = 'block'); // Usar flex si aplica
            console.log('rAF Frame 1: Divs de mensaje ocultos, contenedores de canvas mostrados.');
        } else {
            console.warn('rAF Frame 1: Contenedor charts-container no encontrado.');
        }

        // Frame 2: Destruir todos los gráficos Chart.js existentes
        requestAnimationFrame(() => {
            console.log('rAF Frame 2: Destruyendo gráficos Chart.js existentes.');
            destroyAllCharts(); // Esta función también resetea atributos/style de canvas/contenedores a 0/''
            console.log('rAF Frame 2: Gráficos Chart.js destruidos y canvas reseteados.');

            // Frame 3: Aplicar tamaño visual al contenedor del primer canvas (chart1)
            requestAnimationFrame(() => {
                console.log('rAF Frame 3: Aplicando tamaño visual a chart1.');
                const item1 = chartElements.find(item => item.id === 'chart1');
                 if (item1) {
                     const targetWidthPx1 = item1.config.isIdealScaleActive ? item1.config.idealWidthPx : anchoPantallaReferencia;
                     item1.wrapper.style.width = `${targetWidthPx1}px`;
                     item1.wrapper.style.height = `${item1.config.fixedHeightPx}px`;
                     console.log(`rAF Frame 3: [${item1.id}] Tamaño visual contenedor: ${targetWidthPx1}x${item1.config.fixedHeightPx}.`);
                 } else {
                     console.warn('rAF Frame 3: chart1 no encontrado o inválido.');
                 }


                // Frame 4: Frame de seguridad para chart1
                requestAnimationFrame(() => {
                    console.log('rAF Frame 4: Frame de seguridad para chart1.');

                    // Frame 5: Aplicar tamaño visual a chart2 + Ajustar resolución interna de chart1
                    requestAnimationFrame(() => {
                        console.log('rAF Frame 5: Aplicando tamaño visual a chart2 Y Ajustando resolución interna de chart1.');

                        // Aplicar tamaño visual a chart2
                        const item2 = chartElements.find(item => item.id === 'chart2');
                         if (item2) {
                            const targetWidthPx2 = item2.config.isIdealScaleActive ? item2.config.idealWidthPx : anchoPantallaReferencia;
                            item2.wrapper.style.width = `${targetWidthPx2}px`;
                            item2.wrapper.style.height = `${item2.config.fixedHeightPx}px`;
                            console.log(`rAF Frame 5: [${item2.id}] Tamaño visual contenedor: ${targetWidthPx2}x${item2.config.fixedHeightPx}.`);
                        } else {
                            console.warn('rAF Frame 5: chart2 no encontrado o inválido.');
                        }


                        // Ajustar resolución interna de chart1
                        const item1 = chartElements.find(item => item.id === 'chart1');
                         if (item1) {
                             const dpr = window.devicePixelRatio || 1;
                             const currentVisibleWidth1 = item1.wrapper.clientWidth;
                             const currentVisibleHeight1 = item1.wrapper.clientHeight;
                             const ctx = item1.canvas.getContext('2d');

                            if (currentVisibleWidth1 > 0 && currentVisibleHeight1 > 0 && ctx) {
                                item1.canvas.width = Math.floor(currentVisibleWidth1 * dpr);
                                item1.canvas.height = Math.floor(currentVisibleHeight1 * dpr);
                                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                                console.log(`rAF Frame 5: [${item1.id}] Resolución interna (${item1.canvas.width}x${item1.canvas.height}) y escala (${dpr}) aplicadas.`);
                            } else {
                                 console.warn(`rAF Frame 5: [${item1.id}] Dimensiones visibles cero/inválidas (${currentVisibleWidth1}x${currentVisibleHeight1}) o contexto no obtenido. No se ajustó res. interna/escala.`);
                                 // Fallback: intentar ajustar atributos width/height aunque las dimensiones visibles sean cero
                                 const targetWidthPx1 = item1.config.isIdealScaleActive ? item1.config.idealWidthPx : anchoPantallaReferencia;
                                 item1.canvas.width = Math.floor(targetWidthPx1 * dpr);
                                 item1.canvas.height = Math.floor(item1.config.fixedHeightPx * dpr);
                                 console.warn(`rAF Frame 5: [${item1.id}] Fallback: ajustados atributos width/height a ${item1.canvas.width}x${item1.canvas.height}.`);
                            }
                         } // Fin if item1


                        // Frame 6: Frame de seguridad para chart2
                        requestAnimationFrame(() => {
                             console.log('rAF Frame 6: Frame de seguridad para chart2.');

                            // Frame 7: Aplicar tamaño visual a chart3 + Ajustar resolución interna de chart2
                            requestAnimationFrame(() => {
                                console.log('rAF Frame 7: Aplicando tamaño visual a chart3 Y Ajustando resolución interna de chart2.');

                                // Aplicar tamaño visual a chart3
                                const item3 = chartElements.find(item => item.id === 'chart3');
                                 if (item3) {
                                    const targetWidthPx3 = item3.config.isIdealScaleActive ? item3.config.idealWidthPx : anchoPantallaReferencia;
                                    item3.wrapper.style.width = `${targetWidthPx3}px`;
                                    item3.wrapper.style.height = `${item3.config.fixedHeightPx}px`;
                                    console.log(`rAF Frame 7: [${item3.id}] Tamaño visual contenedor: ${targetWidthPx3}x${item3.config.fixedHeightPx}.`);
                                } else {
                                    console.warn('rAF Frame 7: chart3 no encontrado o inválido.');
                                }

                                // Ajustar resolución interna de chart2
                                const item2 = chartElements.find(item => item.id === 'chart2');
                                 if (item2) {
                                    const dpr = window.devicePixelRatio || 1;
                                    const currentVisibleWidth2 = item2.wrapper.clientWidth;
                                    const currentVisibleHeight2 = item2.wrapper.clientHeight;
                                     const ctx = item2.canvas.getContext('2d');


                                     if (currentVisibleWidth2 > 0 && currentVisibleHeight2 > 0 && ctx) {
                                         item2.canvas.width = Math.floor(currentVisibleWidth2 * dpr);
                                         item2.canvas.height = Math.floor(currentVisibleHeight2 * dpr);
                                         ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                                         console.log(`rAF Frame 7: [${item2.id}] Resolución interna (${item2.canvas.width}x${item2.canvas.height}) y escala (${dpr}) aplicadas.`);
                                     } else {
                                          console.warn(`rAF Frame 7: [${item2.id}] Dimensiones visibles cero/inválidas (${currentVisibleWidth2}x${currentVisibleHeight2}) o contexto no obtenido. No se ajustó res. interna/escala.`);
                                           // Fallback: intentar ajustar atributos width/height
                                          const targetWidthPx2 = item2.config.isIdealScaleActive ? item2.config.idealWidthPx : anchoPantallaReferencia;
                                           item2.canvas.width = Math.floor(targetWidthPx2 * dpr);
                                           item2.canvas.height = Math.floor(item2.config.fixedHeightPx * dpr);
                                           console.warn(`rAF Frame 7: [${item2.id}] Fallback: ajustados atributos width/height a ${item2.canvas.width}x${item2.canvas.height}.`);
                                     }
                                 } // Fin if item2


                                // Frame 8: Frame de seguridad para chart3
                                requestAnimationFrame(() => {
                                     console.log('rAF Frame 8: Frame de seguridad para chart3.');

                                    // Frame 9: Ajustar resolución interna de chart3
                                    requestAnimationFrame(() => {
                                         console.log('rAF Frame 9: Ajustando resolución interna de chart3.');
                                        const item3 = chartElements.find(item => item.id === 'chart3');

                                         if (item3) {
                                             const dpr = window.devicePixelRatio || 1;
                                             const currentVisibleWidth3 = item3.wrapper.clientWidth;
                                             const currentVisibleHeight3 = item3.wrapper.clientHeight;
                                             const ctx = item3.canvas.getContext('2d');


                                             if (currentVisibleWidth3 > 0 && currentVisibleHeight3 > 0 && ctx) {
                                                 item3.canvas.width = Math.floor(currentVisibleWidth3 * dpr);
                                                 item3.canvas.height = Math.floor(currentVisibleHeight3 * dpr);
                                                 ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                                                 console.log(`rAF Frame 9: [${item3.id}] Resolución interna (${item3.canvas.width}x${item3.canvas.height}) y escala (${dpr}) aplicadas.`);
                                             } else {
                                                  console.warn(`rAF Frame 9: [${item3.id}] Dimensiones visibles cero/inválidas (${currentVisibleWidth3}x${currentVisibleHeight3}) o contexto no obtenido. No se ajustó res. interna/escala.`);
                                                   // Fallback: intentar ajustar atributos width/height
                                                  const targetWidthPx3 = item3.config.isIdealScaleActive ? item3.config.idealWidthPx : anchoPantallaReferencia;
                                                   item3.canvas.width = Math.floor(targetWidthPx3 * dpr);
                                                   item3.canvas.height = Math.floor(item3.config.fixedHeightPx * dpr);
                                                   console.warn(`rAF Frame 9: [${item3.id}] Fallback: ajustados atributos width/height a ${item3.canvas.width}x${item3.canvas.height}.`);
                                             }
                                         } // Fin if item3




// Frame 10: Medir y loggear ANTES de renderizar los gráficos Chart.js (y Frame de seguridad)
                                        requestAnimationFrame(() => {
                                            console.log('rAF Frame 10: Midiendo y loggeando tamaño de canvas/contenedor ANTES de renderizar Chart.js.');

                                            // Medir y loggear para chart1
                                            const item1 = chartElements.find(item => item.id === 'chart1');
                                            if (item1) {
                                                const finalWrapperWidth1 = item1.wrapper.clientWidth;
                                                const finalWrapperHeight1 = item1.wrapper.clientHeight;
                                                const finalCanvasWidth1 = item1.canvas.width; // Atributos internos
                                                const finalCanvasHeight1 = item1.canvas.height; // Atributos internos

                                                // *** EXPERIMENTAL: Forzar el estilo visual del canvas ***
                                                const visualWidth1 = item1.config.isIdealScaleActive ? item1.config.idealWidthPx : anchoPantallaReferencia;
                                                const visualHeight1 = item1.config.fixedHeightPx;
                                                item1.canvas.style.width = `${visualWidth1}px`;
                                                item1.canvas.style.height = `${visualHeight1}px`;
                                                // *** Fin EXPERIMENTAL ***


                                                const finalCanvasVisibleWidth1 = item1.canvas.clientWidth; // Tamaño visible renderizado
                                                const finalCanvasVisibleHeight1 = item1.canvas.clientHeight; // Tamaño visible renderizado


                                                console.log(`[${item1.id}] --- Medición Final (Antes de renderAllCharts) ---`);
                                                console.log(`[${item1.id}] Contenedor (.canvas-wrapper) - clientWidth: ${finalWrapperWidth1}px, clientHeight: ${finalWrapperHeight1}px`);
                                                console.log(`[${item1.id}] Canvas - width (interno): ${finalCanvasWidth1}, height (interno): ${finalCanvasHeight1}`);
                                                console.log(`[${item1.id}] Canvas - clientWidth (visible DESPUÉS de forzar style): ${finalCanvasVisibleWidth1}px, clientHeight (visible DESPUÉS de forzar style): ${finalCanvasVisibleHeight1}px`);
                                                 // Opcional: Loggear el DPR de nuevo aquí para confirmar que no ha cambiado
                                                console.log(`[${item1.id}] Device Pixel Ratio (medición final): ${window.devicePixelRatio || 1}`);
                                                console.log(`[${item1.id}] -------------------------------------------------`);
                                            }

                                            // Medir y loggear para chart2
                                            const item2 = chartElements.find(item => item.id === 'chart2');
                                            if (item2) {
                                                const finalWrapperWidth2 = item2.wrapper.clientWidth;
                                                const finalWrapperHeight2 = item2.wrapper.clientHeight;
                                                const finalCanvasWidth2 = item2.canvas.width;
                                                const finalCanvasHeight2 = item2.canvas.height;

                                                // *** EXPERIMENTAL: Forzar el estilo visual del canvas ***
                                                const visualWidth2 = item2.config.isIdealScaleActive ? item2.config.idealWidthPx : anchoPantallaReferencia;
                                                const visualHeight2 = item2.config.fixedHeightPx;
                                                item2.canvas.style.width = `${visualWidth2}px`;
                                                item2.canvas.style.height = `${visualHeight2}px`;
                                                // *** Fin EXPERIMENTAL ***


                                                const finalCanvasVisibleWidth2 = item2.canvas.clientWidth;
                                                const finalCanvasVisibleHeight2 = item2.canvas.clientHeight;

                                                console.log(`[${item2.id}] --- Medición Final (Antes de renderAllCharts) ---`);
                                                console.log(`[${item2.id}] Contenedor (.canvas-wrapper) - clientWidth: ${finalWrapperWidth2}px, clientHeight: ${finalWrapperHeight2}px`);
                                                console.log(`[${item2.id}] Canvas - width (interno): ${finalCanvasWidth2}, height (interno): ${finalCanvasHeight2}`);
                                                console.log(`[${item2.id}] Canvas - clientWidth (visible DESPUÉS de forzar style): ${finalCanvasVisibleWidth2}px, clientHeight (visible DESPUÉS de forzar style): ${finalCanvasVisibleHeight2}px`);
                                                console.log(`[${item2.id}] Device Pixel Ratio (medición final): ${window.devicePixelRatio || 1}`);
                                                console.log(`[${item2.id}] -------------------------------------------------`);
                                            }

                                            // Medir y loggear para chart3
                                            const item3 = chartElements.find(item => item.id === 'chart3');
                                            if (item3) {
                                                const finalWrapperWidth3 = item3.wrapper.clientWidth;
                                                const finalWrapperHeight3 = item3.wrapper.clientHeight;
                                                const finalCanvasWidth3 = item3.canvas.width;
                                                const finalCanvasHeight3 = item3.canvas.height;

                                                // *** EXPERIMENTAL: Forzar el estilo visual del canvas ***
                                                const visualWidth3 = item3.config.isIdealScaleActive ? item3.config.idealWidthPx : anchoPantallaReferencia;
                                                const visualHeight3 = item3.config.fixedHeightPx;
                                                item3.canvas.style.width = `${visualWidth3}px`;
                                                item3.canvas.style.height = `${visualHeight3}px`;
                                                // *** Fin EXPERIMENTAL ***


                                                const finalCanvasVisibleWidth3 = item3.canvas.clientWidth;
                                                const finalCanvasVisibleHeight3 = item3.canvas.clientHeight;

                                                console.log(`[${item3.id}] --- Medición Final (Antes de renderAllCharts) ---`);
                                                console.log(`[${item3.id}] Contenedor (.canvas-wrapper) - clientWidth: ${finalWrapperWidth3}px, clientHeight: ${finalWrapperHeight3}px`);
                                                console.log(`[${item3.id}] Canvas - width (interno): ${finalCanvasWidth3}, height (interno): ${finalCanvasHeight3}`);
                                                console.log(`[${item3.id}] Canvas - clientWidth (visible DESPUÉS de forzar style): ${finalCanvasVisibleWidth3}px, clientHeight (visible DESPUÉS de forzar style): ${finalCanvasVisibleHeight3}px`);
                                                console.log(`[${item3.id}] Device Pixel Ratio (medición final): ${window.devicePixelRatio || 1}`);
                                                console.log(`[${item3.id}] -------------------------------------------------`);
                                            }


                                         
                                            


                                            // Frame 11: Renderizar los gráficos Chart.js
                                            requestAnimationFrame(() => {
                                                console.log('rAF Frame 11: Renderizando gráficos Chart.js.');
                                                renderAllCharts(
                                                    chartDataResults['chart1'].datasets, chartDataResults['chart1'].labels,
                                                    chartDataResults['chart2'].datasets, chartDataResults['chart2'].labels,
                                                    chartDataResults['chart3'].datasets, chartDataResults['chart3'].labels
                                                );
                                                console.log('rAF Frame Renderizado: Llamada a renderAllCharts completada.');

                                                // --- Lógica final fuera de la cascada rAF (gestión de popup y listeners) ---
                                                const minDisplayTime = 750; // Tiempo mínimo en ms
                                                const startTime = parseFloat(loadingPopup.dataset.startTime || Date.now());
                                                const elapsed = Date.now() - startTime;
                                                const remainingTime = minDisplayTime - elapsed;

                                                setTimeout(() => {
                                                    if (loadingPopup) {
                                                        loadingPopup.style.display = 'none';
                                                        console.log(`Popup de carga oculto (después de esperar ${Math.max(0, remainingTime)}ms).`);
                                                    }

                                                    console.log('Cargando listeners específicos de charts-screen (después de ocultar popup).');
                                                    eventManager.loadScreenListeners('charts-screen', null);
                                                    console.log('Listeners de charts-screen cargados.');
                                                    console.log('Handler del botón Gráficos finalizado.');

                                                }, Math.max(0, remainingTime));
                                                // --- Fin Lógica final ---

                                            }); // Fin rAF Renderizado
                                        }); // Fin rAF Seguridad Fusionado
                                    }); // Fin rAF Ajuste Resolución chart3
                                }); // Fin rAF Seguridad chart3
                            }); // Fin rAF Aplicar Size chart3 + Ajustar Res chart2
                        }); // Fin rAF Seguridad chart2
                    }); // Fin rAF Aplicar Size chart2 + Ajustar Res chart1
                }); // Fin rAF Seguridad chart1
            }); // Fin rAF Aplicar Size chart1
        }); // Fin rAF Destrucción
    }); // Fin rAF Mostrar Contenedores

    console.log('Saliendo del handler del botón Gráficos (cascada rAF programada).');

}, // Fin del handler del botón Gráficos


        }, // Fin del objeto listener para charts-button





























    // Listener para el botón "Deshacer"
        {
            selector: '#main-screen #undo-button', // Selector más específico
            eventType: 'click'
            , handler: undoLastIncrement // La función undoLastIncrement ya existe
        },

    // NUEVO: Listener para el botón de preferencias en la pantalla principal
    {
        selector: '#main-screen #preferences-button', // Selector corregido a main-screen
        eventType: 'click',
        handler: function () {
            console.log('Botón Personalización presionado en main-screen.'); // Log para verificar
            mostrarPantalla('personalization-screen'); // Navegar a la pantalla de personalización
        }
    },


    // Listener para el botón "Deseleccionar Todo"
        {
            selector: '#main-screen #unselect-all-button', // Selector más específico
            eventType: 'click'
            , handler: unselectAllEvents // La función unselectAllEvents ya existe
        },
        

     
        



















// Listener delegado para clics en la lista de eventos (#events-list)
       {
            selector: '#events-list', // Contenedor padre donde delegamos el listener
            eventType: 'click', // Escuchamos clics en el contenedor
            handler: function(event) {
                // El evento.target es el elemento exacto que fue clicado.
                // Usamos .closest() para ver si el clic ocurrió dentro de un botón de incremento.
                const incrementButton = event.target.closest('.increment-button');
                if (incrementButton) {
                    console.log('Clic detectado en un botón de incremento a través de delegación.');
                    // Si el clic fue en un botón de incremento, encontramos el contenedor del evento padre
                    const eventContainer = incrementButton.closest('.event-container');
                    if (eventContainer) {
                        const eventId = eventContainer.dataset.eventId; // Obtenemos el ID del evento del atributo data-\
                        console.log('Evento ID asociado al clic de incremento:', eventId);
                        // --- Lógica del handler de incremento ---\
                        const eventToUpdate = appState.events.find(event => event.id === eventId);
                        if (eventToUpdate) {
                            const currentTimestamp = Date.now(); // Obtener el timestamp actual
                            console.log(`Incremento registrado con timestamp: ${currentTimestamp} para el evento: ${eventToUpdate.nombre}`);


                            // Paso 1 (Limpieza Diaria): Limpiar entradas de días antiguos en dailyTimestamps (últimos 7 días)
                            eventToUpdate.dailyTimestamps = cleanDailyArrays(eventToUpdate);
                            console.log(`Limpieza de dailyTimestamps completada para ${eventToUpdate.nombre}.`);

                            // Paso 2 (Crear Arrays Faltantes): Asegurar entradas para los últimos 7 días en dailyTimestamps
                            ensureLast7DaysArrays(eventToUpdate);
                            console.log(`Aseguradas entradas de los últimos 7 días en dailyTimestamps para ${eventToUpdate.nombre}.`);

                            // Paso 3 (Guardar Timestamp Crudo): Añadir el timestamp actual al array del día correspondiente en dailyTimestamps
                            const startOfToday = startOfDay(currentTimestamp); // Obtener el inicio del día actual
                            // Encontrar la entrada para hoy en dailyTimestamps (ya debería existir gracias a ensureLast7DaysArrays)
                            let todayEntry = eventToUpdate.dailyTimestamps.find(entry => entry.date === startOfToday);

                             // Validar si la entrada de hoy se encontró y su array de timestamps es válido
                             if (todayEntry && Array.isArray(todayEntry.timestamps)) {
                                 todayEntry.timestamps.push(currentTimestamp); // Añadir el timestamp crudo
                                 console.log(`Timestamp ${currentTimestamp} añadido a dailyTimestamps para hoy (${new Date(startOfToday).toLocaleDateString()}) en el evento ${eventToUpdate.nombre}.`);
                             } else {
                                 console.error(`ERROR: No se encontró la entrada de hoy en dailyTimestamps o timestamps no es un array para ${eventToUpdate.nombre}. El timestamp crudo no se pudo añadir.`);
                                 // Considerar cómo manejar este error - quizás crear la entrada aquí si no existió?
                                 // Por ahora, solo registramos el error. ensureLast7DaysArrays debería prevenir esto.
                             }


                            // Paso 4 (Registro en actionHistory): Registrar la acción en actionHistory
                            // Es importante que el actionHistory registre el timestamp EXACTO del incremento.
                            appState.actionHistory.push({
                                type: 'increment',
                                timestamp: currentTimestamp, // Usar el timestamp exacto del clic
                                eventId: eventToUpdate.id
                            });
                            console.log('Acción de incremento registrada en actionHistory.');

                            // Paso 5 (Incrementar Contador Histórico): Incrementar el contador histórico total.
                            eventToUpdate.contador_historico++;
                            console.log(`Contador histórico de ${eventToUpdate.nombre} incrementado a ${eventToUpdate.contador_historico}`);

                            // --- NUEVA LÓGICA DE AGREGACIÓN DIRECTA ---

                            // Paso 6 (Agregación a ultimos_30_dias): Actualizar el recuento del día actual en ultimos_30_dias.
                            // Buscar la entrada del día actual en ultimos_30_dias.
                            // NOTA: La fecha usada en ultimos_30_dias es el inicio del día.
                            const thirtyDaysEntry = eventToUpdate.ultimos_30_dias.find(entry => entry.date === startOfToday);

                            if (thirtyDaysEntry) {
                                // Si la entrada del día actual ya existe, incrementar su count.
                                thirtyDaysEntry.count = (thirtyDaysEntry.count || 0) + 1; // Asegurar que count es un número antes de sumar
                                console.log(`Recuento diario para hoy (${new Date(startOfToday).toLocaleDateString()}) en ultimos_30_dias incrementado a ${thirtyDaysEntry.count} para ${eventToUpdate.nombre}.`);
                            } else {
                                // Si no existe una entrada para hoy (primer incremento del día para este evento), crearla.
                                const newThirtyDaysEntry = { date: startOfToday, count: 1 };
                                eventToUpdate.ultimos_30_dias.push(newThirtyDaysEntry);
                                // Opcional: Ordenar ultimos_30_dias por fecha después de añadir si el orden importa antes de limpiar
                                // eventToUpdate.ultimos_30_dias.sort((a, b) => a.date - b.date);
                                console.log(`Nueva entrada creada en ultimos_30_dias para hoy (${new Date(startOfToday).toLocaleDateString()}) con count 1 para ${eventToUpdate.nombre}.`);
                            }

                            // Limpiar ultimos_30_dias para mantener solo los últimos 30 días (esta función ordena y recorta)
                            eventToUpdate.ultimos_30_dias = cleanDailyDataByCount(eventToUpdate.ultimos_30_dias, 30);
                            console.log(`ultimos_30_dias limpiado (últimos 30 días) para ${eventToUpdate.nombre}.`);


                            // Paso 7 (Agregación a ultimo_año): Actualizar el recuento de la semana actual en ultimo_año.
                            // Calcular la información de la semana para el timestamp del incremento.
                            const weekInfo = getWeekNumber(new Date(currentTimestamp));
                            const startOfCurrentWeek = startOfweek(currentTimestamp); // Timestamp del inicio de la semana


                            // Buscar la entrada de la semana actual en ultimo_año usando year y week.
                            const yearlyEntry = eventToUpdate.ultimo_año.find(entry =>
                                entry.year === weekInfo.year && entry.week === weekInfo.week
                            );

                            if (yearlyEntry) {
                                // Si la entrada de la semana actual ya existe, incrementar su count.
                                yearlyEntry.count = (yearlyEntry.count || 0) + 1; // Asegurar que count es un número antes de sumar
                                console.log(`Recuento semanal para sem ${weekInfo.week}, ${weekInfo.year} en ultimo_año incrementado a ${yearlyEntry.count} para ${eventToUpdate.nombre}.`);
                            } else {
                                // Si no existe una entrada para esta semana, crearla.
                                const newYearlyEntry = {
                                    year: weekInfo.year,
                                    week: weekInfo.week,
                                    date: startOfCurrentWeek, // Usamos el inicio de la semana como fecha de referencia
                                    count: 1
                                };
                                eventToUpdate.ultimo_año.push(newYearlyEntry);
                                // Opcional: Ordenar ultimo_año por fecha después de añadir si el orden importa antes de limpiar
                                // eventToUpdate.ultimo_año.sort((a, b) => (a.date || 0) - (b.date || 0));
                                console.log(`Nueva entrada creada en ultimo_año para sem ${weekInfo.week}, ${weekInfo.year} con count 1 para ${eventToUpdate.nombre}.`);
                            }

                            // Limpiar ultimo_año para mantener solo las últimas 53 semanas (esta función ordena y recorta)
                            eventToUpdate.ultimo_año = cleanWeeklyDataByCount(eventToUpdate.ultimo_año); // cleanWeeklyDataByCount ya usa el límite de 53
                            console.log(`ultimo_año limpiado (últimas 53 semanas) para ${eventToUpdate.nombre}.`);

                            // --- FIN NUEVA LÓGICA DE AGREGACIÓN DIRECTA ---


                            // Paso 8 (Actualizar Contadores Diarios en UI): Llama a updateEventDailyData
                            // Esto actualiza los contadores visuales de "Hoy" y "Ayer" en la lista de eventos.
                            // updateEventDailyData lee de dailyTimestamps, que ya actualizamos en el Paso 3.
                            updateEventDailyData(eventToUpdate);
                            console.log(`updateEventDailyData llamada para ${eventToUpdate.nombre}.`);


                            // Paso 9 (Guardar Estado): Guardar el estado completo de la aplicación.
                            saveAppState(appState);
                            console.log('Estado de la aplicación guardado después de incremento.');

                            // Paso 10 (Renderizar): Renderizar la lista para actualizar visualmente (orden, contadores Hoy/Ayer).
                            renderEventsList();
                            console.log('Lista de eventos renderizada después de incremento.');

                        } else {
                            console.error('Evento no encontrado en appState para el ID:', eventId);
                        }
                        // --- Fin Lógica del handler de incremento ---
                    } else {
                        console.warn('No se encontró el contenedor de evento padre para el botón de incremento clicado.');
                    }
                }
          }
       },






















    // Listener delegado para cambios en los checkboxes de la lista de eventos (#events-list)
        {
            selector: '#events-list', // Contenedor padre donde delegamos el listener
            eventType: 'change', // Escuchamos cambios en el contenedor (para checkboxes)
            handler: function (event) {
                // El evento.target es el elemento exacto que cambió.
                // Usamos .classList.contains para ver si el cambio ocurrió en un checkbox de selección.
                const selectCheckbox = event.target; // El evento target es el elemento que cambió
                // Verificar si el elemento que cambió es un checkbox con la clase 'select-checkbox'
                if (selectCheckbox && selectCheckbox.type === 'checkbox' && selectCheckbox.classList.contains('select-checkbox')) {
                    console.log('Cambio detectado en un checkbox de selección a través de delegación.');
                    // Si el cambio fue en un checkbox, encontramos el contenedor del evento padre
                    const eventContainer = selectCheckbox.closest('.event-container');
                    if (eventContainer) {
                        const eventId = eventContainer.dataset.eventId; // Obtenemos el ID del evento
                        console.log('Evento ID asociado al cambio del checkbox:', eventId);
                        // --- Lógica del handler del checkbox (replicada de createEventElement) ---
                        const eventToSelect = appState.events.find(event => event.id === eventId);
                        if (eventToSelect) {
                            // 1. Actualizar la propiedad 'seleccionado' del evento
                            eventToSelect.seleccionado = selectCheckbox.checked; // Usar el estado 'checked' del checkbox
                            console.log(`Evento ${eventToSelect.nombre} seleccionado: ${eventToSelect.seleccionado} (via delegación).`);
                            // 2. Actualizar el estado de los botones "Editar" y "Deseleccionar Maestro"
                            updateEditButtonState();
                            updateUnselectAllButtonState();
                            console.log('Estado de botones Editar y Deseleccionar actualizado (via delegación).');
                            // 3. Guardar el estado completo
                            saveAppState(appState);
                            console.log('Estado de la aplicación guardado después de cambio de checkbox (via delegación).');
                            // No es necesario renderizar toda la lista aquí.
                            // renderEventsList(); // <-- No llamar aquí.
                        } else {
                            console.error('Evento no encontrado en appState para el ID (via delegación de checkbox):', eventId);
                        }
                        // --- Fin Lógica del handler del checkbox ---
                    } else {
                        console.warn('No se encontró el contenedor de evento padre para el checkbox cambiado.');
                    }
                }
            }
        },
        


// Listener para el botón que abre el pop-up de información 
        {
            selector: '#main-screen #info-button', // Selector más específico (si solo está en main-screen)
            eventType: 'click'
            , handler: function () {
                console.log('Botón Info presionado en main-screen.');
                const infoPopup = document.getElementById('info-popup');
                if (infoPopup) {
                    infoPopup.style.display = 'flex'; // Mostrar el pop-up
                    console.log('Pop-up de información visible.');
                }
            }
        },

// Listener para el botón que cierra el pop-up de información
        {
            // MODIFICACIÓN: Selector más general para encontrar el botón dentro del popup,
            // sin restringirlo a estar dentro de #main-screen.
            selector: '#info-popup #close-popup-button', // Selector más específico dentro del pop-up global
            eventType: 'click'
            , handler: function () {
                console.log('Botón Cerrar Pop-up presionado.');
                const infoPopup = document.getElementById('info-popup');
                if (infoPopup) {
                    infoPopup.style.display = 'none'; // Ocultar el pop-up
                    console.log('Pop-up de información oculto.');
                }
                 // Opcional: Remover listeners específicos del popup aquí si los tuviera y no se gestionan globalmente
                 eventManager.removeScreenListeners('info-popup'); // Asumiendo que definimos listeners para 'info-popup'
                 console.log('Listeners de info-popup removidos al cerrar.');
            }
        }


        
    ], 





    'edit-screen': [

// Listener para el botón "Crear Evento" (en modo \'crear\')
        {
            selector: '#edit-screen #create-event-button', // Selector más específico
            eventType: 'click'
            , handler: function () {
                console.log('Botón Crear evento presionado en edit-screen.');
                const editScreenElement = document.getElementById('edit-screen');
                const currentMode = editScreenElement ? editScreenElement.dataset.mode : null;
                if (currentMode === 'crear') {
                    const eventNameInput = document.getElementById('event-name-input');
                    const eventColorInput = document.getElementById('event-color-input');
                    const eventName = eventNameInput ? eventNameInput.value.trim() : '';
                    const eventColor = eventColorInput ? eventColorInput.value : '#5100ff'; //si al crear un evento el color no es valido, usa este
                    if (!eventName) {
                        console.warn('Nombre del evento está vacío. No se puede crear el evento.');
                        return;
                    }
                    // 2. Generar un ID único (usar timestamp como ID simple)
                    const uniqueId = Date.now() // Este es el timestamp de creación
                        .toString();

                    // --- NUEVO: Calcular fechas de referencia para inicialización ---
                    const creationTimestamp = parseInt(uniqueId, 10); // Convertir el ID a número/timestamp
                    const startOfToday = startOfDay(creationTimestamp); // Inicio del día de creación
                    const weekInfo = getWeekNumber(new Date(creationTimestamp)); // Info de la semana de creación
                    const startOfCurrentWeek = startOfweek(creationTimestamp); // Inicio de la semana de creación
                    console.log(`Evento creado con timestamp: ${creationTimestamp}`);
                    console.log(`Inicio del día de creación: ${startOfToday} (${new Date(startOfToday).toLocaleDateString()})`);
                    console.log(`Semana de creación: ${weekInfo.year}-W${weekInfo.week}, Inicio: ${startOfCurrentWeek} (${new Date(startOfCurrentWeek).toLocaleDateString()})`);
                    // --- Fin NUEVO: Calcular fechas de referencia ---


                    // 3. Crear el nuevo objeto de evento
                    const newEvent = {
                        id: uniqueId
                        , nombre: eventName
                        , color: eventColor
                        , contador_historico: 0
                        , seleccionado: false
                        , dailyTimestamps: [] // Inicializado como array vacío (luego llenado por ensureLast7DaysArrays)
                        // --- NUEVO: Inicializar ultimos_30_dias con la entrada del día actual ---
                        , ultimos_30_dias: [{ date: startOfToday, count: 0 }]
                        // --- Fin NUEVO ---
                        // --- NUEVO: Inicializar ultimo_año con la entrada de la semana actual ---
                        , ultimo_año: [{ year: weekInfo.year, week: weekInfo.week, date: startOfCurrentWeek, count: 0 }]
                        // --- Fin NUEVO ---
                    };

                    // --- Mantener: Inicializar dailyTimestamps con las 7 entradas vacías ---
                    // Esta llamada asegura que dailyTimestamps tenga la estructura de los últimos 7 días.
                    console.log('Asegurando estructura de dailyTimestamps para el nuevo evento.');
                    ensureLast7DaysArrays(newEvent);
                    console.log('dailyTimestamps después de ensureLast7DaysArrays:', newEvent.dailyTimestamps);
                    // --- Fin Mantener ---


                    // 4. Añadir el nuevo objeto al array de eventos en appState
                    if (!Array.isArray(appState.events)) {
                        appState.events = [];
                    }
                    appState.events.push(newEvent);
                    console.log('Nuevo evento añadido a appState:', newEvent);
                    // 5. Guardar el estado actualizado
                    saveAppState(appState);
                    console.log('Estado de la aplicación guardado después de añadir evento.');
                    // 6. Actualizar la lista visible de eventos
                    renderEventsList();
                    console.log('Lista de eventos renderizada después de añadir evento.');
                    // 7. Limpiar los campos de entrada en la pantalla de edición
                    if (eventNameInput) eventNameInput.value = '';
     //               if (eventColorInput) eventColorInput.value = '#5100ff'; //cambia el color del input una vez el evento es creado (esto nunca se ve)
                    console.log('Campos de edición limpiados.');
     //quiero que los eventos en la pantalla principal se des seleccionen cuando creo un evento
                     unselectAllEvents();    

                // Remover listeners de edit-screen ANTES de navegar
                eventManager.removeScreenListeners('edit-screen');
                console.log('Listeners de edit-screen removidos al salir (crear).');


                    // 8. Volver a la pantalla principal
                    mostrarPantalla('main-screen');
                    console.log('Navegando de vuelta a main-screen después de crear.');
                } else {
                    console.warn('Botón Crear evento presionado pero la pantalla no está en modo \"crear\".');
                }
            }
        },








    // Listener para el botón "Guardar Evento" (en modo 'editar')
        {
            selector: '#edit-screen #edit-event-button', // Selector más específico
            eventType: 'click'
            , handler: function () {
                console.log('Botón Guardar evento presionado en edit-screen.');
                const editScreenElement = document.getElementById('edit-screen');
                const currentMode = editScreenElement ? editScreenElement.dataset.mode : null;
                if (currentMode === 'editar') { // Verificar explícitamente el modo
                    // Asegurarse de que tenemos un ID de evento a editar almacenado
                    if (editingEventId) {
                        // 1. Encontrar el evento en appState.events usando editingEventId
                        const eventToEdit = appState.events.find(event => event.id === editingEventId);
                        if (eventToEdit) {
                            // 2. Obtener el valor del input de nombre y color
                            const eventNameInput = document.getElementById('event-name-input');
                            const eventColorInput = document.getElementById('event-color-input');
                            const eventName = eventNameInput ? eventNameInput.value.trim() : eventToEdit.nombre; // Usar nombre existente si input no encontrado
                            const eventColor = eventColorInput ? eventColorInput.value : eventToEdit.color; // Usar color existente si input no encontrado
                            if (!eventName) {
                                console.warn('Nombre del evento está vacío. No se puede guardar con nombre vacío.');
                                // Opcional: Mostrar un mensaje al usuario
                                return; // Salir de la función si el nombre está vacío
                            }
                            // 3. Actualizar nombre y color del evento
                            eventToEdit.nombre = eventName;
                            eventToEdit.color = eventColor;
                            // Opcional: Deseleccionar el evento después de editar
                            eventToEdit.seleccionado = false;
                            console.log('Evento actualizado en appState:', eventToEdit);
                            // Resetear editingEventId después de usarlo
                            editingEventId = null;
                            console.log('editingEventId reseteado a null.');
                            // 4. Guardar el estado actualizado
                            saveAppState(appState);
                            console.log('Estado de la aplicación guardado después de editar evento.');
                            // 5. Actualizar la lista visible de eventos
                            renderEventsList();
                            console.log('Lista de eventos renderizada después de editar evento.');
                            // 6. Actualizar el estado del botón "Editar" en la pantalla principal
                            updateEditButtonState();
                            console.log('Estado del botón Editar actualizado.');
                            // 7. Volver a la pantalla principal
                            mostrarPantalla('main-screen');
                            console.log('Navegando de vuelta a main-screen después de editar.');
                        } else {
                            console.error('Evento no encontrado para editar con ID:', editingEventId);
                            // Resetear editingEventId aunque no se encuentre el evento
                            editingEventId = null;
                            console.log('editingEventId reseteado a null (evento no encontrado).');
                            // Volver a la pantalla principal incluso si no se encuentra el evento
                            mostrarPantalla('main-screen');
                            console.log('Volviendo a main-screen porque el evento a editar no se encontró.');
                        }
                    } else {
                        console.warn('Botón Guardar presionado pero no hay editingEventId. ¿Intentando guardar sin seleccionar un evento?');
                        // Volver a la pantalla principal si no hay editingEventId
                        mostrarPantalla('main-screen');
                        console.log('Volviendo a main-screen porque no hay editingEventId.');
                    }
                } else {
                    console.warn('Botón Guardar evento presionado pero la pantalla no está en modo "editar".');
                    // Volver a la pantalla principal si no está en modo editar (seguro)
                    mostrarPantalla('main-screen');
                    console.log('Volviendo a main-screen porque no está en modo editar.');
                }
            }
        },



    // Listener para el botón "Eliminar Evento" (inicia confirmación)
        {
            selector: '#edit-screen #delete-event-button', // Selector más específico
            eventType: 'click'
            , handler: function () {
                console.log('Botón Eliminar presionado - solicitando confirmación.');
                // Ocultar botones de edición, crear y cancelar original
                document.getElementById('create-event-button')
                    .style.display = 'none'; // Asegurar que el botón Crear también se oculte si es visible
                document.getElementById('edit-event-button')
                    .style.display = 'none';
                document.getElementById('delete-event-button')
                    .style.display = 'none';
                document.getElementById('cancel-edit-button')
                    .style.display = 'none';
                // Mostrar botones de confirmación y cancelar eliminación
                document.getElementById('confirm-delete-button')
                    .style.display = 'block';
                document.getElementById('cancel-delete-button')
                    .style.display = 'block';
                console.log('Botones de confirmación de eliminación visibles.');
            }
        },



    // Listener para el botón "Confirmar Eliminación"
        {
            selector: '#edit-screen #confirm-delete-button', // Selector más específico
            eventType: 'click'
            , handler: function () {
                console.log('Botón Confirmar eliminación presionado.');
                // Asegurarse de que tenemos un ID de evento a eliminar almacenado
                if (editingEventId) {
                    // 1. Encontrar el índice del evento a eliminar usando editingEventId
                    const indexToDelete = appState.events.findIndex(event => event.id === editingEventId);
                    if (indexToDelete > -1) {
                        // 2. Eliminar el evento del array appState.events
                        appState.events.splice(indexToDelete, 1);
                        console.log(`Evento con ID ${editingEventId} eliminado.`);
                        // Eliminar acciones relacionadas del actionHistory
                        appState.actionHistory = appState.actionHistory.filter(action => action.eventId !== editingEventId);
                        console.log(`Acciones relacionadas con el evento ID ${editingEventId} eliminadas del actionHistory.`);
                        // Resetear editingEventId después de eliminar
                        editingEventId = null;
                        console.log('editingEventId reseteado a null.');
                        // 3. Guardar el estado actualizado
                        saveAppState(appState);
                        console.log('Estado de la aplicación guardado después de eliminar evento.');
                        // 4. Actualizar la lista visible de eventos
                        renderEventsList();
                        console.log('Lista de eventos renderizada después de eliminar.');
                        // 5. Actualizar el estado del botón "Editar" en la pantalla principal
                        updateEditButtonState();
                        console.log('Estado del botón Editar actualizado.');
                        // 6. Volver a la pantalla principal
                        mostrarPantalla('main-screen');
                        console.log('Navegando de vuelta a main-screen después de eliminar.');
                    } else {
                        console.error('Evento no encontrado para eliminar con ID:', editingEventId);
                        // Resetear editingEventId aunque no se encuentre el evento
                        editingEventId = null;
                        console.log('editingEventId reseteado a null (evento no encontrado).');
                        // Volver a la pantalla principal incluso si no se encuentra el evento
                        mostrarPantalla('main-screen');
                        console.log('Volviendo a main-screen porque el evento a eliminar no se encontró.');
                    }
                } else {
                    console.warn('Botón Confirmar eliminación presionado pero no hay editingEventId. ¿Intentando eliminar sin seleccionar un evento?');
                    // Volver a la pantalla principal si no hay editingEventId
                    mostrarPantalla('main-screen');
                    console.log('Volviendo a main-screen porque no hay editingEventId para eliminar.');
                }
                // Asegurar que los botones de confirmación/cancelación se oculten
                document.getElementById('confirm-delete-button')
                    .style.display = 'none';
                document.getElementById('cancel-delete-button')
                    .style.display = 'none';
                console.log('Botones de confirmación de eliminación ocultos.');
                // Asegurar que el botón Cancelar original se muestre al volver (si aplica)
                // Esto ya se maneja al llamar a mostrarPantalla('main-screen') con el modo por defecto
            }
        },



    // Listener para el botón "Cancelar Eliminación"
        {
            selector: '#edit-screen #cancel-delete-button', // Selector más específico
            eventType: 'click'
            , handler: function () {
                console.log('Botón Cancelar Eliminación presionado.');
                // Ocultar botones de confirmación y cancelar eliminación
                document.getElementById('confirm-delete-button')
                    .style.display = 'none';
                document.getElementById('cancel-delete-button')
                    .style.display = 'none';
                console.log('Botones de confirmación de eliminación ocultos.');
                // Restaurar botones de edición y eliminar, y el botón cancelar original
                document.getElementById('edit-event-button')
                    .style.display = 'block';
                document.getElementById('delete-event-button')
                    .style.display = 'block';
                document.getElementById('cancel-edit-button')
                    .style.display = 'block'; // Asegurar que el botón Cancelar original se muestre
                console.log('Botones de edición restaurados.');
                // No se navega, permanece en la pantalla de edición
                console.log('Cancelada la eliminación, permaneciendo en la pantalla de edición.');
            }
        },



    // Listener para el botón "Cancelar" (el original en la pantalla de edición)
        {
            selector: '#edit-screen #cancel-edit-button', // Selector más específico
            eventType: 'click'
            , handler: function () {
                console.log('Botón Cancelar (edición) presionado.');
                // Resetear editingEventId al cancelar
                editingEventId = null;
                console.log('editingEventId reseteado a null al cancelar edición.');
                mostrarPantalla('main-screen'); // Volver a la pantalla principal
                console.log('Navegando de vuelta a main-screen al cancelar edición.');
            }
        },

/*
// BOTON DE RETROSESO PANTALLA CREACION/EDICION, DESHABILITADO, PERO EXISTENTE 
    // Listener para el botón "back-button" en la pantalla de edición
        {
            selector: '#edit-screen #back-button', // Selector más específico
            eventType: 'click'
            , handler: function () {
                console.log('Botón back-button en Edición presionado.');
                // Resetear editingEventId al usar el botón de retroceso
                editingEventId = null;
                console.log('editingEventId reseteado a null al usar back-button en edición.');
                mostrarPantalla('main-screen'); // Volver a la pantalla principal
                console.log('Navegando de vuelta a main-screen al usar back-button en edición.');
            }
        }
*/
        

    ],





    'charts-screen': [
        

        


        // ... (otros listeners existentes para charts-screen si los hay)

        // Listener para el botón de regreso a la pantalla principal
        {
            selector: '#charts-screen #back-button', // Selector específico del botón de regreso en la pantalla de gráficos
            eventType: 'click',
            handler: function () {
                console.log('Botón de regreso en charts-screen presionado.');

                // 1. Llamar a la función para destruir instancias de Chart.js y limpiar el estado relacionado.
                // Esto también restablece las variables chartsConfig y chartInstances, y resetea atributos/style de canvas/contenedores.
                destroyAllCharts();
                console.log('Llamada a destroyAllCharts al salir de charts-screen.');

                // 2. Limpiar visualmente la pantalla de gráficos ocultando los contenedores de gráficos y mensajes.
                // Esto es necesario para que la pantalla se vea limpia si se vuelve a ella sin eventos
                // o si no se carga nada al entrar.
                 document.querySelectorAll('#charts-container .canvas-wrapper').forEach(el => el.style.display = 'none');
                 document.querySelectorAll('#charts-container .chart-message-container').forEach(el => el.style.display = 'none');
                 console.log('Contenedores de canvas y mensajes ocultos al salir de charts-screen.');


                // 3. Remover los listeners de charts-screen ANTES de navegar.
                eventManager.removeScreenListeners('charts-screen');
                console.log('Listeners de charts-screen removidos al salir.');


                // 4. Navegar de regreso a la pantalla principal.
                // mostrarPantalla gestionará la ocultación de charts-screen y la carga de listeners de main-screen.
                mostrarPantalla('main-screen');
                console.log('Navegando de vuelta a main-screen.');
            }
        },

        // Listener para el botón intercambiador del gráfico 1 (7 días)
        {
            selector: '#chart1-toggle', // Selector específico del botón
            eventType: 'click',
            handler: function(event) {
                console.log('Botón intercambiador chart1 presionado.');
                // Llamar a la función que maneja el intercambio de escala con el ID del gráfico.
                alternarEscalaGrafico('chart1');
            }
        },
        // Listener para el botón intercambiador del gráfico 2 (30 días)
        {
            selector: '#chart2-toggle', // Selector específico del botón
            eventType: 'click',
            handler: function(event) {
                console.log('Botón intercambiador chart2 presionado.');
                // Llamar a la función que maneja el intercambio de escala con el ID del gráfico.
                alternarEscalaGrafico('chart2');
            }
        },
        // Listener para el botón intercambiador del gráfico 3 (Año)
        {
            selector: '#chart3-toggle', // Selector específico del botón
            eventType: 'click',
            handler: function(event) {
                console.log('Botón intercambiador chart3 presionado.');
                // Llamar a la función que maneja el intercambio de escala con el ID del gráfico.
                alternarEscalaGrafico('chart3');
            }
        }
    ] 

            






//    'global-elements': [
    // Aquí podrías añadir otros Listeners para elementos que pueden estar presentes globalmente o en múltiples pantallas
//    ],

};





//---------------------------------------------------//
// 2. Funciones de gestión del estado y persistencia:
//---------------------------------------------------//

// Función para obtener la estructura por defecto del estado de la aplicación.
// Centraliza la definición de la estructura inicial.
function getDefaultAppState() {
    return {
        events: [], // Lista de eventos
        actionHistory: [], // Historial de acciones (para Deshacer)
        userPreferences: {} // Preferencias de usuario (colores, fuentes, etc.)
    };
}



// Función para guardar el estado completo de la aplicación en localStorage.
function saveAppState(data) {
    try {
        // Convertir el objeto de datos a una cadena JSON para guardarlo en localStorage.
        localStorage.setItem('appState', JSON.stringify(data));
        console.log('Estado de la aplicación guardado en localStorage.');
    } catch (e) {
        // Manejar errores en caso de que el almacenamiento local no esté disponible o haya problemas.
        console.error('Error al guardar el estado en localStorage:', e);
        // Considerar aquí una estrategia de respaldo o notificación al usuario.
    }
}



// Función para cargar el estado completo de la aplicación desde localStorage.
// Intenta cargar desde localStorage primero. Si falla o no hay datos, inicializa
// appState con la estructura por defecto.
function loadAppState() {
    console.log('Intentando cargar estado desde localStorage...');
    let loadedState = null;
    try {
        // Intentar obtener el estado guardado de localStorage.
        const savedState = localStorage.getItem('appState');
        if (savedState) {
            // Si hay datos guardados, parsearlos de JSON a un objeto JavaScript.
            loadedState = JSON.parse(savedState);
            console.log('Estado de la aplicación cargado desde localStorage.');
        } else {
            // Si no hay datos en localStorage, no hay estado cargado.
            console.log('No hay estado guardado en localStorage. Inicializando con estructura por defecto.');
        }
    } catch (e) {
        console.error('Error al cargar el estado desde localStorage:', e);
        // En caso de error, loadedState sigue siendo null
    }
    // Si loadedState es null o no es un objeto válido, retornar la estructura por defecto.
    // De lo contrario, retornar el estado cargado.
    // Aunque con la fusión posterior en setupAppState esto es menos crítico, es una buena práctica.
    return loadedState && typeof loadedState === 'object' ? loadedState : getDefaultAppState();
}



// Función para configurar el estado inicial de la aplicación al cargar.
// Carga desde localStorage o inicializa si no hay datos.
function setupAppState() {
    console.log('Iniciando setupAppState...');
    // Cargar el estado de la aplicación y actualizar la variable global appState
    const loadedState = loadAppState();
    // Fusionar con la estructura por defecto para asegurar que todas las propiedades existen
    // Utilizar el operador de propagación para una fusión robusta
    appState = {
        ...getDefaultAppState(), // Empieza con la estructura por defecto
        ...loadedState // Sobrescribe con las propiedades cargadas (si existen)
    };
    console.log('Estado de la aplicación fusionado con datos cargados:', appState);







 // --- NUEVA LÓGICA: Usar valores de variables CSS como fallback si las preferencias no están definidas ---
    console.log('Verificando y aplicando fallbacks desde variables CSS...');
    const rootStyles = getComputedStyle(document.documentElement); // Obtener los estilos computados del elemento raíz

    // Lista de preferencias a verificar y sus variables CSS correspondientes
    const preferenceMap = {
        "header-color-input": "--header-bg-color",
        "background-color-input": "--app-bg-color",
        "title-color-input": "--title-color",
        "font-type-select": "--event-name-font"
        // Añade aquí cualquier otra preferencia que corresponda a una variable CSS en :root
    };

    // Asegurarse de que userPreferences es un objeto válido antes de iterar
    if (typeof appState.userPreferences !== 'object' || appState.userPreferences === null) {
        appState.userPreferences = {}; // Inicializar como objeto vacío si no lo es
    }

    // Iterar sobre las preferencias y aplicar el fallback si es necesario
    for (const prefKey in preferenceMap) {
        const cssVarName = preferenceMap[prefKey];
        const currentValue = appState.userPreferences[prefKey];

        // Verificar si la preferencia no está definida o es null/undefined
        // Podemos ser más estrictos si queremos considerar una cadena vacía como "vacío" también:
        // if (currentValue === undefined || currentValue === null || currentValue === '') {
        if (currentValue === undefined || currentValue === null) { // Verificar solo undefined/null
            const cssFallbackValue = rootStyles.getPropertyValue(cssVarName).trim(); // Leer el valor de la variable CSS

            // Si la variable CSS tiene un valor (no es una cadena vacía después de trim)
            if (cssFallbackValue) {




                appState.userPreferences[prefKey] = cssFallbackValue; // Establecer el valor de la variable CSS como preferencia
                console.log(`Preferencia "${prefKey}" no definida. Usando fallback de CSS: "${cssFallbackValue}".`);
            } else {
                 console.warn(`Preferencia "${prefKey}" no definida y variable CSS "${cssVarName}" no encontrada o vacía. No se aplicó fallback.`);
                 // Opcional: podrías establecer un valor por defecto 'hardcoded' aquí si la variable CSS falla
                 // appState.userPreferences[prefKey] = 'valor-por-defecto-hardcoded';
            }
        } else {
             console.log(`Preferencia "${prefKey}" encontrada con valor: "${currentValue}". No se necesita fallback.`);
        }
    }
    // --- Fin NUEVA Lógica ---








    // --- Resetear la propiedad 'seleccionado' a false para todos los eventos al cargar ---
    // Esto asegura que ningún evento esté seleccionado visualmente al iniciar la aplicación.
    if (Array.isArray(appState.events)) {
        appState.events.forEach(event => {
            event.seleccionado = false;
        });
        console.log('Propiedad "seleccionado" reseteada a false para todos los eventos.');
    } else {
        console.warn('appState.events no es un array después de la fusión.');
        appState.events = []; // Asegurarse de que sea un array vacío
    }

    // --- Limpiar y asegurar datos antiguos al cargar el estado ---
    console.log('Iniciando limpieza y aseguramiento de datos al cargar el estado...');
    // Limpiar y asegurar datos de cada evento
    if (Array.isArray(appState.events)) {
        appState.events.forEach(event => {
            // *** Modificación: Usar la nueva función cleanDailyArrays para limpiar dailyTimestamps ***
            event.dailyTimestamps = cleanDailyArrays(event); // Limpiar entradas de días antiguos

            // *** Modificación: Asegurar que existen entradas para los últimos 7 días en dailyTimestamps ***
            ensureLast7DaysArrays(event); // Asegurar entradas para los últimos 7 días

            // Las limpiezas de ultimos_30_dias y ultimo_año se mantienen usando las funciones existentes
            event.ultimos_30_dias = cleanDailyDataByCount(event.ultimos_30_dias, 30);
            event.ultimo_año = cleanWeeklyDataByCount(event.ultimo_año, 52);
        });
        console.log('Limpieza y aseguramiento de datos de eventos completado.');
    }

    // Limpiar actionHistory global (sigue usando cleanTimestampsByAge)
    appState.actionHistory = cleanTimestampsByAge(appState.actionHistory, 7);
    console.log('Limpieza de actionHistory completada.');

    // Guardar el estado limpio inmediatamente después de la configuración y limpieza inicial
    saveAppState(appState);
    console.log('Estado inicial limpio y configurado guardado.');
}





//---------------------------------------------------//
// 3. Funciones de navegación y control de pantalla:
//---------------------------------------------------//

// Instancia de manageEventListeners para usar en toda la aplicación
const eventManager = manageEventListeners();



// Función principal para gestionar la adición y remoción de listeners
function manageEventListeners() {
    // Función auxiliar para añadir un array de listeners descritos por objetos { selector, eventType, handler }
    function addListeners(listenersArray) {
        console.log('Añadiendo listeners...');
        if (!listenersArray || listenersArray.length === 0) {
            console.log('No hay listeners en el array para añadir.');
            return;
        }
        listenersArray.forEach(listener => {
            const elements = document.querySelectorAll(listener.selector);
            if (elements.length > 0) {
                console.log(`¡Éxito! Elementos encontrados para selector: ${listener.selector}. Cantidad: ${elements.length}`); // Nuevo log de éxito
                elements.forEach(element => {
                    // Añade el listener al elemento
                    element.addEventListener(listener.eventType, listener.handler);
                    // Opcional: Podrías almacenar una referencia para facilitar la remoción si es necesario
                    // element._appListener = { type: listener.eventType, handler: listener.handler };
                    console.log(`Listener añadido: ${listener.selector} - ${listener.eventType}`);
                });
            } else {
                console.warn(`Elemento no encontrado para añadir listener: ${listener.selector}`);
                console.log(`FALLÓ: Selector "${listener.selector}" no encontró elementos.`); // Nuevo log de fallo detallado
            }
        });
        console.log('Finalizada la adición de listeners.');
    }
    // Función auxiliar para remover un array de listeners descritos por objetos { selector, eventType, handler }
    function removeListeners(listenersArray) {
        console.log('Removiendo listeners...');
        if (!listenersArray || listenersArray.length === 0) {
            console.log('No hay listeners en el array para remover.');
            return;
        }
        listenersArray.forEach(listener => {
            const elements = document.querySelectorAll(listener.selector);
            if (elements.length > 0) {
                elements.forEach(element => {
                    // Remueve el listener
                    element.removeEventListener(listener.eventType, listener.handler);
                    // Opcional: Limpia la referencia si la almacenaste al añadir
                    // if (element._appListener && element._appListener.type === listener.eventType && element._appListener.handler === listener.handler) {
                    //     delete element._appListener;
                    // }
                    console.log(`Listener removido: ${listener.selector} - ${listener.eventType}`);
                });
            } else {
                // No es necesariamente un error si el elemento ya no existe al remover
                // console.warn(`Elemento no encontrado para remover listener: ${listener.selector}`);
            }
        });
        console.log('Finalizada la remoción de listeners.');
    }
    // Método para cargar los listeners de una pantalla específica
    function loadScreenListeners(screenName, mode = null) {
        console.log(`Cargando listeners para pantalla: ${screenName}, modo: ${mode}`);
        const screenListeners = appEventListeners[screenName];
        if (screenListeners) {
            // Aquí podríamos añadir lógica para filtrar listeners por modo si es necesario en el futuro
            // Por ahora, añadimos todos los de la pantalla
            addListeners(screenListeners);
        } else {
            console.warn(`No se encontraron listeners definidos para la pantalla: ${screenName}`);
        }
        // --- Añadir siempre los listeners globales ---
//        const globalListeners = appEventListeners['global-elements'];
//        if (globalListeners) {
//            console.log('Cargando listeners globales...');
//            addListeners(globalListeners);
//       } else {
//            console.warn('No se encontraron listeners definidos para los elementos globales.');
//        }
        console.log(`Listeners cargados para: ${screenName}`);
    }
    // Método para remover los listeners de una pantalla específica
    function removeScreenListeners(screenName) {
        console.log(`Removiendo listeners para pantalla: ${screenName}`);
        const screenListeners = appEventListeners[screenName];
        if (screenListeners) {
            // Aquí podríamos añadir lógica para filtrar listeners por modo si es necesario
            // Por ahora, removemos todos los de la pantalla
            removeListeners(screenListeners);
        }
        // --- Remover siempre los listeners globales ---
        const globalListeners = appEventListeners['global-elements'];
        if (globalListeners) {
            console.log('Removiendo listeners globales...');
            removeListeners(globalListeners);
        } else {
            // No es un error si no hay listeners globales definidos
        }
        // -----------------------------------------
        console.log(`Listeners removidos para: ${screenName}`);
    }
    // Retorna los métodos públicos que se usarán para gestionar listeners
    return {
        loadScreenListeners: loadScreenListeners
        , removeScreenListeners: removeScreenListeners
    };
}
























// Función para mostrar una pantalla específica y ocultar las demás pantallas principales.
// Argumento: idPantalla (string) - el ID de la pantalla que se desea mostrar.
// Modo (string, opcional): Un modo adicional para pantallas como 'edit-screen'.
async function mostrarPantalla(idPantalla, modo = null) { // Marcar como async
    console.log(`Intentando mostrar pantalla: ${idPantalla} en modo: ${modo}`);

    // --- Lógica de Ocultación de Pantallas ---
    // Lista de IDs de las pantallas principales de la aplicación que deben ocultarse SIEMPRE.
    const mainScreens = [
        'main-screen',
        'charts-screen',
        'edit-screen',
        'personalization-screen'
    ];

     // 1. Ocultar TODAS las pantallas principales conocidas, EXCEPTO la pantalla de destino.
     mainScreens.forEach(id => {
         const elementoPantalla = document.getElementById(id);
         if (elementoPantalla && id !== idPantalla) { // No ocultar la pantalla que estamos a punto de mostrar
              elementoPantalla.style.display = 'none';
         }
     });
     console.log('Todas las pantallas principales conocidas, excepto el destino, aseguradas como ocultas.');


    // 2. Identificar la pantalla que estaba visible ANTES de la ocultación de mainScreens.
    // Esto es para remover sus listeners. Buscamos entre pantallas principales y info-popup,
    // EXCLUYENDO 'loading-popup'.
     let currentActiveScreenId = null;
    const screensForListenerRemoval = [...mainScreens, 'info-popup']; // Excluir loading-popup de la identificación para remoción de listeners
     screensForListenerRemoval.forEach(id => {
         const elementoPantalla = document.getElementById(id);
         if (elementoPantalla) {
               const isVisible = elementoPantalla.style.display === 'block' || elementoPantalla.style.display === 'flex';
               if (isVisible && id !== idPantalla) { // Si estaba visible Y NO es la pantalla de destino
                    currentActiveScreenId = id; // Guardar la ID de la pantalla activa anterior (para remover listeners)
                    // Si la pantalla activa anterior era info-popup, ocultarla aquí.
                    if (id === 'info-popup') {
                         elementoPantalla.style.display = 'none';
                         console.log(`Info-popup ocultado porque era la pantalla activa anterior.`);
                    }
               }
         }
     });

    // 3. Si había una pantalla activa identificada (que no era la de destino y no era loading-popup), remover sus listeners.
    if (currentActiveScreenId) {
        console.log(`Pantalla activa anterior identificada para remoción de listeners: ${currentActiveScreenId}`);
        eventManager.removeScreenListeners(currentActiveScreenId);
        console.log(`Listeners removidos para la pantalla: ${currentActiveScreenId}`);
    } else {
         console.log('No se identificó ninguna pantalla activa anterior para remover listeners.');
    }

    // NOTA IMPORTANTE:
    // La destrucción de instancias de Chart.js (si se sale de charts-screen)
    // DEBE ser manejada por el handler que INICIA la navegación (ej: el handler
    // del botón de regreso en charts-screen) ANTES de llamar a mostrarPantalla.
    // mostrarPantalla ya NO es responsable de destruir gráficos.
    // El loading-popup (mostrar/ocultar/listeners) se gestiona COMPLETAMENTE por el handler del botón de gráficos.

    // La carga de listeners para la NUEVA pantalla se realizará al final de esta función
    // (para pantallas que no sean charts-screen) o en el handler del botón de charts (para charts-screen).

    // --- Fin Lógica de Ocultación ---


   // Mostrar la pantalla deseada.
    const pantallaAMostrar = document.getElementById(idPantalla);
    if (pantallaAMostrar) {

        // Configurar el display para la pantalla a mostrar.
        // Usar 'flex' para popups, 'block' para otras pantallas.
        // Si la pantalla a mostrar es un popup que el handler ya mostró,
        // su display ya debería ser 'flex'/'block', pero lo aseguramos aquí.
        // Si la pantalla a mostrar es una mainScreen, la mostramos ahora.
        if (idPantalla === 'info-popup' || idPantalla === 'loading-popup') {
            pantallaAMostrar.style.display = 'flex';
             console.log(`Pantalla ${idPantalla} activada con display: flex.`);
        } else {
            // Si la pantalla a mostrar es una de las mainScreens, ya nos aseguramos de que las otras estén ocultas.
            pantallaAMostrar.style.display = 'block'; // Por defecto para mainScreens
             console.log(`Pantalla ${idPantalla} activada con display: block.`);
        }

        // Si es la pantalla de edición, guarda el modo en un atributo de datos.
        if (idPantalla === 'edit-screen') {
             if (modo) { // Solo guarda el modo si se especifica
                 pantallaAMostrar.dataset.mode = modo;
                 console.log(`Modo '${modo}' guardado en dataset de edit-screen.`);
             } else {
                 delete pantallaAMostrar.dataset.mode;
                 console.log(`Modo no especificado para edit-screen. Limpiado dataset.mode.`);
             }
        }

        // NOTA: Toda la lógica específica de gráficos (mostrar canvas/mensajes, renderizar, destruir)
        // se ha movido *fuera* de mostrarPantalla y debe ser manejada por los handlers de eventos.
        // El manejo del loading-popup (mostrar, ocultar) también es responsabilidad del handler.


    } else {
        console.error(`Elemento de pantalla no encontrado para mostrar: ${idPantalla}`);
    }
    // ... (El resto de la función mostrarPantalla, incluyendo carga de listeners y lógica post-visualización por pantalla) ...














// --- Lógica de carga de listeners (ahora unificada al final) ---
     // Cargar listeners para la pantalla que acaba de ser activada, EXCEPTO para charts-screen.
     // Los listeners de charts-screen serán cargados explícitamente por el handler del botón Gráficos
     // después de toda la lógica de preparación y renderizado.
     if (idPantalla !== 'charts-screen') {
         console.log(`Cargando listeners específicos de ${idPantalla}.`);
         eventManager.loadScreenListeners(idPantalla, modo);
         console.log(`Listeners cargados para: ${idPantalla}.`);
     } else {
         console.log(`Carga de listeners para ${idPantalla} pospuesta. Será manejada por el handler del botón Gráficos.`);
     }
     // --- Fin Lógica de carga de listeners ---



    // Lógica específica después de mostrar una pantalla (ya existente)
     if (idPantalla === 'edit-screen') {
        // ... (Tu lógica existente para configurar elementos de edit-screen) ...
         const editScreenTitleAlt = document.getElementById('edit-screen-title-alt');
         const createEventButton = document.getElementById('create-event-button');
         const editEventButton = document.getElementById('edit-event-button');
         const deleteEventButton = document.getElementById('delete-event-button');
         const cancelEditButton = document.getElementById('cancel-edit-button');
         const confirmDeleteButton = document.getElementById('confirm-delete-button');
         const cancelDeleteButton = document.getElementById('cancel-delete-button');

         if (editScreenTitleAlt && createEventButton && editEventButton && deleteEventButton && cancelEditButton && confirmDeleteButton && cancelDeleteButton) {
              // Ocultar los botones de confirmación de eliminación por defecto al entrar
              confirmDeleteButton.style.display = 'none';
              cancelDeleteButton.style.display = 'none';

              // Asegurar que los botones principales de acción estén ocultos por defecto
              createEventButton.style.display = 'none';
              editEventButton.style.display = 'none';
              deleteEventButton.style.display = 'none';

              // El botón de cancelar edición siempre visible al entrar en modo editar/crear
              cancelEditButton.style.display = 'block';


              if (modo === 'crear') {
                  editScreenTitleAlt.textContent = 'nuevo EVENTO';
                  createEventButton.style.display = 'block';
                  // Establecer color por defecto al crear
                  const eventColorInput = document.getElementById('event-color-input');
                  if (eventColorInput) eventColorInput.value = '#cbbbef'; // Color por defecto
              } else if (modo === 'editar') {
                  editScreenTitleAlt.textContent = 'editar EVENTO';
                  editEventButton.style.display = 'block';
                  deleteEventButton.style.display = 'block';
              } else {
                  // Modo por defecto si no se especifica
                   editScreenTitleAlt.textContent = 'Edición'; // Texto genérico o vacío
                  // Solo el botón cancelar edición estará visible por defecto
              }
         } else {
             console.warn('Uno o más elementos de la pantalla de edición no encontrados para configurar visibilidad.');
         }
     }

      if (idPantalla === 'main-screen') {
         console.log('Configurando UI para pantalla principal.');
         // Asegurar que el estado de los botones Editar y Deseleccionar se actualice al mostrar
         updateEditButtonState();
         updateUnselectAllButtonState();
         // Renderizar la lista de eventos (aunque renderEventsList también se llama al cargar la app y al volver de edit/create)
         // Llamar aquí podría ser redundante si renderEventsList ya se llamó recientemente, pero asegura que esté actualizada.
         // Podríamos omitir esta llamada aquí si el flujo de navegación ya garantiza la lista actualizada.
         // Por ahora, la mantenemos para seguridad visual.
         renderEventsList(); // Asegurarse de que la lista de eventos se muestre
      }

      if (idPantalla === 'personalization-screen') {
         console.log('Configurando UI para pantalla de personalización.');
         loadPreferencesIntoInputs(); // Cargar valores en los inputs al mostrar
         // Restablecer la visibilidad de los botones de borrado
         const borronButton = document.getElementById('BORRON');
         const confirmarBorronButton = document.getElementById('confirmar-BORRON');
         const cancelarBorronButton = document.getElementById('cancelar-BORRON');
         if (borronButton) borronButton.style.display = 'block';
         if (confirmarBorronButton) confirmarBorronButton.style.display = 'none';
         if (cancelarBorronButton) cancelarBorronButton.style.display = 'none';
         console.log('Estado de botones de borrado restablecido al mostrar Personalización.');
      }

       // Si es la pantalla de gráficos, no necesitamos lógica post-visualización aquí
       // porque toda la manipulación de canvas/mensajes y popup se hará en el handler
       // del botón de gráficos, después de que mostrarPantalla haya hecho su trabajo básico
       // de mostrar el contenedor principal.
       if (idPantalla === 'charts-screen') {
           console.log('Lógica post-visualización para charts-screen manejada por el handler del botón de gráficos.');
           // Nota: No cargamos listeners aquí si la lógica de renderizado/popup
           // ocurre asíncronamente en el handler. La carga de listeners debe
           // ocurrir *después* de que el renderizado complejo y la ocultación del
           // popup hayan terminado en el handler.
       }


}






















// Esperar a que el DOM esté completamente cargado antes de añadir listeners
document.addEventListener('DOMContentLoaded', async () => { // Marcar como async

    // Código para registrar el service worker.
    if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
            console.log('Service Worker registered:', registration);
        })
        .catch(error => {
            console.error('Service Worker registration failed:', error);
        });
    });
    }
      
    // Configurar el estado inicial de la aplicación (carga desde localStorage o inicializa)
    setupAppState();
    console.log('Estado inicial de la aplicación configurado:', appState);
    // Llamar a la función para cargar los inputs de preferencia al inicio
    loadPreferencesIntoInputs();
    // Aplicar las preferencias de usuario al cargar
    applyPreferences();
    // Renderizar la lista de eventos y actualizar el estado del botón Editar después de cargar/inicializar el estado
    renderEventsList();
    updateUnselectAllButtonState(); // Asegurarse de que el estado inicial del botón de deselección se establezca
    // Obtener referencias a los botones de la pantalla principal
    updateEditButtonState(); // <-- Llamar a la función para establecer el estado inicial del botón Editar
    // Mostrar la pantalla principal al inicio
    mostrarPantalla('main-screen'); // Esto muestra la pantalla principal
    // Cargar explícitamente los listeners de la pantalla principal después de mostrarla
    eventManager.loadScreenListeners('main-screen');
    console.log('Listeners de la pantalla principal cargados explícitamente al inicio.');
});







//---------------------------------------------------//
// 4. Funciones de manipulación del DOM y renderizado:
//---------------------------------------------------//

// Función para ordenar eventos según contador_historico descendente y nombre ascendente como desempate.
function sortEvents(eventsArray) {
    // Crear una copia del array antes de ordenarlo.
    // Esto evita modificar el array original appState.events in-place.
    const sortedEvents = [...eventsArray];
    // Ordenar la copia del array.
    sortedEvents.sort((a, b) => {
        // Ordenar por contador_historico descendente (de mayor a menor).
        // Si b.contador_historico es mayor que a.contador_historico, b va antes que a.
        if (b.contador_historico !== a.contador_historico) {
            // Asegurarse de que los valores son numéricos; tratar undefined/null como 0.
            const aCount = a.contador_historico || 0;
            const bCount = b.contador_historico || 0;
            return bCount - aCount;
        } else {
            // Desempate por nombre ascendente (orden alfabético).
            // Utilizar localeCompare para una comparación de cadenas segura que maneja acentos, etc.
            return (a.nombre || '')
                .localeCompare(b.nombre || ''); // Tratar nombres nulos/undefined como cadenas vacías
        }
    });
    return sortedEvents; // Devolver la copia ordenada.
}



// Función para renderizar la lista de eventos en la pantalla principal.
function renderEventsList() {
    const eventsListContainer = document.getElementById('events-list');
    if (!eventsListContainer) {
        console.error('Contenedor de lista de eventos no encontrado.');
        return;
    }
    // *** NUEVA LÓGICA: Ordenar los eventos antes de renderizar ***
    // Crear una copia del array antes de ordenar para no modificar el orden original en appState directamente.
    // Asegurarse de que appState.events es un array antes de intentar ordenar
    if (!Array.isArray(appState.events)) { // Este chequeo sigue siendo útil aunque sortEvents cree una copia.
        console.error('appState.events no es un array. No se puede renderizar la lista.');
        appState.events = [];
    }
    // Ordenar una copia del array para no modificar el orden original en appState directamente (aunque aquí lo vamos a renderizar ordenado)
    const sortedEvents = sortEvents([...appState.events]); // Crear una copia antes de ordenar
    // Limpiar completamente el contenido actual de la lista de eventos.
    eventsListContainer.innerHTML = ''; // Elimina todos los hijos
    // Iterar sobre los eventos en appState y renderizar cada uno
    // Iterar sobre el array ORDENADO para renderizar
    sortedEvents.forEach(eventData => {
        const eventElement = createEventElement(eventData);
        // *** Modificación: Encontrar el checkbox y establecer su estado inicial ***
        const selectCheckbox = eventElement.querySelector('.select-checkbox');
        console.log('Renderizando evento:', eventData.nombre, 'seleccionado:', eventData.seleccionado); // Log de depuración
        if (selectCheckbox) {
            selectCheckbox.checked = eventData.seleccionado || false; // Marcar si eventData.seleccionado es true
        }
        eventsListContainer.appendChild(eventElement);
        // Llamar a updateEventDailyData para calcular y mostrar Hoy/Ayer al renderizar (ahora que el elemento está en el DOM)
        updateEventDailyData(eventData);
    });
    console.log('Lista de eventos renderizada.');
}





//---------------------------------------------------//
// 5. Funciones relacionadas con la interacción del usuario (Event Handlers):
//---------------------------------------------------//

// --- Función para deseleccionar todos los eventos ---
function unselectAllEvents() {
    console.log('Deseleccionando todos los eventos...');
    if (Array.isArray(appState.events)) {
        appState.events.forEach(event => {
            event.seleccionado = false;
        });
        saveAppState(appState);
        renderEventsList();
        updateEditButtonState(); // Actualizar el estado del botón Editar
        updateUnselectAllButtonState(); // Esta función la crearemos a continuación
        // La llamada a updateUnselectAllButtonState se moverá dentro de esta función una vez creada.
    } else {
        console.warn('appState.events no es un array. No se pudo deseleccionar eventos.');
    }
    console.log('Deselección de eventos completada.');
}



// --- Función para actualizar el estado del botón de deselección maestra ---
function updateUnselectAllButtonState() {
    console.log('Actualizando estado del botón de deselección maestra...');
    const unselectAllButton = document.getElementById('unselect-all-button');
    if (!unselectAllButton) {
        console.warn('Botón de deselección maestra no encontrado.');
        return;
    }
    // Verificar si existe al menos un evento seleccionado
    const hasSelectedEvents = Array.isArray(appState.events) && appState.events.some(event => event.seleccionado);
    const icon = unselectAllButton.querySelector('i');
    if (hasSelectedEvents) {
        if (icon) icon.className = 'fas fa-check-square'; // Cambiar a ícono de cuadrado marcado
        unselectAllButton.disabled = false;
        console.log('Botón de deselección maestra habilitado.');
    } else {
        unselectAllButton.disabled = true; // Deshabilitar el botón
        if (icon) {
            icon.className = 'far fa-square'; // Cambiar a ícono de cuadrado vacío
        }
        console.log('Botón de deselección maestra deshabilitado.');
    }
}



// --- función para actualizar el estado del botón "Editar"
// Lo habilita solo si exactamente un evento está seleccionado.
function updateEditButtonState() {
    console.log('Actualizando estado del botón Editar...');
    const editButton = document.getElementById('edit-button');
    // Asegurarse de que el botón existe
    if (!editButton) {
        console.error('Botón de edición no encontrado.');
        return;
    }
    // Contar cuántos eventos están seleccionados en appState
    const selectedEventsCount = appState.events.filter(event => event.seleccionado)
        .length;
    console.log(`Eventos seleccionados: ${selectedEventsCount}`);
    // Habilitar o deshabilitar el botón según el número de eventos seleccionados
    if (selectedEventsCount === 1) {
        editButton.disabled = false; // Habilitar el botón
        console.log('Botón Editar habilitado.');
    } else {
        editButton.disabled = true; // Deshabilitar el botón
        console.log('Botón Editar deshabilitado.');
    }
}


// Función para deshacer el último incremento
function undoLastIncrement() {
    console.log('Intentando deshacer el último incremento...');

    // 1. Verificar si hay acciones en el historial
    if (!Array.isArray(appState.actionHistory) || appState.actionHistory.length === 0) {
        console.log('El historial de acciones no existe o está vacío. Nada que deshacer.');
        // --- NUEVO: Detener la ejecución inmediatamente si no hay nada que deshacer ---
        return;
        // --- Fin NUEVO ---
        // Las llamadas a saveAppState y renderEventsList que estaban aquí abajo
        // ahora se volverían inalcanzables, lo cual es el comportamiento deseado.
        // saveAppState(appState);
        // renderEventsList();
    }

    // 2. Usar pop() para obtener la última acción
    const lastAction = appState.actionHistory.pop();
    console.log('Última acción obtenida del historial:', lastAction);

    // 3. Verificar si la acción es de tipo \'increment\'
    if (lastAction.type === 'increment') {
        // 4. Encontrar el evento correspondiente en appState.events usando eventId
        const eventToUndo = appState.events.find(event => event.id === lastAction.eventId);
        if (eventToUndo) {
            console.log('Evento encontrado para deshacer:', eventToUndo.nombre);

            let timestampRemoved = false;
            let removedDayTimestamp = null; // Guardar el timestamp del inicio del día del timestamp removido

            // 5. Eliminar el timestamp crudo de dailyTimestamps
            if (Array.isArray(eventToUndo.dailyTimestamps)) {
                for (const dayEntry of eventToUndo.dailyTimestamps) {
                    if (typeof dayEntry === 'object' && dayEntry !== null && typeof dayEntry.date === 'number' && Array.isArray(dayEntry.timestamps)) {
                        const indexToRemove = dayEntry.timestamps.indexOf(lastAction.timestamp);
                        if (indexToRemove > -1) {
                            dayEntry.timestamps.splice(indexToRemove, 1);
                            console.log(`Timestamp ${lastAction.timestamp} eliminado de dailyTimestamps para el día con timestamp ${dayEntry.date}.`);
                            timestampRemoved = true; // Marcar que se encontró y eliminó el timestamp
                            removedDayTimestamp = dayEntry.date; // Guardar la fecha del día
                            break; // Salir del bucle una vez que se encuentra
                        }
                    }
                }
            } else {
                console.warn(`dailyTimestamps no es un array para el evento ${eventToUndo.nombre}. No se pudo buscar el timestamp para eliminar.`);
            }

            // Verificar si el timestamp crudo fue encontrado y eliminado de dailyTimestamps.
            // Si no se encontró, no podemos revertir los contadores agregados y el histórico
            // porque el dato base no está. Descartamos esta acción del history y seguimos buscando.
            if (timestampRemoved) {
                // 6. Decrementar el contador_historico del evento (SOLO si el timestamp fue eliminado)
                eventToUndo.contador_historico = Math.max(0, (eventToUndo.contador_historico || 0) - 1); // Asegurar no ir por debajo de cero
                console.log(`Contador histórico de ${eventToUndo.nombre} decrementado a ${eventToUndo.contador_historico}`);

                // 7. Reversión para ultimos_30_dias: Decrementar el recuento del día correspondiente.
                // Usamos el timestamp del inicio del día que guardamos.
                if (removedDayTimestamp !== null && Array.isArray(eventToUndo.ultimos_30_dias)) {
                    const thirtyDaysEntry = eventToUndo.ultimos_30_dias.find(entry => entry.date === removedDayTimestamp);
                    if (thirtyDaysEntry) {
                        thirtyDaysEntry.count = Math.max(0, (thirtyDaysEntry.count || 0) - 1);
                        console.log(`Recuento diario para el día ${new Date(removedDayTimestamp).toLocaleDateString()} en ultimos_30_dias decrementado a ${thirtyDaysEntry.count} para ${eventToUndo.nombre}.`);
                    } else {
                         console.warn(`Entrada diaria para el día ${new Date(removedDayTimestamp).toLocaleDateString()} no encontrada en ultimos_30_dias para decrementar para el evento ${eventToUndo.nombre}.`);
                    }
                } else {
                     console.warn(`No se pudo revertir ultimos_30_dias para el evento ${eventToUndo.nombre}.`);
                }

                // 8. Reversión para ultimo_año: Decrementar el recuento de la semana correspondiente.
                // Usamos el timestamp del incremento que se deshizo para encontrar la semana.
                const weekInfo = getWeekNumber(new Date(lastAction.timestamp));
                if (Array.isArray(eventToUndo.ultimo_año)) {
                     const yearlyEntry = eventToUndo.ultimo_año.find(entry =>
                         entry.year === weekInfo.year && entry.week === weekInfo.week
                     );
                     if (yearlyEntry) {
                         yearlyEntry.count = Math.max(0, (yearlyEntry.count || 0) - 1);
                         console.log(`Recuento semanal para sem ${weekInfo.week}, ${weekInfo.year} en ultimo_año decrementado a ${yearlyEntry.count} para ${eventToUndo.nombre}.`);
                     } else {
                          console.warn(`Entrada semanal para sem ${weekInfo.week}, ${weekInfo.year} no encontrada en ultimo_año para decrementar para el evento ${eventToUndo.nombre}.`);
                     }
                } else {
                    console.warn(`No se pudo revertir ultimo_año para el evento ${eventToUndo.nombre}.`);
                }

                // --- LÓGICA DE REVERSIÓN DIRECTA COMPLETADA ---


                // 9. Guardar el estado completo
                saveAppState(appState);
                console.log('Estado de la aplicación guardado después de deshacer.');

                // 10. Renderizar la lista (Esto llamará updateEventDailyData para cada evento redibujado)
                renderEventsList();
                console.log('Lista de eventos renderizada después de deshacer.');

                console.log('Deshecho completado para el evento:', eventToUndo.nombre);


            } else {
                // *** LÓGICA MEJORADA: Timestamp no encontrado en dailyTimestamps ***
                console.log(`Timestamp de la acción deshecha (${lastAction.timestamp}) no encontrado en dailyTimestamps para el evento ${eventToUndo.nombre}. Esto podría significar que el dato crudo fue limpiado o perdido.`);
                console.log('Descartando esta acción deshecha (dato crudo no encontrado) y buscando la siguiente acción válida en el historial.');

                // Guardamos el estado (con la acción ya eliminada del historial por el pop() anterior)
                // y llamamos a nosotros mismos recursivamente para procesar la acción anterior.
                saveAppState(appState);
                renderEventsList(); // Renderizar la lista para reflejar cualquier cambio (aunque el contador no decremente)
                undoLastIncrement(); // Llamada recursiva para buscar la siguiente acción válida
            }

        } else {
            // *** LÓGICA EXISTENTE: Acción no es de tipo \'increment\', descartar y buscar la siguiente ***
            console.log('La última acción no fue de tipo \"increment\". Descartando esta acción y buscando la siguiente acción válida en el historial.');
            saveAppState(appState); // Guardar estado después de descartar la acción no manejada
            renderEventsList();
            undoLastIncrement(); // Llamada recursiva para buscar la siguiente acción válida
        }
    }
    // Ya no hay código aquí que se ejecute después del primer 'if' si la condición es verdadera.
}






function savePreferences() {
    console.log('Guardando preferencias de usuario...');
    // Obtener los valores de los inputs y selects
    const headerColorInput = document.getElementById('header-color-input');
    const backgroundColorInput = document.getElementById('background-color-input');
    const titleColorInput = document.getElementById('title-color-input');
    const fontTypeSelect = document.getElementById('font-type-select');
    // Asegurarse de que appState tiene el objeto userPreferences
    if (!appState.userPreferences) {
        appState.userPreferences = {};
    }
    // Almacenar los valores en appState.userPreferences
    if (headerColorInput) appState.userPreferences["header-color-input"] = headerColorInput.value;
    if (backgroundColorInput) appState.userPreferences["background-color-input"] = backgroundColorInput.value;
    if (titleColorInput) appState.userPreferences["title-color-input"] = titleColorInput.value;
    if (fontTypeSelect) appState.userPreferences["font-type-select"] = fontTypeSelect.value;
    console.log('Preferencias de usuario actualizadas en appState:', appState.userPreferences);
    // Guardar el estado completo de la aplicación (que ahora incluye las preferencias)
    saveAppState(appState);
    console.log('Preferencias guardadas en localStorage.');
    // Aplicar las preferencias inmediatamente después de guardarlas
    applyPreferences();
    // Aquí podrías añadir lógica para aplicar las preferencias inmediatamente si lo deseas
}





//---------------------------------------------------//
// 6. Funciones de cálculo y actualización de datos agregados:
//---------------------------------------------------//

// Función auxiliar para obtener el inicio del día (medianoche) de una fecha dada.
function startOfDay(timestamp) {
    const date = new Date(timestamp);
    date.setHours(0, 0, 0, 0);
    return date.getTime(); // Devuelve el timestamp del inicio del día
}



// Función para obtener el inicio del día de ayer.
function startOfYesterday() {
    const today = new Date();
    today.setDate(today.getDate() - 1); // Restar un día
    today.setHours(0, 0, 0, 0);
    return today.getTime();
}



// Función para actualizar los contadores visuales de "Hoy" y "Ayer" para un evento específico.
// Esta función asume que renderEventsList ya ha creado el elemento HTML del evento.
function updateEventDailyData(eventData) {
    console.log('Actualizando contadores diarios para evento:', eventData.nombre);
    // Encontrar el elemento HTML del evento en el DOM usando el data-eventId
    const eventElement = document.querySelector(`.event-container[data-event-id=\"${eventData.id}\"]`);
    if (!eventElement) {
        console.warn('Elemento HTML del evento no encontrado para actualizar contadores diarios:', eventData.id);
        return; // Salir si el elemento no se encuentra
    }

    // Asegurarse de que dailyTimestamps es un array
    if (!Array.isArray(eventData.dailyTimestamps)) {
        console.warn(`dailyTimestamps no es un array para el evento ${eventData.nombre}. Inicializando contadores diarios a 0.`);
        eventData.dailyTimestamps = []; // Asegurarse de que sea un array para evitar errores posteriores
    }

    // Calcular el timestamp del inicio del día actual y de ayer
    const now = Date.now();
    const startOfToday = startOfDay(now);
    const startOfYesterdayTimestamp = startOfYesterday(); // Usamos la función auxiliar existente

    // Encontrar las entradas para hoy y ayer en dailyTimestamps
    const todayEntry = eventData.dailyTimestamps.find(entry => entry.date === startOfToday);
    const yesterdayEntry = eventData.dailyTimestamps.find(entry => entry.date === startOfYesterdayTimestamp);

    // Obtener la cantidad de clics de hoy y ayer
    // Si la entrada existe y tiene un array de timestamps válido, usamos su longitud. Si no, el contador es 0.
    const todayCount = (todayEntry && Array.isArray(todayEntry.timestamps)) ? todayEntry.timestamps.length : 0;
    const yesterdayCount = (yesterdayEntry && Array.isArray(yesterdayEntry.timestamps)) ? yesterdayEntry.timestamps.length : 0;

    console.log(`Contadores calculados para ${eventData.nombre}: Hoy=${todayCount}, Ayer=${yesterdayCount}`);

    // Encontrar los spans de los contadores "Ayer" y "Hoy" dentro de este elemento
    // El segundo .counter-item es "Ayer", el tercero es "Hoy"
    const ayerCounterSpan = eventElement.querySelector('.counters-container .counter-item:nth-child(2) .counter-value');
    const hoyCounterSpan = eventElement.querySelector('.counters-container .counter-item:nth-child(3) .counter-value');

    // Actualizar el texto de los spans si se encuentran
    if (ayerCounterSpan) {
        ayerCounterSpan.textContent = yesterdayCount;
        console.log(`Span de Ayer actualizado para ${eventData.nombre}.`);
    } else {
        console.warn(`Span de Ayer no encontrado para el evento ${eventData.nombre}.`);
    }

    if (hoyCounterSpan) {
        hoyCounterSpan.textContent = todayCount;
        console.log(`Span de Hoy actualizado para ${eventData.nombre}.`);
    } else {
        console.warn(`Span de Hoy no encontrado para el evento ${eventData.nombre}.`);
    }
    console.log('Actualización de contadores diarios finalizada para evento:', eventData.nombre);
}



// --- Funciones auxiliares para manejo de fechas y semanas ---
// Función para obtener el número de semana del año para una fecha dada.
// Devuelve un objeto { year: numeroDelAño, week: numeroDeSemana }
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    // Establecer al jueves de esa semana para evitar problemas de cambio de año
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    // Obtener el inicio del año de la semana actual
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    // Calcular el número de semana
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return { year: d.getUTCFullYear(), week: weekNo };
}



// Función para obtener el timestamp del inicio de la semana (lunes) para una fecha dada.
function startOfweek(timestamp) {
    const date = new Date(timestamp);
    const dayOfWeek = date.getDay(); // Domingo = 0, Lunes = 1, ..., Sábado = 6
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Diferencia para llegar al lunes (si es domingo, retrocede 6 días)
    date.setDate(date.getDate() - diff);
    date.setHours(0, 0, 0, 0); // Establecer a medianoche del lunes
    return date.getTime();
}






//---------------------------------------------------//
// 7. Funciones de limpieza de datos:
//---------------------------------------------------//

/**
 * Filtra un array eliminando los timestamps más antiguos que el límite de días especificado.
 * Soporta dos tipos de estructuras en el array:
 * - Timestamps numéricos (e.g. 1750239288422)
 * - Objetos que contengan una propiedad `timestamp` numérica (e.g. { timestamp: 1750239288422 })
 *
 * @param {Array<number|{timestamp: number}>} list - Array de timestamps o de objetos con timestamp.
 * @param {number} daysLimit - Cantidad de días a conservar (incluyendo el día actual).
 * @returns {Array<number|{timestamp: number}>} Un nuevo array conteniendo solo los elementos dentro del límite de días.
 */
function cleanTimestampsByAge(list, daysLimit) {
    // Validación: asegurar que la entrada sea un array
    if (!Array.isArray(list)) {
        console.warn('cleanTimestampsByAge recibió una entrada no válida (no es un array).');
        return [];
    }
    // Obtener la fecha actual
    const now = Date.now();
    // Calcular el timestamp de la medianoche de hace (daysLimit - 1) días
    const dateLimit = new Date(now);
    dateLimit.setDate(dateLimit.getDate() - (daysLimit - 1));
    dateLimit.setHours(0, 0, 0, 0);
    const timestampLimit = dateLimit.getTime();
    // Filtrar el array conservando solo los elementos recientes
    const cleanedList = list.filter(item => {
        let timestamp;
        // Si el item es un número, se considera directamente un timestamp
        if (typeof item === 'number') {
            timestamp = item;
        }
        // Si el item es un objeto con propiedad timestamp numérica, usamos esa propiedad
        else if (typeof item === 'object' && item !== null && typeof item.timestamp === 'number') {
            timestamp = item.timestamp;
        }
        // Cualquier otro tipo de item se descarta
        else {
            return false;
        }
        // Conservar solo si el timestamp está dentro del rango permitido
        return timestamp >= timestampLimit;
    });
    console.log(`cleanTimestampsByAge: Original ${list.length}, Filtrado ${cleanedList.length} (límite: ${daysLimit} días).`);
    return cleanedList;
}



/**
 * Elimina las entradas más antiguas de un array de objetos { date, count }, conservando un número limitado de entradas recientes.
 * Útil para datos agregados por día.
 * Para ultimos_30_dias son 30 entradas
 * @param {Array<{ date: number, count: number }>} list Array de objetos con fecha (timestamp) y cantidad.
 * @param {number} countLimit La cantidad máxima de entradas a conservar (las más recientes).
 * @returns {Array<{ date: number, count: number }>} Un nuevo array con las entradas recientes, o el array original si no excede el límite.
 */
function cleanDailyDataByCount(list, countLimit) {
    // Asegurar que la entrada es un array
    if (!Array.isArray(list)) {
        console.warn('cleanDailyDataByCount recibió una entrada no válida (no es un array).');
        return [];
    }
    // Si el array no excede el límite, devolver una copia para evitar modificar el original in-place si se llama directamente
    if (list.length <= countLimit) {
        return [...list];
    }
    // Ordenar por fecha ascendente para identificar las entradas más antiguas
    const sortedList = [...list].sort((a, b) => (a.date || 0) - (b.date || 0));
    // Devolver las últimas countLimit entradas (las más recientes)
    const cleanedList = sortedList.slice(-countLimit);
    console.log(`cleanDailyDataByCount: Original ${list.length}, Limpiado ${cleanedList.length} (límite: ${countLimit} entradas).`);
    return cleanedList;
}



/**
* Elimina las entradas más antiguas de un array de objetos { year, week, date, count }, conservando un número limitado de entradas recientes.
* Útil para datos agregados por semana.
         
// Ordenar por año y luego por semana ascendente para identificar las entradas más antiguas.
// Nota: Esta ordenación es una aproximación; para una precisión perfecta con semanas que cruzan años,
// se necesitaría una lógica de ordenación más compleja o basarse directamente en el timestamp 'date'.
// Basándonos en la estructura { year, week }, ordenamos así:

/**
 * Recorta un array de objetos semanales conservando solo las 53 entradas más recientes según su campo `date`.
 * Útil para mantener un historial semanal limitado y ordenado.
 * Modificado de 52 a 53 para acomodar años con 53 semanas (años bisiestos y algunos otros) y simplificar la lógica del gráfico anual que usa un array de 53 posiciones (índices 0-52).
 *
 * @param {Array<{ year: number, week: number, date: number, count: number }>} list - Lista de objetos con año, semana, fecha (timestamp) y cantidad.
 * @returns {Array<{ year: number, week: number, date: number, count: number }>} Una nueva lista con hasta 53 entradas recientes ordenadas por fecha.
 */
function cleanWeeklyDataByCount(list) {
    // Verificar que la entrada sea un array
    if (!Array.isArray(list)) {
        console.warn('cleanWeeklyDataByCount recibió una entrada no válida (no es un array).');
        return [];
    }

    // Definir el nuevo límite de conservación
    const countLimit = 53;

    // Si la lista ya tiene countLimit elementos o menos, devolver una copia tal cual
    if (list.length <= countLimit) {
        console.log(`cleanWeeklyDataByCount: La lista tiene ${list.length} elementos (<= ${countLimit}). No se requiere limpieza. Devolviendo copia.`);
        return [...list];
    }

    // Filtrar objetos válidos con propiedad `date` numérica
    // Aunque sort y slice manejarían bien los inválidos, filtrarlos primero es más limpio.
    const validList = list.filter(item => typeof item === 'object' && item !== null && typeof item.date === 'number');
     console.log(`cleanWeeklyDataByCount: Entradas válidas encontradas: ${validList.length}.`);

    // Ordenar por fecha ascendente (más antiguos primero)
    const sortedList = [...validList].sort((a, b) => a.date - b.date);
     console.log('cleanWeeklyDataByCount: Lista ordenada por fecha ascendente.');

    // Tomar los últimos countLimit elementos (los más recientes)
    const cleanedList = sortedList.slice(-countLimit);
    console.log(`cleanWeeklyDataByCount: Original ${list.length}, Limpiado ${cleanedList.length} (últimas ${countLimit} entradas).`);

    return cleanedList; // Devolver la nueva lista recortada
}




/**
 * Limpia el array event.dailyTimestamps eliminando las entradas de días que tengan más de 7 días de antigüedad.
 * Se basa en la estructura de datos: { date: timestampInicioDelDia, timestamps: [timestamp1, timestamp2, ...] }.
 *
 * @param {object} eventData El objeto de evento que contiene el array dailyTimestamps.
 * @returns {Array<{ date: number, timestamps: number[] }>} Un nuevo array conteniendo solo las entradas de los últimos 7 días, o un array vacío si la entrada es inválida.
 */
function cleanDailyArrays(eventData) {
    console.log('Limpiando dailyTimestamps para evento:', eventData.nombre);
    // Validación: asegurar que eventData y eventData.dailyTimestamps existan y sean un array
    if (!eventData || !Array.isArray(eventData.dailyTimestamps)) {
        console.warn('cleanDailyArrays recibió una entrada no válida (eventData o dailyTimestamps no es un array).');
        return []; // Devolver un array vacío si la entrada no es válida
    }
    // Obtener la fecha actual
    const now = Date.now();
    // Calcular el timestamp de la medianoche de hace 7 días (inclusive hoy)
    // Para conservar 7 días (hoy + 6 días atrás), el límite es el inicio del día de hace 6 días.
    const dateLimit = new Date(now);
    dateLimit.setDate(dateLimit.getDate() - 6); // Retroceder 6 días desde hoy
    dateLimit.setHours(0, 0, 0, 0);
    const timestampLimit = dateLimit.getTime();
    // Filtrar el array conservando solo los elementos recientes (con fecha mayor o igual al límite)
    const cleanedList = eventData.dailyTimestamps.filter(dayEntry => {
        // Asegurarse de que la entrada del día es un objeto válido con una propiedad 'date' numérica
        if (typeof dayEntry === 'object' && dayEntry !== null && typeof dayEntry.date === 'number') {
            // Conservar si la fecha de la entrada es igual o posterior al límite
            return dayEntry.date >= timestampLimit;
        }
        return false; // Descartar entradas inválidas
    });
    console.log(`cleanDailyArrays: Original ${eventData.dailyTimestamps.length}, Filtrado ${cleanedList.length} (límite: últimos 7 días).`);
    return cleanedList; // Devolver el array filtrado
}



/**
 * Asegura que el array event.dailyTimestamps contenga entradas (incluso con arrays de timestamps vacíos) para los últimos 7 días.
 * Basado en la estructura de datos: { date: timestampInicioDelDia, timestamps: [timestamp1, timestamp2, ...] }.
 *
 * @param {object} eventData El objeto de evento que contiene el array dailyTimestamps.
 */
function ensureLast7DaysArrays(eventData) {
    console.log('Asegurando entradas para los últimos 7 días en dailyTimestamps para evento:', eventData.nombre);
    // Validación: asegurar que eventData y eventData.dailyTimestamps existan o inicializar dailyTimestamps si no es un array
    if (!eventData) {
        console.warn('ensureLast7DaysArrays recibió una entrada no válida (eventData es nulo/undefined).');
        return;
    }
    if (!Array.isArray(eventData.dailyTimestamps)) {
        console.warn('eventData.dailyTimestamps no es un array, inicializando a array vacío.');
        eventData.dailyTimestamps = [];
    }
    // Obtener la fecha actual
    const now = Date.now();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0); // Inicio de hoy

    // Generar los timestamps de inicio de día para los últimos 7 días
    const last7DaysTimestamps = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i); // Retroceder i días desde hoy
        last7DaysTimestamps.push(date.getTime());
    }

    // Iterar sobre los últimos 7 días y asegurar que existe una entrada
    last7DaysTimestamps.forEach(dayTimestamp => {
        const existingEntry = eventData.dailyTimestamps.find(entry => entry.date === dayTimestamp);
        if (!existingEntry) {
            // Si no existe una entrada para este día, añadir una nueva con timestamps vacíos
            eventData.dailyTimestamps.push({
                date: dayTimestamp
                , timestamps: []
            });
            console.log(`Añadida entrada vacía para el día con timestamp: ${dayTimestamp}`);
        }
    });
    // Ordenar el array por fecha ascendente para mantener la consistencia
    eventData.dailyTimestamps.sort((a, b) => a.date - b.date);
    console.log('dailyTimestamps después de asegurar y ordenar:', eventData.dailyTimestamps);
}



//---------------------------------------------------//
// 8. Funciones de contraste de textos:
//---------------------------------------------------//

/**
 * Invierte un color hexadecimal (ej: de #RRGGBB a #R'G'B') para mejorar el contraste.
 * Calcula si el color original es claro u oscuro y devuelve un color que sea más legible sobre él.
 * Devuelve #000000 (negro) para colores claros y #FFFFFF (blanco) para colores oscuros.
 *
 * @param {string} hex Color hexadecimal en formato '#RRGGBB'.
 * @returns {string|null} Color de texto inverso ('#000000' o '#FFFFFF'), o null si el color de entrada es inválido.
 */
function invertColor(hex) {
    if (!hex || typeof hex !== 'string' || !/^#([0-9A-F]{3}){1,2}$/i.test(hex)) {
        console.warn('invertColor recibió un color hexadecimal inválido:', hex);
        return null; // Retorna null si el color no es un hex válido
    }
    // Eliminar el '#'
    hex = hex.replace('#', '');
    // Si es formato corto (e.g., #abc), expandir a formato largo (e.g., #aabbcc)
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    // Convertir a valores RGB decimales
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    // Calcular el brillo percibido del color usando la fórmula Luma (considerando gamma)
    // Fórmula: L = 0.2126*R + 0.7152*G + 0.0722*B (donde R, G, B están normalizados de 0 a 1)
    const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    // Un umbral común para decidir entre texto blanco y negro es 0.5.
    // Si el brillo es mayor que el umbral, el color es claro y necesitamos texto oscuro.
    // Si el brillo es menor o igual al umbral, el color es oscuro y necesitamos texto claro.
    const threshold = 0.5;
    // Devolver blanco o negro según el brillo
    const textColor = luma > threshold ? '#000000' : '#FFFFFF'; // Negro para colores claros, Blanco para colores oscuros
    console.log(`Color original: ${hex}, Luma: ${luma.toFixed(2)}, Color de texto sugerido: ${textColor}`);
    return textColor;
}



/**
 * Calcula un color de texto con buen contraste usando una paleta de colores vivos.
 *
 * @param {string} hexColor - Color de fondo en formato hexadecimal (#RRGGBB o #RGB).
 * @returns {string|null} Color de texto sugerido en formato hexadecimal (#RRGGBB), o null si error.
 */
function invertirColor(hexColor) {
    if (!hexColor || typeof hexColor !== 'string') return null;
    let hex = hexColor.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('')
        .map(c => c + c)
        .join('');
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const bg = [r, g, b];
    function luminancia(r, g, b) {
        const a = [r, g, b].map(v => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
    }
    function contraste(rgb1, rgb2) {
        const L1 = luminancia(...rgb1);
        const L2 = luminancia(...rgb2);
        const brightest = Math.max(L1, L2);
        const darkest = Math.min(L1, L2);
        return (brightest + 0.05) / (darkest + 0.05);
    }
    const palette = [
        '#FF5722', '#4CAF50', '#2196F3',
        '#9C27B0', '#FFC107', '#00BCD4',
        '#E91E63', '#8BC34A', '#FF9800',
        '#3F51B5', '#03A9F4', '#CDDC39'
    ];
    function hexToRgb(hex) {
        hex = hex.replace(/^#/, '');
        return [
            parseInt(hex.slice(0, 2), 16),
            parseInt(hex.slice(2, 4), 16),
            parseInt(hex.slice(4, 6), 16)
        ];
    }
    let bestColor = null;
    let bestContrast = 0;
    for (const color of palette) {
        const rgb = hexToRgb(color);
        const c = contraste(bg, rgb);
        if (c > bestContrast) {
            bestContrast = c;
            bestColor = rgb;
        }
    }
    if (!bestColor || bestContrast < 4.5) {
        bestColor = luminancia(...bg) < 0.5 ? [255, 255, 255] : [0, 0, 0];
    }
    // Convertir a #RRGGBB
    return '#' + bestColor.map(c => c.toString(16)
            .padStart(2, '0'))
        .join('')
        .toUpperCase();
}





//---------------------------------------------------//
// 9. Funciones relacionadas con preferencias de usuario (carga en UI):
//---------------------------------------------------//

// Función para aplicar las preferencias de usuario guardadas
function applyPreferences() {
    console.log('Aplicando preferencias de usuario...');
    console.log('applyPreferences ejecutada');
    // Obtener la referencia al elemento raíz del documento (<html>)
    const rootElement = document.documentElement;
    // Verificar si userPreferences existe en appState y si es un objeto válido
    if (appState.userPreferences && typeof appState.userPreferences === 'object') {
        // Obtener los valores guardados o usar valores por defecto
        const colorDeCabecera = appState.userPreferences["header-color-input"] || '#007BFF';
        console.log('Valor de background-color-input en applyPreferences:', appState.userPreferences["background-color-input"]);
        const colorDeFondo = appState.userPreferences["background-color-input"] || '#F8F9FA';
        const colorDeTitulo = appState.userPreferences["title-color-input"] || '#343A40';
        const tipoDeFuente = appState.userPreferences["font-type-select"] || 'Arial, sans-serif';
        // Aplicar colores de cabecera, fondo y título
        console.log('Aplicando color de cabecera:', colorDeCabecera);
        if (appState.userPreferences["header-color-input"]) rootElement.style.setProperty('--header-bg-color', colorDeCabecera);
        console.log('Aplicando color de fondo:', colorDeFondo);
        if (appState.userPreferences["background-color-input"]) rootElement.style.setProperty('--app-bg-color', colorDeFondo);
        console.log('Aplicando color de título:', colorDeTitulo);
        if (appState.userPreferences["title-color-input"]) rootElement.style.setProperty('--title-color', colorDeTitulo);
        // Aplicar tipo de fuente
        console.log('Aplicando fuente:', tipoDeFuente);
        if (appState.userPreferences["font-type-select"]) rootElement.style.setProperty('--event-name-font', tipoDeFuente);
        // --- Aplicar colores de texto dinámicos basados en colores de fondo y cabecera ---
        // Calcular color de texto para cabeceras/títulos (basado en el color de cabecera)
        const headerTextColor = invertirColor(colorDeCabecera);
        if (headerTextColor) {
            rootElement.style.setProperty('--header-text-color', headerTextColor);
            console.log('Aplicando color de texto de cabecera dinámico:', headerTextColor);
        } else {
            console.warn('No se pudo calcular el color de texto de cabecera dinámico. Usando por defecto o el último válido.');
        }
        // Calcular color de texto para el cuerpo (basado en el color de fondo)
        const bodyTextColor = invertirColor(colorDeFondo);
        if (bodyTextColor) {
            rootElement.style.setProperty('--body-text-color', bodyTextColor);
            console.log('Aplicando color de texto de cuerpo dinámico:', bodyTextColor);
        } else {
            console.warn('No se pudo calcular el color de texto de cuerpo dinámico. Usando por defecto o el último válido.');
        }
        // --- Fin aplicación de colores de texto dinámicos ---
    }
}



// Función para cargar los valores de preferencias desde appState en los inputs de la pantalla de personalización
function loadPreferencesIntoInputs() {
    console.log('Cargando preferencias desde appState en los inputs de personalización...');

    const headerColorInput = document.getElementById('header-color-input');
    const backgroundColorInput = document.getElementById('background-color-input');
    const titleColorInput = document.getElementById('title-color-input');
    const fontTypeSelect = document.getElementById('font-type-select');

    // Verificar si el objeto appState y userPreferences existen y son válidos
    // Esta verificación inicial es útil por si acaso
    if (appState && typeof appState.userPreferences === 'object') {

        // Asignar los valores de appState.userPreferences a los inputs
        // Ya no usamos '|| fallback_literal' porque setupAppState ya manejó los fallbacks
        if (headerColorInput && appState.userPreferences["header-color-input"] !== undefined) {
             headerColorInput.value = appState.userPreferences["header-color-input"];
        }
        if (backgroundColorInput && appState.userPreferences["background-color-input"] !== undefined) {
            backgroundColorInput.value = appState.userPreferences["background-color-input"];
        }
        if (titleColorInput && appState.userPreferences["title-color-input"] !== undefined) {
            titleColorInput.value = appState.userPreferences["title-color-input"];
        }
        if (fontTypeSelect && appState.userPreferences["font-type-select"] !== undefined) {
            fontTypeSelect.value = appState.userPreferences["font-type-select"];
        }

        console.log('Valores de preferencia cargados en los inputs.');
    } else {
        console.warn('appState o appState.userPreferences no son válidos. No se cargaron preferencias en los inputs.');
    }
}



/**
 * Limpia completamente el localStorage y luego reinicializa el estado de la aplicación
 * cargando la estructura por defecto y guardándola en localStorage.
 * Aplica los estilos por defecto y luego redirige a la pantalla principal.
 */
function resetAppStateAndClearStorage() {
    console.log('Limpiando localStorage y reinicializando estado de la aplicación...');
    // Limpiar todo el contenido de localStorage
    localStorage.clear();
    console.log('localStorage limpiado. Recargando la página para aplicar el estado por defecto...');
    window.location.reload();
}





//---------------------------------------------------//
// 10. Funciones de fabricación de eventos:
//---------------------------------------------------//

// Función auxiliar para crear el elemento HTML de un solo evento a partir de un objeto de evento.
function createEventElement(eventData) {
    // Crear el contenedor principal del evento
    const eventContainer = document.createElement('div');
    eventContainer.classList.add('event-container');
    // Asignar un atributo data-id para referenciar el evento de appState
    eventContainer.dataset.eventId = eventData.id;
    // --- Calcular y aplicar el color de texto inverso ---
    let textColor = '#000000'; // Color de texto por defecto (negro)
    const eventColor = eventData.color;
    // Validar el color del evento y calcular el color de texto inverso
    if (eventColor && typeof eventColor === 'string' && eventColor.startsWith('#')) {
        const inverted = invertColor(eventColor);
        if (inverted !== null) {
            textColor = inverted;
            console.log(`Color de texto calculado para ${eventData.nombre}: ${textColor}`);
        } else {
            console.warn(`Color de evento inválido para invertir: ${eventColor}. Usando color de texto por defecto: ${textColor}`);
        }
    } else {
        console.warn(`Color de evento no válido o faltante para ${eventData.nombre}: ${eventColor}. Usando color de texto por defecto: ${textColor}`);
    }
    // Establecer el color de fondo del evento
    // Verificar si eventData.color existe y es válido, si no, usar un color por defecto
    eventContainer.style.backgroundColor = eventData.color && typeof eventData.color === 'string' ? eventData.color : '#f9f9f9';
    // --- Crear Columnas y sus contenidos ---
    // Columna Izquierda: Botón de Incremento
    const leftColumn = document.createElement('div');
    leftColumn.classList.add('event-column', 'left-column');
    const incrementButton = document.createElement('button');
    incrementButton.classList.add('increment-button');
    incrementButton.textContent = '+';
    leftColumn.appendChild(incrementButton);
    // Columna Central: Nombre y Contadores
    const centerColumn = document.createElement('div');
    centerColumn.classList.add('event-column', 'center-column');
    // Fila Superior: Nombre del Evento
    const eventNameRow = document.createElement('div');
    eventNameRow.classList.add('event-row', 'event-name');
    const eventNamePara = document.createElement('p');
    // Usar el nombre del objeto de evento, con un valor por defecto si no existe
    eventNamePara.textContent = eventData.nombre || 'Evento sin nombre';
    // Aplicar el color de texto calculado al nombre del evento
    eventNamePara.style.color = textColor;
    eventNameRow.appendChild(eventNamePara);
    // Fila Inferior: Contadores
    const countersContainer = document.createElement('div');
    countersContainer.classList.add('event-row', 'counters-container');
    // Contador Histórico
    const histCounterItem = document.createElement('div');
    histCounterItem.classList.add('counter-item');
    // Usar el contador_historico del objeto de evento, con 0 si no existe
    histCounterItem.innerHTML = `
         <p>Hist: <span class="counter-value">${eventData.contador_historico || 0}</span></p>`;
    const histPara = histCounterItem.querySelector('p');
    if (histPara) histPara.style.color = textColor; // Aplicar color al párrafo Hist
    // Aplicar el color de texto calculado al contador histórico
    const histCounterSpan = histCounterItem.querySelector('.counter-value');
    if (histCounterSpan) histCounterSpan.style.color = textColor;
    // Contador Ayer
    const ayerCounterItem = document.createElement('div');
    ayerCounterItem.classList.add('counter-item');
    // Por ahora, mostramos 0 ya que no calculamos Ayer de los arrays de días
    ayerCounterItem.innerHTML = `
            <p>Ayer: <span class="counter-value">0</span></p>`;
    const ayerPara = ayerCounterItem.querySelector('p');
    if (ayerPara) ayerPara.style.color = textColor; // Aplicar color al párrafo Ayer
    // Aplicar el color de texto calculado al contador de Ayer
    const ayerCounterSpan = ayerCounterItem.querySelector('.counter-value');
    if (ayerCounterSpan) ayerCounterSpan.style.color = textColor;
    // Contador Hoy
    const hoyCounterItem = document.createElement('div');
    hoyCounterItem.classList.add('counter-item');
    // Por ahora, mostramos 0 ya que no calculamos Hoy de los arrays de días
    hoyCounterItem.innerHTML = `
            <p>Hoy: <span class="counter-value">0</span></p>`;
    const hoyPara = hoyCounterItem.querySelector('p');
    if (hoyPara) hoyPara.style.color = textColor; // Aplicar color al párrafo Hoy
    // Aplicar el color de texto calculado al contador de Hoy
    const hoyCounterSpan = hoyCounterItem.querySelector('.counter-value');
    if (hoyCounterSpan) hoyCounterSpan.style.color = textColor;
    countersContainer.appendChild(histCounterItem);
    countersContainer.appendChild(ayerCounterItem);
    countersContainer.appendChild(hoyCounterItem);
    centerColumn.appendChild(eventNameRow);
    centerColumn.appendChild(countersContainer);
    // Columna Derecha: Checkbox de Selección
    const rightColumn = document.createElement('div');
    rightColumn.classList.add('event-column', 'right-column');
    const selectCheckbox = document.createElement('input');
    selectCheckbox.setAttribute('type', 'checkbox');
    selectCheckbox.classList.add('select-checkbox');
    // El estado checked se manejará más adelante con eventData.seleccionado
    rightColumn.appendChild(selectCheckbox);
    // Añadir todas las columnas al contenedor principal del evento
    eventContainer.appendChild(leftColumn);
    eventContainer.appendChild(centerColumn);
    eventContainer.appendChild(rightColumn);
    return eventContainer; // Devolver el elemento HTML completo
}





//---------------------------------------------------//
// 11. Funciones para generar los graficos:
//---------------------------------------------------//



/**
 * Calcula el ancho ideal de un canvas de gráfico basado en el tipo de gráfico,
 * el número de eventos seleccionados y el espacio mínimo deseado por elemento (día/semana).
 * Determina si el gráfico debe mostrarse con su ancho ideal o ajustado al ancho de referencia de la pantalla.
 * Guarda el resultado (idealWidthPx y isIdealScaleActive) en el objeto chartsConfig.
 *
 * @param {string} chartId - La ID del canvas ('chart1', 'chart2', 'chart3').
 * @param {string} chartType - El tipo de gráfico ('7days', '30days', 'yearly').
 * @param {number} selectedEventsCount - La cantidad de eventos seleccionados.
 */
function preparadorCanvas(chartId, chartType, selectedEventsCount) {
    console.log(`Iniciando preparadorCanvas para ${chartId}. Tipo: ${chartType}, Eventos seleccionados: ${selectedEventsCount}, Ancho referencia: ${anchoPantallaReferencia}px.`);

    const config = chartsConfig[chartId];
    if (!config) {
        console.error(`Configuración no encontrada para el gráfico con ID: ${chartId}.`);
        return;
    }

    // Obtener el espacio base por elemento (día o semana) desde la configuración integrada.
    const minSpaceX = config.minSpaceX;
    console.log(`Espacio mínimo por elemento (minSpaceX) para ${chartId}: ${minSpaceX}px.`);

         // Determinar el número de elementos en el eje X (días o semanas)

    let numberOfElements = 0;

    // Determinar el número de elementos en el eje X para el cálculo del ancho ideal.
    // Para Scatter (7 días), el número de elementos es siempre 7 (los días de la semana).
    // Para Barras (30 días), el número de elementos es siempre 30 (los días).
    // Para Barras Semanales (Año), el número de elementos es siempre 53 (las semanas).
    // El cálculo del ancho ideal no depende del número de eventos seleccionados,
    // sino del número fijo de categorías en el eje X para ese tipo de gráfico.
   
   
 let idealWidth = 0;
         // El basePadding se considerará implícitamente en el cálculo basado en minSpaceX o añadido como un margen final.
         // Mantengamos una variable para márgenes finales si es necesario, pero el cálculo principal se centra en el espacio por elemento.
         let finalMargin = 0; // Margen final después del cálculo basado en elementos/eventos

       
         switch (chartType) {
            case '7days':
                numberOfElements = 7;
                finalMargin = 150; // Margen estimado para ejes y padding para Scatter
                console.log(`[preparadorCanvas] Tipo Scatter (7 días). Número de elementos en eje X: ${numberOfElements}.`);
                // Para Scatter, el ancho ideal se calcula como el espacio necesario por *día* (que depende de #eventos) * 7 días + margen.
                 const espacioNecesarioPorDiaScatter = minSpaceX * Math.max(1, selectedEventsCount); // Mínimo minSpaceX por día
                 idealWidth = (espacioNecesarioPorDiaScatter * numberOfElements) + finalMargin;
                 console.log(`[preparadorCanvas] Cálculo ideal Scatter: (${espacioNecesarioPorDiaScatter} * ${numberOfElements}) + ${finalMargin} = ${idealWidth}px.`);
                break;
            case '30days':
                numberOfElements = 30;
                finalMargin = 100; // Margen estimado para ejes y padding para Barras
                 console.log(`[preparadorCanvas] Tipo Barras (30 días). Número de elementos en eje X: ${numberOfElements}.`);
                // Para Barras, el ancho ideal se calcula como el espacio necesario por *día* (que depende de #eventos) * 30 días + margen.
                 const espacioNecesarioPorDiaBarras30 = minSpaceX * Math.max(1, selectedEventsCount); // Mínimo minSpaceX por día
                 idealWidth = (espacioNecesarioPorDiaBarras30 * numberOfElements) + finalMargin;
                 console.log(`[preparadorCanvas] Cálculo ideal Barras (30 días): (${espacioNecesarioPorDiaBarras30} * ${numberOfElements}) + ${finalMargin} = ${idealWidth}px.`);
                break;
            case 'yearly':
                numberOfElements = 53; // 53 semanas
                finalMargin = 100; // Margen estimado para ejes y padding para Barras
                 console.log(`[preparadorCanvas] Tipo Barras (Año). Número de elementos en eje X: ${numberOfElements}.`);
                // Para Barras Semanales, el ancho ideal se calcula como el espacio necesario por *semana* (que depende de #eventos) * 53 semanas + margen.
                 const espacioNecesarioPorSemanaBarrasAño = minSpaceX * Math.max(1, selectedEventsCount); // Mínimo minSpaceX por semana
                 idealWidth = (espacioNecesarioPorSemanaBarrasAño * numberOfElements) + finalMargin;
                 console.log(`[preparadorCanvas] Cálculo ideal Barras (Año): (${espacioNecesarioPorSemanaBarrasAño} * ${numberOfElements}) + ${finalMargin} = ${idealWidth}px.`);
                break;
            default:
                console.warn(`[preparadorCanvas] Tipo de gráfico desconocido: ${chartType} para ${chartId}. Usando ancho de referencia como fallback seguro.`);
                idealWidth = anchoPantallaReferencia; // Usar ancho de referencia como fallback seguro
                 numberOfElements = 0; // No aplica cálculo basado en elementos desconocidos.
                break;
        }

        // Asegurar un ancho mínimo absoluto para evitar gráficos demasiado pequeños.
 //       const MIN_CHART_WIDTH_PX = 400; // Sugerencia de valor mínimo.
 //       idealWidth = Math.max(idealWidth, MIN_CHART_WIDTH_PX);

        // Asegurar un ancho máximo absoluto de seguridad para evitar valores excesivamente grandes.
        const MAX_CHART_WIDTH_PX = 5000; // Sugerencia de valor máximo.
        idealWidth = Math.min(idealWidth, MAX_CHART_WIDTH_PX);

        // Almacenar el ancho ideal calculado (redondeado al píxel entero).
        config.idealWidthPx = Math.floor(idealWidth);
        console.log(`[preparadorCanvas] Ancho ideal calculado y limitado para ${chartId}: ${config.idealWidthPx}px.`);

        // Comparar el ancho ideal con el ancho de referencia de la pantalla para determinar el estado inicial de escala.
        // Usamos la escala ideal si el ancho ideal es mayor o igual al ancho de referencia de la pantalla.
        // Esto permite el scroll horizontal cuando el contenido excede el ancho visible.
        config.isIdealScaleActive = config.idealWidthPx <= anchoPantallaReferencia;

        console.log(`[preparadorCanvas] Decisión de escala para ${chartId}: Ideal (${config.idealWidthPx}px) vs Referencia (${anchoPantallaReferencia}px). isIdealScaleActive = ${config.isIdealScaleActive}`);

        console.log(`[preparadorCanvas] Finalizado preparadorCanvas para ${chartId}.`);

}











/**
 * Prepara los datasets y las etiquetas del eje X para el gráfico Scatter de 7 días.
 * Genera puntos Scatter donde la coordenada X representa el día de la semana (0-6)
 * y la coordenada Y representa el segundo ajustado del día en que ocurrió el incremento.
 * La lógica de ajuste de segundos evita la superposición de puntos si múltiples
 * incrementos ocurren en el mismo segundo del día. Cuando hay múltiples eventos seleccionados,
 * los puntos para cada evento en el mismo día se distribuyen horizontalmente para evitar la superposición
 * de columnas de puntos del mismo día de diferentes eventos.
 *
 * @param {Array<object>} selectedEvents - Array de objetos de evento seleccionados.
 * @returns {{datasets: Array<object>, labels: Array<string>}} Objeto con los datasets para Chart.js y las etiquetas del eje X.
 */
function prepareSevenDaysDatasets(selectedEvents) {
    console.log('Preparando datos para el gráfico de 7 días (Scatter)...');

    const datasets = [];
    let labels = [];

    // Array con los nombres abreviados de los días de la semana para el eje X fijo
    const fixedDayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

    // Si no hay eventos seleccionados, retornamos arrays vacíos
    if (!Array.isArray(selectedEvents) || selectedEvents.length === 0) {
        console.log('No hay eventos seleccionados para el gráfico de 7 días. Retornando datos vacíos.');
        // Dejamos las labels fijas para que el eje X se muestre correctamente si no hay datos.
        return {
            datasets: [],
            labels: fixedDayLabels
        };
    }

    const totalEvents = selectedEvents.length;
    // Ancho total dentro de cada categoría de día para distribuir los puntos de los eventos.
    // Un valor de 1 ocuparía todo el espacio entre categorías. 0.8 deja un pequeño margen.
    const distributionWidth = 0.8; // Usamos un ancho de 0.8 para dejar un pequeño espacio entre días/categorías


    // Determinar las labels del eje X
    if (totalEvents === 1) {
        // Si solo hay un evento, usamos las fechas reales de los últimos 7 días de ese evento como labels.
        const singleEvent = selectedEvents[0];
        if (Array.isArray(singleEvent.dailyTimestamps)) {
             // Ordenar dailyTimestamps por fecha ascendente para asegurar el orden correcto de las labels
            const sortedDaily = [...singleEvent.dailyTimestamps].sort((a, b) => (a.date || 0) - (b.date || 0));
            labels = sortedDaily.map(dayEntry => {
                if (typeof dayEntry === 'object' && dayEntry !== null && typeof dayEntry.date === 'number') {
                    const date = new Date(dayEntry.date);
                    // Formatear como "NombreDía Número MesAbreviado" (ej: "Lun 8 ene")
                    const options = { weekday: 'short', day: 'numeric', month: 'short' };
                    const dateParts = date.toLocaleDateString('es-ES', options).split(' ');
                    const dayAbbrev = dateParts[0].charAt(0).toUpperCase() + dateParts[0].slice(1).replace('.', ''); // "Lun"
                    const dayNum = dateParts[1]; // "8"
                    const monthAbbrev = dateParts[2].replace('.', ''); // "ene"
                    return `${dayAbbrev} ${dayNum} ${monthAbbrev}`;
                }
                return ''; // Retorna cadena vacía para entradas inválidas
            });
             console.log('Labels generadas para un solo evento (7 días):', labels);

             // Si por alguna razón no se generaron exactamente 7 labels, usamos las fijas como fallback.
             if (labels.length !== 7) {
                  console.warn(`Se generaron ${labels.length} labels (esperado 7) para el gráfico de 7 días con un solo evento. Usando labels fijas como fallback.`);
                  labels = fixedDayLabels;
             }


        } else {
             console.warn(`dailyTimestamps no es un array para el único evento seleccionado (${singleEvent.nombre}). Usando labels fijas para 7 días.`);
             labels = fixedDayLabels; // Usar labels fijas si dailyTimestamps no es válido
        }
    } else {
        // Si hay múltiples eventos seleccionados, usamos los nombres abreviados de los días de la semana como labels fijas.
        labels = fixedDayLabels;
         console.log('Labels fijas usadas para múltiples eventos (7 días):', labels);
    }


    // --- Preparar los datasets para cada evento seleccionado ---
    // Usamos el índice `eventIndex` del bucle forEach para calcular el desplazamiento horizontal.
    selectedEvents.forEach((eventData, eventIndex) => {
        // Asegurarse de que dailyTimestamps es un array
        if (!Array.isArray(eventData.dailyTimestamps)) {
             console.warn(`dailyTimestamps no es un array para el evento ${eventData.nombre}. Saltando la creación del dataset para este evento.`);
             return; // Saltar este evento si dailyTimestamps no es válido
        }

        // Calcular el desplazamiento horizontal (offsetX) para este evento específico AHORA,
        // antes de iterar sobre los días y timestamps. Este valor es constante para todos
        // los puntos de este evento en este gráfico.
        let eventOffsetX = 0; // Inicializamos a 0
        if (totalEvents > 1) {
             // Calculamos el desplazamiento solo si hay más de un evento.
             // La fórmula distribuye los eventos equitativamente dentro del `distributionWidth`
             // centrado alrededor del índice del día.
             // (eventIndex - (totalEvents - 1) / 2): Posición relativa del evento (-N/2 a N/2)
             // (distributionWidth / totalEvents): Espacio horizontal asignado a cada evento
            eventOffsetX = (eventIndex - (totalEvents - 1) / 2) * (distributionWidth / totalEvents);
             console.log(`Evento ${eventData.nombre} (índice ${eventIndex}) tiene un desplazamiento horizontal (eventOffsetX) de: ${eventOffsetX.toFixed(4)}`);
        } else {
            // Si solo hay un evento, eventOffsetX permanece 0, lo que centra los puntos en la categoría del día.
             console.log(`Evento ${eventData.nombre} (índice ${eventIndex}) es el único evento. eventOffsetX es 0 (centrado).`);
        }


        const dataset = {
            label: eventData.nombre || 'Evento sin nombre', // Nombre del evento como etiqueta del dataset
            backgroundColor: eventData.color || '#007BFF', // Color del evento
            borderColor: eventData.color || '#007BFF', // Color del borde
            data: [], // Aquí almacenaremos los puntos { x, y }
            pointRadius: 5, // Tamaño de los puntos
            pointHoverRadius: 7, // Tamaño de los puntos al pasar el ratón
            showLine: false, // No dibujar línea entre los puntos (es un Scatter)
            type: 'scatter' // Especificar tipo de gráfico como Scatter
        };

        // Ordenar dailyTimestamps por fecha ascendente para asegurar el orden de los días
        const sortedDaily = [...eventData.dailyTimestamps].sort((a, b) => (a.date || 0) - (b.date || 0));

        // Iterar sobre los últimos 7 días en el orden correcto (del más antiguo al más reciente de los 7)
        // Usamos el índice `dayIndex` (0-6) para la categoría del día en el gráfico.
        sortedDaily.forEach((dayEntry, dayIndex) => {
             // Validar la entrada diaria
             if (typeof dayEntry !== 'object' || dayEntry === null || typeof dayEntry.date !== 'number' || !Array.isArray(dayEntry.timestamps)) {
                  console.warn(`Entrada diaria inválida encontrada en dailyTimestamps para el evento ${eventData.nombre} en el día ${dayIndex}:`, dayEntry);
                  return; // Saltar esta entrada si es inválida
             }

            // Transformar timestamps a segundos enteros del día
            // Usamos la fecha de la entrada dailyTimestamps (dayEntry.date) como el inicio del día para calcular segundos relativos.
            const dayStartTime = dayEntry.date;
            const secondsConverted = dayEntry.timestamps.map(timestamp => {
                // Validar que el timestamp individual es un número
                if (typeof timestamp === 'number') {
                    // Calcular la diferencia en milisegundos y convertir a segundos enteros
                    return Math.floor((timestamp - dayStartTime) / 1000);
                }
                console.warn(`Timestamp individual inválido encontrado en dailyTimestamps para el evento ${eventData.nombre} (fecha ${new Date(dayEntry.date).toLocaleDateString()}) en el día ${dayIndex}:`, timestamp);
                return -1; // Usar un valor inválido para descartar
            }).filter(second => second >= 0 && second < 86400); // Filtrar timestamps inválidos y fuera de rango (0 a 86399 segundos)

             // Ordenar los segundos convertidos dentro del día ascendentemente
             secondsConverted.sort((a, b) => a - b);

            // Aplicar lógica de ajuste para evitar colisiones internas en el eje Y (segundos del día)
            const secondsAdjustedDay = [];
            let ultimoSegundoAsignado = -1; // Mantenemos el último segundo asignado para este DÍA específico

            secondsConverted.forEach(segundoConvertidoActual => {
                 // La validación de rango ya se hizo en el filter anterior.
                 // Ahora solo aplicamos el ajuste.

                // Asegurar que el segundo ajustado sea al menos 1 unidad mayor que el último segundo asignado
                // para este día específico (colisiones internas en el mismo día).
                // Math.max asegura que si no hay colisión (segundoConvertidoActual es > ultimoSegundoAsignado),
                // usamos el segundo original, de lo contrario, usamos ultimoSegundoAsignado + 1.
                let segundoAjustado = Math.max(segundoConvertidoActual, ultimoSegundoAsignado + 1);

                secondsAdjustedDay.push(segundoAjustado);
                ultimoSegundoAsignado = segundoAjustado; // Actualizar el último segundo asignado para el próximo punto de este día
            });

            // Añadir los puntos ajustados al array data del dataset
            secondsAdjustedDay.forEach(segundoAjustado => {
                const coordenadaY = segundoAjustado; // La coordenada Y es el segundo ajustado del día

                // La coordenada X es el índice de la categoría del día (dayIndex) más el desplazamiento
                // horizontal calculado para este evento específico (eventOffsetX).
                const coordenadaX = dayIndex + eventOffsetX;


                dataset.data.push({
                    x: coordenadaX,
                    y: coordenadaY
                });
                 // console.log(`Añadido punto para ${eventData.nombre} (índice ${eventIndex}) en día ${dayIndex}: {x: ${coordenadaX.toFixed(4)}, y: ${coordenadaY}}`); // Log detallado de puntos
            });
        });

        datasets.push(dataset); // Añadir el dataset del evento al array de datasets
    });

    console.log('Datos preparados para el gráfico de 7 días:', { datasets, labels });
    return {
        datasets: datasets,
        labels: labels
    };
}




/**
 * Prepara los datasets y las etiquetas del eje X para el gráfico de Barras de 30 días.
 * Agrega los recuentos diarios de ultimos_30_dias para cada evento y genera
 * un array de datos (counts) que corresponde a los últimos 30 días globales.
 *
 * @param {Array<object>} selectedEvents - Array de objetos de evento seleccionados.
 * @returns {{datasets: Array<object>, labels: Array<string>}} Objeto con los datasets para Chart.js y las etiquetas del eje X.
 */
function prepareThirtyDaysDatasets(selectedEvents) {
    console.log('Preparando datos para el gráfico de 30 días (Barras)...');

    const datasets = [];
    let labels = [];

    // Si no hay eventos seleccionados, retornamos arrays vacíos
    if (!Array.isArray(selectedEvents) || selectedEvents.length === 0) {
        console.log('No hay eventos seleccionados para el gráfico de 30 días. Retornando datos vacíos.');
        return {
            datasets: [],
            labels: []
        };
    }

    // --- Determinar el Período Global de 30 Días ---
    let maxDate = 0; // Usaremos timestamp para encontrar la fecha más reciente

    // Encontrar la fecha más reciente entre todos los ultimos_30_dias de los eventos seleccionados
    selectedEvents.forEach(eventData => {
        if (Array.isArray(eventData.ultimos_30_dias)) {
            eventData.ultimos_30_dias.forEach(entry => {
                if (entry && typeof entry.date === 'number' && entry.date > maxDate) {
                    maxDate = entry.date;
                }
            });
        }
    });

    // Si no se encontró ninguna fecha (ej: ultimos_30_dias vacíos para todos los eventos), usar hoy como maxDate
    if (maxDate === 0) {
        maxDate = startOfDay(Date.now()); // Inicio de hoy
        console.warn('No se encontró fecha máxima en ultimos_30_dias. Usando hoy como referencia.');
    } else {
         // Asegurar que maxDate es el inicio del día para cálculos consistentes
         maxDate = startOfDay(maxDate);
    }


    // Calcular la fecha de inicio (startDate) del período global de 30 días
    // Retrocedemos 29 días desde maxDate para incluir 30 días (maxDate es el día 30)
    const startDateObj = new Date(maxDate);
    startDateObj.setDate(startDateObj.getDate() - 29);
    const startDate = startOfDay(startDateObj.getTime()); // Timestamp del inicio del día de inicio del período

    console.log(`Período global de 30 días: Inicio ${new Date(startDate).toLocaleDateString()} a Fin ${new Date(maxDate).toLocaleDateString()}`);

    // Crear un array de 30 timestamps de inicio de día para el período global (del más antiguo al más reciente)
    const globalThirtyDaysTimestamps = [];
    for (let i = 0; i < 30; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i); // Sumar i días al día de inicio
        globalThirtyDaysTimestamps.push(date.getTime());
    }
    // Asegurar que el array tiene exactamente 30 días. Si por alguna razón no, ajustar o advertir.
    if (globalThirtyDaysTimestamps.length !== 30) {
         console.error(`Error al generar los 30 timestamps globales. Cantidad: ${globalThirtyDaysTimestamps.length}`);
         // Podríamos lanzar un error o intentar corregir aquí, pero por ahora loggeamos el error.
         // Continuamos con los timestamps que se generaron.
    }

    // --- Determinar las labels del eje X (30 elementos) ---
    // Para cada día en el período global, obtener el nombre abreviado del día de la semana (ej: "Lun")
    // Usamos los timestamps globales para generar las labels en orden.
    labels = globalThirtyDaysTimestamps.map(dayTimestamp => {
        const date = new Date(dayTimestamp);
        // Obtener el nombre abreviado del día de la semana (ej: "Lun")
        const dayAbbrev = date.toLocaleDateString('es-ES', { weekday: 'short' });
         // Capitalizar la primera letra y quitar el punto si existe
        return dayAbbrev.charAt(0).toUpperCase() + dayAbbrev.slice(1).replace('.', '');
    });

     console.log('Labels generadas para 30 días:', labels);


    // --- Preparar los datasets para cada evento seleccionado ---
    selectedEvents.forEach(eventData => {
        // Asegurarse de que ultimos_30_dias es un array
        if (!Array.isArray(eventData.ultimos_30_dias)) {
             console.warn(`ultimos_30_dias no es un array para el evento ${eventData.nombre}. Saltando la creación del dataset para este evento.`);
             return; // Saltar este evento si ultimos_30_dias no es válido
        }


        const dataset = {
            label: eventData.nombre || 'Evento sin nombre', // Nombre del evento como etiqueta del dataset
            backgroundColor: eventData.color || '#007BFF', // Color del evento para las barras
            borderColor: eventData.color || '#007BFF', // Color del borde de las barras
            borderWidth: 1, // Ancho del borde de las barras
            data: Array(30).fill(0), // Inicializar el array de datos con 30 ceros
            type: 'bar' // Especificar tipo de gráfico como Barra
        };

        // Llenar el array `data` del dataset con los recuentos de ultimos_30_dias
        eventData.ultimos_30_dias.forEach(entry => {
            // Validar la entrada diaria
            if (entry && typeof entry.date === 'number') {
                // Encontrar el índice de la fecha de la entrada en el array de 30 timestamps del período global
                const entryDateStartOfDay = startOfDay(entry.date); // Asegurarse de comparar inicios de día
                const index = globalThirtyDaysTimestamps.findIndex(ts => ts === entryDateStartOfDay);

                // Si la fecha de la entrada está dentro del período global (se encontró un índice)
                if (index > -1 && index < 30) { // Asegurarse de que el índice es válido
                    // Asignar el recuento a la posición correcta en el array data del dataset
                    // Usamos el count del entry o 0 si no existe
                    dataset.data[index] = entry.count || 0;
                     // console.log(`Asignado count ${entry.count || 0} al índice ${index} para el día ${new Date(entryDateStartOfDay).toLocaleDateString()} del evento ${eventData.nombre}`); // Log detallado
                } else {
                     //console.warn(`Entrada en ultimos_30_dias fuera del período global de 30 días o con fecha inválida para el evento ${eventData.nombre}. Descartando:`, entry); // Advertencia si fuera del rango
                }
            } else {
                console.warn(`Entrada inválida en ultimos_30_dias para el evento ${eventData.nombre}. Descartando:`, entry); // Advertencia si la entrada es inválida
            }
        });

        datasets.push(dataset); // Añadir el dataset del evento al array de datasets
    });

    console.log('Datos preparados para el gráfico de 30 días:', { datasets, labels });

    return {
        datasets: datasets,
        labels: labels
    };
}



















/**
 * Prepara los datasets y etiquetas del eje X para el gráfico de Barras de un año (semanal).
 * 
 * ✅ Modo múltiples eventos:
 *  - Se muestran 53 barras correspondientes a las semanas 1 a 53.
 *  - Las etiquetas son fijas: "sem 1", "sem 2", ..., "sem 53".
 * 
 * ✅ Modo un solo evento:
 *  - Se ordenan los datos cronológicamente (por fecha).
 *  - Las etiquetas muestran la fecha de inicio de la semana: "08/feb", "15/feb", ...
 *  - Si faltan semanas, se rellenan con ceros al inicio para mantener 53 barras.
 * 
 * @param {Array<object>} selectedEvents - Array de eventos con datos semanales.
 * @returns {{datasets: Array<object>, labels: Array<string>}} Objeto con datasets y etiquetas.
 */
function prepareYearlyDatasets(selectedEvents) {
    console.log('Preparando datos para el gráfico del último año (Barras Semanales)...');

    const datasets = [];
    let labels = [];

    const fixedWeekLabels = Array.from({ length: 53 }, (_, i) => `sem ${i + 1}`);

    // Caso sin eventos
    if (!Array.isArray(selectedEvents) || selectedEvents.length === 0) {
        console.log('No hay eventos seleccionados. Retornando datos vacíos.');
        return { datasets: [], labels: fixedWeekLabels };
    }

    const totalEvents = selectedEvents.length;

    // --- MODO: UN SOLO EVENTO ---
    if (totalEvents === 1) {
        const singleEvent = selectedEvents[0];
        if (Array.isArray(singleEvent.ultimo_año) && singleEvent.ultimo_año.length > 0) {
            // Ordenar por fecha
            const sortedEntries = [...singleEvent.ultimo_año]
                .filter(e => typeof e.date === 'number')
                .sort((a, b) => a.date - b.date);

            const dataset = {
                label: singleEvent.nombre || 'Evento sin nombre',
                backgroundColor: singleEvent.color || '#007BFF',
                borderColor: singleEvent.color || '#007BFF',
                borderWidth: 1,
                data: [],
                type: 'bar'
            };

            // Generar labels y data ordenados
            sortedEntries.forEach(entry => {
                const date = new Date(entry.date);
                const day = date.getDate().toString().padStart(2, '0');
                const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
                const month = monthNames[date.getMonth()];
                labels.push(`${day}/${month}`);
                dataset.data.push(typeof entry.count === 'number' ? entry.count : 0);
            });

            // Rellenar hasta 53 entradas (desde el inicio con ceros)
            while (dataset.data.length < 53) {
                dataset.data.unshift(0);
                const missingIndex = 53 - dataset.data.length; // Índice faltante desde el principio
                labels.unshift(`sem ${missingIndex + 1}`); // Etiqueta por defecto con número de semana
            }

            datasets.push(dataset);
        } else {
            console.log(`Evento único sin datos válidos. Usando estructura vacía con etiquetas fijas.`);
            labels = fixedWeekLabels;
            datasets.push({
                label: singleEvent.nombre || 'Evento sin nombre',
                backgroundColor: singleEvent.color || '#007BFF',
                borderColor: singleEvent.color || '#007BFF',
                borderWidth: 1,
                data: Array(53).fill(0),
                type: 'bar'
            });
        }
    }
    // --- MODO: MÚLTIPLES EVENTOS ---
    else {
        labels = fixedWeekLabels;

        selectedEvents.forEach(eventData => {
            if (!Array.isArray(eventData.ultimo_año)) {
                console.warn(`ultimo_año no es un array para ${eventData.nombre}. Se omite.`);
                return;
            }

            const dataset = {
                label: eventData.nombre || 'Evento sin nombre',
                backgroundColor: eventData.color || '#007BFF',
                borderColor: eventData.color || '#007BFF',
                borderWidth: 1,
                data: Array(53).fill(0),
                type: 'bar'
            };

            eventData.ultimo_año.forEach(entry => {
                if (
                    typeof entry.week === 'number' &&
                    entry.week >= 1 && entry.week <= 53 &&
                    typeof entry.count === 'number'
                ) {
                    dataset.data[entry.week - 1] = entry.count;
                } else {
                    console.warn(`Entrada inválida para ${eventData.nombre}:`, entry);
                }
            });

            datasets.push(dataset);
        });
    }

    console.log('Datos preparados:', { datasets, labels });

    return { datasets, labels };
}


















/**
 * Configura y renderiza los tres gráficos Chart.js en los elementos canvas designados.
 * Destruye cualquier instancia de gráfico existente antes de crear nuevas para evitar duplicados.
 * Configura las opciones específicas para cada tipo de gráfico (Scatter y Barras),
 * incluyendo escalas, plugins de zoom y anotaciones iniciales para el gráfico Scatter.
 * La resolución interna del canvas se asume que ya ha sido ajustada por aplicarTamañoCanvas.
 *
 * @param {Array<object>} datasets7Days - Datasets para el gráfico de 7 días (Scatter).
 * @param {Array<string>} labels7Days - Etiquetas del eje X para el gráfico de 7 días.
 * @param {Array<object>} datasets30Days - Datasets para el gráfico de 30 días (Barras).
 * @param {Array<string>} labels30Days - Etiquetas del eje X para el gráfico de 30 días.
 * @param {Array<object>} datasetsYearly - Datasets para el gráfico del último año (Barras Semanales).
 * @param {Array<string>} labelsYearly - Etiquetas del eje X para el gráfico del último año.
 */

function renderAllCharts(datasets7Days, labels7Days, datasets30Days, labels30Days, datasetsYearly, labelsYearly) {
    console.log('Iniciando renderAllCharts.');

    const canvas1 = document.getElementById('chart1');
    const canvas2 = document.getElementById('chart2');
    const canvas3 = document.getElementById('chart3');



    if (!canvas1 || !canvas2 || !canvas3) {
        console.error('Uno o más elementos canvas no encontrados para renderizar gráficos.');
        return;
    }

     // La altura visual y la resolución interna ya deben estar ajustadas por aplicarTamañoCanvas.
     // NO ajustar tamaño aquí.

    // --- Chart 1: 7 días (Scatter) ---
    try {
        // Obtener la configuración y estado para chart1
        const chart1Config = chartsConfig['chart1'] || {};
        // Las labels para el gráfico Scatter se usan principalmente en el tooltip, no directamente en la escala X si es 'linear'.
        // Si el eje es 'category', las labels sí se usan para definir las categorías.
        const chart1Labels = labels7Days; // Usamos las labels generadas por prepareSevenDaysDatasets

        // Configurar el eje X: usar 'linear' con min/max si está en escala ideal, 'category' si está ajustado.
        // Esto permite que el eje X se expanda más allá del ancho de la pantalla en modo ideal.
        const chart1XScale = chart1Config.isIdealScaleActive ?
             {
                type: 'linear',
                min: -0.5, // Ajustar el mínimo para que el primer punto no esté pegado al borde izquierdo
                max: 6.5, // Ajustar el máximo para que el último punto no esté pegado al borde derecho
                title: { display: true, text: 'Día' },
                 // No se necesitan ticks.callback para linear; las labels se manejan con el tooltip.
                 // Puedes añadir un tick.callback si quieres mostrar los nombres de los días en el eje,
                 // pero sería más complejo mapear el valor lineal al nombre del día.
                 // Dejar el eje X sin ticks o con ticks numéricos simples en modo ideal es común.
             } :
             {
                type: 'category', // En modo ajustado, usamos category con las labels pasadas
                labels: chart1Labels, // Las labels de prepareSevenDaysDatasets para el eje category
                title: { display: true, text: 'Día' },
                offset: true, // Esto ayuda a centrar los puntos en las categorías
                 // Puedes añadir ticks.callback si quieres formato adicional en las labels.
             };


        const chart1Instance = new Chart(canvas1, {
            type: 'scatter', // Mantener tipo scatter
            data: {
                labels: chart1Labels,
                datasets: datasets7Days
            },

            options: {
                responsive: false,
                maintainAspectRatio: false,
                 // Layout padding right eliminado ya que no es necesario para scatter con eje X linear/category con offset.
                 // El padding horizontal se gestiona mejor con min/max en la escala linear o offset en category.
                 // layout: { padding: { right: 0 } }, // Asegurar padding 0 si no se necesita

                scales: {
                     y: {
                        type: 'linear',
                        min: 0,
                        max: 86400,
                        position: 'right', // NUEVO: Posicionar el eje Y a la derecha
                        title: { display: true, text: 'Hora del Día' },
                        ticks: {
                            callback: value => {
                                const h = Math.floor(value / 3600);
                                const m = Math.floor((value % 3600) / 60);
                                const ampm = h >= 12 ? 'PM' : 'AM';
                                const hh = h % 12 === 0 ? 12 : h % 12;
                                return `${hh}:${m.toString().padStart(2, '0')} ${ampm}`;
                            }
                        }
                    },
                    x: chart1XScale // Usar la configuración de escala X calculada
                },
                plugins: {
                    legend: { display: true, position: 'bottom' },
                    zoom: {
                        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy' },
                        pan: { enabled: true, mode: 'xy' }
                    },
                    annotation: {
                        annotations: {
                             // Mantener las anotaciones AM/PM si son relevantes para el eje Y
                            amBox: {
                                type: 'box',
                                yMin: 0,
                                yMax: 43200,
                                backgroundColor: 'rgba(255, 255, 0, 0.1)',
                                borderColor: 'rgba(255, 255, 0, 0.2)',
                                borderWidth: 1,
                                label: {
                                    display: true,
                                    content: 'AM',
                                    position: 'start',
                                    font: { size: 10, weight: 'bold' },
                                    color: 'rgba(0,0,0,0.5)'
                                }
                            },
                            pmBox: {
                                type: 'box',
                                yMin: 43200,
                                yMax: 86400,
                                backgroundColor: 'rgba(0, 0, 255, 0.1)',
                                borderColor: 'rgba(0, 0, 255, 0.2)',
                                borderWidth: 1,
                                label: {
                                    display: true,
                                    content: 'PM',
                                    position: 'start',
                                    font: { size: 10, weight: 'bold' },
                                    color: 'rgba(0,0,0,0.5)'
                                }
                            }
                        }
                    }
                }
            }
        });
         // Guardar la instancia creada
         chartInstances['chart1'] = chart1Instance;
        console.log('Instancia de chart1 (Scatter 7 días) creada.');

    } catch (error) {
        console.error('Error al renderizar chart1:', error);
    }

    // --- Chart 2: 30 días (Barras) ---
    try {
        // Obtener la configuración y estado para chart2
        const chart2Config = chartsConfig['chart2'] || {};
        const chart2Labels = labels30Days; // Usamos las labels generadas por prepareThirtyDaysDatasets

        const max30 = Math.max(0, ...datasets30Days.flatMap(d => d.data));
        const suggestedMax30 = max30 > 0 ? max30 * 1.1 : 10; //margen superior

         // Configurar el eje X: usar 'category' con offset siempre para barras.
         const chart2XScale = {
                type: 'category',
                labels: chart2Labels, // Las labels de prepareThirtyDaysDatasets para el eje category
                title: { display: true, text: 'Día' },
                offset: true // Asegura que las barras no toquen los bordes
         };


       const chart2Instance = new Chart(canvas2, {
        type: 'bar', // Mantener tipo barra
        data: { labels: chart2Labels, datasets: datasets30Days }, // Usar las labels generadas
        options: {
            responsive: false,
            maintainAspectRatio: false,

            // Agregar margen visual al lado derecho del gráfico
            layout: {
                padding: {
                    right: 16 // Puedes ajustar este valor según necesidad
                }
            },

            scales: {
                y: {
                    min: 0,
                    suggestedMax: suggestedMax30, // margen superior automático
                    position: 'right', // NUEVO: Posicionar el eje Y a la derecha
                    title: { display: true, text: 'Cantidad de Incrementos' },
                    ticks: {
                        // Mostrar solo números enteros
                        callback: value => Number.isInteger(value) ? value : null
                    }
                },
                x: chart2XScale // Usar la configuración de escala X (category)
            },

            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                },
                zoom: {
                    zoom: {
                        wheel: { enabled: true },
                        pinch: { enabled: true },
                        mode: 'xy'
                    },
                    pan: {
                        enabled: true,
                        mode: 'xy'
                    }
                }
            }
        }
    });
         // Guardar la instancia creada
         chartInstances['chart2'] = chart2Instance;
         console.log('Instancia de chart2 (Barras 30 días) creada.');

    } catch (error) {
        console.error('Error al renderizar chart2:', error);
    }

    // --- Chart 3: Año (Semanas) ---
    try {
        // Obtener la configuración y estado para chart3
        const chart3Config = chartsConfig['chart3'] || {};
        const chart3Labels = labelsYearly; // Usamos las labels generadas por prepareYearlyDatasets

        const maxYear = Math.max(0, ...datasetsYearly.flatMap(d => d.data));
        const suggestedMaxYear = maxYear > 0 ? maxYear * 1.1 : 10;

         // Configurar el eje X: usar 'category' con offset siempre para barras.
         const chart3XScale = {
                type: 'category',
                labels: chart3Labels, // Las labels de prepareYearlyDatasets para el eje category
                title: { display: true, text: 'Semana del Año' },
                offset: true // Separar última barra del borde derecho
         };

       const chart3Instance = new Chart(canvas3, {
        type: 'bar', // Mantener tipo barra
        data: { labels: chart3Labels, datasets: datasetsYearly }, // Usar las labels generadas
        options: { // <-- Aquí comienza el objeto options
            responsive: false,
            maintainAspectRatio: false,

            // Agregar margen visual al lado derecho del gráfico
            layout: {
                padding: {
                    right: 16
                }
            },

            scales: {
                y: {
                    min: 0,
                    suggestedMax: suggestedMaxYear, // margen superior automático
                    position: 'right', // NUEVO: Posicionar el eje Y a la derecha
                    title: { display: true, text: 'Cantidad de Incrementos' },
                    ticks: {
                        callback: value => Number.isInteger(value) ? value : null
                    }
                },
                x: chart3XScale // Usar la configuración de escala X (category)
            },

            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                },
                zoom: {
                    zoom: {
                        wheel: { enabled: true },
                        pinch: { enabled: true },
                        mode: 'xy'
                    },
                    pan: {
                        enabled: true,
                        mode: 'xy'
                    }
                }
            }
        } // <-- Aquí termina el objeto options
    });

         // Guardar la instancia creada
         chartInstances['chart3'] = chart3Instance;
         console.log('Instancia de chart3 (Barras Año) creada.');

    } catch (error) {
        console.error('Error al renderizar chart3:', error);
    }

    console.log('Proceso de renderizado de gráficos completado.');
} // <-- Aquí termina la función








/**
 * Maneja el clic en un botón intercambiador de tamaño de gráfico.
 * Cambia entre la escala ajustada (ancho de pantalla) y la escala ideal (ancho calculado)
 * para el gráfico especificado, si es aplicable, y actualiza el gráfico.
 * No ejecuta la lógica si no hay una instancia Chart.js montada para el gráfico.
 * Ahora integra la lógica de aplicar tamaño y resolución utilizando una cascada rAF
 * con un frame de seguridad adicional después de ajustar la resolución interna.
 *
 * @param {string} chartId - El ID del gráfico ('chart1', 'chart2', 'chart3') cuyo botón fue clicado.
 */
function alternarEscalaGrafico(chartId) {
    console.log(`[alternarEscalaGrafico] Botón de ${chartId} clicado. Iniciando cascada rAF interna con seguridad extra.`);

    const config = chartsConfig[chartId];
    const chartInstance = chartInstances[chartId]; // Obtener la instancia de Chart.js

    // 1. Comprobación inicial: Si no hay instancia Chart.js montada o configuración inválida, no ejecutar la lógica.
    if (!chartInstance || !config || typeof config.fixedHeightPx !== 'number' || typeof config.idealWidthPx !== 'number') {
        console.log(`[alternarEscalaGrafico] No se encontró instancia Chart.js válida, configuración o dimensiones para ${chartId}. Probablemente se muestran mensajes UX o error de configuración. No ejecutar lógica de redimensionamiento.`);
        return;
    }
    console.log(`[alternarEscalaGrafico] Instancia Chart.js encontrada y configuración válida para ${chartId}. Ejecutando lógica de redimensionamiento.`);


    // 2. Actualizar la medición del ancho de referencia de la pantalla actual.
    const titleContainer = document.querySelector('#charts-screen .top-section');
    if (titleContainer) {
        anchoPantallaReferencia = Math.floor(titleContainer.clientWidth);
        console.log(`[alternarEscalaGrafico] Ancho de referencia de pantalla actualizado: ${anchoPantallaReferencia}px.`);
    } else {
        console.warn('[alternarEscalaGrafico] Contenedor top-section en charts-screen no encontrado. Usando ancho de ventana como fallback.');
        anchoPantallaReferencia = Math.floor(window.innerWidth); // Fallback
        console.log(`[alternarEscalaGrafico] Usando ancho de ventana como fallback: ${anchoPantallaReferencia}px.`);
    }

    // 3. Determinar el NUEVO estado de escala y el ancho visual objetivo.
    let newIsIdealScaleActive;
    let targetWidthPx;
    let logMessage = `[alternarEscalaGrafico] Decisión para ${chartId}:`;

    // Si está en escala ajustada (false) -> Intentar pasar a escala ideal (true).
    if (config.isIdealScaleActive === false) {
        newIsIdealScaleActive = true; // El nuevo estado será ideal
        targetWidthPx = config.idealWidthPx; // El ancho objetivo es el ideal
        logMessage += ` Estado actual Ajustado. Cambiando a Ideal. Ancho objetivo: ${targetWidthPx}px.`;

        // Configurar opciones de Chart.js para mostrar todos los labels en el eje X (solo si el eje es 'category' o 'linear')
        if (chartInstance.options.scales.x && chartInstance.options.scales.x.ticks) {
             // Para ejes 'category' o 'linear', desactivar autoSkip para mostrar todos los ticks
            chartInstance.options.scales.x.ticks.autoSkip = false;
            chartInstance.options.scales.x.ticks.maxTicksLimit = undefined; // Eliminar límite de ticks
             console.log(`[${chartId}] Opciones de eje X ajustadas para escala ideal: autoSkip=false, maxTicksLimit=undefined.`);
        } else if (chartInstance.options.scales.x && chartInstance.options.scales.x.type === 'linear') {
             // Para ejes 'linear' (como en el Scatter de 7 días en modo ideal), autoSkip no aplica de la misma manera.
             // No es necesario ajustar autoSkip/maxTicksLimit aquí, ya que los ticks se gestionan de otra forma.
             console.log(`[${chartId}] Eje X tipo linear en escala ideal. No se ajustan autoSkip/maxTicksLimit.`);
        }


    }
    // Si está en escala ideal (true) -> Considerar pasar a escala ajustada (false).
    else { // config.isIdealScaleActive === true
        // Solo volvemos a la escala ajustada si el ancho ideal actual es mayor que el ancho de la pantalla actual.
        // Si el ancho ideal ya cabe en la pantalla, permanecemos en escala ideal (no hacemos nada).
        if (config.idealWidthPx > anchoPantallaReferencia) {
            newIsIdealScaleActive = false; // El nuevo estado será ajustado
            targetWidthPx = anchoPantallaReferencia; // El ancho objetivo es el de referencia de la pantalla
            logMessage += ` Estado actual Ideal. idealWidthPx (${config.idealWidthPx}) > anchoPantallaReferencia (${anchoPantallaReferencia}). Contrayendo a Ajustado. Ancho objetivo: ${targetWidthPx}px.`;

            // Configurar opciones de Chart.js para resumir labels en el eje X
            if (chartInstance.options.scales.x && chartInstance.options.scales.x.ticks) {
                chartInstance.options.scales.x.ticks.autoSkip = true; // Activar autoSkip
                // Restablecer maxTicksLimit a un valor apropiado (basado en longitud fija de labels)
                 const numLabels = (config.chartType === '7days') ? 7 : (config.chartType === '30days' ? 30 : 53);
                 chartInstance.options.scales.x.ticks.maxTicksLimit = numLabels;
                 console.log(`[${chartId}] Opciones de eje X ajustadas para escala ajustada: autoSkip=true, maxTicksLimit=${numLabels}.`);
            } else if (chartInstance.options.scales.x && chartInstance.options.scales.x.type === 'linear') {
                 console.log(`[${chartId}] Eje X tipo linear. No se ajustan autoSkip/maxTicksLimit al intentar contraer.`);
            }


        } else {
            // Si el ancho ideal no es mayor que la pantalla, no cambiamos el estado ni redimensionamos.
            console.log(`[alternarEscalaGrafico] Estado actual Ideal. idealWidthPx (${config.idealWidthPx}) <= anchoPantallaReferencia (${anchoPantallaReferencia}). Permaneciendo en estado Ideal (ya cabe en pantalla). No se necesita redimensionar.`);
            return; // Salir de la función si no se necesita cambiar de tamaño
        }
    }

     // Si llegamos aquí, significa que SÍ vamos a cambiar el tamaño.
     // Actualizar el estado en la configuración global.
     config.isIdealScaleActive = newIsIdealScaleActive;
     console.log(logMessage); // Log de la decisión final de escala

    // Obtener referencias al canvas y su contenedor
    const canvas = document.getElementById(chartId);
    const wrapper = canvas ? canvas.closest('.canvas-wrapper') : null;

     if (!canvas || !wrapper) {
         console.error(`[${chartId}] Elemento canvas o contenedor wrapper no encontrado para redimensionar.`);
         // Si los elementos no se encuentran, no podemos continuar con el redimensionamiento DOM.
         // La instancia de Chart.js (si existe) puede estar en un estado inconsistente.
         // Considerar qué acción tomar aquí - quizás destruir la instancia?
         // Por ahora, simplemente loggeamos el error y retornamos.
         return;
     }

     const targetHeightPx = config.fixedHeightPx; // Usar la altura fija de la configuración


    // 4. Iniciar la cascada de requestAnimationFrame para aplicar el tamaño visual y la resolución interna.
    console.log(`[${chartId}] Iniciando cascada rAF interna para aplicar tamaño ${targetWidthPx}x${targetHeightPx} con seguridad extra.`);

    // Frame 1: Aplicar tamaño visual (CSS) al contenedor.
    requestAnimationFrame(() => {
        console.log(`[${chartId}] rAF Frame 1: Aplicando tamaño visual al contenedor.`);
        wrapper.style.width = `${targetWidthPx}px`;
        wrapper.style.height = `${targetHeightPx}px`;
         console.log(`[${chartId}] rAF Frame 1: Contenedor tamaño visual: ${targetWidthPx}x${targetHeightPx}.`);

        // Frame 2: Frame de seguridad para dar tiempo al navegador a procesar el cambio de estilo.
        requestAnimationFrame(() => {
            console.log(`[${chartId}] rAF Frame 2: Frame de seguridad después de aplicar tamaño visual.`);

            // Frame 3: Ajustar la resolución interna del canvas y la escala del contexto.
            requestAnimationFrame(() => {
                console.log(`[${chartId}] rAF Frame 3: Ajustando resolución interna del canvas.`);

                const dpr = window.devicePixelRatio || 1;
                console.log(`[${chartId}] rAF Frame 3: Device Pixel Ratio: ${dpr}.`);

                // Obtener el tamaño visible REAL del contenedor después del layout.
                const currentVisibleWidth = wrapper.clientWidth;
                const currentVisibleHeight = wrapper.clientHeight;
                 console.log(`[${chartId}] rAF Frame 3: Contenedor tamaño visible REAL: ${currentVisibleWidth}x${currentVisibleHeight}.`);


                // Ajustar la resolución interna del canvas.
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    canvas.width = Math.floor(currentVisibleWidth * dpr);
                    canvas.height = Math.floor(currentVisibleHeight * dpr);
                    // Escalar el contexto 2D.
                    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                    console.log(`[${chartId}] rAF Frame 3: Resolución interna (${canvas.width}x${canvas.height}) y escala (${dpr}) aplicadas.`);
                } else {
                     console.error(`[${chartId}] rAF Frame 3: No se pudo obtener el contexto 2D. No se aplicó escala de contexto.`);
                      // Fallback: intentar ajustar atributos width/height
                     const fallbackWidth = config.isIdealScaleActive ? config.idealWidthPx : anchoPantallaReferencia;
                      canvas.width = Math.floor(fallbackWidth * dpr);
                      canvas.height = Math.floor(config.fixedHeightPx * dpr);
                     console.warn(`[${chartId}] rAF Frame 3: Fallback: ajustados atributos width/height a ${canvas.width}x${canvas.height}.`);
                }


                console.log(`[${chartId}] rAF Frame 3: Finalizado ajuste de resolución interna.`);


                // NUEVO Frame 4: Frame de seguridad adicional después de ajustar la resolución interna.
                requestAnimationFrame(() => {
                    console.log(`[${chartId}] rAF Frame 4: Frame de seguridad después del ajuste de resolución interna.`);

                    // Frame 5: Redimensionar y actualizar la instancia de Chart.js.
                    requestAnimationFrame(() => {
                        console.log(`[${chartId}] rAF Frame 5: Redimensionando y actualizando instancia de Chart.js.`);
                        chartInstance.resize(); // Notificar a Chart.js que el tamaño del canvas ha cambiado
                        chartInstance.update(); // Redibujar el gráfico con los nuevos datos y opciones de escala

                        console.log(`[alternarEscalaGrafico] Cascata rAF interna finalizada para ${chartId}. Chart.js redibujado.`);
                    }); // Fin rAF Frame 5 (Redimensionar Chart.js)
                }); // Fin rAF Frame 4 (Seguridad Extra)
            }); // Fin rAF Frame 3 (Ajuste Resolución)
        }); // Fin rAF Frame 2 (Seguridad)
    }); // Fin rAF Frame 1 (Aplicar Size Visual)

    console.log(`[alternarEscalaGrafico] Saliendo de la función para ${chartId}. Cascata rAF interna programada.`);

} // Fin de la función alternarEscalaGrafico















/**
     * Destruye todas las instancias de gráficos Chart.js activas
     * y limpia el estado relacionado con los gráficos.
     * Se llama para limpiar antes de crear nuevos gráficos o al salir de la pantalla de gráficos.
     * Es segura para llamar incluso si no hay instancias Chart.js montadas.
     */
    function destroyAllCharts() {
        console.log('CCCCCCCCCCC     Intentando destruir instancias de gráficos existentes y limpiar estado...');

        // Iterar sobre las instancias guardadas en chartInstances.
        // La iteración sobre chartInstances es segura incluso si el objeto está vacío.
        for (const chartId in chartInstances) {
            if (chartInstances.hasOwnProperty(chartId)) {
                const chartInstance = chartInstances[chartId];

                // Verificar si la instancia existe y tiene un método destroy antes de intentar destruirla.
                if (chartInstance && typeof chartInstance.destroy === 'function') {
                    chartInstance.destroy(); // Destruir la instancia de Chart.js
                    console.log(`Instancia de ${chartId} destruida.`);
                } else {
                     console.warn(`No se encontró instancia de Chart.js válida para destruir en ${chartId}.`);
                }

                // Limpiar visualmente el canvas reseteando sus atributos de tamaño a 0.
                 const canvasElement = document.getElementById(chartId);
                 if (canvasElement) {
                     canvasElement.width = 0;
                     canvasElement.height = 0;
                     console.log(`Canvas ${chartId} atributos de tamaño reseteados a 0.`);
                 } else {
                      console.warn(`Elemento canvas ${chartId} no encontrado al destruir.`);
                 }

                // Restablecer el style de width/height de su contenedor (.canvas-wrapper)
                // para asegurar que no mantengan un tamaño fijo aplicado por JavaScript.
                 const contenedorCanvas = canvasElement ? canvasElement.closest('.canvas-wrapper') : null;
                 if(contenedorCanvas) {
                      contenedorCanvas.style.width = ''; // Eliminar el style aplicado por JS
                      contenedorCanvas.style.height = ''; // Eliminar el style aplicado por JS
                      console.log(`Contenedor .canvas-wrapper de ${chartId} style reseteado.`);
                 }


            }
        }

        // Limpiar el objeto que almacena las instancias Chart.js.
        chartInstances = {};
        console.log('Objeto chartInstances limpiado.');

        // Resetear el objeto de configuración y estado de los gráficos a su estado inicial.
        // Esto asegura un estado limpio al volver a la pantalla de gráficos.
        // Se re-inicializa con las constantes integradas.
  //       chartsConfig = {
  //          'chart1': { chartType: '7days', fixedHeightPx: 500, minSpaceX: 30, idealWidthPx: 0, isIdealScaleActive: false },
  //          'chart2': { chartType: '30days', fixedHeightPx: 500, minSpaceX: 15, idealWidthPx: 0, isIdealScaleActive: false },
  //          'chart3': { chartType: 'yearly', fixedHeightPx: 500, minSpaceX: 10, idealWidthPx: 0, isIdealScaleActive: false }
  //       };
  //       console.log('Objeto chartsConfig reseteado a estado inicial.');

        console.log('Proceso de destrucción de instancias de gráficos y limpieza de estado completado.');
    }




