/* Proof of Concept for Rankings v2.0
 * This just illustrates how counting of results could take place
 * under the model I describe in https://ipullrank.com/organic-search-rankings-v2
 *
 */


const fs = require("fs");
const puppeteer = require('puppeteer');
const GSR = require('google-search-results-nodejs')
console.log("\n *Rankings v2.0 proof of concept* \n");

console.log(":::::::::::::. ...    ::: :::      :::    :::::::..    :::.   :::.    :::. :::  .   ::::::.    :::.  .,-:::::/   .::::::. ");
console.log(";;; `;;;```.;;;;;     ;;; ;;;      ;;;    ;;;;``;;;;   ;;`;;  `;;;;,  `;;; ;;; .;;,.;;;`;;;;,  `;;;,;;-'````'   ;;;`    ` ");
console.log("[[[  `]]nnn]]'[['     [[[ [[[      [[[     [[[,/[[['  ,[[ '[[,  [[[[[. '[[ [[[[[/'  [[[  [[[[[. '[[[[[   [[[[[[/'[==/[[[[,");
console.log("$$$   $$$\"\"   $$      $$$ $$'      $$'     $$$$$$c   c$$$cc$$$c $$$ \"Y$c$$_$$$$,    $$$  $$$ \"Y$c$$\"$$c.    \"$$   '''    $");
console.log("888   888o    88    .d888o88oo,.__o88oo,.__888b \"88bo,888   888,888    Y88\"888\"88o, 888  888    Y88 `Y8bo,,,o88o 88b    dP");
console.log("MMM   YMMMb    \"YmmMMMM\"\"\"\"\"\"YUMMM\"\"\"\"YUMMMMMMM   \"W\" YMM   \"\"` MMM     YM MMM \"MMP\"MMM  MMM     YM   `'YMUP\"YMM  \"YMmMY\"\n" );



async function main(){
  try{
    /****** car-insurance-serp ********/
    // Open the Car Insurance SERP
    var contents = fs.readFileSync("car-insurance-serp.json");

    // Parse the JSON
    var serp = JSON.parse(contents);

    var results = computeRankings(serp, "nerdwallet.com");
    // async - fetch offset of results
    offset = await getResultOffset(results.href, results.url);
    results.offset = offset
    console.log('results', results)


    /****** mortgage-serp ********/
    // Open the Mortgage SERP
    contents = fs.readFileSync("mortgage-serp.json");

    // Parse the JSON
    serp = JSON.parse(contents);

    var results = computeRankings(serp, "nerdwallet.com");
    offset = await getResultOffset(results.href, results.url);
    results.offset = offset
    console.log('results', results)

    /******  nyc-mortgage-rates-serp ********/
    // Open the NYC Mortgage Rates SERP
    contents = fs.readFileSync("nyc-mortgage-rates.json");

    // Parse the JSON
    serp = JSON.parse(contents);

    var results = computeRankings(serp, "nerdwallet.com");
    offset = await getResultOffset(results.href, results.url);
    results.offset = offset
    console.log('results', results)


    // exit program
    process.exit(0);
  }catch(e){
    console.log("ERROR", e)
  }
}

// run the program!
main();


// calculate rankings
function computeRankings(serp, domain) {
  var organicRanking = 0;
  var baseRanking = 0;
  var absoluteRanking = 0;
  var featureRanking = 0;
  var page = 1;
  var offset = 0;
  var featuredSnippets = 0;
  
  // Count the ads
  if (typeof(serp.ads) == 'object') {
    for (i = 0; i < serp.ads.length; i++) {
      if (serp.ads[i].block_position == 'top') {
        absoluteRanking++;
      }
    }
  }

  // count the featured snippet
  if (typeof(serp.answer_box) == 'object')
  {
    featureRanking++;
    featuredSnippets++;
  }

  // count the map
  if (typeof(serp.local_map) == 'object') {
    absoluteRanking++;
    featureRanking++;
  }

  // count the places results
  if (typeof(serp.local_result) == 'object') {
    absoluteRanking += serp.local_result.places.length;
    featureRanking += serp.local_result.places.length;
  }

  // count the top stories
  if (typeof(serp.top_stories) == 'object') {
    absoluteRanking += serp.top_stories.length;
    featureRanking += serp.top_stories.length;
  }

  // count related questions
  if (typeof(serp.related_questions) == 'object') {
    absoluteRanking += serp.related_questions.length;
    featureRanking += serp.related_questions.length;
  }

  // count organic up until the result
  if (typeof(serp.organic_results) == 'object') {
    console.log ("ORGANIC RANKINGS: \n");
    for (i = 0; i < serp.organic_results.length; i++) {
      console.log((i+1) + " - " + serp.organic_results[i].link);
      //console.log(serp.organic_results[i].link.indexOf(domain));
      absoluteRanking++;
      organicRanking++;
      featureRanking++;

      if (serp.organic_results[i].link.indexOf(domain) > 1) {
        return {
          "page": serp.serpapi_pagination.current,
          "absoluteRanking": absoluteRanking,
          "webRanking":(organicRanking + featuredSnippets),
          "legacyRanking": organicRanking,
          "featureRanking": featureRanking,
          "href": serp.organic_results[i].link,
          "url": serp.search_metadata.raw_html_file,
          "offset": offset
        };
      }
    }
  }

  // next step would be to count bottom ads if it goes deeper than the first page

  if (typeof(serp.ads) == 'object') {
    for (i = 0; i < serp.ads.length; i++) {
      if (serp.ads[i].block_position == 'bottom') {
        absoluteRanking++;
      }
    }
  }

  // after this, go to the next page and keep going until you find the ranking

}
// fetch resultsOffset async
async function getResultOffset(href, url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    const resultLink = await page.$('a[href="' + href + '"]');
    const rect = await page.evaluate((resultLink) => {
      const {
        top,
        left,
        bottom,
        right
      } = resultLink.getBoundingClientRect();
      return {
        top,
        left,
        bottom,
        right
      };
    }, resultLink);

    return rect.top;
    await browser.close();
}

// if you want to ping SERPApi in real time use this function
// this is unfinished
function realTimeSerp(keyword, domain, location = "United States", language = "en", country = "us", googleVersion = "google.com") {
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
