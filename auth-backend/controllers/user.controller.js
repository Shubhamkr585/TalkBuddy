
import User from "../models/user.model.js";

const getUsers = async (req, res) => {
    try {
        const users= await User.find({},'name');
        res.status(200).json(users);
    }
    catch(error){
        console.log(error);
        res.status(500).json({message:"Server Error"});
    }
}

const getUserById=async (req,res)=>{
    try{
        const user= await User.findById(req.params.id,'name');
        res.status(200).json(user);
    }
    catch(error){
        console.log(error);
        res.status(500).json({message:"Server Error"});
    }
}

export {getUsers,getUserById};