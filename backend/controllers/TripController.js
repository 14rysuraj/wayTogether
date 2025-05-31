import Trip from "../models/Trip.js";





export const createTrip = async (req, res) => {
    try {
      const {
        name,
        password,
        startDate = null,      
        endDate=null,
        location,
        riders = [],
      } = req.body;
  
      // Basic validation
      if (!name || !password || !location) {
        return res.status(400).json({ message: 'Name, password, and location are required.' });
      }
        
      
      const userId = riders[0].id;
      
        
        const runningTrip = await Trip.findOne({
            status: 'running',
            riders: {
              $elemMatch: {
                id: userId,
              },
            },
          });
        if (runningTrip) {
            return res.status(409).json({ message: 'User already has a running trip.' });
        }
  
      // Create a new Trip instance
      const newTrip = new Trip({
        name,
        password,
        startDate,
        endDate,
        location,
        riders,
        status: 'running',
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
      const { password, rider } = req.body;
  
      // Validate required fields
      if (!password || !rider || !rider.id) {
        return res.status(400).json({ message: 'Password and rider information are required.' });
      }
  
      // Find a running trip with the given password
      const trip = await Trip.findOne({
        status: 'running',
        password:password// shorthand
      });
  
      if (!trip) {
        return res.status(404).json({ message: 'Trip not found or incorrect password.' });
      }
  
      // Check if the rider is already part of the trip
      const existingRider = trip.riders.find((r) => r.id === rider.id);
      if (existingRider) {
        return res.status(409).json({ message: 'Rider is already part of the trip.' });
      }
  
      // Add the new rider
      trip.riders.push({
        ...rider,
        status: 'pending', // Default status
      });
  
      await trip.save();
  
      res.status(200).json({ message: 'Rider successfully added to the trip.', trip });
    } catch (error) {
      console.error('Error joining trip:', error);
      res.status(500).json({ message: 'Server error while joining trip.' });
    }
  };


  export const getRunningTrip = async (req, res) => {
    try {
      const userId = req.body; // Assuming userId is passed as a query parameter
  
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required.' });
      }
  
      // Find the active trip for the user
      const activeTrip = await Trip.findOne({
        'riders.id': userId,
        status: 'running',
      });
  
      if (!activeTrip) {
        return res.status(404).json({ message: 'No active trip found for this user.' });
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
        const { userId,tripId } = req.body;
    
        // Validate required fields
        if (!userId) {
          return res.status(400).json({ message: 'User ID is required.' });
        }
    
        // Find the trip that the rider is part of
      const trip = await Trip.findOne({
          _id: tripId,
          'riders.id': userId,
          status: 'running',
        });
    
        if (!trip) {
          return res.status(404).json({ message: 'Trip not found or rider not part of any trip.' });
        }
    
        // Remove the rider from the trip
        trip.riders = trip.riders.filter((rider) => rider.id !== userId);
    
        await trip.save();
    
        res.status(200).json({ message: 'Rider left the trip successfully.', trip });
      } catch (error) {
        console.error('Error leaving trip:', error);
        res.status(500).json({ message: 'Server error while leaving trip.' });
      }
}

