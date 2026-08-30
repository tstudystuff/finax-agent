// app.js
import { letterFocus } from "./nav/letter-focus.js";


// ==========================================================
// KEYBOARD NAVIGATION
// ==========================================================

document.addEventListener("keydown", e => {

    letterFocus({ e });

});


// ==========================================================
// LOAD DIVIDEND DATA
// ==========================================================

document.addEventListener("DOMContentLoaded", function () {

    fetch("data/next_divs.json")

        .then(response => {

            if (!response.ok) {
                throw new Error(
                    `HTTP error: ${response.status}`
                );
            }

            return response.json();

        })

        .then(data => {

            const tableBody =
                document.querySelector(
                    "#dividends-table tbody"
                );

            const datasetDate =
                document.querySelector(
                    "#dataset-date"
                );

            if (!tableBody) {

                throw new Error(
                    "Could not find #dividends-table tbody"
                );

            }


            // ==================================================
            // DATASET DATE
            // ==================================================

            if (datasetDate) {

                datasetDate.textContent =
                    data.date || "";

            }


            // ==================================================
            // NO DATA
            // ==================================================

            if (
                !data.dividends ||
                data.dividends.length === 0
            ) {

                const row =
                    document.createElement("tr");

                const cell =
                    document.createElement("td");

                cell.colSpan = 7;

                cell.textContent =
                    "No upcoming dividends.";

                row.appendChild(cell);

                tableBody.appendChild(row);

                return;

            }


            // ==================================================
            // CREATE ROWS
            // ==================================================

            data.dividends.forEach(dividend => {

                const row =
                    document.createElement("tr");


            // ==================================================
            // 1. TICKER
            // ==================================================

            const tickerCell =
                document.createElement("td");


            // --------------------------------------------------
            // NASDAQ TICKER LINK
            // --------------------------------------------------

            const tickerLink =
                document.createElement("a");

            tickerLink.textContent =
                dividend.ticker || "";

            tickerLink.href =
                dividend.ticker_url || "#";

            tickerLink.target = "_blank";

            tickerLink.rel =
                "noopener noreferrer";

            // Give the ticker a predictable ID
            tickerLink.id =
                `ticker-${dividend.ticker || ""}`
                    .toLowerCase();

            tickerCell.appendChild(tickerLink);


                // --------------------------------------------------
                // YAHOO FINANCE LINK
                // --------------------------------------------------

                const yahooLink =
                    document.createElement("a");

                yahooLink.textContent =
                    "Yahoo";

                yahooLink.href =
                    `https://finance.yahoo.com/quote/${dividend.ticker || ""}/financials/`;

                yahooLink.target = "_blank";

                yahooLink.rel =
                    "noopener noreferrer";


                // Put Yahoo directly underneath the ticker
                tickerCell.appendChild(
                    document.createElement("br")
                );

                tickerCell.appendChild(yahooLink);


                row.appendChild(tickerCell);
                // ==================================================
                // 2. PRICE
                // ==================================================

                const priceCell =
                    document.createElement("td");

                priceCell.textContent =
                    dividend.price || "";

                row.appendChild(priceCell);


                // ==================================================
                // 3. FREQUENCY
                // ==================================================

                const frequencyCell =
                    document.createElement("td");

                frequencyCell.textContent =
                    dividend.dividend_frequency || "";

                row.appendChild(frequencyCell);


                // ==================================================
                // 4. DIVIDEND $
                // ==================================================

                const amountCell =
                    document.createElement("td");

                amountCell.textContent =
                    dividend.amount || "";

                row.appendChild(amountCell);


                // ==================================================
                // 5. COMPANY NAME
                // ==================================================

                const companyCell =
                    document.createElement("td");

                companyCell.textContent =
                    dividend.company || "";

                row.appendChild(companyCell);


                // ==================================================
                // 6. PAYMENT DATE
                // ==================================================

                const paymentCell =
                    document.createElement("td");

                paymentCell.textContent =
                    dividend.payment_date || "";

                row.appendChild(paymentCell);


                // ==================================================
                // 7. EX-DIVIDEND DATE
                // ==================================================

                const exDividendCell =
                    document.createElement("td");

                exDividendCell.textContent =
                    dividend.ex_dividend_date || "";

                row.appendChild(exDividendCell);


                // ==================================================
                // ADD ROW
                // ==================================================

                tableBody.appendChild(row);

            });

        })

        .catch(error => {

            console.error(
                "Error loading dividend data:",
                error
            );

            const tableBody =
                document.querySelector(
                    "#dividends-table tbody"
                );

            if (!tableBody) {
                return;
            }

            const errorRow =
                document.createElement("tr");

            const errorCell =
                document.createElement("td");

            errorCell.colSpan = 7;

            errorCell.textContent =
                "Error loading data.";

            errorRow.appendChild(errorCell);

            tableBody.appendChild(errorRow);

        });
// ============================================================
// TABLE SORTING
// ============================================================

const table = document.querySelector("table");
const tableBody = table.querySelector("tbody");
const sortableHeaders = table.querySelectorAll("th[data-sort]");

// Keep track of the current sorting direction
const sortDirections = {
    ticker: "asc",
    price: "asc",
    frequency: "desc",
    dividend: "asc",
    company: "asc",
    "payment-date": "asc"
};


// ============================================================
// CONVERT PRICE / MONEY TO NUMBER
// ============================================================

function parseMoney(value) {
    if (!value) {
        return 0;
    }

    const cleaned = value
        .replace(/[$,]/g, "")
        .trim();

    const number = parseFloat(cleaned);

    return Number.isNaN(number) ? 0 : number;
}


// ============================================================
// CONVERT FREQUENCY TO NUMBER
// ============================================================

function parseFrequency(value) {

    const text = value
        .toLowerCase()
        .trim();

    // Handle the labels produced by the scraper
    if (text.includes("daily")) {
        return 365;
    }

    if (text.includes("weekly")) {
        return 52;
    }

    if (
        text.includes("bi-weekly") ||
        text.includes("biweekly")
    ) {
        return 26;
    }

    if (text.includes("monthly")) {
        return 12;
    }

    if (
        text.includes("quarterly") ||
        text.includes("4 (")
    ) {
        return 4;
    }

    if (
        text.includes("semi-annual") ||
        text.includes("semiannual")
    ) {
        return 2;
    }

    if (text.includes("annual")) {
        return 1;
    }

    // Handles things such as:
    // "6 (6x/year)"
    // "3 (3x/year)"
    // "12 (Monthly)"
    const numberMatch = text.match(/^(\d+)/);

    if (numberMatch) {
        return parseInt(numberMatch[1], 10);
    }

    // Unknown frequencies go to the bottom
    return 0;
}


// ============================================================
// CONVERT DATE TO TIMESTAMP
// ============================================================

function parseDate(value) {

    if (!value) {
        return 0;
    }

    const timestamp = Date.parse(value);

    return Number.isNaN(timestamp)
        ? 0
        : timestamp;
}


// ============================================================
// GET CELL VALUE
// ============================================================

function getSortValue(row, sortType) {

    const cells = row.children;

    switch (sortType) {

        // ----------------------------------------------------
        // TICKER
        // ----------------------------------------------------

        case "ticker":
            return cells[0]
                ? cells[0].textContent.trim().toLowerCase()
                : "";


        // ----------------------------------------------------
        // PRICE
        // ----------------------------------------------------

        case "price":
            return cells[1]
                ? parseMoney(cells[1].textContent)
                : 0;


        // ----------------------------------------------------
        // FREQUENCY
        // ----------------------------------------------------

        case "frequency":
            return cells[2]
                ? parseFrequency(cells[2].textContent)
                : 0;


        // ----------------------------------------------------
        // DIVIDEND
        // ----------------------------------------------------

        case "dividend":
            return cells[3]
                ? parseMoney(cells[3].textContent)
                : 0;


        // ----------------------------------------------------
        // COMPANY
        // ----------------------------------------------------

        case "company":
            return cells[4]
                ? cells[4].textContent.trim().toLowerCase()
                : "";


        // ----------------------------------------------------
        // PAYMENT DATE
        // ----------------------------------------------------

        case "payment-date":
            return cells[5]
                ? parseDate(cells[5].textContent)
                : 0;


        default:
            return "";
    }
}


// ============================================================
// SORT TABLE
// ============================================================

function sortTable(sortType) {

    const direction = sortDirections[sortType];

    const rows = Array.from(
        tableBody.querySelectorAll("tr")
    );

    rows.sort((rowA, rowB) => {

        const valueA = getSortValue(
            rowA,
            sortType
        );

        const valueB = getSortValue(
            rowB,
            sortType
        );

        let comparison = 0;

        // ----------------------------------------------------
        // TEXT
        // ----------------------------------------------------

        if (
            typeof valueA === "string" &&
            typeof valueB === "string"
        ) {

            comparison = valueA.localeCompare(
                valueB,
                undefined,
                {
                    numeric: true,
                    sensitivity: "base"
                }
            );

        }

        // ----------------------------------------------------
        // NUMBERS / DATES
        // ----------------------------------------------------

        else {

            comparison = valueA - valueB;
        }

        return direction === "asc"
            ? comparison
            : -comparison;
    });


    // --------------------------------------------------------
    // PUT SORTED ROWS BACK INTO TABLE
    // --------------------------------------------------------

    rows.forEach(row => {
        tableBody.appendChild(row);
    });


    // --------------------------------------------------------
    // UPDATE HEADER ARROWS / ARIA
    // --------------------------------------------------------

    sortableHeaders.forEach(header => {

        const headerType = header.dataset.sort;

        header.removeAttribute("aria-sort");

        // Remove old indicator
        const oldIndicator =
            header.querySelector(".sort-indicator");

        if (oldIndicator) {
            oldIndicator.remove();
        }

        if (headerType === sortType) {

            const indicator =
                document.createElement("span");

            indicator.className =
                "sort-indicator";

            indicator.textContent =
                direction === "asc"
                    ? " ▲"
                    : " ▼";

            header.appendChild(indicator);

            header.setAttribute(
                "aria-sort",
                direction === "asc"
                    ? "ascending"
                    : "descending"
            );
        }
    });


    // --------------------------------------------------------
    // TOGGLE NEXT CLICK
    // --------------------------------------------------------

    sortDirections[sortType] =
        direction === "asc"
            ? "desc"
            : "asc";
}


// ============================================================
// CLICK + KEYBOARD NAVIGATION
// ============================================================

sortableHeaders.forEach(header => {

    // --------------------------------------------------------
    // MOUSE CLICK
    // --------------------------------------------------------

    header.addEventListener("click", () => {

        sortTable(
            header.dataset.sort
        );
    });


    // --------------------------------------------------------
    // KEYBOARD
    // --------------------------------------------------------

    header.addEventListener("keydown", event => {

        // Enter
        if (event.key === "Enter") {

            event.preventDefault();

            sortTable(
                header.dataset.sort
            );
        }
    });
});
});
