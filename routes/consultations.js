const express = require('express');
const router = express.Router();
const Consultation = require('../models/consultation');
const { check, validationResult } = require('express-validator');
const auth = require('../middlewares/auth');

// Validation des données de consultation
const validateConsultation = [
  check('patient').isMongoId().withMessage('ID patient invalide'),
  check('personnel').isMongoId().withMessage('ID personnel invalide'),
  check('date').isISO8601().withMessage('Format de date invalide'),
  check('diagnostic').notEmpty().withMessage('Le diagnostic est requis'),
  check('traitement').optional().isLength({ max: 500 }),
  check('statut').isIn(['planifié', 'réalisé', 'annulé']).withMessage('Statut invalide')
];

// Ajouter une nouvelle consultation (protégée par auth)
router.post('/', [auth, ...validateConsultation], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const consultationData = {
      ...req.body,
      createdBy: req.user.id // Ajout de l'utilisateur créateur
    };

    const consultation = new Consultation(consultationData);
    const savedConsultation = await consultation.save();

    // Populate pour une meilleure réponse
    const populated = await Consultation.findById(savedConsultation._id)
      .populate('patient', 'nom prenom')
      .populate('personnel', 'nom prenom poste');

    res.status(201).json({
      success: true,
      data: populated
    });

  } catch (err) {
    console.error('Erreur création consultation:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

// Obtenir toutes les consultations avec filtres
router.get('/', auth, async (req, res) => {
  try {
    const { patient, personnel, date, statut } = req.query;
    const filter = {};
    
    if (patient) filter.patient = patient;
    if (personnel) filter.personnel = personnel;
    if (date) filter.date = new Date(date);
    if (statut) filter.statut = statut;

    const consultations = await Consultation.find(filter)
      .populate('patient', 'nom prenom dateNaissance')
      .populate('personnel', 'nom prenom specialite')
      .sort({ date: -1 }); // Plus récentes d'abord

    res.json({
      success: true,
      count: consultations.length,
      data: consultations
    });

  } catch (err) {
    console.error('Erreur récupération consultations:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

// Obtenir une consultation spécifique
router.get('/:id', auth, async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        error: 'ID invalide' 
      });
    }

    const consultation = await Consultation.findById(req.params.id)
      .populate('patient')
      .populate('personnel')
      .populate('createdBy', 'nom prenom');

    if (!consultation) {
      return res.status(404).json({ 
        success: false,
        error: 'Consultation non trouvée' 
      });
    }

    res.json({
      success: true,
      data: consultation
    });

  } catch (err) {
    console.error('Erreur récupération consultation:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

// Modifier une consultation
router.put('/:id', [auth, ...validateConsultation], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const updatedConsultation = await Consultation.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user.id // Track qui a modifié
      },
      { new: true, runValidators: true }
    )
    .populate('patient', 'nom prenom')
    .populate('personnel', 'nom prenom poste');

    if (!updatedConsultation) {
      return res.status(404).json({ 
        success: false,
        error: 'Consultation non trouvée' 
      });
    }

    res.json({
      success: true,
      data: updatedConsultation
    });

  } catch (err) {
    console.error('Erreur modification consultation:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

// Supprimer une consultation (plutôt marquer comme annulé)
router.delete('/:id', auth, async (req, res) => {
  try {
    const deletedConsultation = await Consultation.findByIdAndUpdate(
      req.params.id,
      {
        statut: 'annulé',
        cancelledBy: req.user.id,
        cancellationReason: req.body.raison || 'Annulé par l\'utilisateur'
      },
      { new: true }
    );

    if (!deletedConsultation) {
      return res.status(404).json({ 
        success: false,
        error: 'Consultation non trouvée' 
      });
    }

    res.json({
      success: true,
      message: 'Consultation annulée',
      data: deletedConsultation
    });

  } catch (err) {
    console.error('Erreur suppression consultation:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

module.exports = router;