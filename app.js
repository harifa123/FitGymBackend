const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")

const packageRouter = require("./Controller/addPackageRouter")

const app = express()

app.use(express.json())
app.use(cors())

mongoose.connect("mongodb+srv://melvinpoulose06:melvinpml4151@cluster0.yshbagz.mongodb.net/fitGymDb?retryWrites=true&w=majority",{useNewUrlParser:true})

app.use("/api/fitgym",packageRouter)

app.listen(3001,()=>{console.log("Server Running")})