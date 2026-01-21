import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
        select:false,

    },
});


userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
   try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
       
    } catch (error) {
        throw error; // Error handling bhi zaroori hai
    }
});

const userModel=mongoose.model("userModel",userSchema);



export default userModel;