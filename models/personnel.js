const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const personnelSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom est obligatoire'],
    trim: true,
    maxlength: [50, 'Le nom ne peut excéder 50 caractères'],
    validate: {
      validator: function(v) {
        return /^[a-zA-Zéèêëàâäôöûüç' -]+$/.test(v);
      },
      message: 'Nom invalide (caractères spéciaux non autorisés)'
    }
  },
  prenom: {
    type: String,
    required: [true, 'Le prénom est obligatoire'],
    trim: true,
    maxlength: [50, 'Le prénom ne peut excéder 50 caractères']
  },
  poste: {
    type: String,
    required: [true, 'Le poste est obligatoire'],
    enum: {
      values: ['Médecin', 'Infirmier', 'Administratif', 'Technicien', 'Cadre', 'Autre'],
      message: 'Poste {VALUE} non valide'
    }
  },
  // ... (autres champs conservés identiques)
  email: {
    type: String,
    required: [true, 'L\'email est obligatoire'],
    trim: true,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: 'Email invalide'
    }
    // Suppression de 'unique: true' ici
  },
  matricule: {
    type: String,
    required: [true, 'Le matricule est obligatoire'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^[A-Z0-9]{6,20}$/.test(v);
      },
      message: 'Matricule invalide (6-20 caractères alphanumériques)'
    }
    // Suppression de 'unique: true' ici
  },
  // ... (autres champs conservés identiques)
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Index uniques (remplace les 'unique: true')
personnelSchema.index({ email: 1 }, { 
  unique: true,
  name: 'email_unique',
  partialFilterExpression: { email: { $exists: true } }
});

personnelSchema.index({ matricule: 1 }, {
  unique: true,
  name: 'matricule_unique',
  partialFilterExpression: { matricule: { $exists: true } }
});

// Autres index
personnelSchema.index({ nom: 1, prenom: 1 }, { name: 'nom_prenom' });
personnelSchema.index({ service: 1, poste: 1 }, { name: 'service_poste' });

// ... (le reste de votre code reste inchangé)