
export const calculateCurrentChitMonth = (startDateString: string, totalMonths: number): number => {
    const startDate = new Date(startDateString);
    const currentDate = new Date();

    if (isNaN(startDate.getTime()) || currentDate < startDate) {
        return 1;
    }

    const yearDiff = currentDate.getFullYear() - startDate.getFullYear();
    const monthDiff = currentDate.getMonth() - startDate.getMonth();
    
    const monthsElapsed = yearDiff * 12 + monthDiff;
    const currentMonthNumber = monthsElapsed + 1;

    return Math.max(1, Math.min(currentMonthNumber, totalMonths));
};

export const calculateEndDate = (startDate: string, months: number): string => {
    const date = new Date(startDate);
    if(isNaN(date.getTime())) return "Invalid Date";
    date.setMonth(date.getMonth() + months);
    return date.toLocaleDateString('en-CA');
};
