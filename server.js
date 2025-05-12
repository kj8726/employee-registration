const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser'); // To parse request bodies
const path = require('path'); // To serve static files like HTML

// Initialize Express app
const app = express();
const PORT =  3000; // Set port for the server

// --- Middleware Setup ---
// Parse JSON bodies (as sent by API clients)
app.use(bodyParser.json());
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, client-side JS) from the 'public' directory
// For this example, we'll serve the HTML directly, but a 'public' folder is common.
// app.use(express.static(path.join(__dirname, 'public'))); // If you create a 'public' folder

// --- MongoDB Connection ---
const MONGO_URI = 'mongodb://localhost:27017/employeeDB'; // Replace with your MongoDB connection string if different

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Successfully connected to MongoDB!'))
.catch(err => {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1); // Exit if DB connection fails
});

// --- Mongoose Schema and Model for Employee ---
const employeeSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required.'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required.'],
        unique: true, // Ensure email is unique
        trim: true,
        lowercase: true,
        match: [/\S+@\S+\.\S+/, 'Please enter a valid email address.'],
    },
    employeeId: {
        type: String,
        required: [true, 'Employee ID is required.'],
        unique: true, // Ensure employee ID is unique
        trim: true,
    },
    department: {
        type: String,
        required: [true, 'Department is required.'],
        trim: true,
    },
    position: {
        type: String,
        required: [true, 'Position is required.'],
        trim: true,
    },
    dateOfJoining: {
        type: Date,
        required: [true, 'Date of joining is required.'],
    },
    registrationDate: {
        type: Date,
        default: Date.now, // Automatically set to current date and time
    },
});

const Employee = mongoose.model('Employee', employeeSchema);

// --- API Routes ---

// Route to serve the HTML registration form
// This assumes your HTML file is named 'index.html' and is in the same directory as server.js
// For a more robust setup, you'd use `express.static` as shown commented out above.
app.get('/', (req, res) => {
    // IMPORTANT: For this to work, the HTML file provided earlier needs to be saved
    // as 'index.html' in the same directory as this 'server.js' file.
    // Or, you can adjust the path accordingly.
    res.sendFile(path.join(__dirname, 'index.html')); // Make sure your HTML file is named index.html
});


// POST route to handle employee registration
app.post('/register', async (req, res) => {
    try {
        const { fullName, email, employeeId, department, position, dateOfJoining } = req.body;

        // Basic server-side validation (Mongoose schema handles more)
        if (!fullName || !email || !employeeId || !department || !position || !dateOfJoining) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Check if employee with the same email or employeeId already exists
        const existingEmployeeByEmail = await Employee.findOne({ email });
        if (existingEmployeeByEmail) {
            return res.status(400).json({ message: 'An employee with this email already exists.', errors: { email: { msg: 'Email already in use.'}} });
        }
        const existingEmployeeById = await Employee.findOne({ employeeId });
        if (existingEmployeeById) {
            return res.status(400).json({ message: 'An employee with this Employee ID already exists.', errors: { employeeId: { msg: 'Employee ID already in use.'}} });
        }

        // Create a new employee instance
        const newEmployee = new Employee({
            fullName,
            email,
            employeeId,
            department,
            position,
            dateOfJoining,
        });

        // Save the employee to the database
        const savedEmployee = await newEmployee.save();

        res.status(201).json({
            message: 'Employee registered successfully!',
            employee: {
                id: savedEmployee._id,
                fullName: savedEmployee.fullName,
                email: savedEmployee.email,
                employeeId: savedEmployee.employeeId,
            }
        });

    } catch (error) {
        console.error('Error during registration:', error);
        if (error.name === 'ValidationError') {
            let errors = {};
            Object.keys(error.errors).forEach((key) => {
                errors[key] = { msg: error.errors[key].message };
            });
            return res.status(400).json({ message: 'Validation failed. Please check your input.', errors });
        }
        res.status(500).json({ message: 'Server error during registration. Please try again later.' });
    }
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
