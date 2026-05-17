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

/* =========================================
   MULTER
========================================= */

const upload = multer({

    dest: "uploads/",

    limits: {
        fileSize: 10 * 1024 * 1024
    }

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
   READ JSON FILE
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
            let publicId = "";

            if(req.file){

                const result =
                await cloudinary.uploader.upload(
                    req.file.path
                );

                imageUrl =
                result.secure_url;

                publicId =
                result.public_id;
            }

            const newStudent = {

                name,
                batch,
                rank,
                image:imageUrl,
                public_id: publicId

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

            /* CREATE CLASS */

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

            if(error.code === "LIMIT_FILE_SIZE"){

                return res.status(400).json({

                    error:
                    "Image too large. Max 10MB allowed."

                });
            }

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

    async(req,res)=>{

        try{

            const {

                className,
                index

            } = req.params;

            const data =
            readData();

            if(!data[className]){

                return res.status(404).json({

                    error:"Class Not Found"

                });
            }

            const student =
            data[className][index];

            /* DELETE CLOUDINARY IMAGE */

            if(student.public_id){

                await cloudinary.uploader.destroy(

                    student.public_id

                );
            }

            /* DELETE FROM JSON */

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

            if(!data[className]){

                return res.status(404).json({

                    error:"Class Not Found"

                });
            }

            const oldStudent =
            data[className][index];

            let imageUrl =
            oldStudent.image;

            let publicId =
            oldStudent.public_id;

            /* IF NEW IMAGE */

            if(req.file){

                /* DELETE OLD IMAGE */

                if(oldStudent.public_id){

                    await cloudinary.uploader.destroy(

                        oldStudent.public_id

                    );
                }

                /* UPLOAD NEW IMAGE */

                const result =
                await cloudinary.uploader.upload(

                    req.file.path

                );

                imageUrl =
                result.secure_url;

                publicId =
                result.public_id;
            }

            const updatedStudent = {

                name,
                batch,
                rank,
                image:imageUrl,
                public_id: publicId

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

            if(error.code === "LIMIT_FILE_SIZE"){

                return res.status(400).json({

                    error:
                    "Image too large. Max 10MB allowed."

                });
            }

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
