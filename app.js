const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const trainerRouter = require("./controllers/Trainer");
const packageRouter = require("./controllers/PackageRouter");
const viewTrainersRouter = require("./controllers/viewTrainers"); // Import the new router

const app = express();

app.use(express.json());
app.use(cors());

mongoose.connect("mongodb+srv://harifa123:harifa123@cluster0.j6vqcp5.mongodb.net/gymDb?retryWrites=true&w=majority&appName=Cluster0");

app.use('/api/trainer', trainerRouter);
app.use("/api/package", packageRouter);
app.use("/api", viewTrainersRouter); // Mount the new router for viewing trainers

app.listen(3001, () => { console.log("Server Running") });
