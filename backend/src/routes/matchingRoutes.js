const express = require('express');
const { runMatching } = require('../controllers/matchingController');
const supabase = require('../config/supabase');

const router = express.Router();

/**
 * POST /match
 * Run volunteer matching for a given need
 * @param {string} need_id - The need ID to match volunteers for
 * @param {number} top_k - Number of top matches to return (default 5)
 * @param {boolean} auto_assign - If true, also create assignments for top matches
 * @param {number} assign_count - How many volunteers to auto-assign (defaults to need.volunteer_count_needed or 1)
 */
router.post('/', async (req, res) => {
  try {
    const { need_id, top_k, auto_assign, assign_count } = req.body;

    if (!need_id) {
      return res.status(400).json({ error: 'need_id is required' });
    }

    const topK = top_k || 5;
    const result = await runMatching(need_id, topK);

    if (!auto_assign) {
      return res.json(result);
    }

    const { data: need, error: needError } = await supabase
      .from('needs')
      .select('id, status, volunteer_count_needed')
      .eq('id', need_id)
      .maybeSingle();

    if (needError) {
      return res.status(500).json({ error: `Failed to fetch need: ${needError.message}` });
    }

    if (!need) {
      return res.status(404).json({ error: 'Need not found' });
    }

    const targetCount =
      typeof assign_count === 'number'
        ? Math.max(1, Math.floor(assign_count))
        : Math.max(1, Math.floor(need.volunteer_count_needed || 1));

    const assigned = [];
    for (const match of (result.matches || []).slice(0, targetCount)) {
      // Skip if already assigned
      const { data: existingAssignment, error: existingError } = await supabase
        .from('assignments')
        .select('id')
        .eq('need_id', need_id)
        .eq('volunteer_id', match.volunteer_id)
        .maybeSingle();

      if (existingError) {
        return res.status(500).json({ error: `Failed to check existing assignments: ${existingError.message}` });
      }

      if (existingAssignment) {
        continue;
      }

      const { data: newAssignment, error: insertError } = await supabase
        .from('assignments')
        .insert([
          {
            need_id,
            volunteer_id: match.volunteer_id,
            status: 'pending',
            assigned_by: 'auto_match',
          },
        ])
        .select()
        .single();

      if (insertError) {
        return res.status(500).json({ error: `Failed to create assignment: ${insertError.message}` });
      }

      assigned.push(newAssignment);
    }

    if (assigned.length > 0) {
      const { error: needUpdateError } = await supabase
        .from('needs')
        .update({ status: 'assigned' })
        .eq('id', need_id);

      if (needUpdateError) {
        return res.status(500).json({ error: `Failed to update need status: ${needUpdateError.message}` });
      }
    }

    return res.json({
      ...result,
      auto_assigned: assigned,
    });
  } catch (error) {
    console.error('Matching endpoint error:', error);
    res.status(500).json({ error: error.message || 'Matching failed' });
  }
});

module.exports = router;
