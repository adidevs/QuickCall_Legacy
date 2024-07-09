import { Request, Response } from "express";
import Room from "../models/roomSchema";
import { validate as uuidValidate } from 'uuid';

export const createRoom = async (req: Request, res: Response) => {

    const generateId = () => {

        const alphabet = 'abcdefghijklmnopqrstuvwxyz';
        const alphabetArray = alphabet.split('');
        const alphabetLength = alphabetArray.length;
        const idLength = 12;
        let id = '';
    
        for (let i = 0; i < idLength; i++) {
            if (i === 3 || i === 8) {
                id += '-';
            } else {
                const randomIndex = Math.floor(Math.random() * alphabetLength);
                id += alphabetArray[randomIndex];
            }
        }
       return id;
    }

    //create unique room id using uuid and add to database
    const room = {
        roomId: generateId()
    }
    await Room.insertMany(room)
        .then((data) => {
            return res.status(200).json(data[0].roomId);
        })
        .catch((err) => {
            return res.status(500).json(err.message);
        });
    //send back room id to share and store in local storage in client
};

export const validateRoom = async (req: Request, res: Response) => {

    const room = {
        roomId: req.params.id
    };

    await Room.findOne(room)
        .then((data) => {
            if(data)
            return res.status(200).json(data.roomId);
            else
            return res.status(404).json("INVALID_ROOM_ID"); 
        })
        .catch((err) => {
            return res.status(500).json("INVALID_ROOM_ID");
        });
    //client will then establish connection with socket.io and create room
};