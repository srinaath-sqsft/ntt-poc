const playwright = require("playwright");
const userAgents = require('top-user-agents')
const uniqueRandomArray = require('unique-random-array')
const randomUserAgent = uniqueRandomArray(userAgents)
const { devices } = require('playwright');


function pickRandomProperty(obj) {
    var result;
    var count = 0;
    for (var prop in obj)
        if (Math.random() < 1/++count)
           result = prop;
    return result;
}


 function execute(){
try {

(async () => {

    var cookie = Math.floor(Math.random() * 2) + 1;
    var stringofcookies = cookie.toString();
    console.log(cookie)
    //const browser = await playwright.chromium.launch({headless: false})
    //const browser = await playwright.webkit.launch({ headless: true });
    const browser = await playwright.chromium.launch({
      headless: true,
      args: [
       '--disable-web-security',
    ],})
    var context = ''
    if (cookie == 1) {
      context = await browser.newContext({
          httpCredentials: { username: "elastic", password: "changeme"},
          userAgent: randomUserAgent(),
      });
    } else {
      context = await browser.newContext({
          httpCredentials: { username: "elastic", password: "changeme"},
          userAgent: randomUserAgent(),
      });
    }
    var ip = (Math.floor(Math.random() * 127) + parseInt(process.env.IPRANGE))+"."+(Math.floor(Math.random() * 255))+"."+(Math.floor(Math.random() * 255))+"."+(Math.floor(Math.random() * 255));
    const page = await context.newPage()
    console.log(ip)
    const load = await page.setExtraHTTPHeaders({
        "X-Real-IP": ip
    });


    const client = await page.context().newCDPSession(page)
    await client.send('Network.enable')
    await client.send('Network.emulateNetworkConditions', {
        offline: false,
        //Set to ~80Mb/s
        downloadThroughput: (1024* 1024) *10,
        //Set to ~80Mb/s
        uploadThroughput: (1024* 1024) *10,
        latency: parseInt(process.env.LATENCY)
    })


    console.log('Go to products')
    await page.goto('http://frontend-js:3000')
    await page.setViewportSize({ width: 1920, height: 1080 })
    page.mouse.click(1, 1, {clickCount: 20, delay: 20});
    await page.waitForTimeout(2000)

    var item = Math.floor(Math.random() * 9) + 1;
    console.log(item)
    await page.waitForSelector('#__next > div > main > div > div > div.jsx-2872966298.row > div:nth-child(' + item  + ') > div > div > div > div > a > button')
    await page.click('#__next > div > main > div > div > div.jsx-2872966298.row > div:nth-child(' + item  + ') > div > div > div > div > a > button')
    console.log('Added to Cart')
    await page.waitForTimeout(2000)

    await page.waitForSelector('#__next > main > div > div > div.jsx-1646397730.row > div.jsx-1646397730.col-12.col-lg-7 > form > div > button')
    await page.click('#__next > main > div > div > div.jsx-1646397730.row > div.jsx-1646397730.col-12.col-lg-7 > form > div > button')
    console.log('Navigated to Checkout')
    await page.waitForTimeout(2000)

    await page.waitForSelector('#__next > main > div > div > div:nth-child(6) > div > form > div:nth-child(4) > button')
    page.click('#__next > main > div > div > div:nth-child(6) > div > form > div:nth-child(4) > button')
    console.log('Order sent')
    // await page.waitForTimeout(2000)

    await page.waitForSelector('#__next > main > div > div > div > div > a')
    await page.click('#__next > main > div > div > div > div > a')
    await page.waitForTimeout(5000)

    await browser.close(); // Close the browser
    return greeting = await Promise.resolve("Hello");

})()

  } catch (error) {
    console.log('That did not go well.')
    throw error
  }

 }

execute()