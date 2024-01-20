import multer from "multer";
import path from 'node:path';

const storage = multer.diskStorage({
    destination:'./uploads',
    filename:(req,file,cb)=>{
        cb(null,file.originalname);
    }
});

const upload = multer({
    dest:'./uploads',
    storage,
    fileFilter:(req,file,cb)=>{
        let ext = path.extname(file.originalname);
        if(
            ext!==".jpg" &&
            ext!==".png" &&
            ext!==".webp" &&
            ext!==".jpeg" &&
            ext!==".mp4"
        ){
            cb(new Error(`Unsupported File Format type ${ext}`),false);
            return;
        }
        cb(null,true);
    }
});

export default upload;