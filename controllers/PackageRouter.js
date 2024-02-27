const express = require("express")
const packageModel = require("../Models/Package")
const memberModel=require("../Models/MemberModel")
const updatePackageModel=require("../Models/updateModel")

const router = express.Router()

router.post("/addpackage",async(req,res)=>{
    let data = req.body
    let addPackage = packageModel(data)
    let result = addPackage.save()
    res.json({status:"success"})
})

router.post("/updatepackage", async (req, res) => {
    let eMail = req.body.email
    let userdata = await memberModel.findOne({ "email": eMail })
    // console.log(userdata)
    if (!userdata) {
        return res.json({ status: "invalid user" })
    }
    let package_name = req.body.packagename
    let packagedata = await packageModel.findOne({ "packageName": package_name })
    if (!packagedata) {
        return res.json({ status: "invalid package" })
    }

    let userid = userdata._id
    let packageid = packagedata._id
    let result = await memberModel.updateOne({ "email": eMail }, { $set: { packageId: packageid } })
    // let data = req.body
    let existingEntry = await updatePackageModel.findOne({ "userId": userid })

    if (existingEntry) {
        let newUpdate = await updatePackageModel.updateOne({ "userId": userid }, { $set: { packageId: packageid } })
    }
    else {
        let update = new updatePackageModel({ userId: userid, packageId: packageid })
        let dataSave = await update.save()
    }
    res.json({ status: "success" })

})

router.get("/viewallpackage", async (req, res) => {
    let data = await packageModel.find()
    res.json(data)
})


module.exports = router