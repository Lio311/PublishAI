const fs = require('fs');

const modalFile = 'src/components/dashboard/SystemFlowModal.tsx';
let content = fs.readFileSync(modalFile, 'utf8');

// Replace globalHasSeenPresentation with localStorage check inside the component
content = content.replace(/let globalHasSeenPresentation = false;/, '');

// Inside useEffect for opening:
content = content.replace(/if \(globalHasSeenPresentation\) \{/, `
      const hasSeen = typeof window !== 'undefined' && localStorage.getItem('publishAiHasSeenFlow') === 'true';
      if (hasSeen) {`);

// Inside useEffect for closing (on finish):
content = content.replace(/globalHasSeenPresentation = true;/, `
              if (typeof window !== 'undefined') {
                localStorage.setItem('publishAiHasSeenFlow', 'true');
              }`);

// Remove the hacky resume useEffect
content = content.replace(/\/\/ Resume from pause: re-enter the state machine[\s\S]*?\/\/ eslint-disable-next-line react-hooks\/exhaustive-deps\n  \}, \[isPaused\]\);/, '');

fs.writeFileSync(modalFile, content);
console.log("Updated SystemFlowModal.tsx");
