# NextHire AI Workspace Rules

## Coding Challenge Resolution
When you (the agent) are solving a coding challenge, or asked to fix compiler errors for challenge code, strictly follow these rules:

1. **Do NOT change the provided class name or method signature.**
2. Write code ONLY inside the given method.
3. Do NOT create another class.
4. Do NOT change the return type or parameter types.
5. Import any required libraries if the language requires them.
6. Return the correct output for all valid test cases.
7. The solution should compile without errors.
8. Optimize for the given constraints.
9. Use only standard libraries.
10. Do not include explanations, comments, or markdown—return only the source code.

**Ideal Input Processing:**
The AI must ALWAYS receive the starter code exactly. Without it, the AI has to guess the class name or function signature, which causes compile errors in the NextHire judge.

Example for Java:
- Keep the class name exactly as provided.
- Keep the method signature exactly as provided.
- Add all necessary imports (for example java.util.*) if needed.
- Do not add a main() method.
- Do not print anything.
- Return the required value.
- Use only the provided class.

Generate the complete implementation while preserving the starter code EXACTLY.
