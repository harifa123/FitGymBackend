const mongoose = require('mongoose');

const packageChangeRequestSchema = new mongoose.Schema({
    userId: String,
    newPackageId: String,
    status: { type: String, default: 'pending' } // Status can be 'pending', 'approved', or 'rejected'
});

const PackageChangeRequest = mongoose.model('PackageChangeRequest', packageChangeRequestSchema);

module.exports = PackageChangeRequest;
