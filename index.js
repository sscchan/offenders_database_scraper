const fs = require('fs');
const puppeteer = require('puppeteer');

const DEBUG_MODE = true;

async function main() {
  try {
    //const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});

    let broswer;

    if (DEBUG_MODE) {
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: false,
            slowMo: 250 // slow down by 250ms
          });
    } else {
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true,
            slowMo: 0
          });
    }

    let offendersDatabase = {};

    const page = await browser.newPage();
    await page.goto('http://www.icrimewatch.net/results.php?SubmitAllSearch=1&AgencyID=54473');

    // Agree to TOC
    await page.click('input#agree'); // Checkbox "agree"

    await Promise.all([
        page.waitForNavigation({waitUntil: 'networkidle0'}),
        page.click('input#continue')
      ]);
    
    console.log("TOC page completed.");

    let numberOfPagesScraped = 0;

    do {
        console.log("Scraping Offenders Page: " + numberOfPagesScraped);
        let currentPageOffendersData = await extractOffenderDataFromPage(page);

        // Add new data to database
        offendersDatabase = Object.assign(offendersDatabase, currentPageOffendersData);
        numberOfPagesScraped += 1;

    } while (await navigateToNextoffenderPage(page));

    console.log("Scraping Completed. " + numberOfPagesScraped + " Pages Scraped");

    // Save scraped data as file
    let serializedOffendersDatabase = JSON.stringify(offendersDatabase);
    fs.writeFileSync('./offenders_database.json', serializedOffendersDatabase);


    if (DEBUG_MODE) {
        await browser.close();
    }

  } catch (e) {
      console.log(e);
  }

};

async function navigateToNextoffenderPage(page) {
    // Click "next" button
    let nextButtonImageHandle =  await page.$('img[src="images/button_next.jpg"]');
    if (nextButtonImageHandle !== null) {
        let nextButtonHandle = await nextButtonImageHandle.getProperty('parentElement');

        await Promise.all([
            page.waitForNavigation({waitUntil: 'networkidle0'}),
            nextButtonHandle.click()
        ]);

        return true;
    }
    return false;
}

async function extractOffenderDataFromPage(page) {
    // Extract data
    let currentPageOffendersData = await page.evaluate(() => {

        id_regex = /(?<=OfndrID=).*?(?=&)/;
        offendersData = {}

        tableWithHeader = document.querySelector('body > table > tbody > tr:nth-child(3) > td > table:nth-child(4) > tbody > tr > td > table:nth-child(3) > tbody');
        table = [...tableWithHeader.children].splice(1);

        for (let i = 0 ; i < table.length; i++) {
            let entry = table[i];

            name = entry.querySelector('strong').innerHTML.trim();
            address = entry.children[5].innerText.trim();
            city = entry.children[6].innerText.trim();
            zip = entry.children[7].innerText.trim();
            alert = entry.children[3].innerText.trim();
            detailsURL = entry.children[9].querySelector('a').href;
            id = detailsURL.match(id_regex)[0];
            photoURL = entry.children[1].querySelector('img').src;
            
            offendersData[id] = {
                'id': id,
                'name': name,
                'address': address,
                'city': city,
                'zip': zip,
                'alert': alert,
                'detailsURL': detailsURL,
                'photoURL': photoURL
            };

            console.log(offendersData);
        }
        return (offendersData);
    });

    return currentPageOffendersData;
}


main();
