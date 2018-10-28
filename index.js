const puppeteer = require('puppeteer');

(async () => {
  try {
    //const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});

    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: false,
        slowMo: 250 // slow down by 250ms
      });

    const page = await browser.newPage();
    await page.goto('http://www.icrimewatch.net/results.php?SubmitAllSearch=1&AgencyID=54473');

    // Agree to TOC
    await page.click('input#agree'); // Checkbox "agree"

    await Promise.all([
        page.waitForNavigation({waitUntil: 'networkidle0'}),
        page.click('input#continue')
      ]);
    
    console.log("TOC page completed.");

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

            console.log(name);
        }
        return (offendersData);
    });

    console.log(currentPageOffendersData);

    //await browser.close();
  } catch (e) {
      console.log(e);
  }

})();