const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    // Add other fields as needed
    requestStatus: {
        type: String,
        default: 'pending' // Assuming 'pending' is the default request status
    }
});

const RequestModel = mongoose.model('RequestM', requestSchema);

module.exports = RequestModel;
