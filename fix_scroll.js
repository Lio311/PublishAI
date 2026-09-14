const fs = require('fs');
const file = 'src/components/dashboard/SystemFlowModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove the block user scroll useEffect entirely
content = content.replace(/\/\/ Block user scroll on the container during animation[\s\S]*?\}, \[isOpen, isFinished\]\);/, '');

fs.writeFileSync(file, content);
console.log("Removed scroll block");
