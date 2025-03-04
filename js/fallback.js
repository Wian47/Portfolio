/**
 * Fallback script to handle cases where external libraries fail to load
 */

// Fallback for marked library
if (!window.marked) {
    console.warn('Marked library not loaded, using fallback parser');
    window.marked = {
        parse: function(text) {
            return formatMarkdown(text);
        }
    };
}
