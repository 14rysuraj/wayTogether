import express from 'express';
import { createTrip, getRunningTrip, joinTrip, leaveTrip, trackRiderLocation } from '../controllers/TripController.js';
import { isAuthenticated } from '../middlewares/auth.js';


const router = express.Router();

router.post("/createTrip",isAuthenticated,createTrip);
router.post("/joinTrip",isAuthenticated,joinTrip);
router.get("/getRunningTrip",isAuthenticated,getRunningTrip);
router.route("/trackRiderLocation").post(trackRiderLocation);
router.post("/leave-trip",isAuthenticated,leaveTrip);

export default router;