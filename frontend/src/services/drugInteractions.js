const INTERACTIONS_DATABASE = [
  {
    drugs: ['aspirin', 'warfarin'],
    severity: 'High',
    effect: 'Concomitant use of Aspirin and Warfarin significantly increases the risk of severe gastrointestinal and internal bleeding.'
  },
  {
    drugs: ['ibuprofen', 'aspirin'],
    severity: 'Medium',
    effect: 'Ibuprofen may decrease the cardioprotective effect of low-dose aspirin. Combining them also increases stomach ulcer risk.'
  },
  {
    drugs: ['sildenafil', 'nitroglycerin'],
    severity: 'Critical',
    effect: 'Nitroglycerin and Sildenafil combined can cause a dangerous, life-threatening drop in blood pressure.'
  },
  {
    drugs: ['metoprolol', 'lisinopril'],
    severity: 'Low',
    effect: 'Metoprolol and Lisinopril both lower blood pressure. Taking them together increases the risk of dizziness, lightheadedness, or fainting.'
  },
  {
    drugs: ['warfarin', 'ibuprofen'],
    severity: 'High',
    effect: 'Ibuprofen can increase bleeding risk when taken with anticoagulants like Warfarin.'
  }
];

// Fallback logic using local static rules
const getLocalInteractions = (medicinesList) => {
  const alerts = [];
  const names = medicinesList.map(m => m.name.toLowerCase().trim());

  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const nameA = names[i];
      const nameB = names[j];

      INTERACTIONS_DATABASE.forEach(interaction => {
        if (
          (interaction.drugs[0] === nameA && interaction.drugs[1] === nameB) ||
          (interaction.drugs[0] === nameB && interaction.drugs[1] === nameA)
        ) {
          alerts.push({
            medA: medicinesList[i].name,
            medB: medicinesList[j].name,
            severity: interaction.severity,
            effect: interaction.effect
          });
        }
      });
    }
  }
  return alerts;
};

/**
 * Checks for drug-drug interactions between medications.
 * Uses a curated local clinical interactions database.
 * (External RxNav API removed — it returned 404 for most combinations
 * and browser-level network errors cannot be suppressed in JavaScript.)
 */
export const checkInteractions = async (medicinesList = []) => {
  if (medicinesList.length < 2) return [];
  return getLocalInteractions(medicinesList);
};
