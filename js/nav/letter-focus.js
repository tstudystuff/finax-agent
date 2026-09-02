// js/nav/letter-focus.js

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

    if (
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
    ) {
        return;
    }


    // ======================================================
    // GET KEY
    // ======================================================

    const key =
        e.key.toLowerCase();


    if (
        key.length !== 1 ||
        !/^[a-z0-9]$/.test(key)
    ) {
        return;
    }


    // ======================================================
    // FIND DATA-NAV-TARGET ELEMENTS
    // ======================================================

    const navTargets = [
        ...document.querySelectorAll(
            "[data-nav-target]"
        )
    ];


    // ======================================================
    // MATCH DATA-NAV-TARGET BY FIRST LETTER
    // ======================================================

    const matchingNavTargets =
        navTargets.filter(element => {

            const navValue =
                element
                    .getAttribute(
                        "data-nav-target"
                    )
                    ?.trim()
                    .toLowerCase();


            if (!navValue) {
                return false;
            }


            // Must begin with pressed key
            if (
                !navValue.startsWith(key)
            ) {
                return false;
            }


            // Ignore elements that cannot currently be used
            if (
                !isAvailableTarget(element)
            ) {
                return false;
            }


            return true;

        });


    // ======================================================
    // FIND TICKER LINKS
    // ======================================================

    const tickerLinks = [
        ...document.querySelectorAll(
            "#dividends-table tbody td:first-child > a:first-child"
        )
    ];


    // ======================================================
    // FIND MATCHING TICKERS
    // ======================================================

    const matchingTickers =
        tickerLinks.filter(link => {

            if (
                !isAvailableTarget(link)
            ) {
                return false;
            }


            const ticker =
                link.textContent
                    .trim()
                    .toLowerCase();


            return ticker.startsWith(key);

        });


    // ======================================================
    // COMBINE MATCHES
    // ======================================================

    const matching = [
        ...matchingNavTargets,
        ...matchingTickers
    ];


    // ======================================================
    // REMOVE DUPLICATES
    // ======================================================

    const uniqueMatching =
        [...new Set(matching)];


    // ======================================================
    // NOTHING MATCHED
    // ======================================================

    if (
        uniqueMatching.length === 0
    ) {

        console.log(
            `No navigation target starts with "${key}"`
        );

        lastLetterPressed = null;

        return;
    }


    // ======================================================
    // CURRENT FOCUS
    // ======================================================

    const activeElement =
        document.activeElement;


    const activeIndex =
        uniqueMatching.indexOf(
            activeElement
        );


    // ======================================================
    // DETERMINE NEXT TARGET
    // ======================================================

    let newIndex = 0;


    // ======================================================
    // NEW LETTER
    // ======================================================

    if (
        key !== lastLetterPressed
    ) {

        newIndex =
            e.shiftKey
                ? uniqueMatching.length - 1
                : 0;

    }


    // ======================================================
    // SAME LETTER
    // ======================================================

    else {

        // Current focus isn't one of the matches
        if (
            activeIndex === -1
        ) {

            newIndex =
                e.shiftKey
                    ? uniqueMatching.length - 1
                    : 0;

        }

        // Cycle backward
        else if (
            e.shiftKey
        ) {

            newIndex =
                (
                    activeIndex -
                    1 +
                    uniqueMatching.length
                ) %
                uniqueMatching.length;

        }

        // Cycle forward
        else {

            newIndex =
                (
                    activeIndex +
                    1
                ) %
                uniqueMatching.length;

        }

    }


    // ======================================================
    // FOCUS TARGET
    // ======================================================

    const target =
        uniqueMatching[
            newIndex
        ];


    if (!target) {
        return;
    }


    // ======================================================
    // MAKE NON-NATURAL ELEMENTS FOCUSABLE
    // ======================================================

    if (
        !isNaturallyFocusable(target) &&
        !target.hasAttribute("tabindex")
    ) {

        target.tabIndex = -1;

    }


    target.focus();


    lastLetterPressed =
        key;


    // ======================================================
    // DEBUG
    // ======================================================

    console.log(
        "Letter navigation:",
        {
            key,

            index:
                newIndex,

            totalMatches:
                uniqueMatching.length,

            target:
                target.getAttribute(
                    "data-nav-target"
                ) ||
                target.textContent.trim()
        }
    );

}


// ==========================================================
// IS TARGET CURRENTLY AVAILABLE?
// ==========================================================

function isAvailableTarget(element) {

    if (!element) {
        return false;
    }


    // ======================================================
    // HIDDEN ATTRIBUTE
    // ======================================================

    if (
        element.hidden
    ) {
        return false;
    }


    // ======================================================
    // DISABLED
    // ======================================================

    if (
        element.disabled
    ) {
        return false;
    }


    // ======================================================
    // ARIA HIDDEN
    // ======================================================

    if (
        element.getAttribute(
            "aria-hidden"
        ) === "true"
    ) {
        return false;
    }


    // ======================================================
    // CSS VISIBILITY
    // ======================================================

    const style =
        window.getComputedStyle(
            element
        );


    if (
        style.display === "none" ||
        style.visibility === "hidden"
    ) {
        return false;
    }


    return true;

}


// ==========================================================
// NATURALLY FOCUSABLE ELEMENT
// ==========================================================

function isNaturallyFocusable(
    element
) {

    const tag =
        element.tagName;


    if (
        tag === "BUTTON" ||
        tag === "SELECT" ||
        tag === "TEXTAREA"
    ) {
        return true;
    }


    if (
        tag === "A" &&
        element.hasAttribute("href")
    ) {
        return true;
    }


    if (
        tag === "INPUT" &&
        element.type !== "hidden"
    ) {
        return true;
    }


    return false;

}