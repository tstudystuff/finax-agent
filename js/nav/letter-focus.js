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
    // MATCH DATA-NAV-TARGET BY FIRST CHARACTER
    // ======================================================

    const matchingNavTargets =
        navTargets.filter(element => {

            const navValue =
                element
                    .getAttribute("data-nav-target")
                    ?.trim()
                    .toLowerCase();


            if (!navValue) {
                return false;
            }


            return navValue.startsWith(key);

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

            const ticker =
                link.textContent
                    .trim()
                    .toLowerCase();


            return ticker.startsWith(key);

        });


    // ======================================================
    // COMBINE MATCHES
    // ======================================================
    //
    // data-nav-target elements come first.
    //
    // Then ticker links.
    //

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

        lastLetterPressed =
            key;

        return;
    }


    // ======================================================
    // CURRENT FOCUS
    // ======================================================

    const activeEl =
        document.activeElement;


    const activeIndex =
        uniqueMatching.indexOf(
            activeEl
        );


    // ======================================================
    // DETERMINE NEXT TARGET
    // ======================================================

    let newIndex;


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

        if (
            activeIndex === -1
        ) {

            newIndex =
                e.shiftKey
                    ? uniqueMatching.length - 1
                    : 0;

        }

        else {

            newIndex =
                e.shiftKey

                    ? (
                        activeIndex -
                        1 +
                        uniqueMatching.length
                    ) % uniqueMatching.length

                    : (
                        activeIndex +
                        1
                    ) % uniqueMatching.length;

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
    // MAKE NON-FOCUSABLE ELEMENTS FOCUSABLE
    // ======================================================

    if (
        !isNaturallyFocusable(target) &&
        !target.hasAttribute("tabindex")
    ) {

        target.tabIndex =
            -1;

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
            target:
                target.getAttribute(
                    "data-nav-target"
                ) ||
                target.textContent.trim()
        }
    );

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