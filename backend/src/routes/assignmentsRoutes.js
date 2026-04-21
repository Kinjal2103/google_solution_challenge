const express = require('express');
const router = express.Router();
const assignmentsController = require('../controllers/assignmentsController');

router.post('/', assignmentsController.createAssignment);

module.exports = router;
