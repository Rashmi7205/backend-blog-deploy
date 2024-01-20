import AppError from "../utils/apperror.js";
import jwt  from "jsonwebtoken";

const isLoggedIn = async (req,res,next)=>{
        try {
            const {token} = req.cookies;
            if(!token){
                return next(new AppError("Login To access this route",404));
            }
            const userDetails = await jwt.verify(token,process.env.JWT_SECRET);
            req.user = userDetails;
            next();
        } catch (error) {
            return next(new AppError("Internal Server Error",500));
        }
        
}

export default isLoggedIn;