const express = require("express");
const MemberModel = require("../Models/MemberModel");
const PackageModel = require("../Models/Package");
const UpdateModel = require("../Models/updateModel");
const bcrypt = require('bcrypt');

async function hashPasswordGenerator(password) {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    } catch (error) {
        throw new Error('Error');
    }
}

async function calculateDueAmount(packagePrice, registrationDate, lastPackageUpdateDate, upgradeDate, upgradeInfo, newPackagePrice = packagePrice, millisecondsPerDay) {
    let daysWorked = 0;
    if (upgradeDate) {
        const daysDifference = Math.round(Math.abs((upgradeDate - lastPackageUpdateDate) / millisecondsPerDay));
        daysWorked = daysDifference;
    } else {
        const currentDate = new Date();
        const daysDifference = Math.round(Math.abs((currentDate - lastPackageUpdateDate) / millisecondsPerDay));
        daysWorked = daysDifference;
    }

    let dueAmount = 0;
    if (upgradeDate) {
        const remainingDaysInCurrentPackage = Math.max(0, 30 - daysWorked);
        let actualNewPackagePrice = newPackagePrice;
        if (upgradeInfo) {
            actualNewPackagePrice = upgradeInfo.newPackagePrice;
        }
        let remainingDaysCost = 0;
        if (upgradeInfo) {
            remainingDaysCost = upgradeInfo.newPackageDailyRate ? remainingDaysInCurrentPackage * upgradeInfo.newPackageDailyRate : upgradeInfo.newPackageRemainingPeriodCost || 0;
        } else {
            console.error("Missing information");
        }
        dueAmount = (daysWorked * (packagePrice / 30)) + remainingDaysCost;
    } else {
        dueAmount = packagePrice;
    }

    return dueAmount;
}

const router = express.Router();

router.get("/packages", async (req, res) => {
    try {
        const packages = await PackageModel.find({}, 'packageName _id');
        res.json(packages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/addmember", async (req, res) => {
    let { data } = { "data": req.body };
    let password = data.password;
    try {
        const package = await PackageModel.findById(data.packageId);
        if (!package) {
            return res.status(400).json({ error: "Invalid package" });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }

    hashPasswordGenerator(password).then(async (hashedpassword) => {
        console.log(hashedpassword);
        data.password = hashedpassword;

        try {
            let member = new MemberModel(data);
            let result = await member.save();
            res.json({ status: "success" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
});

router.get("/viewmember", async (req, res) => {
    try {
        const millisecondsPerDay = 24 * 60 * 60 * 1000;

        let projection = "-id -__v -age -place -height -weight -bloodGroup -password";
        let members = await MemberModel.find({}, projection);

        let membersWithDueAmount = await Promise.all(members.map(async (member) => {
            try {
                const { packageId, lastPackageUpdateDate } = member;
                let packageDetails = await PackageModel.findById(packageId);
                if (!packageDetails) {
                    throw new Error("Package not found");
                }
                const dueAmount = await calculateDueAmount(
                    packageDetails.packageAmount,
                    member.registerDate,
                    lastPackageUpdateDate,
                    null,
                    millisecondsPerDay
                );
                let remainingDaysForNextDue = null;
                if (lastPackageUpdateDate) {
                    remainingDaysForNextDue = 30;
                } else {
                    remainingDaysForNextDue = Math.max(0, 30 - Math.round((new Date() - member.registerDate) / millisecondsPerDay));
                }

                return {
                    ...member.toObject(),
                    dueAmount,
                    remainingDaysForNextDue
                };
            } catch (error) {
                console.error(error);
                throw new Error("Error");
            }
        }));

        res.json(membersWithDueAmount);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;



