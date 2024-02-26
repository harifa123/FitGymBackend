const mongoose=require("mongoose")
const trainerschema=new mongoose.Schema(
    {
        name:String,
        age:String,
        emailid:String,
        password:String
    }
)
module.exports=mongoose.model("addtrainer",trainerschema)