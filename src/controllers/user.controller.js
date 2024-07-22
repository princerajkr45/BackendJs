import { asyncHandler } from "../utils/asyncHander.js";
import { ApiError } from "../utils/apiError.js";
import { User } from '../models/User.models.js'
import {uploadOnCloudinary} from '../utils/CloudInary.js'
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    // res.status(200).json({ message: "chai and code" });

    // get user information from frontend
    // validation 
    // chweck if user already  exists : username , email
    // check for images , check avatar
    // upload them to cloudinary , avatar
    // create user object -- create entry in db
    // remove password and refresh token field  from response
    // check for user creation
    // return res  

    const { fullName, email, username, password ,} = req.body;
    console.log("email : ", email ,username)
    if ([fullName, email, username, password].some((field) => field?.trim() === "")){
        throw new ApiError(400,"All fields are required")
    }

    const exixttedUser= await User.findOne({
        $or:[{username},{email}]
    })

    if(exixttedUser){
        throw new ApiError(409,"User with email or useranme already exit ")
    }
   
    const avatarLocalPath = req.files?.avatar?.[0]?.path
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file must be specified")
    }

    console.log(req.files)
    console.log(avatarLocalPath)
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    console.log(avatar)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase(),
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createdUser){
        throw new ApiError(500,"something went wrong when registering the user ")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )
})



export { registerUser }