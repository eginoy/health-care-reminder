require('dotenv').config();
const {GoogleSpreadsheet} = require('google-spreadsheet');
const axios = require('axios');
const utils = require('../src/utils');

const spreadSheet_ID = process.env.SPREADSHEET_ID;
const userMasterSheet_ID = process.env.USERMASTERSHEET_ID;
const formDataSheet_ID = process.env.FORMDATASHEET_ID;
const healthCareInputBaseURL = process.env.HEALTHCAREINPUT_BASEURL;
const webhookURL = process.env.WEBHOOK_URL;

main();

class User{
    constructor(id,name){
        this.id = id;
        this.name = name;
    }
}

async function main(){
    const holidays = await utils.getHolidays(utils.holidaysAPI);
    if(utils.isHoliday(new Date(),holidays)) return;

    const userMaster = await getUserMaster();
    const unCompletedUsers = await getUncompletedUsers(userMaster);
    const remindMessage = createReminderMessage(unCompletedUsers,healthCareInputBaseURL);
    remindHealthCare(webhookURL,remindMessage);
}

function createReminderMessage (unCompletedUsers,healthCareInputBaseURL){
    if(unCompletedUsers.length === 0) return '本日の健康管理入力は全員入力済みでした。';
    let baseMessage = '本日の健康管理入力のご案内です。下記のURLから、入力をお願いします。<br />';
    unCompletedUsers.forEach(unCompletedUser => baseMessage += generateReminderMessage(unCompletedUser,healthCareInputBaseURL));
    
    return baseMessage;
}

function generateReminderMessage(unCompletedUser,healthCareInputBaseURL){
    return `${unCompletedUser.name}さん: ${healthCareInputBaseURL+unCompletedUser.id} <br /><br />`;
}

async function getInitializedDoc(){
    const doc = new GoogleSpreadsheet(spreadSheet_ID);
    const credentials = require('../credentials.json');
    await doc.useServiceAccountAuth(credentials);
    await doc.loadInfo();

    return doc;
}

async function loadUserMasterFormData(){
    const doc = await getInitializedDoc();

    const userMasterSheet = await doc.sheetsById[userMasterSheet_ID];
    const userMasterRows = await userMasterSheet.getRows();

    return userMasterRows;
}

async function loadHealthCareFormData(){
    const doc = await getInitializedDoc();

    const formDataSheet = await doc.sheetsById[formDataSheet_ID];
    const formDataRows = await formDataSheet.getRows();

    return formDataRows;
}

async function getUserMaster(){
    const userMasterFormData = await loadUserMasterFormData();
    return userMasterFormData.map(formData => new User(formData['id'],formData['name']));
}

async function getUncompletedUsers(userMaster){
    const formData = await loadHealthCareFormData();
    const todayFormData = getTodayFormData(formData);
    const todayCompletedUserIds = extractUserIdsFromFormData(todayFormData);
    const userIds = extractUserIdsFromUserMaster(userMaster);
    let unCompletedUserIds = [];

    userIds.concat(todayCompletedUserIds).forEach(item => {
        if(userIds.includes(item) && !todayCompletedUserIds.includes(item)) unCompletedUserIds.push(item);
    })

    return unCompletedUserIds.map(unCompletedUserId => userMaster.find(user => user.id === unCompletedUserId));
}

function extractUserIdsFromUserMaster(userMaster){
    return userMaster.map(d => d.id);
}

function extractUserIdsFromFormData(formData){
    return formData.map(d => d["識別子"]);
}

function getTodayFormData(formData){
    let today = new Date(new Date(new Date().setDate(new Date().getDate())).toDateString());

    let todayFormData = formData.filter(d =>   {
        let timeStamp = new Date(d["タイムスタンプ"]);
        return timeStamp > today;
    });
    return todayFormData;
}

function remindHealthCare(webhookURL,remindMessage){
    const postData = {text: remindMessage};
    axios.post(webhookURL,postData);
}