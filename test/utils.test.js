const utils = require('../src/utils');

test('祝日を渡すとtrueを返す', async () => {
    const date = new Date('2021-09-20');
    const holidays = {
        '2021-09-20': '敬老の日'
    };
   expect(utils.isHoliday(date,holidays)).toBe(true);
});

test('祝日でない日付を渡すとfalseを返す', async () => {
    const date = new Date('2021-09-21');
    const holidays = {
        '2021-09-20': '敬老の日'
    };
   expect(utils.isHoliday(date,holidays)).toBe(false);
});