const express = require("express");

const cors = require("cors");

const fs = require("fs");

const multer = require("multer");

const cloudinary = require("cloudinary").v2;

require("dotenv").config();

const app = express();

app.use(cors());

app.use(express.json());

const upload = multer({ dest: "uploads/" });

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

const path = require("path");

const FILE = path.join(
    __dirname,
    "data/students.json"
);

app.get("/students", (req,res)=>{

    const data = fs.readFileSync(FILE);

    res.json(JSON.parse(data));

});

app.post("/add-student",
upload.single("image"),
async(req,res)=>{

    try{

        const {
            className,
            name,
            batch,
            rank,
            place,
            camp
        } = req.body;

        let imageUrl = "";

        if(req.file){

            const result =
            await cloudinary.uploader.upload(
                req.file.path
            );

            imageUrl = result.secure_url;
        }

        const raw =
        fs.readFileSync(FILE);

        const data = JSON.parse(raw);

        const newStudent = {
            name,
            batch,
            rank,
            image:imageUrl
        };

        if(className === "1D"){
            newStudent.place = place;
        }

        if(className === "SPECIAL"){
            newStudent.camp = camp;
        }

        data[className].push(newStudent);

        fs.writeFileSync(
            FILE,
            JSON.stringify(data,null,2)
        );

        res.json({
            message:"Student Added"
        });

    }catch(err){

        console.log(err);

        res.status(500).json({
            error:"Server Error"
        });

    }

});

/* DELETE STUDENT */

app.delete("/delete-student/:className/:index",
(req,res)=>{

    const { className, index } = req.params;

    const raw = fs.readFileSync(FILE);

    const data = JSON.parse(raw);

    data[className].splice(index,1);

    fs.writeFileSync(
        FILE,
        JSON.stringify(data,null,2)
    );

    res.json({
        message:"Deleted Successfully"
    });

});


/* EDIT STUDENT */

app.put("/edit-student/:className/:index",
upload.single("image"),
async(req,res)=>{

    try{

        const {
            className,
            index
        } = req.params;

        const {
            name,
            batch,
            rank,
            place,
            camp
        } = req.body;

        let imageUrl = "";

        if(req.file){

            const result =
            await cloudinary.uploader.upload(
                req.file.path
            );

            imageUrl = result.secure_url;
        }

        const raw =
        fs.readFileSync(FILE);

        const data =
        JSON.parse(raw);

        const updatedStudent = {

            name,
            batch,
            rank,
            image:imageUrl
        };

        if(className === "1D"){

            updatedStudent.place = place;
        }

        if(className === "SPECIAL"){

            updatedStudent.camp = camp;
        }

        if(!imageUrl){

            updatedStudent.image =
            data[className][index].image;
        }

        data[className][index] =
        updatedStudent;

        fs.writeFileSync(
            FILE,
            JSON.stringify(data,null,2)
        );

        res.json({
            message:"Updated Successfully"
        });

    }catch(err){

        console.log(err);

        res.status(500).json({
            error:"Update Error"
        });

    }

});

app.listen(5000, ()=>{

    console.log("Server Running");

});