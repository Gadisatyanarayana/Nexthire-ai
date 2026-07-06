import { POST as voiceInterviewPost } from "../voice-interview/route";

export async function POST(req: Request) {
	return voiceInterviewPost(req);
}
