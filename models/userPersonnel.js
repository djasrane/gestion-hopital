// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nom: { 
    type: String, 
    required: true 
},
  email: { 
    type: String, 
    required: true, 
    unique: true 
},
  motDePasse: { 
    type: String, 
    required: true 
},
  role: { 
    type: String, 
    enum: ['admin', 'medecin', 'secretaire'], 
    default: 'secretaire' }
});

// Hash avant sauvegarde
userSchema.pre('save', async function(next) {
  if (!this.isModified('motDePasse')) 
    return next();
  this.motDePasse = await bcrypt.hash(this.motDePasse, 10);
  next();
});

module.exports = mongoose.model('User', userSchema);
