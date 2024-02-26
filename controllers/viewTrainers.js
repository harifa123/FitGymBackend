const express = require("express");
const router = express.Router();
const TrainerModel = require("../Models/trainermodel");

router.get('/viewtrainers', async (req, res) => {
  try {
    const trainers = await TrainerModel.find();
    res.json(trainers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
