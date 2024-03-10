const express = require('express');
const router = express.Router();
const TransactionModel = require('../Models/Transaction');
const MemberModel = require("../Models/MemberModel")
const PackageModel = require("../Models/Package")
const UpdatePackageModel = require("../Models/updateModel")
const jwt=require("jsonwebtoken")

// router.post('/transactions', async (req, res) => {
//     try {
//         const { memberId, packageId } = req.body;
//         const [member, selectedPackage] = await Promise.all([
//             MemberModel.findById(memberId),
//             PackageModel.findById(packageId)
//         ]);

//         if (!member || !selectedPackage) {
//             return res.status(404).json({ error: 'Member or selected package not found' });
//         }

//         const transactionAmount = parseFloat(selectedPackage.packageAmount);
//         const transaction = new TransactionModel({
//             memberId,
//             packageId,
//             transactionAmount,
//             paymentDate: new Date(),
//             status: 'paid',
//         });
//         await transaction.save();

//         member.lastPackageUpdateDate = new Date();
//         await member.save();

//         res.status(201).json({ message: 'Transaction created successfully' });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

router.post("/pay-dues", async (req, res) => {
    try {
      const email = req.body.email;
      member = await MemberModel.findOne({ email })
    .populate({ path: "packageId", model: "package" });
      if (!member) {
        return res.json({ status: "invalid email" });
      }
      const transactions = await TransactionModel.find({
        memberId: member._id,
        status: "due"
      });
  
      if (transactions.length === 0) {
        return res.json({ status: "no dues found" });
      }
      console.log("Simulating payment processing for transactions:", transactions.map(t => t._id));
      for (const transaction of transactions) {
        transaction.status = "paid";
        await transaction.save();
      }
      if (transactions.length === await TransactionModel.countDocuments({ memberId: member._id, status: "due" })) {
        member.lastPackageUpdateDate = new Date();
        await member.save();
      }
  
      res.json({ status: "success" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: "Internal Server Error" });
    }
  });

router.get('/trans', async (req, res) => {
    try {
      const memberId = req.body.memberId;
      const transactions = await TransactionModel.find({ memberId })
        .populate('memberId', 'name email')
        .populate('packageId', 'packageName packageAmount')
        .exec();
      res.status(200).json(transactions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  router.post("/viewtransactions", async (req, res) => {
    const token=req.headers["token"]
    jwt.verify(token,"gymapp",async(error,decoded)=>{
        if (decoded && decoded.email){
    try {
        const memberId = req.body.memberId;
        const user = await MemberModel.findById(memberId);
        if (!user) {
            return res.json({ status: "invalid user" });
        }

        const transactions = await TransactionModel.find({ memberId: memberId })
            .populate("packageId");

        res.json({ user: user, transactions: transactions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "Internal Server Error" });
    }
}
else {
    res.json(
        {
            "status":"unauthorised user"
        }
    )
    
}
})
});

router.post('/view-transactions-by-email', async (req, res) => {
    try {
        const email = req.body.email;

        // Find the member corresponding to the given email
        const member = await MemberModel.findOne({ email });

        if (!member) {
            return res.status(404).json({ status: "Member not found" });
        }

        // Find all transactions for the found member
        const transactions = await TransactionModel.find({ memberId: member._id });

        // Prepare detailed transaction history with individual dues
        const transactionHistory = [];
        let totalDues = 0;

        for (const transaction of transactions) {
            let packageName = "";
            let packageAmount = 0;
            let remainingDays = 0;
            let dues = 0;

            // Get package details from the transaction
            const packageData = await PackageModel.findById(transaction.packageId);
            if (packageData) {
                packageName = packageData.packageName;
                packageAmount = parseFloat(packageData.packageAmount);
                remainingDays = 31;
            }

            // Calculate dues for the old package
            if (transaction.status === "due" && transaction.transactionAmount < 0) {
                dues = -transaction.transactionAmount;
            }

            // Calculate dues for the new package
            if (transaction.status === "due" && transaction.transactionAmount > 0) {
                dues = transaction.transactionAmount;
            }

            // Update total dues
            totalDues += dues;

            // Add transaction details to the history
            transactionHistory.push({
                transactionId: transaction._id,
                packageName,
                packageAmount,
                remainingDays,
                dues,
                status: transaction.status
            });
        }

        // Prepare the response
        const response = {
            status: "success",
            name: member.name,
            email: member.email,
            totalDues,
            transactionHistory
        };

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "Internal Server Error" });
    }
});

router.post('/view-transactions', async (req, res) => {
    const token = req.headers["token"];
    jwt.verify(token, "gymapp", async (error, decoded) => {
        if (decoded && decoded.email) {
            try {
                const memberId = req.body.memberId;

                // Find all transactions for the given memberId
                const transactions = await TransactionModel.find({ memberId: memberId })
                    .populate('packageId'); // Populate the packageId field to retrieve package information

                // Map transactions to include package name and formatted payment date with time
                const formattedTransactions = transactions.map(transaction => {
                    const package = transaction.packageId;
                    const paymentDate = new Date(transaction.paymentDate).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    return {
                        _id: transaction._id,
                        memberId: transaction.memberId,
                        packageId: transaction.packageId,
                        packagename: package ? package.name : "Unknown", // Assuming the package model has a field named "name"
                        status: transaction.status,
                        transactionAmount: transaction.transactionAmount,
                        paymentDate: paymentDate,
                        __v: transaction.__v
                    };
                });

                res.json(formattedTransactions);
            } catch (error) {
                console.error(error);
                res.status(500).json({ status: "Internal Server Error" });
            }
        } else {
            res.json({ "status": "unauthorized user" });
        }
    });
});

module.exports = router;