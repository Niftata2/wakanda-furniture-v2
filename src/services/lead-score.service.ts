export interface LeadScore {
  temp: 'HOT' | 'WARM' | 'COLD';
  budget?: string;
  location?: string;
  interest?: string;
  signals: string[];
}

const HOT_WORDS = ['order', 'buy', 'purchase', 'budget', 'moving', 'new house', 'new apartment', 'deliver', 'payment', 'place an order', 'full set', 'ትዕዛዝ', 'ግዛ'];
const WARM_WORDS = ['price', 'how much', 'show me', 'do you have', 'interested', 'looking for', 'need', 'quotation', 'quote', 'custom', 'ዋጋ', 'ስንት'];
const CITIES = ['addis', 'bole', 'hawassa', 'bahir dar', 'bahirdar', 'mekele', 'adama', 'jimma', 'dire dawa', 'piassa'];
const INTERESTS = ['sofa', 'bed', 'wardrobe', 'dining', 'table', 'chair', 'living room', 'bedroom', 'office', 'tv stand'];

export class LeadScoreService {
  static score(text: string): LeadScore {
    const t = text.toLowerCase();
    const signals: string[] = [];
    let pts = 0;

    for (const w of HOT_WORDS) if (t.includes(w)) { pts += 3; signals.push(w); }
    for (const w of WARM_WORDS) if (t.includes(w)) { pts += 1; signals.push(w); }

    const budgetMatch = t.match(/(\d[\d,]{4,})/);
    if (budgetMatch) { pts += 2; signals.push('budget'); }

    const location = CITIES.find(c => t.includes(c));
    if (location) { pts += 1; signals.push('location'); }

    const interest = INTERESTS.find(i => t.includes(i));
    if (interest) signals.push('interest');

    const temp: LeadScore['temp'] = pts >= 4 ? 'HOT' : pts >= 2 ? 'WARM' : 'COLD';
    return { temp, budget: budgetMatch?.[1], location, interest, signals };
  }
}