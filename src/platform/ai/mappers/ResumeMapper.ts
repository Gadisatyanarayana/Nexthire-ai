import { ResumeDocument as UIResumeDocument, ResumeSection } from '../../../components/resume-builder/types';
import { v4 as uuidv4 } from 'uuid';

export class ResumeMapper {
  /**
   * Maps the raw LLM structured JSON into the UI-compatible ResumeDocument state.
   */
  static mapToUIState(aiDocument: any, userId: string, originalFileName: string): UIResumeDocument {
    const sections: ResumeSection[] = [];

    if (aiDocument.personal) {
      sections.push({
        id: uuidv4(),
        type: 'personal',
        data: aiDocument.personal,
        visible: true
      });
    }

    if (aiDocument.summary) {
      sections.push({
        id: uuidv4(),
        type: 'summary',
        data: { text: aiDocument.summary },
        visible: true
      });
    }

    if (aiDocument.experience && aiDocument.experience.length > 0) {
      sections.push({
        id: uuidv4(),
        type: 'experience',
        data: { items: aiDocument.experience.map((item: any) => ({ ...item, id: uuidv4() })) },
        visible: true
      });
    }

    if (aiDocument.education && aiDocument.education.length > 0) {
      sections.push({
        id: uuidv4(),
        type: 'education',
        data: { items: aiDocument.education.map((item: any) => ({ ...item, id: uuidv4() })) },
        visible: true
      });
    }

    if (aiDocument.projects && aiDocument.projects.length > 0) {
      sections.push({
        id: uuidv4(),
        type: 'projects',
        data: { items: aiDocument.projects.map((item: any) => ({ ...item, id: uuidv4() })) },
        visible: true
      });
    }

    if (aiDocument.skills && aiDocument.skills.length > 0) {
      sections.push({
        id: uuidv4(),
        type: 'skills',
        data: { categories: aiDocument.skills.map((item: any) => ({ ...item, id: uuidv4() })) },
        visible: true
      });
    }

    return {
      id: uuidv4(),
      version: '1.0.0',
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        targetRole: aiDocument.intelligence?.targetRoles?.[0] || 'Unknown',
        templateId: 'modern'
      },
      sections,
      theme: {
        id: 'modern',
        primaryColor: 'text-blue-600',
        accentColor: 'text-gray-500',
        backgroundColor: 'bg-white',
        headerStyle: 'modern',
        sectionDivider: 'thick',
        bulletStyle: 'square',
        borderRadius: 'rounded-md',
        iconPack: 'lucide',
        shadow: 'shadow-md',
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        headingSize: '16pt',
        bodySize: '11pt',
        lineHeight: 1.5,
        letterSpacing: 'normal',
        paragraphGap: '0.5rem',
        sectionGap: '1rem',
        pageMargins: '1in',
        columns: 1
      },
      layout: {},
      history: [],
      // Storing extra ML data that isn't strict UI state
      intelligence: aiDocument.intelligence
    };
  }
}
