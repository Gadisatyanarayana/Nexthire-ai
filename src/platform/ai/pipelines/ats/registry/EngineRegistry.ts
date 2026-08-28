import { ATSEngineStage } from '../types';
import { DocumentValidationEngine } from '../engines/DocumentValidationEngine';
import { RuleEngine } from '../engines/RuleEngine';
import { FormattingEngine } from '../engines/FormattingEngine';
import { ReadabilityEngine } from '../engines/ReadabilityEngine';
import { KeywordEngine } from '../engines/KeywordEngine';
import { ImpactEngine } from '../engines/ImpactEngine';
import { DuplicateContentEngine } from '../engines/DuplicateContentEngine';
import { ATSCompatibilityEngine } from '../engines/ATSCompatibilityEngine';
import { LLMReviewEngine } from '../engines/LLMReviewEngine';

export class EngineRegistry {
  static getEngines(): ATSEngineStage[] {
    return [
      new DocumentValidationEngine(),
      new RuleEngine(),
      new FormattingEngine(),
      new ReadabilityEngine(),
      new KeywordEngine(),
      new ImpactEngine(),
      new DuplicateContentEngine(),
      new ATSCompatibilityEngine(),
      new LLMReviewEngine(),
    ];
  }
}
