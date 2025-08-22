// CommentSection.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../../../../utils/api';
import styles from './CommentSection.module.css';

const cache = {
  data: {},
  get: k => cache.data[k],
  set: (k,v,ttl=60000)=>cache.data[k]={value:v,expiry:Date.now()+ttl},
  isValid: k => cache.data[k] && cache.data[k].expiry>Date.now(),
  clear: k=>k?delete cache.data[k]:(cache.data={})
};

const CommentSection = ({ streamId }) => {
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const containerRef = useRef();

  const fetchComments = async (pg=1) => {
    const ck = `comments_${streamId}_page_${pg}`;
    if (cache.isValid(ck)) {
      setComments(prev => pg===1 ? cache.get(ck).value : [...prev, ...cache.get(ck).value]);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get(`/api/livechat/${streamId}?page=${pg}`);
      const data = res.data;
      if (data.length === 0) setHasMore(false);
      cache.set(ck, data);
      setComments(prev => pg===1 ? data : [...prev, ...data]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ if(streamId) fetchComments(1); },[streamId]);

  // polling seulement si en bas
  useEffect(()=>{
    if(!streamId) return;
    const int = setInterval(()=>{
      if(autoRefresh) {
        cache.clear(`comments_${streamId}_page_1`);
        fetchComments(1);
      }
    },15000);
    return ()=>clearInterval(int);
  },[streamId,autoRefresh]);

  useEffect(()=>{
    const el=containerRef.current;
    if(!el) return;
    const onScroll=()=>{
      const nearBottom = el.scrollHeight-el.scrollTop-el.clientHeight<60;
      setAutoRefresh(nearBottom);
      if(el.scrollTop<=20 && hasMore && !loading) setPage(p=>p+1);
    };
    el.addEventListener('scroll',onScroll);
    return ()=>el.removeEventListener('scroll',onScroll);
  },[hasMore,loading]);

  useEffect(()=>{ if(page>1) fetchComments(page); },[page]);

  return (
    <div className={styles.commentContainer} ref={containerRef}>
      {comments.map(c=>(
        <div key={c._id} className={styles.comment}>
          <img src={c.userId.photo_profil||'/images/default-user.jpg'} alt=""/>
          <div>
            <strong>{c.userId.prenom} {c.userId.nom}</strong>
            <p>{c.content}</p>
          </div>
        </div>
      ))}
      {loading && <div>Loading...</div>}
      {!hasMore && <div>No more comments</div>}
    </div>
  );
};

export default CommentSection;
