const express = require('express');
const router = express.Router();
const Medicament = require('../models/medicament');

// Ajouter un médicament
router.post('/', async (req, res) => {
  try {
    const nouveau = new Medicament(req.body);
    const saved = await nouveau.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Lister tous les médicaments
router.get('/', async (req, res) => {
  try {
    const medicaments = await Medicament.find();
    res.json(medicaments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Obtenir un médicament par ID
router.get('/:id', async (req, res) => {
  try {
    const medicament = await Medicament.findById(req.params.id);
    if (!medicament) return res.status(404).json({ message: "Non trouvé" });
    res.json(medicament);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Modifier un médicament
router.put('/:id', async (req, res) => {
  try {
    const updated = await Medicament.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Non trouvé" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Supprimer un médicament
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Medicament.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Non trouvé" });
    res.json({ message: "Supprimé" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
