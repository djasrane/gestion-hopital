const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');

const SECRET = process.env.JWT_SECRET || 'votre_clé_secrète_super_securisee';
const TOKEN_EXPIRE = process.env.JWT_EXPIRE || '1d';

// Validation pour l'inscription
const validateRegister = [
  check('nom').trim().notEmpty().withMessage('Le nom est requis'),
  check('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  check('motDePasse').isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères'),
  check('role').optional().isIn(['admin', 'medecin', 'secretaire'])
];

// Inscription
router.post('/register', validateRegister, async (req, res) => {
  try {
    // Validation des données
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { nom, email, motDePasse, role = 'secretaire' } = req.body;

    // Vérifier si l'email existe déjà
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({
        success: false,
        error: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Création de l'utilisateur
    const utilisateur = new User({ 
      nom, 
      email, 
      motDePasse,
      role 
    });

    await utilisateur.save();

    // Générer le token directement après l'inscription
    const token = jwt.sign(
      { id: utilisateur._id, role: utilisateur.role },
      SECRET,
      { expiresIn: TOKEN_EXPIRE }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: utilisateur._id,
        nom: utilisateur.nom,
        email: utilisateur.email,
        role: utilisateur.role
      },
      message: 'Inscription réussie'
    });

  } catch (err) {
    console.error('Erreur inscription:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

// Connexion
router.post('/login', [
  check('email').isEmail().normalizeEmail(),
  check('motDePasse').exists()
], async (req, res) => {
  try {
    // Validation des données
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { email, motDePasse } = req.body;

    // Recherche de l'utilisateur avec le mot de passe
    const utilisateur = await User.findOne({ email }).select('+motDePasse');
    
    if (!utilisateur) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants incorrects'
      });
    }

    // Vérification du mot de passe
    const estValide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
    if (!estValide) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants incorrects'
      });
    }

    // Génération du token
    const token = jwt.sign(
      { id: utilisateur._id, role: utilisateur.role },
      SECRET,
      { expiresIn: TOKEN_EXPIRE }
    );

    // Réponse sans le mot de passe
    res.json({
      success: true,
      token,
      user: {
        id: utilisateur._id,
        nom: utilisateur.nom,
        email: utilisateur.email,
        role: utilisateur.role
      }
    });

  } catch (err) {
    console.error('Erreur connexion:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

module.exports = router;