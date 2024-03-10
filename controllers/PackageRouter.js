const express = require("express")
const PackageModel = require("../Models/Package")
const MemberModel = require("../Models/MemberModel")
const UpdatePackageModel = require("../Models/updateModel");
const TransactionModel = require('../Models/Transaction');
const jwt=require("jsonwebtoken")

const router = express.Router()

router.post("/addpackage",async(req,res)=>{
    let data = req.body
    let addPackage = PackageModel(data)
    let result = addPackage.save()
    res.json({status:"successs"})
})

router.post("/update-package", async (req, res) => {
    const token = req.headers["token"];
    jwt.verify(token, "gymapp", async (error, decoded) => {
        if (decoded && decoded.email) {
            try {
                const memberId = req.body.memberId;
                const packageId = req.body.packageId;

                // Validate member and package
                const member = await MemberModel.findById(memberId).populate({ path: "packageId", model: "package" });
                if (!member) {
                    return res.json({ status: "invalid user" });
                }
                const packageData = await PackageModel.findById(packageId);
                if (!packageData) {
                    return res.json({ status: "invalid package" });
                }

                // Calculate remaining days from the previous package
                const today = new Date();
                let usedDaysOldPackage = 0;

                const previousUpdate = await UpdatePackageModel.findOne({ userId: memberId }).sort({ updatedDate: -1 });
                if (previousUpdate) {
                    const lastUpdatedDate = previousUpdate.updatedDate;
                    usedDaysOldPackage = Math.ceil((today - lastUpdatedDate) / (1000 * 60 * 60 * 24));
                } else {
                    const registerDate = member.registerDate;
                    usedDaysOldPackage = Math.ceil((today - registerDate) / (1000 * 60 * 60 * 24));
                }

                console.log("Used Days Old Package:", usedDaysOldPackage);

                const remainingDaysNewPackage = 31 - usedDaysOldPackage;

                console.log("Remaining Days New Package:", remainingDaysNewPackage);

                let duesNewPackage = 0;
                let duesOldPackage = 0;
                let refund = 0;

                if (member.packageId) { // If member already has a package
                    const previousPackageAmount = parseFloat(member.packageId.packageAmount);
                    const previousPackageperDay = previousPackageAmount / 31;
                    const newPackagePerDay = parseFloat(packageData.packageAmount) / 31;

                    duesNewPackage = remainingDaysNewPackage * newPackagePerDay;
                    console.log("Dues New Package:", duesNewPackage);

                    duesOldPackage = usedDaysOldPackage * previousPackageperDay;
                    console.log("Dues Old Package:", duesOldPackage);

                    // Calculate refund only if the user has paid for the current package
                    if (member.isPaid) {
                        const totalPaid = duesNewPackage + refund;
                        const refundAmount = totalPaid - (usedDaysOldPackage * previousPackageAmount / 31);
                        refund = Math.max(0, refundAmount);
                        console.log("Refund Amount:", refund);
                    }
                } else {
                    // Initial package selection
                    duesNewPackage = parseFloat(packageData.packageAmount);
                }

                // Update member's package information
                member.packageId = packageData._id;
                member.lastPackageUpdateDate = today;
                member.isPaid = false; // Initially set to unpaid
                await member.save();

                // Create update package record
                const updatePackage = new UpdatePackageModel({
                    userId: memberId,
                    packageId: packageData._id,
                    updatedDate: today // Assuming updatedDate field exists in update package model
                });
                await updatePackage.save();

                // Create transaction for dues of the new package
                const transaction = new TransactionModel({
                    memberId: member._id,
                    packageId: packageData._id,
                    transactionAmount: duesNewPackage > 0 ? duesNewPackage : -refund, // Positive for dues, negative for refund
                    status: duesNewPackage > 0 ? "due" : "paid", // Set status
                    usedDays: remainingDaysNewPackage,
                    packageName: packageData.packageName,
                    packageAmount: packageData.packageAmount
                });
                await transaction.save();

                // Create transaction for dues of the old package
                if (duesOldPackage > 0) {
                    const oldPackageTransaction = new TransactionModel({
                        memberId: member._id,
                        packageId: member.packageId._id,
                        transactionAmount: duesOldPackage,
                        status: "due",
                        usedDays: usedDaysOldPackage,
                        packageName: member.packageId.packageName,
                        packageAmount: member.packageId.packageAmount
                    });
                    await oldPackageTransaction.save();
                }

                // Create refund transaction if refund amount is greater than 0
                if (refund > 0) {
                    const refundTransaction = new TransactionModel({
                        memberId: member._id,
                        packageId: packageData._id,
                        transactionAmount: -refund, // Refund amount
                        status: "refund", // Set status to refund
                        usedDays: remainingDaysNewPackage,
                        packageName: packageData.packageName,
                        packageAmount: packageData.packageAmount
                    });
                    await refundTransaction.save();
                }

                // Calculate total dues for the user
                const totalDues = duesNewPackage + duesOldPackage;

                // Prepare response
                const response = {
                    status: "success",
                    currentPackage: {
                        name: packageData.packageName,
                        totalAmount: parseFloat(packageData.packageAmount),
                        usedDays: remainingDaysNewPackage,
                        dues: duesNewPackage
                    },
                    oldPackage: {
                        //name: member.packageId ? member.packageId.packageName : null,
                        //totalAmount: member.packageId ? parseFloat(member.packageId.packageAmount) : null,
                        usedDays: usedDaysOldPackage,
                        dues: duesOldPackage
                    },
                    totalDues: totalDues,
                    refund: refund,
                    transaction: transaction._id,
                };

                res.json(response); // Send response
            } catch (error) {
                console.error(error);
                res.status(500).json({ status: "Internal Server Error" });
            }
        } else {
            res.json({ "status": "unauthorized user" });
        }
    });
});

router.get("/viewallpackage", async (req, res) => {
    let data = await PackageModel.find()
    res.json(data)
})

router.post('/package-updates', async (req, res) => {
    const token = req.headers["token"];
    jwt.verify(token, "gymapp", async (error, decoded) => {
        if (decoded && decoded.email) {
            try {
      const userId = req.body.userId;
      const packageUpdates = await UpdatePackageModel.find({ userId: userId }).populate("packageId").sort({ updatedDate: -1 });
      const packageNames = packageUpdates.map(update => ({
          packagename: update.packageId.packageName,
          updatedDate: update.updatedDate
        }));
      res.status(200).json(packageNames);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
} else {
    res.json({ "status": "unauthorized user" });
}
});
});

module.exports = router