import { VoiceInterviewSession } from '../../contracts/voice';

export class VoiceInterviewAggregate {
  private constructor(private _session: VoiceInterviewSession, private _permissionsGranted: boolean) {}

  public static create(session: VoiceInterviewSession, permissionsGranted: boolean): VoiceInterviewAggregate {
    if (!permissionsGranted) {
      throw new Error('Cannot initialize Voice Interview without microphone permissions.');
    }
    return new VoiceInterviewAggregate(session, permissionsGranted);
  }

  public get session(): VoiceInterviewSession {
    return this._session;
  }

  public get state(): string {
    return this._session.state;
  }

  /**
   * Starts the interview if initialized.
   */
  public start(): void {
    if (this._session.state !== 'INITIALIZED') {
      throw new Error(`Cannot start interview from state: ${this._session.state}`);
    }
    this._session.state = 'IN_PROGRESS';
  }

  /**
   * Proceeds to the next question.
   */
  public nextQuestion(): void {
    if (this._session.state !== 'IN_PROGRESS') {
      throw new Error('Interview is not currently in progress.');
    }
    if (this._session.currentQuestionIndex >= this._session.questions.length - 1) {
      this._session.state = 'COMPLETED';
    } else {
      this._session.currentQuestionIndex++;
    }
  }

  /**
   * Records audio URL submission.
   */
  public addAudioUrl(url: string): void {
    if (this._session.state !== 'IN_PROGRESS') {
      throw new Error('Cannot submit audio when interview is not active.');
    }
    this._session.audioUrls.push(url);
  }
}
