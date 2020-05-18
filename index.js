const fetch = require('node-fetch');
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const DateDiff = require('date-diff');
 
// Connection URL
const url = 'mongodb://localhost:27017';
 
// Database Name
const dbName = 'notams';

let diskdata = fs.readFileSync(__dirname + '\\notam_icao.json');
let notams = JSON.parse(diskdata);
var stats = fs.statSync(__dirname + '\\notam_icao.json');
var mtime = stats.mtime;
var curdate = new Date();
var datediff = new DateDiff(curdate,mtime);
console.log(datediff.hours());

if(datediff.hours() >= 8){
    insertIntoMongDB();
}

function getNOTAMsFromICAO(){
    let url = "https://www.reddit.com/r/popular.json";

    let settings = { method: "Get" };
    
    fetch(url, settings)
        .then(res => res.json())
        .then((json) => {
            fs.writeFileSync(__dirname+'test.json',json.to)
        });    
}
    
function insertIntoMongDB(){
    // Use connect method to connect to the server
    MongoClient.connect(url, { useUnifiedTopology: true }, function(err, client) {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        
        const db = client.db(dbName);
        
        const insertNotams = async function(notams){
            const collection = db.collection('storednotams');
            await collection.drop();
            await collection.insertMany(notams);
            await client.close();
            console.log('Done');
        }
        console.log(notams.length);
        insertNotams(notams);
            
    });
}

/*
let url = "https://www.reddit.com/r/popular.json";

let settings = { method: "Get" };

fetch(url, settings)
    .then(res => res.json())
    .then((json) => {
        console.log(json)
    });
*/
