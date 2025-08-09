import e from "express";
import Trip from "../models/Trip.js";
import { io } from "../socketServer.js";
import { Socket } from "socket.io";
import { nanoid } from "nanoid";


export const createTrip = async (req, res) => {
    try {
      const {
        name,
        password,
        startDate ,      
        location,
        riders,
  
      } = req.body;

      const user = req.user;
  
      // Basic validation
      if (!name || !password || !location) {
        return res.status(400).json({ message: 'Name, password, and location are required.' });
      }
        
      
      const userId = user._id;;
      
        
        const runningTrip = await Trip.findOne({
            status: 'running',
            riders: {
              $elemMatch: {
                _id: userId,
              },
            },
          });
        if (runningTrip) {
            return res.status(400).json({ message: 'User already has a running trip.' });
        }
      
     
          
        const shortId = nanoid(5);
        
  
      // Create a new Trip instance
      const newTrip = new Trip({
        tripId: shortId,
        name,
        password,
        startDate,
        location,
        riders: [{
          _id: userId,
          name: user.name,
          email: user.email,
          latitude: riders.latitude,
          longitude: riders.longitude,
          address: riders.address,
        
        }],
        createdBy:user._id
      });
  
      // Save the trip to the database
      const savedTrip = await newTrip.save();
  
      // Respond with the saved trip
      res.status(201).json(savedTrip);
    } catch (error) {
      console.error('Error creating trip:', error);
      res.status(500).json({ message: 'Server error while creating trip.' });
    }
  };

export const joinTrip = async (req, res) => {
  try {
    const { password, tripId, rider } = req.body;

    if (!password || !rider) {
      return res.status(400).json({ message: "Password and rider info required." });
    }

    const trip = await Trip.findOne({
      tripId: tripId,
       password,
      status: "running",
      
     
    });

    if (!trip) {
      return res.status(404).json({ message: "Trip not found or incorrect password." });
    }

    const user = req.user;

    const exists = trip.riders.some((r) => r._id.equals(user._id));
    if (exists) {
      return res.status(409).json({ message: "Rider already in the trip." });
    }

    const newRider = {
      _id: user._id,
      name: user.name,
      email: user.email,
      latitude: rider.latitude || 0,
      longitude: rider.longitude || 0,
      address: rider.address || "",
    };

    trip.riders.push(newRider);
    await trip.save();

   
    
    io.to(trip._id.toString()).emit("trip:update", {
      message: `${user.name} joined the trip.`,
      trip,
      newRider,
    });
    console.log("Trip updated");

    res.status(200).json({ message: "Rider added successfully.", trip });
  } catch (error) {
    console.error("Join trip error:", error);
    res.status(500).json({ message: "Server error while joining trip." });
  }
};


  export const getRunningTrip = async (req, res) => {
    try {
      const user = req.user;
  
      
      
      const activeTrip = await Trip.findOne({
        'riders._id': user._id,
        status: 'running',
      });
  
      if (!activeTrip) {
        return res.status(400).json({ message: 'No active trip found for this user.' });
      }
  
      res.status(200).json(activeTrip);
    } catch (error) {
      console.error('Error retrieving active trip:', error);
      res.status(500).json({ message: 'Server error while retrieving active trip.' });
    }
  };



export const trackRiderLocation = async (req, res) => {
    try {
        const { userId, location } = req.body;
    
        // Validate required fields
        if (!userId || !location) {
          return res.status(400).json({ message: 'User ID and location are required.' });
        }
    
        // Find the trip that the rider is part of
        const trip = await Trip.findOne({
          'riders.id': userId,
          status: 'running',
        });
    
        if (!trip) {
          return res.status(404).json({ message: 'Trip not found or rider not part of any trip.' });
        }
    
        // Update the rider's location
        const riderIndex = trip.riders.findIndex((rider) => rider.id === userId);
        if (riderIndex !== -1) {
          trip.riders[riderIndex].latitude = location.latitude;
          trip.riders[riderIndex].longitude = location.longitude;
          await trip.save();
          res.status(200).json({ message: 'Rider location updated successfully.', trip });
        } else {
          res.status(404).json({ message: 'Rider not found in the trip.' });
        }
      } catch (error) {
        console.error('Error tracking rider location:', error);
        res.status(500).json({ message: 'Server error while tracking rider location.' });
      }
    
};

export const leaveTrip = async (req, res) => {
    try {
      const { tripId } = req.body;
      const user = req.user;

    
        // Validate required fields
        if (!user) {
          return res.status(400).json({ message: 'User ID is required.' });
        }
    
        // Find the trip that the rider is part of
     const trip = await Trip.findOne({
  _id: tripId,
  status: 'running',
  riders: { $elemMatch: { _id: user._id } },
});
    
        if (!trip) {
          return res.status(404).json({ message: 'Trip not found or rider not part of any trip.' });
        }
    
        // Remove the rider from the trip
       trip.riders = trip.riders.filter((rider) => rider._id.toString() !== user._id.toString());
    
      await trip.save();
      



      io.to(trip._id.toString()).emit("trip:leave", { 
        message: `${user.name} left the trip.`,
        trip,
       });
      
    
    
        res.status(200).json({ message: 'Rider left the trip successfully.', trip });
      } catch (error) {
        console.error('Error leaving trip:', error);
        res.status(500).json({ message: 'Server error while leaving trip.' });
      }
}

