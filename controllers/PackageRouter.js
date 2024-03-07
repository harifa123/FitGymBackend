const express = require("express")
const PackageModel = require("../Models/Package")
const MemberModel = require("../Models/MemberModel")
const UpdatePackageModel = require("../Models/updateModel");
const TransactionModel = require('../Models/Transaction');

const router = express.Router()

router.post("/addpackage",async(req,res)=>{
    let data = req.body
    let addPackage = PackageModel(data)
    let result = addPackage.save()
    res.json({status:"successs"})
})

router.post("/update-package", async (req, res) => {
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
        let usedDays = 0;

        const previousUpdates = await UpdatePackageModel.find({ userId: memberId });
        if (previousUpdates.length > 0) {
            previousUpdates.sort((a, b) => b.updatedDate - a.updatedDate);
            const lastUpdate = previousUpdates[0];
            const lastUpdatedDate = lastUpdate.updatedDate;
            usedDays = Math.ceil((today - lastUpdatedDate) / (1000 * 60 * 60 * 24));
        } else {
            const registerDate = member.registerDate;
            usedDays = Math.ceil((today - registerDate) / (1000 * 60 * 60 * 24));
        }

        console.log("Used Days:", usedDays);

        let remainingDues = 0;
        let dues = 0;
        let refund = 0;
        const remainingDays = 31 - usedDays;

        console.log("Remaining Days:", remainingDays);

        let previousPackageAmount = 0;

        const latestUpdate = await UpdatePackageModel.findOne({ userId: memberId }).sort({ updatedDate: -1 });
        if (latestUpdate) {
            const previousUpdatePackage = await PackageModel.findById(latestUpdate.packageId);
            if (previousUpdatePackage) {
                previousPackageAmount = parseFloat(previousUpdatePackage.packageAmount);
            } else {
                return res.json({ status: "error retrieving previous package information" });
            }
        } else {
            previousPackageAmount = parseFloat(member.packageId.packageAmount);
        }

        console.log("Type of previousPackageAmount:", typeof previousPackageAmount);
        console.log("Type of packageData.packageAmount:", typeof packageData.packageAmount);


        if (member.packageId) { // If member already has a package
            if (packageData._id.toString() === member.packageId.toString()) { // No change
                // Handle scenario where no change happens and user hasn't paid yet
                if (!member.isPaid) {
                    dues = parseFloat(packageData.packageAmount);
                }
            } else if (parseFloat(packageData.packageAmount) > previousPackageAmount) { // Upgrade
                const previousPackageperDay = previousPackageAmount / 31;
                const upgradePricePerDay = parseFloat(packageData.packageAmount) / 31;
                dues = remainingDues + (previousPackageperDay * usedDays) + (remainingDays * upgradePricePerDay);
                console.log("Dues (Upgrade):", dues);
            } else if (parseFloat(packageData.packageAmount) < previousPackageAmount) { // Downgrade
                const daysAtPreviousPrice = Math.min(usedDays, 31);
                const daysAtNewPrice = Math.max(0, remainingDays);
            
                const previousPricePerDay = previousPackageAmount / 31;
                const newPricePerDay = parseFloat(packageData.packageAmount) / 31;
            
                console.log("Days at Previous Price:", daysAtPreviousPrice);
                console.log("Days at New Price:", daysAtNewPrice);
                console.log("Previous Price Per Day:", previousPricePerDay);
                console.log("New Price Per Day:", newPricePerDay);
            
                dues = remainingDues + (daysAtNewPrice * newPricePerDay) + (daysAtPreviousPrice * previousPricePerDay);
                refund = 0; // Resetting refund to 0 initially
                    const latestTransaction = await TransactionModel.findOne({ memberId: member._id, packageId: member.packageId }).sort({ createdAt: -1 });
                    if (latestTransaction) {
                        const totalPaid = latestTransaction.transactionAmount;
                        console.log("totalPaid:", totalPaid);
                        const totalRemainingDays = usedDays;
                        const refundAmount = totalPaid - (totalRemainingDays * parseFloat(previousPackageAmount) / 31);
                        refund = Math.max(0, refundAmount);
                    }
            
                console.log("Dues (Downgrade):", dues);
                console.log("Refund Amount:", refund);
            } 
            
        } else { 
            // Initial package selection
            dues = parseFloat(packageData.packageAmount);
        }

        console.log("Dues:", dues);
        console.log("Refund:", refund);

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

        // Create transaction for dues or refund
const transaction = new TransactionModel({
    memberId: member._id,
    packageId: packageData._id,
    transactionAmount: dues > 0 ? dues : -refund, // Positive for dues, negative for refund
    status: dues > 0 ? "due" : "paid", // Set status
});
await transaction.save();

// Create refund transaction if refund amount is greater than 0
if (refund > 0) {
    const refundTransaction = new TransactionModel({
        memberId: member._id,
        packageId: packageData._id,
        transactionAmount: -refund, // Refund amount
        status: "refund", // Set status to refund
    });
    await refundTransaction.save();
}
        const response = {
            status: "success",
            dues: dues,
            refund: refund,
            transaction: transaction._id,
        };

        res.json(response); // Send response
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "Internal Server Error" });
    }
});


router.get("/viewallpackage", async (req, res) => {
    let data = await PackageModel.find()
    res.json(data)
})


module.exports = router