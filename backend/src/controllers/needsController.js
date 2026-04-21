const supabase = require('../config/supabase');
const { calculateUrgencyScore } = require('../utils/scoring');

/**
 * Handle POST /api/needs
 * Accepts JSON body and inserts a new need into Supabase with an urgency score.
 */
const createNeed = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      category, 
      zone, 
      severity, 
      vulnerability_index, 
      people_affected, 
      organization_id 
    } = req.body;

    // Calculate urgency score using utility function
    const urgency_score = calculateUrgencyScore({
      category,
      severity,
      vulnerability_index,
      people_affected
    });

    // Insert into Supabase
    const { data, error } = await supabase
      .from('needs')
      .insert([
        {
          title,
          description,
          category,
          zone,
          severity,
          vulnerability_index,
          people_affected,
          organization_id,
          urgency_score
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase Error (insert):', error);
      return res.status(500).json({ error: 'Failed to insert need into database' });
    }

    return res.status(201).json({
      message: 'Need created successfully',
      record: data,
      score: urgency_score
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handle GET /api/needs/active
 * Queries the Supabase v_open_needs view.
 * Allows optional filtering by zone.
 */
const getActiveNeeds = async (req, res) => {
  try {
    const { zone } = req.query;

    let query = supabase.from('v_open_needs').select('*');

    if (zone) {
      query = query.eq('zone', zone);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase Error (query):', error);
      return res.status(500).json({ error: 'Failed to fetch active needs' });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createNeed,
  getActiveNeeds
};
