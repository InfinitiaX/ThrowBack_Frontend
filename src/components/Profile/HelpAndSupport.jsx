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
  faHeadphones
} from '@fortawesome/free-solid-svg-icons';
import styles from './HelpAndSupport.module.css';
import { useAuth } from '../../contexts/AuthContext';

// FAQ items
const faqItems = [
  {
    question: "Comment créer une playlist?",
    answer: "Pour créer une playlist, allez dans la section 'Playlists' via le menu principal, puis cliquez sur le bouton 'Créer une playlist'. Donnez un titre à votre playlist, ajoutez une description et choisissez sa visibilité. Vous pourrez ensuite y ajouter des vidéos depuis n'importe quelle page de vidéo."
  },
  {
    question: "Comment ajouter une vidéo à ma playlist?",
    answer: "Sur chaque page de vidéo, vous trouverez un bouton 'Ajouter à la playlist'. Cliquez dessus pour afficher vos playlists existantes ou pour créer une nouvelle playlist. Vous pouvez également gérer vos playlists depuis la section 'Playlists' du menu principal."
  },
  {
    question: "Comment partager mes souvenirs (memories) avec mes amis?",
    answer: "Lorsque vous regardez une vidéo, vous pouvez ajouter un souvenir en utilisant la section 'Ajouter un souvenir' sous la vidéo. Une fois votre souvenir publié, il apparaîtra sur votre profil et dans votre flux d'activité. Vos amis verront vos souvenirs dans leur fil d'actualités. Vous pouvez également partager un souvenir spécifique en cliquant sur l'icône de partage."
  },
  {
    question: "Comment modifier mon profil?",
    answer: "Pour modifier votre profil, allez sur votre page de profil et cliquez sur le bouton 'Setting'. Vous pourrez alors modifier votre photo de profil, votre biographie, votre localisation et d'autres informations personnelles."
  },
  {
    question: "Comment trouver des vidéos d'une décennie spécifique?",
    answer: "Utilisez la fonction de recherche et les filtres disponibles dans la section 'ThrowBack Videos'. Vous pouvez filtrer par décennie, artiste ou genre musical pour trouver les vidéos qui vous intéressent."
  },
  {
    question: "Je ne peux pas lire une vidéo, que dois-je faire?",
    answer: "Si vous rencontrez des problèmes pour lire une vidéo, vérifiez votre connexion internet. Si le problème persiste, essayez d'actualiser la page. Si la vidéo reste inaccessible, elle peut être temporairement indisponible. Vous pouvez nous signaler le problème via le formulaire de contact ci-dessous."
  },
  {
    question: "Comment fonctionne le système de Live ThrowBack?",
    answer: "Live ThrowBack est notre système de diffusion en direct qui propose une programmation musicale nostalgique. Consultez le programme dans la section 'LiveThrowBack' pour connaître les horaires des émissions. Vous pouvez interagir avec d'autres auditeurs via le chat en direct pendant les diffusions."
  },
  {
    question: "Est-ce que je peux suggérer des vidéos à ajouter?",
    answer: "Absolument! Nous sommes toujours à la recherche de nouvelles vidéos à ajouter à notre bibliothèque. Utilisez le formulaire de contact ci-dessous pour nous suggérer des vidéos que vous aimeriez voir sur ThrowBack."
  }
];

// Guide sections
const guideItems = [
  {
    title: "Débuter avec ThrowBack",
    icon: faUser,
    link: "/guide/getting-started"
  },
  {
    title: "Gestion de votre profil",
    icon: faCog,
    link: "/guide/profile-management"
  },
  {
    title: "Découvrir des vidéos",
    icon: faVideo,
    link: "/guide/discover-videos"
  },
  {
    title: "Créer et gérer des playlists",
    icon: faMusic,
    link: "/guide/playlists"
  },
  {
    title: "Partager des souvenirs",
    icon: faHeart,
    link: "/guide/sharing-memories"
  },
  {
    title: "Écouter Live ThrowBack",
    icon: faHeadphones,
    link: "/guide/live-throwback"
  }
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
      setFormError("Veuillez entrer un sujet pour votre demande");
      return;
    }
    
    if (!contactForm.message.trim()) {
      setFormError("Veuillez entrer un message");
      return;
    }
    
    if (!contactForm.email.trim() || !contactForm.email.includes('@')) {
      setFormError("Veuillez entrer une adresse email valide");
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

  // Scroll to contact form
  const scrollToContactForm = () => {
    contactFormRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={styles.helpContainer}>
      <div className={styles.helpHeader}>
        <button 
          className={styles.backButton}
          onClick={() => navigate('/dashboard/profile')}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Retour au profil</span>
        </button>
        <h1 className={styles.pageTitle}>Aide et support</h1>
      </div>
      
      <div className={styles.helpContent}>
        <div className={styles.helpSidebar}>
          <div className={styles.sidebarSection}>
            <h3 className={styles.sidebarTitle}>Ressources</h3>
            <ul className={styles.sidebarLinks}>
              <li>
                <a href="#faq" className={styles.sidebarLink}>
                  <FontAwesomeIcon icon={faQuestionCircle} />
                  <span>FAQ</span>
                </a>
              </li>
              <li>
                <a href="#guide" className={styles.sidebarLink}>
                  <FontAwesomeIcon icon={faBook} />
                  <span>Guide utilisateur</span>
                </a>
              </li>
              <li>
                <a href="#contact" className={styles.sidebarLink} onClick={(e) => {
                  e.preventDefault();
                  scrollToContactForm();
                }}>
                  <FontAwesomeIcon icon={faEnvelope} />
                  <span>Nous contacter</span>
                </a>
              </li>
            </ul>
          </div>
          
          <div className={styles.sidebarSection}>
            <h3 className={styles.sidebarTitle}>Contact direct</h3>
            <div className={styles.contactInfo}>
              <div className={styles.contactItem}>
                <FontAwesomeIcon icon={faEnvelope} />
                <span>support@throwback.com</span>
              </div>
              <div className={styles.contactItem}>
                <FontAwesomeIcon icon={faPhone} />
                <span>+1 (555) 123-4567</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.helpMain}>
          <section id="faq" className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <FontAwesomeIcon icon={faQuestionCircle} />
              <span>Questions fréquentes</span>
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
          
          <section id="guide" className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <FontAwesomeIcon icon={faBook} />
              <span>Guide utilisateur</span>
            </h2>
            
            <div className={styles.guideGrid}>
              {guideItems.map((item, index) => (
                <div key={index} className={styles.guideItem}>
                  <FontAwesomeIcon icon={item.icon} className={styles.guideIcon} />
                  <h3 className={styles.guideTitle}>{item.title}</h3>
                  <a href={item.link} className={styles.guideLink}>
                    Voir le guide
                  </a>
                </div>
              ))}
            </div>
          </section>
          
          <section id="contact" className={styles.section} ref={contactFormRef}>
            <h2 className={styles.sectionTitle}>
              <FontAwesomeIcon icon={faEnvelope} />
              <span>Nous contacter</span>
            </h2>
            
            <div className={styles.contactFormContainer}>
              {formSubmitted ? (
                <div className={styles.formSuccess}>
                  <h3>Merci pour votre message!</h3>
                  <p>Nous avons bien reçu votre demande et nous vous répondrons dans les plus brefs délais.</p>
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
                      placeholder="Votre adresse email"
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="subject" className={styles.formLabel}>Sujet</label>
                    <input 
                      type="text"
                      id="subject"
                      name="subject"
                      value={contactForm.subject}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      placeholder="Sujet de votre message"
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
                      placeholder="Décrivez votre problème ou votre question en détail"
                      rows="6"
                      required
                    />
                  </div>
                  
                  <button type="submit" className={styles.submitButton}>
                    <FontAwesomeIcon icon={faPaperPlane} />
                    <span>Envoyer</span>
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