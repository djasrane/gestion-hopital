// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const SECRET = 'votre_clé_secrète_super_securisee';

// Inscription
router.post('/register', async (req, res) => {
  const { nom, email, motDePasse, role } = req.body;
  try {
    const utilisateur = new User({ nom, email, motDePasse, role });
    await utilisateur.save();
    res.status(201).json({ message: "Utilisateur enregistrer avec succés" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  const { email, motDePasse } = req.body;
  const utilisateur = await User.findOne({ email });
  if (!utilisateur) 
    return res.status(404).json({ message: "Utilisateur non trouvé, veuillez ressayer" }

  );

  const estValide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
  if (!estValide) 
    return res.status(401).json({ message: "Mot de passe incorrect, veullez entre un autre mot de passe" }

  );

  const token = jwt.sign({ id: utilisateur._id, role: utilisateur.role }, 
    SECRET, 
    { expiresIn: '1d' }
);
  res.json({ token, utilisateur: { nom: utilisateur.nom, role: utilisateur.role } 
});
});

module.exports = router;
