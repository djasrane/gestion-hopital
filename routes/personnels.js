const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const Personnel = require('../models/personnel');
const auth = require('../middlewares/auth');
const role = require('../middlewares/role'); // Middleware de contrôle des rôles

// Validation pour l'inscription
const validateRegister = [
  check('nom').trim().notEmpty().withMessage('Le nom est requis'),
  check('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  check('motDePasse').isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères'),
  check('poste').isIn(['medecin', 'infirmier', 'administratif', 'technicien']).withMessage('Poste invalide')
];

// Validation pour la connexion
const validateLogin = [
  check('email').isEmail().normalizeEmail(),
  check('motDePasse').exists().withMessage('Mot de passe requis')
];

// Inscription (accessible seulement par l'admin)
router.post('/register', [auth, role('admin'), ...validateRegister], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { nom, email, motDePasse, poste } = req.body;

    // Vérifier l'unicité de l'email
    const utilisateurExistant = await Personnel.findOne({ email });
    if (utilisateurExistant) {
      return res.status(409).json({
        success: false,
        error: 'Cet email est déjà utilisé'
      });
    }

    // Création du personnel
    const nouveauPersonnel = new Personnel({
      nom,
      email,
      motDePasse,
      poste,
      createdBy: req.user.id
    });

    await nouveauPersonnel.save();

    // Ne pas renvoyer le mot de passe
    const personnelResponse = nouveauPersonnel.toObject();
    delete personnelResponse.motDePasse;

    res.status(201).json({
      success: true,
      data: personnelResponse
    });

  } catch (err) {
    console.error('Erreur inscription personnel:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

// Connexion
router.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { email, motDePasse } = req.body;

    // Recherche du personnel avec le mot de passe
    const personnel = await Personnel.findOne({ email }).select('+motDePasse');
    if (!personnel) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants incorrects'
      });
    }

    // Vérification du mot de passe
    const motDePasseValide = await bcrypt.compare(motDePasse, personnel.motDePasse);
    if (!motDePasseValide) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants incorrects'
      });
    }

    // Génération du token
    const token = jwt.sign(
      { 
        id: personnel._id, 
        role: personnel.poste,
        nom: personnel.nom
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '1d' }
    );

    // Réponse sans le mot de passe
    const personnelResponse = personnel.toObject();
    delete personnelResponse.motDePasse;

    res.json({
      success: true,
      token,
      data: personnelResponse
    });

  } catch (err) {
    console.error('Erreur connexion personnel:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

// Lister tout le personnel (protégé, avec pagination)
router.get('/', [auth, role('admin')], async (req, res) => {
  try {
    const { page = 1, limit = 10, poste } = req.query;
    const filter = poste ? { poste } : {};

    const personnels = await Personnel.find(filter)
      .select('-motDePasse')
      .sort({ nom: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const count = await Personnel.countDocuments(filter);

    res.json({
      success: true,
      data: personnels,
      meta: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (err) {
    console.error('Erreur listage personnel:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

// Obtenir un personnel (protégé)
router.get('/:id', auth, async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        error: 'ID invalide' 
      });
    }

    const personnel = await Personnel.findById(req.params.id).select('-motDePasse');
    if (!personnel) {
      return res.status(404).json({ 
        success: false,
        error: 'Personnel non trouvé' 
      });
    }

    res.json({ 
      success: true,
      data: personnel 
    });

  } catch (err) {
    console.error('Erreur récupération personnel:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

// Mettre à jour un personnel (protégé)
router.put('/:id', [auth, ...validateRegister], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const updates = { ...req.body, updatedBy: req.user.id };

    // Si modification du mot de passe
    if (updates.motDePasse) {
      updates.motDePasse = await bcrypt.hash(updates.motDePasse, 10);
    }

    const updatedPersonnel = await Personnel.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-motDePasse');

    if (!updatedPersonnel) {
      return res.status(404).json({ 
        success: false,
        error: 'Personnel non trouvé' 
      });
    }

    res.json({
      success: true,
      data: updatedPersonnel
    });

  } catch (err) {
    console.error('Erreur modification personnel:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

// Désactiver un compte personnel (plutôt que supprimer)
router.delete('/:id', [auth, role('admin')], async (req, res) => {
  try {
    const personnel = await Personnel.findByIdAndUpdate(
      req.params.id,
      { estActif: false, updatedBy: req.user.id },
      { new: true }
    ).select('-motDePasse');

    if (!personnel) {
      return res.status(404).json({ 
        success: false,
        error: 'Personnel non trouvé' 
      });
    }

    res.json({
      success: true,
      message: 'Compte personnel désactivé',
      data: personnel._id
    });

  } catch (err) {
    console.error('Erreur désactivation personnel:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

module.exports = router;