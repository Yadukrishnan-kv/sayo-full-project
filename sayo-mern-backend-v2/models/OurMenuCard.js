const mongoose = require('mongoose');

const OurMenuCardSchema = new mongoose.Schema(
  {
    title_en: String,
    title_ar: String,
    description_en: String,
    description_ar: String,
    image: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('OurMenuCard', OurMenuCardSchema);
