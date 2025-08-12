const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    sexe: {
      type: String,
      enum: ['Homme', 'Femme'],
      required: true,
    },
    adresse: {
      type: String,
    },
    telephone: {
      type: String,
    },
    dateAdmission: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Patient', patientSchema);
