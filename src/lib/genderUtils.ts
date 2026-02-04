// České ženské přípony pro rozpoznání pohlaví
const femaleEndings = [
  'a', 'ie', 'ová', 'ka', 'na', 'da', 'ta', 'la', 'ra', 'sa', 'za', 'ce', 'še', 'ře', 'ně', 'le'
];

// Výjimky - mužská jména končící na 'a'
const maleExceptions = [
  'Nikola', 'Míša', 'Saša', 'Jirka', 'Honza', 'Láďa', 'Péťa', 'Víťa', 'Míra', 'Standa',
  'Franta', 'Tonda', 'Jenda', 'Vašek', 'Jára', 'Béďa', 'Kuba', 'Radka'
];

// Ženská jména pro jistotu
const femaleNames = [
  'Marie', 'Jana', 'Eva', 'Anna', 'Hana', 'Lenka', 'Petra', 'Lucie', 'Kateřina', 'Věra',
  'Alena', 'Jaroslava', 'Ivana', 'Zdeňka', 'Michaela', 'Martina', 'Jitka', 'Helena',
  'Ludmila', 'Zuzana', 'Barbora', 'Tereza', 'Markéta', 'Vlasta', 'Božena', 'Růžena',
  'Jiřina', 'Marta', 'Dagmar', 'Dana', 'Monika', 'Simona', 'Renata', 'Gabriela',
  'Kristýna', 'Veronika', 'Pavla', 'Daniela', 'Šárka', 'Olga', 'Andrea', 'Eliška'
];

export function detectGender(firstName: string): 'male' | 'female' {
  const name = firstName.trim();
  
  // Kontrola známých ženských jmen
  if (femaleNames.some(fn => fn.toLowerCase() === name.toLowerCase())) {
    return 'female';
  }
  
  // Kontrola mužských výjimek
  if (maleExceptions.some(mn => mn.toLowerCase() === name.toLowerCase())) {
    return 'male';
  }
  
  // Kontrola koncovky
  const lowerName = name.toLowerCase();
  for (const ending of femaleEndings) {
    if (lowerName.endsWith(ending.toLowerCase())) {
      return 'female';
    }
  }
  
  return 'male';
}

export function getMemberLabel(gender: 'male' | 'female'): string {
  return gender === 'female' ? 'členka' : 'člen';
}

export function getMemberLabelGenitive(gender: 'male' | 'female'): string {
  return gender === 'female' ? 'členky' : 'člena';
}

export function getPaymentLabel(gender: 'male' | 'female'): string {
  return gender === 'female' ? 'Platby členky' : 'Platby člena';
}

export function getPaidLabel(gender: 'male' | 'female'): string {
  return gender === 'female' ? 'Zaplaceno' : 'Zaplaceno';
}

export function getUnpaidLabel(gender: 'male' | 'female'): string {
  return gender === 'female' ? 'Nezaplaceno' : 'Nezaplaceno';
}
