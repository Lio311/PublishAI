with open("src/app/[locale]/(dashboard)/admin/architecture/ArchitectureClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# We need to remove the first occurrence of Navigation Buttons that is inside the selectedTool check.
# Let's find the string:
#               {/* Navigation Buttons */}
#               <div className="mt-auto pt-8 border-t border-slate-100 flex items-center justify-between">
# down to the next </motion.div> which is right before )}

import re

# We will match from {/* Navigation Buttons */} up to </motion.div> if it's followed by )}
# It's safer to just split by {/* Navigation Buttons */}
parts = content.split('{/* Navigation Buttons */}')

# parts[0] is everything before the first Navigation Buttons
# parts[1] is the first Navigation Buttons block
# parts[2] is the second Navigation Buttons block

if len(parts) == 3:
    # We want to remove parts[1] (which includes the inner div and </motion.div>)
    # Wait, parts[1] looks like:
    # '\n              <div className="mt-auto pt-8 ... </motion.div>\n                )}\n              </AnimatePresence>\n\n\n              '
    # Wait, the `</motion.div>` in parts[1] actually closes the tooltip! I need to keep the closing tags for the tooltip!
    pass

