import express from "express";
import { login, updateprofile, updateplan, updateTheme, verifyLoginOtp } from "../controllers/auth.js";
const routes = express.Router();

routes.post("/login", login);
routes.post("/verifyloginotp", verifyLoginOtp);
routes.patch("/update/:id", updateprofile);
routes.patch("/updateplan/:id", updateplan);
routes.patch("/updatetheme/:id", updateTheme);
export default routes;