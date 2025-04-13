const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        trim: true,
        maxlength: [100, 'A tour name cannot exceed 100 characters']
    },
    city: {
        type: String,
        required: [true, 'A tour must have a city'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'A tour must have a description'],
        trim: true
    },
    detailedDescription: { type: String },
    price: {
        type: Number,
        required: [true, 'A tour must have a price']
    },
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration'],
        default: 1 // Duration in hours
    },
    maxGroupSize: {
        type: Number,
        
    },
    highlights: [{ 
        type: String 
    }],
    imageCover: {
        type: String,
        required: [true, 'A tour must have a cover image']
    },
    images: [String],
    startDates: [Date],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
