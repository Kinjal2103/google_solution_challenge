const express = require('express');
const router = express.Router();
const needsController = require('../controllers/needsController');

router.post('/', needsController.createNeed);
router.get('/active', needsController.getActiveNeeds);

module.exports = router;
