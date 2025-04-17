import React, { useRef } from 'react';
import { Alert } from 'flowbite-react';
import { safeParseInt, getRoomPriceForMonth } from '../utils/pricingUtils';
import { FaCrown, FaUsers, FaCar, FaRegCheckCircle, FaCalendarAlt } from 'react-icons/fa';
import PriceBreakdownDownloader from './PriceBreakdownDownloader';

const PriceBreakdown = ({ 
  totalPrice, 
  nights, 
  numGuests,
  selectedHotelData,
  roomAllocations,
  selectedTours,
  tours,
  includeChildren,
  childrenUnder3,
  children3to6,
  children6to12,
  includeReception,
  includeFarewell,
  transportVehicleType,
  includeBreakfast,
  startDate,
}) => {
  const breakdownRef = useRef(null);

  if (!selectedHotelData || !nights) return null;

  const travelMonth = startDate ? new Date(startDate).toLocaleString('default', { month: 'long' }) : '';
  
  let hotelTotal = 0;
  let tourTotal = 0;
  let transportTotal = 0;
  let breakfastTotal = 0;
  
  if (selectedHotelData.roomTypes && selectedHotelData.roomTypes.length > 0 && roomAllocations.length > 0) {
    roomAllocations.forEach(room => {
      if (room.roomTypeIndex !== "" && selectedHotelData.roomTypes[room.roomTypeIndex]) {
        const roomTypeObj = selectedHotelData.roomTypes[room.roomTypeIndex];
        
        const adultPricePerNight = getRoomPriceForMonth(roomTypeObj, startDate, false);
        const childPricePerNight = getRoomPriceForMonth(roomTypeObj, startDate, true);
        
        const roomPrice = adultPricePerNight * nights;
        hotelTotal += roomPrice;
        
        if (includeChildren && childPricePerNight && room.children6to12) {
          hotelTotal += childPricePerNight * nights * room.children6to12;
        }
      }
    });
  }
  
  if (selectedTours.length > 0) {
    selectedTours.forEach(tourId => {
      const tour = tours.find(t => t._id === tourId);
      if (tour) {
        if (tour.tourType === 'Group') {
          tourTotal += tour.price * safeParseInt(numGuests);
          
          if (includeChildren) {
            const childrenCount = safeParseInt(children3to6) + safeParseInt(children6to12);
            tourTotal += tour.price * childrenCount;
          }
        } else if (tour.tourType === 'VIP') {
          tourTotal += parseFloat(tour.price);
        }
      }
    });
  }
  
  if (selectedHotelData) {
    if (selectedHotelData.transportation) {
      if (includeReception) {
        if (transportVehicleType === 'Vito' && selectedHotelData.transportation.vitoReceptionPrice) {
          transportTotal += parseFloat(selectedHotelData.transportation.vitoReceptionPrice);
        } else if (transportVehicleType === 'Sprinter' && selectedHotelData.transportation.sprinterReceptionPrice) {
          transportTotal += parseFloat(selectedHotelData.transportation.sprinterReceptionPrice);
        }
      }
      
      if (includeFarewell) {
        if (transportVehicleType === 'Vito' && selectedHotelData.transportation.vitoFarewellPrice) {
          transportTotal += parseFloat(selectedHotelData.transportation.vitoFarewellPrice);
        } else if (transportVehicleType === 'Sprinter' && selectedHotelData.transportation.sprinterFarewellPrice) {
          transportTotal += parseFloat(selectedHotelData.transportation.sprinterFarewellPrice);
        }
      }
    } 
    else if (selectedHotelData.transportationPrice && (includeReception || includeFarewell)) {
      const totalPeople = safeParseInt(numGuests) + (includeChildren ? 
        safeParseInt(childrenUnder3) + safeParseInt(children3to6) + safeParseInt(children6to12) : 0);
      
      if (includeReception && includeFarewell) {
        transportTotal = selectedHotelData.transportationPrice * totalPeople;
      } else {
        transportTotal = (selectedHotelData.transportationPrice * totalPeople) / 2;
      }
    }
  }
  
  if (includeBreakfast && selectedHotelData.breakfastIncluded && selectedHotelData.breakfastPrice > 0) {
    const totalRooms = roomAllocations.length > 0 ? roomAllocations.length : Math.ceil(safeParseInt(numGuests) / 2);
    breakfastTotal = selectedHotelData.breakfastPrice * totalRooms * nights;
  }
  
  const directSum = hotelTotal + tourTotal + transportTotal + breakfastTotal;
  
  const displayPrice = totalPrice || directSum;

  return (
    <div 
      className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md"
      ref={breakdownRef}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Price Breakdown
        </h3>
      </div>
      
      <div className="rounded-lg overflow-hidden shadow-md relative">
        <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white">
          <div className="p-4 text-center">
            <h3 className="text-xl font-bold mb-1 text-green-400">Total Price: ${displayPrice}</h3>
            <p className="text-sm text-blue-200">
              {nights} nights • {numGuests} {numGuests === 1 ? 'person' : 'people'}
              {includeChildren && (childrenUnder3 > 0 || children3to6 > 0 || children6to12 > 0) && 
                ` • ${safeParseInt(childrenUnder3) + safeParseInt(children3to6) + safeParseInt(children6to12)} ${(safeParseInt(childrenUnder3) + safeParseInt(children3to6) + safeParseInt(children6to12)) === 1 ? 'child' : 'children'}`
              }
            </p>
            {travelMonth && (
              <p className="text-sm text-blue-200 mt-1 flex items-center justify-center">
                <FaCalendarAlt className="mr-1" /> 
                Travel Month: <span className="font-semibold ml-1">{travelMonth}</span>
              </p>
            )}
          </div>
          <div className="px-4 pb-4">
            <h4 className="text-sm font-semibold text-white mb-3 border-b border-blue-800 pb-2">Price Breakdown</h4>
            
            <div className="mb-3 p-3 bg-blue-950/60 rounded-lg">
              <h5 className="text-sm font-semibold text-blue-300 mb-2 flex items-center">
                <span className="w-6 h-6 rounded-full bg-blue-800 flex items-center justify-center mr-2 text-white text-xs">1</span>
                Hotel Accommodation
              </h5>
              {selectedHotelData.roomTypes && selectedHotelData.roomTypes.length > 0 && roomAllocations.length > 0 ? (
                <div className="space-y-2 pl-8">
                  {(() => {
                    const roomTypeCounts = {};
                    const totalNights = nights;
                    roomAllocations.forEach(room => {
                      if (room.roomTypeIndex !== "" && selectedHotelData.roomTypes[room.roomTypeIndex]) {
                        const roomTypeObj = selectedHotelData.roomTypes[room.roomTypeIndex];
                        const roomType = roomTypeObj.type;
                        
                        const adultPricePerNight = getRoomPriceForMonth(roomTypeObj, startDate, false);
                        const childPricePerNight = getRoomPriceForMonth(roomTypeObj, startDate, true);
                        
                        roomTypeCounts[roomType] = roomTypeCounts[roomType] || { 
                          rooms: 0, 
                          people: 0, 
                          childrenUnder3: 0,
                          children3to6: 0,
                          children6to12: 0,
                          price: adultPricePerNight, 
                          childrenPrice: childPricePerNight,
                          adultPrice: 0,
                          childrenTotalPrice: 0,
                          totalPrice: 0,
                          isMonthlyPrice: adultPricePerNight !== roomTypeObj.pricePerNight || 
                                          childPricePerNight !== roomTypeObj.childrenPricePerNight
                        };
                        
                        roomTypeCounts[roomType].rooms += 1;
                        roomTypeCounts[roomType].people += room.occupants;
                        roomTypeCounts[roomType].childrenUnder3 += (room.childrenUnder3 || 0);
                        roomTypeCounts[roomType].children3to6 += (room.children3to6 || 0);
                        roomTypeCounts[roomType].children6to12 += (room.children6to12 || 0);
                        
                        roomTypeCounts[roomType].adultPrice = roomTypeCounts[roomType].price * totalNights * roomTypeCounts[roomType].rooms;
                        
                        roomTypeCounts[roomType].childrenTotalPrice = 0;
                        if (includeChildren && roomTypeCounts[roomType].children6to12 > 0 && roomTypeCounts[roomType].childrenPrice > 0) {
                          roomTypeCounts[roomType].childrenTotalPrice = roomTypeCounts[roomType].childrenPrice * totalNights * roomTypeCounts[roomType].children6to12;
                        }
                        
                        roomTypeCounts[roomType].totalPrice = roomTypeCounts[roomType].adultPrice + roomTypeCounts[roomType].childrenTotalPrice;
                      }
                    });
                    
                    return Object.entries(roomTypeCounts).map(([type, info], index) => {
                      const originalRoomTypeObj = selectedHotelData.roomTypes.find(rt => rt.type === type);
                      
                      return (
                        <div key={index} className="text-xs mb-3">
                          <div className="flex justify-between">
                            <span className="font-medium text-white">{info.rooms}x {type}</span>
                            <span className="text-green-400 font-medium">${info.totalPrice}</span>
                          </div>
                          
                          <div className="ml-2 mt-1 text-blue-200">
                            {travelMonth && (
                              <div className="text-blue-300 text-xs mb-2 italic">
                                Using {travelMonth} pricing rates
                                {info.isMonthlyPrice && (
                                  <span className="text-yellow-300 ml-1 font-medium">
                                    (seasonal pricing applied)
                                  </span>
                                )}
                              </div>
                            )}
                            
                            <div className="flex justify-between">
                              <span>• Room cost: <span className="text-blue-300">${info.price}/night × {totalNights} nights × {info.rooms} rooms</span></span>
                              <span className="text-teal-300">${info.adultPrice}</span>
                            </div>
                            
                            {info.isMonthlyPrice && originalRoomTypeObj && (
                              <div className="text-xs mt-1 ml-4 text-blue-200">
                                <span className="text-gray-400">Standard price: </span>
                                <span className="line-through">${originalRoomTypeObj.pricePerNight}/night</span>
                                <span className="text-green-400 ml-2">→</span>
                                <span className="text-yellow-300 ml-2">${info.price}/night</span>
                                {info.childrenPrice > 0 && originalRoomTypeObj.childrenPricePerNight > 0 && 
                                 info.childrenPrice !== originalRoomTypeObj.childrenPricePerNight && (
                                  <div>
                                    <span className="text-gray-400">Children price: </span>
                                    <span className="line-through">${originalRoomTypeObj.childrenPricePerNight}/night</span>
                                    <span className="text-green-400 ml-2">→</span>
                                    <span className="text-yellow-300 ml-2">${info.childrenPrice}/night</span>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {includeChildren && info.children6to12 > 0 && info.childrenPrice > 0 && (
                              <div className="flex justify-between">
                                <span>• Children 6-12: <span className="text-blue-300">${info.childrenPrice}/night × {totalNights} nights × {info.children6to12}</span></span>
                                <span className="text-teal-300">${info.childrenTotalPrice}</span>
                              </div>
                            )}
                            
                            <p className="mt-1">• Adults: {info.people}</p>
                            {includeChildren && (
                              <>
                                {info.childrenUnder3 > 0 && <p>• Children 0-3: {info.childrenUnder3} <span className="text-green-400">(free)</span></p>}
                                {info.children3to6 > 0 && <p>• Children 3-6: {info.children3to6} <span className="text-green-400">(free accommodation)</span></p>}
                                {info.children6to12 > 0 && info.childrenPrice === 0 && (
                                  <p>• Children 6-12: {info.children6to12} <span className="text-green-400">(no additional charge)</span></p>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <p className="text-xs pl-8 text-blue-300">
                  Standard room rate calculation based on {numGuests} guests for {nights} nights
                </p>
              )}
            </div>
            
            {includeBreakfast && selectedHotelData.breakfastIncluded && selectedHotelData.breakfastPrice > 0 && (
              <div className="mb-3 p-3 bg-green-950/60 rounded-lg">
                <h5 className="text-sm font-semibold text-green-300 mb-2 flex items-center">
                  <span className="w-6 h-6 rounded-full bg-green-800 flex items-center justify-center mr-2 text-white text-xs">2</span>
                  Breakfast
                </h5>
                
                <div className="space-y-2 pl-8">
                  <div className="text-xs">
                    <div className="flex justify-between">
                      <span className="font-medium text-white">Daily Breakfast</span>
                      <span className="text-green-400 font-medium">${breakfastTotal}</span>
                    </div>
                    
                    <div className="ml-2 mt-1 text-green-200">
                      <div className="flex justify-between">
                        <span>• ${selectedHotelData.breakfastPrice}/room × {nights} nights × {roomAllocations.length || Math.ceil(safeParseInt(numGuests) / 2)} {roomAllocations.length === 1 ? 'room' : 'rooms'}</span>
                        <span className="text-green-400"></span>
                      </div>
                      
                      <div className="mt-1">
                        <p>• Adults: {numGuests}</p>
                        {includeChildren && (
                          <>
                            {safeParseInt(childrenUnder3) > 0 && <p>• Children 0-3: {childrenUnder3}</p>}
                            {safeParseInt(children3to6) > 0 && <p>• Children 3-6: {children3to6}</p>}
                            {safeParseInt(children6to12) > 0 && <p>• Children 6-12: {children6to12}</p>}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {selectedTours.length > 0 && (
              <div className="mb-3 p-3 bg-purple-950/60 rounded-lg">
                <h5 className="text-sm font-semibold text-purple-300 mb-2 flex items-center">
                  <span className="w-6 h-6 rounded-full bg-purple-800 flex items-center justify-center mr-2 text-white text-xs">{includeBreakfast && selectedHotelData.breakfastIncluded && selectedHotelData.breakfastPrice > 0 ? '3' : '2'}</span>
                  Tour Prices
                </h5>
                
                <div className="space-y-2 pl-8">
                  {selectedTours.map(tourId => {
                    const tour = tours.find(t => t._id === tourId);
                    if (!tour) return null;
                    
                    if (tour.tourType === 'VIP') {
                      return (
                        <div key={tourId} className="text-xs">
                          <div className="flex justify-between">
                            <span className="font-medium text-white flex items-center">
                              {tour.name} 
                              <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-yellow-300 text-amber-900 text-xxs font-bold">
                                <FaCrown className="mr-1" size={8} />VIP
                              </span>
                            </span>
                            <span className="text-green-400 font-medium">${tour.price}</span>
                          </div>
                          
                          <div className="ml-2 mt-1 text-purple-200">
                            <p>• <FaCar className="inline mr-1" size={10} /> {tour.vipCarType} ({tour.carCapacity?.min || '?'}-{tour.carCapacity?.max || '?'} persons)</p>
                            <p>• Fixed price per car</p>
                          </div>
                        </div>
                      );
                    }
                    
                    const adultCost = tour.price * numGuests;
                    const childrenCount = includeChildren ? safeParseInt(children3to6) + safeParseInt(children6to12) : 0;
                    const childrenCost = childrenCount * tour.price;
                    const totalTourCost = adultCost + childrenCost;
                    
                    return (
                      <div key={tourId} className="text-xs">
                        <div className="flex justify-between">
                          <span className="font-medium text-white flex items-center">
                            {tour.name} 
                            <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded bg-blue-600 text-white text-xxs">
                              <FaUsers className="mr-1" size={8} />Group
                            </span>
                          </span>
                          <span className="text-green-400 font-medium">${totalTourCost}</span>
                        </div>
                        
                        <div className="ml-2 mt-1 text-purple-200">
                          <p>• Adults: <span className="text-teal-300">${adultCost}</span> ({numGuests} × ${tour.price})</p>
                          {childrenCount > 0 && (
                            <p>• Children 3+ years: <span className="text-teal-300">${childrenCost}</span> ({childrenCount} × ${tour.price})</p>
                          )}
                          {includeChildren && safeParseInt(childrenUnder3) > 0 && (
                            <p>• Children 0-3 years: <span className="text-green-400">$0</span> (free)</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="mb-3 p-3 bg-amber-950/60 rounded-lg">
              <h5 className="text-sm font-semibold text-amber-300 mb-2 flex items-center">
                <span className="w-6 h-6 rounded-full bg-amber-800 flex items-center justify-center mr-2 text-white text-xs">{(includeBreakfast && selectedHotelData.breakfastIncluded && selectedHotelData.breakfastPrice > 0 ? '4' : '3')}</span>
                Transportation
              </h5>
              
              <div className="pl-8">
                {includeReception || includeFarewell ? (
                  <div className="text-xs">
                    {(() => {
                      let transportItems = [];
                      let totalTransportCost = 0;
                      
                      if (selectedHotelData.transportation) {
                        if (includeReception) {
                          if (transportVehicleType === 'Vito' && selectedHotelData.transportation.vitoReceptionPrice > 0) {
                            const cost = parseFloat(selectedHotelData.transportation.vitoReceptionPrice);
                            transportItems.push(`Reception (Vito): $${cost}`);
                            totalTransportCost += cost;
                          } else if (transportVehicleType === 'Sprinter' && selectedHotelData.transportation.sprinterReceptionPrice > 0) {
                            const cost = parseFloat(selectedHotelData.transportation.sprinterReceptionPrice);
                            transportItems.push(`Reception (Sprinter): $${cost}`);
                            totalTransportCost += cost;
                          }
                        }
                        
                        if (includeFarewell) {
                          if (transportVehicleType === 'Vito' && selectedHotelData.transportation.vitoFarewellPrice > 0) {
                            const cost = parseFloat(selectedHotelData.transportation.vitoFarewellPrice);
                            transportItems.push(`Farewell (Vito): $${cost}`);
                            totalTransportCost += cost;
                          } else if (transportVehicleType === 'Sprinter' && selectedHotelData.transportation.sprinterFarewellPrice > 0) {
                            const cost = parseFloat(selectedHotelData.transportation.sprinterFarewellPrice);
                            transportItems.push(`Farewell (Sprinter): $${cost}`);
                            totalTransportCost += cost;
                          }
                        }
                      } else if (selectedHotelData.transportationPrice) {
                        const totalPeople = safeParseInt(numGuests) + (includeChildren ? 
                          safeParseInt(childrenUnder3) + safeParseInt(children3to6) + safeParseInt(children6to12) : 0);
                        
                        if (includeReception && includeFarewell) {
                          const cost = selectedHotelData.transportationPrice * totalPeople;
                          transportItems.push(`Round-trip: $${selectedHotelData.transportationPrice}/person × ${totalPeople} people`);
                          totalTransportCost = cost;
                        } else if (includeReception) {
                          const cost = (selectedHotelData.transportationPrice * totalPeople) / 2;
                          transportItems.push(`Reception only: $${selectedHotelData.transportationPrice/2}/person × ${totalPeople} people`);
                          totalTransportCost = cost;
                        } else if (includeFarewell) {
                          const cost = (selectedHotelData.transportationPrice * totalPeople) / 2;
                          transportItems.push(`Farewell only: $${selectedHotelData.transportationPrice/2}/person × ${totalPeople} people`);
                          totalTransportCost = cost;
                        }
                      }
                      
                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="font-medium text-white">Airport Transportation</span>
                            <span className="text-green-400 font-medium">${totalTransportCost}</span>
                          </div>
                          {transportItems.map((item, index) => (
                            <div className="text-amber-200" key={index}>{item}</div>
                          ))}
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <p className="text-xs text-amber-200">No transportation included</p>
                )}
              </div>
            </div>
            
            <div className="mb-3 p-3 bg-teal-950/60 rounded-lg">
              <h5 className="text-sm font-semibold text-teal-300 mb-2 flex items-center">
                <span className="w-6 h-6 rounded-full bg-teal-800 flex items-center justify-center mr-2 text-white text-xs">{(includeBreakfast && selectedHotelData.breakfastIncluded && selectedHotelData.breakfastPrice > 0 ? '5' : '4')}</span>
                Guest Details
              </h5>
              
              <ul className="text-xs list-disc pl-8 text-teal-100 space-y-1">
                <li>{numGuests} {numGuests === 1 ? 'Adult' : 'Adults'} (full price)</li>
                {includeChildren && safeParseInt(childrenUnder3) > 0 && (
                  <li>{childrenUnder3} {safeParseInt(childrenUnder3) === 1 ? 'Child' : 'Children'} 0-3 years <span className="text-green-400">(free on tours)</span></li>
                )}
                {includeChildren && safeParseInt(children3to6) > 0 && (
                  <li>{children3to6} {safeParseInt(children3to6) === 1 ? 'Child' : 'Children'} 3-6 years <span className="text-green-400">(free hotel accommodation)</span></li>
                )}
                {includeChildren && safeParseInt(children6to12) > 0 && (
                  <li>{children6to12} {safeParseInt(children6to12) === 1 ? 'Child' : 'Children'} 6-12 years <span className="text-green-400">(special hotel rate)</span></li>
                )}
              </ul>
            </div>
          </div>

          <div className="py-3 px-4 bg-green-900/30 border-t border-green-800 flex items-start">
            <FaRegCheckCircle className="text-green-400 mt-0.5 flex-shrink-0 mr-2" />
            <p className="text-xs text-green-100">
              Price verified: The total amount of <span className="font-bold text-green-400">${displayPrice}</span> has been accurately calculated based on room rates, tour costs, and additional services.
            </p>
          </div>
        </div>
        
        <PriceBreakdownDownloader breakdownRef={breakdownRef} />
      </div>
    </div>
  );
};

export default PriceBreakdown; 