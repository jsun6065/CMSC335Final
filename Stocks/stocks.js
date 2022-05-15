//const https = require("https");
//const http = require("http");
import fetch from 'node-fetch';
import * as http from "http";
import express from "express";
//let path = require("path");
const portNumber = process.env.PORT || 3000;

process.stdin.setEncoding("utf8");
//let express = require("express");
const app = express();
app.set("views", "./templates");
app.set("view engine", "ejs");
app.use(express.static("public"));

import bodyParser from "body-parser";
//let bodyParser = require("body-parser"); /* To handle post parameters */

app.use(bodyParser.urlencoded({ extended: false }));
import dotenv from "dotenv";
dotenv.config({ path: './environment/.env' })
const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;

/* Our database and collection */
const databaseAndCollection = { db: "CMSC335_DB", collection: "finalProject" };
import { MongoClient, ServerApiVersion } from 'mongodb';
//const { lookup } = require("dns");
const uri = `mongodb+srv://${userName}:${password}@cluster0.bt9y7.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


var data;
//stock lookup api
async function lookUpStock(stockName) {

    const url = `https://realstonks.p.rapidapi.com/${stockName}`;

    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Host': 'realstonks.p.rapidapi.com',
            'X-RapidAPI-Key': 'ec572b7985msh69dcf2f2d8e09a2p13a4f5jsn591fe240b6fa'
        }
    };

    fetch(url, options)
        .then(res => res.json())
        .then(json => addStock(stockName, json))
        .catch(err => console.error('error:' + err));
}
async function addStock(stockName, json) {
    json.name = stockName;
    //console.log(json);
    try {
        await client.connect();
        await insertStock(client, databaseAndCollection, json);
    } catch (e) {
        console.error(e)
    } finally {
        await client.close();
    }

}

async function insertStock(client, databaseAndCollection, stock) {
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(stock);

}
async function removeAll(client, databaseAndCollection) {
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).deleteMany({});
}
app.get("/", async (request, response) => {
    try {
        await client.connect();
        let filter = {};
        const cursor = client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .find(filter);

        const result = await cursor.toArray();
        // console.log(`Found: ${result.length} stocks`);
        // console.log(result);
        let table = "<table border='1'><tr><th>Stock</th><th>Price($)</th><th>Change Point</th><th>Change Percentage</th><th>Total Volume</th></tr>";
        result.forEach(ele => table += `<tr><td>${ele.name}</td><td>${ele.price}</td><td>${ele.change_point}</td><td>${ele.change_percentage}</td><td>${ele.total_vol}</td></tr>`);
        table += "</table>";
        let variables = {
            stocks: table
        }
        //await lookUpStock("RTX");
        response.render("stockDisplay", variables);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
});

app.post("/", async (request, response) => {
    try {
        await client.connect();
        let { stockName } = request.body;
        let action = request.body.action;
        if (action == "Submit") {
            await lookUpStock(stockName);
            let variables = {
                stock: stockName
            }
            // let variables = {
            //     name: stockName,
            // }
            response.render("confirmed", variables);
        } else {
            await removeAll(client, databaseAndCollection);
            response.render("removed");
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
});



console.log(`starting server at ${portNumber}`);
http.createServer(app).listen(portNumber);