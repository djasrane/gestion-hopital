// routes/rendezvous.js
const express = require('express');
const router = express.Router();
const Rendezvous = require('../models/rendezvous');
const mongoose = require('mongoose');

const rendezvousSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  personnelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Personnel', required: true },
  date: { type: Date, required: true },
  motif: { type: String, required: true },
  status: { type: String, enum: ['prévu', 'annulé', 'terminé'], default: 'prévu' },
}, { timestamps: true });

module.exports = mongoose.model('Rendezvous', rendezvousSchema);


// GET tous les rendez-vous
router.get('/', async (req, res) => {
  try {
    const rdvs = await Rendezvous.find()
      .populate('patient', 'nom prenom')
      .populate('personnel', 'nom prenom poste');
    res.json(rdvs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET un rendez-vous par id
router.get('/:id', async (req, res) => {
  try {
    const rdv = await Rendezvous.findById(req.params.id)
      .populate('patient', 'nom prenom')
      .populate('personnel', 'nom prenom poste');
    if (!rdv) return res.status(404).json({ message: 'Rendez-vous non trouvé' });
    res.json(rdv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST créer un nouveau rendez-vous
router.post('/', async (req, res) => {
  try {
    const nouveauRdv = new Rendezvous(req.body);
    const savedRdv = await nouveauRdv.save();
    res.status(201).json(savedRdv);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT modifier un rendez-vous
router.put('/:id', async (req, res) => {
  try {
    const updatedRdv = await Rendezvous.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedRdv) return res.status(404).json({ message: 'Rendez-vous non trouvé' });
    res.json(updatedRdv);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE supprimer un rendez-vous
router.delete('/:id', async (req, res) => {
  try {
    const deletedRdv = await Rendezvous.findByIdAndDelete(req.params.id);
    if (!deletedRdv) return res.status(404).json({ message: 'Rendez-vous non trouvé' });
    res.json({ message: 'Rendez-vous supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
