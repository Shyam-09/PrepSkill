import { Router } from "express";
import { protect } from "@prepskill/common";
import { register }     from "../controllers/auth/register";
import { login }        from "../controllers/auth/login";
import { refreshToken } from "../controllers/auth/refreshToken";
import { logout }       from "../controllers/auth/logout";
import { registerValidator } from "../validators/registerValidator";
import { loginValidator }    from "../validators/loginValidator";
import { validateRequest }   from "../middlewares/validateRequest";

const router = Router();

router.post("/register",      registerValidator, validateRequest, register);
router.post("/login",         loginValidator,    validateRequest, login);
router.post("/refresh-token", refreshToken);
router.post("/logout",        protect(process.env.JWT_SECRET!), logout);

export default router;
