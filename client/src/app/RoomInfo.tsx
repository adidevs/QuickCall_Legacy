'use client'
import React, {useState, useEffect } from "react"
import { useRouter } from "next/navigation";
import axios from "axios";
import styles from './page.module.css'
import { BsShareFill } from 'react-icons/bs';

export default function RoomInfo() {

    const router = useRouter();
    const [ roomId, setRoomId ]= useState(''); 

    const joinRoom = async () => {
 
        await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/validate/${roomId}`)
            .then((res) => {
                if(!res.data) return alert('ROOM NOT FOUND, CREATE NEW ID!');
                setRoomId(res.data);

                return router.push(`/${roomId}`);
            }) 
            .catch((err: Error) => {
                return alert(`Check your connection OR try again later!`)
            });
    }

    const newRoom = async () => {

        await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/create`)
            .then((res) => {
                if (res.status != 200) return alert('ROOM NOT CREATED, TRY AGAIN!');
                setRoomId(res.data);
                return router.push(`/${roomId}`);
            })
            .catch((err: Error) => {
                return alert(`Check your connection OR try again later!`)
        });
    }

    const copyId = () => { 
        navigator.clipboard.writeText(roomId);
    }


    return (
        <div className={styles.actions}>
            <button className={styles.createBtn} onClick={newRoom}>New Room</button>
            <input
                className={styles.input}
                type="text"
                value={roomId}
                onChange={e => {setRoomId(e.target.value)}}
                placeholder='Enter a code' />
            <button className={styles.joinBtn} onClick={joinRoom}>Join</button>
            <button className={styles.shareBtn} onClick={copyId} disabled={roomId === ""? true : false}><BsShareFill/></button>      
        </div>
    )
}