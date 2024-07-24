import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async() => {
    try{
        const connectionInstance = await mongoose.connect(`mongodb://localhost:27017/${DB_NAME}`)
        console.log(`MongoDB connected DB host : ${connectionInstance.connection.host}`);


    }catch(e){
        console.log("mongodb: connect error: " + e);
        process.exit(1);
    }

}

export default connectDB;