const supabase = require('../config/supabase');

/**
 * Calculate match score between a need and a volunteer
 * @param {Object} need - The need to match
 * @param {Object} volunteer - The volunteer to evaluate
 * @returns {number} Match score between 0 and 1
 */
function calculateMatchScore(need, volunteer) {
  let score = 0;
  let weights = 0;

  // 1. Zone proximity (20% weight)
  if (need.zone && volunteer.zone) {
    const zoneMatch = need.zone.toLowerCase() === volunteer.zone.toLowerCase() ? 1 : 0.3;
    score += zoneMatch * 0.20;
    weights += 0.20;
  }

  // 2. Skill overlap (30% weight)
  if (need.required_skills && Array.isArray(need.required_skills) && volunteer.skills && Array.isArray(volunteer.skills)) {
    const requiredSkills = need.required_skills.map(s => s.toLowerCase());
    const volunteerSkills = volunteer.skills.map(s => s.toLowerCase());
    
    if (requiredSkills.length > 0) {
      const matchedSkills = requiredSkills.filter(skill => volunteerSkills.includes(skill)).length;
      const skillRatio = matchedSkills / requiredSkills.length;
      score += skillRatio * 0.30;
      weights += 0.30;
    }
  }

  // 3. Reliability score (35% weight) - if available
  if (volunteer.reliability_score !== null && volunteer.reliability_score !== undefined) {
    // Normalize reliability score (assuming 0-100 range)
    const normalizedReliability = Math.min(volunteer.reliability_score / 100, 1);
    score += normalizedReliability * 0.35;
    weights += 0.35;
  }

  // 4. Active/Available status (15% weight)
  if (volunteer.active === true) {
    score += 1 * 0.15;
    weights += 0.15;
  }

  // Normalize the score to 0-1 range
  return weights > 0 ? score / weights : 0;
}

/**
 * Get reasons why a volunteer was matched to a need
 * @param {Object} need 
 * @param {Object} volunteer 
 * @returns {Array<string>} Array of match reason strings
 */
function getMatchReasons(need, volunteer) {
  const reasons = [];

  // Zone match
  if (need.zone && volunteer.zone) {
    if (need.zone.toLowerCase() === volunteer.zone.toLowerCase()) {
      reasons.push(`Located in same zone (${need.zone})`);
    } else {
      reasons.push(`Operates in nearby zone (${volunteer.zone})`);
    }
  }

  // Skill match
  if (need.required_skills && Array.isArray(need.required_skills) && volunteer.skills && Array.isArray(volunteer.skills)) {
    const requiredSkills = need.required_skills.map(s => s.toLowerCase());
    const volunteerSkills = volunteer.skills.map(s => s.toLowerCase());
    const matchedSkills = requiredSkills.filter(skill => volunteerSkills.includes(skill));
    
    if (matchedSkills.length > 0) {
      reasons.push(`Has required skills: ${matchedSkills.join(', ')}`);
    }
  }

  // Reliability
  if (volunteer.reliability_score && volunteer.reliability_score >= 80) {
    reasons.push(`High reliability score (${volunteer.reliability_score}/100)`);
  } else if (volunteer.reliability_score && volunteer.reliability_score >= 60) {
    reasons.push(`Good reliability score (${volunteer.reliability_score}/100)`);
  }

  // Availability
  if (volunteer.active === true) {
    reasons.push('Currently active and available');
  }

  if (reasons.length === 0) {
    reasons.push('Matches general criteria');
  }

  return reasons;
}

/**
 * Run volunteer matching for a given need
 * @param {string} needId - The need ID to match volunteers for
 * @param {number} topK - Number of top matches to return (default 5)
 * @returns {Object} { matches: Array<{volunteer_id, score, reasons}> }
 */
async function runMatching(needId, topK = 5) {
  try {
    // Fetch the need
    const { data: need, error: needError } = await supabase
      .from('needs')
      .select('*')
      .eq('id', needId)
      .maybeSingle();

    if (needError) {
      throw new Error(`Failed to fetch need: ${needError.message}`);
    }

    if (!need) {
      throw new Error('Need not found');
    }

    // Fetch all active volunteers
    const { data: volunteers, error: volunteerError } = await supabase
      .from('volunteers')
      .select('*')
      .eq('active', true);

    if (volunteerError) {
      throw new Error(`Failed to fetch volunteers: ${volunteerError.message}`);
    }

    if (!volunteers || volunteers.length === 0) {
      return { matches: [] };
    }

    // Calculate match scores for all volunteers
    const scoredMatches = volunteers
      .map(volunteer => ({
        volunteer_id: volunteer.id,
        volunteer_name: volunteer.full_name || volunteer.name || 'Unknown',
        score: calculateMatchScore(need, volunteer),
        volunteer,
        need
      }))
      .filter(match => match.score > 0) // Only include volunteers with non-zero scores
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .slice(0, topK); // Get top K matches

    // Generate reasons for each match
    const matches = scoredMatches.map(match => ({
      volunteer_id: match.volunteer_id,
      score: match.score,
      reasons: getMatchReasons(match.need, match.volunteer)
    }));

    return { matches };
  } catch (error) {
    console.error('Matching error:', error);
    throw error;
  }
}

module.exports = { runMatching, calculateMatchScore, getMatchReasons };
