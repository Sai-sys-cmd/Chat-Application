import React, { useRef, useState, useEffect } from 'react';
import './App.css';
import { initializeApp } from 'firebase/app';
import { getFirestore, serverTimestamp, collection, query, orderBy, addDoc } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAtv9s1QVQAfy5qLPJU_QwDll9m_G1axPk",
  authDomain: "anonymous-chatapp-ceed9.firebaseapp.com",
  projectId: "anonymous-chatapp-ceed9",
  storageBucket: "anonymous-chatapp-ceed9.firebasestorage.app",
  messagingSenderId: "352701121118",
  appId: "1:352701121118:web:f823c67ed7e987ac56eacf",
  measurementId: "G-KM369LY3LM"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const analytics = getAnalytics(app);

const popularEmojis = ["😀", "😂", "😍", "🥺", "😢", "😎", "👍", "🙏", "🔥", "💯"];

function App() {
  const [user] = useAuthState(auth);
  const dummy = useRef();

  useEffect(() => {
    if (user) {
      dummy.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [user]);

  return (
    <div className="App">
      <header>
        <h1 className="app-title">Anonymous Chat</h1>
        {user && <SignOut />}
      </header>

      <section>
        {user ? <ChatRoom dummy={dummy} /> : <SignIn />}
      </section>
    </div>
  );
}

function SignIn() {
  const [isSigningIn, setIsSigningIn] = useState(false);

  const signInWithGoogle = async () => {
    setIsSigningIn(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error during sign-in:", error);
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <div className="sign-in-container">
      <button className="sign-in" onClick={signInWithGoogle} disabled={isSigningIn}>
        {isSigningIn ? "Signing in..." : "Sign in with Google"}
      </button>
      <p className="sign-in-message">Welcome! Feel free to speak your mind. Just keep it respectful and enjoy the conversation!</p>
    </div>
  )
}

function SignOut() {
  return auth.currentUser && (
    <button className="sign-out" onClick={() => signOut(auth)}>Sign Out</button>
  )
}

function ChatRoom({ dummy }) {
  const messagesRef = collection(firestore, 'messages');
  const messagesQuery = query(messagesRef, orderBy('createdAt'));

  const [messages] = useCollectionData(messagesQuery, { idField: 'id' });

  const [formValue, setFormValue] = useState('');
  const [image, setImage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const onEmojiClick = (emoji) => {
    setFormValue(formValue + emoji);
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    const { uid, photoURL } = auth.currentUser;

    if (!formValue.trim() && !image) {
      return;
    }

    const messageData = {
      text: formValue,
      createdAt: serverTimestamp(),
      uid,
      photoURL
    };

    if (image) {
      const imageUrl = URL.createObjectURL(image);
      messageData.imageUrl = imageUrl;
    }

    await addDoc(messagesRef, messageData);

    setFormValue('');
    setImage(null);
    dummy.current.scrollIntoView({ behavior: 'smooth' });
  }

  useEffect(() => {
    dummy.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker && !event.target.closest('.emoji-picker') && !event.target.closest('.emoji-button')) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  return (
    <>
      <main>
        <div className="messages-container">
          {messages && messages.length > 0 ? (
            messages.map(msg => <ChatMessage key={msg.id} message={msg} />)
          ) : (
            <div className="no-messages">No messages yet. Start the conversation!</div>
          )}
          <span ref={dummy}></span>
        </div>
      </main>

      <form onSubmit={sendMessage}>
        <label className="file-upload">
          <input type="file" onChange={(e) => setImage(e.target.files[0])} />
          📎
        </label>
        <input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="Type your message..." />
        <button type="button" className="emoji-button" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>😊</button>
        {showEmojiPicker && (
          <div className="emoji-picker">
            {popularEmojis.map((emoji, index) => (
              <span key={index} onClick={() => onEmojiClick(emoji)}>{emoji}</span>
            ))}
          </div>
        )}
        <button type="submit" disabled={!formValue.trim() && !image}>Send</button>
      </form>
    </>
  )
}

function ChatMessage(props) {
  const { text, uid, photoURL, imageUrl } = props.message;
  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';

  return (
    <div className={`message ${messageClass}`}>
      <img src={photoURL || 'https://api.adorable.io/avatars/23/abott@adorable.png'} alt="User Avatar" />
      <div className="message-content">
        <p>{text}</p>
        {imageUrl && <img src={imageUrl} alt="Sent Image" className="sent-image" />}
      </div>
    </div>
  )
}

export default App;