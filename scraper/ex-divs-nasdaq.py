import time
import csv
import json
import os
from datetime import date, timedelta
from urllib.parse import urljoin

from selenium import webdriver
from selenium.common.exceptions import (
    TimeoutException,
    StaleElementReferenceException
)
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


# ============================================================
# SETUP
# ============================================================

driver = webdriver.Chrome()
wait = WebDriverWait(driver, 15)

URL = "https://www.nasdaq.com/market-activity/dividends"
BASE_URL = "https://www.nasdaq.com"

driver.get(URL)

print("Loaded Nasdaq dividend page")

# Give the JavaScript application time to render
time.sleep(5)


# ============================================================
# COOKIE POPUP
# ============================================================

try:

    accept_btn = WebDriverWait(driver, 5).until(
        EC.element_to_be_clickable(
            (By.ID, "onetrust-accept-btn-handler")
        )
    )

    accept_btn.click()

    print("Cookie popup accepted.")

except TimeoutException:

    print("No cookie popup appeared.")


# ============================================================
# DETERMINE TARGET DATE
# ============================================================

today = date.today()

# ------------------------------------------------------------
# INITIAL TARGET DATE LOGIC
#
# Monday    -> Wednesday
# Tuesday   -> Thursday
# Wednesday -> Friday
# Thursday  -> Saturday
# Friday    -> Sunday
#
# Saturday  -> Wednesday
# Sunday    -> Wednesday
#
# After the initial target is selected, the existing search
# logic moves forward one calendar day at a time whenever
# there are no dividends.
# ------------------------------------------------------------

if today.weekday() == 5:
    # Saturday -> Wednesday
    target_date = today + timedelta(days=4)

elif today.weekday() == 6:
    # Sunday -> Wednesday
    target_date = today + timedelta(days=3)

else:
    # Monday-Friday -> two days ahead
    target_date = today + timedelta(days=2)


print()
print("============================================================")
print("TARGET DATE SEARCH")
print("============================================================")

print(f"Today:          {today}")
print(f"Today weekday:  {today.strftime('%A')}")
print(f"Initial target: {target_date}")
print(
    f"Target weekday: {target_date.strftime('%A')}"
)


# ============================================================
# GET TIME BELT DATES
# ============================================================

def get_time_belt_buttons():

    return driver.find_elements(
        By.CSS_SELECTOR,
        ".time-belt__list .time-belt__item"
    )


def get_time_belt_dates():

    buttons = get_time_belt_buttons()

    results = []

    for button in buttons:

        try:

            year = int(
                button.get_attribute("data-year")
            )

            month = int(
                button.get_attribute("data-month")
            )

            day = int(
                button.get_attribute("data-day")
            )

            button_date = date(
                year,
                month,
                day
            )

            results.append(
                (button_date, button)
            )

        except Exception:

            continue

    return results


# ============================================================
# CHECK FOR DIVIDEND ROWS
# ============================================================

def get_dividend_row_count():

    try:

        table_component = driver.find_element(
            By.CSS_SELECTOR,
            "nsdq-table-sort"
        )

        shadow_root = table_component.shadow_root

        rows = shadow_root.find_elements(
            By.CSS_SELECTOR,
            'div[role="row"].table-row'
        )

        return len(rows)

    except Exception:

        return 0


# ============================================================
# CHECK FOR "NO REPORTS" MESSAGE
# ============================================================

def has_no_reports_message():

    try:

        elements = driver.find_elements(
            By.CSS_SELECTOR,
            ".dividends-calendar__no-results"
        )

        for element in elements:

            try:

                if element.is_displayed():

                    text = element.text.strip().lower()

                    if (
                        "there are no reports on this date"
                        in text
                    ):

                        return True

            except StaleElementReferenceException:

                continue

    except Exception:

        pass

    return False


# ============================================================
# CLICK A TIME-BELT DATE
# ============================================================

def click_time_belt_date(target_date):

    buttons = get_time_belt_dates()

    for button_date, button in buttons:

        if button_date == target_date:

            print()
            print(
                f"Clicking time belt date: "
                f"{target_date.strftime('%A, %B %d, %Y')}"
            )

            driver.execute_script(
                "arguments[0].click();",
                button
            )

            return True

    return False


# ============================================================
# WAIT FOR SELECTED DATE TO LOAD
# ============================================================

def wait_for_selected_date(target_date):

    print(
        f"Waiting for "
        f"{target_date.strftime('%A, %B %d, %Y')} "
        f"to load..."
    )

    def date_loaded(driver):

        try:

            buttons = get_time_belt_dates()

            for button_date, button in buttons:

                if button_date == target_date:

                    classes = (
                        button.get_attribute("class")
                        or ""
                    )

                    if "time-belt__item--active" in classes:

                        return True

        except Exception:

            return False

        return False

    try:

        WebDriverWait(
            driver,
            15
        ).until(date_loaded)

        # Give Nasdaq's table time to finish replacing contents
        time.sleep(1)

        return True

    except TimeoutException:

        print(
            "⚠️ Timed out waiting for date."
        )

        return False


# ============================================================
# CHECK WHETHER DATE HAS DIVIDENDS
# ============================================================

def date_has_dividends(target_date):

    print()
    print(
        f"Checking dividend data for "
        f"{target_date.strftime('%A, %B %d, %Y')}"
    )

    # Give the page time to settle
    time.sleep(1)

    # --------------------------------------------------------
    # EXPLICIT NO-RESULTS MESSAGE
    # --------------------------------------------------------

    if has_no_reports_message():

        print(
            "❌ There are no reports on this date."
        )

        return False

    # --------------------------------------------------------
    # ACTUAL TABLE ROWS
    # --------------------------------------------------------

    row_count = get_dividend_row_count()

    print(
        f"Dividend rows found: {row_count}"
    )

    if row_count > 0:

        print(
            "✅ Dividend data found."
        )

        return True

    # --------------------------------------------------------
    # GIVE NASDAQ A LITTLE MORE TIME
    # --------------------------------------------------------

    time.sleep(2)

    if has_no_reports_message():

        print(
            "❌ There are no reports on this date."
        )

        return False

    row_count = get_dividend_row_count()

    print(
        f"Dividend rows after second check: "
        f"{row_count}"
    )

    if row_count > 0:

        print(
            "✅ Dividend data found."
        )

        return True

    print(
        "❌ No dividend rows found."
    )

    return False


# ============================================================
# CLICK NEXT WEEK'S MONDAY
# ============================================================

def click_next_week_monday():

    current_buttons = get_time_belt_dates()

    if not current_buttons:

        raise RuntimeError(
            "Could not find time belt buttons."
        )

    # --------------------------------------------------------
    # Find the last date currently displayed
    # --------------------------------------------------------

    current_dates = [
        button_date
        for button_date, button in current_buttons
    ]

    last_date = max(current_dates)

    next_monday = (
        last_date
        + timedelta(days=1)
    )

    # --------------------------------------------------------
    # Find following Monday
    # --------------------------------------------------------

    while next_monday.weekday() != 0:

        next_monday += timedelta(days=1)

    print()
    print(
        "============================================================"
    )

    print(
        f"Current time belt ends: "
        f"{last_date}"
    )

    print(
        f"Loading next week by clicking Monday: "
        f"{next_monday}"
    )

    # --------------------------------------------------------
    # Open calendar
    # --------------------------------------------------------

    calendar_button = wait.until(
        EC.element_to_be_clickable(
            (
                By.CSS_SELECTOR,
                ".date-picker__toggle"
            )
        )
    )

    driver.execute_script(
        "arguments[0].click();",
        calendar_button
    )

    # --------------------------------------------------------
    # Find Monday in calendar
    # --------------------------------------------------------

    calendar_cells = driver.find_elements(
        By.CSS_SELECTOR,
        '.date-picker__calendar td[data-handler="selectDay"]'
    )

    monday_link = None

    for cell in calendar_cells:

        try:

            cell_year = int(
                cell.get_attribute("data-year")
            )

            cell_month = int(
                cell.get_attribute("data-month")
            )

            link = cell.find_element(
                By.CSS_SELECTOR,
                "a[data-date]"
            )

            cell_day = int(
                link.get_attribute("data-date")
            )

            candidate = date(
                cell_year,
                cell_month + 1,
                cell_day
            )

            if candidate == next_monday:

                monday_link = link

                break

        except Exception:

            continue

    if monday_link is None:

        raise RuntimeError(
            f"Could not find next Monday "
            f"{next_monday} in calendar."
        )

    print(
        "Found next week's Monday:",
        monday_link.get_attribute("aria-label")
    )

    # --------------------------------------------------------
    # CLICK MONDAY
    # --------------------------------------------------------

    driver.execute_script(
        "arguments[0].click();",
        monday_link
    )

    # --------------------------------------------------------
    # WAIT FOR NEW TIME BELT
    # --------------------------------------------------------

    print(
        "Waiting for next week's time belt..."
    )

    def new_time_belt_loaded(driver):

        try:

            buttons = get_time_belt_dates()

            dates = [
                button_date
                for button_date, button
                in buttons
            ]

            return (
                len(dates) > 0
                and next_monday in dates
            )

        except Exception:

            return False

    WebDriverWait(
        driver,
        15
    ).until(
        new_time_belt_loaded
    )

    time.sleep(1)

    print(
        "✅ New time belt loaded."
    )


# ============================================================
# FIND FIRST DATE WITH DIVIDENDS
# ============================================================

while True:

    print()
    print(
        "============================================================"
    )

    print(
        f"Looking for: "
        f"{target_date.strftime('%A, %B %d, %Y')}"
    )

    # --------------------------------------------------------
    # GET CURRENT TIME BELT
    # --------------------------------------------------------

    time_belt = get_time_belt_dates()

    if not time_belt:

        raise RuntimeError(
            "Could not read Nasdaq time belt."
        )

    available_dates = [
        button_date
        for button_date, button
        in time_belt
    ]

    first_date = min(available_dates)
    last_date = max(available_dates)

    print(
        f"Current time belt: "
        f"{first_date} → {last_date}"
    )

    # --------------------------------------------------------
    # IS TARGET DATE IN CURRENT TIME BELT?
    # --------------------------------------------------------

    if target_date not in available_dates:

        print()
        print(
            f"{target_date} is not in the "
            f"current time belt."
        )

        click_next_week_monday()

        continue

    # --------------------------------------------------------
    # CLICK TARGET DATE
    # --------------------------------------------------------

    clicked = click_time_belt_date(
        target_date
    )

    if not clicked:

        raise RuntimeError(
            f"Could not click "
            f"{target_date} in time belt."
        )

    # --------------------------------------------------------
    # WAIT FOR DATE
    # --------------------------------------------------------

    if not wait_for_selected_date(
        target_date
    ):

        raise RuntimeError(
            f"Could not load "
            f"{target_date}."
        )

    # --------------------------------------------------------
    # CHECK FOR DIVIDENDS
    # --------------------------------------------------------

    if date_has_dividends(
        target_date
    ):

        print()
        print(
            "============================================================"
        )

        print(
            "✅ FOUND VALID DIVIDEND DATE"
        )

        print(
            f"Date: {target_date}"
        )

        print(
            f"Day:  {target_date.strftime('%A')}"
        )

        print(
            "============================================================"
        )

        break

    # --------------------------------------------------------
    # NO DIVIDENDS
    #
    # Move forward one calendar day.
    # --------------------------------------------------------

    print()
    print(
        f"No dividends on {target_date}."
    )

    target_date = (
        target_date
        + timedelta(days=1)
    )

    print(
        f"Moving to {target_date}..."
    )


# ============================================================
# DISPLAY TIME BELT
# ============================================================

print()
print("============================================================")
print("TIME BELT")
print("============================================================")

time_belt_buttons = driver.find_elements(
    By.CSS_SELECTOR,
    ".time-belt__list .time-belt__item"
)

print(
    f"Time belt buttons found: "
    f"{len(time_belt_buttons)}"
)

for button in time_belt_buttons:

    print(
        button.get_attribute("aria-label"),
        "|",
        button.get_attribute("data-year"),
        button.get_attribute("data-month"),
        button.get_attribute("data-day")
    )


# ============================================================
# EXTRACT ALL DIVIDEND TABLE PAGES
# ============================================================

print()
print("============================================================")
print("DIVIDEND TABLE")
print("============================================================")

all_rows = []


while True:

    # ========================================================
    # GET A FRESH TABLE ELEMENT
    # ========================================================

    table_component = wait.until(
        EC.presence_of_element_located(
            (
                By.CSS_SELECTOR,
                "nsdq-table-sort"
            )
        )
    )

    shadow_root = table_component.shadow_root

    # ========================================================
    # GET FRESH ROWS
    # ========================================================

    rows = shadow_root.find_elements(
        By.CSS_SELECTOR,
        'div[role="row"].table-row'
    )

    print()
    print(
        f"Rows found on current page: "
        f"{len(rows)}"
    )

    # ========================================================
    # SAFETY CHECK
    # ========================================================

    if len(rows) == 0:

        print()
        print(
            "⚠️ No rows found on this page."
        )

        if has_no_reports_message():

            print(
                "Nasdaq reports no dividends "
                "for this date."
            )

        break

    # ========================================================
    # EXTRACT CURRENT PAGE
    # ========================================================

    current_page_rows = []

    for row_index in range(len(rows)):

        try:

            # ------------------------------------------------
            # RE-FETCH TABLE AND ROWS
            # ------------------------------------------------

            table_component = driver.find_element(
                By.CSS_SELECTOR,
                "nsdq-table-sort"
            )

            shadow_root = table_component.shadow_root

            fresh_rows = shadow_root.find_elements(
                By.CSS_SELECTOR,
                'div[role="row"].table-row'
            )

            row = fresh_rows[row_index]

            # ------------------------------------------------
            # GET CELLS
            # ------------------------------------------------

            cells = row.find_elements(
                By.CSS_SELECTOR,
                'div[role="cell"]'
            )

            # ------------------------------------------------
            # EXPECTED NASDAQ TABLE STRUCTURE
            #
            # 0 = Symbol
            # 1 = Name
            # 2 = Ex-Dividend Date
            # 3 = Payment Date
            # 4 = Record Date
            # 5 = Dividend
            # 6 = Historical Annual Dividend
            # 7 = Announcement Date
            # ------------------------------------------------

            if len(cells) < 8:

                print(
                    f"⚠️ Row {row_index} has only "
                    f"{len(cells)} cells. Skipping."
                )

                continue

            # ------------------------------------------------
            # EXTRACT VALUES
            # ------------------------------------------------

            ticker = cells[0].text.strip()

            company = cells[1].text.strip()

            ex_dividend_date = cells[2].text.strip()

            payment_date = cells[3].text.strip()

            record_date = cells[4].text.strip()

            amount = cells[5].text.strip()

            declaration_date = cells[7].text.strip()

            # ------------------------------------------------
            # EXTRACT TICKER URL
            # ------------------------------------------------

            ticker_url = ""

            try:

                nef_link = cells[0].find_element(
                    By.CSS_SELECTOR,
                    "nef-link"
                )

                nef_shadow_root = (
                    nef_link.shadow_root
                )

                ticker_link = (
                    nef_shadow_root.find_element(
                        By.CSS_SELECTOR,
                        "a[href]"
                    )
                )

                href = (
                    ticker_link.get_attribute(
                        "href"
                    )
                    or ""
                )

                ticker_url = urljoin(
                    BASE_URL,
                    href
                )

            except Exception as e:

                print(
                    f"⚠️ Could not extract ticker URL "
                    f"for {ticker}: {e}"
                )

                ticker_url = ""

            # ------------------------------------------------
            # BUILD FINAL OUTPUT ROW
            # ------------------------------------------------

            values = [
                ticker,
                company,
                declaration_date,
                ex_dividend_date,
                record_date,
                payment_date,
                amount,
                ticker_url
            ]

            current_page_rows.append(values)

            all_rows.append(values)

            print(values)

        except StaleElementReferenceException:

            print()
            print(
                f"⚠️ Row {row_index} became stale. "
                f"Re-fetching..."
            )

            try:

                # ------------------------------------------------
                # RE-FETCH TABLE
                # ------------------------------------------------

                table_component = driver.find_element(
                    By.CSS_SELECTOR,
                    "nsdq-table-sort"
                )

                shadow_root = (
                    table_component.shadow_root
                )

                # ------------------------------------------------
                # RE-FETCH ROWS
                # ------------------------------------------------

                fresh_rows = (
                    shadow_root.find_elements(
                        By.CSS_SELECTOR,
                        'div[role="row"].table-row'
                    )
                )

                row = fresh_rows[row_index]

                # ------------------------------------------------
                # RE-FETCH CELLS
                # ------------------------------------------------

                cells = row.find_elements(
                    By.CSS_SELECTOR,
                    'div[role="cell"]'
                )

                if len(cells) < 8:

                    print(
                        f"⚠️ Row {row_index} still has "
                        f"only {len(cells)} cells. "
                        f"Skipping."
                    )

                    continue

                # ------------------------------------------------
                # RE-EXTRACT VALUES
                # ------------------------------------------------

                ticker = cells[0].text.strip()

                company = cells[1].text.strip()

                ex_dividend_date = (
                    cells[2].text.strip()
                )

                payment_date = (
                    cells[3].text.strip()
                )

                record_date = (
                    cells[4].text.strip()
                )

                amount = (
                    cells[5].text.strip()
                )

                declaration_date = (
                    cells[7].text.strip()
                )

                # ------------------------------------------------
                # RE-EXTRACT TICKER URL
                # ------------------------------------------------

                ticker_url = ""

                try:

                    nef_link = cells[0].find_element(
                        By.CSS_SELECTOR,
                        "nef-link"
                    )

                    nef_shadow_root = (
                        nef_link.shadow_root
                    )

                    ticker_link = (
                        nef_shadow_root.find_element(
                            By.CSS_SELECTOR,
                            "a[href]"
                        )
                    )

                    href = (
                        ticker_link.get_attribute(
                            "href"
                        )
                        or ""
                    )

                    ticker_url = urljoin(
                        BASE_URL,
                        href
                    )

                except Exception:

                    ticker_url = ""

                # ------------------------------------------------
                # BUILD ROW
                # ------------------------------------------------

                values = [
                    ticker,
                    company,
                    declaration_date,
                    ex_dividend_date,
                    record_date,
                    payment_date,
                    amount,
                    ticker_url
                ]

                current_page_rows.append(values)

                all_rows.append(values)

                print(values)

            except Exception as recovery_error:

                print(
                    f"❌ Could not recover row "
                    f"{row_index}: "
                    f"{recovery_error}"
                )

                continue

    # ========================================================
    # FIND NEXT BUTTON
    # ========================================================

    try:

        next_button = wait.until(
            EC.presence_of_element_located(
                (
                    By.CSS_SELECTOR,
                    "button.pagination__next"
                )
            )
        )

    except TimeoutException:

        print()
        print("No Next button found.")

        break

    # ========================================================
    # CHECK WHETHER NEXT PAGE EXISTS
    # ========================================================

    disabled = (
        next_button.get_attribute("disabled")
    )

    if disabled is not None:

        print()
        print("No more pages.")

        break

    # ========================================================
    # SAVE CURRENT PAGE SIGNATURE
    # ========================================================

    old_first_ticker = (
        current_page_rows[0][0]
        if current_page_rows
        else None
    )

    # ========================================================
    # CLICK NEXT
    # ========================================================

    print()
    print(
        "Next page exists. Clicking Next..."
    )

    driver.execute_script(
        "arguments[0].click();",
        next_button
    )

    # ========================================================
    # WAIT FOR NEW PAGE
    # ========================================================

    print(
        "Waiting for next page to load..."
    )

    try:

        def first_ticker_changed(driver):

            try:

                table_component = (
                    driver.find_element(
                        By.CSS_SELECTOR,
                        "nsdq-table-sort"
                    )
                )

                shadow_root = (
                    table_component.shadow_root
                )

                new_rows = (
                    shadow_root.find_elements(
                        By.CSS_SELECTOR,
                        'div[role="row"].table-row'
                    )
                )

                if len(new_rows) == 0:

                    return False

                new_cells = (
                    new_rows[0].find_elements(
                        By.CSS_SELECTOR,
                        'div[role="cell"]'
                    )
                )

                if len(new_cells) == 0:

                    return False

                new_first_ticker = (
                    new_cells[0].text.strip()
                )

                return (
                    new_first_ticker
                    != old_first_ticker
                )

            except Exception:

                return False

        wait.until(
            first_ticker_changed
        )

        print(
            "Next page loaded."
        )

        time.sleep(0.5)

    except TimeoutException:

        print()
        print(
            "Timed out waiting for "
            "next page."
        )

        break


# ============================================================
# DISPLAY ALL COLLECTED ROWS
# ============================================================

print()
print("============================================================")
print("ALL DIVIDEND ROWS")
print("============================================================")

print(
    f"Total rows collected: "
    f"{len(all_rows)}"
)

for index, values in enumerate(
    all_rows,
    start=1
):

    print()
    print(
        f"{index}: {values}"
    )


# ============================================================
# MAKE SURE DATA DIRECTORY EXISTS
# ============================================================

print()
print("============================================================")
print("PREPARING DATA DIRECTORY")
print("============================================================")

data_directory = os.path.abspath("data")

os.makedirs(
    data_directory,
    exist_ok=True
)

print(
    f"Data directory: {data_directory}"
)


# ============================================================
# SAVE CSV
# ============================================================

print()
print("============================================================")
print("SAVING CSV")
print("============================================================")

csv_filename = os.path.join(
    data_directory,
    "next_divs.csv"
)

print()
print("Saving CSV to:")
print(csv_filename)

# "w" means:
# - Create file if it doesn't exist.
# - Overwrite file if it already exists.

with open(
    csv_filename,
    "w",
    newline="",
    encoding="utf-8"
) as csvfile:

    writer = csv.writer(csvfile)

    writer.writerow([
        "Ticker",
        "Company",
        "Declaration Date",
        "Ex-Dividend Date",
        "Record Date",
        "Payment Date",
        "Amount",
        "Ticker URL"
    ])

    for values in all_rows:

        writer.writerow(values)

print()
print("✅ CSV saved successfully.")

print(
    f"Rows written: "
    f"{len(all_rows)}"
)


# ============================================================
# SAVE JSON
# ============================================================

print()
print("============================================================")
print("SAVING JSON")
print("============================================================")

json_filename = os.path.join(
    data_directory,
    "next_divs.json"
)

print()
print("Saving JSON to:")
print(json_filename)

dividends = []

for values in all_rows:

    # --------------------------------------------------------
    # EXPECTED STRUCTURE
    #
    # 0 = Ticker
    # 1 = Company
    # 2 = Declaration Date
    # 3 = Ex-Dividend Date
    # 4 = Record Date
    # 5 = Payment Date
    # 6 = Amount
    # 7 = Ticker URL
    # --------------------------------------------------------

    if len(values) < 8:

        print(
            "⚠️ Skipping malformed row:"
        )

        print(values)

        continue

    dividends.append({

        "ticker": values[0],

        "company": values[1],

        "declaration_date": values[2],

        "ex_dividend_date": values[3],

        "record_date": values[4],

        "payment_date": values[5],

        "amount": values[6],

        "ticker_url": values[7]

    })


# ============================================================
# BUILD JSON OBJECT
# ============================================================

json_data = {

    "date": target_date.isoformat(),

    "dividends": dividends

}


# ============================================================
# WRITE JSON FILE
# ============================================================

# "w" means:
# - Create file if it doesn't exist.
# - Overwrite file if it already exists.

with open(
    json_filename,
    "w",
    encoding="utf-8"
) as jsonfile:

    json.dump(
        json_data,
        jsonfile,
        indent=4
    )

print()
print("✅ JSON saved successfully.")

print(
    f"Dividends written: "
    f"{len(dividends)}"
)


# ============================================================
# FINAL VERIFICATION
# ============================================================

print()
print("============================================================")
print("FINAL VERIFICATION")
print("============================================================")

print(
    f"Target date:       {target_date}"
)

print(
    f"Target weekday:    {target_date.strftime('%A')}"
)

print(
    f"Total rows:        {len(all_rows)}"
)

print(
    f"CSV rows:          {len(all_rows)}"
)

print(
    f"JSON dividends:    {len(dividends)}"
)

print()
print("CSV:")
print(csv_filename)

print()
print("JSON:")
print(json_filename)

print()
print("============================================================")
print("OUTPUT FILES READY")
print("============================================================")

print(
    "✅ data/next_divs.csv"
)

print(
    "✅ data/next_divs.json"
)


# ============================================================
# KEEP BROWSER OPEN FOR INSPECTION
# ============================================================

input(
    "\nPress ENTER to close the browser..."
)

driver.quit()