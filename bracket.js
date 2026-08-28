const fs = require('fs');
const content = fs.readFileSync('src/app/voice-interviewer/page.tsx', 'utf8');

let stack = [];
for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '{' || char === '(' || char === '[') {
        stack.push({ char, index: i });
    } else if (char === '}' || char === ')' || char === ']') {
        const last = stack.pop();
        if (!last) {
            console.log(`Unmatched closing ${char} at index ${i}`);
            break;
        }
        
        let expected = '';
        if (last.char === '{') expected = '}';
        if (last.char === '(') expected = ')';
        if (last.char === '[') expected = ']';
        
        if (char !== expected) {
            console.log(`Mismatched bracket at index ${i}. Expected ${expected} but got ${char}. Opening bracket at ${last.index}`);
            const lines = content.substring(0, last.index).split('\n');
            console.log(`Opened at line ${lines.length}`);
            break;
        }
    }
}
if (stack.length > 0) {
    const last = stack[stack.length - 1];
    const lines = content.substring(0, last.index).split('\n');
    console.log(`Unmatched opening ${last.char} at index ${last.index}, line ${lines.length}`);
} else {
    console.log("All brackets match.");
}
