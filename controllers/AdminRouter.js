const express = require("express")
const adminModel = require("../Models/AdminModel")
const PackageChangeRequest = require('../Models/packageChangeRequest');
const RequestModel = require("../Models/Request");
const MemberModel = require("../Models/MemberModel")
const UpdatePackageModel = require("../Models/updateModel");



const bcrypt = require("bcryptjs")
const router = express.Router()
const jwt = require("jsonwebtoken")

const hashPasswordGenerator = async (pass) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(pass, salt)
}

router.post('/addadmin', async (req, res) => {
    try {
        let { data } = { "data": req.body }
        let password = data.password
        const hashedpassword = await hashPasswordGenerator(password)
        data.password = hashedpassword
        let gym = new adminModel(data)
        await gym.save()
        res.json({ status: "success" })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

router.post("/adminlogin", async (req, res) => {
    try {
        const { mail, password } = req.body;
        const admin = await adminModel.findOne({ mail: mail });
        if (!admin) {
            return res.json({ status: "Incorrect mailid" });
        }
        const match = await bcrypt.compare(password, admin.password);
        if (!match) {
            return res.json({ status: "Incorrect password" });
        }
        jwt.sign({ email: mail }, "fitgymadmin", { expiresIn: "1d" }, (error, admintoken) => {
            if (error) {
                return res.json({ "status": "error", "error": error });
            } else {
                return res.json({ status: "success", "admindata": admin, "admintoken": admintoken });
            }
        });
    } catch (error) {
        return res.status(500).json({ "status": "error", "message": "Failed to login admin" });
    }
});






router.post("/adminprofile", async (req, res) => {
    const admintoken = req.headers["admintoken"];
    jwt.verify(admintoken, "fitgymadmin", async (error, decoded) => {
        if (error) {
            return res.json({ "status": "error", "message": "Failed to verify token" });
        }
        if (decoded && decoded.email) {
            const { email } = decoded;
            try {
                const admin = await adminModel.findOne({ mail: email });
                if (!admin) {
                    return res.status(404).json({ "status": "Admin not found" });
                }
                const adminDetails = {
                    name: admin.name,
                    age: admin.age,
                    mail: admin.mail
                };
                return res.json(adminDetails);
            } catch (error) {
                return res.status(500).json({ "status": "error", "message": "Failed to fetch admin details" });
            }
        } else {
            return res.json({ "status": "unauthorised user" });
        }
    });
});

router.get('/pendingRequests', async (req, res) => {
    try {
        const requests = await PackageChangeRequest.find({ status: 'pending' }).populate("userId newPackageId", "name packageName").exec()
        res.json(requests);
        let data = requests._id
        console.log(data)
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Approve or reject package change request
router.put('/rejectRequest/:id', async (req, res) => {
    try {
        let id = req.params.id;
        await PackageChangeRequest.findByIdAndDelete(id);
        res.json({ status: "rejected successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.put('/approveRequest/:id', async (req, res) => {
    try {
        let id = req.params.id;
        let data = await PackageChangeRequest.findById(id);
        console.log(data)
        let userid = data.userId._id
        let memData = await MemberModel.findById(userid)
        
        if (memData.packageId.equals(data.newPackageId)) {
            id = req.params.id;
            await PackageChangeRequest.findByIdAndDelete(id);
            res.json({ status: "same package" });
        }
        else {
            const userId = data.userId;
            const packageId = data.newPackageId;
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
            let updateChangePackageData = await PackageChangeRequest.findOneAndUpdate({ _id: id },
                { $set: { status: "approved" } });
            res.json({ status: "approved successfully" });
        }
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.post('/viewmemberdetails', async (req, res) => {
    try {
        const { _id } = req.body;
        const member = await MemberModel.findById(_id);
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        // Assuming that the request status is stored in the member object
        const userDetails = {
            name: member.name,
            // Add other user details as needed
            requestStatus: member.requestStatus // Add the request status to the response
        };

        res.json(userDetails);
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router

