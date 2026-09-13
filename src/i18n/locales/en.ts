export const en = {
  common: {
    macros: {
      protein: 'Protein',
      carbs: 'Carbs',
      fat: 'Fat',
      fiber: 'Fiber',
      calories: 'Calories'
    },
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
    copyLink: 'Copy link',
    loadingYourData: 'Loading your data…',
    refreshingData: 'Refreshing…'
  },

  welcome: {
    tagline:
      "Turn your daily food log into a real nutrition dashboard — today's meals, macro trends, and AI-assisted insights.",
    features: {
      local: 'Parsed entirely in your browser — nothing is ever uploaded',
      liveSheet: 'Link a live Google Sheet and refresh it in one click',
      breakdowns:
        'Macro, fat-quality, and glycemic-risk breakdowns — not just calories'
    },
    continueWithData: 'Continue with your data',
    uploadedAt: '{{fileName}} — uploaded {{date}}',
    continueLinkedSheetDefault: 'Continue with linked sheet',
    lastLoaded: 'Last loaded {{date}} — will re-fetch the latest data',
    renameAria: 'Rename this sheet',
    renameTitle: 'Rename',
    removeAria: 'Remove this sheet',
    removeTitle: 'Remove',
    namePlaceholder: 'Name this sheet',
    tryDemo: 'Try the demo',
    tryDemoDesc:
      'Explore every report with a bundled sample dataset — no account needed.',
    uploadCsv: 'Upload your CSV',
    uploadCsvDesc:
      'Export your spreadsheet\'s "Registro" tab as CSV and drop it here — parsed entirely in your browser, never uploaded anywhere.',
    importFromLink: 'Import from a shared link',
    importFromLinkDesc:
      'Open your spreadsheet, click the "Registro" tab, then copy the URL straight from your browser\'s address bar (it should end in "#gid=..." once Registro is open). The sheet must be shared as "Anyone with the link can view" — we\'ll re-fetch it fresh each time you come back, no login needed.',
    urlPlaceholder: 'https://docs.google.com/spreadsheets/d/...',
    import: 'Import',
    addAsNewSheet: 'Add as a new sheet',
    replacePrefix: 'Replace: ',
    sheetFromDate: 'sheet from {{date}}',
    nameOptionalPlaceholder: 'Name this sheet (optional)',
    downloadSample: 'Download sample spreadsheet',
    downloadSampleDesc:
      'No data yet? Grab a template with the right tabs and columns, fill in your own meals, then export its "Registro" tab as CSV and upload it above.',
    signInGoogle: 'Sign in with Google',
    signInGoogleDesc:
      'Connect your companion spreadsheet for reports that stay live. Coming soon.',
    comingSoon: 'Coming soon',
    githubAria: 'View source on GitHub',
    githubTitle: 'View source on GitHub',
    websiteAria: "Developer's website",
    websiteTitle: "Visit the developer's website"
  },

  topBar: {
    backToWelcome: 'Back to welcome',
    modeLabels: {
      demo: 'Demo',
      upload: 'Snapshot',
      sheetLink: 'Linked',
      google: 'Live'
    },
    nav: {
      today: 'Latest',
      timeline: 'Timeline',
      bia: 'BIA',
      weight: 'Weight',
      liquids: 'Liquids'
    },
    refreshTitle: 'Re-fetch the latest data from the linked sheet',
    refresh: 'Refresh',
    shareTitle: 'Copy a link that opens this spreadsheet directly in Ninfo',
    share: 'Share',
    shareCopied: 'Copied!',
    qrTitle: 'Show a QR code that opens this spreadsheet directly in Ninfo',
    qrCode: 'QR code',
    startOver: 'Start over',
    clearDateAria: 'Back to today'
  },

  mobileMenu: {
    openAria: 'Menu',
    installApp: 'Install app',
    installAppTitle: 'Install Ninfo on this device'
  },

  dateNavigator: {
    previousDay: 'Previous day',
    nextDay: 'Next day',
    jumpToLatest: 'Jump to latest',
    pickDate: 'Pick a date'
  },

  shareQr: {
    title: 'Scan to open this spreadsheet',
    hint: 'Point a phone camera at the code to open it directly in Ninfo.'
  },

  today: {
    tabSummary: 'Summary',
    tabVs: 'vs.',
    tabSources: 'Sources',
    macroNutrientsTitle: 'Macro nutrients',
    currentDayVsTitle: 'Current day vs.',
    vsYesterday: 'vs. yesterday',
    vsWeek: 'vs. week',
    vsMonth: 'vs. month',
    compareYesterday: 'Yesterday',
    compareWeek: 'Week',
    compareMonth: 'Month',
    medianHint: 'Week and month values are the median for that period.',
    vsGoal: 'vs goal',
    pctOver: '+{{pct}}%',
    pctMissing: '-{{pct}}%',
    toggleRingBadgeAria: 'Switch between percent and value',
    showRingDetailsAria: 'Show macro details',
    showRingDetailsTitle: 'Show goal and difference for each macro',
    hideRingDetailsAria: 'Hide macro details',
    hideRingDetailsTitle: 'Hide goal and difference for each macro',
    topSources: 'Top sources',
    topSourceLine: '{{food}} — {{amount}} ({{pct}}%)',
    warningsButtonAria: 'Show nutrition warnings',
    warningsTitle: 'Warnings',
    warnings: {
      saturatedFat: {
        stamp: 'High saturated fat',
        body: "Saturated fat ({{grams}}g) is {{pct}}% of today's total fat — above the {{threshold}}% commonly considered a healthy upper bound."
      },
      omegaImbalance: {
        stamp: 'Omega-6/3 imbalance',
        body: "Today's Ω-6:Ω-3 ratio is {{ratio}}, above the {{threshold}}:1 commonly cited as a healthy upper bound. Diets skewed heavily toward Ω-6 are linked to more inflammation."
      },
      transFat: {
        stamp: 'Trans fat',
        body: 'Today includes {{grams}}g of trans/"Tóx" fat. Guidance treats any amount of trans fat as unsafe.'
      },
      glucoseSpike: {
        stamp: 'Glucose spike risk',
        body: "Today gets {{pct}}% of its calories from carbs, with too little protein or fat (under {{minProtein}}g / {{minFat}}g) to slow absorption. Carb-heavy days like this can spike blood sugar."
      }
    },
    copyFoodListAria: 'Copy food list',
    copyFoodListTitle: "Copy the day's food list as text",
    copySummaryTextAria: 'Copy day summary as text',
    copySummaryTextTitle: 'Copy the day summary as text',
    copySummaryImageAria: 'Copy day summary as image',
    copySummaryImageTitle: 'Copy the day summary as an image',
    foodLogTitle: 'Food log — {{date}}',
    summaryTitle: 'Day summary — {{date}}',
    ofGoal: '/ {{goal}}{{unit}} goal'
  },

  timeline: {
    title: 'Macro-nutrient timeline',
    hint: 'Click a day to open its details.',
    copyImageAria: 'Copy chart as image',
    copyImageTitle: 'Copy chart as an image',
    exitFullscreen: 'Exit fullscreen',
    viewFullscreen: 'View fullscreen',
    all: 'All',
    rangeDays: '{{count}}d'
  },

  bia: {
    title: 'Bioimpedancia',
    needsLinkedSheet:
      'This report reads the "Bioimpedancia" tab from a linked Google Sheet. ',
    importLink: 'Import one from a shared link',
    toSeeIt: ' to see it.',
    termsButton: 'Terms',
    termsTitle: 'What do these terms mean?',
    refresh: 'Refresh',
    refreshTitle: 'Re-fetch the latest measurements',
    loading: 'Loading measurements…',
    noMeasurements: 'No measurements found in the Bioimpedancia tab yet.',
    latestMeasurement: 'Latest measurement: {{date}}',
    vsPrevious: 'vs. previous',
    trends: 'Trends',
    notEnoughForDiff: 'Not enough measurements yet for a diff.',
    history: 'History',
    table: {
      date: 'Date',
      weight: 'Weight',
      bodyFat: 'Body fat',
      visceralFat: 'Visceral fat',
      muscleMass: 'Muscle mass',
      bmi: 'BMI',
      notes: 'Notes'
    },
    metrics: {
      weight: 'Weight',
      bodyFat: 'Body fat',
      visceralFat: 'Visceral fat',
      muscleMass: 'Muscle mass',
      bmi: 'BMI'
    },
    unitToggle: {
      pct: '%',
      kg: 'kg'
    },
    diffToggle: {
      value: 'Value',
      diff: 'Diff'
    },
    glossaryTitle: 'Bioimpedancia terms',
    glossary: {
      peso: {
        term: 'Peso',
        name: 'Weight',
        description: 'Total body weight, in kilograms.'
      },
      cgt: {
        term: 'CGT',
        name: 'Grasa Corporal Total',
        description:
          'Total body fat, as a percentage of body weight (with its kg equivalent alongside).'
      },
      gv: {
        term: 'GV',
        name: 'Grasa Visceral',
        description:
          "Visceral fat rating — fat stored around internal organs, on the scale's own index. Lower is generally better."
      },
      mm: {
        term: 'MM%',
        name: 'Masa Muscular',
        description:
          'Muscle mass, as a percentage of body weight (with its kg equivalent alongside).'
      },
      imc: {
        term: 'IMC',
        name: 'Índice de Masa Corporal',
        description:
          'Body Mass Index — weight relative to height². A general indicator, less accurate for very muscular builds.'
      }
    }
  },

  weight: {
    title: 'Weight',
    needsLinkedSheet: 'This report reads the "Peso" tab from a linked Google Sheet. ',
    refreshTitle: 'Re-fetch the latest measurements',
    loading: 'Loading measurements…',
    noMeasurements: 'No measurements found in the Peso tab yet.',
    latestMeasurement: 'Latest measurement: {{date}}',
    metrics: {
      weight: 'Weight',
      median: 'Median',
      max: 'Max',
      min: 'Min'
    },
    periods: {
      oneMonth: 'vs. 1 month ago',
      threeMonths: 'vs. 3 months ago',
      sixMonths: 'vs. 6 months ago',
      oneYear: 'vs. 1 year ago'
    }
  },

  liquid: {
    title: 'Liquids',
    needsLinkedSheet: 'This report reads the "Líquido" tab from a linked Google Sheet. ',
    refreshTitle: 'Re-fetch the latest entries',
    loading: 'Loading entries…',
    noMeasurements: 'No entries found in the Líquido tab yet.',
    latestDay: 'Latest day: {{date}}',
    sources: 'Sources',
    metrics: {
      dailyTotal: 'Daily total',
      median: 'Median',
      max: 'Max',
      min: 'Min'
    },
    table: {
      time: 'Time',
      duration: 'Duration',
      type: 'Type',
      amount: 'Amount'
    }
  },

  meals: {
    timelineStrip: {
      empty: 'No meals logged for this day.',
      heading: 'Meals by time',
      prevMeal: 'Previous meal',
      nextMeal: 'Next meal'
    },
    warningsButtonAria: 'Show nutrition warnings',
    warningsTitle: 'Warnings',
    warnings: {
      saturatedFat: {
        stamp: 'High saturated fat',
        body: "Saturated fat ({{grams}}g) is {{pct}}% of this meal's total fat — above the {{threshold}}% commonly cited as a healthy upper bound."
      },
      omegaImbalance: {
        stamp: 'Omega-6/3 imbalance',
        undefinedRatio: 'undefined (no Ω-3)',
        body: 'Ratio is {{ratio}}, above the {{threshold}}:1 commonly cited as a healthy upper bound. Diets skewed heavily toward Ω-6 are linked to more inflammation.'
      },
      transFat: {
        stamp: 'Trans fat',
        body: 'This meal has {{grams}}g of trans/"Tóx" fat. Guidance treats any amount of trans fat as unsafe.'
      },
      glucoseSpike: {
        stamp: 'Glucose spike risk',
        body: 'This meal gets {{pct}}% of its calories from carbs, with too little protein or fat (under {{minProtein}}g / {{minFat}}g) to slow absorption. Carb-heavy meals like this can spike blood sugar.'
      }
    },
    table: {
      food: 'Food',
      copyAria: 'Copy meal details',
      copySelectedTitle: 'Copy selected rows',
      copyAllTitle: 'Copy meal details',
      maximizeAria: 'Maximize',
      backToSummaryAria: 'Back to summary',
      restoreAria: 'Restore',
      detailsHeading: '{{time}} — food details',
      selectedSuffix: '{{count}} selected',
      selectedItems_one: '{{count}} selected item from meal at {{time}}',
      selectedItems_other: '{{count}} selected items from meal at {{time}}',
      itemsAtMeal_one: 'Meal at {{time}} — {{count}} item',
      itemsAtMeal_other: 'Meal at {{time}} — {{count}} items'
    },
    nutritionLabel: {
      title: 'Nutrition Facts',
      copyTextAria: 'Copy nutritional info',
      copyTextTitle: 'Copy nutritional info as text',
      copyImageAria: 'Copy nutritional info as image',
      copyImageTitle: 'Copy nutritional info as an image',
      detailsHint: 'Click for food details →',
      itemsCount_one: '{{count}} item',
      itemsCount_other: '{{count}} items',
      totals: 'Totals'
    },
    fatSection: {
      saturated: 'Saturated',
      unsaturated: 'Unsaturated',
      trans: 'Trans',
      ratioTitleSatUnsat: 'Saturated {{a}}g / Unsaturated {{b}}g',
      ratioTitleOmega: 'Ω-6 {{a}}g / Ω-3 {{b}}g',
      transHint: '{{grams}}g trans'
    }
  },

  dayReview: {
    noGoals:
      'Logged {{calories}} kcal so far today — {{protein}}g protein, {{carbs}}g carbs, {{fat}}g fat, {{fiber}}g fiber.',
    noGoalsHint: 'Set daily goals in your sheet to see progress here.',
    underBudget:
      "You're at {{pct}}% of your calorie goal, with {{delta}} kcal left in today's budget.",
    overBudget:
      "You're at {{pct}}% of your calorie goal, {{delta}} kcal over today's budget.",
    macroSingle: '{{macro}} is at {{pct}}% of goal.',
    macroLeadLag:
      '{{leadMacro}} is leading at {{leadPct}}% of goal, while {{lagMacro}} lags at {{lagPct}}%.'
  },

  errors: {
    registroHeaderNotFound:
      'Could not find the Registro header row (expected Fecha/Hora/Alimento columns).',
    bioimpedanciaHeaderNotFound:
      'Could not find the Bioimpedancia header row (expected Fecha/Peso columns).',
    pesoHeaderNotFound:
      'Could not find the Peso header row (expected Fecha/Peso columns).',
    liquidoHeaderNotFound:
      'Could not find the Líquido header row (expected Fecha/.../Líquido columns).',
    fileEmpty: ' The file appears to be empty.',
    foundInstead:
      ' Found instead: "{{preview}}" — check that this is the right tab.',
    shareHintRegistro:
      'Make sure the sheet is shared as "Anyone with the link can view", and that the link was copied while the "Registro" tab was open (Share → Copy link, from within that tab) — otherwise the link points at whichever tab is first, not necessarily Registro.',
    shareHintBioimpedancia:
      'Make sure the sheet is shared as "Anyone with the link can view", and that it has a "Bioimpedancia" tab with Fecha/Peso columns.',
    shareHintPeso:
      'Make sure the sheet is shared as "Anyone with the link can view", and that it has a "Peso" tab with Fecha/Peso columns.',
    shareHintLiquido:
      'Make sure the sheet is shared as "Anyone with the link can view", and that it has a "Líquido" tab with Fecha/Líquido columns.',
    notGoogleSheetLink:
      "That doesn't look like a Google Sheets link. Copy it from the address bar or via Share → Copy link.",
    couldNotReachSheet: "Couldn't reach that spreadsheet.",
    couldNotReachBioimpedancia: "Couldn't reach the Bioimpedancia tab.",
    couldNotReachPeso: "Couldn't reach the Peso tab.",
    couldNotReachLiquido: "Couldn't reach the Líquido tab.",
    signInPage:
      'Google returned a sign-in page instead of your spreadsheet — this sheet isn\'t actually shared as "Anyone with the link can view" yet (File → Share → General access).',
    httpError: 'Google Sheets returned an error ({{status}}).',
    demoLoadFailed: 'Could not load the demo dataset.'
  }
}
