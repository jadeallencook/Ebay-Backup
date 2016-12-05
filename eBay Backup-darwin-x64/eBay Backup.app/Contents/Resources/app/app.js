// npm modules
var ipc = require('ipc'),
    fetchUrl = require('fetch').fetchUrl,
    downloadImage = require('download-image'),
    writeFile = require('write'),
    del = require('del'),
    mkdirp = require('mkdirp');

// jquery cache
var $ = require('jquery'),
    $app = $('div#app'),
    $button = $('button#start'),
    $downloader = $('div#downloader'),
    $loadingContainer = $('div#loading-container'),
    $loadingText = $('loading-text'),
    $feed = $('div#feed'),
    $backup = $('div#backup');

// show stored items
function showBackup(json) {
    $app.hide();
    $backup.append('loading...')
    json = JSON.parse(json);
    var html = '<div class="item" id="new">Create New Backup<br /><br /><b>WARNING: </b>This will delete your last backup!</div>';
    $.each(json, function (x, val) {
        html += '<div class="item" id="' + x + '">';
        html += val.title;
        html += '</div>';
    });
    $backup.empty().append(html);
    // even listeners
    $('div#new').click(function () {
        del(['backup/*']).then(paths => {
            mkdirp('backup/images', function (err) {
                location.reload();
            });
        });
    });
    function display(selected) {
        var item = json[selected],
            $images = $('div#selected div#images'),
            $title = $('div#selected h1'),
            $price = $('div#selected span'),
            $list = $('div#selected ul'),
            $selected = $('div#selected');
        $selected.css({
            display: 'inline-block'
        });
        $images.empty();
        $.each(item.images, function (x, val) {
            $images.append('<img src="backup/images/' + val + '" />');
        });
        $title.empty().text(item.title);
        $price.empty().text('$' + item.price);
        $list.empty();
        $.each(item.attributes, function (x, val) {
            $list.append('<li><b>' + val[0] + '</b> ' + val[1] + '</li>');
        });
        $('div#close').click(function () {
            $selected.css({
                display: 'none'
            });
        });
    }
    $('div.item').click(function () {
        display(parseInt($(this).attr('id')));
    });
}

// displays backup if found
$.get('backup/data.json').done(function (json) {
    showBackup(json);
}).fail(function () { // gets backup if found
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
        },
        feed: function (object) {
            $feed.empty().prepend(JSON.stringify(object));
        }
    };

    // data functions
    var get = {
        images: function (image) {
            var id = image.substring(image.lastIndexOf('images/g/') + 9, image.lastIndexOf('/s-'));
            $feed.prepend('<b>Image:</b> ' + image + '<br />');
            downloadImage(image, 'backup/images/' + id + '.jpg');
        },
        backups: function (links) {
            $.each(links, function (x, val) {
                fetchUrl(val.link, function (error, meta, body) {
                    var object = {
                            title: '',
                            price: 0,
                            attributes: [],
                            images: []
                        }
                        // turn response into string
                    var response = body.toString();
                    var $response = $(response);
                    $feed.prepend('link: ' + val.link + '<br />');
                    // store item data
                    var title = $response.find('h1#itemTitle').text();
                    if ($response.find('span#mm-saleDscPrc').length > 0) var price = $response.find('span#mm-saleDscPrc').text();
                    else var price = $response.find('span#prcIsum').text();
                    // trim data
                    title = title.slice(16).replace(/\s+/g, " ").replace(/^\s|\s$/g, "");
                    price = price.slice(4);
                    // console out all data
                    $feed.prepend('title: ' + title + '<br />');
                    $feed.prepend('price ' + price + '<br />');
                    object.title = title;
                    object.price = parseFloat(price);
                    // get details 
                    $.each($response.find('td.attrLabels'), function (x, label) {
                        var value = $(label).next().text().trim().replace(/\s+/g, " ").replace(/^\s|\s$/g, "");
                        value.replace("See the seller's listing for full details. See all condition definitions- opens in a new window or tab ... Read moreabout the condition", '');
                        value.replace("See the seller’s listing for full details and description of any imperfections. See all condition definitions- opens in a new window or tab ... Read moreabout the condition", '');
                        label = $(label).text().trim();
                        $feed.prepend('<b>' + label + '</b> ' + value + '<br />');
                        object.attributes.push([label, value]);
                    });
                    // get image json 
                    var imageJSON = response.substring(response.lastIndexOf('imgArr') + 10, response.lastIndexOf('islarge') - 3);
                    imageJSON = $.parseJSON(imageJSON);
                    // download each image 
                    $.each(imageJSON, function (y, image) {
                        image = image.maxImageUrl;
                        var id = image.substring(image.lastIndexOf('images/g/') + 9, image.lastIndexOf('/s-'));
                        object.images.push(id + '.jpg');
                        get.images(image);
                    });
                    build.backups.push(object);
                    if ((x + 1) === links.length) {
                        build.feed(build.backups);
                        writeFile('backup/data.json', JSON.stringify(build.backups));
                        $.get('backup/data.json').done(function (data) {
                            showBackup(data);
                        });
                    }
                });
                if (x === links.length) console.log(true);
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
                    $feed.empty();
                    $app.append('<span class="reload-message">Press (Command + R) After Everything Is Complete To View Backup<span>')
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