const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "member",
    required: true
  },
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "package",
    required: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    default: "paid"
  }
});

module.exports = mongoose.model("transaction", transactionSchema);