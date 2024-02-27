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

router.post("/signintrainer", async(req,res)=>{
    let input = req.body
    let emailid = req.body.emailid
    let data = await trainerModel.findOne({"emailid":emailid})
    if(!data)
    {
        return res.json({status:"Incorrect email id"})
    }
    console.log(data)
    let dbPasswordTrainer = data.password
    let inputPasswordTrainer = req.body.password
    console.log(dbPasswordTrainer)
    console.log(inputPasswordTrainer)

    const match = await bcrypt.compare(inputPasswordTrainer,dbPasswordTrainer)
    if(!match)
    {
        return res.json({status:"Incorrect password"})
    }

    res.json({status:"success", "trainer data":data})
})

router.get("/viewtrainers", async(req,res)=>{
    let trainers = await trainerModel.find()
    res.json(trainers)
})

router.post("/searchtrainer",async(req,res)=>{
    let input = req.body
    let trainer = await trainerModel.find(input)
    res.json(trainer)
})

router.post("/deletetrainer",async(req,res)=>{
    let input = req.body
    let response = await trainerModel.deleteOne(input)
    res.json({status:"success"})
})

module.exports = router

