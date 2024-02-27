const mongoose=require("mongoose")
const updatePackageSchema=new mongoose.Schema(
    {
        userId:{
            type:mongoose.Schema.Types.ObjectId,
            required:true,
            ref:"member"
        },
        packageId:{
            type:mongoose.Schema.Types.ObjectId,
            required:true,
            ref:"package"
        },
        updatedDate:{
            type:Date,
            default:Date.now
        }
    }
)

module.exports=mongoose.model("updatePackage",updatePackageSchema)