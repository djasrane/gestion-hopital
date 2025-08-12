const Patient = require('../models/Patient');

// Créer un patient
exports.creerPatient = async (req, res) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();
    res.status(201).json(patient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 📃 Lister tous les patients
exports.listerPatients = async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  Obtenir un patient par ID
exports.getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient non trouvé' });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  Modifier un patient
exports.modifierPatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(patient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//  Supprimer un patient
exports.supprimerPatient = async (req, res) => {
  try {
    await Patient.findByIdAndDelete(req.params.id);
    res.json({ message: 'Patient supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
