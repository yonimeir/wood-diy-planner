// All dimensions in centimeters
// Standard lumber available in Israeli hardware stores

export type BoardCategory = 'רגלית' | 'לוח' | 'ביקוש' | 'קורה' | 'פורניר' | 'MDF';

export interface BoardType {
  id: string;
  name: string;
  category: BoardCategory;
  width: number;   // cm - actual dimension (X)
  height: number;  // cm - actual dimension (Y / thickness)
  defaultLength: number; // cm
  availableLengths: number[]; // cm - standard lengths sold in Israel
  color: string;   // hex color for 3D render
  description: string;
}

export const BOARD_TYPES: BoardType[] = [
  // רגליות (structural lumber - "studs")
  {
    id: 'raglit-5x10',
    name: 'רגלית 5×10',
    category: 'רגלית',
    width: 10,
    height: 5,
    defaultLength: 100,
    availableLengths: [240, 300, 360, 420, 480, 600],
    color: '#c8a26b',
    description: 'שוות ערך ל-2×4 אמריקאי, שימושי ביותר לפרויקטים',
  },
  {
    id: 'raglit-5x15',
    name: 'רגלית 5×15',
    category: 'רגלית',
    width: 15,
    height: 5,
    defaultLength: 100,
    availableLengths: [240, 300, 360, 420, 480, 600],
    color: '#c4a060',
    description: 'שוות ערך ל-2×6, לבנייה מסיבית יותר',
  },
  {
    id: 'raglit-5x20',
    name: 'רגלית 5×20',
    category: 'רגלית',
    width: 20,
    height: 5,
    defaultLength: 100,
    availableLengths: [240, 300, 360, 420, 480, 600],
    color: '#bf9a58',
    description: 'שוות ערך ל-2×8, לקורות ומדפים עמוסים',
  },

  // לוחות (boards / planks)
  {
    id: 'luach-2.5x10',
    name: 'לוח 2.5×10',
    category: 'לוח',
    width: 10,
    height: 2.5,
    defaultLength: 100,
    availableLengths: [240, 300, 360, 420, 480, 600],
    color: '#d4aa7d',
    description: 'לוח דק לעיטוף, פסים ואביזור',
  },
  {
    id: 'luach-2.5x15',
    name: 'לוח 2.5×15',
    category: 'לוח',
    width: 15,
    height: 2.5,
    defaultLength: 100,
    availableLengths: [240, 300, 360, 420, 480, 600],
    color: '#d0a875',
    description: 'לוח דק רחב',
  },
  {
    id: 'luach-2.5x20',
    name: 'לוח 2.5×20',
    category: 'לוח',
    width: 20,
    height: 2.5,
    defaultLength: 100,
    availableLengths: [240, 300, 360, 420, 480, 600],
    color: '#cca56e',
    description: 'לוח רחב לדלתות, חזיתות ומדפים',
  },

  // ביקוש (square stock)
  {
    id: 'bikusha-5x5',
    name: 'ביקוש 5×5',
    category: 'ביקוש',
    width: 5,
    height: 5,
    defaultLength: 100,
    availableLengths: [240, 300, 360, 420, 480],
    color: '#b8956a',
    description: 'קרש מרובע קטן, לרגלי שולחנות וכסאות',
  },
  {
    id: 'bikusha-7x7',
    name: 'ביקוש 7×7',
    category: 'ביקוש',
    width: 7,
    height: 7,
    defaultLength: 100,
    availableLengths: [240, 300, 360, 420, 480],
    color: '#b49060',
    description: 'ביקוש בינוני, לרגלי שולחן חזקות',
  },

  // קורות (beams)
  {
    id: 'kora-7x7',
    name: 'קורה 7×7',
    category: 'קורה',
    width: 7,
    height: 7,
    defaultLength: 100,
    availableLengths: [240, 300, 360, 420, 480, 600],
    color: '#a07840',
    description: 'קורה בינונית למדפים כבדים ומסגרות',
  },
  {
    id: 'kora-10x10',
    name: 'קורה 10×10',
    category: 'קורה',
    width: 10,
    height: 10,
    defaultLength: 100,
    availableLengths: [240, 300, 360, 420, 480, 600],
    color: '#9a7038',
    description: 'קורה כבדה למבנים גדולים',
  },

  // פורניר (plywood sheets)
  {
    id: 'purnir-6mm',
    name: 'פורניר 6 מ"מ',
    category: 'פורניר',
    width: 244,
    height: 0.6,
    defaultLength: 122,
    availableLengths: [122],
    color: '#e8c98a',
    description: 'גיליון פורניר דק 122×244 ס"מ, לגבים ועטיפות',
  },
  {
    id: 'purnir-9mm',
    name: 'פורניר 9 מ"מ',
    category: 'פורניר',
    width: 244,
    height: 0.9,
    defaultLength: 122,
    availableLengths: [122],
    color: '#e4c483',
    description: 'גיליון פורניר 122×244 ס"מ',
  },
  {
    id: 'purnir-12mm',
    name: 'פורניר 12 מ"מ',
    category: 'פורניר',
    width: 244,
    height: 1.2,
    defaultLength: 122,
    availableLengths: [122],
    color: '#e0bf7c',
    description: 'גיליון פורניר בינוני 122×244 ס"מ, לצדי ארונות',
  },
  {
    id: 'purnir-18mm',
    name: 'פורניר 18 מ"מ',
    category: 'פורניר',
    width: 244,
    height: 1.8,
    defaultLength: 122,
    availableLengths: [122],
    color: '#dcba74',
    description: 'גיליון פורניר עבה 122×244 ס"מ, לרצפות ומדפים',
  },

  // MDF
  {
    id: 'mdf-12mm',
    name: 'MDF 12 מ"מ',
    category: 'MDF',
    width: 244,
    height: 1.2,
    defaultLength: 122,
    availableLengths: [122],
    color: '#c8b89a',
    description: 'גיליון MDF 122×244 ס"מ, לריהוט ועבודות צביעה',
  },
  {
    id: 'mdf-18mm',
    name: 'MDF 18 מ"מ',
    category: 'MDF',
    width: 244,
    height: 1.8,
    defaultLength: 122,
    availableLengths: [122],
    color: '#c4b492',
    description: 'גיליון MDF עבה 122×244 ס"מ, לארונות ומדפים',
  },
  {
    id: 'mdf-22mm',
    name: 'MDF 22 מ"מ',
    category: 'MDF',
    width: 244,
    height: 2.2,
    defaultLength: 122,
    availableLengths: [122],
    color: '#c0b08a',
    description: 'גיליון MDF כבד 122×244 ס"מ',
  },
];

export const BOARD_CATEGORIES: BoardCategory[] = [
  'רגלית', 'לוח', 'ביקוש', 'קורה', 'פורניר', 'MDF',
];

export function getBoardById(id: string): BoardType | undefined {
  return BOARD_TYPES.find(b => b.id === id);
}
