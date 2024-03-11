const mongoose = require('mongoose');

const packageChangeRequestSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"member"
    },
    newPackageId: {
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"package"
    },
    status: { type: String, default: 'pending' } // Status can be 'pending', 'approved', or 'rejected'
});

const PackageChangeRequest = mongoose.model('PackageChangeRequest', packageChangeRequestSchema);

module.exports = PackageChangeRequest;
