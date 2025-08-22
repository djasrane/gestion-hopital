const express = require('express');
const router = express.Router();
const Patient = require('../models/patient.model');
const { check, validationResult } = require('express-validator');
const auth = require('../middlewares/auth');

// Validation des données patient
const validatePatient = [
  check('nom').trim().notEmpty().withMessage('Le nom est requis')
    .matches(/^[a-zA-Zéèêëàâäôöûüç' -]+$/).withMessage('Caractères non autorisés'),
  check('prenom').trim().notEmpty().withMessage('Le prénom est requis'),
  check('dateNaissance').isISO8601().withMessage('Date invalide'),
  check('sexe').isIn(['Homme', 'Femme', 'Autre']).withMessage('Sexe invalide'),
  check('email').optional().isEmail().withMessage('Email invalide'),
  check('telephone').optional().isMobilePhone().withMessage('Téléphone invalide')
];

// GET tous les patients avec pagination et filtres
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, sexe } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { prenom: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (sexe) filter.sexe = sexe;

    const patients = await Patient.find(filter)
      .sort({ nom: 1, prenom: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const count = await Patient.countDocuments(filter);

    res.json({
      success: true,
      data: patients,
      meta: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    console.error('Erreur GET /patients:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

// GET un patient par ID
router.get('/:id', auth, async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        error: 'ID patient invalide' 
      });
    }

    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ 
        success: false,
        error: 'Patient non trouvé' 
      });
    }

    res.json({ 
      success: true,
      data: patient 
    });
  } catch (err) {
    console.error(`Erreur GET /patients/${req.params.id}:`, err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

// POST créer un nouveau patient
router.post('/', [auth, ...validatePatient], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const newPatient = new Patient({
      ...req.body,
      createdBy: req.user.id
    });

    await newPatient.save();

    res.status(201).json({
      success: true,
      data: newPatient
    });
  } catch (err) {
    console.error('Erreur POST /patients:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

// PUT modifier un patient
router.put('/:id', [auth, ...validatePatient], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const updatedPatient = await Patient.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user.id
      },
      { new: true, runValidators: true }
    );

    if (!updatedPatient) {
      return res.status(404).json({ 
        success: false,
        error: 'Patient non trouvé' 
      });
    }

    res.json({
      success: true,
      data: updatedPatient
    });
  } catch (err) {
    console.error(`Erreur PUT /patients/${req.params.id}:`, err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

// DELETE "supprimer" un patient (désactiver plutôt que supprimer)
router.delete('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { estActif: false, updatedBy: req.user.id },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ 
        success: false,
        error: 'Patient non trouvé' 
      });
    }

    res.json({
      success: true,
      message: 'Patient désactivé',
      data: patient._id
    });
  } catch (err) {
    console.error(`Erreur DELETE /patients/${req.params.id}:`, err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

module.exports = router;