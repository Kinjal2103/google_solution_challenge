/**
 * Calculates the urgency score for a given need.
 * @param {Object} data
 * @param {string} data.category
 * @param {number} data.severity
 * @param {number} data.vulnerability_index
 * @param {number} data.people_affected
 * @returns {number} Score capped at 100
 */
function calculateUrgencyScore({ category, severity, vulnerability_index, people_affected }) {
  // Base Score: Medical/Rescue = 80, Food/Water = 60, Shelter = 50, others = 20.
  let baseScore = 20;
  const lowerCategory = category ? category.toLowerCase() : '';
  
  if (lowerCategory.includes('medical') || lowerCategory.includes('rescue')) {
    baseScore = 80;
  } else if (lowerCategory.includes('food') || lowerCategory.includes('water')) {
    baseScore = 60;
  } else if (lowerCategory.includes('shelter')) {
    baseScore = 50;
  }

  // Math: Score = (Base * 0.4) + (severity * 10) + (vulnerability_index * 8).
  // Scale: Add people_affected * 0.5 points.
  let score = (baseScore * 0.4) + (severity * 10) + (vulnerability_index * 8) + (people_affected * 0.5);

  // Constraint: Ensure the final score is an integer and capped at 100.
  score = Math.floor(score);
  
  return Math.min(score, 100);
}

module.exports = { calculateUrgencyScore };
