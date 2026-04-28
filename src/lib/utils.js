import { clsx } from 'clsx';

export function cn(...inputs) {
  return clsx(inputs);
}

export function formatDate(date) {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatTime(date) {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function calculateBMI(weight, height) {
  if (!weight || !height) return null;
  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);
  return Math.round(bmi * 10) / 10;
}

export function getBMICategory(bmi) {
  if (!bmi) return null;
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-500' };
  if (bmi < 25) return { label: 'Normal', color: 'text-green-500' };
  if (bmi < 30) return { label: 'Overweight', color: 'text-yellow-500' };
  return { label: 'Obese', color: 'text-red-500' };
}

export function calculateAge(dob) {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function getMacroColor(macro) {
  const colors = {
    protein: '#166534',
    carbs: '#d97706',
    fat: '#0ea5e9',
  };
  return colors[macro] || '#6b7280';
}

export function parsePlanJSON(raw) {
  if (!raw) return null;
  try {
    // Step 1: Strip any markdown code fences and trim
    const cleaned = raw
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    return JSON.parse(cleaned);
  } catch {
    try {
      // Step 2: Find the outermost { ... } block (handles text before/after JSON)
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        return JSON.parse(raw.slice(start, end + 1));
      }
    } catch {
      // Step 3: Last resort — regex-based extraction
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { return JSON.parse(jsonMatch[0]); } catch { /* falls through */ }
      }
    }
    return null;
  }
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function getDayStreak(logs) {
  if (!logs || logs.length === 0) return 0;
  const sorted = [...logs].sort((a, b) => {
    const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
    const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
    return dateB - dateA;
  });

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sorted.length; i++) {
    const logDate = sorted[i].date?.toDate ? sorted[i].date.toDate() : new Date(sorted[i].date);
    logDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today - logDate) / (1000 * 60 * 60 * 24));
    if (diffDays === i) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export const MEAL_TYPES = ['Breakfast', 'Mid-Morning Snack', 'Lunch', 'Evening Snack', 'Dinner'];

export const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
  { value: 'light', label: 'Lightly Active', desc: '1-3 days/week' },
  { value: 'moderate', label: 'Moderately Active', desc: '3-5 days/week' },
  { value: 'very_active', label: 'Very Active', desc: '6-7 days/week' },
  { value: 'extra_active', label: 'Extra Active', desc: 'Twice a day or heavy labor' },
];
