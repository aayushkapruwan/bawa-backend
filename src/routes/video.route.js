import { publishAVideo } from "../controllers/video.controller";
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware";
import { verifyJWT } from "../middlewares/auth.middleware";
const router = Router();
router.post(
  "/publishVideo",
  verifyJWT,
  upload.fields([
    {
      name: "Video",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishAVideo
);
export default router;
