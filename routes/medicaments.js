const express = require('express');
const router = express.Router();
const Medicament = require('../models/medicament');
const { check, validationResult } = require('express-validator');
const auth = require('../middlewares/auth');

// Validation des données de médicament
const validateMedicament = [
  check('nom').trim().notEmpty().withMessage('Le nom est requis'),
  check('description').optional().trim().isLength({ max: 500 }),
  check('dosage').notEmpty().withMessage('Le dosage est requis'),
  check('forme').isIn(['comprimé', 'gélule', 'sirop', 'injection', 'pommade', 'suppositoire', 'collyre', 'autre']),
  check('quantiteDisponible').isInt({ min: 0 }).withMessage('La quantité doit être un nombre positif'),
  check('seuilAlerte').optional().isInt({ min: 0 }),
  check('dateExpiration').isISO8601().withMessage('Date d\'expiration invalide')
];

// Ajouter un médicament (protégé par auth)
router.post('/', [auth, ...validateMedicament], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    // Vérifier si le médicament existe déjà
    const medicamentExist = await Medicament.findOne({ nom: req.body.nom, dosage: req.body.dosage });
    if (medicamentExist) {
      return res.status(409).json({
        success: false,
        error: 'Ce médicament existe déjà'
      });
    }

    const nouveauMedicament = new Medicament({
      ...req.body,
      addedBy: req.user.id // Track qui a ajouté le médicament
    });

    const savedMedicament = await nouveauMedicament.save();

    res.status(201).json({
      success: true,
      data: savedMedicament
    });

  } catch (err) {
    console.error('Erreur création médicament:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

// Lister tous les médicaments avec filtres et pagination
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, seuil } = req.query;
    const filter = {};

    // Filtre par recherche textuelle
    if (search) {
      filter.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Filtre par seuil d'alerte
    if (seuil === 'alerte') {
      filter.quantiteDisponible = { $lte: '$seuilAlerte' };
    }

    const medicaments = await Medicament.find(filter)
      .sort({ nom: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const count = await Medicament.countDocuments(filter);

    res.json({
      success: true,
      data: medicaments,
      meta: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (err) {
    console.error('Erreur récupération médicaments:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

// Obtenir un médicament par ID
router.get('/:id', auth, async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        error: 'ID invalide' 
      });
    }

    const medicament = await Medicament.findById(req.params.id);
    if (!medicament) {
      return res.status(404).json({ 
        success: false,
        error: 'Médicament non trouvé' 
      });
    }

    res.json({
      success: true,
      data: medicament
    });

  } catch (err) {
    console.error('Erreur récupération médicament:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

// Modifier un médicament
router.put('/:id', [auth, ...validateMedicament], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const updatedMedicament = await Medicament.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user.id // Track qui a modifié
      },
      { new: true, runValidators: true }
    );

    if (!updatedMedicament) {
      return res.status(404).json({ 
        success: false,
        error: 'Médicament non trouvé' 
      });
    }

    res.json({
      success: true,
      data: updatedMedicament
    });

  } catch (err) {
    console.error('Erreur modification médicament:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

// Supprimer un médicament
router.delete('/:id', auth, async (req, res) => {
  try {
    const deletedMedicament = await Medicament.findByIdAndDelete(req.params.id);
    if (!deletedMedicament) {
      return res.status(404).json({ 
        success: false,
        error: 'Médicament non trouvé' 
      });
    }

    res.json({
      success: true,
      message: 'Médicament supprimé',
      data: deletedMedicament._id
    });

  } catch (err) {
    console.error('Erreur suppression médicament:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
});

module.exports = router;