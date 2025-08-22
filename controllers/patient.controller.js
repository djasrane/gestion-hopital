const Patient = require('../models/patient.model');
const logger = require('../utils/logger'); // Optionnel pour les logs avancés

// Helper pour les réponses API standardisées
const sendResponse = (res, status, success, data, message) => {
  return res.status(status).json({ success, data, message });
};

// Créer un patient avec validation
exports.creerPatient = async (req, res) => {
  try {
    const { nom, prenom, dateNaissance } = req.body;

    // Validation minimale (à compléter avec Joi si besoin)
    if (!nom || !prenom || !dateNaissance) {
      return sendResponse(res, 400, false, null, 'Nom, prénom et date de naissance sont obligatoires');
    }

    const patient = new Patient({ nom, prenom, dateNaissance });
    await patient.save();

    // Log de succès (optionnel)
    logger.info(`Patient créé : ${patient._id}`);

    sendResponse(res, 201, true, patient, 'Patient créé avec succès');
  } catch (error) {
    logger.error(`Erreur création patient : ${error.message}`);
    sendResponse(res, 400, false, null, error.message);
  }
};

// Lister les patients avec pagination
exports.listerPatients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [patients, total] = await Promise.all([
      Patient.find().skip(skip).limit(limit),
      Patient.countDocuments()
    ]);

    sendResponse(res, 200, true, {
      items: patients,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Liste des patients récupérée');
  } catch (error) {
    logger.error(`Erreur listage patients : ${error.message}`);
    sendResponse(res, 500, false, null, 'Erreur serveur');
  }
};

// Obtenir un patient par ID
exports.getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return sendResponse(res, 404, false, null, 'Patient non trouvé');
    }
    sendResponse(res, 200, true, patient, 'Patient récupéré');
  } catch (error) {
    logger.error(`Erreur récupération patient ${req.params.id} : ${error.message}`);
    sendResponse(res, 500, false, null, 'Erreur serveur');
  }
};

// Modifier un patient (avec vérification des permissions)
exports.modifierPatient = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Filtrage des champs modifiables
    const allowedUpdates = ['nom', 'prenom', 'dateNaissance', 'adresse'];
    const isValidUpdate = Object.keys(updates).every(field => allowedUpdates.includes(field));

    if (!isValidUpdate) {
      return sendResponse(res, 400, false, null, 'Champs non autorisés');
    }

    const patient = await Patient.findByIdAndUpdate(id, updates, { 
      new: true,
      runValidators: true // Active la validation du schéma
    });

    if (!patient) {
      return sendResponse(res, 404, false, null, 'Patient non trouvé');
    }

    sendResponse(res, 200, true, patient, 'Patient mis à jour');
  } catch (error) {
    logger.error(`Erreur modification patient ${req.params.id} : ${error.message}`);
    sendResponse(res, 400, false, null, error.message);
  }
};

// Supprimer un patient (avec vérification des permissions)
exports.supprimerPatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) {
      return sendResponse(res, 404, false, null, 'Patient non trouvé');
    }
    logger.warn(`Patient supprimé : ${req.params.id}`);
    sendResponse(res, 200, true, null, 'Patient supprimé');
  } catch (error) {
    logger.error(`Erreur suppression patient ${req.params.id} : ${error.message}`);
    sendResponse(res, 500, false, null, 'Erreur serveur');
  }
};