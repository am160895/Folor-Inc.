// models/job.js
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    jobName: { type: String, required: true },
    address: { type: String, required: true },
    trade: { type: String, required: true },
    subcontractorName: { type: String, required: true },
    subcontractorEmail: { type: String, required: true },
    pdfFilePath: { type: String, required: true },
    costs: { type: Map, of: Number },  // Stores cost per line item (key: item code)
    scope: [String], // Stores the extracted scope from PDF
    dateSubmitted: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', jobSchema);
