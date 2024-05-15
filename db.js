const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  userId: String,
  documents: Array,
  ocrData: Object,
  confirmed: Boolean,
});

const Document = mongoose.model('Document', DocumentSchema);

module.exports = Document;
