const express = require('express');
const router = express.Router();
const TransactionModel = require('../Models/Transaction');
const MemberModel = require("../Models/MemberModel")
const PackageModel = require("../Models/Package");

router.post('/transactions', async (req, res) => {
  try {
    const { memberId, packageId } = req.body;
    const transaction = new TransactionModel({ memberId, packageId });
    await transaction.save();
    res.status(201).json({ message: 'Transaction created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/trans', async (req, res) => {
    try {
      const memberId = req.body.memberId;
      const transactions = await TransactionModel.find({ memberId })
        .populate('memberId', 'name email')
        .populate('packageId', 'packageName packageAmount')
        .exec();
      res.status(200).json(transactions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  

module.exports = router;