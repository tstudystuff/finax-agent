// app.js

import { letterFocus } from "./nav/letter-focus.js";
import {initTableSort} from "./ui/table-sort.js";
// ==========================================================
// ELEMENTS
// ==========================================================

const exDivDateHeader =
    document.querySelector("#exDivDate-header");

const todayDateHeader =
    document.querySelector("#today-date-header");

const previousDividendDayButton =
    document.querySelector("#previous-dividend-day");

const nextDividendDayButton =
    document.querySelector("#next-dividend-day");

const tableBody =
    document.querySelector("#dividends-table tbody");


// ==========================================================
// WEEKLY DIVIDEND STATE
// ==========================================================

let dividendDays = [];

let currentDividendDayIndex = 0;
function initMain(){
    initTableSort();
    initDividendPage();
}

// ==========================================================
// KEYBOARD NAVIGATION
// ==========================================================

document.addEventListener("keydown", e => {

    letterFocus({ e });

});


// ==========================================================
// TODAY'S ACTUAL DATE
// ==========================================================

function setTodaysDate() {

    if (!todayDateHeader) {
        return;
    }

    const today =
        new Date();

    todayDateHeader.textContent =
        today.toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
            }
        );
}


// ==========================================================
// FORMAT YYYY-MM-DD DATE
// ==========================================================

function formatDate(dateString) {

    if (!dateString) {
        return "";
    }

    const parts =
        dateString.split("-");

    if (parts.length !== 3) {
        return dateString;
    }

    const year =
        Number(parts[0]);

    const month =
        Number(parts[1]);

    const day =
        Number(parts[2]);

    const date =
        new Date(
            year,
            month - 1,
            day
        );

    return date.toLocaleDateString(
        "en-US",
        {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        }
    );
}


// ==========================================================
// UPDATE ARROW BUTTONS
// ==========================================================

function updateDividendNavigationButtons() {

    if (
        !previousDividendDayButton ||
        !nextDividendDayButton
    ) {
        return;
    }


    // Left arrow does not exist visually on first dataset.

    previousDividendDayButton.hidden =
        currentDividendDayIndex === 0;


    previousDividendDayButton.disabled =
        currentDividendDayIndex === 0;


    // Right arrow disables only when there are no more datasets.

    nextDividendDayButton.disabled =
        currentDividendDayIndex >=
        dividendDays.length - 1;


    console.log(
        "Current day index:",
        currentDividendDayIndex,
        "Total days:",
        dividendDays.length
    );
}


// ==========================================================
// CREATE DIVIDEND TABLE ROW
// ==========================================================

function createDividendRow(dividend) {

    const row =
        document.createElement("tr");


    // ======================================================
    // TICKER
    // ======================================================

    const tickerCell =
        document.createElement("td");


    const tickerLink =
        document.createElement("a");

    tickerLink.textContent =
        dividend.ticker || "";

    tickerLink.href =
        dividend.ticker_url || "#";

    tickerLink.target =
        "_blank";

    tickerLink.rel =
        "noopener noreferrer";

    tickerLink.id =
        `ticker-${dividend.ticker || ""}`
            .toLowerCase();


    tickerCell.appendChild(
        tickerLink
    );


    const yahooLink =
        document.createElement("a");

    yahooLink.textContent =
        "Yahoo";

    yahooLink.href =
        `https://finance.yahoo.com/quote/${dividend.ticker || ""}/financials/`;

    yahooLink.target =
        "_blank";

    yahooLink.rel =
        "noopener noreferrer";


    tickerCell.appendChild(
        document.createElement("br")
    );

    tickerCell.appendChild(
        yahooLink
    );

    row.appendChild(
        tickerCell
    );


    // ======================================================
    // PRICE
    // ======================================================

    const priceCell =
        document.createElement("td");

    priceCell.textContent =
        dividend.price || "";

    row.appendChild(
        priceCell
    );


    // ======================================================
    // FREQUENCY
    // ======================================================

    const frequencyCell =
        document.createElement("td");

    frequencyCell.textContent =
        dividend.dividend_frequency || "";

    row.appendChild(
        frequencyCell
    );


    // ======================================================
    // DIVIDEND AMOUNT
    // ======================================================

    const amountCell =
        document.createElement("td");

    amountCell.textContent =
        dividend.amount || "";

    row.appendChild(
        amountCell
    );


    // ======================================================
    // COMPANY
    // ======================================================

    const companyCell =
        document.createElement("td");

    companyCell.textContent =
        dividend.company || "";

    row.appendChild(
        companyCell
    );


    // ======================================================
    // PAYMENT DATE
    // ======================================================

    const paymentCell =
        document.createElement("td");

    paymentCell.textContent =
        dividend.payment_date || "";

    row.appendChild(
        paymentCell
    );


    // ======================================================
    // EX-DIVIDEND DATE
    // ======================================================

    const exDividendCell =
        document.createElement("td");

    exDividendCell.textContent =
        dividend.ex_dividend_date || "";

    row.appendChild(
        exDividendCell
    );


    return row;
}


// ==========================================================
// RENDER CURRENT DIVIDEND DATASET
// ==========================================================

function renderDividendDay() {

    if (!tableBody) {
        return;
    }


    tableBody.innerHTML =
        "";


    const day =
        dividendDays[
            currentDividendDayIndex
        ];


    console.log(
        "Rendering day:",
        day
    );


    if (!day) {

        if (exDivDateHeader) {
            exDivDateHeader.textContent = "";
        }

        updateDividendNavigationButtons();

        return;
    }


    // ======================================================
    // HEADER DATE
    // ======================================================

    if (exDivDateHeader) {

        exDivDateHeader.textContent =
            formatDate(
                day.target_date
            );

    }


    // ======================================================
    // NO DATA
    // ======================================================

    if (
        !Array.isArray(day.dividends) ||
        day.dividends.length === 0
    ) {

        const row =
            document.createElement("tr");

        const cell =
            document.createElement("td");

        cell.colSpan =
            7;

        cell.textContent =
            `No dividends for ${formatDate(day.target_date)}.`;

        row.appendChild(
            cell
        );

        tableBody.appendChild(
            row
        );

        updateDividendNavigationButtons();

        return;
    }


    // ======================================================
    // DIVIDEND ROWS
    // ======================================================

    day.dividends.forEach(
        dividend => {

            tableBody.appendChild(
                createDividendRow(
                    dividend
                )
            );

        }
    );


    updateDividendNavigationButtons();
}


// ==========================================================
// PREVIOUS DAY
// ==========================================================

function showPreviousDividendDay() {

    if (
        currentDividendDayIndex === 0
    ) {
        return;
    }


    currentDividendDayIndex--;


    renderDividendDay();
}


// ==========================================================
// NEXT DAY
// ==========================================================

function showNextDividendDay() {

    console.log(
        "RIGHT ARROW CLICKED"
    );


    if (
        currentDividendDayIndex >=
        dividendDays.length - 1
    ) {

        console.log(
            "Already on final dataset."
        );

        return;
    }


    currentDividendDayIndex++;


    renderDividendDay();
}


// ==========================================================
// BUTTON EVENTS
// ==========================================================

previousDividendDayButton?.addEventListener(
    "click",
    showPreviousDividendDay
);


nextDividendDayButton?.addEventListener(
    "click",
    showNextDividendDay
);


// ==========================================================
// INITIALIZE PAGE
// ==========================================================

async function initDividendPage() {

    // Always populate today's date independently
    // of the scraper JSON.

    setTodaysDate();


    try {

        // ==================================================
        // IMPORTANT
        // ==================================================
        //
        // Your scraper currently saves to:
        //
        // scrapers/data/next_divs.json
        //
        // Therefore the frontend must fetch THIS file.
        //

        const response =
            await fetch(
                "data/next_divs.json",
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP error: ${response.status}`
            );

        }


        const data =
            await response.json();


        console.log(
            "FULL DIVIDEND JSON:",
            data
        );


        console.log(
            "WEEKLY DAYS:",
            data.days
        );


        // ==================================================
        // WEEKLY DATA
        // ==================================================


console.log(
    "RAW JSON:",
    data
);

console.log(
    "data.days:",
    data.days
);


if (
    Array.isArray(data.days) &&
    data.days.length > 0
) {

    dividendDays =
        data.days;

}

else {

    console.error(
        "NO WEEKLY days ARRAY FOUND IN next_divs.json"
    );

    dividendDays = [
        {
            target_date:
                data.date || "",

            dividends:
                data.dividends || []
        }
    ];

}


console.log(
    "Dividend days loaded:",
    dividendDays.length
);


currentDividendDayIndex =
    0;


renderDividendDay();

    }

    catch (error) {

        console.error(
            "Error loading dividend data:",
            error
        );


        if (tableBody) {

            tableBody.innerHTML =
                `
                <tr>
                    <td colspan="7">
                        Error loading dividend data.
                    </td>
                </tr>
                `;

        }


        if (previousDividendDayButton) {

            previousDividendDayButton.hidden =
                true;

        }


        if (nextDividendDayButton) {

            nextDividendDayButton.disabled =
                true;

        }

    }
}


// ==========================================================
// START
// ==========================================================
// ==========================================================
// START
// ==========================================================

initMain()