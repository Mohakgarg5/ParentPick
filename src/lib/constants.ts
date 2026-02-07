export const AGE_GROUPS = [
  { label: "Tiny Explorers", ageMin: 1, ageMax: 2, color: "bg-pink-100 text-pink-700", icon: "🐣" },
  { label: "Curious Toddlers", ageMin: 2, ageMax: 3, color: "bg-purple-100 text-purple-700", icon: "🧸" },
  { label: "Little Learners", ageMin: 3, ageMax: 4, color: "bg-blue-100 text-blue-700", icon: "📚" },
  { label: "Preschool Pals", ageMin: 4, ageMax: 5, color: "bg-green-100 text-green-700", icon: "🎨" },
  { label: "Kindergarten Kids", ageMin: 5, ageMax: 6, color: "bg-amber-100 text-amber-700", icon: "🎒" },
] as const;

export const SITUATIONAL_TAGS = [
  "Bedtime Wind-Down",
  "Meal Prep",
  "Tantrum Moments",
  "Skill Bridge",
  "Public Reset",
  "Quick Switch",
  "Sibling Nap",
  "Travel",
] as const;

export const CATEGORIES = [
  "Educational",
  "Calming",
  "Creative",
  "Social Skills",
  "Language",
  "Motor Skills",
] as const;

export const CONCERNS = [
  "Sleep disruption from screens",
  "Attention & focus issues",
  "Content safety & appropriateness",
  "Too much screen time overall",
  "Finding quality educational content",
  "YouTube algorithm showing bad content",
  "Behavioral changes after screen time",
] as const;

export const SITUATIONS = [
  "Bedtime wind-down",
  "Meal prep / cooking time",
  "Travel & car rides",
  "Restaurant or public places",
  "Learning new skills (potty, brushing teeth)",
  "Sibling nap time",
  "Work-from-home moments",
  "After school decompression",
] as const;

export const CONTENT_PREFERENCES = [
  "Educational & learning",
  "Calming & slow-paced",
  "Creative & artistic",
  "Social skills & emotions",
  "Music & songs",
  "Physical activity & dance",
  "Nature & animals",
  "Stories & reading",
] as const;

export const FEEDBACK_CRITERIA = [
  { key: "educationalRating", label: "Educational Value", description: "How much did your child learn?" },
  { key: "ageAppropriateRating", label: "Age Appropriateness", description: "Was it right for your child's age?" },
  { key: "engagementRating", label: "Child Engagement", description: "How engaged was your child?" },
  { key: "overallRating", label: "Overall Rating", description: "Your overall impression" },
] as const;

export const HELPFUL_TAGS = [
  "Helped with tantrums",
  "Good for calming",
  "Educational value",
  "Kept attention well",
  "Good for bedtime",
  "Safe to leave on",
  "Encourages interaction",
  "Too stimulating",
  "Age appropriate",
] as const;
