import express from 'express';
import { createTrip, getRunningTrip, joinTrip, leaveTrip, trackRiderLocation } from '../controllers/TripController.js';


const router = express.Router();

router.route("/createTrip").post(createTrip);
router.route("/joinTrip").post(joinTrip);
router.route("/getRunningTrip/:userId").get(getRunningTrip);
router.route("/trackRiderLocation").post(trackRiderLocation);
router.route("/leave-trip").post(leaveTrip);

export default router;