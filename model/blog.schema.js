import mongoose, { model, Schema } from 'mongoose';
const commentSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    profilePic:{
        type:String,
    },
    comment: {
        type: String,
        minLength: [1, "Empty Comment"],
        maxLength: [200, "Max 200 char"]
    },
    replays: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    ]
},{timestamps:true});

const blogSchema = new Schema({
    title: {
        type: String,
        required: true,
        minLength: [5, 'Title length should be atleast 5 char']
    },
    description: {
        type: String
    },
    publicUrl: {
        type: String,
    },
    author: {
        type: Object,
        required: true,
    },
    content: {
        type: String,
    },
    category: {
        type:String,
    },
    image: {
        public_id: {
            type: String,
        },
        secure_url: {
            type: String,
        }
    },
    comments: [
        commentSchema
    ],
    likedBy: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    ],
}, { timestamps: true });

export default model('Blogs', blogSchema);