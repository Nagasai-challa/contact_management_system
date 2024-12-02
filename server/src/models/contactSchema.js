const mongoose=require("mongoose");
const validator=require("validator")

const ContactSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    firstName: {
      type: String,
      required: [true, 'First Name is required'],
      validate: [validator.isAlpha, 'First Name should contain only alphabetic characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last Name is required'],
      validate: [validator.isAlpha, 'Last Name should contain only alphabetic characters'],
    },
    email: {
      type: String,
      validate:{
        validator:function(value){
            return value.endsWith("@gmail.com")
        },
        message:"Invalid Email"
      }
    },
    phoneNumber: {
      type: String,
      unique: true,
      validate: {
        validator: function(value) {
          return /^\d{10}$/.test(value);
        },
        message: props => `${props.value} is not a valid 10-digit phone number!`,
      },
    },
    address: { type: String, required: false },
});

module.exports=ContactSchema;