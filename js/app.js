document.addEventListener("DOMContentLoaded", function () {
  fetch("data/next_divs.json")
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      const tableBody = document.querySelector("#dividends-table tbody");
      const datasetDate = document.querySelector("#dataset-date");

      if (!tableBody) {
        throw new Error("Could not find #dividends-table tbody");
      }

      if (datasetDate) {
        datasetDate.textContent = data.date || "";
      }

      if (!data.dividends || data.dividends.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 7;
        cell.textContent = "No upcoming dividends.";

        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
      }

      data.dividends.forEach(dividend => {
        const row = document.createElement("tr");

        const tickerCell = document.createElement("td");
        const tickerLink = document.createElement("a");

        tickerLink.textContent = dividend.ticker;
        tickerLink.href = dividend.ticker_url;
        tickerLink.target = "_blank";
        tickerLink.rel = "noopener noreferrer";

        tickerCell.appendChild(tickerLink);
        row.appendChild(tickerCell);

        row.appendChild(document.createElement("td")).textContent =
          dividend.company;

        row.appendChild(document.createElement("td")).textContent =
          dividend.declaration_date;

        row.appendChild(document.createElement("td")).textContent =
          dividend.ex_dividend_date;

        row.appendChild(document.createElement("td")).textContent =
          dividend.record_date;

        row.appendChild(document.createElement("td")).textContent =
          dividend.payment_date;

        row.appendChild(document.createElement("td")).textContent =
          dividend.amount;

        tableBody.appendChild(row);
      });
    })
    .catch(error => {
      console.error("Error loading dividend data:", error);

      const tableBody = document.querySelector("#dividends-table tbody");

      if (!tableBody) {
        return;
      }

      const errorRow = document.createElement("tr");
      const errorCell = document.createElement("td");

      errorCell.colSpan = 7;
      errorCell.textContent = "Error loading data.";

      errorRow.appendChild(errorCell);
      tableBody.appendChild(errorRow);
    });
});