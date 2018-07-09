var request = require('request')
var fs = require('fs');
var https = require("https")
var path = require("path")
var program = require("commander")
var ProgressBar = require('progress');

program
  .version('1.0.0')
  .option('--amount [limit]', 'Amount of pictures to download (Default is 10), Max 100, unless using personal dev key')
  .option('--folder [name]', 'Name of the folder you want to save the images to (Default is "images")')
  .option('--width [w]', 'Width of images (Default is 1200)')
  .option('--height [h]', 'Height of images (Default is 800)')
  .option('--featured [f]', 'Download featured images only')
  .option('--search [s]', 'Download images with a specific term')
  .option('--orientation [o]', 'Image orientation (landscape, portrait, and squarish)')
  .option('--devKey [k]', 'Developer Key to use for request. Amount parameter limited if not set')
  .parse(process.argv);

if(!program.amount){
    program.amount = 10
}

if(!program.folder){
    program.folder = "images"
}

if(!program.orientation){
    program.orientation = "landscape"
}

if (!program.devKey){
    program.devKey = "1ced621f3ac7bb7836fc9b6bfbcff5656dd43eb2b60f4636e5ef53142ea19f2d"
    if (program.amount > 100){
        program.amount = 100;
    }
}


console.log("\nWelcome to Bulksplash! (Powered by Unsplash.com)")

console.log("\nDownloading " + program.amount + " random images :)")


var bar = new ProgressBar(':bar', { total: parseInt(program.amount) });
var dupe = 0;

function download(url, dest, dirname) {
    var dir = './' + dirname;
    var requestPromise = new Promise ((resolve, reject) => {
        https.get(url, function(response) {
            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir)
            }
            if (fs.existsSync(dest)){
                dupe++;
                console.log(dupe)
            }
            var file = fs.createWriteStream(dest);
            response.pipe(file)
            bar.tick();
            resolve();
        }).on("error", function (e) {
            console.log("Error while downloading", url, e.code);
            reject(e);
        });
    });
    return requestPromise;

};
var downloadsRemaining = program.amount;
var url = `https://api.unsplash.com/photos/random?count=${downloadsRemaining <=30 ? downloadsRemaining : 30 }&orientation=${program.orientation}&client_id=${program.devKey}`;

if(program.width){
    var url = url + "&w=" + program.width;
}

if(program.height){
    var url = url + "&h=" + program.height;
}

if(program.search){
    var url = url + "&query=" + program.search;
}

console.log("\nDownloading images from:\n")
function getAndDownloadImgs (){
    request(url, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            var body = JSON.parse(body);
            var downloadPromises = [];
            
            for (i in body){
                if(program.width || program.height){
                    var img = body[i]["urls"].custom
                } else{
                    var img = body[i]["urls"].raw
                }
    
                console.log(body[i]["user"].name + " (" + body[i]["user"].links["html"] + ")")
                downloadPromises.push(download(img, path.join(__dirname, "/" + program.folder + "/image-" + body[i]['id'] + ".jpg"), program.folder))
            }
            Promise.all(downloadPromises).then(()=>{
                downloadsRemaining -= 30;
                if (downloadsRemaining > 0){
                    getAndDownloadImgs();
                }
            }).catch(err => console.log(err));
        } else {
            console.log("Got an error: ", error)
        }
    })
}
getAndDownloadImgs(); 
