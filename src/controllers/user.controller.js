import { asyncHandler } from "../utils/async_handler.js"
import ApiError from "../utils/api_error.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/api_response.js"

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId)

    const accessToken = user.getAccessToken()
    const refreshToken = user.getRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }
  } catch (error) {
    console.log(error)
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh tokens"
    )
  }
}

const registerUser = asyncHandler(async function (req, res) {
  //
  //    PROCESS:

  //    1. Get user details from frontend
  //    2. Validation - not empty
  //    3. Check if user already exists
  //    4. Check for images and avatar
  //    5. Upload them to cloudinary
  //    6. Create user object - create entry in DB
  //    7. Remove pass and refresh token from DB response
  //    8. Verify user created
  //    9. return response

  var { userName, email, fullName, password } = req.body

  if (!email || !userName || !password || !fullName) {
    throw new ApiError(400, "All Fields are required")
  }

  if ([userName, email, fullName, password].some((val) => val?.trim() === "")) {
    throw new ApiError(400, "All Fields are required")
  }

  const userExits = await User.findOne({
    $or: [{ userName }, { email }],
  })

  if (userExits)
    throw new ApiError(400, "User with email or userName already exists")

  if (
    !req.files?.avatar ||
    !Array.isArray(req.files.avatar) ||
    req.files.avatar.length <= 0
  ) {
    throw new ApiError(400, "Avatar is required")
  }

  const avatarLocalPath = req.files?.avatar[0]?.path

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required")
  }

  const cloudinaryRes = await uploadOnCloudinary(avatarLocalPath)

  const user = await User.create({
    fullName,
    email,
    password,
    userName: userName.toLowerCase(),
    avatar: cloudinaryRes.url,
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if (!createdUser) {
    throw new ApiError(500, "Server Error")
  }

  console.log(req.files?.avatar[0].path)
  return res
    .status(200)
    .json(new ApiResponse(201, createdUser, "User created sucessfully"))
})

const loginUser = asyncHandler(async function (req, res) {
  //
  //    PROCESS:

  //    1. Get username/email/both and password from request body
  //    2. Check if user exists or not
  //    3. Check if the password is correct or not
  //    4. Generate accessToken and refresh Token
  //    5. Send cookie and response

  const { email, userName, password } = req.body

  if (!email && !userName) {
    throw new ApiError(400, "Username or email is required")
  }

  const user = await User.findOne({
    $or: [{ userName }, { email }],
  })

  if (!user) {
    throw new ApiError(400, "User not found")
  }

  const passwordCorrect = await user.isPasswordCorrect(password)

  if (!passwordCorrect) {
    throw new ApiError(400, "Password incorrect")
  }

  const options = {
    httpOnly: true,
    secure: true,
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  )

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    )
})

export { registerUser, loginUser }
