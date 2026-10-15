const mongoose = require('mongoose');

// day: 0=Sunday ... 6=Saturday (matches admin panel's DAYS convention)
const OpeningHoursEntrySchema = new mongoose.Schema(
  {
    day: { type: Number, min: 0, max: 6, required: true },
    closed1: { type: Boolean, default: false }, // shift 1 closed
    closed2: { type: Boolean, default: false }, // shift 2 closed
    open: String,   // shift 1 open, "HH:mm" 24-hour
    close: String,  // shift 1 close
    open2: String,  // shift 2 open (e.g. after a prayer-time break)
    close2: String, // shift 2 close
  },
  { _id: false }
);

const SettingsSchema = new mongoose.Schema(
  {
    restaurant_name: String,
    restaurant_name_ar: String,
    address_en: String,
    address_ar: String,
    logo_url: String,
    logo_dark_url: String,
    logo_light_url: String,
    favicon_url: String,
    theme_mode: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'light',
    },
    opening_hours: [OpeningHoursEntrySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', SettingsSchema);
