import express, { Request, Response, Application } from 'express';
import { createServer } from 'http';
import { Socket, Server } from 'socket.io';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose, { ConnectOptions } from 'mongoose';
require('dotenv').config();
import routes from './routes/routes';

const port: string | number = process.env.PORT || 1000;
const app: Application = express();
const server = createServer(app);

mongoose.connect(process.env.CLUSTER_URL as string, { useNewUrlParser: true } as ConnectOptions)
    .then(() => {
        server.listen(process.env.PORT || "1000", () => console.log(`DB CONNECTED AND SERVER RUNNING on port ${port}`))
    })
    .catch((err: Error) => {
        console.log(err.message)
    });


const io = new Server(server, {
    cors: { origin: '*' },
    path: '/soc'
});

app.use(cors({ origin: '*' }));
app.use('/', routes);
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
    res.send('<h1>QUICKCALL BACKEND BY ADITYA SHARMA | GITHUB @adidevs</h1>');
});


io.on('connection', (socket: Socket) => {

    socket.on('joinRoom', (room: string, peerId: string, newUserName: string) => {

        const clients: Set<string> | undefined = io.sockets.adapter.rooms.get(room);
        const numClients: number = clients ? clients.size : 0;
        if (numClients >= 40) {
            socket.emit('room-full');
        } else {
            socket.join(room);
            socket.broadcast.to(room).emit('new-user', newUserName, peerId);
            socket.on('message', (sender: string, message: string) => {
                io.to(room).emit("incoming-message", sender, message);
            })
            socket.on('leave-room', () => {
                socket.broadcast.to(room).emit('user-left', peerId);
                socket.leave(room);
            });
            socket.on('disconnect', () => {
                socket.leave(room);
                socket.broadcast.to(room).emit('user-disconnected', newUserName);
            });

        }
    });

})



