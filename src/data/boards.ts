// All dimensions in centimeters
// Standard lumber available in Israeli hardware stores

export type BoardCategory = 'אורן' | 'עץ קשה (אלון/בוק)' | 'פלטות (לביד/MDF)';

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
  // --- אורן פיני (Pine) ---
  {
    id: 'pine-5x5',
    name: 'אורן 5×5',
    category: 'אורן',
    width: 5,
    height: 5,
    defaultLength: 100,
    availableLengths: [240, 300, 360, 420, 480],
    color: '#e2cca0',
    description: 'קרש אורן בסיסי ומרובע. מצוין לרגליים של רהיטים וקונסטרוקציות קלות.',
  },
  {
    id: 'pine-2.5x10',
    name: 'אורן 2.5×10',
    category: 'אורן',
    width: 10,
    height: 2.5,
    defaultLength: 100,
    availableLengths: [240, 300, 360, 420, 480],
    color: '#d4b785',
    description: 'קרש שטוח ודק. משמש למסגרות, ארגזים, ומדפים קטנים.',
  },
  {
    id: 'pine-2.5x15',
    name: 'אורן 2.5×15',
    category: 'אורן',
    width: 15,
    height: 2.5,
    defaultLength: 100,
    availableLengths: [240, 300, 360, 420, 480],
    color: '#cdb07c',
    description: 'קרש שטוח ורחב. מעולה לפאנלים מדפים וחזיתות פשוטות.',
  },
  {
    id: 'pine-5x10',
    name: 'אורן 5×10',
    category: 'אורן',
    width: 10,
    height: 5,
    defaultLength: 100,
    availableLengths: [240, 300, 360, 420, 480],
    color: '#bc9b61',
    description: 'הקרש הפופולרי ביותר למבנה ושלדות. סוס העבודה של כל נגריה.',
  },
  {
    id: 'pine-5x15',
    name: 'אורן 5×15',
    category: 'אורן',
    width: 15,
    height: 5,
    defaultLength: 100,
    availableLengths: [240, 300, 360, 420, 480],
    color: '#b19054',
    description: 'קרש רחב ועבה לשלדות מסיביות, בסיסי מיטה ופרגולות קטנות.',
  },

  // --- עץ קשה (Hardwoods) ---
  {
    id: 'oak-2.5x15',
    name: 'אלון מבוקע 2.5×15',
    category: 'עץ קשה (אלון/בוק)',
    width: 15,
    height: 2.5,
    defaultLength: 100,
    availableLengths: [150, 200, 250, 300],
    color: '#a07c57',
    description: 'קרש אלון פרמיום, נהדר לשולחנות סלון וגימורים יוקרתיים.',
  },
  {
    id: 'oak-4x20',
    name: 'אלון 4×20',
    category: 'עץ קשה (אלון/בוק)',
    width: 20,
    height: 4,
    defaultLength: 100,
    availableLengths: [150, 200, 250, 300],
    color: '#8d6844',
    description: 'קרש כבד ועבה מאוד מאלון, קלאסי לשולחנות אוכל ומדפים מסיביים מרחפים.',
  },
  {
    id: 'beech-3x10',
    name: 'בוק 3×10',
    category: 'עץ קשה (אלון/בוק)',
    width: 10,
    height: 3,
    defaultLength: 100,
    availableLengths: [200, 250],
    color: '#cbb6a6',
    description: 'עץ בוק בהיר וקשה במיוחד, נטול "עיניים". מושלם לחריטות.',
  },

  // --- פלטות (Panels) ---
  {
    id: 'plywood-birch-17',
    name: 'לביד ליבנה (בירצ\') 17 מ"מ',
    category: 'פלטות (לביד/MDF)',
    width: 244,
    height: 1.7,
    defaultLength: 122,
    availableLengths: [122],
    color: '#ebdca8',
    description: 'פלטת 122x244 ס"מ של סנדוויץ ליבנה פרימיום. חזק, יציב ויפה. עמיד במים.',
  },
  {
    id: 'plywood-gab-6',
    name: 'לביד גב 6 מ"מ',
    category: 'פלטות (לביד/MDF)',
    width: 244,
    height: 0.6,
    defaultLength: 122,
    availableLengths: [122],
    color: '#e4cd91',
    description: 'פלטה דקה מאוד 122x244 ס"מ לגב ארונות ותחתית מגירות.',
  },
  {
    id: 'mdf-17',
    name: 'MDF 17 מ"מ',
    category: 'פלטות (לביד/MDF)',
    width: 244,
    height: 1.7,
    defaultLength: 122,
    availableLengths: [122],
    color: '#bba783',
    description: 'פלטת מעבד 122x244. אידיאלית לארונות ולצביעה אטומה. רגיש למים.',
  },
];

export const BOARD_CATEGORIES: BoardCategory[] = [
  'אורן', 'עץ קשה (אלון/בוק)', 'פלטות (לביד/MDF)'
];

export function getBoardById(id: string): BoardType | undefined {
  return BOARD_TYPES.find(b => b.id === id);
}
