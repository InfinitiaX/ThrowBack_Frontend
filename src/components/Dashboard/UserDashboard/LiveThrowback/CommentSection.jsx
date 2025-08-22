// CommentSection.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp, faReply } from '@fortawesome/free-solid-svg-icons';
import styles from './LiveThrowback.module.css';
import api from '../../../../utils/api';
import { useAuth } from '../../../../contexts/AuthContext';

const commentsCache = { data: {}, get: (k)=>commentsCache.data[k], set: (k,v,t=60000)=>commentsCache.data[k]={value:v,expiry:Date.now()+t}, isValid:(k)=>commentsCache.data[k]?.expiry>Date.now(), clear:(k)=>{if(k)delete commentsCache.data[k];else commentsCache.data={};} };

const CommentSection = ({ streamId }) => {
  const [comments,setComments]=useState([]);
  const [page,setPage]=useState(1);
  const [hasMore,setHasMore]=useState(true);
  const [error,setError]=useState(null);
  const [isBanned,setIsBanned]=useState(false);
  const [chatDisabled,setChatDisabled]=useState(false);
  const {user}=useAuth();
  const commentsEndRef=useRef(null);
  const containerRef=useRef(null);
  const [autoRefresh,setAutoRefresh]=useState(true);

  const fetchComments=async()=>{
    if(!streamId||chatDisabled||isBanned)return;
    try{
      const res=await api.get(`/api/livechat/${streamId}`,{params:{page,limit:10}});
      if(res.data?.success && Array.isArray(res.data.data)){
        if(page===1)setComments(res.data.data);
        else{
          const prevHeight=containerRef.current?.scrollHeight||0;
          setComments(p=>[...p,...res.data.data]);
          setTimeout(()=>{
            const el=containerRef.current;
            if(el)el.scrollTop=el.scrollHeight-prevHeight+el.scrollTop;
          },0);
        }
        setHasMore(res.data.data.length===10);
      }
    }catch(e){setError('Error loading comments');}
  };

  useEffect(()=>{fetchComments();},[streamId,page]);

  useEffect(()=>{
    if(!streamId||chatDisabled||isBanned)return;
    const intv=setInterval(()=>{if(page===1&&autoRefresh)fetchComments();},15000);
    return()=>clearInterval(intv);
  },[streamId,page,chatDisabled,isBanned,autoRefresh]);

  useEffect(()=>{
    const el=containerRef.current;
    if(!el)return;
    const onScroll=()=>{
      const nearBottom=el.scrollHeight-el.scrollTop-el.clientHeight<60;
      setAutoRefresh(nearBottom);
      if(el.scrollTop<=20 && hasMore)setPage(p=>p+1);
    };
    el.addEventListener('scroll',onScroll);
    return()=>el.removeEventListener('scroll',onScroll);
  },[hasMore]);

  const handleLike=async(id)=>{
    if(!user)return;
    setComments(cs=>cs.map(c=>c._id===id?{...c,likes:c.userLiked?c.likes-1:c.likes+1,userLiked:!c.userLiked}:c));
    try{await api.post(`/api/livechat/${streamId}/messages/${id}/like`);}catch{}
  };

  return(
    <div ref={containerRef} className={styles.commentsContainer}>
      {error?<div>{error}</div>:comments.map(c=>
        <div key={c._id}>
          <span>{c.userId?.prenom}: {c.content}</span>
          <button onClick={()=>handleLike(c._id)}><FontAwesomeIcon icon={faThumbsUp}/> {c.likes}</button>
        </div>
      )}
      <div ref={commentsEndRef}/>
    </div>
  );
};
export default CommentSection;
