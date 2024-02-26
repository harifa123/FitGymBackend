const express=require("express")
const cors=require("cors")
const mongoose=require("mongoose")
const gymrouter=require("./controllers/AddTrainer")

const app=express()

app.use(express.json())
app.use(cors())

mongoose.connect("mongodb+srv://harifa123:harifa123@cluster0.j6vqcp5.mongodb.net/gymDb?retryWrites=true&w=majority&appName=Cluster0",
{useNewurlParser:true}
)

app.use('/api/gym',gymrouter)

app.listen(1001,()=>{
    console.log("server running")
})