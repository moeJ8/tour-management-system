const Hotel = require('../models/Hotel');

exports.getAllHotels = async (req, res) => {
    try {
        // Sort by updatedAt in descending order (newest first)
        const hotels = await Hotel.find().sort({ updatedAt: -1 });
        res.json(hotels);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.addHotel = async (req, res) => {
    try {
        const hotelData = {
            ...req.body,
            stars: Number(req.body.stars),
            roomTypes: req.body.roomTypes || [],
            transportationPrice: Number(req.body.transportationPrice),
            breakfastIncluded: Boolean(req.body.breakfastIncluded),
            breakfastPrice: req.body.breakfastPrice ? Number(req.body.breakfastPrice) : 0,
            airport: req.body.airport || null
        };
        
        const hotel = new Hotel(hotelData);
        const newHotel = await hotel.save();
        res.status(201).json(newHotel);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getHotelsByCity = async (req, res) => {
    try {
        const { city } = req.params;
        const hotels = await Hotel.find({ city });
        res.json(hotels);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getHotelById = async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id);
        if (!hotel) {
            return res.status(404).json({ message: 'Hotel not found' });
        }
        res.json(hotel);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update hotel
exports.updateHotel = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Convert string fields to appropriate types
        const hotelData = {
            ...req.body,
            stars: Number(req.body.stars),
            roomTypes: req.body.roomTypes || [],
            transportationPrice: Number(req.body.transportationPrice),
            breakfastIncluded: Boolean(req.body.breakfastIncluded),
            breakfastPrice: req.body.breakfastPrice ? Number(req.body.breakfastPrice) : 0,
            airport: req.body.airport || null
        };
        
        const updatedHotel = await Hotel.findByIdAndUpdate(id, hotelData, { new: true });
        if (!updatedHotel) {
            return res.status(404).json({ message: 'Hotel not found' });
        }
        res.json(updatedHotel);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Delete hotel
exports.deleteHotel = async (req, res) => {
    try {
        // Check if user is authorized to delete hotels
        if (!req.user.isAdmin) {
            return res.status(403).json({ 
                message: 'Access denied. Only administrators can delete hotels.' 
            });
        }
        if (req.user.isAccountant && !req.user.isAdmin) {
            return res.status(403).json({ 
                message: 'Accountants are not authorized to delete hotels.' 
            });
        }

        const hotel = await Hotel.findByIdAndDelete(req.params.id);
        if (!hotel) {
            return res.status(404).json({ message: 'Hotel not found' });
        }
        res.json({ message: 'Hotel deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}; 