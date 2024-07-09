import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
    
    roomId: {
        type: String,
        required: true
    }
});

const Room = mongoose.model('room', roomSchema);

export default Room;