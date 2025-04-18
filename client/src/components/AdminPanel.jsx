import React from 'react'
import axios from 'axios'
import { useState, useEffect } from 'react'
import { Button, TextInput, Checkbox, Textarea, Card, Label, Alert, Select, Spinner, Badge, Table, ToggleSwitch, Accordion } from 'flowbite-react'
import { HiPlus, HiX, HiTrash, HiCalendar } from 'react-icons/hi'

export default function AdminPanel() {
    const getInitialTab = () => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab');
            if (['hotels', 'tours', 'airports', 'users'].includes(tabParam)) {
                return tabParam;
            }
        }
        return 'hotels';
    };

    const [activeTab, setActiveTab] = useState(getInitialTab);

    const handleTabChange = (tabName) => {
        setActiveTab(tabName);
        
        // Update URL without page reload
        const url = new URL(window.location);
        url.searchParams.set('tab', tabName);
        window.history.pushState({}, '', url);
        
        // Fetch users data only when switching to users tab and data not loaded yet
        if (tabName === 'users' && users.length === 0 && dataLoaded) {
            fetchUsers();
        }
    };

    const [hotelData, setHotelData] = useState({
        name: '',
        city: '',
        stars: '',
        roomTypes: [],
        breakfastIncluded: false,
        breakfastPrice: '',
        transportation: {
            vitoReceptionPrice: '',
            vitoFarewellPrice: '',
            sprinterReceptionPrice: '',
            sprinterFarewellPrice: ''
        },
        airport: '',
        airportTransportation: [],
        description: ''
    });
    const [tourData, setTourData] = useState({
        name: '',
        city: '',
        description: '',
        detailedDescription: '',
        tourType: 'Group',
        price: '',
        vipCarType: 'Vito',
        carCapacity: {
            min: 2,
            max: 8
        },
        duration: 1,
        highlights: []
    });
    const [airportData, setAirportData] = useState({
        name: '',
        arabicName: ''
    });
    const [airports, setAirports] = useState([]);
    const [users, setUsers] = useState([]);
    const [highlightInput, setHighlightInput] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [customRoomTypes, setCustomRoomTypes] = useState([]);
    // Add a new state to track if initial data has been loaded
    const [dataLoaded, setDataLoaded] = useState(false);

    // Standard room types for hotels
    const standardRoomTypes = [
        "SINGLE ROOM",
        "DOUBLE ROOM",
        "TRIPLE ROOM",
        "FAMILY SUITE"
    ];

    const months = [
        "january", "february", "march", "april", "may", "june",
        "july", "august", "september", "october", "november", "december"
    ];

    const monthLabels = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const [selectedRoomTypes, setSelectedRoomTypes] = useState({
        "SINGLE ROOM": false,
        "DOUBLE ROOM": false,
        "TRIPLE ROOM": false,
        "FAMILY SUITE": false,
        "CUSTOM": false
    });
    
    const [roomTypePrices, setRoomTypePrices] = useState({
        "SINGLE ROOM": "",
        "DOUBLE ROOM": "",
        "TRIPLE ROOM": "",
        "FAMILY SUITE": "",
        "CUSTOM": ""
    });
    
    const [roomTypeChildrenPrices, setRoomTypeChildrenPrices] = useState({
        "SINGLE ROOM": "",
        "DOUBLE ROOM": "",
        "TRIPLE ROOM": "",
        "FAMILY SUITE": "",
        "CUSTOM": ""
    });

    // Initialize monthly prices for each room type
    const [monthlyPrices, setMonthlyPrices] = useState({
        "SINGLE ROOM": {},
        "DOUBLE ROOM": {},
        "TRIPLE ROOM": {},
        "FAMILY SUITE": {},
        "CUSTOM": {}
    });
    
    useEffect(() => {
        // Only fetch data on first load or when explicitly needed
        if (!dataLoaded) {
            const fetchInitialData = async () => {
                setLoading(true);
                try {
                    const airportsResponse = await axios.get('/api/airports');
                    setAirports(airportsResponse.data);
                    
                    // Only fetch users if starting on users tab
                    if (activeTab === 'users') {
                        await fetchUsers();
                    }
                    
                    setError('');
                    setDataLoaded(true);
                } catch (err) {
                    console.error('Failed to fetch data:', err);
                    setError('Failed to fetch data. Please try again.');
                } finally {
                    setLoading(false);
                }
            };
            
            fetchInitialData();
        }
    }, []);
    
    // Only fetch users data when switching to users tab and haven't loaded it yet
    useEffect(() => {
        if (activeTab === 'users' && dataLoaded && users.length === 0) {
            fetchUsers();
        }
    }, [activeTab]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('You must be logged in to view users');
                setLoading(false);
                return;
            }
            
            const response = await axios.get('/api/auth/users', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setUsers(response.data);
            setError('');
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setError(err.response?.data?.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    // Get airport options for hotel form
    const getAirportOptions = () => {
        return airports.map(airport => ({
            value: airport.name,
            label: `${airport.name} (${airport.arabicName})`
        }));
    };

    const handleHotelChange = (e) => {
        const { name, value, type, checked } = e.target;
        setHotelData({
            ...hotelData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleRoomTypeCheckboxChange = (roomType) => {
        setSelectedRoomTypes({
            ...selectedRoomTypes,
            [roomType]: !selectedRoomTypes[roomType]
        });
        
        // If unchecking, reset price and monthly prices
        if (selectedRoomTypes[roomType]) {
            setRoomTypePrices({
                ...roomTypePrices,
                [roomType]: ""
            });
            
            setRoomTypeChildrenPrices({
                ...roomTypeChildrenPrices,
                [roomType]: ""
            });

            // Reset monthly prices
            const resetMonthlyPrices = {};
            months.forEach(month => {
                resetMonthlyPrices[month] = {
                    adult: 0,
                    child: 0
                };
            });
            
            setMonthlyPrices({
                ...monthlyPrices,
                [roomType]: resetMonthlyPrices
            });
        } else {
            // Initialize monthly prices for newly checked room types
            const initialMonthlyPrices = {};
            months.forEach(month => {
                initialMonthlyPrices[month] = {
                    adult: 0,
                    child: 0
                };
            });
            
            setMonthlyPrices({
                ...monthlyPrices,
                [roomType]: initialMonthlyPrices
            });
        }
    };

    const handleMonthlyPriceChange = (roomType, month, priceType, value) => {
        setMonthlyPrices({
            ...monthlyPrices,
            [roomType]: {
                ...monthlyPrices[roomType],
                [month]: {
                    ...monthlyPrices[roomType][month],
                    [priceType]: value === '' ? 0 : parseFloat(value)
                }
            }
        });
    };

    const handleRoomPriceChange = (roomType, price) => {
        setRoomTypePrices({
            ...roomTypePrices,
            [roomType]: price
        });
    };
    
    const handleChildrenRoomPriceChange = (roomType, price) => {
        setRoomTypeChildrenPrices({
            ...roomTypeChildrenPrices,
            [roomType]: price
        });
    };

    const handleAddCustomRoomType = () => {
        const newCustomRoomTypeId = `CUSTOM_${Date.now()}`;
        
        // Add the new custom room type to the list
        setCustomRoomTypes([
            ...customRoomTypes,
            {
                id: newCustomRoomTypeId,
                name: ''
            }
        ]);
        
        // Initialize the price fields for this room type
        setRoomTypePrices({
            ...roomTypePrices,
            [newCustomRoomTypeId]: ''
        });
        
        setRoomTypeChildrenPrices({
            ...roomTypeChildrenPrices,
            [newCustomRoomTypeId]: ''
        });

        // Initialize monthly prices for the new custom room type
        const initialMonthlyPrices = {};
        months.forEach(month => {
            initialMonthlyPrices[month] = {
                adult: 0,
                child: 0
            };
        });
        
        setMonthlyPrices({
            ...monthlyPrices,
            [newCustomRoomTypeId]: initialMonthlyPrices
        });
    };

    const handleRemoveCustomRoomType = (index) => {
        const roomTypeId = customRoomTypes[index].id;
        
        // Create a copy without the removed room type
        const updatedCustomRoomTypes = [...customRoomTypes];
        updatedCustomRoomTypes.splice(index, 1);
        setCustomRoomTypes(updatedCustomRoomTypes);
        
        // Remove the prices for this room type
        const updatedRoomTypePrices = { ...roomTypePrices };
        delete updatedRoomTypePrices[roomTypeId];
        setRoomTypePrices(updatedRoomTypePrices);
        
        const updatedRoomTypeChildrenPrices = { ...roomTypeChildrenPrices };
        delete updatedRoomTypeChildrenPrices[roomTypeId];
        setRoomTypeChildrenPrices(updatedRoomTypeChildrenPrices);

        // Remove monthly prices for this room type
        const updatedMonthlyPrices = { ...monthlyPrices };
        delete updatedMonthlyPrices[roomTypeId];
        setMonthlyPrices(updatedMonthlyPrices);
    };

    const handleCustomRoomTypeNameChange = (index, value) => {
        const updatedRoomTypes = [...customRoomTypes];
        updatedRoomTypes[index].name = value;
        setCustomRoomTypes(updatedRoomTypes);
    };

    const handleCustomRoomTypePriceChange = (index, value) => {
        const roomTypeId = customRoomTypes[index].id;
        
        setRoomTypePrices({
            ...roomTypePrices,
            [roomTypeId]: value
        });
    };
    
    const handleCustomRoomTypeChildrenPriceChange = (index, value) => {
        const roomTypeId = customRoomTypes[index].id;
        
        setRoomTypeChildrenPrices({
            ...roomTypeChildrenPrices,
            [roomTypeId]: value
        });
    };

    const addRoomTypesToHotelData = () => {
        const roomTypes = [];
        
        // Add standard room types
        standardRoomTypes.forEach(roomType => {
            if (selectedRoomTypes[roomType] && roomTypePrices[roomType]) {
                const roomTypeData = {
                    type: roomType,
                    pricePerNight: Number(roomTypePrices[roomType]),
                    childrenPricePerNight: Number(roomTypeChildrenPrices[roomType] || 0)
                };

                // Add monthly prices if they exist
                if (monthlyPrices[roomType]) {
                    roomTypeData.monthlyPrices = monthlyPrices[roomType];
                }
                
                roomTypes.push(roomTypeData);
            }
        });
        
        // Add custom room types
        customRoomTypes.forEach(roomType => {
            if (roomType.name && roomTypePrices[roomType.id]) {
                const roomTypeData = {
                    type: roomType.name,
                    pricePerNight: Number(roomTypePrices[roomType.id]),
                    childrenPricePerNight: Number(roomTypeChildrenPrices[roomType.id] || 0)
                };

                // Add monthly prices if they exist
                if (monthlyPrices[roomType.id]) {
                    roomTypeData.monthlyPrices = monthlyPrices[roomType.id];
                }
                
                roomTypes.push(roomTypeData);
            }
        });
        
        return roomTypes;
    };

    const handleHotelSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Get all the room types with their prices
            const roomTypes = addRoomTypesToHotelData();
            
            if (roomTypes.length === 0) {
                setError('Please add at least one room type with price');
                setLoading(false);
                return;
            }
            
            // Check if at least one airport transportation is added when needed
            if (hotelData.airportTransportation.length === 0) {
                // Add default airport from old field for backwards compatibility
                if (hotelData.airport && Object.values(hotelData.transportation).some(price => price > 0)) {
                    hotelData.airportTransportation.push({
                        airport: hotelData.airport,
                        transportation: hotelData.transportation
                    });
                }
            } else {
                // Set the first airport as the default for backwards compatibility
                hotelData.airport = hotelData.airportTransportation[0].airport;
                hotelData.transportation = hotelData.airportTransportation[0].transportation;
            }
            
            // Update hotelData with the complete room types array
            const hotelToSubmit = {
                ...hotelData,
                roomTypes: roomTypes
            };
            
            await axios.post('/api/hotels', hotelToSubmit);
            
            // Reset the form after successful submission
            setHotelData({
                name: '',
                city: '',
                stars: '',
                roomTypes: [],
                breakfastIncluded: false,
                breakfastPrice: '',
                transportation: {
                    vitoReceptionPrice: '',
                    vitoFarewellPrice: '',
                    sprinterReceptionPrice: '',
                    sprinterFarewellPrice: ''
                },
                airport: '',
                airportTransportation: [],
                description: ''
            });
            
            // Reset room types
            setSelectedRoomTypes({
                "SINGLE ROOM": false,
                "DOUBLE ROOM": false,
                "TRIPLE ROOM": false,
                "FAMILY SUITE": false,
                "CUSTOM": false
            });
            
            setRoomTypePrices({
                "SINGLE ROOM": "",
                "DOUBLE ROOM": "",
                "TRIPLE ROOM": "",
                "FAMILY SUITE": "",
                "CUSTOM": ""
            });
            
            setRoomTypeChildrenPrices({
                "SINGLE ROOM": "",
                "DOUBLE ROOM": "",
                "TRIPLE ROOM": "",
                "FAMILY SUITE": "",
                "CUSTOM": ""
            });
            
            // Reset monthly prices
            const resetMonthlyPrices = {};
            standardRoomTypes.forEach(roomType => {
                const monthlyPriceData = {};
                months.forEach(month => {
                    monthlyPriceData[month] = { adult: 0, child: 0 };
                });
                resetMonthlyPrices[roomType] = monthlyPriceData;
            });
            resetMonthlyPrices["CUSTOM"] = {};
            setMonthlyPrices(resetMonthlyPrices);
            
            // Clear custom room types
            setCustomRoomTypes([]);
            
            showSuccessMessage('Hotel added successfully!');
        } catch (error) {
            console.error('Error adding hotel:', error);
            setError(error.response?.data?.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleTourChange = (e) => {
        const { name, value } = e.target;
        setTourData({
            ...tourData,
            [name]: value,
        });
    };

    const handleVipCarTypeChange = (e) => {
        const carType = e.target.value;
        let minCapacity = 2;
        let maxCapacity = 8;
        
        if (carType === 'Sprinter') {
            minCapacity = 9;
            maxCapacity = 16;
        }
        
        setTourData({
            ...tourData,
            vipCarType: carType,
            carCapacity: {
                min: minCapacity,
                max: maxCapacity
            }
        });
    };

    const handleAirportChange = (e) => {
        const { name, value } = e.target;
        setAirportData({
            ...airportData,
            [name]: value,
        });
    };

    const handleAddHighlight = () => {
        if (highlightInput.trim()) {
            setTourData({
                ...tourData,
                highlights: [...tourData.highlights, highlightInput.trim()]
            });
            setHighlightInput('');
        }
    };

    const handleRemoveHighlight = (index) => {
        const updatedHighlights = [...tourData.highlights];
        updatedHighlights.splice(index, 1);
        setTourData({
            ...tourData,
            highlights: updatedHighlights
        });
    };

    const showSuccessMessage = (message) => {
        setSuccess(message);
        setTimeout(() => setSuccess(''), 3000);
    };

    const handleTourSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const tourDataWithPolicies = {
                ...tourData,
                childrenPolicies: {
                    under3: 'Free',
                    above3: 'Adult price'
                }
            };
            
            await axios.post('/api/tours', tourDataWithPolicies);
            setTourData({
                name: '',
                city: '',
                description: '',
                detailedDescription: '',
                tourType: 'Group',
                price: '',
                vipCarType: 'Vito',
                carCapacity: {
                    min: 2,
                    max: 8
                },
                duration: 1,
                highlights: []
            });
            showSuccessMessage('Tour added successfully!');
        } catch (err) {
            setError('Failed to add tour');
            console.log(err);
        }
    };

    const handleAirportSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await axios.post('/api/airports', airportData);
            setAirports([...airports, response.data]);
            setAirportData({
                name: '',
                arabicName: ''
            });
            showSuccessMessage('Airport added successfully!');
        } catch (err) {
            setError('Failed to add airport');
            console.log(err);
        }
    };

    const handleDeleteAirport = async (id) => {
        try {
            await axios.delete(`/api/airports/${id}`);
            setAirports(airports.filter(airport => airport._id !== id));
            showSuccessMessage('Airport deleted successfully!');
        } catch (err) {
            setError('Failed to delete airport');
            console.log(err);
        }
    };

    const handleToggleAdminStatus = async (userId, currentStatus) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('You must be logged in to update user roles');
                return;
            }
            
            await axios.patch('/api/auth/users/role', 
                { userId, isAdmin: !currentStatus },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            // Update the local state
            setUsers(users.map(user => 
                user._id === userId 
                    ? { ...user, isAdmin: !currentStatus } 
                    : user
            ));
            
            showSuccessMessage('User role updated successfully!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update user role');
            console.log(err);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('You must be logged in to delete users');
                    return;
                }
                
                await axios.delete(`/api/auth/users/${userId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                
                // Update the local state by removing the deleted user
                setUsers(users.filter(user => user._id !== userId));
                
                showSuccessMessage('User deleted successfully!');
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to delete user');
                console.log(err);
            }
        }
    };

    // Inside the component, handle keyboard navigation with tab changing
    const handleTabKeyDown = (e, tabName) => {
        // Navigate with arrow keys
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
            const tabs = ['hotels', 'tours', 'airports', 'users'];
            const currentIndex = tabs.indexOf(activeTab);
            
            let newIndex;
            if (e.key === 'ArrowRight') {
                newIndex = (currentIndex + 1) % tabs.length;
            } else {
                newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
            }
            
            handleTabChange(tabs[newIndex]);
            
            // Focus the newly active tab button
            setTimeout(() => {
                document.getElementById(`tab-${tabs[newIndex]}`).focus();
            }, 10);
        }
        // Activate tab with Enter or Space
        else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleTabChange(tabName);
        }
    };

    const handleAddAirportTransportation = () => {
        setHotelData({
            ...hotelData,
            airportTransportation: [
                ...hotelData.airportTransportation,
                {
                    airport: '',
                    transportation: {
                        vitoReceptionPrice: '',
                        vitoFarewellPrice: '',
                        sprinterReceptionPrice: '',
                        sprinterFarewellPrice: ''
                    }
                }
            ]
        });
    };
    
    const handleRemoveAirportTransportation = (index) => {
        const updatedAirportTransportation = [...hotelData.airportTransportation];
        updatedAirportTransportation.splice(index, 1);
        setHotelData({
            ...hotelData,
            airportTransportation: updatedAirportTransportation
        });
    };
    
    const handleAirportTransportationChange = (index, field, value) => {
        const updatedAirportTransportation = [...hotelData.airportTransportation];
        updatedAirportTransportation[index] = {
            ...updatedAirportTransportation[index],
            [field]: value
        };
        setHotelData({
            ...hotelData,
            airportTransportation: updatedAirportTransportation
        });
    };
    
    const handleTransportationPriceChange = (index, field, value) => {
        const updatedAirportTransportation = [...hotelData.airportTransportation];
        updatedAirportTransportation[index] = {
            ...updatedAirportTransportation[index],
            transportation: {
                ...updatedAirportTransportation[index].transportation,
                [field]: value
            }
        };
        setHotelData({
            ...hotelData,
            airportTransportation: updatedAirportTransportation
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-56">
                <div className="relative w-16 h-16">
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-purple-200 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-t-purple-600 rounded-full animate-spin"></div>
                    <span className="sr-only">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-3 flex flex-col items-center">
            {/* Custom Tab Implementation */}
            <div className="flex flex-wrap justify-center border-b mb-4 gap-1" role="tablist" aria-label="Admin Sections">
                <button
                    id="tab-hotels"
                    className={`py-2 px-3 text-sm sm:text-base sm:px-4 ${activeTab === 'hotels' ? 'border-b-2 border-purple-600 font-medium text-purple-600 dark:text-purple-400 dark:border-purple-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100'}`}
                    onClick={() => handleTabChange('hotels')}
                    onKeyDown={(e) => handleTabKeyDown(e, 'hotels')}
                    tabIndex={0}
                    role="tab"
                    aria-selected={activeTab === 'hotels'}
                    aria-controls="hotels-panel"
                >
                    Hotels
                </button>
                <button
                    id="tab-tours"
                    className={`py-2 px-3 text-sm sm:text-base sm:px-4 ${activeTab === 'tours' ? 'border-b-2 border-purple-600 font-medium text-purple-600 dark:text-purple-400 dark:border-purple-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100'}`}
                    onClick={() => handleTabChange('tours')}
                    onKeyDown={(e) => handleTabKeyDown(e, 'tours')}
                    tabIndex={0}
                    role="tab"
                    aria-selected={activeTab === 'tours'}
                    aria-controls="tours-panel"
                >
                    Tours
                </button>
                <button
                    id="tab-airports"
                    className={`py-2 px-3 text-sm sm:text-base sm:px-4 ${activeTab === 'airports' ? 'border-b-2 border-purple-600 font-medium text-purple-600 dark:text-purple-400 dark:border-purple-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100'}`}
                    onClick={() => handleTabChange('airports')}
                    onKeyDown={(e) => handleTabKeyDown(e, 'airports')}
                    tabIndex={0}
                    role="tab"
                    aria-selected={activeTab === 'airports'}
                    aria-controls="airports-panel"
                >
                    Airports
                </button>
                <button
                    id="tab-users"
                    className={`py-2 px-3 text-sm sm:text-base sm:px-4 ${activeTab === 'users' ? 'border-b-2 border-purple-600 font-medium text-purple-600 dark:text-purple-400 dark:border-purple-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100'}`}
                    onClick={() => handleTabChange('users')}
                    onKeyDown={(e) => handleTabKeyDown(e, 'users')}
                    tabIndex={0}
                    role="tab"
                    aria-selected={activeTab === 'users'}
                    aria-controls="users-panel"
                >
                    Users
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'hotels' && (
                <Card className="w-full" id="hotels-panel" role="tabpanel" aria-labelledby="tab-hotels">
                    <h2 className="text-2xl font-bold mb-4 dark:text-white text-center">Add New Hotel</h2>
                    
                    <form onSubmit={handleHotelSubmit} className="space-y-4">
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="hotelName" value="Hotel Name" />
                            </div>
                            <TextInput
                                id="hotelName"
                                name="name"
                                value={hotelData.name}
                                onChange={handleHotelChange}
                                required
                            />
                        </div>
                        
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="hotelCity" value="City" />
                            </div>
                            <Select
                                id="hotelCity"
                                name="city"
                                value={hotelData.city}
                                onChange={handleHotelChange}
                                required
                            >
                                <option value="">Select City</option>
                                <option value="Antalya">Antalya</option>
                                <option value="Bodrum">Bodrum</option>
                                <option value="Bursa">Bursa</option>
                                <option value="Cappadocia">Cappadocia</option>
                                <option value="Fethiye">Fethiye</option>
                                <option value="Istanbul">Istanbul</option>
                                <option value="Izmir">Izmir</option>
                                <option value="Konya">Konya</option>
                                <option value="Marmaris">Marmaris</option>
                                <option value="Pamukkale">Pamukkale</option>
                                <option value="Trabzon">Trabzon</option>
                                <option value="Uzungol">Uzungol</option>
                            </Select>
                        </div>
                        
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="hotelStars" value="Stars" />
                            </div>
                            <Select
                                id="hotelStars"
                                name="stars"
                                value={hotelData.stars}
                                onChange={handleHotelChange}
                                required
                            >
                                <option value="">Select Rating</option>
                                <option value="3">3 Stars</option>
                                <option value="4">4 Stars</option>
                                <option value="5">5 Stars</option>
                            </Select>
                        </div>
                        
                        <div className="col-span-2">
                            <div className="mb-2 block">
                                <Label value="Airport Transportation" className="text-lg font-semibold" />
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Add transportation prices for airports serving this hotel</p>
                            </div>
                            
                            {/* For backwards compatibility */}
                            <div className="hidden">
                                <Select
                                    id="hotelAirport"
                                    name="airport"
                                    value={hotelData.airport}
                                    onChange={handleHotelChange}
                                >
                                    <option value="">Select Airport</option>
                                    {airports.length > 0 && 
                                        getAirportOptions().map((airport, index) => (
                                            <option key={index} value={airport.value}>
                                                {airport.label}
                                            </option>
                                        ))
                                    }
                                </Select>
                            </div>
                            
                            {/* Multiple airport transportation options */}
                            <div className="mb-4">
                                {hotelData.airportTransportation.length === 0 ? (
                                    <div className="text-center p-6 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 mb-4">
                                        <p className="text-gray-500 dark:text-gray-400 mb-4">No airport transportation options added</p>
                                        <Button size="sm" onClick={handleAddAirportTransportation} className="mr-2">
                                            <HiPlus className="mr-1" /> Add Airport Transportation
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        {hotelData.airportTransportation.map((item, index) => (
                                            <div key={index} className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                                <div className="flex justify-between items-center mb-3">
                                                    <h4 className="font-medium text-gray-900 dark:text-white">Airport #{index + 1}</h4>
                                                    <Button color="failure" size="xs" onClick={() => handleRemoveAirportTransportation(index)}>
                                                        <HiTrash className="mr-1" size={16} /> Remove
                                                    </Button>
                                                </div>
                                                
                                                <div className="mb-4">
                                                    <Label htmlFor={`airport-${index}`} value="Select Airport" className="mb-2" />
                                                    <Select
                                                        id={`airport-${index}`}
                                                        value={item.airport}
                                                        onChange={(e) => handleAirportTransportationChange(index, 'airport', e.target.value)}
                                                        required
                                                    >
                                                        <option value="">Select Airport</option>
                                                        {airports.length > 0 && 
                                                            getAirportOptions().map((airport, idx) => (
                                                                <option key={idx} value={airport.value}>
                                                                    {airport.label}
                                                                </option>
                                                            ))
                                                        }
                                                    </Select>
                                                </div>
                                                
                                                <div>
                                                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">Transportation Pricing (per vehicle)</h5>
                                                    <div className="grid grid-cols-2 gap-4 p-3 bg-white dark:bg-gray-700 rounded-lg">
                                                        <div>
                                                            <Label htmlFor={`vito-reception-${index}`} value="Vito Reception Price ($)" size="sm" className="mb-1" />
                                                            <TextInput
                                                                id={`vito-reception-${index}`}
                                                                type="number"
                                                                size="sm"
                                                                value={item.transportation.vitoReceptionPrice}
                                                                onChange={(e) => handleTransportationPriceChange(index, 'vitoReceptionPrice', e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor={`vito-farewell-${index}`} value="Vito Farewell Price ($)" size="sm" className="mb-1" />
                                                            <TextInput
                                                                id={`vito-farewell-${index}`}
                                                                type="number"
                                                                size="sm"
                                                                value={item.transportation.vitoFarewellPrice}
                                                                onChange={(e) => handleTransportationPriceChange(index, 'vitoFarewellPrice', e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor={`sprinter-reception-${index}`} value="Sprinter Reception Price ($)" size="sm" className="mb-1" />
                                                            <TextInput
                                                                id={`sprinter-reception-${index}`}
                                                                type="number"
                                                                size="sm"
                                                                value={item.transportation.sprinterReceptionPrice}
                                                                onChange={(e) => handleTransportationPriceChange(index, 'sprinterReceptionPrice', e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor={`sprinter-farewell-${index}`} value="Sprinter Farewell Price ($)" size="sm" className="mb-1" />
                                                            <TextInput
                                                                id={`sprinter-farewell-${index}`}
                                                                type="number"
                                                                size="sm"
                                                                value={item.transportation.sprinterFarewellPrice}
                                                                onChange={(e) => handleTransportationPriceChange(index, 'sprinterFarewellPrice', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        <div className="text-center mt-3">
                                            <Button size="sm" onClick={handleAddAirportTransportation}>
                                                <HiPlus className="mr-1" /> Add Another Airport
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                            
                            {/* For backwards compatibility - keep the old transportation form */}
                            <div className="hidden">
                                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Default Airport Transportation Pricing (per vehicle)</h3>
                                <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div>
                                        <div className="mb-2 block">
                                            <Label htmlFor="vitoReceptionPrice" value="Vito Reception Price ($)" />
                                        </div>
                                        <TextInput
                                            id="vitoReceptionPrice"
                                            type="number"
                                            value={hotelData.transportation.vitoReceptionPrice}
                                            onChange={(e) => setHotelData({
                                                ...hotelData,
                                                transportation: {
                                                    ...hotelData.transportation,
                                                    vitoReceptionPrice: e.target.value
                                                }
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <div className="mb-2 block">
                                            <Label htmlFor="vitoFarewellPrice" value="Vito Farewell Price ($)" />
                                        </div>
                                        <TextInput
                                            id="vitoFarewellPrice"
                                            type="number"
                                            value={hotelData.transportation.vitoFarewellPrice}
                                            onChange={(e) => setHotelData({
                                                ...hotelData,
                                                transportation: {
                                                    ...hotelData.transportation,
                                                    vitoFarewellPrice: e.target.value
                                                }
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <div className="mb-2 block">
                                            <Label htmlFor="sprinterReceptionPrice" value="Sprinter Reception Price ($)" />
                                        </div>
                                        <TextInput
                                            id="sprinterReceptionPrice"
                                            type="number"
                                            value={hotelData.transportation.sprinterReceptionPrice}
                                            onChange={(e) => setHotelData({
                                                ...hotelData,
                                                transportation: {
                                                    ...hotelData.transportation,
                                                    sprinterReceptionPrice: e.target.value
                                                }
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <div className="mb-2 block">
                                            <Label htmlFor="sprinterFarewellPrice" value="Sprinter Farewell Price ($)" />
                                        </div>
                                        <TextInput
                                            id="sprinterFarewellPrice"
                                            type="number"
                                            value={hotelData.transportation.sprinterFarewellPrice}
                                            onChange={(e) => setHotelData({
                                                ...hotelData,
                                                transportation: {
                                                    ...hotelData.transportation,
                                                    sprinterFarewellPrice: e.target.value
                                                }
                                            })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Vito: 2-8 persons, Sprinter: 9-16 persons
                            </p>
                        </div>
                        
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="hotelBreakfast" value="Breakfast" />
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="hotelBreakfast"
                                    name="breakfastIncluded"
                                    checked={hotelData.breakfastIncluded}
                                    onChange={handleHotelChange}
                                />
                                <Label htmlFor="hotelBreakfast">Breakfast Included</Label>
                            </div>
                            
                            {hotelData.breakfastIncluded && (
                                <div className="mt-2 ml-6">
                                    <Label htmlFor="breakfastPrice" className="text-sm mb-1 block">Breakfast Price ($ per room)</Label>
                                    <TextInput
                                        id="breakfastPrice"
                                        type="number"
                                        name="breakfastPrice"
                                        value={hotelData.breakfastPrice}
                                        onChange={handleHotelChange}
                                        placeholder="Price per room"
                                        className="w-full max-w-xs"
                                        required={hotelData.breakfastIncluded}
                                    />
                                </div>
                            )}
                        </div>
                        
                        <div>
                            <div className="mb-3 block">
                                <Label htmlFor="hotelRoomTypes" value="Room Types" className="text-lg font-semibold" />
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Select the room types available at this hotel</p>
                            </div>
                            <div className="space-y-4 mb-4">
                                
                                <div className="border-b pb-4 mb-2">
                                    <h3 className="text-md font-medium mb-3 text-purple-600 dark:text-purple-400">Standard Room Types</h3>
                                    {standardRoomTypes.map((roomType) => (
                                        <div key={roomType} className="flex items-center gap-2 mb-2">
                                            <Checkbox
                                                id={`roomType-${roomType}`}
                                                checked={selectedRoomTypes[roomType]}
                                                onChange={() => handleRoomTypeCheckboxChange(roomType)}
                                            />
                                            <Label htmlFor={`roomType-${roomType}`} className="font-medium text-sm">{roomType}</Label>
                                            {selectedRoomTypes[roomType] && (
                                                <div className="flex flex-col w-full gap-2 mt-1 p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 shadow-sm">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                        <Label className="text-xs font-medium w-32 m-0">Adult Price:</Label>
                                                        <TextInput
                                                            type="number"
                                                            size="sm"
                                                            className="flex-grow shadow-sm text-sm"
                                                            placeholder="Price per night"
                                                            value={roomTypePrices[roomType]}
                                                            onChange={(e) => handleRoomPriceChange(roomType, e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                        <Label className="text-xs font-medium w-32 m-0">Children Price:</Label>
                                                        <TextInput
                                                            type="number"
                                                            size="sm"
                                                            className="flex-grow shadow-sm text-sm"
                                                            placeholder="Additional fee"
                                                            value={roomTypeChildrenPrices[roomType]}
                                                            onChange={(e) => handleChildrenRoomPriceChange(roomType, e.target.value)}
                                                        />
                                                    </div>
                                                    
                                                    {/* Monthly pricing accordion */}
                                                    <div className="mt-2">
                                                        <Accordion collapseAll className="border-none">
                                                            <Accordion.Panel>
                                                                <Accordion.Title className="text-xs font-medium p-2 bg-gray-100 dark:bg-gray-700 flex items-center">
                                                                    <HiCalendar className="mr-2" size={14} />
                                                                    Monthly Pricing Options
                                                                </Accordion.Title>
                                                                <Accordion.Content className="p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                                        Set different prices for specific months. If a month's price is 0, the base price will be used.
                                                                    </p>
                                                                    
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                                        {months.map((month, index) => (
                                                                            <div key={month} className="p-2 border border-gray-200 dark:border-gray-700 rounded-md">
                                                                                <div className="text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                                                                                    {monthLabels[index]}
                                                                                </div>
                                                                                
                                                                                <div className="mb-1">
                                                                                    <Label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                                                                                        Adult Price
                                                                                    </Label>
                                                                                    <TextInput
                                                                                        type="number"
                                                                                        size="sm"
                                                                                        placeholder="0"
                                                                                        value={monthlyPrices[roomType][month]?.adult || ""}
                                                                                        onChange={(e) => handleMonthlyPriceChange(roomType, month, 'adult', e.target.value)}
                                                                                        className="text-xs p-1"
                                                                                    />
                                                                                </div>
                                                                                
                                                                                <div>
                                                                                    <Label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                                                                                        Child Price
                                                                                    </Label>
                                                                                    <TextInput
                                                                                        type="number"
                                                                                        size="sm"
                                                                                        placeholder="0"
                                                                                        value={monthlyPrices[roomType][month]?.child || ""}
                                                                                        onChange={(e) => handleMonthlyPriceChange(roomType, month, 'child', e.target.value)}
                                                                                        className="text-xs p-1"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </Accordion.Content>
                                                            </Accordion.Panel>
                                                        </Accordion>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                
                                <div>
                                    <h3 className="text-md font-medium mb-2 text-purple-600 dark:text-purple-400">Custom Room Types</h3>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Checkbox
                                            id="roomType-CUSTOM"
                                            checked={selectedRoomTypes["CUSTOM"]}
                                            onChange={() => handleRoomTypeCheckboxChange("CUSTOM")}
                                        />
                                        <Label htmlFor="roomType-CUSTOM" className="font-medium text-sm">Add custom room type(s)</Label>
                                    </div>
                                    
                                    {selectedRoomTypes["CUSTOM"] && (
                                        <div className="w-full mt-3">
                                            {customRoomTypes.length === 0 && (
                                                <div className="mb-4 p-4 border border-dashed border-purple-300 dark:border-purple-800 rounded-lg bg-purple-50 dark:bg-gray-800 flex flex-col items-center justify-center">
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center">No custom room types added yet</p>
                                                    <Button
                                                        onClick={handleAddCustomRoomType}
                                                        size="xs"
                                                        gradientDuoTone="purpleToPink"
                                                        className="px-3"
                                                    >
                                                        <div className="flex items-center">
                                                            <HiPlus className="h-3 w-3" />
                                                            <span className="ml-1">Add Custom Room Type</span>
                                                        </div>
                                                    </Button>
                                                </div>
                                            )}
                                            
                                            {customRoomTypes.map((roomType, index) => (
                                                <div 
                                                    key={roomType.id}
                                                    className="flex flex-col w-full gap-2 mb-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 shadow-sm"
                                                >
                                                    <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-200 dark:border-gray-700">
                                                        <h4 className="text-sm font-medium text-purple-600 dark:text-purple-400">Custom Room Type {index + 1}</h4>
                                                        <Button
                                                            onClick={() => handleRemoveCustomRoomType(index)}
                                                            size="xs"
                                                            color="failure"
                                                            pill
                                                        >
                                                            <HiX className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                    
                                                    <div className="flex flex-col gap-2 w-full">
                                                        <div className="flex flex-col gap-1">
                                                            <Label className="text-xs font-medium">Room Type Name:</Label>
                                                            <TextInput
                                                                className="shadow-sm text-sm"
                                                                size="sm"
                                                                placeholder="Enter custom room type name"
                                                                value={roomType.name}
                                                                onChange={(e) => handleCustomRoomTypeNameChange(index, e.target.value)}
                                                                required
                                                            />
                                                        </div>
                                                        
                                                        <div className="flex flex-col gap-1">
                                                            <Label className="text-xs font-medium">Adult Price per Night:</Label>
                                                            <TextInput
                                                                type="number"
                                                                className="shadow-sm text-sm"
                                                                size="sm"
                                                                placeholder="Price per night"
                                                                value={roomTypePrices[roomType.id] || ''}
                                                                onChange={(e) => handleCustomRoomTypePriceChange(index, e.target.value)}
                                                                required
                                                            />
                                                        </div>
                                                        
                                                        <div className="flex flex-col gap-1">
                                                            <Label className="text-xs font-medium">Children (6-12) Price:</Label>
                                                            <TextInput
                                                                type="number"
                                                                className="shadow-sm text-sm"
                                                                size="sm"
                                                                placeholder="Additional fee"
                                                                value={roomTypeChildrenPrices[roomType.id] || ''}
                                                                onChange={(e) => handleCustomRoomTypeChildrenPriceChange(index, e.target.value)}
                                                            />
                                                        </div>
                                                        
                                                        {/* Monthly pricing accordion for custom room types */}
                                                        <div className="mt-2">
                                                            <Accordion collapseAll className="border-none">
                                                                <Accordion.Panel>
                                                                    <Accordion.Title className="text-xs font-medium p-2 bg-gray-100 dark:bg-gray-700 flex items-center">
                                                                        <HiCalendar className="mr-2" size={14} />
                                                                        Monthly Pricing Options
                                                                    </Accordion.Title>
                                                                    <Accordion.Content className="p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                                            Set different prices for specific months. If a month's price is 0, the base price will be used.
                                                                        </p>
                                                                        
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                                            {months.map((month, index) => (
                                                                                <div key={month} className="p-2 border border-gray-200 dark:border-gray-700 rounded-md">
                                                                                    <div className="text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                                                                                        {monthLabels[index]}
                                                                                    </div>
                                                                                    
                                                                                    <div className="mb-1">
                                                                                        <Label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                                                                                            Adult Price
                                                                                        </Label>
                                                                                        <TextInput
                                                                                            type="number"
                                                                                            size="sm"
                                                                                            placeholder="0"
                                                                                            value={monthlyPrices[roomType.id]?.[month]?.adult || ""}
                                                                                            onChange={(e) => handleMonthlyPriceChange(roomType.id, month, 'adult', e.target.value)}
                                                                                            className="text-xs p-1"
                                                                                        />
                                                                                    </div>
                                                                                    
                                                                                    <div>
                                                                                        <Label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                                                                                            Child Price
                                                                                        </Label>
                                                                                        <TextInput
                                                                                            type="number"
                                                                                            size="sm"
                                                                                            placeholder="0"
                                                                                            value={monthlyPrices[roomType.id]?.[month]?.child || ""}
                                                                                            onChange={(e) => handleMonthlyPriceChange(roomType.id, month, 'child', e.target.value)}
                                                                                            className="text-xs p-1"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </Accordion.Content>
                                                                </Accordion.Panel>
                                                            </Accordion>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {customRoomTypes.length > 0 && (
                                                <div className="flex justify-center mt-2 mb-2">
                                                    <Button
                                                        onClick={handleAddCustomRoomType}
                                                        size="xs"
                                                        gradientDuoTone="purpleToPink"
                                                        className="shadow-sm px-2"
                                                    >
                                                        <div className="flex items-center">
                                                            <HiPlus className="h-3 w-3" />
                                                            <span className="ml-1 text-xs">Add Another</span>
                                                        </div>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="hotelDescription" value="Hotel Description" />
                            </div>
                            <Textarea
                                id="hotelDescription"
                                name="description"
                                rows={3}
                                value={hotelData.description}
                                onChange={handleHotelChange}
                            />
                        </div>
                        
                        <Button type="submit" gradientDuoTone="pinkToOrange">
                            Add Hotel
                        </Button>
                        
                        {error && <Alert color="failure" className="mt-4">{error}</Alert>}
                        {success && <Alert color="success" className="mt-4">{success}</Alert>}
                    </form>
                </Card>
            )}

            {activeTab === 'tours' && (
                <Card className="w-full" id="tours-panel" role="tabpanel" aria-labelledby="tab-tours">
                    <h2 className="text-2xl font-bold mb-4 dark:text-white mx-auto">Add New Tour</h2>
                    
                    <form onSubmit={handleTourSubmit} className="space-y-4">
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="tourName" value="Tour Name" />
                            </div>
                            <TextInput
                                id="tourName"
                                name="name"
                                value={tourData.name}
                                onChange={handleTourChange}
                                required
                            />
                        </div>
                        
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="tourCity" value="City" />
                            </div>
                            <Select
                                id="tourCity"
                                name="city"
                                value={tourData.city}
                                onChange={handleTourChange}
                                required
                            >
                                <option value="">Select City</option>
                                <option value="Antalya">Antalya</option>
                                <option value="Bodrum">Bodrum</option>
                                <option value="Bursa">Bursa</option>
                                <option value="Cappadocia">Cappadocia</option>
                                <option value="Fethiye">Fethiye</option>
                                <option value="Istanbul">Istanbul</option>
                                <option value="Izmir">Izmir</option>
                                <option value="Konya">Konya</option>
                                <option value="Marmaris">Marmaris</option>
                                <option value="Pamukkale">Pamukkale</option>
                                <option value="Trabzon">Trabzon</option>
                                <option value="Uzungol">Uzungol</option>
                            </Select>
                        </div>
                        
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="tourDesc" value="Brief Description" />
                            </div>
                            <TextInput
                                id="tourDesc"
                                name="description"
                                value={tourData.description}
                                onChange={handleTourChange}
                            />
                        </div>
                        
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="tourDetailDesc" value="Detailed Description" />
                            </div>
                            <Textarea
                                id="tourDetailDesc"
                                name="detailedDescription"
                                rows={4}
                                value={tourData.detailedDescription}
                                onChange={handleTourChange}
                            />
                        </div>
                        
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="tourType" value="Tour Type" />
                            </div>
                            <Select
                                id="tourType"
                                name="tourType"
                                value={tourData.tourType}
                                onChange={handleTourChange}
                                required
                            >
                                <option value="Group">Group Tour (per person)</option>
                                <option value="VIP">VIP Tour (per car)</option>
                            </Select>
                        </div>
                        
                        {tourData.tourType === 'VIP' && (
                            <div>
                                <div className="mb-2 block">
                                    <Label htmlFor="vipCarType" value="VIP Car Type" />
                                </div>
                                <Select
                                    id="vipCarType"
                                    name="vipCarType"
                                    value={tourData.vipCarType}
                                    onChange={handleVipCarTypeChange}
                                    required
                                >
                                    <option value="Vito">Vito (2-8 persons)</option>
                                    <option value="Sprinter">Sprinter (9-16 persons)</option>
                                </Select>
                                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    {tourData.vipCarType === 'Vito' 
                                        ? 'Capacity: 2-8 persons' 
                                        : 'Capacity: 9-16 persons'}
                                </div>
                            </div>
                        )}
                        
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="tourPrice" value={tourData.tourType === 'Group' ? 'Price per Person ($)' : 'Price per Car ($)'} />
                            </div>
                            <TextInput
                                id="tourPrice"
                                type="number"
                                name="price"
                                value={tourData.price}
                                onChange={handleTourChange}
                                required
                            />
                        </div>
                        
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="tourDuration" value="Duration (hours)" />
                            </div>
                            <TextInput
                                id="tourDuration"
                                type="number"
                                name="duration"
                                value={tourData.duration}
                                onChange={handleTourChange}
                                min={1}
                                required
                            />
                        </div>
                        
                        <div>
                            <Label value="Tour Highlights" className="mb-2 block" />
                            <div className="flex gap-2 mb-3">
                                <TextInput
                                    placeholder="Add a highlight"
                                    value={highlightInput}
                                    onChange={(e) => setHighlightInput(e.target.value)}
                                    className="flex-1"
                                />
                                <Button 
                                    onClick={handleAddHighlight} 
                                    gradientDuoTone="purpleToPink"
                                    size="sm"
                                >
                                    <div className="flex items-center">
                                        <HiPlus className="h-4 w-4" />
                                        <span className="ml-1">Add</span>
                                    </div>
                                </Button>
                            </div>
                            
                            {tourData.highlights.length > 0 && (
                                <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                                    <h4 className="text-md font-medium mb-2 text-gray-700 dark:text-gray-300">Added Highlights:</h4>
                                    <ul className="space-y-2">
                                        {tourData.highlights.map((highlight, index) => (
                                            <li key={index} className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                                <span className="text-gray-800 dark:text-gray-200">• {highlight}</span>
                                                <Button 
                                                    color="failure" 
                                                    size="xs"
                                                    pill
                                                    onClick={() => handleRemoveHighlight(index)}
                                                >
                                                    <HiX className="h-4 w-4" />
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        
                        <Button type="submit" gradientDuoTone="pinkToOrange">
                            Add Tour
                        </Button>
                        
                        {error && <Alert color="failure" className="mt-4">{error}</Alert>}
                        {success && <Alert color="success" className="mt-4">{success}</Alert>}
                    </form>
                </Card>
            )}

            {activeTab === 'airports' && (
                <Card className="w-full" id="airports-panel" role="tabpanel" aria-labelledby="tab-airports">
                    <h2 className="text-2xl font-bold mb-4 dark:text-white mx-auto">Add New Airport</h2>
                    
                    <form onSubmit={handleAirportSubmit} className="space-y-4">
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="airportName" value="Airport Name" />
                            </div>
                            <TextInput
                                id="airportName"
                                name="name"
                                value={airportData.name}
                                onChange={handleAirportChange}
                                required
                            />
                        </div>
                        
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="airportArabicName" value="Arabic Name" />
                            </div>
                            <TextInput
                                id="airportArabicName"
                                name="arabicName"
                                value={airportData.arabicName}
                                onChange={handleAirportChange}
                                required
                            />
                        </div>
                        
                        <Button type="submit" gradientDuoTone="pinkToOrange">
                            Add Airport
                        </Button>
                        
                        {error && <Alert color="failure" className="mt-4">{error}</Alert>}
                        {success && <Alert color="success" className="mt-4">{success}</Alert>}
                    </form>
                    
                    <div className="mt-8">
                        <h3 className="text-xl font-bold mb-4 dark:text-white">Existing Airports</h3>
                        {airports.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {airports.map(airport => (
                                    <Card key={airport._id} className="overflow-hidden">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                            <div>
                                                <p className="font-medium text-lg dark:text-white">{airport.name}</p>
                                                <p className="text-gray-600 dark:text-gray-400">{airport.arabicName}</p>
                                            </div>
                                            <Button 
                                                color='failure'
                                                size="xs"
                                                onClick={() => handleDeleteAirport(airport._id)}
                                                className="mt-2 sm:mt-0"
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Alert color="info">No airports found.</Alert>
                        )}
                    </div>
                </Card>
            )}

            {activeTab === 'users' && (
                <Card className="w-full" id="users-panel" role="tabpanel" aria-labelledby="tab-users">
                    <h2 className="text-2xl font-bold mb-4 dark:text-white mx-auto">User Management</h2>
                    
                    {error && <Alert color="failure" className="mb-4">{error}</Alert>}
                    {success && <Alert color="success" className="mb-4">{success}</Alert>}
                    
                    {users.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <Table.Head>
                                    <Table.HeadCell>Username</Table.HeadCell>
                                    <Table.HeadCell>Admin Status</Table.HeadCell>
                                    <Table.HeadCell>Admin Actions</Table.HeadCell>
                                    <Table.HeadCell>Delete</Table.HeadCell>
                                </Table.Head>
                                <Table.Body className="divide-y">
                                    {users.map(user => (
                                        <Table.Row key={user._id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                                            <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                                {user.username}
                                            </Table.Cell>
                                            <Table.Cell className="flex items-center justify-center">
                                                <Badge color={user.isAdmin ? "success" : "gray"} size="xs" className="text-center w-16 flex items-center justify-center px-0">
                                                    {user.isAdmin ? "Admin" : "User"}
                                                </Badge>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <div className="flex items-center">
                                                    {user.isAdmin ? (
                                                        <Button 
                                                            gradientDuoTone="purpleToPink" 
                                                            size="xs"
                                                            onClick={() => handleToggleAdminStatus(user._id, user.isAdmin)}
                                                        >
                                                            Revoke
                                                        </Button>
                                                    ) : (
                                                        <Button 
                                                            gradientDuoTone="greenToBlue" 
                                                            size="xs"
                                                            onClick={() => handleToggleAdminStatus(user._id, user.isAdmin)}
                                                        >
                                                            Assign
                                                        </Button>
                                                    )}
                                                </div>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Button 
                                                    gradientDuoTone="pinkToOrange"
                                                    size="xs"
                                                    onClick={() => handleDeleteUser(user._id)}
                                                >
                                                    Delete
                                                </Button>
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table>
                        </div>
                    ) : (
                        <Alert color="info">No users found. Admin users can manage other users here.</Alert>
                    )}
                </Card>
            )}
        </div>
    );
}
    