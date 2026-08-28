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

});
