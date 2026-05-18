const crypto = require("crypto");

global.crypto = crypto;

const express = require("express");

const cors = require("cors");

const mongoose = require("mongoose");

const multer = require("multer");

const {
    CloudinaryStorage
} = require("multer-storage-cloudinary");

const cloudinary = require("cloudinary").v2;

require("dotenv").config();

const Student =
require("./models/Student");

const app = express();

app.use(cors());

app.use(express.json());

/* =========================================
   MONGODB CONNECTION
========================================= */

mongoose.connect(

    process.env.MONGO_URI

).then(()=>{

    console.log(
        "MongoDB Connected"
    );

}).catch((error)=>{

    console.log(error);
});

/* =========================================
   CLOUDINARY
========================================= */

cloudinary.config({

    cloud_name:
    process.env.CLOUD_NAME,

    api_key:
    process.env.API_KEY,

    api_secret:
    process.env.API_SECRET
});

/* =========================================
   CLOUDINARY STORAGE
========================================= */

const storage =
new CloudinaryStorage({

    cloudinary: cloudinary,

    params: {

        folder:"camp-students",

        allowed_formats:[
            "jpg",
            "jpeg",
            "png",
            "webp"
        ]
    }
});

const upload =
multer({

    storage,

    limits:{

        fileSize:
        20 * 1024 * 1024
    }
});

/* =========================================
   GET STUDENTS
========================================= */

app.get("/students",async(req,res)=>{

    try{

        const students =
        await Student.find();

        const grouped = {

            "REPUBLIC DAY CAMP":[],
            "TSC, VSC, NSC":[],
            "IMA ATTACHMENT CAMP":[],
            "YOUTH EXCHANGE PROGRAM":[],
            "RARE CAMPS":[]

        };

        students.forEach(student=>{

            if(grouped[student.className]){

                grouped[
                    student.className
                ].push(student);
            }
        });

        res.json(grouped);

    }catch(error){

        console.log(error);

        res.status(500).json({

            error:
            "Failed To Load Students"
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
                camp,
                subCamp

            } = req.body;

            if(!req.file){

                return res.status(400).json({

                    error:
                    "Image Required"
                });
            }

            const newStudent =
            new Student({

                className,
                name,
                batch,
                rank,

                image:
                req.file.path,

                public_id:
                req.file.filename,

                place:
                place || "",

                camp:
                camp || "",

                subCamp:
                subCamp || ""
            });

            await newStudent.save();

            res.json({

                message:
                "Student Added Successfully"
            });

        }catch(error){

            console.log(error);

            if(
                error.code ===
                "LIMIT_FILE_SIZE"
            ){

                return res.status(400).json({

                    error:
                    "Image too large. Max 20MB allowed."
                });
            }

            res.status(500).json({

                error:
                "Add Student Failed"
            });
        }
    }
);

/* =========================================
   DELETE STUDENT
========================================= */

app.delete(

    "/delete-student/:id",

    async(req,res)=>{

        try{

            const student =
            await Student.findById(
                req.params.id
            );

            if(!student){

                return res.status(404).json({

                    error:
                    "Student Not Found"
                });
            }

            /* DELETE CLOUDINARY IMAGE */

            if(student.public_id){

                await cloudinary.uploader.destroy(
                    student.public_id,
                    {
                        resource_type:"image"
                    }
                );
            }

            /* DELETE DATABASE */

            await Student.findByIdAndDelete(

                req.params.id
            );

            res.json({

                message:
                "Deleted Successfully"
            });

        }catch(error){

            console.log(error);

            res.status(500).json({

                error:
                "Delete Failed"
            });
        }
    }
);

/* =========================================
   UPDATE STUDENT
========================================= */

app.put(

    "/edit-student/:id",

    upload.single("image"),

    async(req,res)=>{

        try{

            const student =
            await Student.findById(
                req.params.id
            );

            if(!student){

                return res.status(404).json({

                    error:
                    "Student Not Found"
                });
            }

            let image =
            student.image;

            let public_id =
            student.public_id;

            /* NEW IMAGE */

            if(req.file){

                /* DELETE OLD IMAGE */

                if(student.public_id){

                    await cloudinary.uploader.destroy(
                        student.public_id,
                        {
                            resource_type:"image"
                        }
                    );
                }

                image =
                req.file.path;

                public_id =
                req.file.filename;
            }

            student.name =
            req.body.name;

            student.batch =
            req.body.batch;

            student.rank =
            req.body.rank;

            student.place =
            req.body.place || "";

            student.camp =
            req.body.camp || "";

            student.subCamp =
            req.body.subCamp || "";

            student.image =
            image;

            student.public_id =
            public_id;

            await student.save();

            res.json({

                message:
                "Updated Successfully"
            });

        }catch(error){

            console.log(error);

            res.status(500).json({

                error:
                "Update Failed"
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
