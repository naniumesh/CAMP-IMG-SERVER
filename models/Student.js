const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({

    className:String,

    name:String,

    batch:String,

    rank:String,

    image:String,

    public_id:String,

    place:String,

    camp:String

});

module.exports =
mongoose.model(
    "Student",
    studentSchema
);