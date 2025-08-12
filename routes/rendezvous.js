const express = require('express');
const router = express.Router();
const Rendezvous = require('../models/rendezvous');

// CREATE un rendez-vous
router.post('/', async (req, res) => {
  try {
    const rdv = new Rendezvous(req.body);
    const savedRdv = await rdv.save();
    res.status(201).json(savedRdv);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// READ tous les rendez-vous
router.get('/', async (req, res) => {
  try {
    const rdvs = await Rendezvous.find().populate('patientId').populate('personnelId');
    res.json(rdvs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// READ un rendez-vous par id
router.get('/:id', async (req, res) => {
  try {
    const rdv = await Rendezvous.findById(req.params.id).populate('patientId').populate('personnelId');
    if (!rdv) return res.status(404).json({ message: "Rendez-vous non trouvé" });
    res.json(rdv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE un rendez-vous
router.put('/:id', async (req, res) => {
  try {
    const updatedRdv = await Rendezvous.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedRdv) 
      return res.status(404).json({ message: "Rendez-vous non trouvé,vuellez verifier vos informations" });
    res.json(updatedRdv);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE un rendez-vous
router.delete('/:id', async (req, res) => {
  try {
    const deletedRdv = await Rendezvous.findByIdAndDelete(req.params.id);
    if (!deletedRdv) return res.status(404).json({ message: "Rendez-vous non trouvé" });
    res.json({ message: "Rendez-vous supprimé" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
