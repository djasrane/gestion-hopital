const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Rendezvous = require('../models/rendezvous');
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');

// Validation des données de rendez-vous
const validateRendezvous = [
  check('patientId').isMongoId().withMessage('ID patient invalide'),
  check('personnelId').isMongoId().withMessage('ID personnel invalide'),
  check('date').isISO8601().withMessage('Format de date invalide')
    .custom(value => new Date(value) > new Date()).withMessage('La date doit être dans le futur'),
  check('motif').notEmpty().trim().isLength({ max: 500 }).withMessage('Motif invalide (max 500 caractères)'),
  check('duree').isInt({ min: 5, max: 240 }).withMessage('Durée invalide (5-240 minutes)'),
  check('statut').optional().isIn(['planifié', 'confirmé', 'annulé', 'terminé']).withMessage('Statut invalide')
];

// Créer un rendez-vous (protégé)
router.post('/', [auth, ...validateRendezvous], async (req, res) => {
  try {
    // Validation des données
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    // Vérifier les conflits de planning
    const conflit = await Rendezvous.findOne({
      personnelId: req.body.personnelId,
      date: {
        $lt: new Date(new Date(req.body.date).getTime() + req.body.duree * 60000),
        $gte: req.body.date
      },
      statut: { $ne: 'annulé' }
    });

    if (conflit) {
      return res.status(409).json({
        success: false,
        error: 'Conflit de planning avec un autre rendez-vous'
      });
    }

    // Création du rendez-vous
    const nouveauRdv = new Rendezvous({
      ...req.body,
      createdBy: req.user.id
    });

    const savedRdv = await nouveauRdv.save();

    // Populate pour une meilleure réponse
    const rdvPopule = await Rendezvous.findById(savedRdv._id)
      .populate('patientId', 'nom prenom')
      .populate('personnelId', 'nom prenom poste');

    res.status(201).json({
      success: true,
      data: rdvPopule
    });

  } catch (err) {
    console.error('Erreur création rendez-vous:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

// Lister les rendez-vous avec filtres (protégé)
router.get('/', auth, async (req, res) => {
  try {
    const { patientId, personnelId, dateDebut, dateFin, statut, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (patientId) filter.patientId = patientId;
    if (personnelId) filter.personnelId = personnelId;
    if (statut) filter.statut = statut;
    if (dateDebut || dateFin) {
      filter.date = {};
      if (dateDebut) filter.date.$gte = new Date(dateDebut);
      if (dateFin) filter.date.$lte = new Date(dateFin);
    }

    const rdvs = await Rendezvous.find(filter)
      .populate('patientId', 'nom prenom')
      .populate('personnelId', 'nom prenom poste')
      .sort({ date: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const count = await Rendezvous.countDocuments(filter);

    res.json({
      success: true,
      data: rdvs,
      meta: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (err) {
    console.error('Erreur récupération rendez-vous:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

// Obtenir un rendez-vous spécifique (protégé)
router.get('/:id', auth, async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        error: 'ID invalide' 
      });
    }

    const rdv = await Rendezvous.findById(req.params.id)
      .populate('patientId')
      .populate('personnelId')
      .populate('createdBy', 'nom prenom');

    if (!rdv) {
      return res.status(404).json({ 
        success: false,
        error: 'Rendez-vous non trouvé' 
      });
    }

    res.json({
      success: true,
      data: rdv
    });

  } catch (err) {
    console.error('Erreur récupération rendez-vous:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

// Modifier un rendez-vous (protégé)
router.put('/:id', [auth, ...validateRendezvous], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const updatedRdv = await Rendezvous.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user.id
      },
      { new: true, runValidators: true }
    )
    .populate('patientId', 'nom prenom')
    .populate('personnelId', 'nom prenom poste');

    if (!updatedRdv) {
      return res.status(404).json({ 
        success: false,
        error: 'Rendez-vous non trouvé' 
      });
    }

    res.json({
      success: true,
      data: updatedRdv
    });

  } catch (err) {
    console.error('Erreur modification rendez-vous:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

// Annuler un rendez-vous (protégé)
router.delete('/:id', auth, async (req, res) => {
  try {
    const rdvAnnule = await Rendezvous.findByIdAndUpdate(
      req.params.id,
      {
        statut: 'annulé',
        annulePar: req.user.id,
        raisonAnnulation: req.body.raison || 'Annulé par l\'utilisateur'
      },
      { new: true }
    );

    if (!rdvAnnule) {
      return res.status(404).json({ 
        success: false,
        error: 'Rendez-vous non trouvé' 
      });
    }

    res.json({
      success: true,
      message: 'Rendez-vous annulé',
      data: rdvAnnule._id
    });

  } catch (err) {
    console.error('Erreur annulation rendez-vous:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

module.exports = router;