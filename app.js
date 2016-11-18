// npm modules
var ipc = require('ipc'),
    fetchUrl = require('fetch').fetchUrl,
    downloadImage = require('download-image');

// jquery cache
var $ = require('jquery'),
    $app = $('div#app'),
    $button = $('button#start'),
    $downloader = $('div#downloader'),
    $loadingContainer = $('div#loading-container'),
    $loadingText = $('loading-text'),
    $feed = $('div#feed');

$(function () {
    // build object
    var build = {
        username: '',
        keyword: '',
        links: [],
        images: [],
        backups: [],
        url: function () {
            return 'http://www.ebay.com/sch/m.html?_ssn=' + build.username + '&_nkw=' + build.keyword
        },
        loading: function (title, url) {
            $downloader.empty();
        },
        listing: function (element) {
            // listing object
            var object = {
                link: $(element).attr('href'),
                title: $(element).text()
            }
            return object;
        }
    };

    // data functions
    var get = {
        images: function (image) {
            var id = image.substring(image.lastIndexOf('images/g/') + 9, image.lastIndexOf('/s-'));
            $feed.prepend('<b>Image:</b> ' + image + '<br />');
            // downloadImage(image, 'backup/' + id + '.jpg');
        },
        backups: function (links) {
            $.each(links, function (x, val) {
                fetchUrl(val.link, function (error, meta, body) {
                    // turn response into string
                    var response = body.toString();
                    var $response = $(response);
                    $feed.prepend('<b>Link:</b> ' + val.link + '<br /><br />');
                    // store item data
                    var title = $response.find('h1#itemTitle').text();
                    if ($response.find('span#mm-saleDscPrc').length > 0) var price = $response.find('span#mm-saleDscPrc').text();
                    else var price = $response.find('span#prcIsum').text();
                    // trim data
                    title = title.slice(16).replace(/\s+/g, " ").replace(/^\s|\s$/g, "");
                    price = price.slice(4);
                    // console out all data
                    $feed.prepend('<b>Title:</b> ' + title + '<br />');
                    $feed.prepend('<b>Price:</b> ' + price + '<br />');
                    // get details 
                    $.each($response.find('td.attrLabels'), function(x, label) {
                        var value = $(label).next().text().trim().replace(/\s+/g, " ").replace(/^\s|\s$/g, "");
                        value.replace("See the seller's listing for full details. See all condition definitions- opens in a new window or tab ... Read moreabout the condition", '');
                        value.replace("See the seller’s listing for full details and description of any imperfections. See all condition definitions- opens in a new window or tab ... Read moreabout the condition", '');
                        label = $(label).text().trim();
                        console.log(label + ' ' + value);
                        $feed.prepend('<b>' + label + '</b> ' + value + '<br />');
                    });
                    // get image json 
                    var imageJSON = response.substring(response.lastIndexOf('imgArr') + 10, response.lastIndexOf('islarge') - 3);
                    imageJSON = $.parseJSON(imageJSON);
                    // download each image 
                    $.each(imageJSON, function (y, image) {
                        image = image.maxImageUrl;
                        get.images(image);
                    });
                });
            });
        },
        links: function (url) {
            fetchUrl(url, function (error, meta, body) {
                $feed.prepend('<b>Scanning:</b> ' + url + '<br />');
                var $response = $(body.toString());
                $.each($response.find('a.vip'), function (i, val) {
                    build.links.push(build.listing(val));
                });
                var nextButton = $response.find('a.gspr.next');
                if (nextButton.length > 0) {
                    var nextLink = nextButton.attr('href');
                    get.links(nextLink);
                } else {
                    get.backups(build.links);
                }
            });
        },
        listings: function () {
            // connection to results page
            build.loading();
            get.links(build.url());
        }
    };
    $button.click(function () {
        build.username = $('input#username').val();
        build.keyword = $('input#keyword').val();
        get.listings();
    });
});