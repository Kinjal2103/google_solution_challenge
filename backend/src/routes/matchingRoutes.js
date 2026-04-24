const express = require('express');
const { runMatching } = require('../controllers/matchingController');

const router = express.Router();

/**
 * POST /match
 * Run volunteer matching for a given need
 * @param {string} need_id - The need ID to match volunteers for
 * @param {number} top_k - Number of top matches to return (default 5)
 */
router.post('/', async (req, res) => {
  try {
    const { need_id, top_k } = req.body;

    if (!need_id) {
      return res.status(400).json({ error: 'need_id is required' });
    }

    const topK = top_k || 5;
    const result = await runMatching(need_id, topK);

    res.json(result);
  } catch (error) {
    console.error('Matching endpoint error:', error);
    res.status(500).json({ error: error.message || 'Matching failed' });
  }
});

module.exports = router;
