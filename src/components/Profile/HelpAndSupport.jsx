// src/components/Profile/HelpAndSupport.jsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faQuestionCircle,
  faBook,
  faEnvelope,
  faPhone,
  faPaperPlane,
  faAngleDown,
  faAngleUp,
  faCog,
  faVideo,
  faMusic,
  faUser,
  faHeart,
  faHeadphones,
  faGlobe,
  faTools,
  faHistory,
  faUserFriends,
  faComments
} from '@fortawesome/free-solid-svg-icons';
import styles from './HelpAndSupport.module.css';
import { useAuth } from '../../contexts/AuthContext';

// FAQ items
const faqItems = [
  {
    question: "How do I create a playlist?",
    answer: "To create a playlist, go to the 'Playlists' section via the main menu, then click the 'Create a playlist' button. Give your playlist a title, add a description, and choose its visibility. You can then add videos to it from any video page."
  },
  {
    question: "How do I add a video to my playlist?",
    answer: "On each video page, you'll find an 'Add to playlist' button. Click on it to display your existing playlists or to create a new playlist. You can also manage your playlists from the 'Playlists' section in the main menu."
  },
  {
    question: "How do I share my memories with friends?",
    answer: "When watching a video, you can add a memory using the 'Add a memory' section below the video. Once your memory is published, it will appear on your profile and in your activity feed. Your friends will see your memories in their news feed. You can also share a specific memory by clicking on the share icon."
  },
  {
    question: "How do I edit my profile?",
    answer: "To edit your profile, go to your profile page and click the 'Setting' button. You can then modify your profile picture, biography, location, and other personal information."
  },
  {
    question: "How do I find videos from a specific decade?",
    answer: "Use the search function and filters available in the 'ThrowBack Videos' section. You can filter by decade, artist, or music genre to find the videos that interest you."
  },
  {
    question: "I can't play a video, what should I do?",
    answer: "If you're having trouble playing a video, check your internet connection. If the problem persists, try refreshing the page. If the video remains inaccessible, it may be temporarily unavailable. You can report the problem to us using the contact form below."
  },
  {
    question: "How does the Live ThrowBack system work?",
    answer: "Live ThrowBack is our live broadcasting system that offers nostalgic music programming. Check the schedule in the 'LiveThrowBack' section to know the broadcast times. You can interact with other listeners via the live chat during broadcasts."
  },
  {
    question: "Can I suggest videos to add?",
    answer: "Absolutely! We're always looking for new videos to add to our library. Use the contact form below to suggest videos you'd like to see on ThrowBack."
  }
];

// Guide sections - Liens réels depuis App.js
const guideItems = [
  {
    title: "Getting Started with ThrowBack",
    description: "Learn the basics of using ThrowBack and navigating the platform",
    icon: faUser,
    link: "/dashboard/profile"
  },
  {
    title: "Managing Your Profile",
    description: "Customize your profile and manage your account settings",
    icon: faCog,
    link: "/dashboard/settings"
  },
  {
    title: "Discovering Videos",
    description: "Explore our vast library of throwback music videos",
    icon: faVideo,
    link: "/dashboard/videos"
  },
  {
    title: "Creating and Managing Playlists",
    description: "Create, edit, and share your favorite playlists",
    icon: faMusic,
    link: "/dashboard/playlists"
  },
  {
    title: "Sharing on ThrowBack Wall",
    description: "Share your memories and connect with the community",
    icon: faHeart,
    link: "/dashboard/wall"
  },
  {
    title: "Listening to Live ThrowBack",
    description: "Tune in to our live streaming radio",
    icon: faHeadphones,
    link: "/dashboard/live"
  },
  {
    title: "Exploring Shorts",
    description: "Discover and share short music clips",
    icon: faVideo,
    link: "/dashboard/shorts"
  },
  {
    title: "Weekly Podcasts",
    description: "Listen to our curated weekly podcast episodes",
    icon: faHeadphones,
    link: "/dashboard/podcast"
  },
  {
    title: "Search and Discover",
    description: "Find videos, artists, and playlists",
    icon: faMusic,
    link: "/dashboard/search"
  },
  // {
  //   title: "Your History",
  //   description: "View your recently played videos and activity",
  //   icon: faHistory,
  //   link: "/dashboard/history"
  // },
  {
    title: "Chat with Friends",
    description: "Connect and chat with other ThrowBack users",
    icon: faComments,
    link: "/dashboard/chat"
  }
  // {
  //   title: "Your Favorites",
  //   description: "Access all your liked and saved content",
  //   icon: faHeart,
  //   link: "/dashboard/favorites"
  // }
];

const HelpAndSupport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    email: user?.email || ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState(null);
  const contactFormRef = useRef(null);
  const missionRef = useRef(null);
  const faqRef = useRef(null);
  const guideRef = useRef(null);

  // Variable pour contrôler l'état de la section Contact
  const contactFormEnabled = false;

  // Toggle FAQ item
  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  // Handle contact form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm({
      ...contactForm,
      [name]: value
    });
  };

  // Submit contact form
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Form validation
    if (!contactForm.subject.trim()) {
      setFormError("Please enter a subject for your request");
      return;
    }
    
    if (!contactForm.message.trim()) {
      setFormError("Please enter a message");
      return;
    }
    
    if (!contactForm.email.trim() || !contactForm.email.includes('@')) {
      setFormError("Please enter a valid email address");
      return;
    }
    
    // Simulate form submission
    setFormError(null);
    setFormSubmitted(true);
    
    // In a real app, you would send the form data to your backend here
    console.log('Form submitted:', contactForm);
    
    // Reset form after delay to simulate success
    setTimeout(() => {
      setContactForm({
        subject: '',
        message: '',
        email: user?.email || ''
      });
      setFormSubmitted(false);
    }, 3000);
  };

  // Scroll functions with smooth behavior
  const scrollToContactForm = () => {
    contactFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToMission = () => {
    missionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToFaq = () => {
    faqRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToGuide = () => {
    guideRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className={styles.helpContainer}>
      <div className={styles.helpHeader}>
       <button onClick={() => navigate(-1)} className={styles.backButton}>← Back</button>
        <h1 className={styles.pageTitle}>Help and Support</h1>
      </div>
      
      <div className={styles.helpContent}>
        <div className={styles.helpSidebar}>
          <div className={styles.sidebarSection}>
            <h3 className={styles.sidebarTitle}>Resources</h3>
            <ul className={styles.sidebarLinks}>
              <li>
                <a href="#mission" className={styles.sidebarLink} onClick={(e) => {
                  e.preventDefault();
                  scrollToMission();
                }}>
                  <FontAwesomeIcon icon={faGlobe} />
                  <span>Our Mission</span>
                </a>
              </li>
              <li>
                <a href="#faq" className={styles.sidebarLink} onClick={(e) => {
                  e.preventDefault();
                  scrollToFaq();
                }}>
                  <FontAwesomeIcon icon={faQuestionCircle} />
                  <span>FAQ</span>
                </a>
              </li>
              <li>
                <a href="#guide" className={styles.sidebarLink} onClick={(e) => {
                  e.preventDefault();
                  scrollToGuide();
                }}>
                  <FontAwesomeIcon icon={faBook} />
                  <span>User Guide</span>
                </a>
              </li>
              <li>
                <a href="#contact" className={`${styles.sidebarLink} ${!contactFormEnabled ? styles.disabled : ''}`} onClick={(e) => {
                  e.preventDefault();
                  if (contactFormEnabled) {
                    scrollToContactForm();
                  }
                }}>
                  <FontAwesomeIcon icon={faEnvelope} />
                  <span>Contact Us</span>
                </a>
              </li>
            </ul>
          </div>
          
          <div className={styles.sidebarSection}>
            <h3 className={styles.sidebarTitle}>Direct Contact</h3>
            <div className={styles.contactInfo}>
              <div className={styles.contactItem}>
                <FontAwesomeIcon icon={faEnvelope} />
                <span>support@throwback-connect.com</span>
              </div>
              {/* <div className={styles.contactItem}>
                <FontAwesomeIcon icon={faPhone} />
                <span>+16468945095</span>
              </div> */}
            </div>
          </div>
        </div>
        
        <div className={styles.helpMain}>
          <section id="mission" className={styles.section} ref={missionRef}>
            <h2 className={styles.sectionTitle}>
              <FontAwesomeIcon icon={faGlobe} />
              <span>Our Mission</span>
            </h2>
            
            <div className={styles.missionContainer}>
              <p className={styles.missionText}>
                At Throwback-Connect, our mission is to unite generations and cultures through the 
                timeless power of music by celebrating the golden eras and iconic sounds that shaped 
                the past—from Motown, 90s Hip-Hop, and classic R&B to Rock 'n' Roll, Disco, Funk, 
                Country, and beyond.
              </p>
              
              <p className={styles.missionText}>
                Curating and sharing music videos from around the world, we 
                create a global digital space where memories come alive and rhythms spark 
                connection. Whether you're vibing to Detroit soul, dancing to Kingston riddims, or 
                reminiscing with Nashville twang, or exploring Afrobeat, Reggae, French chanson, Latin 
                classics, and Japanese city pop, Throwback-Connect bridges cultures and generations, 
                bringing people together through the soundtrack of their lives—across borders and time.
              </p>
              
              <p className={styles.missionTagline}>
                Your memories. Your music. Let's connect!
              </p>
            </div>
          </section>
          
          <section id="faq" className={styles.section} ref={faqRef}>
            <h2 className={styles.sectionTitle}>
              <FontAwesomeIcon icon={faQuestionCircle} />
              <span>Frequently Asked Questions</span>
            </h2>
            
            <div className={styles.faqContainer}>
              {faqItems.map((item, index) => (
                <div key={index} className={styles.faqItem}>
                  <button 
                    className={`${styles.faqQuestion} ${expandedFaq === index ? styles.expanded : ''}`}
                    onClick={() => toggleFaq(index)}
                  >
                    <span>{item.question}</span>
                    <FontAwesomeIcon icon={expandedFaq === index ? faAngleUp : faAngleDown} />
                  </button>
                  
                  {expandedFaq === index && (
                    <div className={styles.faqAnswer}>
                      <p>{item.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
          
          <section id="guide" className={styles.section} ref={guideRef}>
            <h2 className={styles.sectionTitle}>
              <FontAwesomeIcon icon={faBook} />
              <span>User Guide</span>
            </h2>
            
            <div className={styles.guideGrid}>
              {guideItems.map((item, index) => (
                <div key={index} className={styles.guideItem}>
                  <FontAwesomeIcon icon={item.icon} className={styles.guideIcon} />
                  <h3 className={styles.guideTitle}>{item.title}</h3>
                  <p className={styles.guideDescription}>{item.description}</p>
                  <button 
                    onClick={() => navigate(item.link)} 
                    className={styles.guideLink}
                  >
                    Go to Section
                  </button>
                </div>
              ))}
            </div>
          </section>
          
          <section id="contact" className={`${styles.section} ${!contactFormEnabled ? styles.disabledSection : ''}`} ref={contactFormRef}>
            <h2 className={styles.sectionTitle}>
              <FontAwesomeIcon icon={faEnvelope} />
              <span>Contact Us</span>
            </h2>
            
            <div className={styles.contactFormContainer}>
              {!contactFormEnabled ? (
                <div className={styles.formDisabledMessage}>
                  <FontAwesomeIcon icon={faTools} className={styles.maintenanceIcon} />
                  <h3>Contact Form Coming Soon</h3>
                  <p>Our contact form is currently under maintenance. Please email us directly at <strong>support@throwback-connect.com</strong> for assistance.</p>
                </div>
              ) : formSubmitted ? (
                <div className={styles.formSuccess}>
                  <h3>Thank you for your message!</h3>
                  <p>We have received your request and will respond as soon as possible.</p>
                </div>
              ) : (
                <form className={styles.contactForm} onSubmit={handleSubmit}>
                  {formError && (
                    <div className={styles.formError}>
                      {formError}
                    </div>
                  )}
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="email" className={styles.formLabel}>Email</label>
                    <input 
                      type="email"
                      id="email"
                      name="email"
                      value={contactForm.email}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      placeholder="Your email address"
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="subject" className={styles.formLabel}>Subject</label>
                    <input 
                      type="text"
                      id="subject"
                      name="subject"
                      value={contactForm.subject}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      placeholder="Subject of your message"
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="message" className={styles.formLabel}>Message</label>
                    <textarea 
                      id="message"
                      name="message"
                      value={contactForm.message}
                      onChange={handleInputChange}
                      className={styles.formTextarea}
                      placeholder="Describe your issue or question in detail"
                      rows="6"
                      required
                    />
                  </div>
                  
                  <button type="submit" className={styles.submitButton}>
                    <FontAwesomeIcon icon={faPaperPlane} />
                    <span>Send</span>
                  </button>
                </form>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HelpAndSupport;