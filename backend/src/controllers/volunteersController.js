const supabase = require('../config/supabaseClient'); // Ensure this points to your configured Supabase client

const registerVolunteer = async (req, res) => {
  try {
    const { organization_id, full_name, email, phone, zone, skills } = req.body;

    const { data, error } = await supabase
      .from('volunteers')
      .insert([
        {
          organization_id,
          full_name,
          email,
          phone,
          zone,
          skills // Array of strings
        }
      ])
      .select();

    if (error) {
      console.error('Supabase Error:', error);
      return res.status(500).json({ error: 'Failed to register volunteer', details: error.message });
    }

    return res.status(201).json(data[0]);
  } catch (err) {
    console.error('Unexpected Server Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  registerVolunteer
};
