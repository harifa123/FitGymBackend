const express = require("express")
const router = express.Router()
const TrainerModel = require("../Models/trainermodel")

router.get('/viewtrainers', async (req, res) => {
    const trainers = await TrainerModel.find()
    res.json(trainers)
})
module.exports = router;