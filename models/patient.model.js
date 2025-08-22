const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs'); // Pour l'authentification si nécessaire

const patientSchema = new mongoose.Schema({
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
  dateNaissance: {
    type: Date,
    required: [true, 'La date de naissance est obligatoire'],
    validate: {
      validator: function(v) {
        // L'âge doit être entre 0 et 120 ans
        const age = new Date().getFullYear() - v.getFullYear();
        return age >= 0 && age <= 120;
      },
      message: 'Date de naissance invalide'
    }
  },
  sexe: {
    type: String,
    enum: {
      values: ['Homme', 'Femme', 'Autre'],
      message: 'Le sexe doit être "Homme", "Femme" ou "Autre"'
    },
    required: [true, 'Le sexe est obligatoire']
  },
  adresse: {
    type: String,
    trim: true,
    maxlength: [200, 'L\'adresse ne peut excéder 200 caractères']
  },
  telephone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return validator.isMobilePhone(v, 'fr-FR');
      },
      message: 'Numéro de téléphone invalide'
    }
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: 'Email invalide'
    }
  },

  groupeSanguin: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', null],
    default: null
  },
  historiqueMedical: {
    type: String,
    trim: true,
    maxlength: [2000, 'L\'historique médical ne peut excéder 2000 caractères']
  },
  allergies: {
    type: [String],
    default: []
  },
  estActif: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v; // Supprime le champ version
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Index pour recherche optimisée
patientSchema.index({ nom: 1, prenom: 1 });
patientSchema.index({ numeroSecuriteSociale: 1 }, { unique: true });
patientSchema.index({ telephone: 1 });

// Virtual pour l'âge
patientSchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = this.dateNaissance;
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Middleware pour nettoyer les données avant sauvegarde
patientSchema.pre('save', function(next) {
  if (this.telephone) {
    this.telephone = this.telephone.replace(/\s/g, '');
  }
  next();
});

// Méthode pour formater le nom complet
patientSchema.methods.getNomComplet = function() {
  return `${this.prenom} ${this.nom.toUpperCase()}`;
};

module.exports = mongoose.model('Patient', patientSchema);