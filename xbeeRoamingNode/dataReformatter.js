var fs = require('fs');

var data = JSON.parse(fs.readFileSync('data.txt'));

var file = fs.openSync('data.csv', 'w');
for (var i = 0; i < 110; i++)
    for (var j = 0; j < 5; j++) {
    	console.log(i +'\t' + j);
        fs.write(file, data.map(function(item) {
            return item.data[i][j];
        }).join(',').concat('\r\n'));
    }
