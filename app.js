const express=require("express")
const cors=require("cors")
const mongoose=require("mongoose")
const gymrouter=require("./controllers/AddTrainer")
const packageRouter = require("./Controller/addPackageRouter")

const app=express()

app.use(express.json())
app.use(cors())


mongoose.connect("mongodb+srv://harifa123:harifa123@cluster0.j6vqcp5.mongodb.net/gymDb?retryWrites=true&w=majority&appName=Cluster0")

app.use('/api/gym',gymrouter)

app.use("/api/fitgym",packageRouter)

app.listen(3001,()=>{console.log("Server Running")})