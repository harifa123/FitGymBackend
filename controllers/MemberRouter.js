const express=require("express")
const MemberModel = require("../Models/MemberModel")
const bcrypt = require("bcryptjs")

hashPasswordGenerator = async (pass) => {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(pass, salt)
}

const router=express.Router()

router.post("/addmember",async(req,res)=>
{
    let { data } = { "data": req.body }
    let password = data.password
    hashPasswordGenerator(password).then(
        (hashedpassword) => {
            console.log(hashedpassword)
            data.password = hashedpassword
    let member=new MemberModel(data)
    let result=member.save()
    res.json(
        {
            status:"success"
        }
    )
})
})

router.post("/search",async(req,res)=>
{
    let input=req.body
    let data=await MemberModel.find(input)
    res.json(data)
})



module.exports=router