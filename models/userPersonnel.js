const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom est obligatoire'],
    trim: true,
    maxlength: [50, 'Le nom ne peut excéder 50 caractères'],
    validate: {
      validator: function(v) {
        return /^[a-zA-Zéèêëàâäôöûüç' -]+$/.test(v);
      },
      message: 'Caractères spéciaux non autorisés'
    }
  },
  prenom: {
    type: String,
    trim: true,
    maxlength: [50, 'Le prénom ne peut excéder 50 caractères']
  },
  email: {
    type: String,
    required: [true, 'L\'email est obligatoire'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: validator.isEmail,
      message: 'Email invalide'
    }
  },
  motDePasse: {
    type: String,
    required: [true, 'Le mot de passe est obligatoire'],
    minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères'],
    select: false // Ne sera pas retourné dans les requêtes
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'medecin', 'secretaire'],
      message: 'Rôle {VALUE} non valide'
    },
    default: 'secretaire'
  },
  estActif: {
    type: Boolean,
    default: true
  },
  dernierAcces: Date,
  avatar: String
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.motDePasse;
      delete ret.__v;
      return ret;
    }
  }
});

// Middleware pour hasher le mot de passe
userSchema.pre('save', async function(next) {
  if (!this.isModified('motDePasse')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.motDePasse);
};

// Virtual pour le nom complet
userSchema.virtual('nomComplet').get(function() {
  return `${this.prenom || ''} ${this.nom}`.trim();
});

// Index pour optimisation
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, estActif: 1 });

module.exports = mongoose.model('User', userSchema);