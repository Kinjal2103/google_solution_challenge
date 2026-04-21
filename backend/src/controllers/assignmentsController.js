const supabase = require('../config/supabase');

/**
 * Handle POST /api/assignments
 * Accepts need_id and volunteer_id.
 * Checks for existing assignment to prevent duplicates.
 * Inserts new assignment with status 'pending'.
 * Updates need status to 'assigned'.
 * Handles errors gracefully (e.g. rolls back assignment if need update fails).
 */
const createAssignment = async (req, res) => {
  try {
    const { need_id, volunteer_id } = req.body;

    if (!need_id || !volunteer_id) {
      return res.status(400).json({ error: 'need_id and volunteer_id are required' });
    }

    // Step 1: Check if volunteer is already assigned to this need
    const { data: existingAssignment, error: existingError } = await supabase
      .from('assignments')
      .select('*')
      .eq('need_id', need_id)
      .eq('volunteer_id', volunteer_id)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      // PGRST116 indicates no data found (which is expected if not duplicate)
      console.error('Supabase check assignment error:', existingError);
      return res.status(500).json({ error: 'Failed to check existing assignments' });
    }

    if (existingAssignment) {
      return res.status(409).json({ error: 'Volunteer is already assigned to this need' });
    }

    // Step 2: Insert new record into assignments table
    const { data: newAssignment, error: insertError } = await supabase
      .from('assignments')
      .insert([
        {
          need_id,
          volunteer_id,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert assignment error:', insertError);
      return res.status(500).json({ error: 'Failed to create assignment record' });
    }

    // Step 3: Update the needs table status
    const { error: updateError } = await supabase
      .from('needs')
      .update({ status: 'assigned' })
      .eq('id', need_id);

    if (updateError) {
      console.error('Supabase update need status error:', updateError);
      
      // Rollback assignment
      await supabase
        .from('assignments')
        .delete()
        .eq('id', newAssignment.id);

      return res.status(500).json({ error: 'Failed to update need status, assignment was rolled back' });
    }

    return res.status(201).json(newAssignment);

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createAssignment
};
