// js/table-sort.js


// ==========================================================
// TABLE SORTING
// ==========================================================

export function initTableSort() {

    const table =
        document.querySelector("#dividends-table");

    if (!table) {
        return;
    }


    const headers =
        table.querySelectorAll("thead th");


    headers.forEach((header, columnIndex) => {

        // Make headers keyboard-focusable
        header.tabIndex = 0;

        // Accessibility / current sort direction
        header.setAttribute(
            "aria-sort",
            "none"
        );


        // ==================================================
        // CLICK
        // ==================================================

        header.addEventListener(
            "click",
            () => {

                sortColumn(
                    table,
                    header,
                    columnIndex
                );

            }
        );


        // ==================================================
        // ENTER / SPACE
        // ==================================================

        header.addEventListener(
            "keydown",
            event => {

                if (
                    event.key !== "Enter" &&
                    event.key !== " "
                ) {
                    return;
                }


                event.preventDefault();


                sortColumn(
                    table,
                    header,
                    columnIndex
                );

            }
        );

    });

}


// ==========================================================
// SORT COLUMN
// ==========================================================

function sortColumn(
    table,
    activeHeader,
    columnIndex
) {

    const tbody =
        table.querySelector("tbody");


    if (!tbody) {
        return;
    }


    const rows =
        Array.from(
            tbody.querySelectorAll("tr")
        );


    if (rows.length < 2) {
        return;
    }


    // Ignore "No dividends" / error rows
    const sortableRows =
        rows.filter(row => {

            return (
                row.children.length >
                columnIndex
            );

        });


    if (sortableRows.length < 2) {
        return;
    }


    // ======================================================
    // DETERMINE DIRECTION
    // ======================================================

    const currentDirection =
        activeHeader.getAttribute(
            "aria-sort"
        );


    const nextDirection =
        currentDirection === "ascending"
            ? "descending"
            : "ascending";


    // Reset every other header

    table
        .querySelectorAll("thead th")
        .forEach(header => {

            header.setAttribute(
                "aria-sort",
                "none"
            );

        });


    activeHeader.setAttribute(
        "aria-sort",
        nextDirection
    );


    // ======================================================
    // DETERMINE COLUMN TYPE
    // ======================================================

    const values =
        sortableRows.map(row => {

            const cell =
                row.children[columnIndex];

            return getCellText(cell);

        });


    const columnType =
        detectColumnType(
            activeHeader.textContent,
            values
        );


    // ======================================================
    // SORT
    // ======================================================

    sortableRows.sort(
        (rowA, rowB) => {

            const cellA =
                rowA.children[columnIndex];

            const cellB =
                rowB.children[columnIndex];


            const valueA =
                getCellText(cellA);

            const valueB =
                getCellText(cellB);


            let comparison = 0;


            if (columnType === "number") {

                comparison =
                    parseNumber(valueA) -
                    parseNumber(valueB);

            }

            else if (columnType === "date") {

                comparison =
                    parseDate(valueA) -
                    parseDate(valueB);

            }

            else {

                comparison =
                    valueA.localeCompare(
                        valueB,
                        undefined,
                        {
                            numeric: true,
                            sensitivity: "base"
                        }
                    );

            }


            return nextDirection === "ascending"
                ? comparison
                : -comparison;

        }
    );


    // ======================================================
    // PUT SORTED ROWS BACK INTO TABLE
    // ======================================================

    sortableRows.forEach(row => {

        tbody.appendChild(row);

    });

}


// ==========================================================
// GET CELL TEXT
// ==========================================================

function getCellText(cell) {

    if (!cell) {
        return "";
    }


    return cell.textContent
        .trim()
        .replace(/\s+/g, " ");

}


// ==========================================================
// DETECT COLUMN TYPE
// ==========================================================

function detectColumnType(
    headerText,
    values
) {

    const header =
        headerText
            .trim()
            .toLowerCase();


    // ======================================================
    // KNOWN NUMERIC COLUMNS
    // ======================================================

    if (
        header.includes("price") ||
        header.includes("dividend $") ||
        header.includes("amount")
    ) {

        return "number";

    }


    // ======================================================
    // DATE COLUMNS
    // ======================================================

    if (
        header.includes("date")
    ) {

        return "date";

    }


    // ======================================================
    // FALLBACK AUTO-DETECTION
    // ======================================================

    const nonEmptyValues =
        values.filter(Boolean);


    if (nonEmptyValues.length === 0) {
        return "text";
    }


    const allNumbers =
        nonEmptyValues.every(value => {

            return Number.isFinite(
                parseNumber(value)
            );

        });


    if (allNumbers) {
        return "number";
    }


    return "text";

}


// ==========================================================
// PARSE NUMBER
// ==========================================================

function parseNumber(value) {

    if (!value) {
        return 0;
    }


    const cleaned =
        String(value)
            .replace(/[$,%]/g, "")
            .replace(/,/g, "")
            .trim();


    const number =
        Number(cleaned);


    return Number.isFinite(number)
        ? number
        : 0;

}


// ==========================================================
// PARSE DATE
// ==========================================================

function parseDate(value) {

    if (!value) {
        return 0;
    }


    const timestamp =
        Date.parse(value);


    return Number.isNaN(timestamp)
        ? 0
        : timestamp;

}