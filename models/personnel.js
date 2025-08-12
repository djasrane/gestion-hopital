const mongoose = require('mongoose');

const personnelSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  poste: { type: String, required: true }, // Ex : Médecin, Infirmier, etc.
  service: String, // Ex : Cardiologie, Radiologie...
  telephone: String,
  email: String,
}, { timestamps: true });

module.exports = mongoose.model('Personnel', personnelSchema);
