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
      liquids: 'Líquidos'
    },
    refreshTitle:
      'Volver a obtener los datos más recientes de la hoja vinculada',
    refresh: 'Actualizar',
    shareTitle:
      'Copiar un enlace que abra esta hoja de cálculo directamente en Ninfo',
    share: 'Compartir',
    shareCopied: '¡Copiado!',
    qrTitle:
      'Mostrar un código QR que abra esta hoja de cálculo directamente en Ninfo',
    qrCode: 'QR',
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

  shareQr: {
    title: 'Escanea para abrir esta hoja de cálculo',
    hint: 'Apunta la cámara del teléfono al código para abrirla directamente en Ninfo.'
  },

  today: {
    tabSummary: 'Resumen',
    tabVs: 'vs.',
    tabSources: 'Fuentes',
    macroNutrientsTitle: 'Macronutrientes',
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
        body: 'La grasa saturada ({{grams}}g) es el {{pct}}% de la grasa total de hoy — por encima del {{threshold}}% considerado comúnmente como un límite saludable.'
      },
      omegaImbalance: {
        stamp: 'Desequilibrio Ω-6/3',
        body: 'La proporción Ω-6:Ω-3 de hoy es {{ratio}}, por encima del {{threshold}}:1 citado comúnmente como límite saludable. Las dietas muy inclinadas hacia Ω-6 se asocian con más inflamación.'
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
    waterIntake: 'Consumo de agua'
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
      water: 'Consumo de agua'
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
        body: 'La grasa saturada ({{grams}}g) representa el {{pct}}% de la grasa total de esta comida — por encima del {{threshold}}% que se suele citar como límite saludable.'
      },
      omegaImbalance: {
        stamp: 'Desequilibrio Ω-6/3',
        undefinedRatio: 'indefinida (sin Ω-3)',
        body: 'La proporción es {{ratio}}, por encima de {{threshold}}:1, la cifra que suele citarse como límite saludable. Las dietas muy escoradas hacia Ω-6 se asocian con más inflamación.'
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
    fatSection: {
      saturated: 'Saturada',
      unsaturated: 'Insaturada',
      trans: 'Trans',
      ratioTitleSatUnsat: 'Saturada {{a}}g / Insaturada {{b}}g',
      ratioTitleOmega: 'Ω-6 {{a}}g / Ω-3 {{b}}g',
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
