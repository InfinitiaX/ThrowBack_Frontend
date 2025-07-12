import React, { useRef, useState, useEffect } from 'react';
import './CategoryTabs.css';

const CategoryTabs = ({ categories, selectedCategory, onCategoryChange }) => {
  const tabsRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  
  // Vérifier si les flèches de navigation sont nécessaires
  useEffect(() => {
    const checkScrollPosition = () => {
      const container = tabsRef.current;
      if (container) {
        setShowLeftArrow(container.scrollLeft > 0);
        setShowRightArrow(
          container.scrollLeft < container.scrollWidth - container.clientWidth - 5
        );
      }
    };
    
    const container = tabsRef.current;
    if (container) {
      checkScrollPosition();
      container.addEventListener('scroll', checkScrollPosition);
      window.addEventListener('resize', checkScrollPosition);
      
      return () => {
        container.removeEventListener('scroll', checkScrollPosition);
        window.removeEventListener('resize', checkScrollPosition);
      };
    }
  }, [categories]);
  
  // Fonctions de défilement
  const scrollLeft = () => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };
  
  const scrollRight = () => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };
  
  // Faire défiler vers la catégorie sélectionnée
  useEffect(() => {
    const container = tabsRef.current;
    if (container) {
      const selectedTab = container.querySelector(`[data-category="${selectedCategory}"]`);
      if (selectedTab) {
        const containerRect = container.getBoundingClientRect();
        const tabRect = selectedTab.getBoundingClientRect();
        
        // Calculer la position centrale pour le tab sélectionné
        const scrollPosition = 
          selectedTab.offsetLeft - 
          (containerRect.width / 2) + 
          (tabRect.width / 2);
        
        container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
      }
    }
  }, [selectedCategory]);

  return (
    <div className="category-tabs-container">
      {showLeftArrow && (
        <button 
          className="tab-scroll-button left"
          onClick={scrollLeft}
          aria-label="Défiler vers la gauche"
        >
          <i className="fas fa-chevron-left"></i>
        </button>
      )}
      
      <div className="category-tabs" ref={tabsRef}>
        {categories.map(category => (
          <button
            key={category.id}
            data-category={category.id}
            className={`category-tab ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => onCategoryChange(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>
      
      {showRightArrow && (
        <button 
          className="tab-scroll-button right"
          onClick={scrollRight}
          aria-label="Défiler vers la droite"
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      )}
    </div>
  );
};

export default CategoryTabs;