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

        hashPasswordGenerator(data.password, package).then(async (hashedpassword) => {
            console.log(hashedpassword);
            data.password = hashedpassword;

            try {
                let member = new MemberModel(data);
                member.previousPackageAmount = package.packageAmount;
                //member.lastPackageUpdateDate = new Date();
                let result = await member.save();
                res.json({ status: "success" });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.get("/view_all", async (req, res) => {
  try {
    const members = await MemberModel.find().populate("packageId");

    const membersWithDetails = await Promise.all(
      members.map(async (member) => {
        let dueAmount = 0;
        let remainingDaysForNextDue = 0;

        const currentDate = new Date();
        const registrationDate = new Date(member.registerDate);
        const lastUpdateDate = member.lastPackageUpdateDate ? new Date(member.lastPackageUpdateDate) : null;

        console.log("Current Date:", currentDate);
        console.log("Registration Date:", registrationDate);

        // Calculate total days since registration
        const daysWorked = Math.ceil(
          (currentDate - registrationDate) / (1000 * 60 * 60 * 24)
        );

        console.log("Days Worked:", daysWorked);

        // Calculate remaining days for next due payment
        remainingDaysForNextDue = 30 - (daysWorked % 30);

        console.log("Remaining Days for Next Due:", remainingDaysForNextDue);

        let oldPackageAmount = 0;
        if (lastUpdateDate) {
          // Use the explicitly stored previous package price
          oldPackageAmount = member.previousPackageAmount;
          const oldPackageAmountperwrok = parseFloat(oldPackageAmount) / 30 * daysWorked;
          console.log("oldPackageAmountperwrok:", oldPackageAmountperwrok); // Access directly from member object

          const newPackageAmount = (parseFloat(member.packageId.packageAmount) / 30) * remainingDaysForNextDue;
          console.log("newPackageAmount:", newPackageAmount);
          dueAmount = oldPackageAmountperwrok + newPackageAmount;
        } else {
          // No update, use current package directly
          oldPackageAmount = (parseFloat(member.previousPackageAmount));
          dueAmount = oldPackageAmount;
        }

        console.log("Due Amount:", dueAmount);

        return {
          name: member.name,
          email: member.email,
          package_name: member.packageId.packageName,
          dueAmount: dueAmount.toFixed(2),
          remainingDaysForNextDue: remainingDaysForNextDue >= 0 ? remainingDaysForNextDue : 0,
        };
      })
    );

    res.json(membersWithDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});
  
  
  module.exports = router;



