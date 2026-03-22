import { Router } from "express";
import { protect } from "@prepskill/common";
import { getCurrentUser } from "../controllers/user/getCurrentUser";
import { getUserById }    from "../controllers/user/getUserById";
import { getUsers }       from "../controllers/user/getUsers";

const router = Router();
const auth = protect(process.env.JWT_SECRET!);

router.get("/me",  auth, getCurrentUser);
router.get("/",    auth, getUsers);
router.get("/:id", auth, getUserById);

export default router;
