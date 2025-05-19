import {
  registerUser,
  loginUser,
  logOut,
  refreshAccessToken,
  updatePassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatarImage,
  updateCoverImage,
  userWatchHistory,
  getCurrentChannelProfile,
} from "../controllers/user.controller.js";
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();
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
);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logOut);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/update-password").patch(verifyJWT, updatePassword);
router.route("get-current-user").post(verifyJWT, getCurrentUser);
router.route("update-account-details").patch(verifyJWT, updateAccountDetails);
router
  .route("update-avatar")
  .patch(verifyJWT, upload.single("avatarimage"), updateAvatarImage);
router
  .route("update-cover")
  .patch(verifyJWT, upload.single("coverimage"), updateCoverImage);
router.route("user-watch-history").get(verifyJWT, userWatchHistory);
router.route("/c/:userName").get(verifyJWT, getCurrentChannelProfile);

export default router;
