const express = require('express');
const PackageChangeRequest = require('../Models/packageChangeRequest');

const router = express.Router();

// API endpoint to handle package change requests
router.post('/requestChange', async (req, res) => {
    const { userId, newPackageId } = req.body;

    try {
        const packageChangeRequest = new PackageChangeRequest({
            userId: userId,
            newPackageId: newPackageId,
            status: "pending"
        });

        await packageChangeRequest.save();
        res.status(200).json({ message: "Package change request submitted successfully." });
    } catch (error) {
        console.error("Error saving package change request:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;
