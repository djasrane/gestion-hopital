const mongoose = require('mongoose');
const validator = require('validator');

const medicamentSchema = new mongoose.Schema({
  nom: { 
    type: String,
    required: [true, 'Le nom du médicament est obligatoire'],
    trim: true,
    unique: true,
    maxlength: [100, 'Le nom ne peut excéder 100 caractères'],
    validate: {
      validator: function(v) {
        return /^[a-zA-Z0-9éèêëàâäôöûüç' -]+$/.test(v);
      },
      message: 'Nom invalide (caractères spéciaux non autorisés)'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La description ne peut excéder 500 caractères']
  },
  dosage: {
    type: String,
    required: [true, 'Le dosage est obligatoire'],
    enum: {
      values: ['50mg', '100mg', '200mg', '500mg', '1g', '2g', '5g', '10g', 'autre'],
      message: 'Dosage {VALUE} non supporté'
    }
  },
  forme: {
    type: String,
    required: true,
    enum: {
      values: ['comprimé', 'gélule', 'sirop', 'injection', 'pommade', 'suppositoire', 'collyre', 'autre'],
      message: 'Forme {VALUE} non supportée'
    }
  },
  quantiteDisponible: {
    type: Number,
    required: true,
    min: [0, 'La quantité ne peut être négative'],
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: 'La quantité doit être un entier'
    }
  },
  seuilAlerte: {
    type: Number,
    min: 0,
    default: 10,
    validate: {
      validator: function(v) {
        return v <= this.quantiteDisponible * 2;
      },
      message: 'Le seuil doit être raisonnable par rapport au stock'
    }
  },
  dateExpiration: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v > new Date();
      },
      message: 'La date d\'expiration doit être dans le futur'
    }
  },
  categorie: {
    type: String,
    enum: ['antibiotique', 'antidouleur', 'anti-inflammatoire', 'psychotrope', 'autre'],
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour recherche optimisée
medicamentSchema.index({ nom: 'text', description: 'text' });
medicamentSchema.index({ quantiteDisponible: 1 });
medicamentSchema.index({ dateExpiration: 1 });

// Middleware pour vérifier les médicaments périmés
medicamentSchema.pre('save', function(next) {
  if (this.dateExpiration < new Date()) {
    throw new Error('Impossible d\'enregistrer un médicament périmé');
  }
  next();
});

// Méthode personnalisée pour vérifier le stock
medicamentSchema.methods.checkStock = function(quantiteDemandee) {
  if (quantiteDemandee > this.quantiteDisponible) {
    throw new Error(`Stock insuffisant. Disponible: ${this.quantiteDisponible}, Demandé: ${quantiteDemandee}`);
  }
  return true;
};

// Virtual pour le statut du stock
medicamentSchema.virtual('statutStock').get(function() {
  if (this.quantiteDisponible === 0) return 'rupture';
  if (this.quantiteDisponible <= this.seuilAlerte) return 'alerte';
  return 'ok';
});

module.exports = mongoose.model('Medicament', medicamentSchema);