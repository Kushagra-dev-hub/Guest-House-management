const mongoose = require('mongoose');
const createHttpError = require('http-errors');
const bcrypt = require('bcryptjs');

const { roles } = require('../utils/constants');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
    },
    mobileNo: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: [roles.admin, roles.guest],
        default: roles.guest,
    },
});

// Hash the password before saving to the database
userSchema.pre('save', async function (next) {
    try {
        if (this.isNew) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(this.password, salt);
            this.password = hashedPassword;
            
            // Check if email belongs to any admin listed in env
            const adminEmails = [
                process.env.ADMIN1_EMAIL,
                process.env.ADMIN2_EMAIL,
                process.env.ADMIN3_EMAIL,
                process.env.ADMIN4_EMAIL
            ].filter(Boolean).map(e => e.toLowerCase());

            if (adminEmails.includes(this.email)) {
                this.role = roles.admin;
            }
        }
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare entered password with stored hash
userSchema.methods.isValidPassword = async function (password) {
    try {
        const isMatch = await bcrypt.compare(password, this.password);  // Compare the entered password with the stored hash
        return isMatch;  // Return the result of comparison
    } catch (error) {
        throw createHttpError.InternalServerError(error.message);
    }
};

const User = mongoose.model('User', userSchema);

module.exports = User;
