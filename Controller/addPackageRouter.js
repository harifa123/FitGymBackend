const express = require("express")
const packegeModel = require("../Models/addPackege")

const router = express.Router()

router.post("/addpack",async(req,res)=>{
    let data = req.body
    let addPackege = packegeModel(data)
    let result = addPackege.save()
    res.json({status:"successs"})
})


module.exports = router