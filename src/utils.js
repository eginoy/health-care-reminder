const fetch = require('node-fetch');
const moment = require('moment');
const holidaysAPI = 'https://holidays-jp.github.io/api/v1/date.json';

const getHolidays = async uri => {
    const res = await fetch(uri);
    const json = await res.json();
    return json;
};

const isHoliday = (date,holidays) => {
    const parsedDate = moment(date).format('YYYY-MM-DD').toString();
    return !!holidays[parsedDate];
}

module.exports = {
    holidaysAPI,
    getHolidays,
    isHoliday
}