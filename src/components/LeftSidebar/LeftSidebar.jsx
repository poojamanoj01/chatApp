import React, { useContext, useEffect, useState } from 'react';
import './LeftSidebar.css';
import assets from '../../assets/assets';
import { useNavigate } from 'react-router-dom';
import { arrayUnion, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';



const LeftSidebar = () => {
  const navigate = useNavigate(); // Hook for programmatic navigation
  const { userData, chatData, chatUser, setChatUser, setMessagesId, messagesId, chatVisible, setChatVisible} = useContext(AppContext);
  const [user, setUser] = useState(null);
  const [showSearch, setShowSearch] = useState(false);



  const inputHandler = async (e) => {
    try {
      const input = e.target.value;
      if (input) {
        setShowSearch(true);
        const userRef = collection(db, 'users');

        const q = query(userRef, where("username", "==", input.toLowerCase()));
        const querySnap = await getDocs(q);


        if (!querySnap.empty && querySnap.docs[0].data().id !== userData.id) {

          let userExist = false

          chatData.map((user) => {

            if (user.rId === querySnap.docs[0].data().id) {
              userExist = true;

            }

          })

          if (!userExist) {
            setUser(querySnap.docs[0].data());

          }


        } else {
          setUser(null);
        }

      }
      else {
        setShowSearch(false)
      }


    } catch (error) {

    }
  }


  const addChat = async () => {
    const messagesRef = collection(db, "messages");
    const chatsRef = collection(db, "chats");
    try {
      const newMessageRef = doc(messagesRef);

      await setDoc(newMessageRef, {
        creatAt: serverTimestamp(),
        messages: []
      })

      await updateDoc(doc(chatsRef, user.id), {
        chatsData: arrayUnion({
          messageId: newMessageRef.id,
          lastMessage: "",
          rId: userData.id,
          updatedAt: Date.now(),
          messageSeen: true

        })
      })

      await updateDoc(doc(chatsRef, userData.id), {
        chatsData: arrayUnion({
          messageId: newMessageRef.id,
          lastMessage: "",
          rId: user.id,
          updatedAt: Date.now(),
          messageSeen: true

        })
      })


      const uSnap = await getDoc(doc(db,"users",user.id));
      const uData = uSnap.data();
      setChat({
        messagesId:newMessageRef.id,
        lastMessage:"",
        rId:user.id,
        updatedAt:Date.now(),
        messageSeen:true,
        userData:uData
      })
      setShowSearch(false)
      setChatVisible(true)


    } catch (error) {
      toast.error(error.message);
      console.error(error)

    }

  }

  const setChat = async (item) => {
    try {
      setMessagesId(item.messageId);
      setChatUser(item);
  
      // Fetch the document using the correct Firestore reference
      const userChatsRef = doc(db, 'chats', userData.id); // Ensure 'db' is from the same instance
      const userChatsSnapshot = await getDoc(userChatsRef); // Use getDoc to fetch a single document
  
      if (userChatsSnapshot.exists()) {
        const userChatsData = userChatsSnapshot.data();
  
        const chatIndex = userChatsData.chatsData.findIndex(c => c.messageId === item.messageId);
        if (chatIndex !== -1) {
          userChatsData.chatsData[chatIndex].messageSeen = true;
  
          // Update the document with the modified chatsData
          await updateDoc(userChatsRef, {
            chatsData: userChatsData.chatsData
          });
        }
      } else {
        toast.error('Chat data not found.');
      }
      setChatVisible(true);
  
    } catch (error) {
      toast.error(error.message);
    }
  };



useEffect(()=>{
  const updateChatUserData = async()=>{

    if(chatUser){
const userRef = doc(db,"users",chatUser.userData.id);
const userSnap = await getDoc(userRef);
const userData = userSnap.data();
setChatUser(prev=>({...prev,userData:userData}))

    }

  }
  updateChatUserData();

},[chatData])



  return (
    <div className={`ls ${chatVisible? "hidden": ""}`}>
      <div className="ls-top">
        <div className="ls-nav">
          <img src={assets.logo} className='logo' alt="" />
          <div className="menu">
            <img src={assets.menu_icon} alt="" />
            <div className="sub-menu">
              {/* Use the navigate function in onClick */}
              <p onClick={() => navigate('/profile')}>Edit Profile</p>
              <hr />
              <p>Logout</p>
            </div>
          </div>
        </div>
        <div className="ls-search">
          <img src={assets.search_icon} alt="" />
          <input onChange={inputHandler} type="text" placeholder='search here...' />
        </div>
      </div>

      <div className="ls-list">
        {showSearch && user ? (
          <div onClick={addChat} className='friends add-user'>
            <img src={user.avatar} alt="" />
            <p>{user.name}</p>
          </div>
        ) : (
          chatData && chatData.length > 0 ? (
            chatData.map((item, index) => (
<div onClick={() => setChat(item)} key={index} className={`friends ${item.messageSeen || item.messageId === messagesId ? "" : "border"}`}>
<img src={item.userData?.avatar || assets.default_avatar} alt="" />
                <div>
                  <p>{item.userData?.name || 'Unknown User'}</p>
                  <span>{item.lastMessage || 'No messages yet'}</span>
                </div>
              </div>
            ))
          ) : (
            <p>No chats available</p>
          )
        )}
      </div>




    </div>
  );
};

export default LeftSidebar;
