const express=require("express")
const MemberModel = require("../Models/MemberModel")
const bcrypt = require("bcryptjs")
const PackageModel = require("../Models/Package");
const UpdateModel = require("../Models/updateModel");
//const jwt=require("jsonwebtoken")

async function hashPasswordGenerator(password) {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    } catch (error) {
        throw new Error('Error');
    }
}

const router=express.Router()

router.get("/packages", async (req, res) => {
    try {
        const packages = await PackageModel.find();
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

router.get("/viewDue", async (req, res) => {
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
          const daysWorked = Math.ceil(
            (currentDate - registrationDate) / (1000 * 60 * 60 * 24)
          );
  
          console.log("Days Worked:", daysWorked);
          remainingDaysForNextDue = 30 - (daysWorked % 30);
  
          console.log("Remaining Days for Next Due:", remainingDaysForNextDue);
  
          let oldPackageAmount = 0;
          if (lastUpdateDate) {
            oldPackageAmount = member.previousPackageAmount;
            const oldPackageAmountperwrok = parseFloat(oldPackageAmount) / 30 * daysWorked;
            console.log("oldPackageAmountperwrok:", oldPackageAmountperwrok);
            const newPackageAmount = (parseFloat(member.packageId.packageAmount) / 30) * remainingDaysForNextDue;
            console.log("newPackageAmount:", newPackageAmount);
            dueAmount = oldPackageAmountperwrok + newPackageAmount;
          } else {
            oldPackageAmount = (parseFloat(member.previousPackageAmount));
            dueAmount = oldPackageAmount;
          }
  
          console.log("Due Amount:", dueAmount);
  
          return {
            id: member._id,
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

  router.post("/viewDuemember", async (req, res) => {
    try {
        const { email } = req.body;
        const member = await MemberModel.findOne({ email }).populate("packageId");

        if (!member) {
            return res.status(404).json({ message: "Member not found" });
        }

        let dueAmount = 0;
        let remainingDaysForNextDue = 0;
        const currentDate = new Date();
        const registrationDate = new Date(member.registerDate);
        const lastUpdateDate = member.lastPackageUpdateDate ? new Date(member.lastPackageUpdateDate) : null;
        console.log("Current Date:", currentDate);
        console.log("Registration Date:", registrationDate);
        const daysWorked = Math.ceil(
            (currentDate - registrationDate) / (1000 * 60 * 60 * 24)
        );

        console.log("Days Worked:", daysWorked);
        remainingDaysForNextDue = 30 - (daysWorked % 30);

        console.log("Remaining Days for Next Due:", remainingDaysForNextDue);

        let oldPackageAmount = 0;
        if (lastUpdateDate) {
            oldPackageAmount = member.previousPackageAmount;
            const oldPackageAmountperwrok = parseFloat(oldPackageAmount) / 30 * daysWorked;
            console.log("oldPackageAmountperwrok:", oldPackageAmountperwrok);
            const newPackageAmount = (parseFloat(member.packageId.packageAmount) / 30) * remainingDaysForNextDue;
            console.log("newPackageAmount:", newPackageAmount);
            dueAmount = oldPackageAmountperwrok + newPackageAmount;
        } else {
            oldPackageAmount = parseFloat(member.previousPackageAmount);
            dueAmount = oldPackageAmount;
        }

        console.log("Due Amount:", dueAmount);

        res.json({
            name: member.name,
            email: member.email,
            package_name: member.packageId ? member.packageId.packageName : "No Package",
            dueAmount: dueAmount.toFixed(2),
            remainingDaysForNextDue: remainingDaysForNextDue >= 0 ? remainingDaysForNextDue : 0,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


router.post("/signin",async(req,res)=>{
    let input=req.body
    let email=req.body.email
    let data=await MemberModel.findOne({"email":email})
    if(!data)
    {
        return res.json({status:"incorrect email id"})
    }
    console.log(data)
    let dbPassword=data.password
    let inputPassword=req.body.password
    console.log(dbPassword)
    console.log(inputPassword)

    const match=await bcrypt.compare(inputPassword,dbPassword)
    if(!match)
    {
        return res.json({status:"incorrect password"})
    }
    
   //jwt.sign({email:email},"gymapp",{expiresIn:"1d"},
   //(error,token)=>{
    //if (error) {
     //   res.json(
      //      {
       //         "status":"error",
       //         "error":error

       //     }
       // )

        
   // }
     //else {
        //res.json({status:"success","userdata":data,"token":token})
        
    //}
  // })
    
})

router.post("/viewmemberdetails", async (req, res) => {
    try {
        let input = req.body;
        let data = await MemberModel.find(input).populate("packageId");

        // Map each member to include package details and payment due
        const membersWithDetails = await Promise.all(
            data.map(async (member) => {
                let dueAmount = 0;
                let remainingDaysForNextDue = 0;
                const currentDate = new Date();
                const registrationDate = new Date(member.registerDate);
                const lastUpdateDate = member.lastPackageUpdateDate ? new Date(member.lastPackageUpdateDate) : null;
                const daysWorked = Math.ceil(
                    (currentDate - registrationDate) / (1000 * 60 * 60 * 24)
                );
                remainingDaysForNextDue = 30 - (daysWorked % 30);

                let oldPackageAmount = 0;
                if (lastUpdateDate) {
                    oldPackageAmount = parseFloat(member.previousPackageAmount);
                    const oldPackageAmountperwork = parseFloat(oldPackageAmount) / 30 * daysWorked;
                    const newPackageAmount = (parseFloat(member.packageId.packageAmount) / 30) * remainingDaysForNextDue;
                    dueAmount = oldPackageAmountperwork + newPackageAmount;
                } else {
                    oldPackageAmount = parseFloat(member.previousPackageAmount);
                    dueAmount = oldPackageAmount;
                }

                // Add package details and payment due to member data
                const memberDataWithDetails = {
                    name: member.name,
                    place: member.place,
                    age:member.age,
                    height:member.height,
                    weight:member.weight,
                    bloodGroup:member.bloodGroup,
                    email: member.email,
                    registerDate:member.registerDate,
                    package_name: member.packageId.packageName,
                    package_amount:member.packageId.packageAmount, // Include the entire package details
                    dueAmount: dueAmount.toFixed(2),
                    remainingDaysForNextDue: remainingDaysForNextDue >= 0 ? remainingDaysForNextDue : 0,
                };
                return memberDataWithDetails;
            })
        );

        res.json(membersWithDetails);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post("/deletemember", async (req, res) => {
    try {
      const { _id } = req.body;
      const response = await MemberModel.deleteOne({ _id });
      if (response.deletedCount === 1) {
        res.json({ status: "success" });
      } else {
        res.status(404).json({ status: "error", message: "Member not found" });
      }
    } catch (error) {
      console.error("Error deleting member:", error);
      res.status(500).json({ status: "error", message: "Internal server error" });
    }
  });


router.post("/search",async(req,res)=>
{
    let input=req.body
    let data=await MemberModel.find(input)
    
    res.json(data)
})




router.post("/viewmemberpackage", async (req, res) => {

    const { email } = req.body;
    const member = await MemberModel.findOne({ email });
    const packageId = member.packageId;
    const packageDetails = await PackageModel.findById(packageId,"-_id -__v");
    res.json(packageDetails);

})


router.get("/viewallmembers", async (req, res) => {
    let projection = "-id -_v"; 
    let result = await MemberModel.find({}, projection); 
    res.json(result);
})

router.post("/viewmemberprofile",async(req,res)=>
{
    const token=req.headers["token"]
    jwt.verify(token,"gymapp",async(error,decoded)=>{
        if (decoded && decoded.email) {
            const { email } = req.body;
    const member = await MemberModel.findOne({ email });
    const memberDetails = {
        name: member.name,
        place: member.place,
        age:member.age,
        height:member.height,
        weight:member.weight,
        bloodGroup:member.bloodGroup,
        email:member.email,
        registerDate:member.registerDate
        
    };
    res.json(memberDetails);
            
        } else {
            res.json(
                {
                    "status":"unauthorised user"
                }
            )
            
        }
    })
})

router.post("/deletemember",async(req,res)=>{
    let input=req.body
    let response=await MemberModel.deleteOne(input)
    res.json({
        "status":"success"
    })
})


module.exports=router