import { asyncHandler } from "../utils/asyncHander.js";
import { ApiError } from "../utils/apiError.js";
import { User } from '../models/User.models.js'
import { uploadOnCloudinary } from '../utils/Cloudinary.js';
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken';



const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)


        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access token and refresh token", error)
    }
}

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

    const { fullName, email, username, password, } = req.body;
    console.log("email : ", email, username)
    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }

    const exixttedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (exixttedUser) {
        throw new ApiError(409, "User with email or useranme already exit ")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file must be specified")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // let coverImageLocalPath;
    // if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    //     coverImageLocalPath = req.files.coverImage[0].path;
    // }

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createdUser) {
        throw new ApiError(500, "something went wrong when registering the user ")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})


const loginUser = asyncHandler(async (req, res) => {
    // req. body
    // username or email
    // find the user
    // check username or email
    // check password
    // send refreshToken and accessToken
    // send cookies

    const { username, email, password } = req.body

    if (!(username || email)) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "password is not valid ")
    }


    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res.status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken,
                },
                "User logged in successfully"
            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            }
        },
        {
            new: true,
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"))

})


const refreshAccessToken = asyncHandler(async (req, res) => {
    const inComingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!inComingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(inComingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (inComingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessTokenAndRefreshToken(user._id)

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("newRefreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken, refreshToken: newRefreshToken
                    },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)

    const isOldPaswordCorrect = await User.isPasswordCorrect(oldPassword)

    if (!isOldPaswordCorrect) {
        throw new ApiError(401, "Invalid old  password")
    }

    user.password = newPassword

    await user.save({ validateBeforeSave: false })
   
    return res.status(200)
    .json(new ApiResponse(200,{},"Password changed successfully"))

})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200)
    .json(new ApiResponse(200,req.user,"Current user fetched successfully"))
})

// const updateAccountDetails = asyncHandler(async (req, res) => {
//     const {fullName , email} = req.body

//     if(!(fullName || email)){
//         throw new ApiError(400,"")
//     }


// })


export { registerUser, loginUser, logoutUser, changeCurrentPassword ,getCurrentUser }
