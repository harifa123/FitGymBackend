const mongoose = require("mongoose")

const addPackageSchema = mongoose.Schema(
    {
        packageName: String,
        packageDes: String,
        packageAmount: String
        packageDetails: String
    }
)

module.exports = mongoose.model("gymPackage", addPackageSchema)