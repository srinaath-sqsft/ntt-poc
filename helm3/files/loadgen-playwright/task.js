const playwright = require("playwright");
const userAgents = require('top-user-agents')
const { devices } = require('playwright');


function pickRandomProperty(obj) {
    var result;
    var count = 0;
    for (var prop in obj)
        if (Math.random() < 1/++count)
           result = prop;
    console.log(result)
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
    var randomDevice = pickRandomProperty(devices)
    if (cookie == 1) {
      context = await browser.newContext({
          httpCredentials: { username: "elastic", password: "changeme"},
          userAgent: randomDevice.userAgent,
          ...devices[randomDevice]
      });
    } else {
      context = await browser.newContext({
          httpCredentials: { username: "elastic", password: "changeme"},
          userAgent: randomDevice.userAgent,
          ...devices[randomDevice]
      });
    }
    var ip = (Math.floor(Math.random() * 127) + parseInt(process.env.IPRANGE))+"."+(Math.floor(Math.random() * 255))+"."+(Math.floor(Math.random() * 255))+"."+(Math.floor(Math.random() * 255));
    const page = await context.newPage()
    await page.setViewportSize({ width: 1792, height: 978 })
    console.log(ip)
    // "24.200.0.1"
    const load = await page.setExtraHTTPHeaders({
        "X-Real-IP": ip
    });

    const connection = 1024 * 1000 * 100;

    const client = await page.context().newCDPSession(page)
    await client.send('Network.enable')
    await client.send('Network.emulateNetworkConditions', {
        offline: false,
        //Set to ~80Mb/s
        downloadThroughput: connection,
        //Set to ~80Mb/s
        uploadThroughput: connection,
        latency: parseInt(100)
    })
    var cookienum = 0
    var item = 0
    const waitforNav = page.waitForNavigation();

    console.log('using URL: ' + process.env.URL)
    console.log('using DOMAIN: ' + process.env.DOMAIN)

    for (let index = 1; index <= 5; index++) {


        console.log('Go to products')
        // setting header which allows us to filter later
        cookienum = Math.floor(Math.random() * 1000000) + 1;
        context.addCookies([ {name: 'local_user_id', value:'synthetic-new-york-' + cookienum, url: process.env.URL}])
        console.log('cookie: ' + cookienum)
        // wait until page is fully loaded, including all images

        await page.goto(process.env.DOMAIN);

        // click around a bit to generate click data for the rum agent. This is not required.
        console.log('clicking')

        page.mouse.click(1, 1, {clickCount: 10, delay: 10});
        console.log('waiting for nav')
        await waitforNav
        console.log('done waiting')
        // check that an item that we expect to be there exists on the loaded page
        // await page.waitForSelector('#__next > div > main > div > div > div.jsx-2872966298.row > div:nth-child(1) > div > div > div > div > a > button')

        item = Math.floor(Math.random() * 9) + 1;

        console.log(item)
        await page.waitForSelector('//*[@id="___gatsby"]/div/div[1]/main/div/div/div[6]/div/div[' + item + ']/a/div[1]/picture/img')
        console.log("click on item")
        await page.click('//*[@id="___gatsby"]/div/div[1]/main/div/div/div[6]/div/div[' + item + ']/a/div[1]/picture/img')
        console.log("wait 2s")
        console.log("wait for selector")
        await waitforNav
        await page.waitForSelector('//*[@id="___gatsby"]/div/div[1]/main/div/div[2]/div[2]/div[6]/button')


        console.log('two')
        await page.click('//*[@id="___gatsby"]/div/div[1]/main/div/div[2]/div[2]/div[6]/button')
        await waitforNav
        console.log('2.1')

        await page.waitForSelector('//*[@id="___gatsby"]/div/div[1]/main/div/div/div[3]/form/div[4]/div/button')
        await waitforNav
        console.log('three')

        await page.click('//*[@id="___gatsby"]/div/div[1]/main/div/div/div[3]/form/div[4]/div/button')
        await waitforNav
        console.log('final sleep')
        await page.waitForTimeout(2000)

    }
    await browser.close();
    return greeting = await Promise.resolve("Hello");

})()

  } catch (error) {
    console.log('That did not go well.')
    throw error
  }

 }

execute()
