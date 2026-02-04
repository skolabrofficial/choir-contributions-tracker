// Školní rok začíná v září a končí v červnu
export const SCHOOL_YEAR_MONTHS = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6]; // září až červen
export const MONTHLY_FEE = 100; // 100 Kč za měsíc

export function getCurrentSchoolYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // getMonth() vrací 0-11
  
  // Pokud jsme v období září-prosinec, školní rok je aktuální/příští
  // Pokud jsme v období leden-srpen, školní rok je předchozí/aktuální
  if (month >= 9) {
    return `${year}/${(year + 1).toString().slice(-2)}`;
  } else {
    return `${year - 1}/${year.toString().slice(-2)}`;
  }
}

export function getCurrentMonth(): number {
  return new Date().getMonth() + 1;
}

export function getMonthName(month: number): string {
  const months: Record<number, string> = {
    1: 'Leden',
    2: 'Únor',
    3: 'Březen',
    4: 'Duben',
    5: 'Květen',
    6: 'Červen',
    7: 'Červenec',
    8: 'Srpen',
    9: 'Září',
    10: 'Říjen',
    11: 'Listopad',
    12: 'Prosinec',
  };
  return months[month] || '';
}

export function getMonthNameShort(month: number): string {
  const months: Record<number, string> = {
    1: 'Led',
    2: 'Úno',
    3: 'Bře',
    4: 'Dub',
    5: 'Kvě',
    6: 'Čer',
    7: 'Čvc',
    8: 'Srp',
    9: 'Zář',
    10: 'Říj',
    11: 'Lis',
    12: 'Pro',
  };
  return months[month] || '';
}

export function isMonthInSchoolYear(month: number): boolean {
  return SCHOOL_YEAR_MONTHS.includes(month);
}

export function getSchoolYearMonthsOrdered(): number[] {
  return SCHOOL_YEAR_MONTHS;
}

export function getTotalYearlyFee(): number {
  return SCHOOL_YEAR_MONTHS.length * MONTHLY_FEE;
}

export function calculatePaymentStatus(paidMonths: number[], currentMonth: number): {
  isPaidCurrentMonth: boolean;
  unpaidMonths: number[];
  paidCount: number;
  totalMonths: number;
} {
  const schoolYearMonths = getSchoolYearMonthsOrdered();
  const unpaidMonths = schoolYearMonths.filter(m => !paidMonths.includes(m));
  const isPaidCurrentMonth = paidMonths.includes(currentMonth);
  
  return {
    isPaidCurrentMonth,
    unpaidMonths,
    paidCount: paidMonths.length,
    totalMonths: schoolYearMonths.length,
  };
}
