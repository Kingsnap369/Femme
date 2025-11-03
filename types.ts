
export interface PeriodEntry {
  startDate: string; // ISO string
}

export interface SymptomLog {
  date: string; // ISO string
  mood: 'heureuse' | 'calme' | 'triste' | 'irritable' | 'energique';
  pain: 'aucune' | 'légère' | 'modérée' | 'forte';
  flow: 'aucune' | 'léger' | 'moyen' | 'abondant';
}

export interface ActivityLog {
  date: string; // ISO string
}

export interface CycleSettings {
  cycleLength: number;
  periodLength: number;
  notifications: {
    period: boolean;
    ovulation: boolean;
  };
}

export enum DayType {
  Period,
  Fertile,
  Ovulation,
  Safe,
  Future,
}
