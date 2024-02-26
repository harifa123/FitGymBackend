const express=require("express")
const cors=require("cors")
const mongoose=require("mongoose")
const trainerrouter=require("./controllers/Trainer")
const packageRouter = require("./controllers/PackageRouter")

const app=express()

app.use(express.json())
app.use(cors())


mongoose.connect("mongodb+srv://harifa123:harifa123@cluster0.j6vqcp5.mongodb.net/gymDb?retryWrites=true&w=majority&appName=Cluster0")

app.use('/api/trainer',trainerrouter)

app.use("/api/package",packageRouter)

app.listen(3001,()=>{console.log("Server Running")})