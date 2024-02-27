const express = require("express")
const packageModel = require("../Models/Package")

const router = express.Router()

router.post("/addpackage",async(req,res)=>{
    let data = req.body
    let addPackage = packageModel(data)
    let result = addPackage.save()
    res.json({status:"successs"})
})


module.exports = router