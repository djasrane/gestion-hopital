// routes/patients.js

const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient'); 

// GET tous les patients
router.get('/', async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
