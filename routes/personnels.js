const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Personnel = require('../models/personnel');
const auth = require('../middlewares/auth'); // pour protéger les routes

//  CRÉER un nouveau personnel (inscription)
router.post('/', async (req, res) => {
  try {
    const { nom, poste, email, motDePasse } = req.body;

    const utilisateurExistant = await Personnel.findOne({ email });
    if (utilisateurExistant) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé, veullez entrer un autre mot de email' });
    }

    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    const nouveauPersonnel = new Personnel({
      nom,
      poste,
      email,
      motDePasse: hashedPassword,
    });

    const savedPersonnel = await nouveauPersonnel.save();
    res.status(201).json(savedPersonnel);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//  LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    const personnel = await Personnel.findOne({ email });
    if (!personnel) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect, vuellez reverifier vos informations' });
    }

    const motDePasseValide = await bcrypt.compare(motDePasse, personnel.motDePasse);
    if (!motDePasseValide) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect, vuellez reverifier vos informations' });
    }

    const token = jwt.sign(
      { id: personnel._id, email: personnel.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// LISTER tout le personnel (protégé)
router.get('/', auth, async (req, res) => {
  try {
    const personnels = await Personnel.find();
    res.json(personnels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// LIRE un personnel par ID (protégé)
router.get('/:id', auth, async (req, res) => {
  try {
    const personnel = await Personnel.findById(req.params.id);
    if (!personnel) return res.status(404).json({ message: "Personnel non trouvé" });
    res.json(personnel);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// METTRE À JOUR un personnel (protégé)
router.put('/:id', auth, async (req, res) => {
  try {
    const updates = { ...req.body };

    if (updates.motDePasse) {
      updates.motDePasse = await bcrypt.hash(updates.motDePasse, 10);
    }

    const updatedPersonnel = await Personnel.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    if (!updatedPersonnel) {
      return res.status(404).json({ message: "Personnel non trouvé" });
    }

    res.json(updatedPersonnel);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// SUPPRIMER un personnel (protégé)
router.delete('/:id', auth, async (req, res) => {
  try {
    const deletedPersonnel = await Personnel.findByIdAndDelete(req.params.id);
    if (!deletedPersonnel) {
      return res.status(404).json({ message: "Personnel non trouvé" });
    }

    res.json({ message: "Personnel supprimé avecc succés" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
