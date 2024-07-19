
import connectDB from "./db/index.js";
import app from "./app.js"


connectDB().then(()=>{
    app.listen(process.env.PORT || 3000,()=>{
        console.log(`server listening on ${process.env.PORT}`)
    });
}).catch((err)=>{
    console.log("mongodb connection error: " + err)
});





/*
import express from "express";
const app = express();
const port= process.env.PORT || 3000;
; (async () => {
    try {
        await mongoose.connect(`mongodb://localhost:27017/${DB_NAME}`);
        console.log("Connected to MongoDB!");

        app.on('error', (err) => {
            console.log("error: ", err)
            throw err;
        })

        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });


    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        throw error;
    }
})()

*/