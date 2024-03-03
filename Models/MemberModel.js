const mongoose = require("mongoose");
const memberSchema = new mongoose.Schema({     
  name: {
    type: String,
    required: true
  },
  place: {
    type: String,
    required: true
  },
  age: {
    type: String,
    required: true
  },
  height: {
    type: String,
    required: true
  },
  weight: {
    type: String,
    required: true
  },
  bloodGroup: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  registerDate: {
    type: Date,
    default: Date.now
  },
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "package"
  },
  lastPackageUpdateDate: {
    type: Date
  },
  previousPackageAmount: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model("member", memberSchema);