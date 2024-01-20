import Blogs from "../model/blog.schema.js";
import AppError from "../utils/apperror.js";
import cloudinary from 'cloudinary';
import User from '../model/user.schema.js';
import fs from 'fs';
import mongoose from 'mongoose';


const getBlogs = async (req,res,next)=>{
    try {
        const {limit,skip} = req.body;
        const blogs = await Blogs.aggregate([	
            {
              $skip: skip ||0
            },
            {
                  $limit: limit || 10
            },
            {
              $lookup: {
                from: "users",
                localField: "author",
                foreignField: "_id",
                as: "author"
              }
            },
            {
              $unwind:"$author"
            },
            {
                $project: {
                  _id:1,
                title:1,
                description:1,
                content:1,
                catagory:1,
                author:{
                  _id:1,
                  name:1,
                  profilePic:"$author.profilePic.secure_url",
                },
                likedBy:1,
                comments:1,
                createdAt:1,
                updatedAt:1
                }
            }
          ]);
        res.status(200).json({
            succsess:true,
            message:"All Blogs fetched succsessfully",
            blogCount:blogs.length,
            blogs
        });
    } catch (error) {
        return next(new AppError(error.message,400));
    }
}   

const getBlogById = async (req,res,next)=>{
    
    try {
        const {id} = req.params;
        if(!id){
            return next(new AppError('Blog Id is required',400));
        } 
      
        const blog = await Blogs.aggregate(
            [
               { 
                '$match': {
                    '_id':new mongoose.Types.ObjectId(id)
                  }
                }
            ]
        );

        const comments = await Blogs.aggregate([
                { 
                '$match': {
                    '_id':new mongoose.Types.ObjectId(id)
                  }
                },
                {
                    $unwind:"$comments"
                  },
               {
                 $lookup: {
                   from: "users",
                   localField: "comments.user",
                   foreignField: "_id",
                   as: "user"
                 }
               },
               {
                 $unwind:"$user"
               },
               {
                 $project: {
                   "comment":"$comments.comment",
                      "userDetails":{
                     name:"$user.name",
                     profilePic:"$user.profilePic.secure_url",
                     id:"$user._id",
                   }
                 }
               }
        ]);

        

        if(!blog.length) {
            return next(new AppError("Blog Post Doesnot exist",400));
        }
       
        blog[0].comments=comments;
        res.status(200).json({
            succsess:true,
            message:"Blog Fetched Successfully",
            blog
        });
    } catch (error) {
        return next(new AppError(error.message,400));
    }
   
    
}

const createBlogs = async (req,res,next)=>{
    try {
        const {title,description,content,category} = req.body;
        const {id} = req.user;      

        if(!title||!content){
            return next(new AppError("Title and Content Must required",400));
        }
        
        const user = await User.findById(id);

        if(!user){
            return next(new AppError("This user doesnot exist",402));
        }

        const blog =  await Blogs.create({
            title,
            content,
            description,
            category,
            author:user._id,
            publicUrl:req.body?.publicUrl || "#",
        });

        if(!blog){
            return next(new AppError("Something Went Wrong!",500));
        }
        

        if(req.file){
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'blog'
              });
              
             if(result){
                blog.image.public_id = result.public_id;
                blog.image.secure_url =result.secure_url;
             }
          
            if (fs.existsSync(req.file.path)) {
                // File exists, delete it
                fs.unlinkSync(req.file.path);
              }
        }

        await blog.save();

        return res.status(200).json({
            sucess:true,
            message:"Blog Created Successfully",
            blog
        });

    } catch (error) {
        return next(new AppError(error.message,400));
    }
}
const updateBlogs = async (req,res,next)=>{
    try {
        const { id } = req.params;
        const { title, description, content, catagory } = req.body;
    
        const blog = await Blogs.findById(id);
    
        // IF blog does not exist
        if (!blog) {
            return next(new AppError("Blog does not exist", 400));
        }
    

        const updatedBlog = await Blogs.findByIdAndUpdate(id, {
            title,
            description,
            content,
            catagory
        }, { new: true }); // Adding { new: true } to get the updated document
    
        
           // / Uploading the image file of the blog
           if(req.file){
            if(blog?.image?.public_id) {
                await cloudinary.v2.uploader.destroy(blog?.image?.public_id);
            }
            const result = await cloudinary.v2.uploader.upload(req.file.path,{
                folder:'blog',
            });
           
            // Updating the urls fro thr image
            if(result){
                blog.image.public_id=result.public_id ;
                blog.image.secure_url =result.secure_url;
            }
           
            if (fs.existsSync(req.file.path)) {
                // File exists, delete it
                fs.unlinkSync(req.file.path);
              }
        }

        await blog.save();
        
        if (!updatedBlog) {
            return next(new AppError("Failed to update", 400));
        }

    
        res.status(200).json({
            success: true,
            message: "Blog updated successfully",
            blog,
        });
    
    } catch (error) {
        return next(new AppError(error.message, 400));
    }
    
   



}
const deleteBlogs = async (req,res,next)=>{
    try {
        const {id} = req.params;
        if(!id){
            return next(new AppError("blog Id is required",400));
        }

        const user = await User.findById(req.user.id);
        if(!user){
            return next(new AppError("User doesnot exist",400));
        }
        if(user.blogs.includes(id)){
            const blog = await Blogs.findByIdAndDelete(id);
            if(!blog){
                 return next(new AppError("Blog Does not exist",400));
            }
            user.blogs.splice(user.blogs.indexOf(id),1);
            await user.save();

           return res.status(200).json({
                succsess:true,
                message:"Blog Deleted Sucessfully",
            })
            
        }
        else{
            return res.status(200).json({
                succsess:false,
                message:"unauthorized accsess",
            })
        }
       
    } catch (error) {
          return next(new AppError(error.message,400));
    }
}

const postComment = async (req,res,next)=>{
    try {
        const {email} = req.user;
        const {id} = req.params;
        const {newComment} = req.body;
        if(!email || !id){
            return next(new AppError('Unauthenticated User',503));
        }
        const user = await User.findOne({email});
        if(!user){
            return next(new AppError('User Not registered',400));
        }
        const blog = await Blogs.findById(id);
    
        const commentObj = {
            user:user._id,
            comment:newComment,
            profilePic:user?.profilePic?.secure_url,
        }
        
        blog.comments.push(commentObj);

        await blog.save();

        res.status(200).json({
            succsess:true,
            message:"Comment Added Succsessfully",
            blog,
        });
    } catch (error) {
            return next(new AppError(error.message,400));
    }
}


const postLike = async (req,res,next)=>{
    try {
        const { email } = req.user;
        const { id } = req.params;
        if (!email || !id) {
            return next(new AppError('Unauthenticated User', 503));
        }
    
        const user = await User.findOne({ email });
        if (!user) {
            return next(new AppError('User Not registered', 400));
        }
    
        const blog = await Blogs.findById(id);
    
        const likedIndex = blog.likedBy.indexOf(user.id);
    
        if (likedIndex !== -1) {
            // User's ID is found in the likedBy array, remove it
            blog.likedBy.splice(likedIndex, 1);
    
            await blog.save();
            return res.status(200).json({
                success: true,
                message: "Unliked Successfully",
                blog,
            });
        } else {
            // User's ID is not found in the likedBy array, add it
            blog.likedBy.push(user.id);
    
            await blog.save();
            return res.status(200).json({
                success: true,
                message: "Liked Successfully",
                blog
            });
        }
    } catch (error) {
        return next(new AppError(error.message, 400));
    }
}



export {
    getBlogs,
    createBlogs,
    updateBlogs,
    deleteBlogs,
    getBlogById,
    postComment,
    postLike,
    
}