'use client'
import React, { useEffect, useState, useRef, MutableRefObject, use } from "react";
import { useRouter } from "next/navigation";
import Head from "next/head"
import styles from './Call.module.css';
import ChatStyles from './ChatBox.module.css';
import { MediaConnection } from "peerjs";
import { io } from "socket.io-client";
import axios from "axios";
import { BsFillCameraVideoFill, BsFillCameraVideoOffFill, BsFillMicMuteFill, BsFillMicFill, BsShareFill, BsChatLeft } from 'react-icons/bs';
import { ImPhoneHangUp } from 'react-icons/im';
import { MdPresentToAll } from 'react-icons/md';
import ChatBox from "./ChatBox";


export default function Call({ params }: { params: { id: string } }) {

  const router = useRouter();
  const roomId = params.id;
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setisVideoOff] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const localVideoRef: any = useRef();
  const socketRef = useRef<any>();
  const [peerId, setPeerId] = useState<string>('');
  const peerInstance: MutableRefObject<any> = useRef() as MutableRefObject<any>;
  const [showPopup, setShowPopup] = useState(false);
  const remoteAVStream = new Map<string, MediaStream>();
  const [thisUserName, setThisUserName] = useState<string | null>('');

  useEffect(() => {
    const roomExists = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/validate/${roomId}`);
        if (res.status === 404) {
          alert('Invalid room ID!');
          router.push('/');
        } else {
          navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((localStream: MediaStream) => {
              localVideoRef.current.srcObject = localStream;
            })
            .catch((err: any) => {
              alert('Failed to access Media!' + err);
            });
        }
      } catch (err) {
        router.push('/');
      }
    };
    roomExists();

    //Get username
    var enteredUserName = prompt('Enter your name');
    while (enteredUserName === null || enteredUserName === '') {
      enteredUserName = prompt('Enter your name');
    }
    const myName = enteredUserName;
    setThisUserName(myName);

    //Establish connection
    const Peer = require("peerjs").default;

    const socket = io(`${process.env.NEXT_PUBLIC_SERVER_URL}`, {
      path: '/soc',
      auth: {
        token: myName
      }
    });
    socketRef.current = socket;

    peerInstance.current = new Peer();

    peerInstance.current.on('open', (pid: string) => {
      setPeerId(() => { return pid });
      socket.emit('joinRoom', roomId, pid, myName);
    });

    socket.on('room-full', () => {
      alert('Room Full');
      router.push('/');
    });


    const remoteVideoElements = new Map<string, HTMLDivElement>();

    // Function to handle a new user joining
    const handleNewUser = async (newUserName: string, remotepeer: string) => {
      const localVideo = localVideoRef.current!;
      const metaData = { username: myName };
      const options = { metadata: { "username": `${myName}` } };
      const call: MediaConnection = peerInstance.current.call(remotepeer, localVideo.srcObject as MediaStream, options);

      call.on('stream', (remoteStream) => {
        remoteAVStream.set(remotepeer, remoteStream);

        if (!remoteVideoElements.has(remotepeer)) {
          const newUser = createRemoteVideoElement(remotepeer, remoteStream, newUserName);
          remoteVideoElements.set(remotepeer, newUser);
          appendVideoElement(newUser);
        }
      });

      call.on('close', () => {
        handleUserLeft(remotepeer);
      });
    };

    // Function to handle a user leaving
    const handleUserLeft = (user: string) => {
      const video = remoteVideoElements.get(user);

      if (video) {
        video.parentNode!.removeChild(video);
        remoteVideoElements.delete(user);
      }

      remoteAVStream.delete(user);

    };

    // Function to create a remote video element
    const createRemoteVideoElement = (userId: string, stream: MediaStream, newUserName: string) => {

      const newUser = document.createElement('div');

      const newUserNameElement = document.createElement('p');
      newUserNameElement.className = styles.userName;
      newUserNameElement.innerHTML = newUserName;

      const newUserVideo = document.createElement('video');
      newUserVideo.className = styles.userVideo;
      newUserVideo.srcObject = stream;
      newUserVideo.id = userId;
      newUserVideo.autoplay = true;
      newUserVideo.playsInline = true;
      newUserVideo.controls = false;

      newUser.appendChild(newUserVideo);
      newUser.appendChild(newUserNameElement);

      return newUser;
    };

    // Function to append a video element to the videos container
    const appendVideoElement = (videoElement: HTMLDivElement) => {
      const videos = document.getElementById('videos');
      videos?.appendChild(videoElement);
    };

    // Event handler for new-user socket event
    socket.on('new-user', async (user: string, remotepeer: string) => {
      await handleNewUser(user, remotepeer);
    });

    //Event handler for message socket event
    socket.on('incoming-message', (user: string, message: string) => {
      const newMessage = document.createElement('div');
      newMessage.className = ChatStyles.chatBoxMessage;

      const sender = document.createElement('p');
      sender.className = ChatStyles.chatBoxMessageSender;
      sender.innerHTML = user;

      const text = document.createElement('p');
      text.className = ChatStyles.chatBoxMessageText;
      text.innerHTML = message;

      newMessage.appendChild(sender);
      newMessage.appendChild(text);

      const chatBoxBody = document.getElementById('chatBoxBody');
      chatBoxBody?.appendChild(newMessage);

    });

    // Event handler for user-left socket event
    socket.on('user-left', (user: string) => {
      handleUserLeft(user);
    });

    // Event handler for incoming calls
    peerInstance.current.on('call', (call: MediaConnection) => {
      const localVideo = localVideoRef.current!;
      const localStream = localVideo.srcObject as MediaStream;

      call.answer(localStream);


      call.on('stream', (remoteStream): void => {
        const incomingUserName = call.metadata.username;
        remoteAVStream.set(call.peer, remoteStream);

        if (!remoteVideoElements.has(call.peer)) {
          const newUser = createRemoteVideoElement(call.peer, remoteStream, incomingUserName);
          remoteVideoElements.set(call.peer, newUser);
          appendVideoElement(newUser);
        }
      });

      call.on('close', () => {
        handleUserLeft(call.peer);
      });
    });
    //Cleanup
    window.onbeforeunload = () => {
      disconnect();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const disconnect = () => {
    const localVideo = localVideoRef.current;
    const localStream = localVideo.srcObject as MediaStream;
    const tracks = localStream.getTracks();

    tracks.forEach((track: MediaStreamTrack) => {
      track.stop();
    });

    localVideo.srcObject = null;
    peerInstance.current.destroy();
    socketRef.current.emit('leave-room', roomId, peerId);
  }


  const hangUp = () => {
    disconnect();
    router.push('/');
  }

  const shareScreen = () => {

    const localVideo = localVideoRef.current;
    const localStream = localVideo.srcObject as MediaStream;
    const tracks = localStream.getTracks()[0];

    navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      .then((localStream: MediaStream) => {

        localVideoRef.current.srcObject = localStream;
        tracks.stop();
        setIsSharingScreen(true);

        localStream.getVideoTracks()[0].onended = () => {
          navigator.mediaDevices.getUserMedia({ video: true, audio: (isMuted) ? false : true })
            .then((localStream: MediaStream) => {
              if (isVideoOff) toggleVideo();
              localVideoRef.current.srcObject = localStream;
            })
            .catch((err: any) => {
              alert('Failed to get local stream' + err);
            });
          setIsSharingScreen(false);
        }

      })
      .catch((err: any) => {
        setIsSharingScreen(false);
        alert('Failed to get local stream' + err);
      });
  }

  const toggleVideo = () => {
    setisVideoOff(!isVideoOff);
    const localVideo = localVideoRef.current;
    const localStream = localVideo.srcObject as MediaStream;
    const tracks = localStream.getTracks();

    tracks.forEach((track: MediaStreamTrack) => {
      if (track.kind === 'video') {
        if (isVideoOff) {
          navigator.mediaDevices.getUserMedia({ video: true, audio: (isMuted) ? false : true })
            .then((localStream: MediaStream) => {
              localVideoRef.current.srcObject = localStream;
              setisVideoOff(false);
            })
            .catch((err: any) => {
              alert('Failed to get local stream' + err);
            });
        }
        else {
          track.stop();
          setisVideoOff(true);
        }
      }
    });
  }

  const toggleAudio = () => {
    setIsMuted(!isMuted);
    const localVideo = localVideoRef.current;
    const localStream = localVideo.srcObject as MediaStream;
    const tracks = localStream.getTracks();

    tracks.forEach((track: MediaStreamTrack) => {
      if (track.kind === 'audio') {
        if (isMuted) {
          navigator.mediaDevices.getUserMedia({ video: (isVideoOff) ? false : true, audio: true })
            .then((localStream: MediaStream) => {
              localVideoRef.current.srcObject = localStream;
              setIsMuted(false);
            })
            .catch((err: any) => {
              alert('Failed to get local stream' + err);
            });
        }
        else {
          track.stop();
          setIsMuted(true);
        }
      }
    });
  }

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);
  }

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  }


  const sendMessage = () => {
    const message = (document.getElementById('messageInput') as HTMLInputElement).value;
    socketRef.current.emit('message', thisUserName, message);
  }

  return (
    <main>
      <Head>
        <title>Call: {roomId}</title>
      </Head>
      <div className={styles.page}>
        <h2 className={styles.roomId}>{roomId}</h2>
        <div className={styles.userContainer} id="videos">
          <div className={styles.user}>
            <video className={styles.userVideo} ref={localVideoRef} autoPlay playsInline muted></video>
            <p className={styles.userName}>{thisUserName}(Me)</p>
          </div>
        </div>
        <div className={styles.optionsContainer}>

          <button className={(isVideoOff) ? styles.mediaBtnOff : styles.mediaBtnOn} onClick={toggleVideo}>
            {(isVideoOff) ? <BsFillCameraVideoOffFill /> : <BsFillCameraVideoFill />}
          </button>

          <button className={(isMuted) ? styles.mediaBtnOff : styles.mediaBtnOn} onClick={toggleAudio}>
            {(isMuted) ? <BsFillMicMuteFill /> : <BsFillMicFill />}
          </button>
          <button className={styles.mediaBtnOff} onClick={hangUp}><ImPhoneHangUp /></button>
          <button className={styles.shareBtn} onClick={shareScreen} disabled={(isSharingScreen) ? true : false}><MdPresentToAll /></button>
          <button className={styles.shareBtn} onClick={copyRoomId}><BsShareFill /></button>
          {showPopup && <div className={styles.popup}>Room ID Copied!</div>}
          <button className={styles.chatBtn} onClick={toggleChat}><BsChatLeft/></button>
        </div>
        <ChatBox 
          toggleChat={toggleChat}
          isChatOpen={isChatOpen}
          sendMessage={sendMessage} />
      </div>
    </main>
  )
}

