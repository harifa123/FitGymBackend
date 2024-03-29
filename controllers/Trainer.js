const express = require("express")
const trainerModel = require("../Models/trainermodel")
const bcrypt = require("bcryptjs")
const router = express.Router()

const hashPasswordGenerator = async (pass) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(pass, salt)
}

router.post('/addtrainer', async (req, res) => {
    try {
        let { data } = { "data": req.body }
        let password = data.password
        const hashedpassword = await hashPasswordGenerator(password)
        data.password = hashedpassword
        let gym = new trainerModel(data)
        await gym.save()
        res.json({ status: "success" })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

router.get("/viewtrainers", async(req,res)=>{
    let trainers = await trainerModel.find()
    res.json(trainers)
})
module.exports = router

