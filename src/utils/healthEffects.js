/**
 * Health Effects and Recommendations
 * Provides detailed health implications and recommendations based on classification and metrics
 */

const HEALTH_EFFECTS = {
  asthma_patient: {
    // PM2.5 Effects
    pm25: {
      caution: {
        healthImplication: 'Increased PM2.5 levels may trigger minor respiratory symptoms.',
        recommendation: 'Consider reducing outdoor activities. Ensure indoor air filtration is active.',
        effects: ['Mild cough', 'Slight throat irritation']
      },
      warning: {
        healthImplication: 'Elevated PM2.5 levels pose significant risk to respiratory health.',
        recommendation: 'Limit outdoor exposure. Use N95/FFP2 masks if exposure is necessary. Keep medications nearby.',
        effects: ['Persistent cough', 'Shortness of breath', 'Increased asthma symptoms', 'Wheezing']
      },
      danger: {
        healthImplication: 'Dangerous PM2.5 levels require immediate action.',
        recommendation: 'Avoid outdoor activities entirely. Use indoor air purifier. Have rescue inhaler readily available.',
        effects: ['Severe respiratory distress', 'Asthma attacks', 'Difficulty breathing', 'Urgent medical attention may be needed']
      }
    },

    // AQI Effects
    aqi: {
      caution: {
        healthImplication: 'Air quality is declining. Asthma patients may experience early symptoms.',
        recommendation: 'Monitor air quality closely. Reduce strenuous indoor activities.',
        effects: ['Increased airway sensitivity', 'Mild breathing difficulties']
      },
      warning: {
        healthImplication: 'Poor air quality can exacerbate asthma conditions.',
        recommendation: 'Remain indoors if possible. Use prescribed inhalers as directed by doctor.',
        effects: ['Asthma exacerbation', 'Increased medication use', 'Chest tightness']
      },
      danger: {
        healthImplication: 'Hazardous air quality conditions. Critical health risk.',
        recommendation: 'Stay indoors with air purifier running. Seek medical advice immediately if symptoms worsen.',
        effects: ['Severe asthma attacks', 'Hospitalization risk', 'Life-threatening respiratory events']
      }
    },

    // UAQS Effects
    uaqs: {
      caution: {
        healthImplication: 'Unified air quality score indicates emerging pollution.',
        recommendation: 'Enhance ventilation. Consider using HEPA filters.',
        effects: ['Early respiratory irritation']
      },
      warning: {
        healthImplication: 'Combined particulate and gas pollution presents moderate risk.',
        recommendation: 'Activate air purifier. Limit physical exertion.',
        effects: ['Respiratory discomfort', 'Increased symptom frequency']
      },
      danger: {
        healthImplication: 'Critical air quality - immediate protective measures needed.',
        recommendation: 'Use air purifier at maximum setting. Take prescribed medications. Contact healthcare provider.',
        effects: ['Acute respiratory crisis', 'Severe asthma attacks']
      }
    },

    // CRI Effects
    cri: {
      caution: {
        healthImplication: 'Cumulative risk index shows increasing exposure.',
        recommendation: 'Begin preventive measures. Monitor respiratory status.',
        effects: ['Increased alert status needed']
      },
      warning: {
        healthImplication: 'High cumulative exposure risk - health intervention recommended.',
        recommendation: 'Implement protective strategies. Consider staying indoors.',
        effects: ['Increased risk of asthma exacerbation']
      },
      danger: {
        healthImplication: 'Dangerous cumulative exposure - immediate action required.',
        recommendation: 'Seek immediate medical attention if symptoms develop.',
        effects: ['Critical health risk', 'Potential emergency situation']
      }
    }
  },

  children: {
    // PM2.5 Effects
    pm25: {
      caution: {
        healthImplication: 'PM2.5 levels may affect respiratory development in children.',
        recommendation: 'Limit outdoor playtime. Encourage indoor activities. Use air purifiers.',
        effects: ['Mild cough', 'Temporary breathing difficulties during play']
      },
      warning: {
        healthImplication: 'High PM2.5 levels can impact lung development and cause respiratory issues.',
        recommendation: 'Restrict outdoor activities. Use N95 masks if going outside. Monitor for symptoms.',
        effects: ['Persistent cough', 'Difficulty breathing during exercise', 'Wheezing', 'Reduced physical performance']
      },
      danger: {
        healthImplication: 'Dangerous PM2.5 levels pose serious risk to child health.',
        recommendation: 'Keep children indoors. Use air purifier. Consult pediatrician immediately if symptoms appear.',
        effects: ['Severe respiratory distress', 'Potential pneumonia', 'Emergency medical care may be needed', 'Long-term lung damage risk']
      }
    },

    // AQI Effects
    aqi: {
      caution: {
        healthImplication: 'Air quality is deteriorating. Children should limit strenuous activities.',
        recommendation: 'Reduce outdoor time. Keep medications or inhalers nearby.',
        effects: ['Mild breathing difficulties', 'Reduced exercise tolerance']
      },
      warning: {
        healthImplication: 'Poor air quality significantly affects children\'s respiratory health.',
        recommendation: 'Keep children indoors. Ensure air filtration active. Monitor breathing closely.',
        effects: ['Respiratory symptoms', 'Reduced activity levels', 'Sleep disturbances']
      },
      danger: {
        healthImplication: 'Hazardous air quality - critical health emergency for children.',
        recommendation: 'Keep children indoors with air purifier. Seek immediate medical attention.',
        effects: ['Severe respiratory distress', 'Hospitalization may be required', 'Risk of permanent lung damage']
      }
    },

    // UAQS Effects
    uaqs: {
      caution: {
        healthImplication: 'Combined air pollution is rising. Children more sensitive than adults.',
        recommendation: 'Activate air purifier. Limit strenuous play.',
        effects: ['Mild symptoms', 'Increased susceptibility to infections']
      },
      warning: {
        healthImplication: 'Elevated pollution levels warrant protective action.',
        recommendation: 'Keep children indoors. Use HEPA air purifier. Avoid peak pollution hours.',
        effects: ['Breathing difficulties', 'Coughing', 'Wheezing', 'Activity restriction']
      },
      danger: {
        healthImplication: 'Critical pollution levels - children at severe health risk.',
        recommendation: 'Ensure children remain indoors with air purifier. Seek medical advice immediately.',
        effects: ['Acute respiratory crisis', 'Emergency medical attention required']
      }
    },

    // CRI Effects
    cri: {
      caution: {
        healthImplication: 'Cumulative pollution exposure is accumulating.',
        recommendation: 'Increase indoor activity. Monitor health status.',
        effects: ['Elevated health risk']
      },
      warning: {
        healthImplication: 'High exposure accumulation threatens child health.',
        recommendation: 'Prioritize indoor activities. Regular health monitoring.',
        effects: ['Respiratory symptom development', 'Increased infection risk']
      },
      danger: {
        healthImplication: 'Dangerous cumulative exposure - serious health emergency.',
        recommendation: 'Contact pediatrician or hospital immediately.',
        effects: ['Severe health complications', 'Hospitalization risk']
      }
    }
  },

  elderly: {
    // PM2.5 Effects
    pm25: {
      caution: {
        healthImplication: 'Elevated PM2.5 may worsen existing respiratory or cardiac conditions.',
        recommendation: 'Reduce outdoor exposure. Ensure adequate rest. Keep medications accessible.',
        effects: ['Mild respiratory discomfort', 'Increased fatigue']
      },
      warning: {
        healthImplication: 'High PM2.5 levels present significant risk to elderly health.',
        recommendation: 'Limit outdoor time severely. Use N95 masks if necessary. Consider air purifier.',
        effects: ['Shortness of breath', 'Chest discomfort', 'Increased heart rate', 'Weakness', 'Dizziness']
      },
      danger: {
        healthImplication: 'Dangerous PM2.5 levels require immediate protective action.',
        recommendation: 'Remain indoors. Use air purifier. Have emergency medications ready. Contact doctor.',
        effects: ['Severe respiratory distress', 'Cardiac complications', 'Risk of heart attack or stroke', 'Emergency care needed']
      }
    },

    // AQI Effects
    aqi: {
      caution: {
        healthImplication: 'Air quality decline may affect cardiovascular and respiratory health.',
        recommendation: 'Reduce outdoor activities. Monitor blood pressure and breathing.',
        effects: ['Mild symptoms', 'Increased fatigue']
      },
      warning: {
        healthImplication: 'Poor air quality poses risk to elderly population.',
        recommendation: 'Stay indoors. Monitor vital signs. Take medications as prescribed.',
        effects: ['Breathing difficulties', 'Chest pain', 'Palpitations', 'Increased blood pressure']
      },
      danger: {
        healthImplication: 'Hazardous air quality - medical emergency for elderly.',
        recommendation: 'Remain indoors with air purifier. Seek immediate medical attention.',
        effects: ['Acute cardiac events', 'Severe respiratory failure', 'Hospitalization required']
      }
    },

    // UAQS Effects
    uaqs: {
      caution: {
        healthImplication: 'Combined pollution levels increasing - elderly more vulnerable.',
        recommendation: 'Use air purifier. Rest frequently. Stay hydrated.',
        effects: ['Mild discomfort', 'Reduced activity tolerance']
      },
      warning: {
        healthImplication: 'Elevated pollution threatens elderly health significantly.',
        recommendation: 'Stay indoors. Activate air purifier. Regular health monitoring.',
        effects: ['Respiratory difficulty', 'Cardiac stress', 'Reduced mobility']
      },
      danger: {
        healthImplication: 'Critical pollution - elderly at severe medical risk.',
        recommendation: 'Ensure air purifier running. Contact healthcare provider immediately.',
        effects: ['Life-threatening conditions', 'Emergency medical intervention required']
      }
    },

    // CRI Effects
    cri: {
      caution: {
        healthImplication: 'Accumulated exposure starting to concern health metrics.',
        recommendation: 'Monitor health closely. Limit outdoor time.',
        effects: ['Health status attention needed']
      },
      warning: {
        healthImplication: 'High cumulative exposure poses health risks.',
        recommendation: 'Focus on indoor activities. Regular medical check-ups recommended.',
        effects: ['Progressive health decline', 'Increased symptom severity']
      },
      danger: {
        healthImplication: 'Dangerous exposure levels - critical health emergency.',
        recommendation: 'Seek emergency medical care immediately.',
        effects: ['Acute health crisis', 'Hospitalization imperative']
      }
    }
  },

  adults: {
    // PM2.5 Effects
    pm25: {
      caution: {
        healthImplication: 'PM2.5 levels are beginning to rise and may cause minor symptoms.',
        recommendation: 'Consider reducing outdoor activities if sensitive. Ensure good ventilation.',
        effects: ['Mild cough', 'Slight throat irritation']
      },
      warning: {
        healthImplication: 'Elevated PM2.5 may cause respiratory and cardiovascular effects.',
        recommendation: 'Limit outdoor exposure. Use air purifier indoors. Wear masks for outdoor activities.',
        effects: ['Coughing', 'Shortness of breath', 'Chest discomfort', 'Reduced exercise tolerance']
      },
      danger: {
        healthImplication: 'Dangerous PM2.5 levels pose serious health risks.',
        recommendation: 'Avoid outdoor activities. Use air purifier. Consult healthcare provider.',
        effects: ['Significant respiratory distress', 'Cardiac symptoms', 'Risk of acute respiratory infection']
      }
    },

    // AQI Effects
    aqi: {
      caution: {
        healthImplication: 'Air quality is moderately degraded. Sensitive groups may experience symptoms.',
        recommendation: 'Monitor air quality. Reduce strenuous outdoor activities if necessary.',
        effects: ['Mild respiratory irritation', 'General discomfort']
      },
      warning: {
        healthImplication: 'Air quality is unhealthy. Most people may experience symptoms.',
        recommendation: 'Limit outdoor time. Use air purifier indoors. Stay hydrated.',
        effects: ['Respiratory symptoms', 'Reduced physical performance', 'Fatigue']
      },
      danger: {
        healthImplication: 'Hazardous air quality. Serious health risks for all groups.',
        recommendation: 'Stay indoors with air purifier running. Seek medical advice if symptoms develop.',
        effects: ['Severe respiratory symptoms', 'Cardiac events', 'Emergency care may be needed']
      }
    },

    // UAQS Effects
    uaqs: {
      caution: {
        healthImplication: 'Combined pollution levels are rising.',
        recommendation: 'Consider using air purifier. Moderate outdoor activity.',
        effects: ['Mild symptoms possible']
      },
      warning: {
        healthImplication: 'Pollution levels warrant protective measures.',
        recommendation: 'Use air purifier. Limit strenuous outdoor activities.',
        effects: ['Respiratory irritation', 'General discomfort']
      },
      danger: {
        healthImplication: 'Critical pollution levels - health intervention needed.',
        recommendation: 'Minimize outdoor exposure. Use air purifier continuously.',
        effects: ['Significant health symptoms', 'Potential medical attention required']
      }
    },

    // CRI Effects
    cri: {
      caution: {
        healthImplication: 'Cumulative exposure is increasing.',
        recommendation: 'Monitor condition. Consider protective measures.',
        effects: ['Increased alert level']
      },
      warning: {
        healthImplication: 'Significant cumulative exposure accumulating.',
        recommendation: 'Use air purifier. Increase rest periods. Reduce outdoor time.',
        effects: ['Progressive symptom development', 'Health impact evident']
      },
      danger: {
        healthImplication: 'Dangerous cumulative exposure levels.',
        recommendation: 'Seek medical consultation. Implement strong protective measures.',
        effects: ['Serious health consequences', 'Medical intervention recommended']
      }
    }
  }
};

/**
 * Get health effects for a specific classification and metric
 * @param {string} classification - User classification
 * @param {string} metric - Metric name (pm25, aqi, uaqs, cri)
 * @param {string} severity - Severity level (caution, warning, danger)
 * @returns {object} Health effects data
 */
const getHealthEffects = (classification, metric, severity) => {
  const classificationEffects = HEALTH_EFFECTS[classification];
  const metricKey = classificationEffects?.[metric]
    ? metric
    : (metric === 'mq_score' ? 'uaqs' : metric);

  if (!classificationEffects || !classificationEffects[metricKey]) {
    return null;
  }

  return classificationEffects[metricKey][severity] || null;
};

/**
 * Generate alert message with health implications
 * @param {string} classification - User classification
 * @param {array} breachedThresholds - Array of breached threshold objects
 * @returns {object} Alert message and health implications
 */
const generateHealthAlert = (classification, breachedThresholds) => {
  if (!breachedThresholds || breachedThresholds.length === 0) {
    return null;
  }

  // Get the most severe breached threshold
  const mostSevere = breachedThresholds.reduce((max, current) => {
    const severityMap = { caution: 1, warning: 2, danger: 3 };
    return severityMap[current.severity] > severityMap[max.severity] ? current : max;
  });

  const effects = getHealthEffects(classification, mostSevere.metric, mostSevere.severity);

  if (!effects) {
    return null;
  }

  const classificationName = {
    asthma_patient: 'Asthma Patient',
    children: 'Children',
    elderly: 'Elderly',
    adults: 'General Adult'
  }[classification];

  return {
    classification,
    classificationDisplayName: classificationName,
    metric: mostSevere.metric,
    severity: mostSevere.severity,
    currentValue: mostSevere.value,
    thresholds: mostSevere.thresholds,
    healthImplication: effects.healthImplication,
    recommendations: effects.recommendation,
    potentialEffects: effects.effects,
    breachedMetrics: breachedThresholds.map(t => ({
      metric: t.metric,
      value: t.value,
      severity: t.severity
    }))
  };
};

/**
 * Get brief title for alert
 * @param {string} classification - User classification
 * @param {string} metric - Metric name
 * @param {string} severity - Severity level
 * @returns {string} Alert title
 */
const getAlertTitle = (classification, metric, severity) => {
  const severityPrefix = {
    caution: '⚠️ Caution:',
    warning: '🔴 Warning:',
    danger: '🚨 Danger:'
  };

  const metricNames = {
    pm25: 'PM2.5 Level',
    aqi: 'Air Quality Index',
    mq135_ppm: 'Gas Concentration',
    mq_score: 'Gas Score',
    uaqs: 'Unified Air Quality',
    cri: 'Risk Index',
    temperature: 'Temperature',
    humidity: 'Humidity'
  };

  const classificationNames = {
    asthma_patient: 'Asthma Patient',
    children: 'Children',
    elderly: 'Elderly',
    adults: 'General Adult'
  };

  return `${severityPrefix[severity]} ${metricNames[metric]} Alert for ${classificationNames[classification]}`;
};

module.exports = {
  HEALTH_EFFECTS,
  getHealthEffects,
  generateHealthAlert,
  getAlertTitle
};
