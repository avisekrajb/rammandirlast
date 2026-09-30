const mongoose = require('mongoose');

const localizedStringSchema = new mongoose.Schema({
  en: { type: String, default: '' },
  ne: { type: String, default: '' },
  hi: { type: String, default: '' },
  zh: { type: String, default: '' },
  ta: { type: String, default: '' },
}, { _id: false });

const yearEntrySchema = new mongoose.Schema({
  year: { type: String, default: '' },
  text: { type: localizedStringSchema, default: () => ({}) },
}, { _id: false });

const historySchema = new mongoose.Schema({
  photo: {
    type: String,
    default: null,
  },
  period: {
    en: { type: String, default: '' },
    ne: { type: String, default: '' },
    hi: { type: String, default: '' },
    zh: { type: String, default: '' },
    ta: { type: String, default: '' },
  },
  title: {
    en: { type: String, required: true },
    ne: { type: String, default: '' },
    hi: { type: String, default: '' },
    zh: { type: String, default: '' },
    ta: { type: String, default: '' },
  },
  desc: {
    en: { type: String, default: '' },
    ne: { type: String, default: '' },
    hi: { type: String, default: '' },
    zh: { type: String, default: '' },
    ta: { type: String, default: '' },
  },
  // Body paragraphs. Legacy entries stored a fixed p1..p4 object, so both shapes
  // are accepted: { p1, p2, ... } is normalized into an ordered array on read.
  paragraphs: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({ p1: {}, p2: {}, p3: {}, p4: {} }),
  },
  // Optional heading above the bullet list
  listTitle: { type: localizedStringSchema, default: () => ({}) },
  // Optional bullet points
  points: { type: [localizedStringSchema], default: () => [] },
  // Optional year-by-year list, e.g. the conservation sequence
  entries: { type: [yearEntrySchema], default: () => [] },
  year: {
    type: String,
    default: '',
  },
  // Marks an entry that ships with the app, so it is only ever seeded once.
  seedKey: {
    type: String,
    default: '',
  },
  order: {
    type: Number,
    default: 0,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
historySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('History', historySchema);
