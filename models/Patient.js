const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  prenom: {
    type: String,
    required: true
  },
  dateNaissance: {
    type: Date,
    required: true
  },
  sexe: {
    type: String,
    enum: ['Homme', 'Femme'],
    required: true
  },
  adresse: String,
  telephone: String,
  historiqueMedical: String,
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
