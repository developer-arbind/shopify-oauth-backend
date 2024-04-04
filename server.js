import express from "express";
import http from "http";
import bodyParser from "body-parser";
import cors from "cors";
import OauthShopify from "./src/oauth.js";
import OpenAiSqlAgent from "./src/langchaingpt.js";
import Client from 'pg';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
// const {Client} = require("pg");
const serv = express();
const client = new Client.Client ({
    host: 'sgptdatabase-sgpt.a.aivencloud.com',
    user: 'avnadmin',
    password: 'AVNS_9Q5IYahR9Dto0U86ffK',
    port: 17870,
    database: "sgpt",
    ssl: {
        rejectUnauthorized: true,
        ca: `-----BEGIN CERTIFICATE-----
MIIEQTCCAqmgAwIBAgIUSrUEsB2PvBzRCu8iFViWApnWSZ8wDQYJKoZIhvcNAQEM
BQAwOjE4MDYGA1UEAwwvMzUwNDM5YzAtMGNiMC00ZDljLTgwYmEtMDkzNjNiN2Zl
ZDMzIFByb2plY3QgQ0EwHhcNMjQwMzI4MTIzNjM2WhcNMzQwMzI2MTIzNjM2WjA6
MTgwNgYDVQQDDC8zNTA0MzljMC0wY2IwLTRkOWMtODBiYS0wOTM2M2I3ZmVkMzMg
UHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCCAYoCggGBAL/ESOVt
58ZHBtCT3pvFl1SW12xVvT7b/B7gbE/9B0d7Sy0upQORq0qHTAwvx8A08K8T/Uu6
VkvpCxwweSr2erDmw2k7V007AvuDyvRTqUmkCdsbh00gXOPUzHioy1g8EHz/Jq4s
DF0+preZcmmW3eF3oBFPBRhDfQ6LYC4k3wUYHwA9kXSMcspDFwGBZVhjDXZ5hkYB
/8Lgv9QZKTPwf19mpaeJb5XPql3AoBGb/KsOm6HO7PT3N35RVMx2GQM0+uvsR7p/
/ol6PJDQ7GaB5vDYKsmdibvUpG1w1s1Y+uN4QZYE3SkpYGdkb1vsAuiOfxF0699V
fX7LEkd0xHLKPHch7jvvgR0U0EyCUP9GQmz0HnSl+EZx2drxeeQb25o1d3ZjfeDr
OcCsMItMtQxkZXpn+z0+8xkdAisEtnMsdPjfBHUcnu1eL/+Yo9Q9YdeuASN4AkfU
5o1IKnsmNThVLrozht42hJTEHoRGdNmTAp09QvxDxsjyI5FY/j1+V3Oc3wIDAQAB
oz8wPTAdBgNVHQ4EFgQUvc6OIJuX+MWc+ceEHPiWZ5T/NXUwDwYDVR0TBAgwBgEB
/wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQADggGBADX5BSVNcSXvClpX
34F/7fA9g2ZxqKkakkx5UKGpGAd2KD0Z8CqZs0TSs6MaMtSO0/1b/sH8+VILHDKo
o+wugTuvZd0HIsga9QvFi2miDRenfIv5mc/AE/dybq+SlbGJ6D+cLHA8Zkvy+tsa
4lpUbOpJ0Avl7OiydyehRFyRTJl0hdEsAHkgoDO9mXq6NlDjtDKB/8bP38fFZxDJ
A9YJZvIzQtb+QjW0kb+du3JN2cOoC28bsJfrJcn5ra8JtnVbs5vy/Asoh95YVUsj
aSYR80HiECJcyhqCPiOg0WTRpeTSPQI4V2Lz9wWBz0CHuVgwgvcoo2w5It2YQ67C
QloOsT+REU7GhYuK7z8C7+WvzIlkmJ49nkLb/OSRjl6AJsnokY1YI+SctZQpi6u+
OlLWTLzgOE+sjs2zCvJfybbXvFgGuOXeTEuVMh+gpVu3RaHrQBHEnOFG2daUs/tq
fOUN2i2MgotmuK6y746cznpZdUG/SQuWYwaFCv9pQo7iiDjm8A==
-----END CERTIFICATE-----`,
    },
  });



serv.use(express.json());
serv.use(bodyParser.json());
serv.use(cors());
let setconversational = false;
const id = "9823270005";
const SQLAGENT = new OpenAiSqlAgent(id);

const shopifyToken = new OauthShopify({
    sharedSecret: 'b539f48aceb8ee047f54c577000b0e2b',
    redirectUri: 'http://localhost:5173/',
    apiKey: '2202c8560d3acefe0dd96104d0132ceb'
  });



serv.get("/connect/:hostname",async (req, res) => {
    console.log("hostname: ", req.params.hostname);
    const url = shopifyToken.generateAuthUrl(req.params.hostname);
    res.send(url);
}); 

serv.post("/exchange-access-token", async (req, res) => {
    const {hmac, state, code, shop, timestamp} = req.body;
     const hostname = shop;
      
      shopifyToken
        .getAccessToken(hostname, code)
        .then((data) => {
            console.log(data);

            return res.status(200).json({
               message: "200 success",
                 data
            })
        })
            .catch((err) => res.status(401).json({
                error: "unauth"
            }));    
      
});

serv.get("/upload-vector-db", async (req, res) => {

    
     await SQLAGENT.createVectorEmbedding("local-memory", "hosted","sample", ".txt", "./test/");
    return res.status(200).json({
        code: 200,
        message: "success"
    })
});
serv.post("/ask-question2", async (req, res) => {
    const qoute = !setconversational ? await SQLAGENT.creatingVectorIndexedDocument(req.body.input,null, false) : await SQLAGENT.ConversationalRetrievalChain(req.body.input); 
});

serv.post("/ask-question", async (req, res) => {
    console.log("making QUERY........");
    
    const qoute = !setconversational ? await SQLAGENT.creatingVectorIndexedDocument(`Note: Always write tables or their property names within double quotation marks because, in my schema, all tables are enclosed within double quotation marks like TABLE -> "TABLE".

    1# Reviews table -> It is the reviews table. It has the following properties:
    
    "id": Unique key for each review.
    "idt": ID of the specific client.
    "paid": The amount the client paid to the freelancer.
    "profilePicture": Profile picture of the client.
    "review": Review written by the client.
    "username": User name of the client's account.
    "gigFrom": The ID of the gig from which the review is made.
    "freelancerId": ID of the freelancer who completed the work for the client.
    
    finish date is in the lawlit tables also the finish date property is: fdate, so try to find the client id first in the reviews table and
    then find in the lawlit by checking idt
    column "fdate" does not exist in Reviews table, so try it in Lawlite table
    Schema:
    CREATE TABLE "Reviews" ( 
        "id" TEXT NOT NULL,
        "idt" TEXT,
        "paid" INTEGER NOT NULL,
        "profilePicture" TEXT NOT NULL,
        "review" TEXT NOT NULL,
        "username" TEXT NOT NULL,
        "gigFrom" TEXT,
        "rating" INTEGER NOT NULL
        "etc" TEXT,
        "freelancerId" TEXT,
    
        CONSTRAINT "Reviews_pkey" PRIMARY KEY ("id")
    );
    
    2# Gig Table -> It is the table containing gigs offered by freelancers. It has the following properties:
    
    "id": Unique key for each gig.
    "completed": Number of projects completed for the gig.
    "from": ID of the freelancer who uploaded the gig.
    "idt": ID of the gig.
    "title": Name of the gig.
    "picture": Cover picture of the gig.
    "freelancerId": ID of the freelancer who created the gig.
    Schema:
    CREATE TABLE "Gig" (
        "id" TEXT NOT NULL,
        "etc" TEXT,
        "completed" INTEGER NOT NULL,
        "from" TEXT NOT NULL,
        "idt" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "picture" TEXT NOT NULL,
        "freelancerId" TEXT,
    
        CONSTRAINT "Gig_pkey" PRIMARY KEY ("id")
    );
    
    
    3# Portfolio table -> It is the portfolio table of freelancers. It has the following properties:
    
    "id": Unique key for each portfolio item.
    "src": Source link of the image.
    "description": Description of the image.
    "freelancerId": ID of the freelancer whose portfolio this is.
    Schema:
    CREATE TABLE "Portfolio" (
        "id" TEXT NOT NULL,
        "src" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "freelancerId" TEXT,
    
        CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
    );
    
    4# Lawlite table -> It is the client table of freelancers. It has the following properties:
    
    "id": Unique key for each client.
    "failed": Indicates whether the client denied payment to the freelancer.
    "fdate": Final date when the client paid the freelancer. date pattern here: ex: 2022/02/30 year/month/day
    "fromGig": Name of the gig.
    "idt": Client ID.
    "paid": Amount paid by the client.
    "tip": Tip given by the client to the freelancer.
    "username": Username of the client.
    Schema:
    
    CREATE TABLE "Lawlite" (
        "id" TEXT NOT NULL,
        "failed" BOOLEAN NOT NULL,
        "fdate" TEXT NOT NULL, //this means the finish date and date pattern here: ex: 2022/02/30 year/month/day
        "fromGig" TEXT NOT NULL,
        "freelancerId" TEXT,
        "idt" TEXT NOT NULL,
        "paid" INTEGER NOT NULL,
        "tip" INTEGER NOT NULL,
        "username" TEXT NOT NULL,
    
        CONSTRAINT "Lawlite_pkey" PRIMARY KEY ("id")
    );
    5# Freelancer table -> It is the table of freelancers. It has the following properties:
    
    if there is freelancerId, then see idt cause freelancerId means idt here
    
    
    "id": Unique identifier for each freelancer. note* if user gave id, then it means idt not id, there is no work for id
    "idt": Freelancer Account ID
    "bestseller": Indicates whether the freelancer is a bestseller.
    "description": Description of the freelancer.
    "earnings": Total earnings of the freelancer.
    "earningsWithTip": Earnings including tips.
    "freelancerName": Name of the freelancer.
    "gender": Gender of the freelancer.
    "password": Password of the freelancer.
    "ratings": Ratings of the freelancer.
    "responseTime": Response time of the freelancer.
    "runningAd": Indicates whether the freelancer is running an ad.
    "topRated": Indicates whether the freelancer is top-rated.
    "verified": Indicates whether the freelancer is verified.
    Schema:
    CREATE TABLE "Freelancer" (
        "id" TEXT NOT NULL,
        "bestseller" BOOLEAN NOT NULL,
        "description" TEXT NOT NULL,
        "earnings" INTEGER NOT NULL,
        "earningsWithTip" INTEGER NOT NULL,
        "freelancerName" TEXT NOT NULL,
        "gender" TEXT NOT NULL,
        "idt" TEXT NOT NULL,  //this means freelancerId
        "password" TEXT NOT NULL,
        "ratings" INTEGER NOT NULL,
        "responseTime" INTEGER NOT NULL,
        "runningAd" BOOLEAN NOT NULL,
        "topRated" BOOLEAN NOT NULL,
        "verified" BOOLEAN NOT NULL,
    
        CONSTRAINT "Freelancer_pkey" PRIMARY KEY ("id")
    );
    
    -- CreateIndex
    CREATE UNIQUE INDEX "Gig_etc_key" ON "Gig"("etc");
    
    -- AddForeignKey
    ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_etc_fkey" FOREIGN KEY ("etc") REFERENCES "Gig"("etc") ON DELETE SET NULL ON UPDATE CASCADE;
    
    -- AddForeignKey
    ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "Freelancer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    
    -- AddForeignKey
    ALTER TABLE "Gig" ADD CONSTRAINT "Gig_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "Freelancer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    
    -- AddForeignKey
    ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "Freelancer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    
    -- AddForeignKey
    ALTER TABLE "Lawlite" ADD CONSTRAINT "Lawlite_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "Freelancer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    Write a PostgreSQL SQL query to ` + req.body.input,null, false) : await SQLAGENT.ConversationalRetrievalChain(`Note: Always write tables or their property names within double quotation marks because, in my schema, all tables are enclosed within double quotation marks like TABLE -> "TABLE".

    1# Reviews table -> It is the reviews table. It has the following properties:
    
    "id": Unique key for each review.
    "idt": ID of the specific client.
    "paid": The amount the client paid to the freelancer.
    "profilePicture": Profile picture of the client.
    "review": Review written by the client.
    "username": User name of the client's account.
    "gigFrom": The ID of the gig from which the review is made.
    "freelancerId": ID of the freelancer who completed the work for the client.
    
    finish date is in the lawlit tables also the finish date property is: fdate, so try to find the client id first in the reviews table and
    then find in the lawlit by checking idt
    column "fdate" does not exist in Reviews table, so try it in Lawlite table
    Schema:
    CREATE TABLE "Reviews" ( 
        "id" TEXT NOT NULL,
        "idt" TEXT,
        "paid" INTEGER NOT NULL,
        "profilePicture" TEXT NOT NULL,
        "review" TEXT NOT NULL,
        "username" TEXT NOT NULL,
        "gigFrom" TEXT,
        "rating" INTEGER NOT NULL
        "etc" TEXT,
        "freelancerId" TEXT,
    
        CONSTRAINT "Reviews_pkey" PRIMARY KEY ("id")
    );
    
    2# Gig Table -> It is the table containing gigs offered by freelancers. It has the following properties:
    
    "id": Unique key for each gig.
    "completed": Number of projects completed for the gig.
    "from": ID of the freelancer who uploaded the gig.
    "idt": ID of the gig.
    "title": Name of the gig.
    "picture": Cover picture of the gig.
    "freelancerId": ID of the freelancer who created the gig.
    Schema:
    CREATE TABLE "Gig" (
        "id" TEXT NOT NULL,
        "etc" TEXT,
        "completed" INTEGER NOT NULL,
        "from" TEXT NOT NULL,
        "idt" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "picture" TEXT NOT NULL,
        "freelancerId" TEXT,
    
        CONSTRAINT "Gig_pkey" PRIMARY KEY ("id")
    );
    
    
    3# Portfolio table -> It is the portfolio table of freelancers. It has the following properties:
    
    "id": Unique key for each portfolio item.
    "src": Source link of the image.
    "description": Description of the image.
    "freelancerId": ID of the freelancer whose portfolio this is.
    Schema:
    CREATE TABLE "Portfolio" (
        "id" TEXT NOT NULL,
        "src" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "freelancerId" TEXT,
    
        CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
    );
    
    4# Lawlite table -> It is the client table of freelancers. It has the following properties:
    
    "id": Unique key for each client.
    "failed": Indicates whether the client denied payment to the freelancer.
    "fdate": Final date when the client paid the freelancer. date pattern here: ex: 2022/02/30 year/month/day
    "fromGig": Name of the gig.
    "idt": Client ID.
    "paid": Amount paid by the client.
    "tip": Tip given by the client to the freelancer.
    "username": Username of the client.
    Schema:
    
    CREATE TABLE "Lawlite" (
        "id" TEXT NOT NULL,
        "failed" BOOLEAN NOT NULL,
        "fdate" TEXT NOT NULL, //this means the finish date and date pattern here: ex: 2022/02/30 year/month/day
        "fromGig" TEXT NOT NULL,
        "freelancerId" TEXT,
        "idt" TEXT NOT NULL,
        "paid" INTEGER NOT NULL,
        "tip" INTEGER NOT NULL,
        "username" TEXT NOT NULL,
    
        CONSTRAINT "Lawlite_pkey" PRIMARY KEY ("id")
    );
    5# Freelancer table -> It is the table of freelancers. It has the following properties:
    
    if there is freelancerId, then see idt cause freelancerId means idt here
    
    
    "id": Unique identifier for each freelancer. note* if user gave id, then it means idt not id, there is no work for id
    "idt": Freelancer Account ID
    "bestseller": Indicates whether the freelancer is a bestseller.
    "description": Description of the freelancer.
    "earnings": Total earnings of the freelancer.
    "earningsWithTip": Earnings including tips.
    "freelancerName": Name of the freelancer.
    "gender": Gender of the freelancer.
    "password": Password of the freelancer.
    "ratings": Ratings of the freelancer.
    "responseTime": Response time of the freelancer.
    "runningAd": Indicates whether the freelancer is running an ad.
    "topRated": Indicates whether the freelancer is top-rated.
    "verified": Indicates whether the freelancer is verified.
    Schema:
    CREATE TABLE "Freelancer" (
        "id" TEXT NOT NULL,
        "bestseller" BOOLEAN NOT NULL,
        "description" TEXT NOT NULL,
        "earnings" INTEGER NOT NULL,
        "earningsWithTip" INTEGER NOT NULL,
        "freelancerName" TEXT NOT NULL,
        "gender" TEXT NOT NULL,
        "idt" TEXT NOT NULL,  //this means freelancerId
        "password" TEXT NOT NULL,
        "ratings" INTEGER NOT NULL,
        "responseTime" INTEGER NOT NULL,
        "runningAd" BOOLEAN NOT NULL,
        "topRated" BOOLEAN NOT NULL,
        "verified" BOOLEAN NOT NULL,
    
        CONSTRAINT "Freelancer_pkey" PRIMARY KEY ("id")
    );
    
    -- CreateIndex
    CREATE UNIQUE INDEX "Gig_etc_key" ON "Gig"("etc");
    
    -- AddForeignKey
    ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_etc_fkey" FOREIGN KEY ("etc") REFERENCES "Gig"("etc") ON DELETE SET NULL ON UPDATE CASCADE;
    
    -- AddForeignKey
    ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "Freelancer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    
    -- AddForeignKey
    ALTER TABLE "Gig" ADD CONSTRAINT "Gig_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "Freelancer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    
    -- AddForeignKey
    ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "Freelancer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    
    -- AddForeignKey
    ALTER TABLE "Lawlite" ADD CONSTRAINT "Lawlite_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "Freelancer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    Write a PostgreSQL SQL query to ` + req.body.input); 
    if(!setconversational)setconversational = true;
    let example = {
        Reviews: true,
        id: true,
        idt: true,
        paid: true,
        profilePicture: true,
        review: true,
        username: true,
        gigFrom:  true,
        etc: true,
        freelancerId: true,
        Gig: true,
        completed: true,
        from: true,
        title: true,
        picture: true,
        Gig_pkey: true,
        src: true,
        description: true,
        Portfolio_pkey: true,
        failed: true,
        fdate: true,
        fromGig: true,
        tip: true,
        Lawlite_pkey: true,
        earnings: true,
        earningsWithTip: true,
        freelancerName: true,
        gender: true,
        password: true,
        ratings: true,
        responseTime: true,
        runningAd: true,
        topRated: true,
        verified: true,
        Freelancer_pkey: true,
        Lawlite: true,
        Freelancer: true,
        Portfolio: true,
        Reviews_etc_fkey: true,
        Reviews_freelancerId_fkey: true,
        Gig_freelancerId_fkey: true,
        Portfolio_freelancerId_fkey: true,
        Lawlite_freelancerId_fkey: true,
        rating: true
    }
    let code = "";
    let three = 0;
    let pass = false;
    for(let i = 0; i < qoute.length; i++) {
        if(qoute[i] === "`"){
            if(pass) {
                break;
            }else {
                ;
                three++;
            }
        }

        if(pass) {
            code += qoute[i];
        }

        if(three >= 3) {
            pass = true;
        }
    }
    code = code.slice(3, code.length);
    function addQuotesToObjectKeys(query, obj) {
        for (let key in obj) {
            if (obj[key]) {
                const regex = new RegExp(`\\b${key}\\b`, 'g');
                const replacement = `"${key}"`;
                query = query.replace(regex, (match) => {
                    // Check if the word already has double quotes
                    if (match.startsWith('"') && match.endsWith('"')) {
                        return match; // If it already has quotes, return unchanged
                    } else {
                        return replacement; // If not, add quotes
                    }
                });
            }
        }
        return query;
    }
    
    
    let queryString = !code ? qoute : code;
    function removeEmptyStrings(str) {
        let pure = "";
        for(let k = 0; k < str.length; k++){
    
        if(str[k] !== '"'){
            pure += str[k];
        }
    }
        return pure;
    }
    queryString = removeEmptyStrings(queryString);
    let modifiedQueryString = addQuotesToObjectKeys(queryString, example);
    console.log(modifiedQueryString);

    runQuery(!modifiedQueryString ? qoute : modifiedQueryString); 
    return res.status(200).json( {
        code: 200,
        output: qoute
    })
});

serv.post("/iscorrect", async (req, res) => {
    const {iscorrect} = req.body;

    const breif = iscorrect === "false" ? await SQLAGENT.getBriefDef() : "nothing.";
    await SQLAGENT.storeOutputasRAG(iscorrect === "false" ? false : true, breif.def);
    
    return res.status(200).json({
        code: 200,
        message: breif
    })
});
let obj1 = [{
    idt: "121345",
    freelancerName: "Himanushu",
    ratings: 4.8,
    topRated: true,
    bestseller: false,
    runningAd: false,
    lawlite: [{
            idt: "client-id-001",
            username: "mintu",
            fromGig: "saas webapplication",
            paid: 150,
            tip: 100,
            freelancerId: "121345",
            failed: false,
            fdate: '2023/01/02'
        },
        {
            idt: "client-id-003",
            username: "rahul",
            fromGig: "pro UI/UX",
            paid: 250,
            tip: 80,
            freelancerId: "121345",
            failed: false,
            fdate: '2023/02/01'
        },
        {
            idt: "client-id-002",
            username: "anish",
            fromGig: "pro UI/UX",
            paid: 250,
            tip: 70,
            freelancerId: "121345",
            failed: false,
            fdate: '2023/04/02'
        },
              {
            idt: "client-id-00125",
            username: "chera",
            fromGig: "saas webapplication",
            paid: 150,
            tip: 1000,
            freelancerId: "121345",
            failed: false,
            fdate: '2023/09/22'
        },
        {
            idt: "client-id-3003",
            username: "raj",
            fromGig: "saas webapplication",
            paid: 150,
            tip: 801,
            freelancerId: "121345",
            failed: false,
            fdate: '2022/12/01'
        },
        {
            idt: "client-id-002",
            username: "aalok",
            fromGig: "pro UI/UX",
            paid: 250,
            tip: 700,
            freelancerId: "121345",
            failed: false,
            fdate: '2023/07/15'
        },
              {
            idt: "client-id-001111",
            username: "mintu",
            fromGig: "saas webapplication",
            paid: 150,
            tip: 210,
            freelancerId: "121345",
            failed: false,
            fdate: '2023/07/21'
        },
        {
            idt: "client-id-005413",
            username: "cleared",
            fromGig: "pro UI/UX",
            paid: 250,
            tip: 10,
            freelancerId: "121345",
            failed: false,
            fdate: '2021/02/01'
        },
        {
            idt: "client-id-00548412",
            username: "yuvraj",
            fromGig: "pro UI/UX",
            paid: 250,
            tip: 70,
            freelancerId: "121345",
            failed: false,
            fdate: '2021/04/02'
        },
              {
            idt: "client-id-00548412",
            username: "yuvraj",
            fromGig: "saas webapplication",
            paid: 150,
            tip: 70,
            freelancerId: "121345",
            failed: false,
            fdate: '2021/04/15'
        },
        {
            idt: "client-id-0087873",
            username: "pirate",
            fromGig: "pro UI/UX",
            paid: 250,
            tip: 80,
            freelancerId: "121345",
            failed: false,
            fdate: '2023/02/19'
        },
        {
            idt: "client-id-002214522",
            username: "yash raj",
            fromGig: "pro UI/UX",
            paid: 0,
            tip: 0,
            freelancerId: "121345",
            failed: true,
            fdate: '2022/07/16'
        },
              {
            idt: "client-id-07777701",
            username: "linda",
            fromGig: "saas webapplication",
            paid: 150,
            tip: 4,
            freelancerId: "121345",
            failed: false,
            fdate: '2023/08/01'
        },
        {
            idt: "client-id-0085545453",
            username: "perbin",
            fromGig: "pro UI/UX",
            paid: 250,
            tip: 8,
            freelancerId: "121345",
            failed: false,
            fdate: '2023/11/11'
        },
        {
            idt: "client-id-001221522",
            username: "hansu",
            fromGig: "pro UI/UX",
            paid: 250,
            tip: 144,
            freelancerId: "121345",
            failed: false,
            fdate: '2020/01/02'
        },
              {
            idt: "client-id-0545401",
            username: "hacker",
            fromGig: "saas webapplication",
            paid: 0,
            tip: 0,
            freelancerId: "121345",
            failed: true,
            fdate: '2023/06/02'
        },
        {
            idt: "client-id-0087874543",
            username: "ride",
            fromGig: "pro UI/UX",
            paid: 0,
            tip: 0,
            freelancerId: "121345",
            failed: true,
            fdate: '2023/06/08'
        },
        {
            idt: "client-id-008754542",
            username: "anshu",
            fromGig: "pro UI/UX",
            paid: 250,
            tip: 88,
            freelancerId: "121345",
            failed: false,
            fdate: '2020/04/12'
        },
              {
            idt: "client-id-854564000",
            username: "dhanush",
            fromGig: "saas webapplication",
            paid: 150,
            tip: 99,
            freelancerId: "121345",
            failed: false,
            fdate: '2020/01/01'
        },
        {
            idt: "client-id-9898999999",
            username: "rocky",
            fromGig: "pro UI/UX",
            paid: 250,
            tip: 1500,
            freelancerId: "121345",
            failed: false,
            fdate: '2021/09/14'
        },
        {
            idt: "client-id-8711015420",
            username: "tumsehi",
            fromGig: "pro UI/UX",
            paid: 250,
            tip: 0,
            freelancerId: "121345",
            failed: false,
            fdate: '2021/10/02'
        },
              {
            idt: "client-id-7777777777888877",
            username: "bah",
            fromGig: "saas webapplication",
            paid: 150,
            tip: 0,
            freelancerId: "121345",
            failed: false,
            fdate: '2023/09/21'
        },
        {
            idt: "client-id-878789898",
            username: "dhage",
            fromGig: "pro UI/UX",
            paid: 250,
            tip: 0,
            freelancerId: "121345",
            failed: false,
            fdate: '2023/11/18'
        },
        {
            idt: "client-id-002114444141",
            username: "satgranga",
            fromGig: "pro UI/UX",
            paid: 250,
            tip: 788,
            freelancerId: "121345",
            failed: false,
            fdate: '2023/04/04'
        },
              {
            idt: "client-id-8784840000081",
            username: "tujanena",
            fromGig: "saas webapplication",
            paid: 150,
            tip: 100,
            freelancerId: "121345",
            failed: false,
            fdate: '2023/01/02'
        },
        {
            idt: "client-id-842154500640001151",
            username: "kaise",
            fromGig: "pro UI/UX",
            paid: 250,
            tip: 0,
            freelancerId: "121345",
            failed: false,
            fdate: '2020/01/12'
        },
        {
            idt: "client-id-564545439952000225",
            username: "apne",
            fromGig: "pro UI/UX",
            paid: 250,
            tip: 0,
            freelancerId: "121345",
            failed: false,
            fdate: '2020/05/30'
        },
              {
            idt: "client-id-451210",
            username: "dintu",
            fromGig: "saas webapplication",
            paid: 150,
            tip: 12,
            freelancerId: "121345",
            failed: false,
            fdate: '2020/06/31'
        },
        {
            idt: "client-id-115545121",
            username: "rahul",
            fromGig: "pro UI/UX",
            paid: 250,
            tip: 80,
            freelancerId: "121345",
            failed: false,
            fdate: '2023/06/31'
        },
        {
            idt: "client-id-78984545454154",
            username: "gro",
            fromGig: "pro UI/UX",
            paid: 250,
            tip: 45,
            freelancerId: "121345",
            failed: false,
            fdate: '2023/06/12'
        },
              {
            idt: "client-id-654321021200000",
            username: "propprop",
            fromGig: "saas webapplication",
            paid: 150,
            tip: 0,
            freelancerId: "121345",
            failed: false,
            fdate: '2023/06/01'
        },
        {
            idt: "client-id-54511212054545520",
            username: "ankush",
            fromGig: "pro UI/UX",
            paid: 250,
            tip: 0,
            freelancerId: "121345",
            failed: false,
            fdate: '2021/06/12'
        },
        {
            idt: "client-id-99998545105454105",
            username: "cr7poro",
            fromGig: "pro UI/UX",
            paid: 250,
            tip: 777,
            freelancerId: "121345",
            failed: false,
            fdate: '2021/03/01'
        },
              {
            idt: "client-id-054542122000000547",
            username: "messipporpo",
            fromGig: "saas webapplication",
            paid: 150,
            tip: 888,
            freelancerId: "121345",
            failed: false,
            fdate: '2021/07/03'
        },
        {
            idt: "client-id-524121210545454420",
            username: "rahul",
            fromGig: "pro UI/UX",
            paid: 250,
            tip: 0,
            freelancerId: "121345",
            failed: false,
            fdate: '2023/01/18'
        },
        {
            idt: "client-id-454545454545454545784845421",
            username: "bahubali",
            fromGig: "pro UI/UX",
            paid: 250,
            tip: 9000,
            freelancerId: "121345",
            failed: false,
            fdate: '2023/12/30'
        },
    ],
    responseTime: 4, //in hours
    allReviews: [],
    gig: [{
            idt: "saas webapplication",
            title: "saas webapplication",
            picture: "src",
            from: "121345",
            reviews: [],
            completed: 0,
        },
        {
            idt: "pro UI/UX",
            title: "pro UI/UX",
            picture: "src",
            from: "121345",
            completed: 78,
            reviews: [
            ], 
            completed: 0
        }
    ],
    earnings: 550,
    earningsWithTip: 800,
    password: "something",
    gender: "male",
    verified: false,
    portfolio: [{
        src: "something"
    }, {
        src: "something"
    }],
    description: "demo3"
}, {
    idt: "234567",
    freelancerName: "Samantha",
    ratings: 4.5,
    topRated: true,
    bestseller: false,
    runningAd: false,
    lawlite: [{
            idt: "client-id-001",
            username: "mintu",
            fromGig: "Graphic Design",
            paid: 200,
            tip: 50,
            freelancerId: "234567",
            failed: false,
            fdate: '2023/05/10'
        },
        {
            idt: "client-id-003",
            username: "rahul",
            fromGig: "Web Development",
            paid: 350,
            tip: 100,
            freelancerId: "234567",
            failed: false,
            fdate: '2023/06/20'
        },
        {
            idt: "client-id-004",
            username: "anish",
            fromGig: "Graphic Design",
            paid: 200,
            tip: 20,
            freelancerId: "234567",
            failed: false,
            fdate: '2023/07/15'
        },
    ],
    responseTime: 6,
    allReviews: [],
    gig: [{
            idt: "Graphic Design",
            title: "Professional Graphic Design",
            picture: "src",
            from: "234567",
            reviews: [],
            completed: 0
        },
        {
            idt: "Web Development",
            title: "Custom Web Development",
            picture: "src",
            from: "234567",
            reviews: [],
            completed: 0
        }
    ],
    earnings: 550,
    earningsWithTip: 720,
    password: "something",
    gender: "female",
    verified: true,
    portfolio: [{
        src: "something"
    }, {
        src: "something"
    }],
    description: "Experienced freelancer in graphic design and web development."
},{
    idt: "345678",
    freelancerName: "Maximus",
    ratings: 4.2,
    topRated: false,
    bestseller: false,
    runningAd: true,
    lawlite: [{
            idt: "client-id-002",
            username: "anish",
            fromGig: "Digital Marketing",
            paid: 300,
            tip: 70,
            freelancerId: "345678",
            failed: false,
            fdate: '2023/07/02'
        },
        {
            idt: "client-id-005",
            username: "cleared",
            fromGig: "Content Writing",
            paid: 150,
            tip: 30,
            freelancerId: "345678",
            failed: false,
            fdate: '2023/08/10'
        }
    ],
    responseTime: 2,
    allReviews: [],
    gig: [{
            idt: "Digital Marketing",
            title: "Advanced Digital Marketing Services",
            picture: "src",
            from: "345678",
            reviews: [],
            completed: 0
        },
        {
            idt: "Content Writing",
            title: "Creative Content Writing",
            picture: "src",
            from: "345678",
            reviews: [],
            completed: 0
        }
    ],
    earnings: 450,
    earningsWithTip: 550,
    password: "something",
    gender: "male",
    verified: true,
    portfolio: [{
        src: "something"
    }, {
        src: "something"
    }],
    description: "Specialized in digital marketing strategies and creative content writing."
},{
    idt: "456789",
    freelancerName: "Lily",
    ratings: 4.7,
    topRated: true,
    bestseller: true,
    runningAd: false,
    lawlite: [{
            idt: "client-id-007",
            username: "lily_miller",
            fromGig: "Illustration",
            paid: 250,
            tip: 60,
            freelancerId: "456789",
            failed: false,
            fdate: '2023/09/18'
        },
        {
            idt: "client-id-008",
            username: "jacksonsmith",
            fromGig: "Logo Design",
            paid: 200,
            tip: 40,
            freelancerId: "456789",
            failed: false,
            fdate: '2023/10/25'
        }
    ],
    responseTime: 3,
    allReviews: [],
    gig: [{
            idt: "Illustration",
            title: "Custom Illustration Services",
            picture: "src",
            from: "456789",
            reviews: [],
            completed: 0
        },
        {
            idt: "Logo Design",
            title: "Professional Logo Design",
            picture: "src",
            from: "456789",
            reviews: [],
            completed: 0
        }
    ],
    earnings: 450,
    earningsWithTip: 600,
    password: "something",
    gender: "female",
    verified: true,
    portfolio: [{
        src: "something"
    }, {
        src: "something"
    }],
    description: "Expert in creating custom illustrations and professional logo designs."
},{
    idt: "567890",
    freelancerName: "Lucas",
    ratings: 4.6,
    topRated: false,
    bestseller: true,
    runningAd: true,
    lawlite: [{
            idt: "client-id-009",
            username: "lucas_brown",
            fromGig: "Video Editing",
            paid: 300,
            tip: 50,
            freelancerId: "567890",
            failed: false,
            fdate: '2023/11/14'
        },
        {
            idt: "client-id-010",
            username: "bella_thomas",
            fromGig: "Animation",
            paid: 350,
            tip: 80,
            freelancerId: "567890",
            failed: false,
            fdate: '2023/12/20'
        }
    ],
    responseTime: 5,
    allReviews: [],
    gig: [{
            idt: "Video Editing",
            title: "Professional Video Editing Services",
            picture: "src",
            from: "567890",
            reviews: [],
            completed: 0
        },
        {
            idt: "Animation",
            title: "Creative Animation Services",
            picture: "src",
            from: "567890",
            reviews: [],
            completed: 0
        }
    ],
    earnings: 650,
    earningsWithTip: 850,
    password: "something",
    gender: "male",
    verified: true,
    portfolio: [{
        src: "something"
    }, {
        src: "something"
    }],
    description: "Skilled in professional video editing and creative animation services."
},{
    idt: "678901",
    freelancerName: "Ava",
    ratings: 4.9,
    topRated: true,
    bestseller: true,
    runningAd: true,
    lawlite: [{
            idt: "client-id-011",
            username: "ava_jones",
            fromGig: "Photography",
            paid: 400,
            tip: 100,
            freelancerId: "678901",
            failed: false,
            fdate: '2024/01/10'
        },
        {
            idt: "client-id-012",
            username: "jackson_davis",
            fromGig: "Photo Editing",
            paid: 250,
            tip: 40,
            freelancerId: "678901",
            failed: false,
            fdate: '2024/02/15'
        }
    ],
    responseTime: 2,
    allReviews: [],
    gig: [{
            idt: "Photography",
            title: "Professional Photography Services",
            picture: "src",
            from: "678901",
            reviews: [],
            completed: 0
        },
        {
            idt: "Photo Editing",
            title: "Creative Photo Editing Services",
            picture: "src",
            from: "678901",
            reviews: [],
            completed: 0
        }
    ],
    earnings: 650,
    earningsWithTip: 790,
    password: "something",
    gender: "female",
    verified: true,
    portfolio: [{
        src: "something"
    }, {
        src: "something"
    }],
    description: "Specialized in professional photography and creative photo editing services."
}
];
 

function getRandomRating (tip) {
    if(tip > 100 && tip < 300) {
        return Math.floor(Math.random() * 4.5);
    }else if (tip > 300) {
        return  Math.floor(Math.random() * 5);
    }else {
        return Math.floor(Math.random() * 3);
    }
}


function addRandomReviews(freelancers) {
    freelancers.forEach(freelancer => {
        freelancer.lawlite.forEach(client => {
            freelancer.allReviews.push({
                idt: client.idt,
                username: client.username,
                profilePicture: "src", // Assuming this is a placeholder
                review: "Random review text", // Random review text
                rating: Math.floor(Math.random() * 5.0),
                fromGig: client.fromGig,
                paid: client.paid,
                freelancerId: client.freelancerId
            });
        });
    });

    return freelancers; 
}


obj1 = addRandomReviews(obj1);


for (let i = 0; i < obj1.length; i++) {
    for (let h = 0; h < obj1[i].gig.length; h++) {
        for (let k = 0; k < obj1[i].allReviews.length; k++) {
            if (obj1[i].gig[h].idt === obj1[i].allReviews[k].fromGig) {
                obj1[i].gig[h].reviews.push(obj1[i].allReviews[k]);
            }
        }
        obj1[i].gig[h].completed = obj1[i].gig[h].reviews.length;
    }
    for (let port = 0; port < obj1[i].portfolio.length; port++) {
        obj1[i].portfolio[port].description = "random"
    }
}


async function addToDataBase () {
    // await client.connect();
    try {


        
        // Iterate through each freelancer object
        for (let i = 0; i < obj1.length; i++) {
            // Create Freelancer record
            const freelancer = await prisma.freelancer.create({
                data: {
                    id: obj1[i].idt,
                   
                    bestseller: obj1[i].bestseller,
                    description: obj1[i].description,
                    earnings: obj1[i].earnings,
                    earningsWithTip: obj1[i].earningsWithTip,
                    freelancerName: obj1[i].freelancerName,
                    gender: obj1[i].gender,
                    idt: obj1[i].idt,
                    password: obj1[i].password,
                    ratings: obj1[i].ratings,
                    responseTime: obj1[i].responseTime,
                    runningAd: obj1[i].runningAd,
                    topRated: obj1[i].topRated,
                    verified: obj1[i].verified,
                    lawlite: {
                        create: obj1[i].lawlite.map(lawlite => ({
                            idt: lawlite.idt,
                            failed: lawlite.failed,
                            fdate: lawlite.fdate,
                            fromGig: lawlite.fromGig,
                            paid: lawlite.paid,
                            tip: lawlite.tip,
                            username: lawlite.username,
                            rating: lawlite.rating,
                            freelancerId: lawlite.freelancerId
                        })),
                    },
                    gig: {
                        create: obj1[i].gig.map(gig => ({
                            completed: gig.completed,
                            from: gig.from,
                            idt: gig.idt,
                            title: gig.title,
                            picture: gig.picture,
                            reviews: {
                                create: gig.reviews.map(review => ({
                                        id: review.id,
                                        idt: review.idt,
                                        paid: review.paid,
                                        profilePicture: review.profilePicture,
                                        review: review.review,
                                        username: review.username,
                                        gigFrom: review.fromGig,
                                        rating: review.rating,
                                        freelancerId: review.freelancerId
                                    })),
                            },
                        })),
                    },
                    allReviews: {
                        create: obj1[i].allReviews.map(review => ({
                            idt: review.idt,
                            paid: review.paid,
                            profilePicture: review.profilePicture,
                            review: review.review,
                            username: review.username,
                            gigFrom: review.fromGig,
                            rating: review.rating,
                            freelancerId: review.freelancerId
                        })),
                    },
                    portfolio: {
                        create: obj1[i].portfolio.map(portfolio => ({
                            src: portfolio.src,
                            description: portfolio.description,
                        })),
                    },
                },
            });
        }

        console.log("Data pushed to database successfully!");

        return true;
    } catch (error) {
        console.error("Error pushing data to database:", error);

        return false;
    } finally {
        await prisma.$disconnect();
    }
}; 

async function retriveDataBase () {
    // await client.connect();
    // const freelancer = await prisma.freelancer.findMany();

    // console.log("data: ", freelancer);
    try {
        // Retrieve all freelancers with their associated data
        const freelancers = await prisma.freelancer.findMany({
            include: {
                allReviews: true,
                lawlite: true,
                gig: {
                    include: {
                        reviews: true,
                    },
                },
                portfolio: true,
            },
        });

        // Log the retrieved data
        console.log("Retrieved data:", freelancers);

        return freelancers;
    } catch (error) {
        console.error("Error retrieving data from database:", error);
    } finally {
        await prisma.$disconnect();
    }
    // return freelancer;
};

serv.get("/add-data", async (req, res) => {
    try {
        const data = await addToDataBase();
        if(!data) throw new Error("something went wrong");
        return res.status(200).json({
            data: data
        })
    }catch (err) {
        return res.status(400).json({
            error: err.message
        })
    }
});

serv.get("/get-data", async (req, res) => {
    try {
        const data = await retriveDataBase();
        return res.status(200).json({
            data: data
        })
    }catch (err) {
        return res.status(400).json({
            error: err.message
        })
    }
});

let first = false;

function runQuery (query) {
    
!first ? (client.connect(), first = true) : null;

client.query(query, (err, res) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log('OUTPUT:', res);
//   client.end();
});
}




const listener = http.createServer(serv);
listener.listen(8080, () => console.log("server running of: 8080"));