import React, { ReactPropTypes, useState } from 'react';
import styles from './ChatBox.module.css';

const ChatBox = ({ toggleChat, isChatOpen, sendMessage }: any) => {

    return (
        <div className={(isChatOpen) ? styles.showChatBox : styles.hideChatBox} id="chatBox">
            <div className={styles.chatBoxHeader}>
                <h3>Chat</h3>
                <button className={styles.closeChatBtn} onClick={toggleChat}>X</button>
            </div>
            <div className={styles.chatBoxBody} id="chatBoxBody">
            </div>
            <div className={styles.chatBoxFooter}>
                <input type="text" className={styles.chatBoxInput} id="messageInput" placeholder="Type a message" />
                <button className={styles.chatBoxSendBtn} onClick={sendMessage}>Send</button>
            </div>

        </div>
    );
}

export default ChatBox;
