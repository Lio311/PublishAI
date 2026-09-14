const fs = require('fs');
const file = 'src/components/dashboard/SystemFlowModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = 'scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });';
const replacement = target + `

    timerRef.current = setTimeout(() => {
      setCurrentStepIndex(0);
      setAnimPhase("appearing");
    }, INITIAL_DELAY);`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
