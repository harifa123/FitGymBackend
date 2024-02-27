const express = require("express")
const addtrainermodel = require("../Models/trainermodel")
const bcrypt = require("bcryptjs")
const router = express.Router()

hashPasswordGenerator = async (pass) => {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(pass, salt)
}

router.post('/addtrainer', async (req, res) => {
    let { data } = { "data": req.body }
    let password = data.password
    hashPasswordGenerator(password).then(
        (hashedpassword) => {
            console.log(hashedpassword)
            data.password = hashedpassword
            let gym = new addtrainermodel(data)
            let result = gym.save()
            res.json({ status: "success" })
        })

})

router.get("/viewtrainers", async(req,res)=>{
    let trainers = await trainerModel.find()
    res.json(trainers)
})

module.exports = router