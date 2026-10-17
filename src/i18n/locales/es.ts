import type { en } from './en'

export const es: typeof en = {
  common: {
    macros: {
      protein: 'Proteína',
      carbs: 'Carbohidratos',
      fat: 'Grasa',
      fiber: 'Fibra',
      calories: 'Calorías'
    },
    close: 'Cerrar',
    cancel: 'Cancelar',
    save: 'Guardar',
    copyLink: 'Copiar enlace',
    loadingYourData: 'Cargando tus datos…',
    refreshingData: 'Actualizando…'
  },

  welcome: {
    tagline:
      'Convierte tu registro diario de comidas en un verdadero panel nutricional — las comidas de hoy, tendencias de macros e información asistida por IA.',
    features: {
      local: 'Se procesa todo en tu navegador — nunca se sube nada',
      liveSheet: 'Vincula una hoja de Google en vivo y actualízala con un clic',
      breakdowns:
        'Desgloses de macros, calidad de grasas y riesgo glucémico — no solo calorías'
    },
    continueWithData: 'Continuar con tus datos',
    uploadedAt: '{{fileName}} — subido el {{date}}',
    continueLinkedSheetDefault: 'Continuar con la hoja vinculada',
    lastLoaded:
      'Última carga: {{date}} — se volverán a obtener los datos más recientes',
    renameAria: 'Renombrar esta hoja',
    renameTitle: 'Renombrar',
    removeAria: 'Eliminar esta hoja',
    removeTitle: 'Eliminar',
    namePlaceholder: 'Nombra esta hoja',
    tryDemo: 'Probar la demo',
    tryDemoDesc:
      'Explora todos los informes con un conjunto de datos de muestra incluido — sin necesidad de cuenta.',
    uploadCsv: 'Subir tu CSV',
    uploadCsvDesc:
      'Exporta la pestaña "Registro" de tu hoja de cálculo como CSV y suéltala aquí — se procesa todo en tu navegador, nunca se sube a ningún sitio.',
    importFromLink: 'Importar desde un enlace compartido',
    importFromLinkDesc:
      'Abre tu hoja de cálculo, haz clic en la pestaña "Registro" y copia la URL directamente desde la barra de direcciones del navegador (debería terminar en "#gid=..." una vez que Registro esté abierta). La hoja debe estar compartida como "Cualquier persona con el enlace puede verla" — la volveremos a obtener cada vez que vuelvas, sin necesidad de iniciar sesión.',
    urlPlaceholder: 'https://docs.google.com/spreadsheets/d/...',
    import: 'Importar',
    addAsNewSheet: 'Añadir como hoja nueva',
    replacePrefix: 'Reemplazar: ',
    sheetFromDate: 'hoja del {{date}}',
    nameOptionalPlaceholder: 'Nombra esta hoja (opcional)',
    downloadSample: 'Descargar hoja de cálculo de muestra',
    downloadSampleDesc:
      '¿Aún sin datos? Descarga una plantilla con las pestañas y columnas correctas, añade tus propias comidas y luego exporta su pestaña "Registro" como CSV para subirla arriba.',
    signInGoogle: 'Iniciar sesión con Google',
    signInGoogleDesc:
      'Conecta tu hoja de cálculo complementaria para informes siempre actualizados. Próximamente.',
    comingSoon: 'Próximamente',
    githubAria: 'Ver el código fuente en GitHub',
    githubTitle: 'Ver el código fuente en GitHub',
    websiteAria: 'Sitio web del desarrollador',
    websiteTitle: 'Visitar el sitio web del desarrollador'
  },

  topBar: {
    backToWelcome: 'Volver al inicio',
    modeLabels: {
      demo: 'Demo',
      upload: 'Instantánea',
      sheetLink: 'Vinculada',
      google: 'En vivo'
    },
    nav: {
      today: 'Reciente',
      timeline: 'Cronología',
      bia: 'BIA',
      weight: 'Peso',
      liquids: 'Líquidos',
      report: 'Reporte',
      foodCheck: 'Revisar'
    },
    refreshTitle:
      'Volver a obtener los datos más recientes de la hoja vinculada',
    refresh: 'Actualizar',
    shareTitle:
      'Compartir un enlace o código QR que abre esta hoja de cálculo directamente en Ninfo',
    share: 'Compartir',
    startOver: 'Reiniciar',
    clearDateAria: 'Volver a hoy'
  },

  mobileMenu: {
    openAria: 'Menú',
    installApp: 'Instalar app',
    installAppTitle: 'Instalar Ninfo en este dispositivo'
  },

  dateNavigator: {
    previousDay: 'Día anterior',
    nextDay: 'Día siguiente',
    jumpToLatest: 'Ir al más reciente',
    pickDate: 'Elegir fecha'
  },

  shareModal: {
    title: 'Compartir esta hoja de cálculo',
    hint: 'Envía el enlace, o apunta la cámara del teléfono al código, para abrirla directamente en Ninfo.',
    copy: 'Copiar',
    copied: '¡Copiado!',
    qrAria: 'Código QR'
  },

  today: {
    tabSummary: 'Resumen',
    tabVs: 'vs.',
    tabSources: 'Fuentes',
    macroNutrientsTitle: 'Macronutrientes',
    macroView: {
      ariaLabel: 'Cambiar la vista de macros',
      macros: 'Macros',
      macrosTitle: 'Gramos del día (kcal para calorías)',
      perKg: 'Por peso corporal',
      perKgTitle: 'Gramos del día, por kg de peso corporal',
      kcalPct: 'Kcal %',
      kcalPctTitle: 'Proporción de las calorías totales del día que aporta ese macro',
      noWeightData: 'No hay datos de peso corporal para este día.'
    },
    currentDayVsTitle: 'Día actual vs.',
    vsYesterday: 'vs. ayer',
    vsWeek: 'vs. semana',
    vsMonth: 'vs. mes',
    compareYesterday: 'Ayer',
    compareWeek: 'Semana',
    compareMonth: 'Mes',
    medianHint:
      'Los valores semanales y mensuales son la mediana de ese período, no un solo día ni un promedio.',
    vsGoal: 'vs objetivo',
    pctOver: '+{{pct}}%',
    pctMissing: '-{{pct}}%',
    toggleRingBadgeAria: 'Cambiar entre porcentaje y valor',
    showRingDetailsAria: 'Mostrar detalles de macros',
    showRingDetailsTitle: 'Mostrar el objetivo y la diferencia de cada macro',
    hideRingDetailsAria: 'Ocultar detalles de macros',
    hideRingDetailsTitle: 'Ocultar el objetivo y la diferencia de cada macro',
    topSources: 'Principales fuentes',
    topSourceLine: '{{food}} — {{amount}} ({{pct}}%)',
    warningsButtonAria: 'Mostrar advertencias nutricionales',
    warningsTitle: 'Advertencias',
    warnings: {
      saturatedFat: {
        stamp: 'Grasa saturada alta',
        body: 'La relación grasa insaturada:saturada de hoy es {{ratio}}, por debajo del objetivo de {{threshold}}:1. La grasa saturada ({{grams}}g) es el {{pct}}% de la grasa de hoy.'
      },
      transFat: {
        stamp: 'Grasa trans',
        body: 'Hoy incluye {{grams}}g de grasa trans/"Tóx". Las guías consideran insegura cualquier cantidad de grasa trans.'
      },
      glucoseSpike: {
        stamp: 'Riesgo de pico de glucosa',
        body: 'Hoy el {{pct}}% de las calorías provienen de carbohidratos, con muy poca proteína o grasa (menos de {{minProtein}}g / {{minFat}}g) para frenar la absorción. Días así pueden disparar el azúcar en sangre.'
      }
    },
    copyFoodListAria: 'Copiar lista de alimentos',
    copyFoodListTitle: 'Copiar la lista de alimentos del día como texto',
    copySummaryTextAria: 'Copiar el resumen del día como texto',
    copySummaryTextTitle: 'Copiar el resumen del día como texto',
    copySummaryImageAria: 'Copiar el resumen del día como imagen',
    copySummaryImageTitle: 'Copiar el resumen del día como imagen',
    foodLogTitle: 'Registro de alimentos — {{date}}',
    summaryTitle: 'Resumen del día — {{date}}',
    ofGoal: '/ {{goal}}{{unit}} objetivo',
    waterIntake: 'Consumo de agua',
    mtorc1Pulses_one: 'pulso mTORC1',
    mtorc1Pulses_other: 'pulsos mTORC1',
    mtorc1PulsesTitle: 'Activaciones completas probables de mTORC1 (pulsos de síntesis proteica muscular) hoy. Apunta a {{target}}–4, separadas por al menos 3 h.'
  },

  fasting: {
    title: 'Ayuno actual',
    noEntriesTodayTitle: 'Todavía no registraste nada hoy',
    fastingFor: 'Llevas en ayuno',
    lastMealLabel: 'Última comida: {{date}} a las {{time}}',
    textHeading: 'En ayuno hace {{elapsed}} — última comida: {{date}} a las {{time}}',
    lastMealTitle: 'Última comida — {{date}}, {{time}}',
    copyFoodListAria: 'Copiar lista de alimentos',
    copyFoodListTitle: 'Copiar la lista de alimentos (día anterior o última comida, según lo elegido) como texto',
    copySummaryTextAria: 'Copiar resumen de ayuno como texto',
    copySummaryTextTitle: 'Copiar el tiempo de ayuno y los macros como texto',
    copyImageAria: 'Copiar resumen de ayuno como imagen',
    copyImageTitle: 'Copiar este panel como imagen',
    noMealsYet: 'Aún no hay comidas registradas — en cuanto registres la primera, esto empezará a contar el tiempo desde entonces.',
    macrosSectionTitle: 'Macros',
    macroSourceAriaLabel: 'Cambiar la fuente de macros',
    lastDayTab: 'Día anterior',
    lastMealTab: 'Última comida'
  },

  ai: {
    title: 'Análisis de IA',
    open: 'Abrir análisis de IA',
    openEmpty: 'Análisis de IA: pregúntale a tu asistente de IA',
    empty: 'Todavía no hay un análisis de IA aquí. Pídeselo al asistente de IA conectado a este navegador, por ejemplo:',
    copyPrompt: 'Copiar pedido',
    recommendations: 'Recomendaciones',
    estimates: 'Estimaciones de la IA',
    observations: 'Observaciones',
    receivedAt: 'De tu asistente de IA · {{date}}',
    dismiss: 'Quitar este análisis',
    copyAs: 'Copiar análisis',
    copyFormatTitle: 'Copiar este análisis como {{format}}',
    copyFormats: {
      markdown: 'Markdown',
      text: 'Texto',
      json: 'JSON'
    },
    table: {
      estimate: 'Estimación',
      value: 'Valor',
      note: 'Nota'
    },
    priority: {
      high: 'Alta',
      medium: 'Media',
      low: 'Baja'
    },
    prompt: {
      day: 'Usa las herramientas de Ninfo para analizar mi día {{date}} (micronutrientes, grasas y pulsos mTORC1) y publica tu resumen y recomendaciones con show_ai_analysis.',
      meal: 'Usa la herramienta get_meal de Ninfo para analizar mi comida de las {{time}} del {{date}} (micronutrientes, grasas y mTORC1) y publica tus comentarios en su tarjeta con show_ai_analysis.',
      panel: 'Usa las herramientas de Ninfo para analizar mi {{panel}} y publica tus recomendaciones en ese panel con show_ai_analysis.'
    },
    panels: {
      timeline_chart: 'línea de tiempo de macros',
      timeline_medians: 'mediana de macros',
      bia_summary: 'último resultado de bioimpedancia',
      bia_trends: 'tendencia de bioimpedancia',
      bia_history: 'historial de bioimpedancia',
      weight_summary: 'último peso',
      weight_trends: 'tendencia de peso',
      weight_history: 'historial de peso',
      liquids_summary: 'consumo de líquidos',
      liquids_trends: 'tendencia de consumo de líquidos',
      liquids_history: 'historial de consumo de líquidos'
    },
    status: {
      ready_one: 'Asistente de IA conectado (WebMCP): {{count}} herramienta disponible',
      ready_other: 'Asistente de IA conectado (WebMCP): {{count}} herramientas disponibles',
      error: 'No se pudieron registrar las herramientas WebMCP: {{error}}'
    },
    help: {
      openHint: 'Haz clic para ver cómo usarlo',
      title: 'Asistente de IA',
      intro: 'Este navegador tiene un asistente de IA que puede trabajar directamente con Ninfo (mediante WebMCP): lee tus datos y muestra su análisis aquí mismo en la app.',
      errorDetail: 'Tu navegador admite asistentes de IA, pero Ninfo no pudo conectarse: {{error}}. Recarga la página para volver a intentarlo.',
      canTitle: 'Qué puede hacer tu asistente',
      can: {
        day: 'Leer cualquier día registrado completo: cada comida y alimento, macros frente a tus objetivos, calidad de las grasas, riesgo de pico de glucosa, ayuno y pulsos mTORC1.',
        timeline: 'Leer tus tendencias de 7, 30, 90 días o de todo el registro, incluidas las medianas y un solo alimento.',
        body: 'Leer tu historial de peso, bioimpedancia y consumo de líquidos.',
        post: 'Mostrar su propio análisis en un día, una comida o cualquier panel: un resumen, recomendaciones y estimaciones que la app no calcula, como micronutrientes, grasas en detalle o una estimación de mTORC1 más precisa.'
      },
      needsSheet: 'El peso, la bioimpedancia y los líquidos solo están disponibles cuando tus datos vienen de una hoja de Google vinculada.',
      whereTitle: 'Dónde aparece su análisis',
      where: {
        meal: 'Tarjetas de comida: el ícono ✨ del encabezado gira la tarjeta y muestra el análisis.',
        day: 'Hoy: el ícono ✨ junto al conteo de mTORC1 abre el análisis del día.',
        panels: 'Línea de tiempo, BIA, Peso y Líquidos: cada panel tiene su propio ícono ✨ junto al título.',
        dot: 'Un punto en el ícono indica que hay un análisis nuevo. Los análisis se guardan en este navegador hasta que los quites.'
      },
      tryTitle: 'Prueba a pedirle',
      examples: {
        day: 'Usa la herramienta get_day de Ninfo para analizar mi último día y publica tu resumen y recomendaciones con show_ai_analysis.',
        meal: 'Usa las herramientas de Ninfo para revisar cada comida de hoy, estimar micronutrientes y pulsos mTORC1, y publica comentarios en cada tarjeta con show_ai_analysis.',
        timeline: 'Usa la herramienta get_timeline de Ninfo para revisar mis últimos 30 días y publica qué debería cambiar en el panel de mediana de macros con show_ai_analysis.',
        body: 'Usa las herramientas de Ninfo para comparar mis tendencias de peso y bioimpedancia con mi consumo de proteína y publica tus conclusiones en esos paneles con show_ai_analysis.'
      },
      browsersTitle: 'Dónde funciona',
      browsers: {
        chatgpt: 'ChatGPT para escritorio y su navegador integrado: sin configuración.',
        chrome: 'Chrome 149 o posterior con la opción de WebMCP activada (chrome://flags/#enable-webmcp-testing).',
        edge: 'Edge 150 o posterior.',
        others: 'Firefox y Safari todavía no lo admiten; Ninfo funciona igual, solo que sin el asistente.'
      },
      privacyTitle: 'Privacidad',
      privacy: 'Lo que tu asistente lee de Ninfo se envía al proveedor de ese asistente, como cualquier otra cosa que compartas con él. Su análisis es texto simple, guardado solo en este navegador para cada fuente de datos; puedes quitar cualquiera desde su panel.',
      toolsLabel: 'Herramientas disponibles para el asistente:'
    }
  },

  timeline: {
    title: 'Cronología de macronutrientes',
    hint: 'Haz clic en un día para ver sus detalles.',
    copyImageAria: 'Copiar gráfico como imagen',
    copyImageTitle: 'Copiar el gráfico como imagen',
    copyMedianImageAria: 'Copiar mediana de macros como imagen',
    copyMedianImageTitle: 'Copiar la mediana de macros como imagen',
    exitFullscreen: 'Salir de pantalla completa',
    viewFullscreen: 'Ver en pantalla completa',
    all: 'Todo',
    rangeDays: '{{count}}d',
    medianTitle: 'Mediana de macros',
    medianHint: 'Valor mediano del período seleccionado',
    medianView: {
      ariaLabel: 'Cambiar la vista de macros',
      macros: 'Macros',
      macrosTitle: 'Gramos medianos por día (kcal para calorías)',
      perKg: 'Por peso corporal',
      perKgTitle: 'Gramos medianos por día, por kg de peso corporal mediano de este período',
      kcalPct: 'Kcal %',
      kcalPctTitle: 'Proporción de las calorías totales medianas del período que aporta ese macro',
      noWeightData: 'No hay datos de peso corporal para este período.'
    },
    scrubberAria: 'Desplázate por la cronología',
    linkRangeTitle: 'Sincronizar el rango con el gráfico de cronología',
    unlinkRangeTitle: 'Usar un rango independiente para este panel',
    skipLastDay: 'Omitir último día',
    skipLastDayTitle: 'Omitir el último día, que puede estar incompleto',
    searchFoodPlaceholder: 'Buscar un alimento…',
    clearFoodFilter: 'Quitar filtro de alimento',
    foodFilterHint: 'Mostrando solo "{{food}}". Haz clic en un día para ver sus detalles.',
    metrics: {
      foodGrams: 'Consumo de comida',
      foodGramsFor: '"{{food}}" por día',
      proteinPerKg: 'Proteína/kg',
      proteinPerKgTitle: 'Proteína mediana por día, por kg de peso corporal mediano, para este período',
      fasting: 'Tiempo de ayuno',
      water: 'Consumo de agua',
      mtorc1: 'mTORC1',
      mtorc1Title: 'Mediana de activaciones completas probables de mTORC1 (pulsos de síntesis proteica muscular) por día en este período. 3–4 separados por al menos 3 h es un objetivo habitual.'
    }
  },

  bia: {
    title: 'Bioimpedancia',
    needsLinkedSheet:
      'Este informe lee la pestaña "Bioimpedancia" de una hoja de Google vinculada. ',
    importLink: 'Importa una desde un enlace compartido',
    toSeeIt: ' para verlo.',
    termsButton: 'Términos',
    termsTitle: '¿Qué significan estos términos?',
    refresh: 'Actualizar',
    refreshTitle: 'Volver a obtener las mediciones más recientes',
    loading: 'Cargando mediciones…',
    noMeasurements:
      'Aún no se encontraron mediciones en la pestaña Bioimpedancia.',
    latestMeasurement: 'Última medición: {{date}}',
    vsPrevious: 'vs. anterior',
    trends: 'Tendencias',
    copyTrendsImageAria: 'Copiar tendencias como imagen',
    copyTrendsImageTitle: 'Copiar las tendencias como imagen',
    notEnoughForDiff:
      'Aún no hay suficientes mediciones para calcular una diferencia.',
    history: 'Historial',
    table: {
      date: 'Fecha',
      weight: 'Peso',
      bodyFat: 'Grasa corporal',
      visceralFat: 'Grasa visceral',
      muscleMass: 'Masa muscular',
      bmi: 'IMC',
      notes: 'Notas'
    },
    metrics: {
      weight: 'Peso',
      bodyFat: 'Grasa corporal',
      visceralFat: 'Grasa visceral',
      muscleMass: 'Masa muscular',
      bmi: 'IMC'
    },
    unitToggle: {
      pct: '%',
      kg: 'kg'
    },
    diffToggle: {
      value: 'Valor',
      diff: 'Dif.'
    },
    glossaryTitle: 'Términos de bioimpedancia',
    glossary: {
      peso: {
        term: 'Peso',
        name: 'Peso',
        description: 'Peso corporal total, en kilogramos.'
      },
      cgt: {
        term: 'CGT',
        name: 'Grasa Corporal Total',
        description:
          'Grasa corporal total, como porcentaje del peso corporal (con su equivalente en kg al lado).'
      },
      gv: {
        term: 'GV',
        name: 'Grasa Visceral',
        description:
          'Índice de grasa visceral — grasa acumulada alrededor de los órganos internos, según la escala propia del dispositivo. Cuanto más bajo, generalmente mejor.'
      },
      mm: {
        term: 'MM%',
        name: 'Masa Muscular',
        description:
          'Masa muscular, como porcentaje del peso corporal (con su equivalente en kg al lado).'
      },
      imc: {
        term: 'IMC',
        name: 'Índice de Masa Corporal',
        description:
          'Relación entre el peso y la altura al cuadrado. Un indicador general, menos preciso en personas muy musculadas.'
      }
    }
  },

  weight: {
    title: 'Peso',
    needsLinkedSheet:
      'Este reporte lee la pestaña "Peso" de una hoja de Google vinculada. ',
    refreshTitle: 'Volver a obtener las mediciones más recientes',
    loading: 'Cargando mediciones…',
    noMeasurements: 'Aún no hay mediciones en la pestaña Peso.',
    latestMeasurement: 'Última medición: {{date}}',
    metrics: {
      weight: 'Peso',
      median: 'Mediana',
      max: 'Máx',
      min: 'Mín'
    },
    periods: {
      oneMonth: 'vs. hace 1 mes',
      threeMonths: 'vs. hace 3 meses',
      sixMonths: 'vs. hace 6 meses',
      oneYear: 'vs. hace 1 año'
    }
  },

  liquid: {
    title: 'Líquidos',
    needsLinkedSheet:
      'Este reporte lee la pestaña "Líquido" de una hoja de Google vinculada. ',
    refreshTitle: 'Volver a obtener los registros más recientes',
    copySummaryImageAria: 'Copiar resumen de líquidos como imagen',
    copySummaryImageTitle: 'Copiar el resumen de líquidos como imagen',
    loading: 'Cargando registros…',
    noMeasurements: 'Aún no hay registros en la pestaña Líquido.',
    latestDay: 'Último día: {{date}} — {{total}} ml',
    sources: 'Fuentes',
    metrics: {
      dailyTotal: 'Total diario',
      median: 'Mediana',
      max: 'Máx',
      min: 'Mín'
    },
    table: {
      time: 'Hora',
      duration: 'Duración',
      type: 'Tipo',
      amount: 'Cantidad'
    }
  },

  report: {
    title: 'Reporte global',
    description: 'Genera un PDF de una sola página con tus tendencias generales: el resumen de mediana de macros y la composición corporal, peso y consumo de líquidos, donde una hoja vinculada los proporcione.',
    generateButton: 'Descargar reporte en PDF',
    generating: 'Generando…',
    generateFailed: 'No se pudo generar el reporte. Inténtalo de nuevo.',
    generatedAt: 'Generado el {{date}}',
    biaTitle: 'BIA',
    medianRangeHint: 'Mediana de los últimos {{count}} días registrados',
    noData: 'Aún no hay comidas registradas.'
  },

  meals: {
    timelineStrip: {
      empty: 'No hay comidas registradas este día.',
      heading: 'Comidas por hora',
      prevMeal: 'Comida anterior',
      nextMeal: 'Siguiente comida'
    },
    warningsButtonAria: 'Mostrar advertencias nutricionales',
    warningsTitle: 'Advertencias',
    warnings: {
      saturatedFat: {
        stamp: 'Grasa saturada alta',
        body: 'La relación grasa insaturada:saturada de esta comida es {{ratio}}, por debajo del objetivo de {{threshold}}:1. La grasa saturada ({{grams}}g) es el {{pct}}% de su grasa.'
      },
      transFat: {
        stamp: 'Grasa trans',
        body: 'Esta comida tiene {{grams}}g de grasas trans/"Tóx". Las recomendaciones consideran insegura cualquier cantidad de grasas trans.'
      },
      glucoseSpike: {
        stamp: 'Riesgo de pico de glucosa',
        body: 'Esta comida obtiene el {{pct}}% de sus calorías de carbohidratos, con muy poca proteína o grasa (menos de {{minProtein}}g / {{minFat}}g) para frenar la absorción. Las comidas con tantos carbohidratos pueden disparar la glucosa en sangre.'
      }
    },
    table: {
      food: 'Alimento',
      copyAria: 'Copiar detalles de la comida',
      copySelectedTitle: 'Copiar filas seleccionadas',
      copyAllTitle: 'Copiar detalles de la comida',
      maximizeAria: 'Maximizar',
      backToSummaryAria: 'Volver al resumen',
      restoreAria: 'Restaurar',
      detailsHeading: '{{time}} — detalles de alimentos',
      selectedSuffix: '{{count}} seleccionados',
      selectedItems_one:
        '{{count}} elemento seleccionado de la comida de las {{time}}',
      selectedItems_other:
        '{{count}} elementos seleccionados de la comida de las {{time}}',
      itemsAtMeal_one: 'Comida de las {{time}} — {{count}} elemento',
      itemsAtMeal_other: 'Comida de las {{time}} — {{count}} elementos'
    },
    nutritionLabel: {
      title: 'Info Nutricional',
      copyTextAria: 'Copiar información nutricional',
      copyTextTitle: 'Copiar información nutricional como texto',
      copyImageAria: 'Copiar información nutricional como imagen',
      copyImageTitle: 'Copiar información nutricional como imagen',
      detailsHint: 'Toca para ver los detalles →',
      itemsCount_one: '{{count}} elemento',
      itemsCount_other: '{{count}} elementos',
      totals: 'Totales'
    },
    mtorc1: {
      title: 'Activación de mTORC1',
      status: {
        full: 'Activación completa probable de mTORC1',
        partial: 'Activación parcial probable de mTORC1',
        refractory: 'Dentro del pulso anterior',
        none: 'Sin activación probable'
      },
      meaning: {
        full: 'Suficiente leucina y proteína para encender mTORC1, la señal de construcción muscular. La síntesis llega al pico a las ~1,5–2 h y se apaga a las ~3 h.',
        partial: 'Suficiente leucina para un pulso menor. Un poco más de proteína de lácteos, carne, pescado o huevo probablemente lo haría completo.',
        refractory: 'Suficiente proteína, pero a menos de 3 h del último pulso: el músculo sigue "lleno", así que esto lo prolonga.',
        none: 'Muy poca leucina para encender mTORC1.'
      },
      leucineUnit: 'leucina',
      level: {
        full: 'Activación completa',
        strong: 'Activación parcial fuerte',
        weak: 'Activación parcial débil',
        refractory: 'Dentro del pulso anterior',
        none: 'Sin activación'
      },
      whyTitle: 'Por qué',
      gaugeLabel: 'Leucina estimada',
      gaugePartial: 'parcial {{grams}} g',
      gaugeFull: 'completo {{grams}} g',
      gaugeSincePulse: 'Desde el pulso de las {{time}}',
      gaugeNewPulse: 'nuevo pulso {{hours}} h',
      checks: {
        proteinPerKg: '{{grams}} g de proteína: un pulso completo necesita {{needed}} g ({{perKg}} g/kg × {{kg}} kg)',
        proteinFallback: '{{grams}} g de proteína: un pulso completo necesita {{needed}} g (sin peso corporal registrado)',
        firstOfDay: 'Primer pulso del día',
        sincePrevious: '{{duration}} desde el pulso de las {{time}}: uno nuevo necesita {{hours}} h',
        merged: 'Contada junto con la comida de las {{times}} (a menos de {{minutes}} min, se absorben como una)'
      },
      sourcesTitle: 'Principales fuentes de leucina',
      sourceValue: '≈{{leucine}} g de leucina · {{protein}} g de proteína',
      meaningTitle: 'Qué significa',
      footnote: 'Estimado a partir de la proteína y el origen de cada alimento, no medido.',
      copyTextAria: 'Copiar detalles de mTORC1 como texto',
      copyTextTitle: 'Copiar todos los detalles de mTORC1 (por qué, qué significa, fuentes) como texto',
      copyImageAria: 'Copiar resumen de mTORC1 como imagen',
      copyImageTitle: 'Copiar el resumen de mTORC1 (nivel y por qué) como imagen'
    },
    fatSection: {
      saturated: 'Saturada',
      unsaturated: 'Insaturada',
      trans: 'Trans',
      ratioTitleUnsatSat: 'Insaturada {{a}}g / Saturada {{b}}g',
      transHint: '{{grams}}g trans'
    }
  },

  dayReview: {
    noGoals:
      'Llevas {{calories}} kcal registradas hoy — {{protein}}g de proteína, {{carbs}}g de carbohidratos, {{fat}}g de grasa, {{fiber}}g de fibra.',
    noGoalsHint:
      'Configura objetivos diarios en tu hoja de cálculo para ver aquí tu progreso.',
    underBudget:
      'Llevas el {{pct}}% de tu objetivo calórico, con {{delta}} kcal disponibles hoy.',
    overBudget:
      'Llevas el {{pct}}% de tu objetivo calórico, {{delta}} kcal por encima de lo previsto para hoy.',
    macroSingle: '{{macro}} está al {{pct}}% del objetivo.',
    macroLeadLag:
      '{{leadMacro}} va a la cabeza con el {{leadPct}}% del objetivo, mientras que {{lagMacro}} se queda atrás con el {{lagPct}}%.'
  },

  foodCheck: {
    title: 'Revisar',
    needsLinkedSheet: 'Esta revisión lee la pestaña "Alimentos" de una hoja de Google vinculada. ',
    intro:
      'Cada alimento de tu pestaña "Alimentos" se compara con su equivalente más cercano en los datos de referencia de laboratorio del USDA. Abajo se listan los que tienen macros o lípidos desviados más de un {{threshold}}%. Fuente:',
    scope: {
      label: 'Alimentos',
      days: '{{days}} días',
      all: 'Todos',
      countRecent: '{{count}} de {{total}} consumidos',
      countAll: '{{count}} alimentos'
    },
    updated: 'Actualizado {{date}}',
    loading: 'Cargando la pestaña Alimentos…',
    shareHint:
      'Asegúrate de que la hoja esté compartida como "Cualquier persona con el enlace puede ver" y de que tenga una pestaña "Alimentos" con una columna Alimento.',
    refresh: 'Actualizar',
    refreshTitle: 'Volver a leer la pestaña Alimentos y revisarla de nuevo (los datos del USDA siguen saliendo de la caché local)',
    stop: 'Detener',
    stopTitle: 'Dejar de buscar alimentos en el USDA',
    resume: 'Analizar',
    resumeTitle: 'Buscar los alimentos que todavía no tienen equivalente',
    leftToAdjust_one: 'alimento por ajustar',
    leftToAdjust_other: 'alimentos por ajustar',
    counts: {
      fixed: '{{count}} corregidos',
      ok: '{{count}} OK',
      unmatched: '{{count}} sin equivalente',
      ignored: '{{count}} ignorados'
    },
    progress: 'Revisados {{done}} de {{total}}',
    settings: {
      title: 'Ajustes',
      apiKey: 'Clave de API del USDA',
      apiKeyHint:
        'Sin clave, la DEMO_KEY compartida permite solo unas 30 búsquedas por hora. Una clave personal gratuita permite 1.000 por hora.',
      devKeyPlaceholder: 'Usando USDA_API_KEY de .env',
      apiKeySignup: 'Obtener una clave gratis',
      decimalSeparator: 'Separador decimal de las filas copiadas',
      decimalSeparatorHint:
        'Usa el de la configuración regional de tu hoja (Archivo → Configuración) para que los números pegados no se lean como texto.',
      checkEmptyLipids: 'Marcar también las celdas de lípidos vacías cuando el USDA tiene perfil de grasas',
      clearCache: 'Borrar los datos del USDA en caché',
      cacheCleared: 'Caché borrada',
      method:
        'Los macros se comparan por 100 g, y las calorías en kcal por 100 g. Los lípidos se comparan como proporción de los ácidos grasos del alimento: Ω-3 = ALA + EPA + DPA + DHA, Ω-6 = linoleico + araquidónico, Ω-9 = oleico + gondoico + erúcico, SCFA = C4, MCFA = C6–C12, LCFA = el resto, y Tóx = grasas trans. Las diferencias de redondeo (0,1 g, 1 kcal o 1 punto de proporción lipídica) nunca se marcan. El impacto es la mayor desviación de un solo campo.'
    },
    filters: {
      search: 'Buscar alimentos',
      status: 'Estado',
      category: 'Categoría',
      allCategories: 'Todas las categorías',
      statuses: {
        deviates: 'Por ajustar',
        fixed: 'Corregidos',
        ok: 'OK',
        unmatched: 'Sin equivalente',
        ignored: 'Ignorados',
        all: 'Todos'
      }
    },
    sort: {
      label: 'Ordenar por',
      sheet: 'Hoja',
      name: 'Nombre',
      impact: 'Impacto',
      intake: 'Ingesta',
      asc: 'Ascendente',
      desc: 'Descendente'
    },
    pasteHint:
      'Copiar pone los valores corregidos en el portapapeles, en el orden de columnas de la pestaña: solo los macros, solo los lípidos o la fila completa. La descripción de cada botón indica la celda donde pegar. Pega con Ctrl/Cmd+Shift+V (solo valores) para conservar también el formato numérico exacto de cada celda.',
    empty: 'Ningún alimento coincide con estos filtros.',
    eaten: '{{grams}} g consumidos en este período',
    eatenTitle: 'Gramos registrados en Registro durante los últimos {{days}} días del registro',
    eatenAll: '{{grams}} g consumidos en total',
    eatenTitleAll: 'Gramos registrados en Registro en todo el registro',
    rowTitle: 'Fila en la pestaña Alimentos',
    impactTitle: 'Impacto: la mayor desviación entre los campos de este alimento',
    autoMatch: 'Equivalente automático:',
    manualMatch: 'Equivalente:',
    noResults: 'El USDA no encontró nada para "{{query}}". Elige un equivalente a mano.',
    noQuery: 'No hay palabras reconocibles para buscar en el USDA. Elige un equivalente a mano.',
    pending: 'Esperando la búsqueda…',
    ignored: 'Ignorado. No se compara ni se cuenta.',
    skipped: "Omitido: los platos de {{category}} no se buscan automáticamente. Elige un equivalente a mano para revisarlo.",
    unignore: 'Dejar de ignorar',
    changeMatch: 'Cambiar equivalente',
    openInUsda: 'Abrir en USDA FoodData Central',
    table: {
      per100g: 'por 100 g',
      sheet: 'Hoja',
      usda: 'USDA',
      off: 'Desvío'
    },
    copyScopes: {
      macros: 'Macros',
      lipids: 'Lípidos',
      row: 'Fila'
    },
    pasteInto: 'Copia los valores corregidos. Pégalos en {{header}}, celda {{cell}}.',
    marksFixed: 'También marca el alimento como corregido.',
    copied: '¡Copiado!',
    markFixed: 'Marcar como corregido',
    unmarkFixed: 'Desmarcar',
    picker: {
      title: 'Equivalente para "{{name}}"',
      hint: 'Busca en el USDA en inglés y elige el alimento con el que se debe comparar esta fila.',
      placeholder: 'p. ej. apple raw',
      search: 'Buscar',
      noResults: 'Sin resultados. Prueba con menos palabras o más simples.',
      fieldsOff_one: '{{count}} campo desviado (hasta {{max}}%)',
      fieldsOff_other: '{{count}} campos desviados (hasta {{max}}%)',
      allWithin: 'Todos los campos dentro de la tolerancia',
      useAutomatic: 'Usar el equivalente automático',
      ignore: 'Ignorar este alimento'
    },
    errors: {
      badResponse: 'Respuesta inesperada al leer la pestaña Alimentos.',
      headerNotFound: 'No se encontró la fila de encabezado de Alimentos (se esperaba una columna "Alimento" en la fila 1).',
      couldNotReach: 'No se pudo acceder a la pestaña Alimentos.',
      rateLimited:
        'Se alcanzó el límite de consultas del USDA. Agrega una clave de API gratuita en Ajustes, o espera una hora y pulsa Analizar. Todo lo consultado hasta ahora queda en caché.',
      badApiKey: 'El USDA rechazó la clave de API. Revísala en Ajustes.',
      usdaHttp: 'USDA FoodData Central devolvió un error ({{status}}).'
    }
  },

  errors: {
    registroHeaderNotFound:
      'No se encontró la fila de encabezado de Registro (se esperaban las columnas Fecha/Hora/Alimento).',
    bioimpedanciaHeaderNotFound:
      'No se encontró la fila de encabezado de Bioimpedancia (se esperaban las columnas Fecha/Peso).',
    pesoHeaderNotFound:
      'No se encontró la fila de encabezado de Peso (se esperaban las columnas Fecha/Peso).',
    liquidoHeaderNotFound:
      'No se encontró la fila de encabezado de Líquido (se esperaban las columnas Fecha/.../Líquido).',
    fileEmpty: ' El archivo parece estar vacío.',
    foundInstead:
      ' Se encontró en su lugar: "{{preview}}" — comprueba que esta sea la pestaña correcta.',
    shareHintRegistro:
      'Asegúrate de que la hoja esté compartida como "Cualquier persona con el enlace puede verla", y de que el enlace se haya copiado con la pestaña "Registro" abierta (Compartir → Copiar enlace, desde esa pestaña) — de lo contrario, el enlace apunta a la primera pestaña, que no siempre es Registro.',
    shareHintBioimpedancia:
      'Asegúrate de que la hoja esté compartida como "Cualquier persona con el enlace puede verla" y de que tenga una pestaña "Bioimpedancia" con columnas Fecha/Peso.',
    shareHintPeso:
      'Asegúrate de que la hoja esté compartida como "Cualquier persona con el enlace puede verla" y de que tenga una pestaña "Peso" con columnas Fecha/Peso.',
    shareHintLiquido:
      'Asegúrate de que la hoja esté compartida como "Cualquier persona con el enlace puede verla" y de que tenga una pestaña "Líquido" con columnas Fecha/Líquido.',
    notGoogleSheetLink:
      'Eso no parece un enlace de Google Sheets. Cópialo desde la barra de direcciones o mediante Compartir → Copiar enlace.',
    couldNotReachSheet: 'No se pudo acceder a esa hoja de cálculo.',
    couldNotReachBioimpedancia:
      'No se pudo acceder a la pestaña Bioimpedancia.',
    couldNotReachPeso: 'No se pudo acceder a la pestaña Peso.',
    couldNotReachLiquido: 'No se pudo acceder a la pestaña Líquido.',
    signInPage:
      'Google devolvió una página de inicio de sesión en lugar de tu hoja de cálculo — esta hoja aún no está compartida como "Cualquier persona con el enlace puede verla" (Archivo → Compartir → Acceso general).',
    httpError: 'Google Sheets devolvió un error ({{status}}).',
    demoLoadFailed: 'No se pudo cargar el conjunto de datos de demostración.'
  }
}
