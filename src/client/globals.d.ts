// Global declarations for Resume Studio browser runtime

interface Window {
  [key: string]: any;
}

interface EventTarget {
  closest(selector: string): any;
  value?: any;
  tagName?: any;
  files?: any;
}

interface Event {
  dataTransfer?: any;
  relatedTarget?: any;
}

interface Element {
  dataset?: any;
  innerText?: any;
  value?: any;
  focus?(): void;
}

interface HTMLElement {
  value?: any;
  readOnly?: any;
}

declare function escapeHtml(str: any): string;
declare function getSectionTitle(data: any, key: string, fallback?: string): string;
declare function formatSectionTitle(key: string): string;
declare function formatSectionTitleDisplay(key: string): string;
declare function formatEducationLine(edu: any, escape?: (s: string) => string): string;
declare function formatEducationHtml(edu: any, escape?: (s: string) => string): string;
declare function normalizeResumeData(raw: any): any;
declare function getCandidateFilename(data: any, ext?: string): string;
declare function getEduCategory(edu: any): string;

declare function scheduleRender(): void;
declare function updateSectionHeadingEditor(secId: string): void;
declare function showToast(message: string): void;
declare function selectAndOpenSection(secId: string): void;
declare function syncActiveFormFields(): void;
declare function downloadWordHtml(data: any): void;

declare function getValidSectionOrder(): string[];
declare function renderPages(): void;
declare function setupSectionInteractions(): void;
declare function updatePageFitMeter(): void;
declare function renderCustomSectionHtml(cs: any, escape?: any, titleOverride?: any): string;
declare function renderCustomSectionBodyHtml(cs: any, escape?: any): string;
declare function jumpCurrentSection(toIdx: number): void;
declare function moveCurrentSection(direction: number): void;

