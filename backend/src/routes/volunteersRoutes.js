const express = require('express');
const router = express.Router();
const { registerVolunteer } = require('../controllers/volunteersController');

// Map POST / to registerVolunteer
router.post('/', registerVolunteer);

module.exports = router;
