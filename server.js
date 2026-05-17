const express = require("express");

const cors = require("cors");

const fs = require("fs");

const multer = require("multer");

const cloudinary = require("cloudinary").v2;

const path = require("path");

require("dotenv").config();

const app = express();

app.use(cors());

app.use(express.json());

const upload = multer({
    dest: "uploads/"
});

/* =========================================
   CLOUDINARY
========================================= */

cloudinary.config({

    cloud_name: process.env.CLOUD_NAME,

    api_key: process.env.API_KEY,

    api_secret: process.env.API_SECRET

});

/* =========================================
   JSON FILE
========================================= */

const FILE = path.join(
    __dirname,
    "data/students.json"
);

/* =========================================
   READ JSON FILE SAFELY
========================================= */

function readData(){

    try{

        if(!fs.existsSync(FILE)){

            return {};
        }

        const raw =
        fs.readFileSync(FILE,"utf8");

        return JSON.parse(raw);

    }catch(error){

        console.log(
            "JSON READ ERROR:",
            error
        );

        return {};
    }
}

/* =========================================
   WRITE JSON FILE
========================================= */

function writeData(data){

    fs.writeFileSync(

        FILE,

        JSON.stringify(data,null,2)

    );
}

/* =========================================
   GET STUDENTS
========================================= */

app.get("/students",(req,res)=>{

    try{

        const data =
        readData();

        res.json(data);

    }catch(error){

        console.log(error);

        res.status(500).json({

            error:"Failed To Load Students"

        });
    }
});

/* =========================================
   ADD STUDENT
========================================= */

app.post(
    "/add-student",

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

            const data =
            readData();

            let imageUrl = "";

            /* IMAGE */

            if(req.file){

                const result =
                await cloudinary.uploader.upload(
                    req.file.path
                );

                imageUrl =
                result.secure_url;
            }

            const newStudent = {

                name,
                batch,
                rank,
                image:imageUrl

            };

            /* EXTRA FIELDS */

            if(
                className ===
                "YOUTH EXCHANGE PROGRAM"
            ){

                newStudent.place = place;
            }

            if(
                className ===
                "RARE CAMPS"
            ){

                newStudent.camp = camp;
            }

            /* CREATE CLASS IF NOT EXISTS */

            if(!data[className]){

                data[className] = [];
            }

            data[className].push(
                newStudent
            );

            writeData(data);

            res.json({

                message:
                "Student Added Successfully"

            });

        }catch(error){

            console.log(error);

            res.status(500).json({

                error:"Add Student Failed"

            });
        }
    }
);

/* =========================================
   DELETE STUDENT
========================================= */

app.delete(
    "/delete-student/:className/:index",

    (req,res)=>{

        try{

            const {

                className,
                index

            } = req.params;

            const data =
            readData();

            if(
                !data[className]
            ){

                return res.status(404).json({

                    error:"Class Not Found"

                });
            }

            data[className].splice(
                index,
                1
            );

            writeData(data);

            res.json({

                message:
                "Deleted Successfully"

            });

        }catch(error){

            console.log(error);

            res.status(500).json({

                error:"Delete Failed"

            });
        }
    }
);

/* =========================================
   EDIT STUDENT
========================================= */

app.put(
    "/edit-student/:className/:index",

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

            const data =
            readData();

            if(
                !data[className]
            ){

                return res.status(404).json({

                    error:"Class Not Found"

                });
            }

            let imageUrl =
            data[className][index].image;

            /* NEW IMAGE */

            if(req.file){

                const result =
                await cloudinary.uploader.upload(
                    req.file.path
                );

                imageUrl =
                result.secure_url;
            }

            const updatedStudent = {

                name,
                batch,
                rank,
                image:imageUrl

            };

            /* EXTRA FIELDS */

            if(
                className ===
                "YOUTH EXCHANGE PROGRAM"
            ){

                updatedStudent.place =
                place;
            }

            if(
                className ===
                "RARE CAMPS"
            ){

                updatedStudent.camp =
                camp;
            }

            data[className][index] =
            updatedStudent;

            writeData(data);

            res.json({

                message:
                "Updated Successfully"

            });

        }catch(error){

            console.log(error);

            res.status(500).json({

                error:"Update Failed"

            });
        }
    }
);

/* =========================================
   SERVER
========================================= */

const PORT =
process.env.PORT || 5000;

app.listen(PORT,()=>{

    console.log(

        `Server Running On Port ${PORT}`

    );

});
