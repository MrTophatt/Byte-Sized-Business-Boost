(function registerBusinessDetailUtils() {
    const { DAY_KEYS } = window.businessDetailConstants;

    /**
     * Converts a lower-case weekday label into title case for UI display.
     * @param {string} day - Weekday value such as "monday".
     * @returns {string} Title-cased day label.
     */
    function formatDay(day) {
        return day.charAt(0).toUpperCase() + day.slice(1);
    }

    /**
     * Formats a date value into a readable short date string for deal ranges.
     * @param {string|Date} dateValue - Raw date from API or Date object.
     * @returns {string} Formatted date string (e.g., "Jan 4, 2026").
     */
    function formatDealDate(dateValue) {
        const date = new Date(dateValue);
        return date.toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        });
    }

    /**
     * Formats a timetable time string (24-hour) into a localized 12-hour string.
     * @param {string|null} timeValue - Raw time like "13:30".
     * @returns {string} 12-hour formatted time or "--" when unavailable.
     */
    function formatTime12Hour(timeValue) {
        if (!timeValue || typeof timeValue !== "string") return "--";

        const [hoursRaw, minutesRaw = "00"] = timeValue.split(":");
        const hours = Number(hoursRaw);
        const minutes = Number(minutesRaw);

        if (Number.isNaN(hours) || Number.isNaN(minutes)) return timeValue;

        const date = new Date();
        date.setHours(hours, minutes, 0, 0);

        return date.toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        });
    }

    /**
     * Finds today's timetable entry from a weekly timetable array.
     * @param {Array<{day: string, isClosed: boolean, opensAt: (string|null), closesAt: (string|null)}>} timetable - Weekly timetable.
     * @returns {{day: string, isClosed: boolean, opensAt: (string|null), closesAt: (string|null)}|null} Today's entry or null.
     */
    function getTodaySchedule(timetable = []) {
        const todayKey = DAY_KEYS[new Date().getDay()];
        return timetable.find((entry) => entry.day === todayKey) || null;
    }

    /**
     * Parses and validates time to minutes values so downstream code receives safe numeric input.
     * @param {string|null} timeValue Date/time input that will be parsed.
     * @returns {number|null} Numeric minute count or null for invalid values.
     */
    function parseTimeToMinutes(timeValue) {
        if (!timeValue || typeof timeValue !== "string") return null;

        const [hoursRaw, minutesRaw = "0"] = timeValue.split(":");
        const hours = Number(hoursRaw);
        const minutes = Number(minutesRaw);

        if (
            Number.isNaN(hours) ||
            Number.isNaN(minutes) ||
            hours < 0 ||
            hours > 23 ||
            minutes < 0 ||
            minutes > 59
        ) {
            return null;
        }

        return (hours * 60) + minutes;
    }

    /**
     * Determines whether the business is currently open.
     * @param {{isClosed: boolean, opensAt: string|null, closesAt: string|null}|null} schedule Schedule for current day.
     * @param {Date} now Current date/time.
     * @returns {boolean} True when open now.
     */
    function isCurrentlyOpen(schedule, now = new Date()) {
        if (!schedule || schedule.isClosed) return false;

        const opensAtMinutes = parseTimeToMinutes(schedule.opensAt);
        const closesAtMinutes = parseTimeToMinutes(schedule.closesAt);

        if (opensAtMinutes === null || closesAtMinutes === null) return false;

        const nowMinutes = (now.getHours() * 60) + now.getMinutes();

        if (opensAtMinutes === closesAtMinutes) return true;

        if (opensAtMinutes < closesAtMinutes) {
            return nowMinutes >= opensAtMinutes && nowMinutes < closesAtMinutes;
        }

        return nowMinutes >= opensAtMinutes || nowMinutes < closesAtMinutes;
    }

    window.businessDetailUtils = {
        formatDay,
        formatDealDate,
        formatTime12Hour,
        getTodaySchedule,
        parseTimeToMinutes,
        isCurrentlyOpen
    };
}());