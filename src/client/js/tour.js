// Resume Studio Guided Interactive Onboarding Tour
// Calibrated end-to-end interactive tour for the canvas, drawer, drag handles, settings, and exports

(function () {
  const TOUR_STORAGE_KEY = 'resume_studio_tour_completed';

  const tourEl = document.getElementById('app-tour');
  const spotlightEl = document.getElementById('app-tour-spotlight');
  const cardEl = document.getElementById('app-tour-card');
  const titleEl = document.getElementById('app-tour-title');
  const descriptionEl = document.getElementById('app-tour-description');
  const stepLabelEl = document.getElementById('app-tour-step');
  const dotsContainerEl = document.getElementById('app-tour-dots');
  const nextBtn = document.getElementById('app-tour-next');
  const nextTextEl = document.getElementById('app-tour-next-text');
  const nextIconEl = document.getElementById('app-tour-next-icon');
  const backBtn = document.getElementById('app-tour-back');
  const closeBtn = document.getElementById('app-tour-close');
  const skipBtn = document.getElementById('app-tour-skip');
  const tourTriggerBtn = document.getElementById('btn-app-tour');

  if (!tourEl || !cardEl || !titleEl || !descriptionEl || !nextBtn) {
    return;
  }

  const steps = [
    {
      target: '#pages-container',
      title: 'Calibrated A4 Standard Canvas',
      description: 'Your resume is rendered across exact A4 pages with calibrated margins and typography. What you see here reflects the exact print output—pixel-perfect with zero awkward overflows.',
      placement: 'right',
      pad: 12,
      cardAlign: 'center',
      action: () => {
        if (typeof closeEditorPanel === 'function') closeEditorPanel();
        const scroller = document.querySelector('div[data-purpose="document-canvas-scroll"]');
        if (scroller) scroller.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    {
      target: 'header.resume-section[data-section-id="personal"]',
      title: 'Click Any Section to Edit',
      description: 'Hover over any section on your resume and click anywhere on it to open its dedicated editing drawer. Try clicking your name or contact info to customize them.',
      placement: 'bottom',
      pad: 8,
      cardAlign: 'center',
      action: () => {
        if (typeof closeEditorPanel === 'function') closeEditorPanel();
        const el = document.querySelector('header.resume-section[data-section-id="personal"]');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    {
      target: '#right-editor-panel',
      title: 'Contextual Editor Drawer',
      description: 'Every section opens in this sleek side drawer with auto-expanding form fields. Edits synchronize immediately with the canvas and persist safely in your browser database.',
      placement: 'left',
      cardAlign: 'top',
      pad: 0, // Flush boundaries with drawer perimeter to prevent gaps or offscreen clipping
      action: () => {
        if (typeof openSectionEditor === 'function') {
          openSectionEditor('personal');
        }
      }
    },
    {
      target: '.resume-section[data-section-id="summary"] .section-drag-handle',
      fallbackTarget: '.section-drag-handle',
      title: 'Drag-and-Drop Reordering',
      description: 'Grab any section by its DRAG handle to reorder sections effortlessly. The document flow and pagination instantly recalibrate across pages.',
      placement: 'bottom',
      pad: 8,
      cardAlign: 'center',
      action: () => {
        if (typeof closeEditorPanel === 'function') closeEditorPanel();
        const handle = document.querySelector('.resume-section[data-section-id="summary"] .section-drag-handle') || document.querySelector('.section-drag-handle');
        if (handle) {
          handle.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    },
    {
      target: '#inp-active-section-heading',
      title: 'Custom ATS Section Headings',
      description: 'Rename any section title directly on the canvas or via this drawer input (e.g. "TECHNICAL SKILLS MATRIX" or "SUMMARY") to match ATS keywords from target job descriptions.',
      placement: 'left',
      pad: 6,
      cardAlign: 'top',
      action: () => {
        if (typeof openSectionEditor === 'function') {
          openSectionEditor('summary');
        }
      }
    },
    {
      target: '#btn-set-default',
      title: 'Set Custom Default Template',
      description: 'Customize your master resume JSON and save it as your default template. You can reset individual sections or the entire resume whenever you want a fresh start.',
      placement: 'bottom',
      pad: 8,
      cardAlign: 'center',
      action: () => {
        if (typeof closeEditorPanel === 'function') closeEditorPanel();
      }
    },
    {
      target: '#page-fit-badge',
      fallbackTarget: '#btn-zoom-reset',
      title: 'Page Budget & Zoom Control',
      description: 'The page fit badge monitors your content height budget in real time to guarantee standard A4 delivery. Use zoom controls or Ctrl+Scroll to inspect layout details.',
      placement: 'top',
      pad: 8,
      cardAlign: 'center',
      action: () => {
        if (typeof closeEditorPanel === 'function') closeEditorPanel();
      }
    },
    {
      target: '#btn-download-pdf',
      title: 'Export to PDF & Word Docs',
      description: 'Export print-ready, high-resolution vector PDFs via server-side headless Chrome, or download fully editable Microsoft Word (.docx) documents with one click!',
      placement: 'bottom',
      pad: 8,
      cardAlign: 'center',
      action: () => {
        if (typeof closeEditorPanel === 'function') closeEditorPanel();
      }
    }
  ];

  let currentStepIndex = 0;
  let isTourActive = false;
  let activeTargetElement = null;

  function getTargetElement(step) {
    let el = document.querySelector(step.target);
    if (!el && step.fallbackTarget) {
      el = document.querySelector(step.fallbackTarget);
    }
    return el;
  }

  function renderDots() {
    if (!dotsContainerEl) return;
    dotsContainerEl.innerHTML = '';
    steps.forEach((s, idx) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `app-tour-dot ${idx === currentStepIndex ? 'active' : ''}`;
      dot.title = `Step ${idx + 1}: ${s.title}`;
      dot.setAttribute('aria-label', `Go to step ${idx + 1}: ${s.title}`);
      dot.addEventListener('click', () => {
        goToStep(idx);
      });
      dotsContainerEl.appendChild(dot);
    });
  }

  function positionCardAndSpotlight(targetEl, preferredPlacement = 'auto', customPad = 8, cardAlign = 'center') {
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;

    if (!targetEl || targetEl.offsetParent === null) {
      if (spotlightEl) spotlightEl.style.display = 'none';
      cardEl.style.position = 'fixed';
      cardEl.style.top = '50%';
      cardEl.style.left = '50%';
      cardEl.style.transform = 'translate(-50%, -50%)';
      return;
    }

    const targetRect = targetEl.getBoundingClientRect();
    const pad = customPad;

    // 1. Update Spotlight with boundary clamping
    if (spotlightEl) {
      spotlightEl.style.display = 'block';
      let sTop = Math.max(0, targetRect.top - pad);
      let sLeft = Math.max(0, targetRect.left - pad);
      let sWidth = targetRect.width + pad * 2;
      let sHeight = targetRect.height + pad * 2;

      // Ensure spotlight stays strictly inside the viewport boundaries
      if (sLeft + sWidth > viewW) {
        sWidth = Math.max(0, viewW - sLeft);
      }
      if (sTop + sHeight > viewH) {
        sHeight = Math.max(0, viewH - sTop);
      }

      spotlightEl.style.top = `${sTop}px`;
      spotlightEl.style.left = `${sLeft}px`;
      spotlightEl.style.width = `${sWidth}px`;
      spotlightEl.style.height = `${sHeight}px`;

      const computedRadius = window.getComputedStyle(targetEl).borderRadius;
      spotlightEl.style.borderRadius = computedRadius && computedRadius !== '0px' ? computedRadius : '12px';
    }

    // 2. Measure Card dimensions
    cardEl.style.transform = 'none';
    const cardRect = cardEl.getBoundingClientRect();
    const cardW = cardRect.width || 360;
    const cardH = cardRect.height || 220;
    const margin = 14;

    let placement = preferredPlacement;
    if (placement === 'auto') {
      const spaceBelow = viewH - targetRect.bottom;
      const spaceAbove = targetRect.top;
      const spaceLeft = targetRect.left;
      const spaceRight = viewW - targetRect.right;

      if (spaceBelow >= cardH + margin) {
        placement = 'bottom';
      } else if (spaceAbove >= cardH + margin) {
        placement = 'top';
      } else if (spaceLeft >= cardW + margin) {
        placement = 'left';
      } else if (spaceRight >= cardW + margin) {
        placement = 'right';
      } else {
        placement = 'bottom';
      }
    }

    let top = 0;
    let left = 0;

    if (placement === 'bottom') {
      top = targetRect.bottom + margin;
      left = targetRect.left + (targetRect.width - cardW) / 2;
    } else if (placement === 'top') {
      top = targetRect.top - cardH - margin;
      left = targetRect.left + (targetRect.width - cardW) / 2;
    } else if (placement === 'left') {
      if (cardAlign === 'top') {
        top = Math.max(16, targetRect.top + 20);
      } else {
        top = targetRect.top + (targetRect.height - cardH) / 2;
      }
      left = targetRect.left - cardW - margin;
    } else if (placement === 'right') {
      if (cardAlign === 'top') {
        top = Math.max(16, targetRect.top + 20);
      } else {
        top = targetRect.top + (targetRect.height - cardH) / 2;
      }
      left = targetRect.right + margin;
    }

    // Check collision and flip if needed
    if (placement === 'left' && left < 16) {
      if (viewW - targetRect.right >= cardW + margin) {
        left = targetRect.right + margin;
      } else if (targetRect.top >= cardH + margin) {
        top = targetRect.top - cardH - margin;
        left = Math.max(16, targetRect.left);
      } else {
        top = targetRect.bottom + margin;
        left = Math.max(16, targetRect.left);
      }
    }

    if (placement === 'bottom' && top + cardH > viewH - 16) {
      if (targetRect.top >= cardH + margin) {
        top = targetRect.top - cardH - margin;
      }
    }

    if (placement === 'top' && top < 16) {
      if (viewH - targetRect.bottom >= cardH + margin) {
        top = targetRect.bottom + margin;
      }
    }

    // Clamp inside viewport
    const minX = 16;
    const maxX = Math.max(minX, viewW - cardW - 16);
    const minY = 16;
    const maxY = Math.max(minY, viewH - cardH - 16);

    left = Math.max(minX, Math.min(maxX, left));
    top = Math.max(minY, Math.min(maxY, top));

    cardEl.style.top = `${top}px`;
    cardEl.style.left = `${left}px`;
    cardEl.style.right = 'auto';
  }

  function updateActivePosition() {
    if (!isTourActive) return;
    const step = steps[currentStepIndex];
    if (!step) return;
    const target = getTargetElement(step);
    positionCardAndSpotlight(target, step.placement, step.pad, step.cardAlign);
  }

  function goToStep(index) {
    if (index < 0 || index >= steps.length) return;
    currentStepIndex = index;
    const step = steps[currentStepIndex];

    // Update textual UI
    stepLabelEl.textContent = `Step ${currentStepIndex + 1} of ${steps.length}`;
    titleEl.textContent = step.title;
    descriptionEl.textContent = step.description;

    // Update button states
    backBtn.classList.toggle('hidden', currentStepIndex === 0);
    const isLastStep = currentStepIndex === steps.length - 1;
    if (nextTextEl) {
      nextTextEl.textContent = isLastStep ? 'Get Started!' : 'Next';
    } else {
      nextBtn.textContent = isLastStep ? 'Get Started!' : 'Next';
    }
    if (nextIconEl) {
      nextIconEl.className = isLastStep ? 'fa-solid fa-check text-[10px]' : 'fa-solid fa-arrow-right text-[10px]';
    }

    renderDots();

    // Execute step action
    if (typeof step.action === 'function') {
      step.action();
    }

    // Immediate initial positioning
    const immediateTarget = getTargetElement(step);
    activeTargetElement = immediateTarget;
    positionCardAndSpotlight(immediateTarget, step.placement, step.pad, step.cardAlign);

    // Intermediate tracking during drawer slide or smooth scroll
    setTimeout(() => {
      const midTarget = getTargetElement(step);
      activeTargetElement = midTarget;
      positionCardAndSpotlight(midTarget, step.placement, step.pad, step.cardAlign);
    }, 140);

    // Final precision position after drawer transition (350ms) has fully finished
    setTimeout(() => {
      const finalTarget = getTargetElement(step);
      activeTargetElement = finalTarget;
      positionCardAndSpotlight(finalTarget, step.placement, step.pad, step.cardAlign);
    }, 380);
  }

  function openTour() {
    isTourActive = true;
    currentStepIndex = 0;
    document.body.classList.add('tour-active');
    tourEl.classList.remove('hidden');
    tourEl.setAttribute('aria-hidden', 'false');
    goToStep(0);
  }

  function closeTour(completed = false) {
    isTourActive = false;
    activeTargetElement = null;
    document.body.classList.remove('tour-active');
    tourEl.classList.add('hidden');
    tourEl.setAttribute('aria-hidden', 'true');
    if (spotlightEl) spotlightEl.style.display = 'none';

    if (completed) {
      try {
        localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      } catch (e) {
        // Ignore localStorage restrictions
      }
    }
  }

  // Next & Back
  nextBtn.addEventListener('click', () => {
    if (currentStepIndex === steps.length - 1) {
      closeTour(true);
    } else {
      goToStep(currentStepIndex + 1);
    }
  });

  backBtn.addEventListener('click', () => {
    if (currentStepIndex > 0) {
      goToStep(currentStepIndex - 1);
    }
  });

  // Skip & Close
  if (closeBtn) closeBtn.addEventListener('click', () => closeTour(true));
  if (skipBtn) skipBtn.addEventListener('click', () => closeTour(true));

  // Trigger from Header button
  if (tourTriggerBtn) {
    tourTriggerBtn.addEventListener('click', () => {
      openTour();
    });
  }

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (!isTourActive) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeTour(true);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (currentStepIndex < steps.length - 1) {
        goToStep(currentStepIndex + 1);
      } else {
        closeTour(true);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (currentStepIndex > 0) {
        goToStep(currentStepIndex - 1);
      }
    }
  });

  // Listen to right editor panel transition end to guarantee pixel-perfect bounds
  const rightPanelEl = document.getElementById('right-editor-panel');
  if (rightPanelEl) {
    rightPanelEl.addEventListener('transitionend', () => {
      if (isTourActive) updateActivePosition();
    });
  }

  // Resize & Scroll listeners
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    if (!isTourActive) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateActivePosition, 40);
  });

  const canvasScroll = document.querySelector('div[data-purpose="document-canvas-scroll"]');
  if (canvasScroll) {
    canvasScroll.addEventListener('scroll', () => {
      if (isTourActive) updateActivePosition();
    }, { passive: true });
  }

  // Expose globally
  window.startAppTour = openTour;
  window.closeAppTour = closeTour;

  // Auto-start for first-time visitors
  window.addEventListener('DOMContentLoaded', () => {
    try {
      if (!localStorage.getItem(TOUR_STORAGE_KEY)) {
        setTimeout(() => {
          if (!isTourActive && tourEl.classList.contains('hidden')) {
            openTour();
          }
        }, 850);
      }
    } catch (e) {
      // Ignore
    }
  });
})();
