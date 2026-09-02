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
    // SORT DIRECTION
    // ======================================================

    const currentDirection =
        activeHeader.getAttribute(
            "aria-sort"
        );


    const nextDirection =
        currentDirection === "ascending"
            ? "descending"
            : "ascending";


    // Reset all other headers

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
    // DETERMINE TYPE FROM HEADER
    // ======================================================

    const headerText =
        activeHeader.textContent
            .trim()
            .toLowerCase();


    const columnType =
        getColumnType(
            headerText
        );


    // ======================================================
    // SORT ROWS
    // ======================================================

    sortableRows.sort(
        (rowA, rowB) => {

            const cellA =
                rowA.children[columnIndex];

            const cellB =
                rowB.children[columnIndex];


            const valueA =
                getCellValue(
                    cellA,
                    headerText
                );


            const valueB =
                getCellValue(
                    cellB,
                    headerText
                );


            let comparison = 0;


            // ==================================================
            // NUMBER
            // ==================================================

            if (columnType === "number") {

                comparison =
                    parseNumber(valueA) -
                    parseNumber(valueB);

            }


            // ==================================================
            // DATE
            // ==================================================

            else if (columnType === "date") {

                comparison =
                    parseDate(valueA) -
                    parseDate(valueB);

            }


            // ==================================================
            // TEXT
            // ==================================================

            else {

                comparison =
                    valueA.localeCompare(
                        valueB,
                        undefined,
                        {
                            sensitivity: "base",
                            numeric: true
                        }
                    );

            }


            if (
                nextDirection === "descending"
            ) {

                comparison *= -1;

            }


            return comparison;

        }
    );


    // ======================================================
    // REINSERT ROWS
    // ======================================================

    sortableRows.forEach(row => {

        tbody.appendChild(
            row
        );

    });

}


// ==========================================================
// COLUMN TYPE
// ==========================================================

function getColumnType(headerText) {

    // ======================================================
    // NUMBER COLUMNS
    // ======================================================

    if (
        headerText.includes("price") ||
        headerText.includes("dividend $") ||
        headerText.includes("amount")
    ) {

        return "number";

    }


    // ======================================================
    // DATE COLUMNS
    // ======================================================

    if (
        headerText.includes("date")
    ) {

        return "date";

    }


    // ======================================================
    // EVERYTHING ELSE IS TEXT
    // ======================================================

    return "text";

}


// ==========================================================
// GET CELL VALUE
// ==========================================================

function getCellValue(
    cell,
    headerText
) {

    if (!cell) {
        return "";
    }


    // ======================================================
    // TICKER
    // ======================================================
    //
    // Your ticker cell contains:
    //
    // AAPL
    // Yahoo
    //
    // We only want the FIRST link's text,
    // not "AAPL Yahoo".
    //

    if (
        headerText.includes("ticker")
    ) {

        const tickerLink =
            cell.querySelector("a");

        if (tickerLink) {

            return tickerLink.textContent
                .trim()
                .toUpperCase();

        }

    }


    // ======================================================
    // NORMAL CELL
    // ======================================================

    return cell.textContent
        .trim()
        .replace(/\s+/g, " ");

}


// ==========================================================
// PARSE NUMBER
// ==========================================================

function parseNumber(value) {

    const cleaned =
        String(value)
            .replace(/\$/g, "")
            .replace(/,/g, "")
            .replace(/%/g, "")
            .trim();


    const number =
        Number(cleaned);


    if (
        Number.isNaN(number)
    ) {

        return 0;

    }


    return number;

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


    if (
        Number.isNaN(timestamp)
    ) {

        return 0;

    }


    return timestamp;

}