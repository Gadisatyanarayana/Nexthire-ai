/**
 * Assessment Policies
 * Reusable business rules avoiding scattered conditional logic.
 */

export interface AssessmentPolicy {
  type: string;
  evaluate(context: any): boolean;
}

export class AssessmentSecurityPolicy implements AssessmentPolicy {
  type = 'SECURITY_POLICY';

  constructor(
    private readonly requireWebcam: boolean,
    private readonly allowTabSwitch: boolean,
    private readonly blockPaste: boolean
  ) {}

  evaluate(context: any): boolean {
    // Determine if the current environment/browser capabilities satisfy the security policy
    if (this.requireWebcam && !context.hasWebcamStream) return false;
    return true;
  }
}

export class AssessmentTimingPolicy implements AssessmentPolicy {
  type = 'TIMING_POLICY';

  constructor(
    private readonly hardEnforceTimeLimit: boolean,
    private readonly gracePeriodSeconds: number
  ) {}

  evaluate(context: any): boolean {
    const elapsed = context.elapsedSeconds;
    const limit = context.limitSeconds;
    if (this.hardEnforceTimeLimit && elapsed > (limit + this.gracePeriodSeconds)) {
      return false;
    }
    return true;
  }
}
