import { Express, Router } from "express";
import { createRoom, validateRoom } from "../controllers/rooms";

const router = Router();

router.get('/create', createRoom);
router.get('/validate/:id', validateRoom);

export default router;