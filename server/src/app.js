const express = require('express');
const mongoose = require('mongoose');
const validator = require('validator');
const cors = require('cors');
const ContactSchema=require("./models/contactSchema.js")
const UserSchema=require("./models/userSchema.js")
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 5000;
const SECRET_KEY = 'your_secret_key';

app.use(express.json());
app.use(cors());
app.use(cookieParser());


const Contact = mongoose.model('Contact', ContactSchema);
const User = mongoose.model('User', UserSchema);




const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization').split(' ')[1];
  console.log(token)
  if (!token) {
    return res.status(401).json({ message : 'Access Denied' });
  }

  try {
    const verified = jwt.verify(token, SECRET_KEY);
    req.user = verified;
    console.log("Auth SUccess")
    console.log(verified)
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid Token' });
  }
};


app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log("Got request for login");

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (password !== user.password) {
      return res.status(401).json({ message: 'Invalid password.' });
    }

    // Generate token with user ID
    const token = jwt.sign({ id: user._id }, SECRET_KEY);

    res.status(200).json({ message: 'Login successful!', token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});


app.post("/register", async (req, res) => {
  console.log("Got request for register");

  try {
    const { name, email, password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    console.log("Request body:", req.body);

    const newUser = new User(req.body);

    console.log("New user created:", newUser);

    const savedUser = await newUser.save();

    console.log("User saved successfully:", savedUser);

    const { password: _, ...userData } = savedUser.toObject();

    res.status(201).json({ message: "User registered successfully!", data: userData });
  } catch (error) {
    console.error("Error during user registration:", error);

    if (error.code === 11000) {
      return res.status(400).json({ error: "Email already exists" });
    }

    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

app.post('/contacts', authenticateToken, async (req, res) => {
  console.log("Received request to create contact");
  try {
    const { user } = req;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { phoneNumber } = req.body;

    // Check if a contact with the same phone number already exists for this user
    const existingContact = await Contact.findOne({ phoneNumber, userId: user.id });
    if (existingContact) {
      return res.status(400).json({ 
        message: 'A contact with this phone number already exists for the same user.',
        existingContact 
      });
    }

    // Create the new contact
    const newContact = new Contact({
      ...req.body,
      userId: user.id,
    });

    await newContact.save();
    res.status(201).json({ 
      message: 'Contact created successfully', 
      contact: newContact 
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});



// Read Contacts
app.get('/contacts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("Got request for get contacts"+userId)
    console.log("userId"+userId)
    // Find contacts related to the authenticated user
    const contacts = await Contact.find({ userId: userId });

    if (!contacts.length) {
      return res.status(404).json({ message: 'No contacts found for this user.' });
    }
    console.log(contacts)
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Contact
app.put('/contacts/:id', async (req, res) => {
    try {
      console.log("Got request for update")
      console.log(req.params.id)
      console.log(req.body);
      const updatedContact = await Contact.findByIdAndUpdate(
        req.params.id,
        req.body,
      );
      if (!updatedContact) {
        return res.status(404).send({ message: 'Contact not found' });
      }
      res.status(200).send(updatedContact);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
});
  

// Delete Contact 
app.delete('/contacts/:id', async (req, res) => {
  try {
    const deletedContact = await Contact.findByIdAndDelete(req.params.id);
    if (!deletedContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.status(200).json({ message: 'Contact deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

mongoose.connect("mongodb+srv://nagasaichalla1234:nagasaichalla1234@cms.sqbq9.mongodb.net/myDatabase?retryWrites=true&w=majority&appName=cms")
.then(()=>{
  console.log("MongoDB connected successfully")
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
})


