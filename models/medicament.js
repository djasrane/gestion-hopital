const mongoose = require('mongoose');

const medicamentSchema = new mongoose.Schema({
  nom: 
  { 
    type: String, 
    required: true 
},
  description: String,
  dosage: String,
  forme: String, // comprimé, sirop, injection...
  quantiteDisponible: 
  { 
    type: Number, 
    default: 0 
},
}, 
{ timestamps: true });

module.exports = mongoose.model('Medicament', medicamentSchema);
