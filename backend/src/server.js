require('dotenv').config();
const express = require('express');
const cors = require('cors');

const needsRoutes = require('./routes/needsRoutes');
const assignmentsRoutes = require('./routes/assignmentsRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/needs', needsRoutes);
app.use('/api/assignments', assignmentsRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
