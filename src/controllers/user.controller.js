import { asyncHandler } from "../utils/async_handler.js"

const registerUser = asyncHandler(function (req, res) {
  var { userName, email } = req.body

  return res.status(200).json({
    message: "Coffee aur backend",
  })
})

export { registerUser }
