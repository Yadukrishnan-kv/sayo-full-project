const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema(
  {
    restaurant_name: String,
    logo_url: String,
    favicon_url: String,
    theme_mode: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'light',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', SettingsSchema);
