const express = require("express")
const PackageModel = require("../Models/Package")
const MemberModel = require("../Models/MemberModel")
const UpdatePackageModel = require("../Models/updateModel");

const router = express.Router()

router.post("/addpackage",async(req,res)=>{
    let data = req.body
    let addPackage = PackageModel(data)
    let result = addPackage.save()
    res.json({status:"successs"})
})

router.post("/updatepackage", async (req, res) => {
    try {
        const email = req.body.email;
        const packageName = req.body.packagename;
        const user = await MemberModel.findOne({ "email": email });
        if (!user) {
            return res.json({ status: "invalid user" });
        }
        const packageData = await PackageModel.findOne({ "packageName": packageName });
        if (!packageData) {
            return res.json({ status: "invalid package" });
        }

        const userId = user._id;
        const packageId = packageData._id;
        await MemberModel.findByIdAndUpdate(userId, {
            $set: {
                packageId: packageId,
                lastPackageUpdateDate: new Date()
            }
        });
        await UpdatePackageModel.findOneAndUpdate(
            { userId: userId },
            { $set: { packageId: packageId } },
            { upsert: true }
        );

        res.json({ status: "success" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "Internal Server Error" });
    }
});

module.exports = router;