const config = require('./config.json');
const fetch = require('node-fetch');
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const DateDiff = require('date-diff');
const express = require('express');
const app = express();

// Connection URL
const url = config.mongdb_url;
 
// Database Name
const dbName = 'notams';

let diskdata;
let notams;
let airport_icao;

app.get('/icao/:id',async function(req,res,next){
    let stats = fs.statSync(__dirname + '\\notam_icao.json',);
    let mtime = stats.mtime;
    let curdate = new Date();
    let datediff = new DateDiff(curdate,mtime);
    airport_icao = req.params.id;
    console.log(datediff.seconds() +' out of '+ (3600 * config.update_every_hours) );
    if(datediff.hours() >= config.update_every_hours){
        let result = await getNOTAMsFromICAO();
        res.send(result);
    }else{
        let result = await readDatabyAirport(airport_icao);
        res.send(result);
    }
});

app.listen(config.port, console.log.bind(console, 'Listening on port '+config.port));


async function getNOTAMsFromICAO(){
    let res = await fetch(config.iaco_endpoint, { method: "Get" });
    let json = await res.json();
    fs.writeFileSync(__dirname+'\\notam_icao.json',JSON.stringify(json));
    console.log('File saved!');
    notams = json;
    return await insertIntoMongDB();
}
    
async function insertIntoMongDB(){
    // Use connect method to connect to the server
    let client, db;
    try{
        client = await MongoClient.connect(url, { useUnifiedTopology: true });
        db = client.db(dbName);
        
        const collection = db.collection('storednotams');
        await collection.drop();
        await collection.insertMany(notams);
        await client.close();
        console.log('Insertion done!');
        return await readDatabyAirport(airport_icao);
    }catch(err){
        assert(null,err);
    }finally{
        //client.close();
    }
}

async function readDatabyAirport(icaoCode){
    let client, db;
    try {
        client = await MongoClient.connect(url, { useUnifiedTopology: true });
        db = client.db(dbName);
        let collection = db.collection('storednotams');

        let json_result = await collection.find({'location': icaoCode}).toArray();
        return json_result;
    } catch(err) {
        assert.equal(null, err);
    } finally {
        client.close();
    }
}

