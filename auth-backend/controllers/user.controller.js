import prisma from "../prismaClient.js";

const getUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true }
        });
        // Map id to _id for frontend compatibility
        const mappedUsers = users.map(u => ({ _id: u.id, name: u.name }));
        res.status(200).json(mappedUsers);
        console.log(mappedUsers);
    }
    catch(error){
        console.log(error);
        res.status(500).json({message:"Server Error"});
    }
}

const getUserById=async (req,res)=>{
    try{
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: { id: true, name: true }
        });
        if (!user) return res.status(404).json({message: "User not found"});
        res.status(200).json({ _id: user.id, name: user.name });
    }
    catch(error){
        console.log(error);
        res.status(500).json({message:"Server Error"});
    }
}

export {getUsers,getUserById};