/* Proof of Concept for Rankings v2.0
 * This just illustrates how counting of results could take place
 * under the model I describe in https://ipullrank.com/organic-search-rankings-v2
 * 
 */


var fs = require("fs");
 const puppeteer = require('puppeteer');
 const GSR = require('google-search-results-nodejs')
 console.log("\n *Rankings v2.0 proof of concept* \n");
 console.log(":::::::..    :::.   :::.    :::. :::  .   ::::::.    :::.  .,-:::::/ .::::::.     :::      .::..:::.             ");  
 console.log(";;;;``;;;;   ;;`;;  `;;;;,  `;;; ;;; .;;,.;;;`;;;;,  `;;;,;;-'````';;`    `     ';;,   ,;;;',;'``;.      ,;;,  ");   
 console.log("[[[,/[[['  ,[[ '[[,  [[[[[. '[[ [[[[[/'  [[[  [[[[[. '[[[[[   [[[[[[/'[==/[[[[,     \[[  .[[/  ''  ,[['   ,['  [n ");
    console.log("$$$$$$c   c$$$cc$$$c $$$ \"Y$c$$_$$$$,    $$$  $$$ \"Y$c$$\"$$c.    \"$$   '''    $      Y$c.$$\"   .c$$P'     $$    $$");
    console.log("888b \"88bo,888   888,888    Y88\"888\"88o, 888  888    Y88 `Y8bo,,,o88o 88b    dP       Y88P    d88 _,oo,d8bY8,  ,8\"");
    console.log("MMMM   \"W\" YMM   \"\"` MMM     YM MMM \"MMP\"MMM  MMM     YM   `'YMUP\"YMM  \"YMmMY\"         MP     MMMUP*\"^^YMP \"YmmP  ");

 var organicRanking = 0;
 var baseRanking = 0;
 var absoluteRanking = 0;
 var featureRanking = 0;
 var page = 1;
 var offset = 0;

// Get content from file
 var contents = fs.readFileSync("car-insurance-serp.json");
// var htmlSerp = fs.readFileSync("car-insurance-serp.html")

// Define to JSON type
 var serp = JSON.parse(contents);
 //console.log(serp);

 //results.offset = offset;
 console.log(results);

 var results = computeRankings(serp,"nerdwallet.com");
 var offset = getResultOffset(results.href,results.url);

 console.log(results);


 contents = fs.readFileSync("mortgage-serp.json");
 serp = JSON.parse(contents);

 results = computeRankings(serp,"nerdwallet.com");
 offset = getResultOffset(results.href,results.url);

results.offset =offset;
console.log(results);

//console.log(offset);

// cheating due to race condition
console.log("{");
console.log("  page:"+results.page);
console.log("  absoluteRanking:" + results.absoluteRanking);
console.log("  organicRanking:" + results.organicRanking);
console.log("  featureRanking:" + results.featureRanking);
console.log("  baseRanking:" + results.baseRanking);
console.log("  href: '" + results.href +"'");


//console.log(results);
//process.exit();

function computeRankings(serp,domain)
{

    // Count the ads
    if (typeof(serp.ads) == 'object')
    {
        for (i=0;i<serp.ads.length;i++)
        {
            if(serp.ads[i].block_position=='top')
            {
                absoluteRanking++; 
            }
        }
    }

    // count the map
    if (typeof(serp.local_map) == 'object')
    {
        absoluteRanking++;
        featureRanking++;
    }

    // count the places results
    if (typeof(serp.local_result) == 'object')
    {
        absoluteRanking += serp.local_result.places.length;
        featureRanking += serp.local_result.places.length;
    }

    // count the top stories
    if (typeof(serp.top_stories) == 'object')
    {
        absoluteRanking += serp.top_stories.length;
        featureRanking += serp.top_stories.length;
    }

    // count related questions
    if (typeof(serp.related_questions) == 'object')
    {
        absoluteRanking += serp.related_questions.length;
        featureRanking += serp.related_questions.length;
    }

    // count organic up until the result 
    if (typeof(serp.organic_results) == 'object')
    {
        for (i=0;i<serp.organic_results.length;i++)
        {
            console.log(serp.organic_results[i].link);
            //console.log(serp.organic_results[i].link.indexOf(domain));
            absoluteRanking++; 
            organicRanking++;
            featureRanking++;
            
            if (serp.organic_results[i].link.indexOf(domain) > 1)
            {
                
                return {
                    "page" : serp.serpapi_pagination.current,
                    "absoluteRanking" : absoluteRanking,
                    "organicRanking" : organicRanking,
                    "featureRanking" : featureRanking,
                    "baseRanking" : (featureRanking - organicRanking),
                    "href" : serp.organic_results[i].link,
                    "url" : serp.search_metadata.raw_html_file,
                    "offset": offset
                };
            }
        }
    }

    // next step would be to count bottom ads

    if (typeof(serp.ads) == 'object')
    {
        for (i=0;i<serp.ads.length;i++)
        {
            if(serp.ads[i].block_position=='bottom')
            {
                absoluteRanking++; 
            }
        }
    }

    // after this, go to the next page and keep going until you find the 

}
// this isn't finishing fast enough
function getResultOffset(href,url)
{
    (async () => {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(url);
       // await page.screenshot({path: 'serp.png'});

        const resultLink = await page.$('a[href="'+results.href+'"]');
        const rect = await page.evaluate((resultLink) => {
          const {top, left, bottom, right} = resultLink.getBoundingClientRect();
          return {top, left, bottom, right};
        }, resultLink);
        
        console.log("  offset:" +rect.top);
        console.log("}")
        return rect.top;

        await browser.close();
    })();
    

  }

// if you want to ping SERPApi in real time use this function
// this is unfinished
function realTimeSerp(keyword,domain,location="United States",language="en",country="us", googleVersion="google.com")
{
    // insert your API key here
    let client = new GSR.GoogleSearchResults("secret_api_key")

    var parameter = {
        q: keyword,
        location: location,
        hl: language,
        gl: country,
        google_domain: googleVersion,
    };
    
    var callback = function(data) {
      // manage the data from the callback
        console.log(data)
    }
    
    // Show result as JSON
    client.json(parameter, callback)
}
