const express = require('express');
const router = express.Router();
const Consultation = require('../models/consultation');

//  Ajouter une nouvelle consultation
router.post('/', async (req, res) => {
  try {
    const consultation = new Consultation(req.body);
    const saved = await consultation.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//  Obtenir toutes les consultations
router.get('/', async (req, res) => {
  try {
    const consultations = await Consultation.find()
      .populate('patient')
      .populate('personnel');
    res.json(consultations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Obtenir une consultation spécifique
router.get('/:id', async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id)
      .populate('patient')
      .populate('personnel');
    if (!consultation) return res.status(404).json({ message: 'Non trouvée' });
    res.json(consultation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//  Modifier une consultation
router.put('/:id', async (req, res) => {
  try {
    const updated = await Consultation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//  Supprimer une consultation
router.delete('/:id', async (req, res) => {
  try {
    await Consultation.findByIdAndDelete(req.params.id);
    res.json({ message: 'Consultation supprimée' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
