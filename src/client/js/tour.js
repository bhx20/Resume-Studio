// Resume Studio guided walkthrough
(function () {
  const TOUR_STORAGE_KEY = 'resume_studio_tour_completed';
  const tour = document.getElementById('app-tour');
  const card = document.getElementById('app-tour-card');
  const title = document.getElementById('app-tour-title');
  const description = document.getElementById('app-tour-description');
  const stepLabel = document.getElementById('app-tour-step');
  const nextButton = document.getElementById('app-tour-next');
  const backButton = document.getElementById('app-tour-back');
  const closeButton = document.getElementById('app-tour-close');
  const skipButton = document.getElementById('app-tour-skip');
  const tourButton = document.getElementById('btn-app-tour');

  if (!tour || !card || !title || !description || !nextButton || !backButton) return;

  const steps = [
    {
      target: '#pages-container',
      title: 'Preview your resume',
      description: 'This is the live resume preview. Click any section, such as your name or summary, to open its editor on the right.'
    },
    {
      target: '#pages-container',
      title: 'Edit your information',
      description: 'Use the editor panel to update personal details, summary, skills, experience, projects, education, and custom sections. Changes are saved automatically to the local database.'
    },
    {
      target: '#pages-container',
      title: 'Reorder your sections',
      description: 'Drag a section by its drag handle to change its order. The preview updates immediately, and the new order is saved locally.'
    },
    {
      target: '#btn-set-default',
      title: 'Set your default template',
      description: 'Use Set Default to copy the sample JSON, change your data, paste it back, and save it as the template used by future section resets.'
    },
    {
      target: '#save-status',
      title: 'Automatic local saving',
      description: 'You do not need an API or a separate Save button. Resume edits are saved automatically in your browser local database.'
    },
    {
      target: '#btn-download-pdf',
      title: 'Download your resume',
      description: 'Download PDF for a print-ready resume, or use Download DOC for a Microsoft Word document. Use the zoom controls in the lower-left corner to inspect the preview first.'
    }
  ];

  let currentStep = 0;
  let activeTarget = null;

  function clearTarget() {
    if (activeTarget) activeTarget.classList.remove('app-tour-target');
    activeTarget = null;
  }

  function positionCard() {
    card.style.setProperty('left', 'auto', 'important');
    card.style.setProperty('top', '72px', 'important');
    card.style.setProperty('right', '16px', 'important');
    card.style.setProperty('transform', 'none', 'important');
  }

  function renderStep() {
    clearTarget();
    const step = steps[currentStep];
    const target = document.querySelector(step.target);
    activeTarget = target;
    if (target) target.classList.add('app-tour-target');

    stepLabel.textContent = `Step ${currentStep + 1} of ${steps.length}`;
    title.textContent = step.title;
    description.textContent = step.description;
    backButton.classList.toggle('hidden', currentStep === 0);
    nextButton.textContent = currentStep === steps.length - 1 ? 'Finish' : 'Next';

    positionCard();
  }

  function closeTour(completed) {
    clearTarget();
    tour.classList.add('hidden');
    tour.setAttribute('aria-hidden', 'true');
    if (completed) localStorage.setItem(TOUR_STORAGE_KEY, 'true');
  }

  function openTour() {
    currentStep = 0;
    tour.classList.remove('hidden');
    tour.setAttribute('aria-hidden', 'false');
    renderStep();
  }

  nextButton.addEventListener('click', () => {
    if (currentStep === steps.length - 1) {
      closeTour(true);
      return;
    }
    currentStep += 1;
    renderStep();
  });

  backButton.addEventListener('click', () => {
    if (currentStep > 0) {
      currentStep -= 1;
      renderStep();
    }
  });

  closeButton.addEventListener('click', () => closeTour(true));
  skipButton.addEventListener('click', () => closeTour(true));
  tourButton?.addEventListener('click', openTour);
  window.addEventListener('resize', () => {
    if (!tour.classList.contains('hidden')) positionCard();
  });

  if (!localStorage.getItem(TOUR_STORAGE_KEY)) {
    setTimeout(openTour, 900);
  }
})();
