import { SymptomLog } from '../types';

export enum CyclePhase {
  Menstrual,
  Follicular,
  Ovulation,
  Luteal,
  Unknown
}

interface Advice {
  nutrition: string;
  wellness: string;
}

const defaultAdvice: Advice = {
    nutrition: "Hydratez-vous bien et maintenez une alimentation équilibrée tout au long de votre cycle.",
    wellness: "Écoutez votre corps et ajustez vos activités en fonction de votre niveau d'énergie."
};

const adviceMap: Record<CyclePhase, Advice> = {
  [CyclePhase.Menstrual]: {
    nutrition: "Privilégiez les aliments riches en fer comme les épinards et les lentilles pour compenser les pertes. Le gingembre peut aider à soulager les crampes.",
    wellness: "Optez pour des exercices doux comme le yoga ou la marche. Un bain chaud peut aider à détendre les muscles et apaiser les douleurs."
  },
  [CyclePhase.Follicular]: {
    nutrition: "C'est le moment de faire le plein d'énergie avec des glucides complexes (avoine, quinoa) et des protéines maigres.",
    wellness: "Votre énergie augmente ! Profitez-en pour des entraînements plus intenses comme la course à pied ou le cardio."
  },
  [CyclePhase.Ovulation]: {
    nutrition: "Soutenez votre foie avec des légumes crucifères (brocoli, chou-fleur) et des aliments riches en antioxydants comme les baies.",
    wellness: "Vous êtes à votre pic d'énergie et de sociabilité. C'est le moment idéal pour des activités de groupe ou un entraînement de force."
  },
  [CyclePhase.Luteal]: {
    nutrition: "Limitez le sucre et la caféine pour réduire les sautes d'humeur. Augmentez votre apport en magnésium (chocolat noir, amandes) pour réduire les crampes.",
    wellness: "Privilégiez des activités apaisantes comme la méditation ou la lecture. Si vous vous sentez irritable, une séance de sport modérée peut aider."
  },
  [CyclePhase.Unknown]: defaultAdvice
};


export const getPersonalizedAdvice = (phase: CyclePhase, symptom?: SymptomLog): Advice => {
    let baseAdvice = { ...adviceMap[phase] } || { ...defaultAdvice };
    
    if (symptom) {
        // Personalize wellness advice based on pain
        switch (symptom.pain) {
            case 'légère':
                baseAdvice.wellness += " Des étirements doux ou une promenade peuvent aider à soulager l'inconfort.";
                break;
            case 'modérée':
                baseAdvice.wellness += " Une bouillotte chaude sur le bas-ventre ou le dos peut apporter un grand soulagement.";
                break;
            case 'forte':
                baseAdvice.wellness += " Le repos est essentiel. N'hésitez pas à ralentir et à envisager un anti-douleur si nécessaire, après avis médical.";
                break;
        }

        // Personalize wellness advice based on mood
        if (symptom.mood === 'irritable' || symptom.mood === 'triste') {
            baseAdvice.wellness += " Une tisane relaxante (camomille, verveine) ou quelques minutes de méditation peuvent vous aider à vous recentrer.";
        }
    }

    return baseAdvice;
}