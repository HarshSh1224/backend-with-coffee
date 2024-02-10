import { Router } from "express"
import { registerUser } from "../controllers/user.controller.js"
import { loginUser } from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { logoutUser } from "../controllers/user.controller.js"
import { refreshAccessToken } from "../controllers/user.controller.js"
import { changeCurrentPasssword } from "../controllers/user.controller.js"
import { getCurrentUser } from "../controllers/user.controller.js"
import { getChannelProfile } from "../controllers/user.controller.js"

const router = Router()

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
)

router.route("/login").post(loginUser)

// Secured routes

router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/reset-password").post(verifyJWT, changeCurrentPasssword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/c/:userName").get(verifyJWT, getChannelProfile)

export default router
