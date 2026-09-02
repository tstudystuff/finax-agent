// letter-focus.js

let lastLetterPressed = null;
// ==========================================================
// LETTER FOCUS
// ==========================================================
export function letterFocus({ e }) {
    if (!e || !e.key) {
        return;
    }
    // ======================================================
    // IGNORE INPUTS / TEXTAREAS
    // ======================================================
    const tag =
        e.target.tagName;
    if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        e.target.isContentEditable
    ) {
        return;
    }
    // ======================================================
    // IGNORE MODIFIERS
    // ======================================================
    if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
    }
    // ======================================================
    // GET KEY
    // ======================================================
    const key = e.key.toLowerCase();
    if ( key.length !== 1 || !/^[a-z0-9]$/.test(key)) {
        return;
    }
    // ======================================================
    // FIND TICKER LINKS
    // ======================================================
    const tickerLinks = [
        ...document.querySelectorAll(
            "#dividends-table tbody a"
        )
    ];


    // ======================================================
    // FIND MATCHING TICKERS
    // ======================================================

    const matching =
        tickerLinks.filter(link => {

            const ticker =
                link.textContent
                    .trim()
                    .toLowerCase();

            return ticker.startsWith(key);

        });


    // ======================================================
    // NOTHING MATCHED
    // ======================================================

    if (matching.length === 0) {

        console.log(
            `No ticker starts with "${key}"`
        );

        return;

    }


    // ======================================================
    // CURRENT FOCUS
    // ======================================================

    const activeEl =
        document.activeElement;

    const activeIndex =
        matching.indexOf(activeEl);


    // ======================================================
    // DETERMINE NEXT TARGET
    // ======================================================

    let newIndex;


    // New letter
    if (key !== lastLetterPressed) {

        newIndex =
            e.shiftKey
                ? matching.length - 1
                : 0;

    }

    // Same letter
    else {

        if (activeIndex === -1) {

            newIndex =
                e.shiftKey
                    ? matching.length - 1
                    : 0;

        } else {

            newIndex =
                e.shiftKey

                    ? (
                        activeIndex -
                        1 +
                        matching.length
                    ) % matching.length

                    : (
                        activeIndex +
                        1
                    ) % matching.length;

        }

    }


    // ======================================================
    // FOCUS TARGET
    // ======================================================

    const target =
        matching[newIndex];

    if (!target) {
        return;
    }


    target.focus();

    lastLetterPressed =
        key;


    // ======================================================
    // DEBUG
    // ======================================================

    console.log(
        "Focused ticker:",
        target.textContent
    );

}